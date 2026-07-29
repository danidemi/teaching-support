#!/usr/bin/env python3
"""Lint a deck model against the mechanical rules in slide_rules.yml.

What this does and does not do is a deliberate line. It checks what a program can
check without pretending to judge: counts, presence of required fields, licence
metadata, Kolb-stage completeness, timing arithmetic, and a token-overlap KPI for
whether the teacher notes actually add anything to the slide.

It does NOT judge whether a headline is a genuine assertion, whether a diagram is
the right diagram, or whether an image is relevant. A regex cannot, and pretending
otherwise is worse than not checking — those stay the author's and the reviewer's job.

Usage:
    slidelint.py <deck.yml> [<deck.yml> ...] [--strict]

Exit codes: 0 clean or warnings only, 1 errors found, 2 model unusable.
`--strict` promotes warnings to errors (useful in a release gate, not day to day).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from urllib.parse import urlparse

import deckmodel as dm


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.info: list[str] = []

    def error(self, where: str, msg: str) -> None:
        self.errors.append(f"{where}: {msg}")

    def warn(self, where: str, msg: str) -> None:
        self.warnings.append(f"{where}: {msg}")

    def note(self, msg: str) -> None:
        self.info.append(msg)


def check_headline(rep: Report, where: str, slide: dict, rules: dict) -> None:
    cfg = rules["headline"]
    headline = (slide.get("headline") or "").strip()
    if not headline:
        rep.error(where, "no headline — every slide states its takeaway (Assertion-Evidence)")
        return
    words = dm.word_count(headline)
    if headline.rstrip(".!?").strip().lower() in {t.lower() for t in cfg["banned_titles"]}:
        rep.error(where, f"headline '{headline}' is a generic topic label, not an assertion")
        return
    if words < cfg["min_words"]:
        rep.warn(where, f"headline is {words} words — likely a topic label, not a claim")
    if words > cfg["max_words"]:
        rep.warn(where, f"headline is {words} words — too long to read at a glance")
    if cfg["require_terminal_punctuation"] and headline[-1] not in ".!?":
        rep.warn(where, "headline does not end in . ! ? — house style for assertions")


def check_body(rep: Report, where: str, slide: dict, rules: dict) -> None:
    body = slide.get("body") or {}
    kind = body.get("kind")
    if not kind:
        rep.error(where, "body has no 'kind'")
        return

    if kind == "list":
        cfg = rules["lists"]
        items = body.get("items") or []
        if not items:
            rep.error(where, "list body with no items")
        if cfg["require_justification"] and not (body.get("justification") or "").strip():
            rep.error(
                where,
                "list body without 'justification' — bullets are the licensed exception "
                "to Assertion-Evidence and must state why this content is intrinsically "
                "enumerable or ordered",
            )
        if len(items) > cfg["max_items"]:
            rep.warn(where, f"{len(items)} list items, budget is {cfg['max_items']}")
        for item in items:
            if isinstance(item, (list, dict)):
                if not cfg["allow_nesting"]:
                    rep.error(where, "nested list items are not allowed")
                continue
            text = str(item)
            n = dm.word_count(text)
            if n > cfg["max_words_per_item"]:
                rep.warn(where, f"list item is {n} words (max {cfg['max_words_per_item']}): '{text[:50]}…'")
            if cfg["ban_sentences"] and text.rstrip().endswith("."):
                rep.warn(where, f"list item ends in '.' — that is prose, not a list item: '{text[:50]}…'")

    elif kind == "diagram":
        if not (body.get("mermaid") or "").strip():
            rep.error(where, "diagram body with no 'mermaid' source")

    elif kind == "code":
        text = body.get("text") or ""
        if not text.strip():
            rep.error(where, "code body with no 'text'")
        lines = len(text.strip().splitlines())
        if lines > rules["slide"]["max_code_lines"]:
            rep.warn(where, f"{lines} lines of code — over {rules['slide']['max_code_lines']}, "
                            "move it to a handout and show only the interesting lines")

    elif kind == "image":
        cfg = rules["images"]
        for field in cfg["required_fields"]:
            if not str(body.get(field) or "").strip():
                rep.error(where, f"image without '{field}' — licence provenance is mandatory")
        url = body.get("source_url")
        asset = body.get("asset")
        if not url and not asset:
            rep.error(where, "image body needs 'source_url' (fetched) or 'asset' (local file)")
        if url:
            host = urlparse(str(url)).netloc.lower()
            if host not in cfg["allowed_hosts"]:
                rep.error(
                    where,
                    f"image host '{host}' is not in allowed_hosts — use an officially "
                    "licensed source, a local asset, or a placeholder",
                )
            if body.get("reviewed") is not True:
                rep.warn(where, "fetched image not yet marked reviewed:true — a human must "
                                "look at it; the authoring agent cannot see images")

    elif kind == "placeholder":
        for field in ("needs", "why"):
            if not str(body.get(field) or "").strip():
                rep.error(where, f"placeholder without '{field}'")
        rep.note(f"{where}: PLACEHOLDER — {body.get('needs')}")

    elif kind not in ("none", "callout", "quote"):
        rep.error(where, f"unknown body kind '{kind}'")

    total = dm.word_count(dm.slide_text(slide))
    if total > rules["slide"]["max_words_total"]:
        rep.warn(where, f"{total} words on the slide, budget is {rules['slide']['max_words_total']} "
                        "(Cognitive Load Theory: one idea, generous whitespace)")


def check_notes(rep: Report, where: str, slide: dict, rules: dict) -> None:
    cfg = rules["notes"]
    notes = slide.get("notes") or {}
    if not notes:
        rep.error(where, "no teacher notes")
        return
    for field in cfg["required_fields"]:
        value = notes.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            rep.error(where, f"teacher notes missing '{field}'")

    talk = str(notes.get("talk") or "")
    if talk.strip():
        n = dm.word_count(talk)
        if n < cfg["min_talk_words"]:
            rep.warn(where, f"notes.talk is {n} words — too thin to guide an instructor")

    # The KPI the notes exist for: do they add anything the slide doesn't already say?
    note_blob = " ".join(str(notes.get(f) or "") for f in ("talk", "why_here", "links", "watch_for"))
    if len(dm.tokens(note_blob)) >= cfg["novelty_min_tokens"]:
        score = dm.novelty(note_blob, dm.slide_text(slide))
        if score is not None and score < cfg["min_novelty"]:
            rep.warn(
                where,
                f"notes novelty {score:.0%} < {cfg['min_novelty']:.0%} — the notes largely "
                "restate the slide; they should explain why it is here, not read it aloud",
            )


def check_unit(rep: Report, deck: dict, unit: dict, rules: dict) -> None:
    where = f"unit {unit.get('unit', '?')}"
    slides = unit.get("slides") or []
    if not slides:
        rep.error(where, "unit has no slides")
        return

    roles = [s.get("role") for s in slides]
    for slide in slides:
        role = slide.get("role")
        if role in rules["roles"]["generated"]:
            rep.error(
                f"{where}/{slide.get('id', '?')}",
                f"role '{role}' is generated by build_deck.py and must not be authored",
            )
        elif role not in rules["roles"]["authorable"]:
            rep.error(f"{where}/{slide.get('id', '?')}", f"unknown role '{role}'")

    if not unit.get("kolb_exempt"):
        missing = [r for r in rules["kolb"]["required_roles"] if r not in roles]
        if missing:
            rep.warn(
                where,
                f"incomplete experiential cycle — no slide with role {missing}. "
                "Reflection is the stage most often skipped and the one that turns "
                "activity into learning (design/curriculum.md). Set kolb_exempt: true "
                "with a reason if this unit is genuinely not hands-on.",
            )

    if rules["lanes"]["require_both_lanes_per_unit"] and not unit.get("kolb_exempt"):
        lab_lanes = {s.get("lane", "both") for s in slides if s.get("role") == "lab-brief"}
        if lab_lanes and not (lab_lanes & {"both", "ops"}):
            rep.warn(where, "no lab-brief addresses the ops lane — curriculum §4 requires both "
                            "the dev pair and the ops pair to have a stated hands-on role")
        if lab_lanes and not (lab_lanes & {"both", "dev"}):
            rep.warn(where, "no lab-brief addresses the dev lane — see curriculum §4")

    for slide in slides:
        lane = slide.get("lane", "both")
        if lane not in rules["lanes"]["valid"]:
            rep.error(f"{where}/{slide.get('id', '?')}", f"invalid lane '{lane}'")

    declared = unit.get("minutes")
    planned = sum(int((s.get("notes") or {}).get("timing_min") or 0) for s in slides)
    if declared:
        share = rules["timing"]["max_share_of_unit"]
        if planned > declared:
            rep.warn(where, f"slide timings sum to {planned} min but the unit only has "
                            f"{declared} min — the slides alone over-run the unit")
        elif not unit.get("kolb_exempt") and planned > declared * share:
            rep.warn(where, f"{planned} min of slides in a {declared} min hands-on unit "
                            f"({planned / declared:.0%}) — above {share:.0%}, the lab and the "
                            "debrief are being crowded out by presentation time")


def check_deck(deck: dict, rules: dict) -> Report:
    rep = Report()
    path = deck["_path"]

    if deck.get("status") not in ("draft", "approved"):
        rep.error(path, "status must be 'draft' or 'approved'")

    ids: dict[str, str] = {}
    slide_count = 0
    for unit, slide, index in dm.iter_slides(deck):
        where = f"{Path(path).name}/{dm.slide_label(unit, slide, index)}"
        slide_count += 1
        sid = slide.get("id")
        if not sid:
            rep.error(where, "slide has no id")
        elif sid in ids:
            rep.error(where, f"duplicate slide id '{sid}' (also {ids[sid]})")
        else:
            ids[sid] = where

        if not slide.get("goals"):
            rep.error(where, "no 'goals' — every slide must trace to an objective in "
                             "specifications/goals.md")
        check_headline(rep, where, slide, rules)
        check_body(rep, where, slide, rules)
        check_notes(rep, where, slide, rules)

    for unit in deck["units"]:
        check_unit(rep, deck, unit, rules)

    budget = deck.get("budget") or {}
    lo, hi = (budget.get("slide_budget") or [None, None])[:2] or (None, None)
    if hi and slide_count > hi:
        rep.warn(path, f"{slide_count} slides vs budget {lo}–{hi}. This course is "
                       "hands-on (Kolb: task before explanation) — a large deck fights "
                       "the pedagogy. Consider moving detail to a lab handout.")
    if lo and slide_count < lo:
        rep.warn(path, f"only {slide_count} slides vs budget {lo}–{hi}")

    session_minutes = budget.get("session_minutes")
    if session_minutes:
        planned = sum(
            int((s.get("notes") or {}).get("timing_min") or 0)
            for _, s, _ in dm.iter_slides(deck)
        )
        tol = rules["timing"]["session_tolerance_pct"] / 100
        if planned > session_minutes * (1 + tol):
            rep.warn(path, f"slide timings sum to {planned} min against a "
                           f"{session_minutes} min session")
        rep.note(f"{Path(path).name}: {slide_count} slides, {planned} min of slide time "
                 f"in a {session_minutes} min session")
    return rep


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("decks", nargs="+", type=Path)
    ap.add_argument("--rules", type=Path, default=None)
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = ap.parse_args()

    rules = dm.load_rules(args.rules)
    total_errors = total_warnings = 0

    for deck_path in args.decks:
        try:
            deck = dm.load_deck(deck_path)
        except dm.DeckError as exc:
            print(f"✗ {exc}", file=sys.stderr)
            return 2
        rep = check_deck(deck, rules)
        print(f"\n=== {deck_path} ===")
        for line in rep.info:
            print(f"  · {line}")
        for line in rep.warnings:
            print(f"  ⚠ {line}")
        for line in rep.errors:
            print(f"  ✗ {line}")
        if not rep.errors and not rep.warnings:
            print("  ✓ clean")
        total_errors += len(rep.errors)
        total_warnings += len(rep.warnings)

    print(f"\n{total_errors} error(s), {total_warnings} warning(s)")
    if total_errors:
        return 1
    if total_warnings and args.strict:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
