"""Werteprüfung für LLM-Ausgaben: stimmen Zahlen, Daten und Uhrzeiten mit den Quellen überein?

Die Quellenpflicht aus :mod:`pwbs.core.grounding` stellt sicher, dass eine Aussage eine
``[Quelle: Titel, Datum]``-Annotation trägt. Sie prüft nicht, ob der Wert in der Aussage
in dieser Quelle steht. Ein Briefing kann "Budget 150.000 € [Quelle: Projektplan, ...]"
schreiben, während der Projektplan 120.000 € nennt; die Annotation ist gültig, der Wert
falsch. :func:`verify` vergleicht jeden Wert mit den Quellen:

    supported       der Wert steht in der zitierten Quelle (bei Aussagen ohne
                    Annotation: in irgendeiner Quelle)
    derived         ein Rechenschritt aus zwei Quellwerten, und die Aussage sagt, dass
                    gerechnet wurde ("insgesamt", "mehr"); oder eine Dauer zwischen zwei
                    Uhrzeiten der Quellen
    wrong_citation  der Wert steht in einer anderen Quelle als der zitierten
    unit_mismatch   die Zahl steht in der Quelle, aber mit anderer Einheit
    unsupported     keine Quelle belegt den Wert

Werte werden vor dem Vergleich normalisiert (siehe :mod:`pwbs.core.value_claims`).
Aussagen ohne Zahl, Datum, Uhrzeit oder Zitat werden nicht geprüft.
"""

from __future__ import annotations

import itertools
import re
from collections.abc import Iterator, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from pwbs.core.value_claims import _MONTH_RE, Claim, extract, normalise_text

__all__ = [
    "PROBLEMS",
    "ValueCheck",
    "ValueReport",
    "ValueSource",
    "ValueSources",
    "mark_problems",
    "repair_instructions",
    "verify",
]

PROBLEMS = ("unsupported", "unit_mismatch", "wrong_citation")

_SOURCE_REF_RE = re.compile(r"\[(?:Quelle|Source):\s*([^,\]]+)(?:,[^\]]*)?\]")
_BOUNDARY_RE = re.compile(r"[.!?](?:\s*\[(?:Quelle|Source):[^\]]*\])*(?=\s|$)")
# a period after these does not end a sentence: "1. Januar", "z.B. 5", "ca. 20"
_NO_BREAK_RE = re.compile(
    r"(?:\b\d{1,2}|\b(?:e\.g|i\.e|z\.b|ca|approx|nr|no|s|vs|etc|bzw|inkl|ggf|kw))$",
    re.IGNORECASE,
)
_MONTH_START_RE = re.compile(rf"\s+(?:{_MONTH_RE})\b", re.IGNORECASE)

# context keys that hold internal metadata, not content the briefing may quote
_SKIP_KEYS = frozenset({"chunk_id", "score", "id", "source_id", "owner_id", "user_id"})


# ------------------------------------------------------------------
# Data types
# ------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ValueSource:
    """One source the generated text may draw on, e.g. a document of the briefing context."""

    title: str
    text: str
    group: str = ""  # the context key it came from, e.g. "calendar_events"


@dataclass(frozen=True, slots=True)
class ValueSources:
    """All sources of one generation call.

    ``counts`` holds the lengths of the lists in the context, by key. "Du hast heute 3
    Termine" is backed by three calendar events even though the number 3 appears nowhere,
    but "3 Blocker" is not.
    """

    sources: tuple[ValueSource, ...]
    counts: tuple[tuple[str, int], ...] = ()

    @classmethod
    def from_context(cls, context: Mapping[str, Any]) -> ValueSources:
        """Build sources from a briefing template context.

        Every dict in a list becomes one source, titled by its ``title`` (or ``entity``).
        Scalar context values such as ``date`` are collected into one untitled source.
        """
        sources: list[ValueSource] = []
        scalars: list[str] = []
        counts: list[tuple[str, int]] = []
        for key, value in context.items():
            if isinstance(value, list | tuple):
                if value:
                    counts.append((key, len(value)))
                for item in value:
                    if isinstance(item, Mapping):
                        title = str(item.get("title") or item.get("entity") or "")
                        sources.append(ValueSource(title, _flatten(item) + _rendered(item), key))
                    elif item is not None:
                        sources.append(ValueSource("", str(item), key))
            elif isinstance(value, Mapping):
                title = str(value.get("title") or "")
                sources.append(ValueSource(title, _flatten(value) + _rendered(value, key)))
            elif value is not None and key not in _SKIP_KEYS:
                scalars.append(f"{key}: {value}")
        if scalars:
            sources.append(ValueSource("", "\n".join(scalars)))
        return cls(tuple(s for s in sources if s.text.strip()), tuple(counts))


