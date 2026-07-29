"""Shared loading, normalising and text-extraction helpers for deck models.

A deck model is one YAML file per course session (see
.claude/reference/slide_model_spec.md). Every script in this directory reads the
model through here so that the notion of "the text of a slide" is defined once.
"""

from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
DEFAULT_RULES = HERE / "slide_rules.yml"

# Function words carry no signal for the notes-novelty KPI. Course language is
# Italian; English is included because technical decks mix the two.
STOPWORDS = {
    # Italian
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "a", "da", "in",
    "con", "su", "per", "tra", "fra", "del", "dello", "della", "dei", "degli",
    "delle", "al", "allo", "alla", "ai", "agli", "alle", "dal", "dalla", "nel",
    "nella", "nei", "negli", "nelle", "sul", "sulla", "e", "ed", "o", "ma", "se",
    "che", "chi", "cui", "come", "dove", "quando", "perche", "non", "piu", "anche",
    "sono", "essere", "stato", "stata", "ha", "hanno", "avere", "fa", "fare", "si",
    "ci", "vi", "ne", "questo", "questa", "questi", "queste", "quello", "quella",
    "loro", "suo", "sua", "ogni", "tutti", "tutte", "molto", "solo", "già", "gia",
    # English
    "the", "a", "an", "of", "to", "in", "on", "for", "with", "and", "or", "but",
    "if", "that", "this", "these", "those", "is", "are", "was", "were", "be",
    "been", "it", "its", "as", "at", "by", "from", "not", "no", "you", "your",
    "we", "our", "they", "their", "can", "will", "do", "does", "how", "what",
    "why", "when", "where", "which", "then", "than", "so", "also", "into",
}


class DeckError(Exception):
    """A model is malformed badly enough that no further checking is meaningful."""


def load_rules(path: Path | None = None) -> dict:
    return yaml.safe_load((path or DEFAULT_RULES).read_text(encoding="utf-8"))


def load_deck(path: Path) -> dict:
    try:
        deck = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise DeckError(f"{path}: not valid YAML: {exc}") from exc
    if not isinstance(deck, dict):
        raise DeckError(f"{path}: top level must be a mapping")
    for key in ("deck", "status", "session", "title", "units"):
        if key not in deck:
            raise DeckError(f"{path}: missing required top-level key '{key}'")
    if not isinstance(deck.get("units"), list) or not deck["units"]:
        raise DeckError(f"{path}: 'units' must be a non-empty list")
    deck["_path"] = str(path)
    return deck


def iter_slides(deck: dict):
    """Yield (unit, slide, index) for every authored slide, in deck order."""
    for unit in deck["units"]:
        for index, slide in enumerate(unit.get("slides") or [], start=1):
            yield unit, slide, index


def slide_label(unit: dict, slide: dict, index: int) -> str:
    return slide.get("id") or f"unit {unit.get('unit', '?')} slide {index}"


# --------------------------------------------------------------------------- text

def body_text(slide: dict) -> str:
    """All *reader-visible* text of a slide body.

    Deliberately excludes mermaid source and code text: neither is prose the
    audience reads word by word, so counting them against the word budget or the
    notes-novelty KPI would punish exactly the visual evidence the
    Assertion-Evidence model asks for.
    """
    body = slide.get("body") or {}
    kind = body.get("kind", "none")
    parts: list[str] = []
    if kind == "list":
        parts += [str(i) for i in (body.get("items") or [])]
    elif kind == "diagram":
        parts += [str(body.get("caption") or "")]
    elif kind == "image":
        parts += [str(body.get("caption") or "")]
    elif kind in ("callout", "quote"):
        parts += [str(body.get("text") or "")]
    elif kind == "code":
        parts += [str(body.get("caption") or "")]
    elif kind == "placeholder":
        parts += [str(body.get("needs") or "")]
    parts += [str(link.get("label", "")) for link in (slide.get("links") or [])]
    return "\n".join(p for p in parts if p)


def slide_text(slide: dict) -> str:
    """Headline plus visible body text — what the audience actually reads."""
    return "\n".join(x for x in (str(slide.get("headline") or ""), body_text(slide)) if x)


def tokens(text: str) -> set[str]:
    """Content words, accent- and case-folded, stopwords removed."""
    folded = unicodedata.normalize("NFKD", text.lower())
    folded = "".join(c for c in folded if not unicodedata.combining(c))
    raw = re.findall(r"[a-z0-9_./-]{2,}", folded)
    return {w for w in raw if w not in STOPWORDS}


def word_count(text: str) -> int:
    return len(re.findall(r"\S+", text))


def novelty(note_text: str, slide_txt: str) -> float | None:
    """Share of note content words that do NOT appear on the slide.

    1.0 = the notes say something entirely different; 0.0 = the notes are the
    slide read aloud, which is the failure mode Mayer's redundancy principle
    warns about. Returns None when either side is too small to score.
    """
    note_tokens = tokens(note_text)
    if not note_tokens:
        return None
    return len(note_tokens - tokens(slide_txt)) / len(note_tokens)


# ------------------------------------------------------------------- SSOT parsing

GOAL_RE = re.compile(r"\bG(\d+)([a-z])?(_[A-Z][A-Z0-9_]*)?\b")


def normalise_goal(raw: str) -> str:
    """Fold every spelling of a goal onto its base id.

    goals.md declares G1..G5; design/curriculum.md splits G5 into the spiral
    passes G5a and G5b; the gatherer spec prefers mnemonic ids like G1_DEPLOY.
    All three must resolve to the same objective or coverage never closes.
    """
    match = GOAL_RE.search(raw or "")
    return f"G{match.group(1)}" if match else (raw or "").strip()


def goal_ids_from_store(goals_md: Path) -> list[str]:
    """Objective ids declared in the GOALS store, in declaration order."""
    ids: list[str] = []
    for line in goals_md.read_text(encoding="utf-8").splitlines():
        # Objectives are numbered list items: "1. **G1 — Deploy the gateway.**"
        m = re.match(r"\s*\d+\.\s*\*\*(G\d+[a-z]?(?:_[A-Z0-9_]+)?)\b", line)
        if m:
            base = normalise_goal(m.group(1))
            if base not in ids:
                ids.append(base)
    return ids


UNIT_RE = re.compile(r"^####\s*Unit\s+(\d+\.\d+)\s*[—–-]\s*(.+?)\s*(?:\(|$)")
SESSION_RE = re.compile(r"^###\s*SESSION\s+(\d+)\s*[—–-]\s*(.+?)\s*(?:\(|$)")


def units_from_curriculum(curriculum_md: Path) -> list[dict]:
    """Sessions and units declared in the CURRICULUM store.

    Parses the unit/session headings only. The prerequisite graph in §1 is ASCII
    art; deriving structure from it would be guesswork, so coverage is checked
    against units and goals — both of which are declared unambiguously.
    """
    out: list[dict] = []
    session = None
    for line in curriculum_md.read_text(encoding="utf-8").splitlines():
        sm = SESSION_RE.match(line)
        if sm:
            session = int(sm.group(1))
            continue
        um = UNIT_RE.match(line)
        if um:
            out.append({"session": session, "unit": um.group(1), "title": um.group(2)})
    return out


def die(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(2)
