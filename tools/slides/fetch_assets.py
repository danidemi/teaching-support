#!/usr/bin/env python3
"""Download the third-party images a deck references, once, at approval time.

Kept separate from build_deck.py deliberately: this is the only step that touches
the network, and a render must not silently depend on a remote host still being up
months later. After fetching, every image is a local file under `assets/` and the
build is reproducible offline.

Enforced here rather than trusted:
  * the host must be on the allowlist in slide_rules.yml;
  * licence and attribution must be recorded in the model before the file is kept.

Usage:
    fetch_assets.py <deck.yml> [--force]

Exit codes: 0 all present, 1 something could not be fetched or is unlicensed.
"""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

import deckmodel as dm
from build_deck import asset_name

UA = "piattaforma-corsi-slide-pipeline/1 (course material; contact repo owner)"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("deck", type=Path)
    ap.add_argument("--force", action="store_true", help="re-download files already present")
    args = ap.parse_args()

    rules = dm.load_rules()
    allowed = {h.lower() for h in rules["images"]["allowed_hosts"]}
    required = rules["images"]["required_fields"]

    try:
        deck = dm.load_deck(args.deck)
    except dm.DeckError as exc:
        dm.die(str(exc))

    assets_dir = args.deck.parent / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    failures = 0
    fetched = kept = 0
    unreviewed: list[str] = []

    for unit, slide, index in dm.iter_slides(deck):
        body = slide.get("body") or {}
        if body.get("kind") != "image" or not body.get("source_url"):
            continue
        where = dm.slide_label(unit, slide, index)
        url = str(body["source_url"])
        host = urlparse(url).netloc.lower()

        missing = [f for f in required if not str(body.get(f) or "").strip()]
        if missing:
            print(f"✗ {where}: refusing to fetch — missing {missing} in the model")
            failures += 1
            continue
        if host not in allowed:
            print(f"✗ {where}: host '{host}' not in allowed_hosts (slide_rules.yml)")
            failures += 1
            continue

        target = assets_dir / asset_name(url)
        if target.exists() and not args.force:
            kept += 1
        else:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = resp.read()
            except (urllib.error.URLError, OSError, TimeoutError) as exc:
                print(f"✗ {where}: download failed ({exc}) — {url}")
                failures += 1
                continue
            if not data:
                print(f"✗ {where}: empty response from {url}")
                failures += 1
                continue
            target.write_bytes(data)
            fetched += 1
            print(f"✓ {where}: {len(data) // 1024} KB -> assets/{target.name}")

        if body.get("reviewed") is not True:
            unreviewed.append(f"{where} -> assets/{target.name} ({url})")

    print(f"\n{fetched} downloaded, {kept} already present, {failures} failure(s)")

    if unreviewed:
        print("\n⚠ NOT YET SEEN BY A HUMAN — the authoring agent cannot look at images.")
        print("  Open each file, confirm it shows what the slide claims, then set")
        print("  reviewed: true on that slide in the model:")
        for line in unreviewed:
            print(f"    - {line}")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
