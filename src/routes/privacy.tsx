import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 pb-16 pt-6 screen-safe">
      <Link
        to="/welcome"
        aria-label="Back"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="text-[28px] font-semibold tracking-tight">Privacy</h1>
      <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-foreground">
        <p>
          This notice explains what Rinja stores while the product is in beta.
        </p>
        <h2>Account data</h2>
        <p>
          We store your email (and name if you provide it), authentication
          details via Supabase, and settings such as push and notification
          preferences.
        </p>
        <h2>Watches and alerts</h2>
        <p>
          We store the URLs you watch, selectors/text you highlight, check
          results, and in-app alerts created when something changes.
        </p>
        <h2>Usage</h2>
        <p>
          We may store search/lookup activity and last-active timestamps to
          operate and improve the product (including an admin overview for the
          operator).
        </p>
        <h2>Push notifications</h2>
        <p>
          If you enable push, we store a push subscription for your device so we
          can send change alerts. You can turn this off in Settings.
        </p>
        <h2>Third parties</h2>
        <p>
          Infrastructure providers (for example Supabase, Vercel, and optional
          AI search providers) process data needed to run the app. Google sign-in
          is handled by Google and Supabase Auth when you choose that option.
        </p>
        <h2>Your choices</h2>
        <p>
          You can delete watches, disable push, or log out. To delete your
          account entirely during beta, contact the Rinja operator.
        </p>
        <p className="text-muted-foreground">Last updated: August 2026</p>
      </div>
    </div>
  );
}
