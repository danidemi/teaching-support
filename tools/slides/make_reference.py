#!/usr/bin/env python3
"""Generate tools/slides/reference.pptx — the PowerPoint template pandoc renders into.

Why this exists: pandoc's built-in template gives the title placeholder 857250 EMU of
height at 33pt, which holds exactly two lines. Assertion-Evidence headlines are full
sentences and routinely need three, so with the stock template they overflow into the
body — verified by rendering. The fix is a template with a taller, smaller, left-aligned
title and a body shifted down to match.

It is a script rather than a checked-in binary so the geometry is reviewable and can be
re-derived when pandoc's default changes:

    tools/slides/slides shell
    python3 tools/slides/make_reference.py

Units are EMU (914400 per inch). Slide is 9144000 x 5143500 (16:9).
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "reference.pptx"

# --- geometry -----------------------------------------------------------------
# Title: same top and width as pandoc's, but tall enough for three lines at 24pt.
TITLE = {"x": 457200, "y": 205979, "cx": 8229600, "cy": 1250000}
# Body starts below the taller title and stops clear of the footer row (y=4767263).
BODY = {"x": 457200, "y": 1550000, "cx": 8229600, "cy": 3117263}

TITLE_PT = 2400   # 24pt: three lines of assertion fit; still legible shared over Teams
TITLE_ALIGN = "l"  # left, not centred — a claim reads as text, and Gestalt likes one edge


def patch_master(xml: str) -> str:
    """Resize the title/body placeholders and restyle the title in the slide master."""

    def resize(match: re.Match) -> str:
        sp = match.group(0)
        ph = re.search(r'<p:ph type="(\w+)"', sp)
        if not ph:
            return sp
        geom = {"title": TITLE, "body": BODY}.get(ph.group(1))
        if not geom:
            return sp
        sp = re.sub(r'<a:off x="-?\d+" y="-?\d+"/>',
                    f'<a:off x="{geom["x"]}" y="{geom["y"]}"/>', sp, count=1)
        sp = re.sub(r'<a:ext cx="\d+" cy="\d+"/>',
                    f'<a:ext cx="{geom["cx"]}" cy="{geom["cy"]}"/>', sp, count=1)
        return sp

    xml = re.sub(r"<p:sp>.*?</p:sp>", resize, xml, flags=re.S)

    # Title style: smaller and left-aligned. Scoped to <p:titleStyle> so the body is
    # untouched — both carry a <a:defRPr sz="..."> and a bare substitution would hit both.
    def restyle(match: re.Match) -> str:
        block = match.group(0)
        block = re.sub(r'<a:lvl1pPr algn="\w+"', f'<a:lvl1pPr algn="{TITLE_ALIGN}"', block, count=1)
        block = re.sub(r'<a:defRPr sz="\d+"', f'<a:defRPr sz="{TITLE_PT}"', block, count=1)
        return block

    xml, n = re.subn(r"<p:titleStyle>.*?</p:titleStyle>", restyle, xml, flags=re.S)
    if n != 1:
        sys.exit("error: could not locate <p:titleStyle> in the slide master")

    # Let PowerPoint shrink an over-long headline rather than clip it: last-resort
    # safety net under the linter's headline length warning.
    xml = xml.replace("<a:normAutofit/>", "")
    xml = re.sub(
        r'(<p:ph type="title"/>.*?<a:bodyPr[^>]*?)/>',
        r'\1><a:normAutofit fontScale="90000" lnSpcReduction="10000"/></a:bodyPr>',
        xml, count=1, flags=re.S,
    )
    return xml


def main() -> int:
    if not shutil.which("pandoc"):
        sys.exit("error: pandoc not found — run this inside the container "
                 "(`tools/slides/slides shell`)")

    default = HERE / ".pandoc-default-reference.pptx"
    with default.open("wb") as fh:
        subprocess.run(["pandoc", "--print-default-data-file", "reference.pptx"],
                       stdout=fh, check=True)

    with zipfile.ZipFile(default) as zf:
        parts = {name: zf.read(name) for name in zf.namelist()}

    master = "ppt/slideMasters/slideMaster1.xml"
    if master not in parts:
        sys.exit(f"error: {master} missing — pandoc's default template has changed shape")
    parts[master] = patch_master(parts[master].decode("utf-8")).encode("utf-8")

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in parts.items():
            zf.writestr(name, data)
    default.unlink()

    print(f"wrote {OUT}")
    print(f"  title {TITLE['cx']}x{TITLE['cy']} EMU at {TITLE_PT / 100:.0f}pt, "
          f"align={TITLE_ALIGN}")
    print(f"  body  {BODY['cx']}x{BODY['cy']} EMU at y={BODY['y']}")
    print("Rebuild the decks to pick it up: tools/slides/slides preview <deck>")
    return 0


if __name__ == "__main__":
    sys.exit(main())
