export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://averexlanddevelopment.vercel.app"
  );
}

export function isPreviewDeployment(vercelEnv = process.env.VERCEL_ENV) {
  return vercelEnv === "preview";
}

export function getRobotsForEnvironment(vercelEnv = process.env.VERCEL_ENV) {
  return isPreviewDeployment(vercelEnv)
    ? {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      };
}
