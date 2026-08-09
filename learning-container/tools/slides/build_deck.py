#!/usr/bin/env python3
"""Compile a deck model into .pptx and .pdf.

Runs *inside* the container built from this directory's Dockerfile — it shells out
to mmdc, pandoc and soffice. Use the `slides` wrapper rather than calling it on the
host.

Pipeline, single-emitter by design:

    model.yml
      -> mermaid sources        -> mmdc  -> assets/*.png
      -> pandoc-flavoured .md   -> pandoc -> .pptx   (editable, real speaker notes)
      -> sectionLst post-pass   -> .pptx            (collapsible PowerPoint sections)
      -> soffice --convert-to pdf                   -> .pdf

The .pdf is converted from the .pptx rather than rendered independently, so the two
formats cannot drift apart stylistically.

Usage:
    build_deck.py <deck.yml> [--out DIR] [--allow-draft] [--formats pptx,pdf]
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import uuid
import zipfile
from pathlib import Path

import deckmodel as dm

REPO = Path(__file__).resolve().parents[2]
# Stable namespace so a given unit name always yields the same section GUID.
SECTION_NS = uuid.UUID("6f9619ff-8b86-d011-b42d-00c04fc964ff")


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    proc = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if proc.returncode != 0:
        sys.stderr.write(f"\ncommand failed: {' '.join(cmd)}\n{proc.stdout}\n{proc.stderr}\n")
        raise SystemExit(1)
    return proc


def asset_name(url: str) -> str:
    """Deterministic local filename for a fetched image.

    fetch_assets.py computes the same name, so the model never has to be rewritten
    with a local path after fetching.
    """
    ext = Path(re.sub(r"[?#].*$", "", url)).suffix.lower()
    if ext not in (".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp"):
        ext = ".img"
    return hashlib.sha1(url.encode()).hexdigest()[:16] + ext


# ------------------------------------------------------------------ diagram build

def build_diagrams(deck: dict, build_dir: Path) -> dict[str, Path]:
    """Render every mermaid body to PNG. Returns slide id -> png path."""
    out: dict[str, Path] = {}
    src_dir = build_dir / "mermaid"
    src_dir.mkdir(parents=True, exist_ok=True)
    for unit, slide, index in dm.iter_slides(deck):
        body = slide.get("body") or {}
        if body.get("kind") != "diagram":
            continue
        sid = slide.get("id") or f"u{unit.get('unit')}-{index}"
        mmd = src_dir / f"{sid}.mmd"
        png = src_dir / f"{sid}.png"
        mmd.write_text(body["mermaid"], encoding="utf-8")
        # -s 3 renders at 3x for a crisp image when projected or shared over Teams.
        # The puppeteer config supplies --no-sandbox: chromium cannot use its own
        # sandbox inside the container, and mermaid-cli only reads it from this flag.
        cmd = ["mmdc", "-i", str(mmd), "-o", str(png), "-b", "white", "-s", "3"]
        puppeteer_cfg = os.environ.get("PUPPETEER_CONFIG", "/opt/slides/puppeteer.json")
        if Path(puppeteer_cfg).exists():
            cmd += ["-p", puppeteer_cfg]
        run(cmd)
        out[sid] = png
        print(f"  diagram {sid} -> {png.name}")
    return out


# --------------------------------------------------------------- markdown emitter

def md_escape(text: str) -> str:
    return str(text).replace("\\", "\\\\")


def emit_body(slide: dict, diagrams: dict[str, Path], assets_dir: Path) -> list[str]:
    body = slide.get("body") or {}
    kind = body.get("kind", "none")
    sid = slide.get("id")
    lines: list[str] = []

    if kind == "list":
        ordered = bool(body.get("ordered"))
        for n, item in enumerate(body.get("items") or [], start=1):
            lines.append(f"{n}. {md_escape(item)}" if ordered else f"- {md_escape(item)}")

    elif kind == "diagram":
        png = diagrams.get(sid)
        if png:
            caption = md_escape(body.get("caption") or "")
            lines.append(f"![{caption}]({png})")
        else:
            lines.append("*[diagram missing]*")

    elif kind == "image":
        alt = md_escape(body.get("alt") or "")
        if body.get("asset"):
            path = (REPO / body["asset"]) if not str(body["asset"]).startswith("/") else Path(body["asset"])
        else:
            path = assets_dir / asset_name(str(body["source_url"]))
        if not path.exists():
            raise SystemExit(
                f"error: slide {sid}: image not present at {path}.\n"
                f"       Run `slides fetch <deck>` first, or supply the file locally."
            )
        lines.append(f"![{alt}]({path})")
        if body.get("caption"):
            lines.append("")
            lines.append(f"*{md_escape(body['caption'])}*")

    elif kind == "code":
        lang = body.get("lang") or ""
        lines.append(f"```{lang}")
        lines.extend(str(body.get("text") or "").rstrip().splitlines())
        lines.append("```")
        if body.get("caption"):
            lines.append("")
            lines.append(f"*{md_escape(body['caption'])}*")

    elif kind in ("callout", "quote"):
        lines.append(f"> {md_escape(body.get('text') or '')}")

    elif kind == "placeholder":
        lines.append(f"> **DA FORNIRE:** {md_escape(body.get('needs') or '')}")

    links = slide.get("links") or []
    if links:
        lines.append("")
        for link in links:
            lines.append(f"- [{md_escape(link.get('label') or link.get('url'))}]({link.get('url')})")

    # Lane is operational information the room needs on screen during a lab, not
    # decoration — so it is emitted only where it changes what someone does.
    if slide.get("role") == "lab-brief" and slide.get("lane") in ("dev", "ops"):
        label = {"dev": "corsia SVILUPPO", "ops": "corsia OPS"}[slide["lane"]]
        lines.append("")
        lines.append(f"*{label}*")

    return lines


NOTE_LABELS = {
    "talk": "Da dire",
    "why_here": "Perché questa slide sta qui",
    "links": "Collegamenti",
    "watch_for": "Attenzione a",
}


def emit_notes(slide: dict) -> list[str]:
    notes = slide.get("notes") or {}
    lines = ["::: notes"]
    timing = notes.get("timing_min")
    if timing:
        lines.append(f"**Tempo:** ~{timing} min")
        lines.append("")
    for field, label in NOTE_LABELS.items():
        value = str(notes.get(field) or "").strip()
        if not value:
            continue
        lines.append(f"**{label}:** {value}")
        lines.append("")
    goals = slide.get("goals") or []
    if goals:
        lines.append(f"**Obiettivi:** {', '.join(str(g) for g in goals)}")
    lines.append(":::")
    return lines


def emit_markdown(deck: dict, diagrams: dict[str, Path], assets_dir: Path) -> tuple[str, list[dict]]:
    """Return (markdown, section map).

    The section map records how many slides each unit contributed, which the
    sectionLst post-pass needs to group slides without re-parsing the deck.
    """
    lines: list[str] = ["---"]
    lines.append(f"title: '{deck.get('title', '').replace(chr(39), chr(39) * 2)}'")
    if deck.get("subtitle"):
        lines.append(f"subtitle: '{deck['subtitle'].replace(chr(39), chr(39) * 2)}'")
    if deck.get("course"):
        lines.append(f"author: '{deck['course'].replace(chr(39), chr(39) * 2)}'")
    lines.append(f"lang: {deck.get('language', 'it')}")
    lines.append("---")
    lines.append("")

    sections: list[dict] = []
    for unit in deck["units"]:
        title = f"Unit {unit.get('unit')} — {unit.get('title', '')}"
        lines.append(f"# {md_escape(title)}")
        lines.append("")
        count = 0
        for index, slide in enumerate(unit.get("slides") or [], start=1):
            lines.append(f"## {md_escape(slide.get('headline', ''))}")
            lines.append("")
            lines.extend(emit_body(slide, diagrams, assets_dir))
            lines.append("")
            lines.extend(emit_notes(slide))
            lines.append("")
            count += 1
        # +1 for the section-header slide pandoc generates from the `#` heading.
        sections.append({"name": title, "slides": count + 1})

    credits = collect_credits(deck)
    if credits:
        lines.append("# Crediti e licenze")
        lines.append("")
        lines.append("## Le immagini di terze parti usate in questo corso sono elencate qui.")
        lines.append("")
        for entry in credits:
            lines.append(f"- {md_escape(entry)}")
        lines.append("")
        lines.append("::: notes")
        lines.append("**Da dire:** slide di servizio — non commentarla, serve per la conformità "
                     "sulle licenze delle immagini.")
        lines.append(":::")
        lines.append("")
        sections.append({"name": "Crediti e licenze", "slides": 2})

    return "\n".join(lines), sections


def collect_credits(deck: dict) -> list[str]:
    out: list[str] = []
    for _, slide, _ in dm.iter_slides(deck):
        body = slide.get("body") or {}
        if body.get("kind") != "image":
            continue
        src = body.get("source_url") or body.get("asset") or "?"
        out.append(f"{body.get('attribution', '?')} — {body.get('license', '?')} — {src}")
    return sorted(set(out))


# ------------------------------------------------------- PowerPoint section post-pass

SECTION_EXT_URI = "{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"
P14_NS = "http://schemas.microsoft.com/office/powerpoint/2010/main"


def inject_sections(pptx: Path, sections: list[dict]) -> None:
    """Add a real <p14:sectionLst> so units collapse as sections in the slide sorter.

    Pandoc's pptx writer emits a section-header *slide* per top-level heading but no
    section grouping (verified: no sectionLst in its output). PowerPoint's grouping
    lives in a 2010 extension on presentation.xml, so it is added here by rewriting
    that one part in place.
    """
    with zipfile.ZipFile(pptx) as zf:
        parts = {name: zf.read(name) for name in zf.namelist()}

    xml = parts["ppt/presentation.xml"].decode("utf-8")
    slide_ids = re.findall(r'<p:sldId\s+id="(\d+)"', xml)
    if not slide_ids:
        print("  ! no slide ids found in presentation.xml — skipping section injection")
        return
    if "sectionLst" in xml:
        return

    # Slide 1 is the title slide pandoc generates from metadata; it belongs to no unit.
    cursor = 1
    blocks: list[str] = []
    for section in sections:
        ids = slide_ids[cursor:cursor + section["slides"]]
        cursor += section["slides"]
        if not ids:
            continue
        guid = uuid.uuid5(SECTION_NS, section["name"])
        entries = "".join(f'<p14:sldId id="{i}"/>' for i in ids)
        name = (section["name"].replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))
        blocks.append(
            f'<p14:section name="{name}" id="{{{str(guid).upper()}}}">'
            f"<p14:sldIdLst>{entries}</p14:sldIdLst></p14:section>"
        )

    if cursor < len(slide_ids):
        # Any trailing slides (there should be none) still need a home, or PowerPoint
        # reports the file as needing repair.
        ids = slide_ids[cursor:]
        entries = "".join(f'<p14:sldId id="{i}"/>' for i in ids)
        guid = uuid.uuid5(SECTION_NS, "resto")
        blocks.append(
            f'<p14:section name="Altro" id="{{{str(guid).upper()}}}">'
            f"<p14:sldIdLst>{entries}</p14:sldIdLst></p14:section>"
        )

    ext = (
        f'<p:extLst><p:ext uri="{SECTION_EXT_URI}">'
        f'<p14:sectionLst xmlns:p14="{P14_NS}">{"".join(blocks)}</p14:sectionLst>'
        f"</p:ext></p:extLst>"
    )
    # extLst must be the last child of p:presentation.
    if "</p:presentation>" not in xml:
        print("  ! unexpected presentation.xml shape — skipping section injection")
        return
    xml = xml.replace("</p:presentation>", ext + "</p:presentation>")
    parts["ppt/presentation.xml"] = xml.encode("utf-8")

    tmp = pptx.with_suffix(".pptx.tmp")
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in parts.items():
            zf.writestr(name, data)
    tmp.replace(pptx)
    print(f"  injected {len(blocks)} PowerPoint section(s)")


# ---------------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("deck", type=Path)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--formats", default="pptx,pdf")
    ap.add_argument("--allow-draft", action="store_true",
                    help="render a deck whose status is still 'draft' (preview only)")
    args = ap.parse_args()

    deck = dm.load_deck(args.deck)
    formats = [f.strip() for f in args.formats.split(",") if f.strip()]

    if deck.get("status") != "approved" and not args.allow_draft:
        print(
            f"refusing to render: {args.deck} has status '{deck.get('status')}'.\n"
            "Only a human sets status: approved, after reviewing the model.\n"
            "Use --allow-draft for a review preview (output is marked DRAFT).",
            file=sys.stderr,
        )
        return 3

    out_dir = args.out or (args.deck.parent / "out")
    out_dir.mkdir(parents=True, exist_ok=True)
    build_dir = out_dir / "build" / args.deck.stem
    build_dir.mkdir(parents=True, exist_ok=True)
    assets_dir = args.deck.parent / "assets"

    if deck.get("status") != "approved":
        deck["title"] = f"[DRAFT] {deck.get('title', '')}"

    print(f"building {args.deck} (status: {deck.get('status')})")
    diagrams = build_diagrams(deck, build_dir)
    markdown, sections = emit_markdown(deck, diagrams, assets_dir)
    md_path = build_dir / f"{args.deck.stem}.md"
    md_path.write_text(markdown, encoding="utf-8")
    print(f"  markdown -> {md_path}")

    stem = args.deck.stem
    pptx = out_dir / f"{stem}.pptx"
    if "pptx" in formats or "pdf" in formats:
        cmd = ["pandoc", str(md_path), "-o", str(pptx), "--slide-level=2"]
        template = Path(__file__).resolve().parent / "reference.pptx"
        if template.exists():
            cmd += [f"--reference-doc={template}"]
        run(cmd)
        inject_sections(pptx, sections)
        print(f"  pptx -> {pptx}")

    if "pdf" in formats:
        run(["soffice", "--headless", "-env:UserInstallation=file:///tmp/lo",
             "--convert-to", "pdf", "--outdir", str(out_dir), str(pptx)])
        print(f"  pdf  -> {out_dir / (stem + '.pdf')}")

    credits = collect_credits(deck)
    if credits:
        credits_md = args.deck.parent / "assets" / "CREDITS.md"
        credits_md.parent.mkdir(parents=True, exist_ok=True)
        credits_md.write_text(
            "# Crediti immagini\n\n"
            "Generato da build_deck.py — non modificare a mano.\n\n"
            + "\n".join(f"- {c}" for c in credits) + "\n",
            encoding="utf-8",
        )
        print(f"  credits -> {credits_md}")

    if "pptx" not in formats:
        pptx.unlink(missing_ok=True)
    shutil.rmtree(build_dir / "mermaid", ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
