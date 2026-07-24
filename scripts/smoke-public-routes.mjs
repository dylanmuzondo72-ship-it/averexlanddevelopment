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
    if (homeHtml.includes("Staff Login")) {
      throw new Error("Staff Login label should be renamed to Staff Portal");
    }
    if (!contactHtml.includes("id=\"whatsappForm\"")) {
      throw new Error("Contact form id changed");
    }
    if (!loginHtml.includes("noindex") || !loginHtml.includes("nofollow")) {
      throw new Error("Login page is missing noindex/nofollow metadata");
    }
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
