# Slide renderer

Turns a deck model (`material/slides/session-NN.yml`, shape defined in
`learning-plugin/reference/deck_model_spec.md`) into a `.pptx`, and optionally a `.pdf`.

This is a deliberately lightweight renderer: pure Python (`python-pptx` + `PyYAML`), no Docker, no
pandoc, no mermaid-cli. That trade-off has two concrete consequences — read `render_deck.py`'s
module docstring for the details:

- A `diagram` slide shows its Mermaid *source*, not a rendered graphic.
- A `source_url` image is never downloaded; only a local `asset` file is embedded.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Usage

```bash
# Always renders, stamps [DRAFT] on every slide when status isn't approved.
.venv/bin/python3 render_deck.py preview material/slides/session-01.yml

# Refuses when status: draft — only a human sets status: approved.
.venv/bin/python3 render_deck.py render material/slides/session-01.yml

# Also attempt a .pdf, via a local LibreOffice install (soffice/libreoffice on PATH).
# If neither is found, the script says so and still leaves you the .pptx.
.venv/bin/python3 render_deck.py render material/slides/session-01.yml --pdf
```

Output goes to `<deck's directory>/out/<deck-name>.pptx` (and `.pdf`) — e.g.
`material/slides/out/session-01.pptx`. That `out/` directory is a build product: never commit it,
never hand-edit it, never treat it as a source. Fix the `.yml` model instead and re-render.

## Self-test

`example/fixture.yml` exercises every body kind (`diagram`, `list`, `code`, `image` with both a
local `asset` and a bare `source_url`, `callout`, `placeholder`, `none`) plus the draft/approved
gate. Render it and skim the result before trusting a real deck's output:

```bash
.venv/bin/python3 render_deck.py preview example/fixture.yml
```

## Known gaps, stated rather than hidden

- No linting here. `deck_model_spec.md`'s word budgets, the list-item exception, and note-novelty
  are not checked mechanically by anything in this repository right now — an author applies them
  by judgment, a human reviews the rendered deck.
- No schema validation beyond the handful of required top-level keys `render_deck.py` checks to
  avoid crashing. A malformed slide can still produce a malformed slide, not a clean error.
- PDF export depends on whatever LibreOffice happens to be installed locally; output fidelity is
  whatever LibreOffice's PPTX-to-PDF conversion happens to produce, not something this script
  controls.
