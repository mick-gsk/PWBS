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


@dataclass(frozen=True, slots=True)
class ValueSources:
    """All sources of one generation call.

    ``counts`` holds the lengths of the lists in the context. "Du hast heute 3 Termine"
    is backed by three calendar events even though the number 3 appears nowhere.
    """

    sources: tuple[ValueSource, ...]
    counts: frozenset[int] = frozenset()

    @classmethod
    def from_context(cls, context: Mapping[str, Any]) -> ValueSources:
        """Build sources from a briefing template context.

        Every dict in a list becomes one source, titled by its ``title`` (or ``entity``).
        Scalar context values such as ``date`` are collected into one untitled source.
        """
        sources: list[ValueSource] = []
        scalars: list[str] = []
        counts: set[int] = set()
        for key, value in context.items():
            if isinstance(value, list | tuple):
                if value:
                    counts.add(len(value))
                for item in value:
                    if isinstance(item, Mapping):
                        title = str(item.get("title") or item.get("entity") or "")
                        sources.append(ValueSource(title, _flatten(item)))
                    elif item is not None:
                        sources.append(ValueSource("", str(item)))
            elif isinstance(value, Mapping):
                title = str(value.get("title") or "")
                sources.append(ValueSource(title, _flatten(value)))
            elif value is not None and key not in _SKIP_KEYS:
                scalars.append(f"{key}: {value}")
        if scalars:
            sources.append(ValueSource("", "\n".join(scalars)))
        return cls(tuple(s for s in sources if s.text.strip()), frozenset(counts))


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
        _Source(s.title, s.text, extract(s.text), normalise_text(s.text)) for s in sources.sources
    ]
    report = ValueReport()
    for begin, sentence in _statements(text):
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

    def evidence(self, claim: Claim) -> str:
        """The sentence or line around a claim, for showing where a value came from."""
        start = max(self.text.rfind(". ", 0, claim.start), self.text.rfind("\n", 0, claim.start))
        ends = (self.text.find(". ", claim.end), self.text.find("\n", claim.end))
        end = min((i for i in ends if i >= 0), default=len(self.text))
        return self.text[start + 1 : end + 1].strip()


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
    """The sources a statement cites, or None if it cites none that can be resolved."""
    titles = [_normalize_title(m.group(1)) for m in _SOURCE_REF_RE.finditer(sentence)]
    cited = [
        s
        for s in sources
        if (known := _normalize_title(s.title))
        and any(t == known or t in known or known in t for t in titles if t)
    ]
    return cited or None


def _check(
    claim: Claim,
    in_scope: list[_Source],
    others: list[_Source],
    counts: frozenset[int],
    sentence: str,
) -> tuple[str, str | None, str]:
    context = _words(sentence)
    for scope, status in ((in_scope, "supported"), (others, "wrong_citation")):
        for source in scope:
            match = _find(claim, source, context)
            if match is not None:
                return status, source.title or None, match

    if claim.kind != "amount" or claim.value is None:
        return "unsupported", None, ""
    if claim.unit is None and claim.value in counts:
        return "supported", None, "Anzahl der Einträge im Kontext"
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
        if claim.kind == "amount" and _same(c.value, claim.value) and c.unit == claim.unit:
            return source.evidence(c)
        if claim.kind == "amount" and claim.unit is None and _same(c.value, claim.value):
            # A bare number matches a value with any unit, but only if the source sentence
            # shares a word with the statement; otherwise "5" would be backed by any
            # "5 Minuten" in the context.
            evidence = source.evidence(c)
            if context & _words(evidence):
                return evidence
    return None


def _words(text: str) -> set[str]:
    return {w[:6] for w in re.findall(r"[^\W\d_]{4,}", text.lower())}


def _same(a: float | None, b: float | None) -> bool:
    return a is not None and b is not None and abs(a - b) <= 1e-9 * max(1.0, abs(a), abs(b))


def _same_date(a: str, b: str) -> bool:
    (ya, rest_a), (yb, rest_b) = a.split("-", 1), b.split("-", 1)
    return rest_a == rest_b and (ya == yb or "*" in (ya, yb))


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
    written = re.match(r"\d+[.,](\d+)\b", claim.text)
    decimals = len(written.group(1)) if written else 0
    values = {
        (c.value, c.unit, c.text) for c in facts if c.kind == "amount" and c.value is not None
    }
    for (a, ua, ta), (b, ub, tb) in itertools.permutations(values, 2):
        candidates = []
        if ua == ub == unit:
            candidates += [(a + b, f"{ta} + {tb}"), (a - b, f"{ta} − {tb}")]
        if unit == "%" and ua == ub and ua is not None and b:
            candidates.append(((a - b) / b * 100, f"({ta} − {tb}) / {tb}"))
        if ua == unit and ub in _COUNT_UNITS and b >= 2 and b == int(b):
            candidates += [(a * b, f"{ta} × {tb}"), (a / b, f"{ta} / {tb}")]
        for value, how in candidates:
            if value > 0 and round(value / scale, decimals) == round(claim.number, decimals):
                return how
    return None
