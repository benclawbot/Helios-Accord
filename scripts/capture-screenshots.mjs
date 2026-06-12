import { chromium } from "playwright";
import path from "node:path";

const out = path.resolve("docs/screenshots");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

const capture = async (name) => {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false });
};

await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await capture("hero");
await page.getByRole("button", { name: "ASSUME THE MANDATE" }).click();
await capture("system-map");

for (const [tab, name] of [
  ["Colonies", "colony-directorate"],
  ["Market", "solar-marketplace"],
  ["Technology", "technology-horizon"],
  ["Council", "political-council"],
  ["Fleets", "fleet-operations"],
]) {
  await page.getByRole("button", { name: tab, exact: true }).click();
  await capture(name);
}

await page.getByRole("button", { name: "Open command interface", exact: true }).first().click();
await capture("fleet-command-interface");
await browser.close();
