import Link from "next/link";
import { ProductPreview } from "@/components/landing/product-preview";

const FEATURES = [
  {
    title: "Context Briefings",
    description:
      "A tailored briefing from all your data sources every morning – automatic, with source citations.",
    icon: "📋",
  },
  {
    title: "Semantic Search",
    description:
      "Find information by meaning, not just keywords. Across all your sources.",
    icon: "🔍",
  },
  {
    title: "Knowledge Graph",
    description:
      "Automatically connects your notes, emails, calendars, and documents into a personal knowledge network.",
    icon: "🕸️",
  },
  {
    title: "GDPR by Design",
    description:
      "Your data belongs to you. Encryption, deletability, and transparency are built into the foundation.",
    icon: "🔒",
  },
] as const;

const SOCIAL_PROOF = [
  {
    quote:
      "PWBS has revolutionized my meeting prep. What used to take 30 minutes now takes 2.",
    author: "Dr. Sabine M.",
    role: "Management Consultant",
  },
  {
    quote:
      "Finally a tool that brings my notes, emails, and calendar together – fully privacy-compliant.",
    author: "Thomas K.",
    role: "Head of Research",
  },
  {
    quote:
      "The semantic search uncovers connections I would have missed before.",
    author: "Lisa R.",
    role: "Product Manager",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-xl font-bold text-text">PWBS</span>
          <div className="flex items-center gap-4">
            <Link
              href="/download"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Desktop App
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                hover:bg-indigo-700 transition-colors"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl lg:text-6xl">
          Your personal{" "}
          <span className="text-indigo-600">Knowledge Operating System</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary sm:text-xl">
          PWBS connects your data sources, uncovers relationships, and delivers
          context-aware briefings every day – so you make better decisions.
        </p>

        <div className="mx-auto mt-10 flex flex-col items-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              transition-colors shadow-lg shadow-indigo-600/25"
          >
            Get started for free
          </Link>
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>

        <p className="mt-4 text-sm text-text-tertiary">
          Free · No credit card required
        </p>
      </section>

      {/* Product Preview */}
      <section
        className="bg-surface py-12 sm:py-16"
        aria-label="Product preview"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-text-tertiary">
            This is what your personal knowledge operating system looks like
          </p>
          <ProductPreview />
        </div>
      </section>

      {/* Features Section */}
      <section
        className="bg-surface-secondary py-16 sm:py-24"
        aria-label="Features"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-text sm:text-4xl">
            Your data. Intelligently connected.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-text-secondary">
            PWBS brings heterogeneous data sources together and makes knowledge
            available in context.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-surface p-6 shadow-sm border border-border"
              >
                <div className="text-3xl" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 sm:py-24" aria-label="Testimonials">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-text sm:text-4xl">
            What knowledge workers are saying
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {SOCIAL_PROOF.map((item) => (
              <figure
                key={item.author}
                className="rounded-xl bg-surface-secondary p-6 border border-border"
              >
                <blockquote className="text-text-secondary leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4">
                  <p className="font-semibold text-text">{item.author}</p>
                  <p className="text-sm text-text-tertiary">{item.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to work smarter?
          </h2>
          <p className="mt-4 text-gray-300">
            Open to everyone. Free. No waitlist.
          </p>
          <div className="mx-auto mt-8">
            <Link
              href="/register"
              className="inline-block rounded-xl bg-indigo-600 px-10 py-4 text-base font-semibold
                text-white hover:bg-indigo-700 focus:outline-none focus:ring-2
                focus:ring-indigo-500/50 transition-colors shadow-lg shadow-indigo-600/25"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
              <Link href="/agb" className="hover:text-text transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
