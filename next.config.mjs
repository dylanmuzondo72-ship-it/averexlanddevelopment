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
  experimental: {
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  async headers() {
    if (!previewHeaders.length) return [];
    return [
      {
        source: "/:path*",
        headers: previewHeaders,
      },
    ];
  },
};

export default nextConfig;
