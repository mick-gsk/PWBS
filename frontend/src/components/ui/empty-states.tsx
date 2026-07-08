"use client";

import Link from "next/link";
import {
  FileText,
  Search,
  Database,
  Plug,
  Cable,
  Network,
  Gavel,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

function CtaLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
    >
      {children}
      <ArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-12 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-secondary text-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="mb-1 text-sm font-semibold text-text">{title}</h3>
      {description && (
        <p className="mx-auto max-w-md text-sm text-text-secondary">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function EmptyDashboard() {
  return (
    <EmptyState
      icon={<Plug className="h-6 w-6" />}
      title="Your knowledge system is ready"
      description="Connect your first data source and PWBS will automatically create a daily context briefing for your workday."
      action={<CtaLink href="/connectors">Connect your first source</CtaLink>}
    />
  );
}

export function EmptyBriefings() {
  return (
    <EmptyState
      icon={<FileText className="h-6 w-6" />}
      title="No briefings yet"
      description="Briefings are generated automatically every morning once at least one data source is connected. You can also request a briefing manually at any time."
      action={<CtaLink href="/connectors">Connect a data source</CtaLink>}
    />
  );
}

export function EmptyConnectors() {
  return (
    <EmptyState
      icon={<Cable className="h-6 w-6" />}
      title="Connect your tools to PWBS"
      description="PWBS can import data from Google Calendar, Notion, Zoom, and Obsidian. The more sources you connect, the more helpful your briefings and search become."
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={<Search className="h-6 w-6" />}
      title="No results found"
      description="Try different terms or less specific filters. PWBS searches all your connected sources semantically \u2013 feel free to ask your question in natural language."
    />
  );
}

export function EmptySearchNoDocuments() {
  return (
    <EmptyState
      icon={<Search className="h-6 w-6" />}
      title="No documents yet"
      description="Connect a data source so PWBS can index your content and make it searchable. Search becomes available automatically once your first documents have been processed."
      action={<CtaLink href="/connectors">Connect a data source</CtaLink>}
    />
  );
}

export function EmptyDocuments() {
  return (
    <EmptyState
      icon={<FileText className="h-6 w-6" />}
      title="No documents yet"
      description="Connect a data source to import documents."
      action={<CtaLink href="/connectors">Connect a data source</CtaLink>}
    />
  );
}

export function EmptyEntities() {
  return (
    <EmptyState
      icon={<Network className="h-6 w-6" />}
      title="Your knowledge graph builds itself"
      description="As PWBS processes documents, it automatically detects people, projects, and topics and links them together. Connect more sources to build a richer knowledge network."
      action={<CtaLink href="/connectors">Manage sources</CtaLink>}
    />
  );
}

export function EmptyDecisions() {
  return (
    <EmptyState
      icon={<Gavel className="h-6 w-6" />}
      title="No decisions captured yet"
      description="PWBS extracts decisions from your meeting transcripts and notes. Connect Zoom or Notion to detect decisions automatically."
      action={<CtaLink href="/connectors">Connect a data source</CtaLink>}
    />
  );
}

export function EmptyProjects() {
  return (
    <EmptyState
      icon={<FolderKanban className="h-6 w-6" />}
      title="No projects detected yet"
      description="PWBS detects projects automatically from your data sources. Connect Google Calendar and Notion to discover projects and how they relate."
      action={<CtaLink href="/connectors">Connect a data source</CtaLink>}
    />
  );
}
