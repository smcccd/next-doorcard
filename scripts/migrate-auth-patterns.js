#!/usr/bin/env node

/**
 * Migration script to update auth patterns throughout the codebase
 *
 * This script helps migrate from direct getServerSession usage to the new
 * centralized auth functions in lib/require-auth-user.ts
 *
 * Usage: node scripts/migrate-auth-patterns.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Files that have been manually updated (to avoid conflicts)
const manuallyUpdatedFiles = [
  "app/api/doorcards/route.ts",
  "app/api/doorcards/validate/route.ts",
  "app/doorcard/[doorcardId]/edit/page.tsx",
  "app/api/terms/route.ts",
  "lib/require-auth-user.ts",
];

// Patterns to search for and replace
const patterns = [
  {
    name: "API Route Auth Pattern",
    search:
      /import\s+\{\s*getServerSession\s*\}\s+from\s+["']next-auth(?:\/next)?["'];\s*\nimport\s+\{\s*authOptions\s*\}\s+from\s+["']@\/lib\/auth["'];\s*\n/,
    replace: `import { requireAuthUserAPI } from "@/lib/require-auth-user";\n`,
    condition: (content) =>
      content.includes("NextResponse.json") && content.includes("status: 401"),
    description:
      "Replace getServerSession + authOptions imports with requireAuthUserAPI for API routes",
  },
  {
    name: "API Route Auth Check",
    search:
      /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);\s*\n\s*if\s*\(\s*!session\?\.\?\.user\?\.\?\.email\s*\)\s*\{\s*\n\s*return\s+NextResponse\.json\(\s*\{\s*error:\s*["']Unauthorized["']\s*\}\s*,\s*\{\s*status:\s*401\s*\}\s*\);\s*\n\s*\}\s*\n\s*\/\/\s*Find\s+user\s+by\s+email\s*since\s+session\s+might\s+not\s+have\s+id\s*\n\s*const\s+user\s*=\s*await\s+prisma\.user\.findUnique\(\{\s*\n\s*where:\s*\{\s*email:\s*session\.user\.email\s*\}\s*,\s*\}\);\s*\n\s*if\s*\(\s*!user\s*\)\s*\{\s*\n\s*return\s+NextResponse\.json\(\s*\{\s*error:\s*["']User\s+not\s+found["']\s*\}\s*,\s*\{\s*status:\s*404\s*\}\s*\);\s*\n\s*\}\s*\n/,
    replace: `const authResult = await requireAuthUserAPI();\nif ('error' in authResult) {\n  return NextResponse.json({ error: authResult.error }, { status: authResult.status });\n}\nconst { user } = authResult;\n`,
    condition: (content) =>
      content.includes("NextResponse.json") && content.includes("status: 401"),
    description:
      "Replace session check + user lookup with requireAuthUserAPI for API routes",
  },
  {
    name: "Page Auth Pattern",
    search:
      /import\s+\{\s*.*?redirect\s*.*?\}\s+from\s+["']next\/navigation["'];\s*\nimport\s+\{\s*getServerSession\s*\}\s+from\s+["']next-auth(?:\/next)?["'];\s*\nimport\s+\{\s*authOptions\s*\}\s+from\s+["']@\/lib\/auth["'];\s*\n/,
    replace: `import { notFound } from "next/navigation";\nimport { requireAuthUser } from "@/lib/require-auth-user";\n`,
    condition: (content) =>
      content.includes('redirect("/login")') &&
      !content.includes("NextResponse"),
    description:
      "Replace getServerSession + authOptions imports with requireAuthUser for pages",
  },
  {
    name: "Page Auth Check",
    search:
      /const\s+session\s*=\s*await\s+getServerSession\(authOptions\);\s*\n\s*if\s*\(\s*!session\?\.\?\.user\?\.\?\.email\s*\)\s*\{\s*\n\s*redirect\(\s*["']\/login["']\s*\);\s*\n\s*\}\s*\n\s*\/\/\s*Find\s+user\s+by\s+email\s*\n\s*const\s+user\s*=\s*await\s+prisma\.user\.findUnique\(\{\s*\n\s*where:\s*\{\s*email:\s*session\.user\.email\s*\}\s*,\s*\}\);\s*\n\s*if\s*\(\s*!user\s*\)\s*\{\s*\n\s*redirect\(\s*["']\/login["']\s*\);\s*\n\s*\}\s*\n/,
    replace: `const user = await requireAuthUser();\n`,
    condition: (content) =>
      content.includes('redirect("/login")') &&
      !content.includes("NextResponse"),
    description:
      "Replace session check + user lookup with requireAuthUser for pages",
  },
];

function findFiles(dir, extensions = [".ts", ".tsx"]) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith(".") &&
        item !== "node_modules"
      ) {
        traverse(fullPath);
      } else if (
        stat.isFile() &&
        extensions.some((ext) => item.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function updateFile(filePath) {
  if (manuallyUpdatedFiles.some((file) => filePath.includes(file))) {
    console.log(`⏭️  Skipping manually updated file: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let updated = false;

  for (const pattern of patterns) {
    if (pattern.condition && !pattern.condition(content)) {
      continue;
    }

    if (pattern.search.test(content)) {
      console.log(`🔄 Applying ${pattern.name} to ${filePath}`);
      content = content.replace(pattern.search, pattern.replace);
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Updated: ${filePath}`);
  }
}

function main() {
  console.log("🚀 Starting auth pattern migration...\n");

  const projectRoot = process.cwd();
  const files = findFiles(projectRoot);

  console.log(`📁 Found ${files.length} TypeScript/TSX files to check\n`);

  let updatedCount = 0;

  for (const file of files) {
    try {
      updateFile(file);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✨ Migration complete! Processed ${updatedCount} files.`);
  console.log("\n📋 Next steps:");
  console.log("1. Review the changes made");
  console.log("2. Test your application thoroughly");
  console.log("3. Update any remaining auth patterns manually if needed");
  console.log("4. Consider removing or simplifying your middleware.ts file");
}

if (require.main === module) {
  main();
}

module.exports = { patterns, updateFile, findFiles };
