"use client";

import { useState } from "react";
import {
  Shield,
  Users,
  Cable,
  FileText,
  UserPlus,
  Share2,
  Unplug,
  Loader2,
} from "lucide-react";
import {
  useOrgDashboard,
  useOrgMembers,
  useInviteMember,
  useOrgConnectors,
  useShareConnector,
  useUnshareConnector,
} from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import { listOrganizations } from "@/lib/api/organizations";

// ---------------------------------------------------------------------------
// Org Selector
// ---------------------------------------------------------------------------

function OrgSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
  });

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 text-sm text-text-tertiary"
      >
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Loading organizations…
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <p className="text-sm text-text-tertiary">
        No organizations found. Create one via the{" "}
        <a href="/admin/onboarding" className="text-indigo-600 underline">
          onboarding wizard
        </a>
        .
      </p>
    );
  }

  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      aria-label="Select organization"
    >
      <option value="" disabled>
        Select an organization…
      </option>
      {data.items.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Stats Cards
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-indigo-50 p-2">
          <Icon aria-hidden="true" className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-text-tertiary">{label}</p>
          <p className="text-2xl font-bold text-text">{value ?? "–"}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite Form
// ---------------------------------------------------------------------------

function InviteForm({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member" | "viewer">("member");
  const invite = useInviteMember(orgId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    invite.mutate(
      { email: email.trim(), role },
      { onSuccess: () => setEmail("") },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label
          htmlFor="invite-email"
          className="block text-sm font-medium text-text-secondary"
        >
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@company.com"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label
          htmlFor="invite-role"
          className="block text-sm font-medium text-text-secondary"
        >
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "owner" | "member" | "viewer")
          }
          className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={invite.isPending}
        className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {invite.isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" className="h-4 w-4" />
        )}
        Invite
      </button>
      {invite.isError && (
        <p className="text-sm text-red-600">{invite.error.message}</p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Members Table
// ---------------------------------------------------------------------------

function MembersTable({ orgId }: { orgId: string }) {
  const { data, isLoading } = useOrgMembers(orgId);

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 py-4 text-sm text-text-tertiary"
      >
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Loading members…
      </div>
    );
  }

  if (!data?.members.length) {
    return <p className="py-4 text-sm text-text-tertiary">No members.</p>;
  }

  const roleLabel: Record<string, string> = {
    owner: "Owner",
    member: "Member",
    viewer: "Viewer",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-tertiary">
          <tr>
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 font-medium">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.members.map((m) => (
            <tr key={m.user_id}>
              <td className="py-2 pr-4 font-medium text-text">
                {m.display_name}
              </td>
              <td className="py-2 pr-4 text-text-secondary">{m.email}</td>
              <td className="py-2 pr-4">
                <span className="inline-block rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {roleLabel[m.role] ?? m.role}
                </span>
              </td>
              <td className="py-2 text-text-secondary">
                {new Date(m.joined_at).toLocaleDateString("en-US")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connectors Table
// ---------------------------------------------------------------------------

function ConnectorsTable({ orgId }: { orgId: string }) {
  const { data, isLoading } = useOrgConnectors(orgId);
  const share = useShareConnector(orgId);
  const unshare = useUnshareConnector(orgId);

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center gap-2 py-4 text-sm text-text-tertiary"
      >
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Loading connectors…
      </div>
    );
  }

  if (!data?.connectors.length) {
    return (
      <p className="py-4 text-sm text-text-tertiary">No connectors.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-text-tertiary">
          <tr>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 pr-4 font-medium">Owner</th>
            <th className="py-2 pr-4 font-medium">Shared</th>
            <th className="py-2 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.connectors.map((c) => {
            const isShared = c.organization_id === orgId;
            return (
              <tr key={c.id}>
                <td className="py-2 pr-4 font-medium text-text">
                  {c.source_type}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-surface-secondary text-text-secondary"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-text-secondary">
                  {c.owner_email}
                </td>
                <td className="py-2 pr-4">
                  {isShared ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <Share2 aria-hidden="true" className="h-3 w-3" /> Yes
                    </span>
                  ) : (
                    <span className="text-text-tertiary">No</span>
                  )}
                </td>
                <td className="py-2">
                  {isShared ? (
                    <button
                      onClick={() => unshare.mutate(c.id)}
                      disabled={unshare.isPending}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Unplug aria-hidden="true" className="h-3 w-3" />
                      Unshare
                    </button>
                  ) : (
                    <button
                      onClick={() => share.mutate(c.id)}
                      disabled={share.isPending}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                    >
                      <Share2 aria-hidden="true" className="h-3 w-3" />
                      Share
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminDashboardPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const dashboard = useOrgDashboard(orgId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield aria-hidden="true" className="h-7 w-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
        </div>
        <OrgSelector selectedId={orgId} onSelect={setOrgId} />
      </div>

      {!orgId && (
        <p className="rounded-xl border border-border bg-surface-secondary p-8 text-center text-text-tertiary">
          Select an organization to view the dashboard.
        </p>
      )}

      {orgId && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Members"
              value={dashboard.data?.member_count}
            />
            <StatCard
              icon={Cable}
              label="Connectors"
              value={dashboard.data?.connector_count}
            />
            <StatCard
              icon={Share2}
              label="Shared Connectors"
              value={dashboard.data?.shared_connector_count}
            />
            <StatCard
              icon={FileText}
              label="Documents"
              value={dashboard.data?.document_count}
            />
          </div>

          {/* Members */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-text">Members</h2>
            <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
              <InviteForm orgId={orgId} />
              <MembersTable orgId={orgId} />
            </div>
          </section>

          {/* Connectors */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-text">
              Connectors
            </h2>
            <div className="rounded-xl border border-border bg-surface p-5">
              <ConnectorsTable orgId={orgId} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