@dataclass(frozen=True, slots=True)
class ValueCheck:
    """The result for one value in the checked text."""

    text: str
    kind: str  # "amount", "date", "time" or "quote"
    start: int
    end: int
    status: str
    sentence_end: int  # end of the statement the value belongs to, for marking
    source: str | None = None  # title of the source that backs the value
    evidence: str = ""  # the source sentence, or how the value was derived

    @property
    def ok(self) -> bool:
        return self.status not in PROBLEMS


@dataclass(frozen=True, slots=True)
class ValueReport:
    """All checked values of one text."""

    checks: list[ValueCheck] = field(default_factory=list)
    # cited titles that match no source, e.g. a source the model made up
    unresolved: list[str] = field(default_factory=list)

    @property
    def problems(self) -> list[ValueCheck]:
        return [c for c in self.checks if not c.ok]

    @property
    def grounded(self) -> bool:
        return not self.problems

    def summary(self) -> dict[str, int]:
        counts = dict.fromkeys(("supported", "derived", *PROBLEMS), 0)
        for check in self.checks:
            counts[check.status] += 1
        return counts


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------


def verify(text: str, sources: ValueSources) -> ValueReport:
    """Check every value in ``text`` against ``sources``.

    A statement with ``[Quelle: Titel, ...]`` or ``[Source: Title, ...]`` is checked against
    the sources with that title; a value found only in another source is a
    ``wrong_citation``. Statements without a resolvable annotation are checked against
    all sources.
    """
    indexed = [
        _Source(s.title, s.text, extract(s.text), normalise_text(s.text), s.group)
        for s in sources.sources
    ]
    report = ValueReport()
    for begin, sentence in _statements(text):
        report.unresolved.extend(_unresolved(sentence, indexed))
        cited = _resolve(sentence, indexed)
        in_scope = [s for s in indexed if cited is None or s in cited]
        others = [s for s in indexed if cited is not None and s not in cited]
        # several readings of one number ("1,234") share a span; one supported reading is
        # enough. Both ends of a range are checked separately.
        by_span: dict[tuple[int, int, int], list[Claim]] = {}
        for claim in extract(sentence):
            by_span.setdefault((claim.start, claim.end, claim.part), []).append(claim)
        for readings in by_span.values():
            status, source, evidence = min(
                (_check(c, in_scope, others, sources.counts, sentence) for c in readings),
                key=lambda r: _RANK.index(r[0]),
            )
            claim = readings[0]
            report.checks.append(
                ValueCheck(
                    text=claim.text,
                    kind=claim.kind,
                    start=begin + claim.start,
                    end=begin + claim.end,
                    status=status,
                    sentence_end=begin + len(sentence.rstrip()),
                    source=source,
                    evidence=evidence,
                )
            )
    return report


def repair_instructions(report: ValueReport) -> str:
    """Feedback for one correction round with the model."""
    lines = []
    for c in report.problems:
        if c.status == "wrong_citation":
            lines.append(f'- "{c.text}" steht in der Quelle "{c.source}", nicht in der zitierten')
        elif c.status == "unit_mismatch":
            lines.append(
                f'- "{c.text}": die Quelle nennt die Zahl mit anderer Einheit ({c.evidence})'
            )
        else:
            lines.append(f'- "{c.text}" steht in keiner der Quellen')
    return (
        "Einige Werte in deinem Text sind durch die Quellen nicht belegt:\n"
        + "\n".join(lines)
        + "\n\nSchreibe den Text neu. Übernimm jede Zahl, jedes Datum und jede Uhrzeit "
        "genau so aus den Quellen und nenne die Quelle, aus der der Wert stammt. Lass weg, "
        "was die Quellen nicht hergeben. Erwähne diese Prüfung nicht."
    )


def mark_problems(text: str, report: ValueReport, marker: str) -> str:
    """Append ``marker`` to every statement that still contains an unbacked value."""
    ends = sorted({c.sentence_end for c in report.problems}, reverse=True)
    for end in ends:
        text = text[:end] + marker + text[end:]
    return text


