import { LogOut, AlertTriangle } from "lucide-react";

/**
 * Shown when the current auth.users record has no matching row in `profiles`.
 * The user is technically signed in but the app can't route them anywhere,
 * so we render this instead of looping through /login.
 */
export function NoProfileNotice({ email, userId }: { email: string; userId: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-sm rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Account not linked to a profile</h1>
            <p className="text-sm text-slate-600 mt-1">
              You&apos;re signed in as <span className="font-medium">{email}</span>, but no
              profile row exists for this account yet, so we can&apos;t decide which dashboard
              to send you to.
            </p>

            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Ask your 360 admin to run this in Supabase SQL Editor:</div>
              <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-all">
{`insert into profiles (id, full_name, role)
values ('${userId}', 'Your Name', 'admin');
-- role can be: 'admin', 'technician', or 'requester'`}
              </pre>
            </div>

            <form action="/auth/signout" method="post" className="mt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
