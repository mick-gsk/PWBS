"use client";

import { Clock, AlertTriangle, HelpCircle, FileText } from "lucide-react";
import type { Reminder, ReminderStatus } from "@/types/api";

interface ReminderCardProps {
  reminder: Reminder;
  onAction: (id: string, status: ReminderStatus) => void;
  isPending?: boolean;
}

const TYPE_CONFIG = {
  follow_up: { icon: Clock, label: "Follow-up", color: "text-indigo-600" },
  inactive_topic: {
    icon: AlertTriangle,
    label: "Inactive Topic",
    color: "text-amber-600",
  },
  open_question: {
    icon: HelpCircle,
    label: "Open Question",
    color: "text-purple-600",
  },
} as const;

const URGENCY_BADGE = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-surface-secondary text-text-secondary",
} as const;

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function ReminderCard({
  reminder,
  onAction,
  isPending,
}: ReminderCardProps) {
  const config = TYPE_CONFIG[reminder.reminder_type];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon
            aria-hidden="true"
            className={`h-4 w-4 flex-shrink-0 ${config.color}`}
          />
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[reminder.urgency]}`}
          >
            {reminder.urgency}
          </span>
        </div>
        <span className="text-xs text-text-tertiary whitespace-nowrap">
          {timeAgo(reminder.created_at)}
        </span>
      </div>

      {/* Content */}
      <div>
        <h4 className="text-sm font-semibold text-text">
          {reminder.title}
        </h4>
        {reminder.description && (
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">
            {reminder.description}
          </p>
        )}
      </div>

      {/* Context info */}
      <div className="flex flex-wrap gap-3 text-xs text-text-tertiary">
        {reminder.due_at && (
          <span className="flex items-center gap-1">
            <Clock aria-hidden="true" className="h-3 w-3" />
            Due: {new Date(reminder.due_at).toLocaleDateString("de-DE")}
          </span>
        )}
        {reminder.source_document_id && (
          <span className="flex items-center gap-1">
            <FileText aria-hidden="true" className="h-3 w-3" />
            Source reference
          </span>
        )}
        {reminder.responsible_person && (
          <span>Owner: {reminder.responsible_person}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onAction(reminder.id, "acknowledged")}
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Still relevant
        </button>
        <button
          onClick={() => onAction(reminder.id, "dismissed")}
          disabled={isPending}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50"
        >
          Done
        </button>
        <button
          onClick={() => onAction(reminder.id, "snoozed")}
          disabled={isPending}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50"
        >
          Remind me later
        </button>
      </div>
    </div>
  );
}
