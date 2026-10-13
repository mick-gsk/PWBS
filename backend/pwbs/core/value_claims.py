"""Prüfbare Werte in Texten finden: Beträge, Einheiten, Daten, Uhrzeiten, Zitate.

Grundlage für :mod:`pwbs.core.value_check`. Dieselbe Extraktion läuft über den
Briefing-Text und über die Quellen, damit beide Seiten gleich normalisiert werden:
"3 Tage" entspricht "drei Tage", "1,8 l" entspricht "1800 ml", "1. Januar 2026"
entspricht "2026-01-01", "€120" entspricht "120 Euro". Deutsche und englische
Schreibweisen werden erkannt.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# --- units ------------------------------------------------------------------------------

# surface form -> (canonical unit, factor to the base unit of its dimension)
_UNITS: dict[str, tuple[str, float]] = {}


def _add(canonical: str, factor: float, *names: str) -> None:
    for name in names:
        _UNITS[name.lower()] = (canonical, factor)


_add("EUR", 1, "€", "eur", "euro", "euros")
_add("USD", 1, "$", "usd", "dollar", "dollars")
_add("GBP", 1, "£", "gbp", "pound", "pounds")
_add("CHF", 1, "chf", "franken")
_add("%", 1, "%", "percent", "per cent", "prozent")
_add("s", 1, "s", "sec", "secs", "second", "seconds", "sekunde", "sekunden")
_add("s", 60, "min", "mins", "minute", "minutes", "minuten")
_add("s", 3600, "h", "hr", "hrs", "hour", "hours", "stunde", "stunden", "std")
_add(
    "day",
    1,
    "day",
    "days",
    "tag",
    "tage",
    "tagen",
    "werktag",
    "werktage",
    "werktagen",
    "working day",
    "working days",
    "business day",
    "business days",
    "calendar day",
    "calendar days",
)
_add("week", 1, "week", "weeks", "woche", "wochen")
_add("month", 1, "month", "months", "monat", "monate", "monaten", "monats")
_add("year", 1, "year", "years", "jahr", "jahre", "jahren", "jahres")
_add("m", 0.001, "mm", "millimeter", "millimeters", "millimetre", "millimetres")
_add("m", 0.01, "cm", "centimeter", "centimeters", "centimetre", "centimetres", "zentimeter")
_add("m", 1, "m", "meter", "meters", "metre", "metres")
_add("m", 1000, "km", "kilometer", "kilometers", "kilometre", "kilometres")
_add("g", 1, "g", "gram", "grams", "gramm")
_add("g", 1000, "kg", "kilogram", "kilograms", "kilogramm", "kilo")
_add("l", 0.001, "ml", "milliliter", "milliliters", "millilitre", "millilitres")
_add("l", 1, "l", "liter", "liters", "litre", "litres")
_add("W", 1, "w", "watt", "watts")
_add("W", 1000, "kw", "kilowatt", "kilowatts")
_add("V", 1, "v", "volt", "volts")
_add("Hz", 1, "hz", "hertz")
_add("bar", 1, "bar")
_add("B", 1e6, "mb", "megabyte", "megabytes")
_add("B", 1e9, "gb", "gigabyte", "gigabytes")
_add("°C", 1, "°c", "degrees celsius", "degree celsius", "grad celsius", "grad")

_UNIT_RE = "|".join(sorted((re.escape(u) for u in _UNITS), key=len, reverse=True))
# units that may follow one or two descriptive words: "28 vacation days", "fünf Urlaubstage"
_WORD_UNIT_RE = "|".join(
    sorted((re.escape(u) for u in _UNITS if len(u) > 3 and u.isalpha()), key=len, reverse=True)
)

# --- number words -------------------------------------------------------------------------

_WORDS = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "fifteen": 15,
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    "sixty": 60,
    "ninety": 90,
    "hundred": 100,
    "a dozen": 12,
    "half": 0.5,
    "half an": 0.5,
    "half a": 0.5,
    "eine halbe": 0.5,
    "einer halben": 0.5,
    "null": 0,
    "ein": 1,
    "eine": 1,
    "einen": 1,
    "einem": 1,
    "zwei": 2,
    "drei": 3,
    "vier": 4,
    "fünf": 5,
    "sechs": 6,
    "sieben": 7,
    "acht": 8,
    "neun": 9,
    "zehn": 10,
    "elf": 11,
    "zwölf": 12,
    "fünfzehn": 15,
    "zwanzig": 20,
    "dreißig": 30,
    "hundert": 100,
}
_WORD_RE = "|".join(sorted(map(re.escape, _WORDS), key=len, reverse=True))

_MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "sept": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
    "januar": 1,
    "februar": 2,
    "märz": 3,
    "mai": 5,
    "juni": 6,
    "juli": 7,
    "oktober": 10,
    "dezember": 12,
}
_MONTH_RE = "|".join(sorted(map(re.escape, _MONTHS), key=len, reverse=True))

# --- patterns -----------------------------------------------------------------------------

_NUM = r"\d{1,3}(?:[.,  ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?"
_DATE_PATTERNS = [
    # 2026-01-31
    re.compile(r"\b(?P<y>\d{4})-(?P<m>\d{1,2})-(?P<d>\d{1,2})\b"),
    # 31.01.2026 / 31.1.26
    re.compile(r"\b(?P<d>\d{1,2})\.(?P<m>\d{1,2})\.(?P<y>\d{2,4})\b"),
    # 31 January 2026 / 31. Januar / 1st of March
    re.compile(
        rf"\b(?P<d>\d{{1,2}})(?:st|nd|rd|th|\.)?\s+(?:of\s+)?(?P<mon>{_MONTH_RE})\.?(?:,?\s+(?P<y>\d{{4}}))?\b",
        re.IGNORECASE,
    ),
    # January 31, 2026 / March 31
    re.compile(
        rf"\b(?P<mon>{_MONTH_RE})\.?\s+(?P<d>\d{{1,2}})(?:st|nd|rd|th)?(?:,?\s+(?P<y>\d{{4}}))?\b",
        re.IGNORECASE,
    ),
]
_TIME_RE = re.compile(
    r"\b(?P<h>[01]?\d|2[0-3])(?::(?P<min>[0-5]\d)(?:\s*uhr\b)?|\.(?P<min2>[0-5]\d)\s*uhr\b)",
    re.IGNORECASE,
)
_PREFIX_CURRENCY_RE = re.compile(rf"(?P<unit>[€$£]|\b(?:EUR|USD|GBP|CHF))\s?(?P<num>{_NUM})")
_AMOUNT_RE = re.compile(
    rf"(?<![\w.,])(?P<num>{_NUM}|{_WORD_RE})(?:\s*(?:-|–|to|bis)\s*(?P<num2>{_NUM}))?"
    rf"(?:[\s-]?(?P<unit>{_UNIT_RE})(?![\w])|(?:\s+[a-zäöüß-]{{3,15}}){{1,2}}\s+(?P<wunit>{_WORD_UNIT_RE})(?![\w]))?(?![\w])",
    re.IGNORECASE,
)
_QUOTE_RE = re.compile(r"[\"“„«](?P<q>[^\"“”„«»]{12,300})[\"”“»]")
# [1] style citations and the [Quelle: Titel, Datum] / [Source: Title, Date] annotations of
# briefings; the date inside an annotation describes the source, it is not a claim of the text
_CITATION_RE = re.compile(r"\[\d+\](?:\[\d+\])*|\[(?:Quelle|Source):[^\]]*\]")
_LIST_MARKER_RE = re.compile(rf"(?mi)^\s*\d+[.)]\s(?!\s*(?:{_MONTH_RE})\b)")


@dataclass(frozen=True)
class Claim:
    """A checkable fact. `key` is the normalised value; equal keys mean the same fact."""

    kind: str  # "amount", "date", "time" or "quote"
    text: str  # as written
    start: int
    end: int
    value: float | None = None
    unit: str | None = None  # canonical unit, None for a bare number
    key: str = ""
    number: float | None = None  # as written, before unit conversion: 25 for "25 minutes"
    part: int = 0  # 1 for the upper end of a range ("20 to 220 ml")

    def __str__(self) -> str:
        return self.text


def parse_number(text: str) -> list[float]:
    """All plausible readings of a number: "1,234" is 1234 in English and 1.234 in German."""
    text = text.strip().lower()
    if text in _WORDS:
        return [float(_WORDS[text])]
    text = text.replace(" ", "").replace(" ", "")
    if "," in text and "." in text:  # the later separator is the decimal one
        decimal = "," if text.rfind(",") > text.rfind(".") else "."
        thousands = "." if decimal == "," else ","
        return [float(text.replace(thousands, "").replace(decimal, "."))]
    for sep in ",.":
        if sep in text:
            head, *rest = text.split(sep)
            if len(rest) == 1 and len(rest[0]) == 3 and head != "0":
                # 1,234 or 1.234: thousands separator in one language, decimal point in the other
                return [float(head + rest[0]), float(f"{head}.{rest[0]}")]
            if len(rest) == 1:
                return [float(f"{head}.{rest[0]}")]
            return [float(text.replace(sep, ""))]
    return [float(text)]


def _amount_key(value: float, unit: str | None) -> str:
    return f"{value:g} {unit}" if unit else f"{value:g}"


def extract(text: str) -> list[Claim]:
    """Return the claims in `text`, ordered by position, without overlaps."""
    claims: list[Claim] = []
    taken: list[tuple[int, int]] = []
    masked = _mask(text)

    def free(start: int, end: int) -> bool:
        return all(end <= s or start >= e for s, e in taken)

    def take(claim: Claim) -> None:
        claims.append(claim)
        taken.append((claim.start, claim.end))

    for m in _QUOTE_RE.finditer(text):
        quote = _norm_text(m.group("q"))
        if len(quote.split()) >= 3:
            take(Claim("quote", m.group(0), m.start(), m.end(), key=quote))

    for pattern in _DATE_PATTERNS:
        for m in pattern.finditer(masked):
            if not free(m.start(), m.end()):
                continue
            parts = m.groupdict()
            month = _MONTHS[parts["mon"].lower()] if parts.get("mon") else int(parts["m"])
            day, year = int(parts["d"]), parts.get("y")
            if not (1 <= month <= 12 and 1 <= day <= 31):
                continue
            if year and len(year) == 2:
                year = "20" + year
            take(
                Claim(
                    "date",
                    m.group(0),
                    m.start(),
                    m.end(),
                    key=f"{year or '*'}-{month:02d}-{day:02d}",
                )
            )

    for m in _TIME_RE.finditer(masked):
        if free(m.start(), m.end()):
            take(
                Claim(
                    "time",
                    m.group(0).strip(),
                    m.start(),
                    m.end(),
                    key=f"{int(m.group('h')):02d}:{m.group('min') or m.group('min2')}",
                )
            )

    for m in _PREFIX_CURRENCY_RE.finditer(masked):
        if free(m.start(), m.end()):
            currency, factor = _UNITS[m.group("unit").lower()]
            for value in parse_number(m.group("num")):
                take(
                    Claim(
                        "amount",
                        m.group(0),
                        m.start(),
                        m.end(),
                        value * factor,
                        currency,
                        _amount_key(value * factor, currency),
                        value,
                    )
                )

    for m in _AMOUNT_RE.finditer(masked):
        if not free(m.start(), m.end()):
            continue
        raw_unit = (m.group("unit") or m.group("wunit") or "").lower()
        is_word = m.group("num").lower() in _WORDS
        if is_word and not raw_unit:
            continue  # "one of the rules" is not a claim; "three days" is
        if is_word and m.group("unit") and masked[m.end("num")] not in " \u00a0-":
            continue  # "ones", "eins": a number word glued to a unit letter is just a word
        unit, factor = _UNITS[raw_unit] if raw_unit else (None, 1.0)
        numbers = [m.group("num")] + ([m.group("num2")] if m.group("num2") else [])
        for part, number in enumerate(numbers):
            for value in parse_number(number):
                take(
                    Claim(
                        "amount",
                        m.group(0),
                        m.start(),
                        m.end(),
                        value * factor,
                        unit,
                        _amount_key(value * factor, unit),
                        value,
                        part,
                    )
                )
    return sorted(claims, key=lambda c: (c.start, c.key))


def _mask(text: str) -> str:
    """Blank out citation markers and list numbering so "[2]" and "1. " are not read as numbers."""
    for pattern in (_CITATION_RE, _LIST_MARKER_RE):
        text = pattern.sub(lambda m: " " * len(m.group(0)), text)
    return text


def _norm_text(text: str) -> str:
    return " ".join(re.sub(r"[^\w\s]", " ", text.lower()).split())


def normalise_text(text: str) -> str:
    return _norm_text(text)
