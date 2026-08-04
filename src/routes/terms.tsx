import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms of use">
      <p>
        Rinja is a webpage monitoring tool in beta. By using the app you agree
        to these terms.
      </p>
      <h2>What Rinja does</h2>
      <p>
        You ask Rinja to watch text or elements on public webpages. Rinja checks
        those pages on a schedule and notifies you when the watched content
        appears to change.
      </p>
      <h2>Limits</h2>
      <p>
        Monitoring is best-effort. Pages that update only with JavaScript, block
        bots, require login, or change structure often may not be tracked
        reliably. Rinja does not guarantee every change will be detected or that
        checks will run at exact intervals.
      </p>
      <h2>Your responsibility</h2>
      <p>
        Only watch pages you are allowed to access. Do not use Rinja to break
        site terms, harass others, or scrape private data. You are responsible
        for the URLs and content you choose to monitor.
      </p>
      <h2>Accounts</h2>
      <p>
        Keep your login secure. We may suspend accounts that abuse the service
        or harm the product for others.
      </p>
      <h2>Beta</h2>
      <p>
        Features may change, break, or be removed while Rinja is in beta. The
        service is provided as-is without warranties.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms: use the email on your account profile or
        contact the Rinja operator who invited you to the beta.
      </p>
      <p className="text-muted-foreground">Last updated: August 2026</p>
    </LegalShell>
  );
}

function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen px-6 pb-16 pt-6 screen-safe">
      <Link
        to="/welcome"
        aria-label="Back"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-foreground">
        {children}
      </div>
    </div>
  );
}
