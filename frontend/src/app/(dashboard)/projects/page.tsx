"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

import { EmptyProjects } from "@/components/ui/empty-states";

export default function ProjectsPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (trimmed) {
      router.push(`/projects/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Projects</h1>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-2 text-lg font-semibold text-text">
          Create Project Briefing
        </h2>
        <p className="mb-4 text-sm text-text-tertiary">
          Enter a project name to generate an on-demand briefing with
          decisions, timeline, and stakeholders.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name\u2026"
              className="w-full rounded-md border border-border bg-surface py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!projectName.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Go to Project
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <EmptyProjects />
    </div>
  );
}
