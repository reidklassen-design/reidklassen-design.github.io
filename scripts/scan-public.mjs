#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

const requestedRoots = process.argv.slice(2);
const roots = requestedRoots.length > 0 ? requestedRoots : ["public", "dist"];
const textExtensions = new Set([
  ".css",
  ".csv",
  ".html",
  ".js",
  ".json",
  ".map",
  ".md",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml",
]);

const checks = [
  {
    label: "private home-directory path",
    pattern: /(?:file:\/{2,3})?(?:\/home\/|\/Users\\?|[A-Z]:\\Users\\)[^\s"'<>]+/gi,
  },
  {
    label: "loopback or localhost endpoint",
    pattern: /(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{2,5})?/gi,
  },
  {
    label: "private LAN address",
    pattern: /\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b/g,
  },
  {
    label: "private key material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    label: "credential-shaped token",
    pattern: /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[opsu]_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}|AKIA[0-9A-Z]{16})\b/g,
  },
  {
    label: "assigned secret",
    pattern: /\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[=:]\s*["'][^"'\s]{8,}["']/gi,
  },
];

async function collectFiles(root) {
  const absoluteRoot = resolve(root);
  let rootStat;
  try {
    rootStat = await stat(absoluteRoot);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`Skipping missing scan target: ${root}`);
      return [];
    }
    throw error;
  }

  if (rootStat.isFile()) return [absoluteRoot];

  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? collectFiles(resolve(absoluteRoot, entry.name))
        : [resolve(absoluteRoot, entry.name)],
    ),
  );
  return nested.flat();
}

const files = (await Promise.all(roots.map(collectFiles)))
  .flat()
  .filter((file) => textExtensions.has(extname(file).toLowerCase()));
const findings = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  for (const check of checks) {
    check.pattern.lastIndex = 0;
    for (const match of content.matchAll(check.pattern)) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push({ file, line, label: check.label });
    }
  }
}

if (findings.length > 0) {
  console.error("Public-artifact safety scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} — ${finding.label}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Public-artifact safety scan passed (${files.length} text files checked).`);
}
