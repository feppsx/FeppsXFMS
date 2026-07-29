// Splash — matches mockup #9: two red half-circles top/bottom, logo centered.
// Used as a static loading page you can link to from bookmarks/PWA.

import Image from "next/image";
import Link from "next/link";

export default function SplashPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Top red half-circle */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[140%] h-[420px] bg-brand-red rounded-b-full" aria-hidden />
      {/* Bottom red half-circle */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[140%] h-[420px] bg-brand-red rounded-t-full" aria-hidden />

      {/* Center logo */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <Link href="/login" aria-label="Enter">
          <Image
            src="/logo.png"
            alt="360 Integrated FM & SM"
            width={220}
            height={140}
            className="object-contain logo-live dark:hidden"
            unoptimized
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="360 Integrated FM & SM"
            width={220}
            height={140}
            className="object-contain logo-live hidden dark:block"
            unoptimized
            priority
          />
        </Link>
      </div>
    </div>
  );
}
