import type { BriefingDetailResponse } from "@/types/api";

/**
 * Demo-Briefing, das bei Sync-Timeout (>2 min) oder LLM-Fehler als
 * Fallback angezeigt wird. Wird durch das echte Briefing ersetzt,
 * sobald es verfügbar ist.
 */
export const DEMO_BRIEFING: BriefingDetailResponse = {
  id: "demo-briefing",
  briefing_type: "morning",
  title: "Your First Morning Briefing (Demo)",
  content: `## Good morning! 👋

This is a **demo briefing** that shows you what your personal knowledge briefing will look like.

### Today's Overview

- **3 upcoming events** from your calendar
- **2 updated Notion pages** since yesterday
- **1 new Zoom transcript** with summary

### Next Event: Team Standup (10:00 AM)

Relevant information from your connected sources:

> *Last week, three new tasks related to the current sprint were created in the Notion workspace. Friday's Zoom recording includes a decision on the API architecture.*

### Project Update: PWBS MVP

Based on your Notion pages and calendar entries:

- Sprint progress: 7 of 12 tasks completed
- Next milestone: Beta launch in 2 weeks
- Open decision: Deployment strategy (ECS vs. Kubernetes)

### Recommended Actions

1. Review Friday's Zoom transcript (architecture decision)
2. Update the Notion roadmap (3 new tasks)
3. Prepare for the team standup meeting

---

*Once your data has been synced, this demo briefing will be replaced with your personal briefing.*`,
  source_chunks: [],
  source_entities: [],
  trigger_context: { demo: true },
  generated_at: new Date().toISOString(),
  expires_at: null,
  sources: [
    {
      chunk_id: "demo-source-1",
      doc_title: "Google Calendar – This Week's Events",
      source_type: "google_calendar",
      date: new Date().toISOString(),
      relevance: 0.95,
    },
    {
      chunk_id: "demo-source-2",
      doc_title: "Notion – Sprint Board",
      source_type: "notion",
      date: new Date().toISOString(),
      relevance: 0.88,
    },
    {
      chunk_id: "demo-source-3",
      doc_title: "Zoom – Team Meeting Transcript",
      source_type: "zoom",
      date: new Date().toISOString(),
      relevance: 0.82,
    },
  ],
};

/** Mindestverzögerung in ms, ab der das Demo-Briefing gezeigt wird */
export const DEMO_BRIEFING_TIMEOUT_MS = 120_000; // 2 Minuten
