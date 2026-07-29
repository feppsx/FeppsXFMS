"use client";

// Login screen — mobile-first design. On desktop the whole card is centered
// as a phone-sized panel so the red curve doesn't stretch flat across a
// 1920px viewport.

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const errorFromUrl = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    // Outer wrapper: dark backdrop on desktop, so the phone-shaped card pops.
    <div className="min-h-screen w-full bg-slate-100 flex items-stretch md:items-center justify-center md:p-6">
      {/* Phone-sized frame — full-width on mobile, capped at 430px on desktop. */}
      <div className="relative w-full max-w-[430px] min-h-screen md:min-h-0 md:h-[820px] bg-white md:rounded-3xl md:shadow-float overflow-hidden flex flex-col">

        {/* Red curved header — height scales to the CARD width, not viewport. */}
        <div className="relative bg-brand-red h-[220px] rounded-b-[50%/30%]" aria-hidden />

        {/* Dashed-blue logo circle centered, overlapping the curve bottom. */}
        <div className="-mt-16 flex justify-center relative z-10">
          <div className="w-32 h-32 rounded-full bg-white border-2 border-dashed border-brand-blue flex items-center justify-center shadow-float">
            <Image
              src="/logo.png"
              alt="360 Integrated"
              width={100}
              height={100}
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-8 mt-8">
          <h1 className="text-4xl font-bold text-slate-900">LOGIN</h1>
          <p className="text-slate-600 mt-3">Enter Your Credentials To Continue</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-xs font-extrabold tracking-wider uppercase text-slate-800 mb-2">
                Email ID
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email ID"
                autoComplete="email"
                className="w-full rounded-full bg-input-bg px-5 py-3 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold tracking-wider uppercase text-slate-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Your Password"
                  autoComplete="current-password"
                  className="w-full rounded-full bg-input-bg px-5 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link href="/login/forgot" className="text-brand-blue/80 hover:text-brand-blue text-sm font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="pt-6 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-3 bg-brand-blue hover:bg-brand-blue/90 text-white text-lg font-semibold rounded-full px-12 py-3.5 shadow-float disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "LOGIN"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>

        <div className="h-10" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
