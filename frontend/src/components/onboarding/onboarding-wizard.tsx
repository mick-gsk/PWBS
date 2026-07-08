"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Cable,
  RefreshCw,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import {
  useConnectorTypes,
  useConnectionStatus,
  useConnectOAuth,
} from "@/hooks/use-connectors";
import { useGenerateBriefing } from "@/hooks/use-briefings";
import { useOnboarding } from "@/hooks/use-onboarding";
import { trackEvent } from "@/lib/analytics";
import type { ConnectorType, ConnectionStatus } from "@/types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardStep = "welcome" | "connector" | "sync" | "briefing";

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: "welcome", label: "Welcome", icon: Sparkles },
  { key: "connector", label: "Data source", icon: Cable },
  { key: "sync", label: "Sync", icon: RefreshCw },
  { key: "briefing", label: "First briefing", icon: FileText },
];

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Onboarding steps"
    >
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-2">
            {idx > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${isDone ? "bg-indigo-600" : "bg-surface-secondary"}`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : isDone
                    ? "bg-green-100 text-green-700"
                    : "bg-surface-secondary text-text-tertiary"
              }`}
            >
              {isDone ? (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Icon aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Welcome
// ---------------------------------------------------------------------------

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
        <Sparkles className="h-8 w-8 text-indigo-600" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-text">Welcome to PWBS</h2>
      <p className="mb-2 max-w-md text-text-secondary">
        Your Personal Knowledge Operating System connects your data sources,
        analyzes relationships, and delivers contextual briefings every day.
      </p>
      <p className="mb-8 max-w-md text-sm text-text-tertiary">
        In just a few steps, you&apos;ll connect your first data source and
        receive your first briefing. It takes less than 5 minutes.
      </p>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Get started
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Connect a Data Source
// ---------------------------------------------------------------------------

function StepConnector({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: typesData, isLoading } = useConnectorTypes();
  const { data: connectionsData } = useConnectionStatus();
  const connectOAuth = useConnectOAuth();

  const types: ConnectorType[] = typesData?.connectors ?? [];
  const connections: ConnectionStatus[] = connectionsData?.connections ?? [];

  const hasActiveConnection = connections.some(
    (c) => c.status === "active" || c.status === "syncing",
  );

  // Auto-advance if user already has a connection
  useEffect(() => {
    if (hasActiveConnection) {
      onNext();
    }
  }, [hasActiveConnection, onNext]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        <span className="sr-only">Loading connectors...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="mb-2 text-xl font-bold text-text">
        Connect your first data source
      </h2>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        Choose a data source to populate your knowledge operating system. You
        can add more sources later.
      </p>

      <div className="mb-6 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {types.map((ct: ConnectorType) => (
          <button
            key={ct.type}
            onClick={() => connectOAuth.mutate(ct.type)}
            disabled={connectOAuth.isPending}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Cable aria-hidden="true" className="h-5 w-5 text-text-tertiary" />
            <div>
              <p className="text-sm font-medium text-text">{ct.name}</p>
              {ct.description && (
                <p className="text-xs text-text-tertiary">{ct.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="text-sm text-text-tertiary underline hover:text-text-secondary"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Sync Progress
// ---------------------------------------------------------------------------

function StepSync({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: connectionsData, isLoading } = useConnectionStatus();
  const connections: ConnectionStatus[] = connectionsData?.connections ?? [];

  const activeConnections = connections.filter(
    (c: ConnectionStatus) => c.status === "active" || c.status === "syncing",
  );
  const isSyncing = activeConnections.some(
    (c: ConnectionStatus) => c.status === "syncing",
  );
  const totalDocs = activeConnections.reduce((sum, c) => sum + c.doc_count, 0);

  // Animated progress for the indeterminate bar
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isSyncing) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  // Auto-advance when sync is complete
  useEffect(() => {
    if (activeConnections.length > 0 && !isSyncing) {
      const timer = setTimeout(onNext, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeConnections.length, isSyncing, onNext]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
        <span className="sr-only">Loading status...</span>
      </div>
    );
  }

  const estimateText = isSyncing
    ? elapsed < 30
      ? "Estimated time remaining: about 1–2 minutes"
      : elapsed < 90
        ? "Estimated time remaining: less than 1 minute"
        : "Almost done…"
    : null;

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="mb-2 text-xl font-bold text-text">
        Syncing your data
      </h2>
      <p className="mb-4 max-w-md text-sm text-text-secondary">
        {isSyncing
          ? "Your data is being imported. This may take a moment..."
          : activeConnections.length > 0
            ? "Sync complete! You can now generate your first briefing."
            : "No data source connected yet. You can still continue."}
      </p>

      {/* Progress bar */}
      {isSyncing && (
        <div className="mb-2 w-full max-w-sm">
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(95, 10 + elapsed * 0.8)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-text-tertiary">
            <span>{totalDocs} documents imported</span>
            <span>{estimateText}</span>
          </div>
        </div>
      )}

      {/* Completed summary */}
      {!isSyncing && activeConnections.length > 0 && (
        <p className="mb-4 text-sm font-medium text-green-600">
          {totalDocs} documents imported successfully
        </p>
      )}

      <div className="mb-6 w-full max-w-sm space-y-3">
        {activeConnections.map((c: ConnectionStatus) => (
          <div
            key={c.type}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            {c.status === "syncing" ? (
              <RefreshCw
                aria-hidden="true"
                className="h-4 w-4 animate-spin text-indigo-500"
              />
            ) : (
              <CheckCircle2
                aria-hidden="true"
                className="h-4 w-4 text-green-500"
              />
            )}
            <span className="text-sm font-medium text-text-secondary">
              {c.type}
            </span>
            <span className="ml-auto text-xs text-text-tertiary">
              {c.doc_count} documents
            </span>
          </div>
        ))}
        {activeConnections.length === 0 && (
          <p className="text-sm text-text-tertiary">
            No active connections.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Continue
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Generate First Briefing
// ---------------------------------------------------------------------------

function StepBriefing({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) {
  const generate = useGenerateBriefing();
  const router = useRouter();
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    generate.mutate(
      { type: "morning" },
      {
        onSuccess: () => {
          setGenerated(true);
        },
      },
    );
  };

  const handleFinish = () => {
    onComplete();
    if (generated) {
      router.push("/briefings");
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
        <FileText className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-text">Your first briefing</h2>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        {generated
          ? "Your briefing has been created! You can view it now."
          : "Generate your first morning briefing based on your connected data."}
      </p>

      {!generated ? (
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Zurueck
          </button>
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {generate.isPending ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText aria-hidden="true" className="h-4 w-4" />
                Generate briefing
              </>
            )}
          </button>
          <button
            onClick={handleFinish}
            className="text-sm text-text-tertiary underline hover:text-text-secondary"
          >
            Ueberspringen
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Zurueck
          </button>
          <button
            onClick={handleFinish}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Finish onboarding
          </button>
        </div>
      )}

      {generate.isError && (
        <p className="mt-4 text-sm text-red-600">
          The briefing could not be generated. You can try again later.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard Component
// ---------------------------------------------------------------------------

export function OnboardingWizard() {
  const { completed, complete, lastStep, saveStep } = useOnboarding();

  // Resume from last saved step or start at "welcome"
  const initialStep: WizardStep =
    lastStep &&
    (["welcome", "connector", "sync", "briefing"] as string[]).includes(
      lastStep,
    )
      ? (lastStep as WizardStep)
      : "welcome";
  const [step, setStep] = useState<WizardStep>(initialStep);

  const goTo = (next: WizardStep) => {
    saveStep(next);
    setStep(next);
  };

  const handleComplete = () => {
    trackEvent("signup");
    complete();
  };

  const handleSkip = () => {
    complete();
  };

  // Don't render while loading or if already completed
  if (completed === null || completed === true) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding wizard"
    >
      <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-surface p-6 shadow-2xl sm:p-10">
        {/* Skip / Close */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-full p-1.5 text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary"
          aria-label="Skip onboarding"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        {/* Progress Indicator */}
        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        {/* Step Content */}
        {step === "welcome" && <StepWelcome onNext={() => goTo("connector")} />}
        {step === "connector" && (
          <StepConnector
            onNext={() => goTo("sync")}
            onBack={() => goTo("welcome")}
          />
        )}
        {step === "sync" && (
          <StepSync
            onNext={() => goTo("briefing")}
            onBack={() => goTo("connector")}
          />
        )}
        {step === "briefing" && (
          <StepBriefing
            onComplete={handleComplete}
            onBack={() => goTo("sync")}
          />
        )}
      </div>
    </div>
  );
}
