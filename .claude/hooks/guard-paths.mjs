#!/usr/bin/env node
// PreToolUse guard: block Edit/Write to sensitive or generated files.
// Reads the hook payload on stdin, denies the tool call if the target matches.
import { readFileSync } from "node:fs";

const DENY = [
  /(^|\/)\.env(\.[^/]+)?$/, // .env, .env.local, .env.production
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)\.git\//,
  /(^|\/)dist\//,
  /(^|\/)node_modules\//,
];

let data;
try {
  data = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // can't parse the payload — don't block
}

const path = data.tool_input?.file_path ?? "";
if (path && DENY.some((re) => re.test(path))) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Editing ${path} is blocked: sensitive or generated file. Change the source, not this.`,
      },
    }),
  );
}
process.exit(0);