# ------------------------------------------------------------------
# Internals
# ------------------------------------------------------------------

_RANK = ("supported", "derived", "wrong_citation", "unit_mismatch", "unsupported")


@dataclass(eq=False)
class _Source:
    title: str
    text: str
    claims: list[Claim]
    plain: str  # normalised text, for quotes
    group: str = ""

    def evidence(self, claim: Claim) -> str:
        """The sentence or line around a claim, for showing where a value came from."""
        start = max(self.text.rfind(". ", 0, claim.start), self.text.rfind("\n", 0, claim.start))
        ends = (self.text.find(". ", claim.end), self.text.find("\n", claim.end))
        end = min((i for i in ends if i >= 0), default=len(self.text))
        return self.text[start + 1 : end + 1].strip()


def _rendered(item: Mapping[str, Any], key: str = "") -> str:
    """Values the templates compute from the context and show to the model: the relevance
    of a document in percent, and the total of a table of counts."""
    lines = []
    score = item.get("score")
    if isinstance(score, int | float) and not isinstance(score, bool):
        lines.append(f"Relevanz {score * 100:.0f} %")
    counts = list(item.values())
    if len(counts) > 1 and all(isinstance(v, int) and not isinstance(v, bool) for v in counts):
        lines.append(f"{sum(counts)} {_COUNT_WORDS.get(key, key.replace('_', ' '))}")
    return "".join(f"\n{line}" for line in lines)


def _flatten(item: Mapping[str, Any]) -> str:
    parts: list[str] = []
    for key, value in item.items():
        if key in _SKIP_KEYS or value is None:
            continue
        if isinstance(value, Mapping):
            parts.append(_flatten(value))
        elif isinstance(value, list | tuple):
            parts.extend(_flatten(v) if isinstance(v, Mapping) else str(v) for v in value)
        else:
            parts.append(str(value))
    return "\n".join(p for p in parts if p)


def _statements(text: str) -> Iterator[tuple[int, str]]:
    """Split into lines, and lines into sentences. A ``[Quelle: ...]`` right after the
    period belongs to the sentence before it."""
    offset = 0
    for line in text.split("\n"):
        start = 0
        for m in _BOUNDARY_RE.finditer(line):
            before = line[start : m.start()]
            if before.strip().isdigit():
                continue  # list numbering: "1. Budget prüfen"
            if _NO_BREAK_RE.search(before) and (
                not before[-1:].isdigit() or _MONTH_START_RE.match(line, m.end())
            ):
                continue
            if line[start : m.end()].strip():
                yield offset + start, line[start : m.end()]
            start = m.end()
        if line[start:].strip():
            yield offset + start, line[start:]
        offset += len(line) + 1


def _normalize_title(title: str) -> str:
    return " ".join(title.lower().split())


def _resolve(sentence: str, sources: list[_Source]) -> list[_Source] | None:
    """The sources a statement cites, or None if it cites none that can be resolved.

    A title that matches a source exactly cites only that source; a partial match
    ("Projektplan" for "Projektplan Q2") is used only when no title matches exactly.
    Otherwise "Project Plan" would also pull in a source called "Plan".
    """
    cited: list[_Source] = []
    for title in (_normalize_title(m.group(1)) for m in _SOURCE_REF_RE.finditer(sentence)):
        if not title:
            continue
        if title in _CALENDAR_TITLES:
            cited += [s for s in _calendar_events(sentence, sources) if s not in cited]
            continue
        exact = [s for s in sources if _normalize_title(s.title) == title]
        partial = [
            s
            for s in sources
            if (known := _normalize_title(s.title)) and (title in known or known in title)
        ]
        cited += [s for s in exact or partial if s not in cited]
    return cited or None


def _unresolved(sentence: str, sources: list[_Source]) -> list[str]:
    """The titles a statement cites that match no source."""
    found = []
    for m in _SOURCE_REF_RE.finditer(sentence):
        title = _normalize_title(m.group(1))
        if not title or title in _CALENDAR_TITLES:
            continue
        if not any(
            (known := _normalize_title(s.title)) and (title in known or known in title)
            for s in sources
        ):
            found.append(m.group(1).strip())
    return found


# "[Source: Calendar, 2026-03-14]" names no event; the event is the one the line is about
_CALENDAR_TITLES = frozenset({"calendar", "kalender"})


