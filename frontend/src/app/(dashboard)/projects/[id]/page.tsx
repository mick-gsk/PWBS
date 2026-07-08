"use client";

import { useParams, useRouter } from "next/navigation";
import { FileText, Loader2, ArrowLeft } from "lucide-react";
import { useGenerateBriefing, useBriefingList } from "@/hooks/use-briefings";
import type { BriefingListItem } from "@/types/api";
import Link from "next/link";

function ProjectBriefingCard({ item }: { item: BriefingListItem }) {
  return (
    <Link
      href={`/briefings/${item.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm"
    >
      <FileText className="h-5 w-5 flex-shrink-0 text-indigo-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">
          {item.title}
        </p>
        <p className="mt-0.5 text-xs text-text-tertiary">
          {new Date(item.generated_at).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </Link>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectName = decodeURIComponent(params.id);

  const generate = useGenerateBriefing();
  const { data: briefings, isLoading } = useBriefingList({
    type: "project",
    limit: 20,
  });

  const projectBriefings = briefings?.briefings.filter((b) =>
    b.title.toLowerCase().includes(projectName.toLowerCase()),
  );

  const handleGenerate = () => {
    generate.mutate({
      type: "project",
      trigger_context: {
        project_name: projectName,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-text">{projectName}</h1>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">
              Project Briefing
            </h2>
            <p className="mt-1 text-sm text-text-tertiary">
              On-demand briefing with decisions, timeline, and stakeholders.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {generate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Briefing
              </>
            )}
          </button>
        </div>

        {generate.isSuccess && (
          <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
            Your briefing is being generated in the background. It will appear
            below shortly.
          </div>
        )}

        {generate.isError && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            Failed to generate briefing. Please try again later.
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">
          Previous Project Briefings
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
          </div>
        ) : projectBriefings && projectBriefings.length > 0 ? (
          <div className="space-y-2">
            {projectBriefings.map((item) => (
              <ProjectBriefingCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-text-tertiary">
              No briefings for this project yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
