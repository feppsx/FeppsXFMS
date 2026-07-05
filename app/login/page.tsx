"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthHero } from "@/components/AuthHero";
import { Loader2, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const errorFromUrl = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorFromUrl === "no-profile"
      ? "Your account isn't linked to a profile yet. Contact your admin."
      : errorFromUrl === "reset-link-invalid"
      ? "That reset link is expired or already used. Request a new one."
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <>
      <div className="mb-6">
        <div className="text-2xl font-semibold text-slate-900">Welcome back</div>
        <div className="text-sm text-slate-500 mt-1">Sign in to continue.</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Password</label>
            <Link href="/login/forgot" className="text-xs text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            autoComplete="current-password"
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Sign in
        </button>

        <div className="text-xs text-slate-500 text-center pt-1">
          New here?{" "}
          <Link href="/signup" className="text-brand hover:underline font-medium">
            Create an account
          </Link>
        </div>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthHero>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthHero>
  );
}
