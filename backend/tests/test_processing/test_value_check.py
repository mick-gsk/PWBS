"""Tests for the value check of generated briefings."""

from __future__ import annotations

from typing import Any

import pytest

from pwbs.core.value_check import (
    ValueSource,
    ValueSources,
    mark_problems,
    repair_instructions,
    verify,
)
from pwbs.core.value_claims import extract, parse_number

CONTEXT: dict[str, Any] = {
    "date": "2026-03-14",
    "calendar_events": [
        {"title": "Sprint Planning", "time": "10:00", "end_time": "10:45"},
        {"title": "Budget-Review", "time": "14:30"},
        {"title": "1:1 Ben", "time": "16:00"},
    ],
    "recent_documents": [
        {
            "title": "Projektplan Q2",
            "source": "notion",
            "date": "2026-03-13",
            "content": "Das Budget für Q2 beträgt 120.000 €. Der Launch ist für den "
            "30. April geplant. Bisher wurden 45.000 € ausgegeben.",
            "chunk_id": "c-17",
            "score": 0.83,
        }
    ],
}

PLAN = "[Quelle: Projektplan Q2, 2026-03-13]"
SPRINT = "[Quelle: Sprint Planning, 2026-03-14]"


def statuses(text: str) -> list[tuple[str, str]]:
    report = verify(text, ValueSources.from_context(CONTEXT))
    return [(c.text, c.status) for c in report.checks]


# ------------------------------------------------------------------
# Extraction
# ------------------------------------------------------------------


class TestValueClaims:
    @pytest.mark.parametrize(
        ("text", "values"),
        [
            ("120", [120]),
            ("1,8", [1.8]),
            ("1.234", [1234, 1.234]),  # German thousands or English decimal
            ("120.000", [120000, 120.0]),
            ("1.234,50", [1234.5]),
        ],
    )
    def test_parse_number(self, text: str, values: list[float]) -> None:
        assert parse_number(text) == pytest.approx(values)

    def test_spellings_are_normalised(self) -> None:
        a = {c.key for c in extract("drei Wochen, 1,8 l, 120 Euro, 1. Januar 2026, 9:30 Uhr")}
        b = {c.key for c in extract("3 weeks, 1800 ml, €120, 01.01.2026, 09:30")}
        assert a == b

    def test_source_annotation_is_not_a_claim(self) -> None:
        assert extract(f"Siehe Plan {PLAN}") == []

    def test_number_words_need_a_unit(self) -> None:
        assert extract("eins der Themen, einer der Punkte") == []
        assert [c.key for c in extract("zwei Tage")] == ["2 day"]


# ------------------------------------------------------------------
# Verification
# ------------------------------------------------------------------


class TestVerify:
    def test_value_from_cited_source_is_supported(self) -> None:
        assert statuses(f"Das Q2-Budget beträgt 120.000 € {PLAN}.") == [("120.000 €", "supported")]

    def test_changed_value_is_unsupported(self) -> None:
        assert statuses(f"Das Q2-Budget beträgt 150.000 € {PLAN}.") == [
            ("150.000 €", "unsupported")
        ]

    def test_value_from_other_source_is_wrong_citation(self) -> None:
        report = verify(
            f"Der Launch ist am 30. April {SPRINT}.", ValueSources.from_context(CONTEXT)
        )
        assert report.checks[0].status == "wrong_citation"
        assert report.checks[0].source == "Projektplan Q2"

    def test_unit_mismatch(self) -> None:
        assert statuses(f"Für Q2 sind 120.000 Stunden eingeplant {PLAN}.") == [
            ("120.000 Stunden", "unit_mismatch")
        ]

    def test_uncited_statement_is_checked_against_all_sources(self) -> None:
        assert statuses("Das Budget-Review beginnt um 14:30.") == [("14:30", "supported")]
        assert statuses("Das Budget-Review beginnt um 15:00.") == [("15:00", "unsupported")]

    def test_dates_match_across_formats(self) -> None:
        assert statuses("Heute ist der 14. März 2026.") == [("14. März 2026", "supported")]

    def test_calculation_needs_a_cue_word(self) -> None:
        assert statuses(f"Es bleiben insgesamt 75.000 € übrig {PLAN}.") == [("75.000 €", "derived")]
        assert statuses(f"Das Restbudget sind 75.000 € {PLAN}.") == [("75.000 €", "unsupported")]

    def test_duration_between_start_and_end_of_one_event(self) -> None:
        assert statuses("Das Sprint Planning dauert 45 Minuten.") == [("45 Minuten", "derived")]
        # 14:30 and 16:00 belong to different events
        assert statuses("Das Budget-Review dauert 90 Minuten.") == [("90 Minuten", "unsupported")]

    def test_count_of_context_entries(self) -> None:
        assert statuses("Du hast heute 3 Termine.") == [("3", "supported")]
        assert statuses("Du hast heute 7 Termine.") == [("7", "unsupported")]

    def test_metadata_is_no_source(self) -> None:
        # relevance scores and chunk ids are not content the briefing may quote
        assert statuses("Die Relevanz liegt bei 0.83.") == [("0.83", "unsupported")]

    def test_list_numbering_is_not_a_value(self) -> None:
        assert statuses("1. Budget prüfen\n2. Launch vorbereiten") == []

    def test_date_after_list_number_is_kept(self) -> None:
        text = f"Wichtig:\n1. April ist Abgabe {PLAN}"
        assert statuses(text) == [("1. April", "unsupported")]

    def test_english_source_annotation(self) -> None:
        text = (
            "- **10:00 – Sprint Planning** [Source: Calendar, 2026-03-14]\n"
            "- The Q2 budget is EUR 150,000 [Source: Projektplan Q2, 2026-03-13]."
        )
        assert statuses(text) == [("10:00", "supported"), ("EUR 150,000", "unsupported")]

    def test_empty_context_has_no_sources(self) -> None:
        assert ValueSources.from_context({}).sources == ()


