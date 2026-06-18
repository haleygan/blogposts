/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync, mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const repoRoot = process.cwd();
const inputRoot = path.join(repoRoot, 'assets', 'editable_diagrams');
const outputRoot = path.join(repoRoot, 'assets', 'static_diagrams');
const d2BaseImage = process.env.D2_BASE_IMAGE || 'alpine:3.20';

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function collectD2Files(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectD2Files(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.d2')) {
      files.push(fullPath);
    }
  }

  return files;
}

function renderFile(inputFile: string) {
  const relativePath = path.relative(inputRoot, inputFile);
  const relativeDir = path.dirname(relativePath);
  const outputName = `${path.basename(relativePath, '.d2').replace(/\s+/g, '_')}.svg`;
  const outputDir = path.join(outputRoot, relativeDir);
  const outputFile = path.join(outputDir, outputName);
  const containerInput = `/work/${toPosixPath(path.relative(repoRoot, inputFile))}`;
  const containerOutput = `/work/${toPosixPath(path.relative(repoRoot, outputFile))}`;

  mkdirSync(outputDir, { recursive: true });

  const args = [
    'run',
    '--rm',
    '-e',
    `HOST_UID=${process.getuid?.() ?? 1000}`,
    '-e',
    `HOST_GID=${process.getgid?.() ?? 1000}`,
    '-e',
    `D2_INPUT=${containerInput}`,
    '-e',
    `D2_OUTPUT=${containerOutput}`,
    '-v',
    `${repoRoot}:/work`,
    '-w',
    '/work',
    d2BaseImage,
    'sh',
    '-lc',
    [
      'apk add --no-cache curl tar gzip make >/dev/null',
      'curl -fsSL https://d2lang.com/install.sh | sh -s -- --method standalone --prefix /tmp/d2 >/dev/null',
      '"/tmp/d2/bin/d2" "$D2_INPUT" "$D2_OUTPUT"',
      'chown "$HOST_UID:$HOST_GID" "$D2_OUTPUT"',
    ].join(' && '),
  ];

  const result = spawnSync('docker', args, { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Failed to render ${inputFile}`);
  }
}

function main() {
  if (!existsSync(inputRoot)) {
    throw new Error(`Missing input directory: ${inputRoot}`);
  }

  const files = collectD2Files(inputRoot);
  if (files.length === 0) {
    console.log('No D2 files found.');
    return;
  }

  for (const file of files) {
    renderFile(file);
  }

  console.log(`Rendered ${files.length} D2 diagram(s) into ${outputRoot}.`);
}

main();
