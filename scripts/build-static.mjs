import { cp, mkdir, rm, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(projectRoot, "public");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await copyFile(join(projectRoot, "index.html"), join(outputDir, "index.html"));
await cp(join(projectRoot, "src"), join(outputDir, "src"), { recursive: true });

console.log("ArcQuest static site built into public/");
