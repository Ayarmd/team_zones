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

const exportAll = process.argv.includes("--all");
const exportAttributes = process.argv.includes("--attributes");

const htmlFile = exportAttributes
  ? join(__dirname, "entity-attribute-diagrams.html")
  : join(__dirname, "zones-erd-report.html");

const fileUrl = `file:///${htmlFile.replace(/\\/g, "/")}`;
const pageUrl = exportAttributes
  ? fileUrl
  : exportAll
    ? fileUrl
    : `${fileUrl}?mode=erd`;

const outFile = exportAttributes
  ? join(__dirname, "zones-entity-attributes.pdf")
  : exportAll
    ? join(__dirname, "zones-system-analysis-full.pdf")
    : join(__dirname, "zones-erd-diagrams.pdf");

console.log(`Rendering: ${pageUrl}`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
await page.goto(pageUrl, { waitUntil: "networkidle0", timeout: 120000 });

if (exportAttributes) {
  await page.waitForFunction(
    () => document.querySelectorAll(".diagram-card svg").length >= 31,
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
  landscape: !exportAttributes,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
});

await browser.close();
console.log(`PDF created: ${outFile}`);
