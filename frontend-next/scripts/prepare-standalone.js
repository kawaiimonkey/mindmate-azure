const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");
const sourceStaticDir = path.join(projectRoot, ".next", "static");
const targetStaticDir = path.join(standaloneRoot, ".next", "static");
const publicDir = path.join(projectRoot, "public");
const targetPublicDir = path.join(standaloneRoot, "public");

function copyDirIfExists(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
}

if (!fs.existsSync(standaloneRoot)) {
  throw new Error("Standalone build output was not found at .next/standalone.");
}

copyDirIfExists(sourceStaticDir, targetStaticDir);
copyDirIfExists(publicDir, targetPublicDir);
