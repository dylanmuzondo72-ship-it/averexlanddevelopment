import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const routes = [
  ["/", "Integrated Land, Planning and Development Solutions"],
  ["/about", "Integrated guidance for land, planning and development decisions"],
  ["/services", "Land, planning, property and development services"],
  ["/available-land", "Verified published land listings"],
  ["/projects", "Representative service scenarios"],
  ["/contact", "Start with the property, location and objective"],
  ["/login", "Sign in to manage Averex business records."],
];

const imagePaths = [
  "/assets/images/advisory.png",
  "/assets/images/averex-logo.png",
  "/assets/images/due-diligence.png",
  "/assets/images/favicon.png",
  "/assets/images/hero-land.png",
  "/assets/images/infrastructure.png",
  "/assets/images/map-location.png",
  "/assets/images/project-management.png",
  "/assets/images/surveying.png",
  "/assets/images/verification.png",
];

function run(command, args) {
  return spawn(command, args, {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Timed out waiting for Next server");
}

async function expectRoute(path, expectedText) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== 200) {
    throw new Error(`${path} returned ${response.status}`);
  }
  const html = await response.text();
  if (!html.includes(expectedText)) {
    throw new Error(`${path} did not include expected text: ${expectedText}`);
  }
  return html;
}

async function expectAsset(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (response.status !== 200) {
    throw new Error(`${path} asset returned ${response.status}`);
  }
}

async function expectDashboardProtection() {
  const response = await fetch(`${baseUrl}/dashboard`, {
    redirect: "manual",
  });
  if (response.status !== 307) {
    throw new Error(
      `/dashboard returned ${response.status}, expected a 307 redirect`,
    );
  }
  const location = response.headers.get("location");
  const redirectUrl = location ? new URL(location, baseUrl) : null;
  if (
    !redirectUrl ||
    `${redirectUrl.pathname}${redirectUrl.search}` !==
      "/login?next=%2Fdashboard"
  ) {
    throw new Error(
      `/dashboard redirect changed: ${location}`,
    );
  }
}

async function main() {
  const nextBin = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url),
  );
  const server = run(process.execPath, [
    nextBin,
    "start",
    "--port",
    String(port),
    "--hostname",
    "127.0.0.1",
  ]);
  let stderr = "";
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer();
    for (const [path, expectedText] of routes) {
      await expectRoute(path, expectedText);
    }
    const homeHtml = await expectRoute("/", routes[0][1]);
    const contactHtml = await expectRoute("/contact", routes[5][1]);
    const loginHtml = await expectRoute("/login", routes[6][1]);
    for (const path of imagePaths) {
      await expectAsset(path);
    }
    if (!homeHtml.includes("https://wa.me/263774041144?text=Hello%20Averex%20Land%20Solutions")) {
      throw new Error("Homepage floating WhatsApp URL changed");
    }
    if (!homeHtml.includes("Staff Portal") || !homeHtml.includes("href=\"/login\"")) {
      throw new Error("Staff Portal navigation link is missing");
    }
    if (!homeHtml.includes('class="site-header"') || !homeHtml.includes('class="site-footer"')) {
      throw new Error("Public chrome is missing from the homepage");
    }
    if (homeHtml.includes("Staff Login")) {
      throw new Error("Staff Login label should be renamed to Staff Portal");
    }
    if (!contactHtml.includes("id=\"whatsappForm\"")) {
      throw new Error("Contact form id changed");
    }
    if (!loginHtml.includes("noindex") || !loginHtml.includes("nofollow")) {
      throw new Error("Login page is missing noindex/nofollow metadata");
    }
    if (loginHtml.includes('class="site-header"') || loginHtml.includes('class="site-footer"') || loginHtml.includes('class="whatsapp-float"')) {
      throw new Error("Login page inherited public chrome");
    }
    if (!loginHtml.includes("Return to public site")) {
      throw new Error("Login page is missing its public-site return link");
    }
    await expectDashboardProtection();
    const robots = await (await fetch(`${baseUrl}/robots.txt`)).text();
    for (const path of ["/dashboard", "/auth", "/api", "/forgot-password", "/reset-password"]) {
      if (!robots.includes(`Disallow: ${path}`)) throw new Error(`robots.txt missing ${path}`);
    }
    const sitemap = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
    if (!sitemap.includes("https://averexlandsolutions.com") || /\/(dashboard|auth|login|reset-password)/.test(sitemap)) {
      throw new Error("Sitemap canonical or privacy regression");
    }
    const unsafeRedirect = await fetch(`${baseUrl}/auth/callback?next=${encodeURIComponent('/\\evil.invalid')}`, { redirect: "manual" });
    const safeLocation = new URL(unsafeRedirect.headers.get("location"), baseUrl);
    if (!["127.0.0.1", "localhost"].includes(safeLocation.hostname) || safeLocation.port !== String(port) || safeLocation.pathname !== "/dashboard") throw new Error(`External auth redirect allowed: ${safeLocation}`);
    const missingListing = await fetch(`${baseUrl}/available-land/unknown-listing`);
    if (missingListing.status !== 404) {
      throw new Error(`Unknown listing returned ${missingListing.status}, expected 404`);
    }
    console.log("Public route smoke tests passed");
  } finally {
    server.kill();
    if (stderr.trim()) {
      console.error(stderr.trim());
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
