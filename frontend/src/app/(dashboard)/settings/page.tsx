"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Shield,
  Trash2,
  Download,
  Bell,
  Loader2,
  Check,
  AlertTriangle,
  Database,
} from "lucide-react";
import {
  useUserSettings,
  useUpdateSettings,
  useStartExport,
  useExportStatus,
  useRequestDeletion,
  useCancelDeletion,
} from "@/hooks/use-settings";
import { SecurityStatusPanel } from "@/components/settings/security-status-panel";

type TabId = "profile" | "notifications" | "privacy" | "security" | "account";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: <User aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: "notifications",
    label: "Reminders",
    icon: <Bell aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: <Shield aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: "security",
    label: "Security",
    icon: <Shield aria-hidden="true" className="h-4 w-4" />,
  },
  {
    id: "account",
    label: "Account",
    icon: <Trash2 aria-hidden="true" className="h-4 w-4" />,
  },
];

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12" role="status">
          <Loader2
            aria-hidden="true"
            className="h-8 w-8 animate-spin text-text-tertiary"
          />
          <span className="sr-only">Loading</span>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "profile";

  function setTab(tab: TabId) {
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {/* Tab Navigation */}
      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Settings"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-text-tertiary hover:border-border hover:text-text-secondary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border bg-surface p-6">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "privacy" && <PrivacyTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "account" && <AccountTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

function ProfileTab() {
  const { data, isLoading } = useUserSettings();
  const update = useUpdateSettings();
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(false);

  useEffect(() => {
    if (data) {
      setDisplayName(data.display_name);
      setTimezone(data.timezone);
      setLanguage(data.language);
      setAutoGenerate(data.briefing_auto_generate);
    }
  }, [data]);

  function handleSave() {
    update.mutate({
      display_name: displayName,
      timezone,
      language,
      briefing_auto_generate: autoGenerate,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label
          htmlFor="display-name"
          className="block text-sm font-medium text-text-secondary"
        >
          Display name
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-text-secondary"
        >
          Time zone
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="Europe/Berlin">Europe/Berlin</option>
          <option value="Europe/Vienna">Europe/Vienna</option>
          <option value="Europe/Zurich">Europe/Zurich</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="language"
          className="block text-sm font-medium text-text-secondary"
        >
          Language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="de">German</option>
          <option value="en">English</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoGenerate}
          onChange={(e) => setAutoGenerate(e.target.checked)}
          className="rounded border-border accent-indigo-600"
        />
        Generate briefings automatically
      </label>

      <button
        onClick={handleSave}
        disabled={update.isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {update.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : update.isSuccess ? (
          <Check className="h-4 w-4" />
        ) : null}
        Save
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications Tab (TASK-132)
// ---------------------------------------------------------------------------

function NotificationsTab() {
  const { data, isLoading } = useUserSettings();
  const update = useUpdateSettings();
  const [frequency, setFrequency] = useState("daily");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [briefingTime, setBriefingTime] = useState("06:30");

  useEffect(() => {
    if (data) {
      setFrequency(data.reminder_frequency);
      setEmailEnabled(data.email_briefing_enabled);
      setBriefingTime(data.briefing_email_time);
    }
  }, [data]);

  function handleSave() {
    update.mutate({
      reminder_frequency: frequency as "daily" | "weekly" | "off",
      email_briefing_enabled: emailEnabled,
      briefing_email_time: briefingTime,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md">
      {/* E-Mail Briefing */}
      <div>
        <h3 className="text-sm font-semibold text-text">Email briefings</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Receive daily briefings by email at your preferred time.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
          className="rounded border-border accent-indigo-600"
        />
        Email briefings enabled
      </label>

      {emailEnabled && (
        <div>
          <label
            htmlFor="briefing-time"
            className="block text-sm font-medium text-text-secondary"
          >
            Briefing time
          </label>
          <input
            id="briefing-time"
            type="time"
            value={briefingTime}
            onChange={(e) => setBriefingTime(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {/* Erinnerungsfrequenz */}
      <div>
        <h3 className="text-sm font-semibold text-text">Reminder frequency</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Choose how often you want to receive proactive reminders and
          follow-up notifications.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="sr-only">Reminder frequency</legend>
        {(
          [
            {
              value: "daily",
              label: "Daily",
              desc: "A summary of open reminders every day",
            },
            {
              value: "weekly",
              label: "Weekly",
              desc: "An overview once a week (on Fridays)",
            },
            {
              value: "off",
              label: "Off",
              desc: "No proactive reminders – available on demand only",
            },
          ] as const
        ).map((opt) => (
          <label
            key={opt.value}
            htmlFor={`reminder-freq-${opt.value}`}
            aria-label={opt.label}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              frequency === opt.value
                ? "border-indigo-600 bg-indigo-50"
                : "border-border hover:border-indigo-200"
            }`}
          >
            <input
              id={`reminder-freq-${opt.value}`}
              type="radio"
              name="reminder-frequency"
              value={opt.value}
              checked={frequency === opt.value}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-0.5"
            />
            <div>
              <span className="text-sm font-medium text-text">{opt.label}</span>
              <p className="text-xs text-text-tertiary">{opt.desc}</p>
            </div>
          </label>
        ))}
      </fieldset>

      <button
        onClick={handleSave}
        disabled={update.isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {update.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : update.isSuccess ? (
          <Check className="h-4 w-4" />
        ) : null}
        Save
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Privacy Tab
// ---------------------------------------------------------------------------

function PrivacyTab() {
  const startExport = useStartExport();
  const [exportId, setExportId] = useState<string | null>(null);
  const { data: exportStatus } = useExportStatus(exportId);

  function handleExport() {
    startExport.mutate(undefined, {
      onSuccess: (res) => setExportId(res.export_id),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text">Transparency report</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Detailed overview of your stored data and AI usage (GDPR
          Art. 15).
        </p>
        <div className="mt-3">
          <a
            href="/settings/data"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
          >
            <Database className="h-4 w-4" />
            View transparency report
          </a>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-text">Data export</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Export all your data as a JSON file (GDPR Art. 20).
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={
              startExport.isPending ||
              (!!exportId && exportStatus?.status !== "completed")
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            {startExport.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export data
          </button>
          {exportStatus && exportStatus.status !== "completed" && (
            <span className="text-sm text-text-tertiary">
              Preparing export\u2026
            </span>
          )}
          {exportStatus?.status === "completed" &&
            exportStatus.download_url && (
              <a
                href={exportStatus.download_url}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                download
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security Tab
// ---------------------------------------------------------------------------

function SecurityTab() {
  return <SecurityStatusPanel />;
}

// ---------------------------------------------------------------------------
// Account Tab
// ---------------------------------------------------------------------------

function AccountTab() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const deleteMutation = useRequestDeletion();
  const cancelMutation = useCancelDeletion();

  function handleDelete() {
    if (!confirmed || !password) return;
    deleteMutation.mutate(
      { password, confirmation: "DELETE" },
      { onSuccess: () => setShowDeleteDialog(false) },
    );
  }

  return (
    <div className="space-y-6">
      {/* Deletion scheduled banner */}
      {deleteMutation.data?.deletion_scheduled_at && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">
              Your account will be deleted on{" "}
              {new Date(
                deleteMutation.data.deletion_scheduled_at,
              ).toLocaleDateString("en-US")}
              .
            </p>
          </div>
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="mt-2 text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
          >
            Cancel deletion
          </button>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-red-900">
          Delete account
        </h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Your account and all data will be permanently deleted after a
          30-day grace period.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </button>
      </div>

      {/* Full-screen delete dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="mx-4 w-full max-w-md rounded-xl bg-surface p-6 shadow-xl"
          >
            <h2
              id="delete-dialog-title"
              className="text-lg font-bold text-red-900"
            >
              Permanently delete account
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              All your data will be permanently deleted after 30 days.
              You can cancel the deletion during the grace period.
            </p>

            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              I understand that this action cannot be undone.
            </label>

            <div className="mt-3">
              <label
                htmlFor="delete-password"
                className="block text-sm font-medium text-text-secondary"
              >
                Confirm with your password
              </label>
              <input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                autoComplete="current-password"
              />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={!confirmed || !password || deleteMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending
                  ? "Deleting\u2026"
                  : "Delete account"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPassword("");
                  setConfirmed(false);
                }}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
