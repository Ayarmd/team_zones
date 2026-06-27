import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeModules = join(__dirname, "node_modules", "puppeteer");

if (!existsSync(nodeModules)) {
  console.log("Installing puppeteer (first run only)...");
  const install = spawnSync("npm", ["install"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
}

const puppeteer = (await import("puppeteer")).default;

function systemChromePaths() {
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  return [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
    join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
  ].filter(Boolean);
}

function installBundledChrome() {
  console.log("Downloading Chrome for Puppeteer (one-time)...");
  const result = spawnSync("npx", ["puppeteer", "browsers", "install", "chrome"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });
  return result.status === 0;
}

async function launchBrowser() {
  const launchOpts = { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] };

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && existsSync(bundled)) {
      return puppeteer.launch({ ...launchOpts, executablePath: bundled });
    }
  } catch {
    // bundled chrome not installed yet
  }

  for (const path of systemChromePaths()) {
    if (existsSync(path)) {
      console.log(`Using browser: ${path}`);
      return puppeteer.launch({ ...launchOpts, executablePath: path });
    }
  }

  if (installBundledChrome()) {
    const bundled = puppeteer.executablePath();
    if (bundled && existsSync(bundled)) {
      return puppeteer.launch({ ...launchOpts, executablePath: bundled });
    }
  }

  throw new Error(
    "Could not find Chrome/Edge. Install Google Chrome or run:\n  npx puppeteer browsers install chrome",
  );
}

const exportAll = process.argv.includes("--all");
const exportAttributes = process.argv.includes("--attributes");
const exportRelationships = process.argv.includes("--relationships");

const htmlFile = exportRelationships
  ? join(__dirname, "entity-relationship-diagrams.html")
  : exportAttributes
    ? join(__dirname, "entity-attribute-diagrams.html")
    : join(__dirname, "zones-erd-report.html");

const fileUrl = `file:///${htmlFile.replace(/\\/g, "/")}`;
const pageUrl = exportRelationships || exportAttributes
  ? fileUrl
  : exportAll
    ? fileUrl
    : `${fileUrl}?mode=erd`;

const outFile = exportRelationships
  ? join(__dirname, "zones-entity-relationships.pdf")
  : exportAttributes
    ? join(__dirname, "zones-entity-attributes.pdf")
    : exportAll
      ? join(__dirname, "zones-system-analysis-full.pdf")
      : join(__dirname, "zones-erd-diagrams.pdf");

console.log(`Rendering: ${pageUrl}`);

const browser = await launchBrowser();
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
await page.goto(pageUrl, { waitUntil: "networkidle0", timeout: 120000 });

if (exportAttributes) {
  await page.waitForFunction(
    () => document.querySelectorAll(".diagram-card svg").length >= 31,
    { timeout: 60000 },
  );
} else if (exportRelationships) {
  await page.waitForFunction(
    () => document.querySelectorAll(".row-svg").length >= 50 && document.querySelector("#full-erd svg"),
    { timeout: 60000 },
  );
} else {
  await page.waitForFunction(
    () => {
      const blocks = document.querySelectorAll(".mermaid");
      if (!blocks.length) return false;
      return [...blocks].every((el) => el.querySelector("svg"));
    },
    { timeout: 120000 },
  );
}

await new Promise((r) => setTimeout(r, 2000));

await page.emulateMediaType("print");
await page.pdf({
  path: outFile,
  format: "A3",
  landscape: !(exportAttributes || exportRelationships),
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
});

await browser.close();
console.log(`PDF created: ${outFile}`);
