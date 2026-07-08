"use client";

import { useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  FolderKanban,
  Hash,
  ChevronLeft,
  ChevronRight,
  Network,
  List,
  Gavel,
  Target,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { useEntities, useGraph } from "@/hooks/use-knowledge";
import { ForceGraph, GraphLegend } from "@/components/knowledge/force-graph";
import { Spinner } from "@/components/ui/loading-states";
import { ErrorCard } from "@/components/ui/error-states";
import { EmptyEntities } from "@/components/ui/empty-states";
import type { EntityListItem } from "@/types/api";

const ENTITY_TYPES = [
  { value: "", label: "All", icon: Hash },
  { value: "Person", label: "People", icon: Users },
  { value: "Project", label: "Projects", icon: FolderKanban },
  { value: "Topic", label: "Topics", icon: Hash },
  { value: "Decision", label: "Decisions", icon: Gavel },
  { value: "Goal", label: "Goals", icon: Target },
  { value: "Risk", label: "Risks", icon: AlertTriangle },
  { value: "Hypothesis", label: "Hypotheses", icon: Lightbulb },
  { value: "OpenQuestion", label: "Open Questions", icon: HelpCircle },
] as const;

const PAGE_SIZE = 20;

type ViewMode = "list" | "graph";

function KnowledgeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams.get("type") ?? "";
  const initialPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialView = (searchParams.get("view") ?? "list") as ViewMode;

  const [typeFilter, setTypeFilter] = useState(initialType);
  const [page, setPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [graphEntityId, setGraphEntityId] = useState<string | undefined>(
    searchParams.get("entity") ?? undefined,
  );
  const [graphDepth, setGraphDepth] = useState(2);

  // Entity list query
  const {
    data: entityData,
    isLoading: entitiesLoading,
    error: entitiesError,
    refetch: refetchEntities,
  } = useEntities({
    type: typeFilter || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  // Graph query
  const {
    data: graphData,
    isLoading: graphLoading,
    error: graphError,
  } = useGraph({
    depth: graphDepth,
    entity_id: graphEntityId,
  });

  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      router.replace(`/knowledge?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
    updateUrl({ type, page: "" });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: newPage > 1 ? String(newPage) : "" });
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    updateUrl({ view: mode });
  };

  const handleGraphNodeClick = (nodeId: string) => {
    setGraphEntityId(nodeId);
    updateUrl({ entity: nodeId });
  };

  const totalPages = entityData ? Math.ceil(entityData.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Knowledge Explorer</h1>
          <p className="mt-1 text-text-tertiary">
            Explore entities, relationships, and the knowledge graph
          </p>
        </div>

        {/* View toggle */}
        <div
          role="group"
          aria-label="View"
          className="flex items-center gap-1 rounded-lg border border-border p-1"
        >
          <button
            onClick={() => handleViewChange("list")}
            aria-pressed={viewMode === "list"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "text-text-secondary hover:text-text"
            }`}
          >
            <List aria-hidden="true" className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => handleViewChange("graph")}
            aria-pressed={viewMode === "graph"}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "graph"
                ? "bg-indigo-600 text-white"
                : "text-text-secondary hover:text-text"
            }`}
          >
            <Network aria-hidden="true" className="h-4 w-4" />
            Graph
          </button>
        </div>
      </div>

      {/* ─── List View ─── */}
      {viewMode === "list" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3">
            {ENTITY_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleTypeChange(value)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  typeFilter === value
                    ? "bg-indigo-600 text-white"
                    : "bg-surface-secondary text-text-secondary hover:bg-indigo-50"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
              </button>
            ))}
            {entityData && (
              <span className="ml-auto text-sm text-text-tertiary">
                {entityData.total}{" "}
                {entityData.total !== 1 ? "entities" : "entity"}
              </span>
            )}
          </div>

          {/* Entity list */}
          {entitiesLoading && (
            <div role="status" className="flex justify-center py-20">
              <Spinner className="h-8 w-8" />
              <span className="sr-only">Loading</span>
            </div>
          )}

          {entitiesError && (
            <ErrorCard
              message="Failed to load entities."
              onRetry={() => void refetchEntities()}
            />
          )}

          {entityData && entityData.entities.length === 0 && <EmptyEntities />}

          {entityData && entityData.entities.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Mentions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-tertiary">
                      Last seen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entityData.entities.map((entity: EntityListItem) => (
                    <EntityRow key={entity.id} entity={entity} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-text-tertiary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── Graph View ─── */}
      {viewMode === "graph" && (
        <div className="space-y-4">
          {/* Graph controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="graph-depth"
                className="text-sm font-medium text-text-secondary"
              >
                Depth:
              </label>
              <select
                id="graph-depth"
                value={graphDepth}
                onChange={(e) => setGraphDepth(Number(e.target.value))}
                className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
            {graphEntityId && (
              <button
                onClick={() => {
                  setGraphEntityId(undefined);
                  updateUrl({ entity: "" });
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Show full graph
              </button>
            )}
            <GraphLegend />
          </div>

          {/* Graph canvas */}
          {graphLoading && (
            <div role="status" className="flex justify-center py-20">
              <Spinner className="h-8 w-8" />
              <span className="sr-only">Loading</span>
            </div>
          )}

          {graphError && (
            <ErrorCard message="Failed to load graph." />
          )}

          {graphData && graphData.nodes.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <Network
                aria-hidden="true"
                className="mx-auto h-12 w-12 text-text-tertiary"
              />
              <h3 className="mt-2 text-sm font-medium text-text">
                No graph data
              </h3>
              <p className="mt-1 text-sm text-text-tertiary">
                No entities or relationships have been extracted yet.
              </p>
            </div>
          )}

          {graphData && graphData.nodes.length > 0 && (
            <ForceGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={handleGraphNodeClick}
              width={1000}
              height={600}
            />
          )}

          {/* Show entity info below graph when entity selected */}
          {graphEntityId && graphData && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-text">
                    {graphData.nodes.find((n) => n.id === graphEntityId)
                      ?.name ?? "Entity"}
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    Type:{" "}
                    {graphData.nodes.find((n) => n.id === graphEntityId)?.type}
                  </p>
                </div>
                <Link
                  href={`/knowledge/${encodeURIComponent(graphEntityId)}`}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  View details
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EntityRow({ entity }: { entity: EntityListItem }) {
  const typeLabel: Record<string, string> = {
    Person: "Person",
    Project: "Project",
    Topic: "Topic",
    Decision: "Decision",
  };

  const typeColor: Record<string, string> = {
    Person: "bg-indigo-100 text-indigo-800",
    Project: "bg-green-100 text-green-800",
    Topic: "bg-amber-100 text-amber-800",
    Decision: "bg-red-100 text-red-800",
  };

  return (
    <tr className="hover:bg-surface-secondary transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/knowledge/${encodeURIComponent(entity.id)}`}
          className="font-medium text-text hover:text-indigo-600"
        >
          {entity.name}
        </Link>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            typeColor[entity.type] ?? "bg-surface-secondary text-text"
          }`}
        >
          {typeLabel[entity.type] ?? entity.type}
        </span>
      </td>
      <td className="px-6 py-4 text-right text-sm text-text-secondary">
        {entity.mention_count}
      </td>
      <td className="px-6 py-4 text-right text-sm text-text-tertiary">
        {entity.last_seen
          ? new Date(entity.last_seen).toLocaleDateString("en-US")
          : "–"}
      </td>
    </tr>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <KnowledgeContent />
    </Suspense>
  );
}
