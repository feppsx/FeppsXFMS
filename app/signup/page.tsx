"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthHero } from "@/components/AuthHero";
import { Loader2, UserPlus } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (password.length < 8)        return setError("Password must be at least 8 characters.");

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    setLoading(false);

    if (signUpError) { setError(signUpError.message); return; }
    if (!data.session) { setNeedsConfirm(true); return; }
    router.push("/client/tickets");
    router.refresh();
  }

  if (needsConfirm) {
    return (
      <div className="space-y-3">
        <div className="mb-4">
          <div className="text-2xl font-semibold text-slate-900">Check your email</div>
          <div className="text-sm text-slate-500 mt-1">Almost there.</div>
        </div>
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          A confirmation link was sent to <span className="font-medium">{email}</span>. Click it, then come back and sign in.
        </div>
        <Link href="/login" className="block text-center text-sm text-brand hover:underline mt-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-2xl font-semibold text-slate-900">Create your account</div>
        <div className="text-sm text-slate-500 mt-1">Start raising tickets in seconds.</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="name" placeholder="e.g. Anita Sharma"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="new-password" placeholder="min 8 characters"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-600 text-white font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 shadow-card"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Create account
        </button>

        <div className="text-xs text-slate-500 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </form>
    </>
  );
}

export default function SignupPage() {
  return (
    <AuthHero>
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthHero>
  );
}
