#!/usr/bin/env python3
"""Bidirectional coverage between the SSOT stores and the decks.

Two failure modes, opposite directions, both silent without a check:

  * an objective or a curriculum unit that no slide teaches — a gap;
  * a slide that traces to an objective or unit that does not exist — drift,
    usually a typo or a stale copy of the curriculum.

Goal ids are folded onto their base form, so the spiral passes the curriculum
declares (G5a, G5b) both count as coverage of G5, and the mnemonic form the
gatherer spec prefers (G1_DEPLOY) counts as G1.

Usage:
    coverage.py <deck.yml> [<deck.yml> ...]

Exit codes: 0 fully covered, 1 gaps or unknown references.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import deckmodel as dm

REPO = Path(__file__).resolve().parents[2]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("decks", nargs="+", type=Path)
    ap.add_argument("--goals", type=Path, default=REPO / "specifications" / "goals.md")
    ap.add_argument("--curriculum", type=Path, default=REPO / "design" / "curriculum.md")
    args = ap.parse_args()

    for path in (args.goals, args.curriculum):
        if not path.exists():
            dm.die(f"SSOT store not found: {path}")

    declared_goals = dm.goal_ids_from_store(args.goals)
    declared_units = dm.units_from_curriculum(args.curriculum)
    if not declared_goals:
        dm.die(f"parsed no objective ids from {args.goals} — has the store's format changed?")
    if not declared_units:
        dm.die(f"parsed no units from {args.curriculum} — has the store's format changed?")

    unit_index = {u["unit"]: u for u in declared_units}

    goal_hits: dict[str, list[str]] = {g: [] for g in declared_goals}
    unknown_goals: dict[str, list[str]] = {}
    covered_units: dict[str, int] = {}
    unknown_units: list[str] = []

    for deck_path in args.decks:
        try:
            deck = dm.load_deck(deck_path)
        except dm.DeckError as exc:
            dm.die(str(exc))

        for unit in deck["units"]:
            uid = str(unit.get("unit"))
            if uid not in unit_index:
                unknown_units.append(f"{deck_path.name}: unit '{uid}' is not in the curriculum")
            else:
                covered_units[uid] = covered_units.get(uid, 0) + len(unit.get("slides") or [])

        for unit, slide, index in dm.iter_slides(deck):
            where = f"{deck_path.name}/{dm.slide_label(unit, slide, index)}"
            for raw in slide.get("goals") or []:
                base = dm.normalise_goal(str(raw))
                if base in goal_hits:
                    goal_hits[base].append(where)
                else:
                    unknown_goals.setdefault(str(raw), []).append(where)

    print("=== Objective coverage (GOALS -> slides) ===")
    gaps = []
    for goal in declared_goals:
        hits = goal_hits[goal]
        mark = "✓" if hits else "✗"
        print(f"  {mark} {goal}: {len(hits)} slide(s)")
        if not hits:
            gaps.append(goal)

    print("\n=== Unit coverage (CURRICULUM -> slides) ===")
    for unit in declared_units:
        uid = unit["unit"]
        count = covered_units.get(uid, 0)
        mark = "✓" if count else "✗"
        print(f"  {mark} S{unit['session']} unit {uid} — {unit['title']}: {count} slide(s)")
        if not count:
            gaps.append(f"unit {uid}")

    problems = 0
    if unknown_goals:
        print("\n=== Unknown objective references (drift) ===")
        for raw, wheres in sorted(unknown_goals.items()):
            print(f"  ✗ '{raw}' is not declared in {args.goals.name} — {', '.join(wheres[:4])}")
            problems += 1
    if unknown_units:
        print("\n=== Unknown unit references (drift) ===")
        for line in unknown_units:
            print(f"  ✗ {line}")
            problems += 1

    if gaps:
        print(f"\n{len(gaps)} uncovered item(s): {', '.join(gaps)}")
        print("A gap is not automatically a defect — a deck for one session cannot cover "
              "another session's units. Run coverage over every deck together to judge it.")
    if not gaps and not problems:
        print("\n✓ every objective and unit is covered, no unknown references")

    return 1 if (gaps or problems) else 0


if __name__ == "__main__":
    sys.exit(main())
