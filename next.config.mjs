const previewHeaders =
  process.env.VERCEL_ENV === "preview"
    ? [
        {
          key: "X-Robots-Tag",
          value: "noindex, nofollow",
        },
      ]
    : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: previewHeaders,
      },
    ];
  },
};

export default nextConfig;
