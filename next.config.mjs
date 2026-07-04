/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // @react-pdf/renderer is ESM-only; Next needs to transpile it explicitly
  // so it doesn't try to import it as an external ESM package.
  transpilePackages: ["@react-pdf/renderer"],

  images: {
    remotePatterns: [
      // Supabase Storage public URLs — matches your project's URL
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/**" },
    ],
  },
};

export default nextConfig;