class TestRepairAndMarking:
    def test_repair_instructions_name_each_problem(self) -> None:
        text = f"Budget 150.000 € {PLAN}. Launch am 30. April {SPRINT}."
        report = verify(text, ValueSources.from_context(CONTEXT))
        feedback = repair_instructions(report)
        assert '"150.000 €" steht in keiner der Quellen' in feedback
        assert '"30. April" steht in der Quelle "Projektplan Q2"' in feedback

    def test_mark_problems_marks_only_affected_statements(self) -> None:
        text = (
            f"- Budget 150.000 € {PLAN}.\n"
            f"- Ausgegeben: 45.000 € {PLAN}.\n"
            "- Review um 14:30 und Abschluss um 18:00."
        )
        report = verify(text, ValueSources.from_context(CONTEXT))
        marked = mark_problems(text, report, " ⚠️")
        assert marked.split("\n") == [
            f"- Budget 150.000 € {PLAN}. ⚠️",
            f"- Ausgegeben: 45.000 € {PLAN}.",
            "- Review um 14:30 und Abschluss um 18:00. ⚠️",
        ]

    def test_summary_counts_statuses(self) -> None:
        report = verify(
            f"Budget 120.000 € {PLAN}, Launch am 1. Mai.",
            ValueSources.from_context(CONTEXT),
        )
        assert report.summary()["supported"] == 1
        assert report.summary()["unsupported"] == 1
        assert not report.grounded


class TestEdgeCases:
    @pytest.mark.parametrize(
        ("text", "key"),
        [("-5 %", "-5 %"), ("−5 %", "-5 %"), ("+5 %", "5 %"), ("Saldo: -120 €", "-120 EUR")],
    )
    def test_signs_are_kept(self, text: str, key: str) -> None:
        assert [c.key for c in extract(text)] == [key]

    def test_negative_value_is_not_backed_by_the_positive_one(self) -> None:
        sources = ValueSources((ValueSource("Bericht", "Der Umsatz stieg um 5 %."),))
        report = verify("Der Umsatz sank um -5 %.", sources)
        assert [c.status for c in report.checks] == ["unsupported"]

    @pytest.mark.parametrize(
        ("text", "key"),
        [
            ("9:30 AM", "09:30"),
            ("9:30 PM", "21:30"),
            ("2:30 pm", "14:30"),
            ("5 p.m.", "17:00"),
            ("12 a.m.", "00:00"),
            ("um 9:30 am Montag", "09:30"),  # German "am", not a.m.
        ],
    )
    def test_twelve_hour_times(self, text: str, key: str) -> None:
        assert [c.key for c in extract(text)] == [key]

    def test_all_number_words_up_to_twenty(self) -> None:
        assert [c.key for c in extract("vierzehn Tage, fourteen days, siebzehn Wochen")] == [
            "14 day",
            "14 day",
            "17 week",
        ]

    def test_lowercase_currency_code(self) -> None:
        assert [c.key for c in extract("usd 120")] == ["120 USD"]

    @pytest.mark.parametrize("text", ["120 Mio. €", "120 Millionen Euro", "€120 million"])
    def test_magnitude_words(self, text: str) -> None:
        assert [c.key for c in extract(text)] == ["1.2e+08 EUR"]

    def test_exact_title_beats_partial_title(self) -> None:
        sources = ValueSources(
            (
                ValueSource("Plan", "Budget 120.000 €."),
                ValueSource("Project Plan", "Budget 90.000 €."),
            )
        )
        report = verify("Das Budget beträgt 120.000 € [Quelle: Project Plan, 2026-03-01].", sources)
        assert [(c.status, c.source) for c in report.checks] == [("wrong_citation", "Plan")]

    def test_count_needs_the_counted_thing(self) -> None:
        assert statuses("Es gibt 3 kritische Blocker.") == [("3", "unsupported")]
        assert statuses("Heute stehen 3 Meetings an.") == [("3", "supported")]

    def test_text_may_not_add_a_year(self) -> None:
        sources = ValueSources((ValueSource("Notiz", "Abgabe am 31. März."),))
        assert [c.status for c in verify("Abgabe am 31. März 2030.", sources).checks] == [
            "unsupported"
        ]
        assert verify("Abgabe am 31. März.", sources).grounded
