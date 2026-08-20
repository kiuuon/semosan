import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const repoRoot = path.join(mobileRoot, '../..');
const outPath = path.join(repoRoot, 'OSS_LICENSES.md');

const packageJson = JSON.parse(fs.readFileSync(path.join(mobileRoot, 'package.json'), 'utf8'));
const directDeps = new Set(Object.keys(packageJson.dependencies ?? {}));

const result = spawnSync('pnpm', ['licenses', 'list', '--prod', '--json'], {
  cwd: mobileRoot,
  encoding: 'utf8',
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const grouped = JSON.parse(result.stdout);
const byName = new Map();

for (const [license, packages] of Object.entries(grouped)) {
  for (const pkg of packages) {
    const name = pkg.name;
    if (!name || !directDeps.has(name)) continue;
    const version = Array.isArray(pkg.versions) ? pkg.versions[0] : '';
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        version: String(version || ''),
        licenses: pkg.license || license,
        repository: pkg.homepage || '',
      });
    }
  }
}

const items = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
const missing = [...directDeps].filter((name) => !byName.has(name)).sort();

const lines = [
  '# Open Source Licenses',
  '',
  '세모산(Semosan) 앱에서 직접 사용하는 오픈소스 패키지 목록입니다.',
  '각 패키지가 의존하는 하위 라이브러리의 라이선스는 해당 패키지 저장소의 고지를 따릅니다.',
  '',
  '| Package | Version | License | Repository |',
  '| --- | --- | --- | --- |',
];

for (const item of items) {
  const repo = item.repository ? `[link](${item.repository})` : '';
  lines.push(`| \`${item.name}\` | ${item.version || '-'} | ${item.licenses} | ${repo} |`);
}

lines.push('');
fs.writeFileSync(outPath, `${lines.join('\n')}\n`);
console.log(`Wrote ${items.length} direct packages to ${outPath}`);
if (missing.length > 0) {
  console.warn('Missing license info for:', missing.join(', '));
}
