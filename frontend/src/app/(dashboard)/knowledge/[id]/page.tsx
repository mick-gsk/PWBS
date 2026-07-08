"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  FolderKanban,
  Hash,
  FileText,
  Network,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useEntityDetail, useEntityDocuments } from "@/hooks/use-knowledge";
import { Spinner } from "@/components/ui/loading-states";
import { ErrorCard } from "@/components/ui/error-states";
import type { RelatedEntityItem, EntityDocumentItem } from "@/types/api";

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Users; color: string; label: string }
> = {
  Person: {
    icon: Users,
    color: "bg-indigo-100 text-indigo-800",
    label: "Person",
  },
  Project: {
    icon: FolderKanban,
    color: "bg-green-100 text-green-800",
    label: "Project",
  },
  Topic: { icon: Hash, color: "bg-amber-100 text-amber-800", label: "Topic" },
  Decision: {
    icon: FileText,
    color: "bg-red-100 text-red-800",
    label: "Decision",
  },
};

export default function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const {
    data: entity,
    isLoading: entityLoading,
    error: entityError,
    refetch: refetchEntity,
  } = useEntityDetail(id);

  const {
    data: documentsData,
    isLoading: docsLoading,
    error: docsError,
    refetch: refetchDocs,
  } = useEntityDocuments(id);

  if (entityLoading) {
    return (
      <div role="status" className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (entityError) {
    return (
      <ErrorCard
        message="Failed to load entity."
        onRetry={() => void refetchEntity()}
      />
    );
  }

  if (!entity) return null;

  const typeConfig = TYPE_CONFIG[entity.type] ?? {
    icon: Hash,
    color: "bg-surface-secondary text-text",
    label: entity.type,
  };
  const TypeIcon = typeConfig.icon;

  return (
    <div className="space-y-8">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${typeConfig.color}`}>
                <TypeIcon aria-hidden="true" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text">{entity.name}</h1>
                <p className="text-sm text-text-tertiary">
                  {typeConfig.label} · {entity.mention_count} mention
                  {entity.mention_count !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
          <Link
            href={`/knowledge?view=graph&entity=${encodeURIComponent(entity.id)}`}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Network aria-hidden="true" className="h-4 w-4" />
            View in graph
          </Link>
        </div>
      </div>

      {/* Timeline */}
      {(entity.first_seen || entity.last_seen) && (
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text">
            <Calendar aria-hidden="true" className="h-5 w-5" />
            Timeline
          </h2>
          <div className="flex gap-8">
            {entity.first_seen && (
              <div>
                <p className="text-xs font-medium uppercase text-text-tertiary">
                  First seen
                </p>
                <p className="text-sm font-medium text-text">
                  {new Date(entity.first_seen).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {entity.last_seen && (
              <div>
                <p className="text-xs font-medium uppercase text-text-tertiary">
                  Last seen
                </p>
                <p className="text-sm font-medium text-text">
                  {new Date(entity.last_seen).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related entities */}
      {entity.related_entities.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text">
            Related entities ({entity.related_entities.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entity.related_entities.map((rel: RelatedEntityItem) => {
              const relConfig = TYPE_CONFIG[rel.type] ?? {
                icon: Hash,
                color: "bg-surface-secondary text-text",
                label: rel.type,
              };
              const RelIcon = relConfig.icon;
              return (
                <Link
                  key={rel.id}
                  href={`/knowledge/${encodeURIComponent(rel.id)}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-surface-secondary transition-colors"
                >
                  <div className={`rounded-md p-1.5 ${relConfig.color}`}>
                    <RelIcon aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text">{rel.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {rel.relation ?? relConfig.label} · {rel.mention_count}{" "}
                      mention
                      {rel.mention_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text">
          <FileText aria-hidden="true" className="h-5 w-5" />
          Related documents
          {documentsData && (
            <span className="text-sm font-normal text-text-tertiary">
              ({documentsData.total})
            </span>
          )}
        </h2>

        {docsLoading && (
          <div role="status" className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
            <span className="sr-only">Loading</span>
          </div>
        )}

        {docsError && (
          <ErrorCard
            message="Failed to load documents."
            onRetry={() => void refetchDocs()}
          />
        )}

        {documentsData && documentsData.documents.length === 0 && (
          <p className="text-sm text-text-tertiary">
            No related documents found.
          </p>
        )}

        {documentsData && documentsData.documents.length > 0 && (
          <div className="divide-y divide-border">
            {documentsData.documents.map((doc: EntityDocumentItem) => (
              <Link
                key={doc.id}
                href={`/documents/${encodeURIComponent(doc.id)}`}
                className="flex items-center justify-between py-3 hover:bg-surface-secondary -mx-2 px-2 rounded transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">
                    {doc.title ?? "Untitled document"}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {doc.source_type} ·{" "}
                    {new Date(doc.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>
                <ExternalLink
                  aria-hidden="true"
                  className="h-4 w-4 flex-shrink-0 text-text-tertiary"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