def _calendar_events(sentence: str, sources: list[_Source]) -> list[_Source]:
    """The calendar events whose title the statement mentions, or all events if none."""
    events = [s for s in sources if s.group == "calendar_events"]
    words = _words(_SOURCE_REF_RE.sub("", sentence))
    named = [s for s in events if _words(s.title) and _words(s.title) <= words]
    return named or events


def _check(
    claim: Claim,
    in_scope: list[_Source],
    others: list[_Source],
    counts: tuple[tuple[str, int], ...],
    sentence: str,
) -> tuple[str, str | None, str]:
    context = _words(sentence)
    if claim.kind == "amount" and claim.unit is None:
        # a bare number is about the thing named right after it: "3 Blocker" is not "3 Meetings"
        context = _named_after(claim, sentence) or context
    for scope, status in ((in_scope, "supported"), (others, "wrong_citation")):
        for source in scope:
            match = _find(claim, source, context)
            if match is not None:
                return status, source.title or None, match

    if claim.kind != "amount" or claim.value is None:
        return "unsupported", None, ""
    if claim.unit is None:
        counted = _counted(claim.value, counts, context)
        if counted:
            return "supported", None, f"Anzahl der Einträge in {counted}"
    for source in in_scope:
        duration = _duration(claim, source.claims)
        if duration:
            return "derived", source.title or None, duration
    derived = _derive(claim, [c for s in in_scope for c in s.claims])
    if derived and _CALCULATION_RE.search(sentence):
        return "derived", None, derived
    for source in in_scope:
        other_unit = next(
            (
                c
                for c in source.claims
                if c.kind == "amount"
                and c.unit
                and claim.unit
                and c.unit != claim.unit
                and _same(c.number, claim.number)
            ),
            None,
        )
        if other_unit:
            return "unit_mismatch", source.title or None, other_unit.text
    return "unsupported", None, ""


def _find(claim: Claim, source: _Source, context: set[str]) -> str | None:
    if claim.kind == "quote":
        return claim.key if claim.key in source.plain else None
    for c in source.claims:
        if c.kind != claim.kind:
            continue
        if claim.kind == "date" and _same_date(c.key, claim.key):
            return source.evidence(c)
        if claim.kind == "time" and c.key == claim.key:
            return source.evidence(c)
        if (
            claim.kind == "amount"
            and claim.unit
            and _same(c.value, claim.value)
            and c.unit == claim.unit
        ):
            return source.evidence(c)
        if claim.kind == "amount" and claim.unit is None and _same(c.value, claim.value):
            # A bare number matches a value with or without a unit, but only if the source
            # sentence shares a word with the statement; otherwise "5" would be backed by any
            # "5 Minuten" in the context.
            # A bare source value is likewise about the thing named after it.
            evidence = source.evidence(c)
            named = _named_after(c, source.text) if c.unit is None else set()
            if context & (named or _words(evidence)):
                return evidence
    return None


_STOPWORDS = frozenset(
    [
        "there",
        "this",
        "that",
        "these",
        "those",
        "with",
        "have",
        "will",
        "your",
        "about",
        "from",
        "were",
        "they",
        "them",
        "what",
        "when",
        "sind",
        "gibt",
        "haben",
        "wird",
        "werden",
        "eine",
        "einen",
        "einem",
        "einer",
        "nach",
        "noch",
        "auch",
        "oder",
        "aber",
        "heute",
        "today",
        "dein",
        "deine",
        "deinen",
        "insgesamt",
        "stehen",
        "steht",
    ]
)


def _words(text: str) -> set[str]:
    words = re.findall(r"[^\W\d_]{4,}", text.lower())
    return {w[:6] for w in words if w not in _STOPWORDS}


def _named_after(claim: Claim, sentence: str) -> set[str]:
    """Words of the one or two words right after a bare number: what it counts."""
    m = re.match(r"\s*((?:[^\W\d_]+[\s-]*){1,2})", sentence[claim.end :])
    return _words(m.group(1)) if m else set()


def _same(a: float | None, b: float | None) -> bool:
    return a is not None and b is not None and abs(a - b) <= 1e-9 * max(1.0, abs(a), abs(b))


def _same_date(source: str, claim: str) -> bool:
    """The text may leave out the year, but not add one the source does not give."""
    (ys, rest_s), (yc, rest_c) = source.split("-", 1), claim.split("-", 1)
    return rest_s == rest_c and (ys == yc or yc == "*")


