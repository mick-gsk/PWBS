import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – PWBS",
  description:
    "Privacy Policy of the Personal Knowledge Operating System (PWBS).",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-text">
            PWBS
          </Link>
          <Link
            href="/"
            className="text-sm text-text-tertiary hover:text-text transition-colors"
          >
            Back to home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-bold text-text sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">Last updated: July 2025</p>

        <div className="mt-8 space-y-10 text-text-secondary leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              1. Data Controller
            </h2>
            <p className="mt-2">
              Controller within the meaning of the GDPR:
              <br />
              Mick Gajewski
              <br />
              Email:{" "}
              <a
                href="mailto:kontakt@pwbs.app"
                className="text-indigo-600 hover:underline"
              >
                kontakt@pwbs.app
              </a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              2. Overview of Data Processing
            </h2>
            <p className="mt-2">
              PWBS (Personal Knowledge Operating System) is an AI-powered
              platform that consolidates your personal knowledge data
              (calendars, notes, meeting transcripts), analyzes it
              semantically, and turns it into contextual briefings.
            </p>
            <p className="mt-2">
              We process your data solely to provide the service. Your data is{" "}
              <strong>never</strong> used to train AI models.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              3. Legal Bases (Art. 6 GDPR)
            </h2>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Performance of a contract (Art. 6(1)(b)):</strong>{" "}
                Processing of your knowledge data to provide the PWBS service
              </li>
              <li>
                <strong>Consent (Art. 6(1)(a)):</strong> Connecting external
                data sources via OAuth (revocable at any time)
              </li>
              <li>
                <strong>Legitimate interest (Art. 6(1)(f)):</strong>{" "}
                Security, abuse prevention, anonymized usage statistics
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              4. What Data We Process
            </h2>

            <h3 className="mt-4 font-semibold text-text">
              4.1 Registration and Authentication
            </h3>
            <p className="mt-1">
              Email address, hashed password (Argon2id), OAuth tokens
              (encrypted with AES-256-GCM). Retention: until account
              deletion.
            </p>

            <h3 className="mt-4 font-semibold text-text">
              4.2 Waitlist (before registration)
            </h3>
            <p className="mt-1">
              When you join the waitlist, we store your email address on the
              basis of your consent (Art. 6(1)(a) GDPR). Your email is used
              solely to notify you about the launch of PWBS. You can withdraw
              your consent at any time by emailing{" "}
              <a
                href="mailto:kontakt@pwbs.app"
                className="text-indigo-600 hover:underline"
              >
                kontakt@pwbs.app
              </a>
              .
            </p>

            <h3 className="mt-4 font-semibold text-text">
              4.3 Knowledge Data (after connecting sources)
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm border border-border rounded">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Data Source
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Data
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2">Google Calendar</td>
                    <td className="px-4 py-2">
                      Events, attendees, descriptions
                    </td>
                    <td className="px-4 py-2">365 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Notion</td>
                    <td className="px-4 py-2">
                      Page content, databases, comments
                    </td>
                    <td className="px-4 py-2">730 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Zoom</td>
                    <td className="px-4 py-2">
                      Meeting transcripts, recordings
                    </td>
                    <td className="px-4 py-2">365 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Obsidian</td>
                    <td className="px-4 py-2">
                      Markdown notes, vault structure
                    </td>
                    <td className="px-4 py-2">730 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-4 font-semibold text-text">
              4.4 Derived Data
            </h3>
            <ul className="mt-1 list-disc pl-6 space-y-1">
              <li>
                <strong>Embeddings (vectors):</strong> Mathematical
                representations of your texts used for semantic search.
                Deletion cascades with the source document.
              </li>
              <li>
                <strong>LLM-generated content:</strong> Briefings,
                summaries, answers. Retention: 90 days.
              </li>
              <li>
                <strong>Knowledge Graph:</strong> Extracted entities
                (people, projects, decisions). Deletion cascades with
                the source document.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              5. AI Processing and LLM Usage
            </h2>
            <p className="mt-2">
              PWBS uses large language models (LLMs) to analyze and process
              your data. The following principles apply:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                Your data is <strong>not</strong> used to train AI models
              </li>
              <li>
                LLM requests include only the necessary context (data
                minimization)
              </li>
              <li>
                All LLM-generated statements include source references
              </li>
              <li>
                LLM audit logs document every request for transparency
              </li>
            </ul>
            <p className="mt-2">
              <strong>LLM providers we use:</strong>
            </p>
            <ul className="mt-1 list-disc pl-6 space-y-1">
              <li>
                Anthropic (Claude) – primary language model, data
                processing agreement (DPA) in place
              </li>
              <li>
                OpenAI (GPT-4, Ada) – fallback model and embeddings, DPA in
                place
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              6. Processors and Third Countries
            </h2>
            <p className="mt-2">We use the following processors:</p>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm border border-border rounded">
                <thead className="bg-surface-secondary">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Provider
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Purpose
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Location
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-text">
                      Legal Basis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-2">AWS (Frankfurt)</td>
                    <td className="px-4 py-2">
                      Hosting, databases, encryption
                    </td>
                    <td className="px-4 py-2">EU (eu-central-1)</td>
                    <td className="px-4 py-2">DPA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Vercel</td>
                    <td className="px-4 py-2">Frontend hosting</td>
                    <td className="px-4 py-2">EU / USA</td>
                    <td className="px-4 py-2">
                      DPA + EU Standard Contractual Clauses
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Anthropic</td>
                    <td className="px-4 py-2">AI language model</td>
                    <td className="px-4 py-2">USA</td>
                    <td className="px-4 py-2">
                      DPA + EU Standard Contractual Clauses
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">OpenAI</td>
                    <td className="px-4 py-2">AI model and embeddings</td>
                    <td className="px-4 py-2">USA</td>
                    <td className="px-4 py-2">
                      DPA + EU Standard Contractual Clauses
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              7. Technical and Organizational Measures
            </h2>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Encryption:</strong> AES-256-GCM for OAuth tokens
                and sensitive data (envelope encryption with AWS KMS)
              </li>
              <li>
                <strong>Transport:</strong> TLS 1.3 for all connections
              </li>
              <li>
                <strong>Password hashing:</strong> Argon2id
              </li>
              <li>
                <strong>Tenant isolation:</strong> Strict per-user data
                isolation (owner_id filter on all database queries)
              </li>
              <li>
                <strong>Access control:</strong> JWT-based
                authentication with token rotation
              </li>
              <li>
                <strong>Audit logging:</strong> All security-relevant
                actions are logged
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              8. Your Rights
            </h2>
            <p className="mt-2">
              You have the following rights regarding your personal data:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                <strong>Access (Art. 15 GDPR):</strong> You can request
                information about your stored data at any time
              </li>
              <li>
                <strong>Rectification (Art. 16 GDPR):</strong> Right to
                have inaccurate data corrected
              </li>
              <li>
                <strong>Erasure (Art. 17 GDPR):</strong> Right to have your
                data deleted – a full account deletion removes all data in
                cascade (documents, embeddings, knowledge graph)
              </li>
              <li>
                <strong>
                  Restriction of processing (Art. 18 GDPR):
                </strong>{" "}
                Right to restricted processing under certain
                conditions
              </li>
              <li>
                <strong>Data portability (Art. 20 GDPR):</strong> Export
                of your data in a machine-readable format (JSON)
              </li>
              <li>
                <strong>Objection (Art. 21 GDPR):</strong> Right to
                object to processing
              </li>
              <li>
                <strong>Withdrawal of consent:</strong> Any consent you
                have given (e.g. an OAuth connection) can be withdrawn at any
                time
              </li>
            </ul>
            <p className="mt-2">
              To exercise your rights, contact:{" "}
              <a
                href="mailto:kontakt@pwbs.app"
                className="text-indigo-600 hover:underline"
              >
                kontakt@pwbs.app
              </a>
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              9. Web Analytics
            </h2>
            <p className="mt-2">
              We use{" "}
              <a
                href="https://plausible.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Plausible Analytics
              </a>
              , a privacy-friendly analytics tool. Plausible sets{" "}
              <strong>no cookies</strong>, stores no personal data, and is
              fully GDPR compliant. Only aggregated usage statistics are
              collected.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              10. Right to Lodge a Complaint
            </h2>
            <p className="mt-2">
              You have the right to lodge a complaint about our processing of
              personal data with a data protection supervisory authority.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              11. Changes
            </h2>
            <p className="mt-2">
              This Privacy Policy may be updated from time to time. The
              current version is always available on this page.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm text-text-tertiary">
              &copy; {new Date().getFullYear()} PWBS. All rights reserved.
            </span>
            <div className="flex gap-6 text-sm text-text-tertiary">
              <Link
                href="/impressum"
                className="hover:text-text transition-colors"
              >
                Legal Notice
              </Link>
              <Link href="/datenschutz" className="font-medium text-text">
                Privacy Policy
              </Link>
              <Link
                href="/agb"
                className="hover:text-text transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
