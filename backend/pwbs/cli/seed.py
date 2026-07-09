"""Seed-Data-Generator: realistic demo data for PWBS (TASK-198).

Creates a demo user and 50 documents across all 4 core connectors
(Google Calendar, Notion, Obsidian, Zoom). The data is inserted into
PostgreSQL and can be cleaned up with ``--clean``.

Weaviate indexing and embedding generation are triggered separately
via the processing pipeline (``python -m pwbs.cli seed`` writes DB
records; a subsequent sync or scheduled job produces embeddings).

Usage::

    python -m pwbs.cli seed
    python -m pwbs.cli seed --user demo@pwbs.dev --documents 50
    python -m pwbs.cli seed --clean
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import sys
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

logger = logging.getLogger(__name__)

# Fixed UUID for deterministic demo user (idempotent).
DEMO_USER_ID = uuid.UUID("00000000-0000-4000-a000-000000000001")
DEMO_PASSWORD = "DemoPwbs2026!"  # only for local dev

# ---------------------------------------------------------------------------
# Document templates (English, realistic knowledge-worker content)
# ---------------------------------------------------------------------------

_CALENDAR_EVENTS = [
    (
        "Product Sync with Team Alpha",
        "Discuss progress on the API migration. Thomas has concerns about backward compatibility.",
    ),
    (
        "1:1 with Team Lead Maria",
        "Prepare the quarterly review. Collect feedback on the new onboarding process.",
    ),
    (
        "Sprint Retrospective Q1",
        "What went well: deployment automation. Review action items from the last retro.",
    ),
    (
        "Architecture Review: Microservices",
        "Decide whether to keep the monolithic architecture or migrate to microservices.",
    ),
    (
        "Client Demo Project Phoenix",
        "Present the new dashboard feature. Live demo of real-time data visualization.",
    ),
    (
        "DevOps Workshop: Kubernetes Basics",
        "Introduction to container orchestration. Hands-on with kubectl.",
    ),
    (
        "Budget Planning 2026 H2",
        "Optimize cloud costs. New tooling investments: monitoring, testing.",
    ),
    (
        "Onboarding: New Developer Sarah",
        "Set up the development environment. Explain the Git workflow.",
    ),
    (
        "Security Audit Preparation",
        "Go through the OWASP Top 10 checklist. Check GDPR compliance status.",
    ),
    (
        "Quarterly OKR Review",
        "Discuss objectives and key results for Q2. Analyze team velocity.",
    ),
    (
        "Stakeholder Presentation ML Pipeline",
        "Present the results of the ML PoC. Walk through the ROI calculation.",
    ),
    ("Pair Programming Session: Auth Module", "Implement JWT refresh token logic with Sarah."),
    ("Team Standup Week 12", "Blocker: CI/CD pipeline unstable. Sarah takes over the deployment fix."),
]

_NOTION_PAGES = [
    (
        "Project Plan Q2 2026",
        "## Milestones\n- MVP launch: April 15\n- Beta test: May 1\n- GA release: June 15\n\n## Risks\n- Dependency on external API provider\n- Staffing shortage in the frontend team",
    ),
    (
        "Meeting Notes: Architecture Board",
        "### Decision\nThe modular monolith stays. Service split not before Phase 3.\n\n### Rationale\n- Team size does not justify microservice overhead\n- Latency benefits of in-process communication",
    ),
    (
        "GDPR Checklist Data Processing",
        "- [x] Privacy policy updated\n- [x] Data processing agreement with cloud provider\n- [ ] Implement cookie banner\n- [ ] Document data deletion policy",
    ),
    (
        "Onboarding Guide for New Developers",
        "## Day 1\n1. Set up laptop\n2. Git access and branch conventions\n3. Start Docker Compose\n\n## Day 2\n1. Backend code walkthrough\n2. Pair programming with mentor",
    ),
    (
        "API Design Guidelines",
        "## Versioning\nAll endpoints under `/api/v1/`. Breaking changes require a new version.\n\n## Pagination\nCursor-based with `after` parameter. Maximum 100 items per page.",
    ),
    (
        "Sprint Review Results W11",
        "### Completed Stories\n- TASK-142: Briefing generation optimized\n- TASK-145: Search API with hybrid mode\n\n### Open Items\n- Performance test still pending",
    ),
    (
        "Technical Debt Backlog",
        "| Technical Debt | Priority | Effort |\n|---|---|---|\n| Migrate legacy auth | High | 3 days |\n| Increase test coverage | Medium | 5 days |",
    ),
    (
        "Incident Report: API Outage 2026-03-10",
        "## Timeline\n- 14:23 Alert triggered\n- 14:25 On-call notified\n- 14:40 Root cause identified: DB connection pool exhausted\n- 14:55 Fix deployed, service available again",
    ),
    (
        "Knowledge Management Strategy",
        "## Vision\nEvery employee finds relevant knowledge in under 30 seconds.\n\n## Initiatives\n1. Central knowledge base system (PWBS)\n2. Automatic briefings before meetings",
    ),
    (
        "Performance Benchmarks Q1",
        "| Metric | Target | Actual |\n|---|---|---|\n| API P95 latency | <200ms | 145ms |\n| Search P95 | <500ms | 380ms |\n| Briefing generation | <5s | 3.2s |",
    ),
    (
        "Code Review Guidelines",
        "## Mandatory Checks\n1. Complete typing (no `Any`)\n2. owner_id filter in every DB query\n3. Idempotent writes (UPSERT instead of INSERT)\n4. No secrets in code",
    ),
    (
        "Roadmap 2026 H2",
        "## Focus\n- Connectors: Gmail, Slack, Outlook\n- Knowledge graph: deepen Neo4j integration\n- Enterprise: SSO, RBAC, multi-tenancy",
    ),
]

_OBSIDIAN_NOTES = [
    (
        "Thoughts on Knowledge Work",
        "The biggest challenge in modern knowledge work is not the lack of information but its fragmentation. Notes in 5 different tools, meetings without context, decisions nobody documents.",
    ),
    (
        "Ideas for Briefing Improvements",
        "- Include context from previous meetings\n- Project timeline as a visual component\n- Automatic detection of decisions vs. open questions",
    ),
    (
        "Reflection: Team Dynamics Q1",
        "The team has really gelled. Sarah brings fresh energy to code reviews. Thomas' concerns about the architecture were justified and saved us from an expensive refactoring.",
    ),
    (
        "Study Notes: Vector Databases",
        "## Concepts\n- HNSW index: Hierarchical Navigable Small World\n- Cosine similarity vs. Euclidean distance\n- Hybrid search: combination of vector and keyword search\n\nWeaviate uses HNSW by default.",
    ),
    (
        "Book Notes: Team Topologies",
        "Four team types: stream-aligned, enabling, complicated subsystem, platform.\nOur backend crew is stream-aligned. The DevOps team is a platform team. Define clear boundaries!",
    ),
    (
        "Daily Note 2026-03-15",
        "Productive day. Briefing feature almost done. Search relevance still needs tuning. Evening: read a paper on RAG architectures.",
    ),
    (
        "Weekly Review W11",
        "- Success: implemented E2E pipeline test\n- Learned: the circuit breaker pattern saves a lot of debugging time\n- Next week: finish the GDPR export",
    ),
    (
        "Meeting Prep: Investor Update",
        "## Key Metrics\n- MAU: 47 early adopters\n- Retention 30d: 78%\n- NPS: 62\n\n## Highlights\n- Hybrid search 3x faster than GPT-only\n- GDPR compliance complete",
    ),
    (
        "Technical Vision 2027",
        "Long term: PWBS as a personal operating system for knowledge work. Not just search, but proactive contextualization. The knowledge graph becomes the central thinking structure.",
    ),
    (
        "Debugging Notes: Memory Leak",
        "Problem: Weaviate client keeps connections open.\nSolution: connection pool with max_connections=10 and idle_timeout=300s.\nLearned: always use async context managers!",
    ),
    (
        "Recipe: A Good Standup",
        "1. Max 15 minutes\n2. Everyone: what yesterday, what today, blockers\n3. Take details offline\n4. Standup note automatically goes to the wiki",
    ),
    (
        "Prompt Engineering Notes",
        "- Enforce structured output with JSON schema\n- Temperature 0.3 for factual content\n- Always append source references as a separate list",
    ),
]

_ZOOM_TRANSCRIPTS = [
    (
        "Sprint Planning - Transcript",
        "Moderator: Ok, let's go through the stories for Sprint 12. Thomas, can you estimate TASK-201? Thomas: I'd say M, so 2-3 days. The reranker needs solid benchmarking. Maria: Agreed. Sarah, will you take TASK-202? Sarah: Yes, the GDPR export is clearly defined. I'd estimate S.",
    ),
    (
        "Architecture Discussion Transcript",
        "Lena: The question is whether we need Neo4j in the MVP. Thomas: I'd argue for optional. We can fall back to NullGraphService. Maria: Good point. Then we'll make it optional with a Docker profile.",
    ),
    (
        "Retro Transcript W10",
        "Facilitator: What went well? Sarah: The new unit tests caught 3 bugs during the refactoring. Thomas: CI/CD is stable now. What could be better? Maria: Code reviews sometimes take 3 days. Proposal: a 24h SLA.",
    ),
    (
        "Customer Interview Transcript",
        "Interviewer: How do you currently manage your knowledge? Customer: Honestly, not systematically at all. Notion for notes, Google Calendar for appointments, Slack for communication. None of it is connected.",
    ),
    (
        "Standup Summary Transcript",
        "Sarah: Finished TASK-200 yesterday, starting TASK-202 today. Blocker: I need access to the test mail server. Thomas: I'm continuing to work on search relevance. No blockers. Maria: I'm in a client call until 2pm.",
    ),
    (
        "Tech Talk: Embedding Models",
        "Speaker: Sentence Transformers work well for multilingual text. We use paraphrase-multilingual-MiniLM-L12-v2. Question: How is the performance? Speaker: ~50ms per embedding on GPU, ~200ms on CPU.",
    ),
    (
        "Project Phoenix Status Meeting",
        "PM: We're on schedule. The MVP is 85% complete. Open items: search tuning and GDPR export. Both are planned for this week. Risk: the frontend redesign could slip.",
    ),
    (
        "1:1 Maria-Thomas Transcript",
        "Maria: How are you doing with the new architecture? Thomas: Good. The modular monolith was the right decision. The clear module boundaries help enormously. Maria: Glad to hear it. And Sarah's onboarding? Thomas: She's great. Already implemented the circuit breaker on her own.",
    ),
]


def _content_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def _doc_id(source_type: str, index: int) -> uuid.UUID:
    """Deterministic UUID for a seed document (idempotent)."""
    return uuid.uuid5(DEMO_USER_ID, f"{source_type}:{index}")


def generate_documents(
    user_id: uuid.UUID,
    count: int,
) -> list[dict[str, Any]]:
    """Build a list of document dicts ready for bulk insert."""
    docs: list[dict[str, Any]] = []
    now = datetime.now(tz=UTC)
    sources = [
        ("google_calendar", _CALENDAR_EVENTS),
        ("notion", _NOTION_PAGES),
        ("obsidian", _OBSIDIAN_NOTES),
        ("zoom", _ZOOM_TRANSCRIPTS),
    ]

    # Per-source template counters so each connector cycles through its own
    # templates independently — this yields unique documents until a source's
    # template pool is exhausted, instead of duplicating early on a shared index.
    per_source_count = {source_type: 0 for source_type, _ in sources}
    idx = 0
    while len(docs) < count:
        for source_type, templates in sources:
            if len(docs) >= count:
                break
            i = per_source_count[source_type]
            tpl_idx = i % len(templates)
            title, content = templates[tpl_idx]

            # Make each document unique even when cycling
            cycle = i // len(templates)
            if cycle > 0:
                title = f"{title} (#{cycle + 1})"
                content = f"{content}\n\n[Repeat {cycle + 1}]"

            doc_id = _doc_id(source_type, i)
            docs.append(
                {
                    "id": doc_id,
                    "user_id": user_id,
                    "source_type": source_type,
                    "source_id": f"seed-{source_type}-{i:04d}",
                    "title": title,
                    "content": content,
                    "content_hash": _content_hash(content),
                    "language": "en",
                    "chunk_count": 0,
                    "processing_status": "pending",
                    "visibility": "private",
                    "created_at": now - timedelta(days=count - idx),
                    "updated_at": now,
                }
            )
            per_source_count[source_type] = i + 1
            idx += 1

    # Today's calendar events (created_at = today) so the morning briefing's
    # "Today's Agenda" is populated. Participants use the "Participants:" line
    # the context assembler parses. Indices are offset (9000+) to avoid
    # colliding with the cycled events above.
    today_events = [
        (
            "Team Standup",
            "09:00",
            "Participants: Sarah, Thomas, Maria\n"
            "Daily sync. Blockers: CI/CD pipeline still flaky. Sarah needs access "
            "to the test mail server. Review the 2 open action items from the sprint retro.",
        ),
        (
            "Architecture Review: Microservices vs. Monolith",
            "11:30",
            "Participants: Thomas, Lena, Maria\n"
            "Decide whether to keep the modular monolith or start the service split. "
            "Thomas favours staying monolithic until Phase 3; Lena wants Neo4j kept optional.",
        ),
        (
            "1:1 with Sarah - Onboarding Check-in",
            "15:00",
            "Participants: Sarah\n"
            "Review onboarding progress. Sarah implemented the JWT refresh-token logic "
            "and the circuit breaker. Next: pair on the GDPR export module.",
        ),
    ]
    for offset, (title, time_str, content) in enumerate(today_events):
        event_idx = 9000 + offset
        # Encode the start time in created_at so the agenda shows a sensible hour.
        hour, minute = (int(x) for x in time_str.split(":"))
        start_at = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        docs.append(
            {
                "id": _doc_id("google_calendar", event_idx),
                "user_id": user_id,
                "source_type": "google_calendar",
                "source_id": f"seed-google_calendar-{event_idx:04d}",
                "title": title,
                "content": content,
                "content_hash": _content_hash(content),
                "language": "en",
                "chunk_count": 0,
                "processing_status": "pending",
                "visibility": "private",
                "created_at": start_at,
                "updated_at": now,
            }
        )

    return docs


async def _seed_async(
    user_email: str,
    document_count: int,
    database_url: str,
) -> None:
    """Core async seed logic."""
    from sqlalchemy.ext.asyncio import async_sessionmaker

    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session, session.begin():
            # 1. Upsert demo user
            from pwbs.models.user import User
            from pwbs.services.user import _generate_encrypted_dek, hash_password

            existing = await session.execute(select(User).where(User.id == DEMO_USER_ID))
            user = existing.scalar_one_or_none()

            if user is None:
                user = User(
                    id=DEMO_USER_ID,
                    email=user_email,
                    display_name="Demo User",
                    password_hash=hash_password(DEMO_PASSWORD),
                    encryption_key_enc=_generate_encrypted_dek(),
                )
                session.add(user)
                await session.flush()
                print(f"Created demo user: {user_email} (ID: {DEMO_USER_ID})")
            else:
                print(f"Demo user already exists: {user.email} (ID: {DEMO_USER_ID})")

            # 2. Delete existing seed documents (idempotent)
            from pwbs.models.document import Document

            del_result = await session.execute(
                delete(Document).where(
                    Document.user_id == DEMO_USER_ID,
                    Document.source_id.like("seed-%"),
                )
            )
            if del_result.rowcount:
                print(f"Cleaned {del_result.rowcount} existing seed documents")

            # 3. Insert new documents
            docs = generate_documents(DEMO_USER_ID, document_count)
            # Strip fields not in DB model (content is for display/test only;
            # created_at/updated_at are auto-generated by SQLAlchemy)
            db_columns = {c.name for c in Document.__table__.columns}
            for doc_dict in docs:
                filtered = {k: v for k, v in doc_dict.items() if k in db_columns}
                session.add(Document(**filtered))

            print(f"Inserted {len(docs)} documents across 4 connectors")

            # Summary
            for st in ("google_calendar", "notion", "obsidian", "zoom"):
                n = sum(1 for d in docs if d["source_type"] == st)
                print(f"  - {st}: {n}")

        print("\nSeed complete. Run processing pipeline to generate embeddings.")
    finally:
        await engine.dispose()


async def _clean_async(database_url: str) -> None:
    """Remove all demo data."""
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from pwbs.models.document import Document
    from pwbs.models.user import User

    engine = create_async_engine(database_url, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session, session.begin():
            # Delete documents first (FK constraint)
            doc_result = await session.execute(
                delete(Document).where(Document.user_id == DEMO_USER_ID)
            )
            print(f"Deleted {doc_result.rowcount} demo documents")

            # Delete demo user
            user_result = await session.execute(delete(User).where(User.id == DEMO_USER_ID))
            if user_result.rowcount:
                print(f"Deleted demo user (ID: {DEMO_USER_ID})")
            else:
                print("Demo user not found (already clean)")

        print("Clean complete.")
    finally:
        await engine.dispose()


def run_seed(
    user_email: str = "demo@pwbs.dev",
    document_count: int = 50,
    clean: bool = False,
) -> None:
    """Entry point called from ``pwbs.cli.__main__``."""
    from pwbs.core.config import get_settings

    settings = get_settings()
    db_url = settings.database_url

    if not db_url:
        print("ERROR: DATABASE_URL not configured.", file=sys.stderr)
        sys.exit(1)

    if clean:
        asyncio.run(_clean_async(db_url))
    else:
        asyncio.run(_seed_async(user_email, document_count, db_url))