# What the entries of a context list are called in a briefing. A count is only backed by a
# list whose entries the statement talks about: "3 Termine" by calendar_events, not "3 Blocker".
_COUNT_WORDS = {
    "calendar_events": "Termine Termin Meetings Events Besprechungen Kalender",
    "recent_documents": "Dokumente Dokument Documents Notizen Notes",
    "open_items": "offene Punkte Aufgaben Tasks Items Todos",
    "decisions": "Entscheidungen Entscheidung Decisions",
    "key_decisions": "Entscheidungen Entscheidung Decisions",
    "pending_decisions": "Entscheidungen Entscheidung Decisions",
    "participants": "Teilnehmer Teilnehmende Personen Participants People",
    "assumptions": "Annahmen Assumptions",
    "assumption_stats": "Annahmen Assumptions",
    "patterns": "Muster Patterns",
    "recurring_patterns": "Muster Patterns",
    "top_topics": "Themen Topics",
    "theme_shifts": "Themen Themenwechsel Topics",
    "timeline": "Ereignisse Events",
    "project_progress": "Projekte Projects",
}


def _counted(value: float | None, counts: tuple[tuple[str, int], ...], context: set[str]) -> str:
    """The context key whose list length is ``value`` and whose entries the statement names."""
    for key, n in counts:
        words = _words(_COUNT_WORDS.get(key, key.replace("_", " ")))
        if value == n and words & context:
            return key
    return ""


def _duration(claim: Claim, facts: Sequence[Claim]) -> str | None:
    """A duration between two times of one source, such as start and end of a meeting."""
    if claim.unit != "s" or claim.value is None:
        return None
    times = {c.key for c in facts if c.kind == "time"}
    for a, b in itertools.permutations(sorted(times), 2):
        ha, ma = map(int, a.split(":"))
        hb, mb = map(int, b.split(":"))
        if (hb * 60 + mb - ha * 60 - ma) * 60 == claim.value:
            return f"{b} − {a}"
    return None


_COUNT_UNITS = (None, "day", "week", "month", "year")
# A value only counts as derived if the statement says it is a calculation. Otherwise
# "5 Jahre" would pass as 2 + 3 Jahre when the sources only mention those two values.
_CALCULATION_RE = re.compile(
    r"\b(?:more|less|fewer|difference|total|together|combined|sum|altogether|times|each|per|"
    r"mehr|weniger|insgesamt|zusammen|gesamt|differenz|jeweils|pro|ergibt|macht|summe|"
    r"gestiegen|gesunken|zunahme|abnahme|plus|minus)\b",
    re.IGNORECASE,
)


def _derive(claim: Claim, facts: Sequence[Claim]) -> str | None:
    """Explain the claim as one arithmetic step over two source values, if possible.

    Only steps that make sense for the units are tried: sums and differences of two values
    with the claim's unit, a percentage change, or a value multiplied or divided by a count
    or a duration. Bare numbers are never derived; too many would match by chance.
    """
    target, unit = claim.value, claim.unit
    if target is None or unit is None or not claim.number:
        return None
    # compare at the precision the text wrote, in the unit it wrote: "251 ml" is not 0.25 l
    scale = target / claim.number
    written = re.search(r"\d[.,](\d+)\b", claim.text)
    decimals = len(written.group(1)) if written else 0
    # every occurrence counts: two line items of 6 € each add up to 12 €
    amounts = [
        (c.value, c.unit, c.text, c.start, c.part)
        for c in facts
        if c.kind == "amount" and c.value is not None
    ]
    for (a, ua, ta, sa, pa), (b, ub, tb, sb, pb) in itertools.permutations(amounts, 2):
        if (sa, pa, ta) == (sb, pb, tb) and a != b:
            continue  # two readings of the same number ("1.234")
        candidates = []
        if ua == ub == unit:
            candidates += [(a + b, f"{ta} + {tb}"), (a - b, f"{ta} − {tb}")]
        if unit == "%" and ua == ub and ua is not None and b:
            candidates.append(((a - b) / b * 100, f"({ta} − {tb}) / {tb}"))
        if ua == unit and ub in _COUNT_UNITS and b >= 2 and b == int(b):
            candidates += [(a * b, f"{ta} × {tb}"), (a / b, f"{ta} / {tb}")]
        for value, how in candidates:
            if round(value / scale, decimals) == round(claim.number, decimals):
                return how
    return None
