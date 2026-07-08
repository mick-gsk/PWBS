"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Cable,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrganization } from "@/lib/api/organizations";
import { inviteMember } from "@/lib/api/admin";
import type { InviteRequest } from "@/lib/api/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InviteEntry {
  email: string;
  role: "owner" | "member" | "viewer";
}

type WizardStep = "org" | "members" | "connectors" | "confirm";

const STEPS: {
  key: WizardStep;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "org", label: "Organization", icon: Building2 },
  { key: "members", label: "Invite Team", icon: Users },
  { key: "connectors", label: "Connectors", icon: Cable },
  { key: "confirm", label: "Confirmation", icon: CheckCircle2 },
];

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <nav className="flex items-center gap-2" aria-label="Onboarding steps">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-2">
            {idx > 0 && (
              <div
                className={`h-px w-8 ${isDone ? "bg-indigo-600" : "bg-surface-secondary"}`}
              />
            )}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : isDone
                    ? "bg-green-100 text-green-700"
                    : "bg-surface-secondary text-text-tertiary"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Organization
// ---------------------------------------------------------------------------

function StepOrg({
  name,
  description,
  onChange,
}: {
  name: string;
  description: string;
  onChange: (field: "name" | "description", value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">
        Create Organization
      </h2>
      <p className="text-sm text-text-tertiary">
        Enter the name of your team or company.
      </p>
      <div>
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-text-secondary"
        >
          Name *
        </label>
        <input
          id="org-name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g. Acme Consulting"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="org-desc"
          className="block text-sm font-medium text-text-secondary"
        >
          Description
        </label>
        <textarea
          id="org-desc"
          rows={3}
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief description of the organization…"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Invite Members
// ---------------------------------------------------------------------------

function StepMembers({
  invites,
  onAdd,
  onRemove,
  onChange,
}: {
  invites: InviteEntry[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, field: keyof InviteEntry, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">
        Invite Team Members
      </h2>
      <p className="text-sm text-text-tertiary">
        Add your colleagues&apos; email addresses (3–10 recommended).
        Members must already have a PWBS account.
      </p>

      <div className="space-y-3">
        {invites.map((inv, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="email"
              required
              value={inv.email}
              onChange={(e) => onChange(idx, "email", e.target.value)}
              placeholder="user@company.com"
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={inv.role}
              onChange={(e) => onChange(idx, "role", e.target.value)}
              className="rounded-md border border-border px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Select role"
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="rounded p-1 text-text-tertiary hover:bg-red-50 hover:text-red-600"
              aria-label="Remove entry"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={invites.length >= 10}
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Add another member
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Connector Selection
// ---------------------------------------------------------------------------

const CONNECTOR_OPTIONS = [
  { id: "gmail", label: "Gmail", description: "Import emails" },
  { id: "slack", label: "Slack", description: "Channel messages" },
  {
    id: "google_docs",
    label: "Google Docs",
    description: "Index documents",
  },
  {
    id: "google_calendar",
    label: "Google Calendar",
    description: "Events & meetings",
  },
  { id: "notion", label: "Notion", description: "Pages & databases" },
] as const;

function StepConnectors({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">
        Select Connectors
      </h2>
      <p className="text-sm text-text-tertiary">
        Choose the data sources your team should use. The OAuth connection
        is set up after the wizard is completed.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {CONNECTOR_OPTIONS.map((conn) => {
          const isSelected = selected.has(conn.id);
          return (
            <button
              key={conn.id}
              type="button"
              onClick={() => onToggle(conn.id)}
              aria-pressed={isSelected}
              className={`flex flex-col items-start rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-border hover:border-border hover:bg-surface-secondary"
              }`}
            >
              <span className="font-medium text-text">{conn.label}</span>
              <span className="text-sm text-text-tertiary">{conn.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Confirmation
// ---------------------------------------------------------------------------

function StepConfirm({
  orgName,
  inviteCount,
  connectorCount,
}: {
  orgName: string;
  inviteCount: number;
  connectorCount: number;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text">Summary</h2>
      <div className="space-y-3 rounded-lg border border-border bg-surface-secondary p-5">
        <div className="flex items-center gap-3">
          <Building2 aria-hidden="true" className="h-5 w-5 text-indigo-600" />
          <span className="text-sm">
            Organization: <strong>{orgName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Users aria-hidden="true" className="h-5 w-5 text-indigo-600" />
          <span className="text-sm">
            Invite {inviteCount} member{inviteCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Cable aria-hidden="true" className="h-5 w-5 text-indigo-600" />
          <span className="text-sm">
            Activate {connectorCount} connector
            {connectorCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <p className="text-sm text-text-tertiary">
        Click &quot;Finish&quot; to create the organization and send the
        invitations.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export default function OnboardingWizardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("org");
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [invites, setInvites] = useState<InviteEntry[]>([
    { email: "", role: "member" },
  ]);
  const [selectedConnectors, setSelectedConnectors] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  // Finalize mutation
  const finalize = useMutation({
    mutationFn: async () => {
      // 1) Create organization
      const org = await createOrganization({
        name: orgName.trim(),
        description: orgDescription.trim(),
      });

      // 2) Invite members (sequentially to avoid race conditions)
      const validInvites = invites.filter((i) => i.email.trim());
      for (const inv of validInvites) {
        try {
          await inviteMember(org.id, {
            email: inv.email.trim(),
            role: inv.role,
          } as InviteRequest);
        } catch {
          // Skip if user not found or already member — non-critical
        }
      }

      // 3) Connector activation happens via the connectors page
      // (OAuth flow requires browser redirect — can't be done in a mutation)

      return org;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      router.push(`/admin?org=${org.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Navigation
  const stepOrder: WizardStep[] = ["org", "members", "connectors", "confirm"];
  const currentIdx = stepOrder.indexOf(step);

  const canProceed = () => {
    if (step === "org") return orgName.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (currentIdx < stepOrder.length - 1) {
      setStep(stepOrder[currentIdx + 1]);
    }
  };
  const goBack = () => {
    if (currentIdx > 0) {
      setStep(stepOrder[currentIdx - 1]);
    }
  };

  // Invite helpers
  const addInvite = () => {
    setInvites((prev) => [...prev, { email: "", role: "member" }]);
  };
  const removeInvite = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateInvite = (
    idx: number,
    field: keyof InviteEntry,
    value: string,
  ) => {
    setInvites((prev) =>
      prev.map((inv, i) => (i === idx ? { ...inv, [field]: value } : inv)),
    );
  };

  // Connector toggle
  const toggleConnector = (id: string) => {
    setSelectedConnectors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text">B2B Onboarding</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Set up your team in just a few steps.
        </p>
      </div>

      <StepIndicator current={step} />

      <div className="rounded-lg border border-border bg-surface p-6">
        {step === "org" && (
          <StepOrg
            name={orgName}
            description={orgDescription}
            onChange={(field, value) => {
              if (field === "name") setOrgName(value);
              else setOrgDescription(value);
            }}
          />
        )}

        {step === "members" && (
          <StepMembers
            invites={invites}
            onAdd={addInvite}
            onRemove={removeInvite}
            onChange={updateInvite}
          />
        )}

        {step === "connectors" && (
          <StepConnectors
            selected={selectedConnectors}
            onToggle={toggleConnector}
          />
        )}

        {step === "confirm" && (
          <StepConfirm
            orgName={orgName}
            inviteCount={invites.filter((i) => i.email.trim()).length}
            connectorCount={selectedConnectors.size}
          />
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary disabled:invisible"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </button>

        {step === "confirm" ? (
          <button
            type="button"
            onClick={() => finalize.mutate()}
            disabled={finalize.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {finalize.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            )}
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Next
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
