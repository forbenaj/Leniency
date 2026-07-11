const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIRECTORIES = ["src", "scripts", "tests"];

function collectJavaScriptFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectJavaScriptFiles(absolutePath));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(absolutePath);
  }
  return files;
}

const files = SOURCE_DIRECTORIES.flatMap((directory) => collectJavaScriptFiles(path.join(ROOT, directory))).sort();
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status === 0) continue;
  process.stderr.write(result.stderr || result.stdout || `Syntax check failed: ${path.relative(ROOT, file)}\n`);
  process.exit(result.status || 1);
}

console.log(`Syntax checked ${files.length} JavaScript files.`);
