import { PublicShell } from "@/components/PublicShell";
import { TrackTokenForm } from "@/components/TrackTokenForm";

export const dynamic = "force-dynamic";

export default function TrackLandingPage() {
  return (
    <PublicShell showTrackLink={false}>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-card max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900">Check ticket status</h1>
        <p className="text-sm text-slate-600 mt-1 mb-5">
          Enter the tracking code you received after submitting your ticket.
        </p>
        <TrackTokenForm />
      </div>
    </PublicShell>
  );
}
