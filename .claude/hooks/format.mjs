#!/usr/bin/env node
// PostToolUse: format the file just edited, if the project has prettier.
// Degrades to a no-op when prettier isn't installed — safe in any project.
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

let data;
try {
  data = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const file = data.tool_input?.file_path;
if (!file || !existsSync(file)) process.exit(0);
if (!/\.(ts|tsx|js|jsx|vue|json|css|scss|md)$/.test(file)) process.exit(0);

const prettier = "node_modules/.bin/prettier";
if (existsSync(prettier)) {
  try {
    execFileSync(prettier, ["--write", file], { stdio: "ignore" });
  } catch {
    // formatting failures must never block the turn
  }
}
process.exit(0);