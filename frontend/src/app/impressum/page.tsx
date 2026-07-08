import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Notice – PWBS",
  description:
    "Legal Notice and provider identification pursuant to Section 5 of the German Telemedia Act (TMG).",
};

export default function ImpressumPage() {
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
          Legal Notice
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Information pursuant to Section 5 of the German Telemedia Act (TMG)
        </p>

        <div className="mt-8 space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text">Provider</h2>
            <p className="mt-2">
              PWBS – Personal Knowledge Operating System
              <br />
              Mick Gajewski
              <br />
              [Street and house number]
              <br />
              [Postal code, city]
              <br />
              Germany
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text">Contact</h2>
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:kontakt@pwbs.app"
                className="text-indigo-600 hover:underline"
              >
                kontakt@pwbs.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text">
              Responsible for content pursuant to Section 55(2) of the German
              Interstate Broadcasting Treaty (RStV)
            </h2>
            <p className="mt-2">
              Mick Gajewski
              <br />
              [Street and house number]
              <br />
              [Postal code, city]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text">
              EU Dispute Resolution
            </h2>
            <p className="mt-2">
              The European Commission provides a platform for online dispute
              resolution (ODR):{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . We are neither willing nor obliged to participate in dispute
              resolution proceedings before a consumer arbitration board.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text">
              Liability for Content
            </h2>
            <p className="mt-2">
              As a service provider, we are responsible for our own content on
              these pages under general law pursuant to Section 7(1) TMG.
              However, pursuant to Sections 8 to 10 TMG, we are not obliged as
              a service provider to monitor transmitted or stored third-party
              information or to investigate circumstances that indicate
              unlawful activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text">
              Liability for Links
            </h2>
            <p className="mt-2">
              Our website contains links to external third-party websites over
              whose content we have no control. The respective provider or
              operator of the linked pages is always responsible for their
              content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text">
              Copyright
            </h2>
            <p className="mt-2">
              The content and works created by the site operators on these
              pages are subject to German copyright law. Reproduction,
              editing, distribution, and any kind of use beyond the limits of
              copyright law require the written consent of the respective
              author or creator.
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
              <Link href="/impressum" className="font-medium text-text">
                Legal Notice
              </Link>
              <Link
                href="/datenschutz"
                className="hover:text-text transition-colors"
              >
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
