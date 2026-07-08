import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – PWBS",
  description: "Terms of Service governing the use of PWBS.",
};

export default function AGBPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">Last updated: July 2025</p>

        <div className="mt-8 space-y-10 text-text-secondary leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              1. Scope
            </h2>
            <p className="mt-2">
              These Terms of Service govern the use of the service
              &quot;PWBS – Personal Knowledge Operating System&quot;,
              operated by Mick Gajewski (hereinafter the
              &quot;Provider&quot;).
            </p>
            <p className="mt-2">
              By registering for or using the service, you accept these
              Terms of Service.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              2. Description of the Service
            </h2>
            <p className="mt-2">
              PWBS is an AI-powered platform that consolidates personal
              knowledge data from various sources (calendars, notes,
              meeting transcripts), analyzes it semantically, and turns it
              into contextual briefings.
            </p>
            <p className="mt-2">
              The service is currently in{" "}
              <strong>beta</strong>. Features and availability
              may change.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              3. Registration and Account
            </h2>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                You must provide accurate information when registering
              </li>
              <li>
                You are responsible for keeping your login credentials secure
              </li>
              <li>
                An account is personal and may not be shared with third
                parties
              </li>
              <li>
                The Provider may suspend accounts that violate these Terms
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              4. Beta Terms
            </h2>
            <p className="mt-2">During the beta phase, the following also applies:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                The service is provided &quot;as is&quot;
              </li>
              <li>
                There is no entitlement to any particular availability or
                functionality
              </li>
              <li>
                The Provider may modify, restrict, or discontinue the service
                at any time
              </li>
              <li>
                Even if the service is discontinued, your data will not be
                deleted without prior notice – you will have at least 30 days
                to export it
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              5. User Rights and Obligations
            </h2>
            <p className="mt-2">The user agrees to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Not use the service for unlawful purposes</li>
              <li>
                Not perform automated bulk requests (scraping, bots)
              </li>
              <li>
                Not circumvent or tamper with any security mechanisms
              </li>
              <li>
                Only submit their own data, or data they are authorized to
                have processed
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              6. Intellectual Property
            </h2>
            <p className="mt-2">
              All rights to the software, design, and content of PWBS
              belong to the Provider. Data submitted by the user
              remains the property of the user.
            </p>
            <p className="mt-2">
              The Provider acquires no rights to use the user&apos;s content
              beyond the processing necessary to provide the service.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              7. Limitation of Liability
            </h2>
            <p className="mt-2">
              The Provider is liable without limitation for intent and gross
              negligence. In cases of slight negligence, the Provider is
              liable only for breaches of essential contractual obligations
              and only up to the amount of foreseeable damage typical for
              this type of contract.
            </p>
            <p className="mt-2">The Provider is not liable for:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                The factual accuracy of AI-generated briefings and
                summaries
              </li>
              <li>
                Data loss caused by force majeure, third-party server
                outages, or actions of the user
              </li>
              <li>
                Decisions made on the basis of the information
                provided
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              8. Data Protection
            </h2>
            <p className="mt-2">
              Personal data is processed in accordance with our{" "}
              <Link
                href="/datenschutz"
                className="text-indigo-600 hover:underline"
              >
                Privacy Policy
              </Link>
              , which forms part of these Terms of Service.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              9. Termination
            </h2>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>
                You can delete your account at any time in the settings
              </li>
              <li>
                When you delete your account, all of your data is
                irrevocably removed (documents, embeddings, knowledge graph,
                audit logs)
              </li>
              <li>
                The Provider may terminate access with immediate effect in
                the event of serious violations of these Terms
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              10. Changes to These Terms
            </h2>
            <p className="mt-2">
              The Provider reserves the right to amend these Terms of
              Service. Changes will be communicated by email or in-app
              notification. If the user does not object within 30 days, the
              amended Terms are deemed accepted.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              11. Governing Law and Jurisdiction
            </h2>
            <p className="mt-2">
              The law of the Federal Republic of Germany applies, excluding
              the UN Convention on Contracts for the International Sale of
              Goods (CISG). To the extent permitted by law, the place of
              jurisdiction is the Provider&apos;s place of residence.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-text">
              12. Severability
            </h2>
            <p className="mt-2">
              Should any provision of these Terms of Service be or become
              invalid, the validity of the remaining provisions shall not be
              affected. The invalid provision shall be replaced by a valid
              provision that most closely reflects its economic purpose.
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
              <Link
                href="/datenschutz"
                className="hover:text-text transition-colors"
              >
                Privacy Policy
              </Link>
              <Link href="/agb" className="font-medium text-text">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
