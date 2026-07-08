"use client";

import { useState } from "react";
import {
  Loader2,
  Database,
  Cpu,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDataReport, useLlmUsage } from "@/hooks/use-settings";
import type { LlmUsageEntry } from "@/types/api";

function formatDate(iso: string | null): string {
  if (!iso) return "\u2013";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function SourceCard({
  source,
}: {
  source: {
    source_type: string;
    document_count: number;
    oldest_document: string | null;
    newest_document: string | null;
  };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-text">
            {source.source_type}
          </span>
        </div>
        <span className="text-lg font-bold text-text">
          {source.document_count}
        </span>
      </div>
      <div className="mt-2 text-xs text-text-tertiary">
        <div>
          {"Oldest: "}
          {formatDate(source.oldest_document)}
        </div>
        <div>Newest: {formatDate(source.newest_document)}</div>
      </div>
    </div>
  );
}

function LlmUsageTable({ entries }: { entries: LlmUsageEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">
        No LLM calls logged.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 text-left font-medium text-text-secondary">
              Time
            </th>
            <th className="py-2 text-left font-medium text-text-secondary">
              Provider
            </th>
            <th className="py-2 text-left font-medium text-text-secondary">
              Model
            </th>
            <th className="py-2 text-right font-medium text-text-secondary">
              Input
            </th>
            <th className="py-2 text-right font-medium text-text-secondary">
              Output
            </th>
            <th className="py-2 text-left font-medium text-text-secondary">
              Purpose
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.id}
              className="border-b border-border"
            >
              <td className="py-2 text-text-secondary">
                {formatDate(e.created_at)}
              </td>
              <td className="py-2 text-text-secondary">
                {e.provider}
              </td>
              <td className="py-2 text-text-secondary">
                {e.model}
              </td>
              <td className="py-2 text-right text-text-secondary">
                {formatTokens(e.input_tokens)}
              </td>
              <td className="py-2 text-right text-text-secondary">
                {formatTokens(e.output_tokens)}
              </td>
              <td className="py-2 text-text-tertiary">
                {e.purpose}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataTransparencyPage() {
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useDataReport();
  const { data: llmUsage, isLoading: llmLoading } = useLlmUsage({ limit: 50 });
  const [llmExpanded, setLlmExpanded] = useState(false);

  if (reportLoading) {
    return (
      <div role="status" className="flex items-center justify-center py-12">
        <Loader2
          aria-hidden="true"
          className="h-8 w-8 animate-spin text-text-tertiary"
        />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-red-500">
          Failed to load transparency report.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          Data transparency
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {
            "Overview of your stored data and AI usage (GDPR Art. 15)."
          }
        </p>
      </div>

      {/* Document overview */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database aria-hidden="true" className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-text">
            Documents ({report?.total_documents ?? 0} total)
          </h2>
        </div>
        {report && report.sources.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.sources.map((s) => (
              <SourceCard key={s.source_type} source={s} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">No documents available.</p>
        )}
      </section>

      {/* Connections */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw aria-hidden="true" className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-text">
            Connections
          </h2>
        </div>
        {report && report.connections.length > 0 ? (
          <div className="space-y-2">
            {report.connections.map((c) => (
              <div
                key={c.source_type}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
              >
                <span className="font-medium text-text">
                  {c.source_type}
                </span>
                <div className="flex items-center gap-4 text-sm text-text-tertiary">
                  <span
                    className={
                      c.status === "active"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }
                  >
                    {c.status}
                  </span>
                  <span>Last sync: {formatDate(c.last_sync)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            No connections configured.
          </p>
        )}
      </section>

      {/* LLM Provider Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Cpu aria-hidden="true" className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-text">
            AI usage (summary)
          </h2>
        </div>
        {report && report.llm_provider_usage.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {report.llm_provider_usage.map((u) => (
              <div
                key={`${u.provider}-${u.model}`}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="font-medium text-text">
                  {u.provider} / {u.model}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-text-tertiary">
                  <div>
                    <span className="block text-xs">Calls</span>
                    <span className="font-semibold text-text">
                      {u.call_count}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs">Input tokens</span>
                    <span className="font-semibold text-text">
                      {formatTokens(u.total_input_tokens)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs">Output tokens</span>
                    <span className="font-semibold text-text">
                      {formatTokens(u.total_output_tokens)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            No AI calls logged.
          </p>
        )}
      </section>

      {/* LLM Audit Log (expandable) */}
      <section>
        <button
          onClick={() => setLlmExpanded(!llmExpanded)}
          aria-expanded={llmExpanded}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-surface p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Cpu aria-hidden="true" className="h-5 w-5 text-purple-600" />
            <span className="text-lg font-semibold text-text">
              LLM audit log ({llmUsage?.total ?? 0} entries)
            </span>
          </div>
          {llmExpanded ? (
            <ChevronUp aria-hidden="true" className="h-5 w-5 text-text-tertiary" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-5 w-5 text-text-tertiary" />
          )}
        </button>
        {llmExpanded && (
          <div className="mt-2 rounded-lg border border-border bg-surface p-4">
            {llmLoading ? (
              <div role="status">
                <Loader2
                  aria-hidden="true"
                  className="h-6 w-6 animate-spin text-text-tertiary"
                />
                <span className="sr-only">Loading</span>
              </div>
            ) : (
              <LlmUsageTable entries={llmUsage?.entries ?? []} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
