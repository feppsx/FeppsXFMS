import { PublicShell } from "@/components/PublicShell";
import { TrackTokenForm } from "@/components/TrackTokenForm";

export const dynamic = "force-dynamic";

export default function TrackLandingPage() {
  return (
    <PublicShell showTrackLink={false}>
      <div className="max-w-md mx-auto text-center pt-6">
        <h1 className="text-3xl font-semibold text-brand-blue mb-8">STATUS REPORT</h1>
        <div className="text-left">
          <TrackTokenForm />
        </div>
      </div>
    </PublicShell>
  );
}
