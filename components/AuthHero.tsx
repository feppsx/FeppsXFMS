// Shared split-screen shell for /login, /signup, /login/forgot, /auth/reset.
// Left half: brand-gradient hero with logo + tagline.
// Right half: whatever form the auth page passes in.

import Image from "next/image";
import { ShieldCheck, Zap, Clock } from "lucide-react";

export function AuthHero({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left: hero */}
      <div className="hidden md:flex bg-brand-hero text-white p-10 flex-col justify-between relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative">
          <div className="inline-block bg-white/95 rounded-xl p-3 shadow-lg">
            <Image
              src="/logo.png"
              alt="FeppsXFMS"
              width={180}
              height={48}
              className="h-12 w-auto object-contain block logo-live"
              unoptimized
              priority
            />
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Facility ticketing made simple.
          </h1>
          <p className="text-brand-100 text-base">
            Raise, assign, resolve — track every request from any site in one place.
          </p>

          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 mt-0.5 text-accent-400 shrink-0" />
              <span>Live status updates the moment a technician acts on a job.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 mt-0.5 text-accent-400 shrink-0" />
              <span>Photo evidence and signed invoices for every closed ticket.</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-0.5 text-accent-400 shrink-0" />
              <span>Trades matched to your building, so fixes land faster.</span>
            </li>
          </ul>
        </div>

        <div className="relative text-xs text-brand-200">
          © FeppsXFMS
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-4 py-8 bg-white relative">
        {/* Mobile-only mini logo */}
        <div className="md:hidden absolute top-6 left-1/2 -translate-x-1/2">
          <Image
            src="/logo.png"
            alt="360 Integrated"
            width={130}
            height={36}
            className="h-9 w-auto object-contain logo-live"
            unoptimized
            priority
          />
        </div>
        <div className="w-full max-w-sm md:mt-0 mt-20">{children}</div>
      </div>
    </div>
  );
}
