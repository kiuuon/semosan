import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const repoRoot = path.join(mobileRoot, '../..');
const outPath = path.join(repoRoot, 'OSS_LICENSES.md');
const requireFromMobile = createRequire(path.join(mobileRoot, 'package.json'));

const packageJson = JSON.parse(fs.readFileSync(path.join(mobileRoot, 'package.json'), 'utf8'));
const directDeps = Object.keys(packageJson.dependencies ?? {}).sort();

function normalizeRepoUrl(repository) {
  if (!repository) return '';
  const raw = typeof repository === 'string' ? repository : repository.url || '';
  return raw
    .trim()
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');
}

function readPackageMeta(name) {
  try {
    const pkgPath = requireFromMobile.resolve(`${name}/package.json`);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return {
      name,
      version: String(pkg.version || ''),
      licenses: String(pkg.license || 'UNKNOWN'),
      repository: normalizeRepoUrl(pkg.repository),
    };
  } catch (error) {
    console.warn(`Failed to resolve ${name}:`, error.message);
    return {
      name,
      version: '',
      licenses: 'UNKNOWN',
      repository: '',
    };
  }
}

const items = directDeps.map(readPackageMeta);
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

const missingRepo = items.filter((item) => !item.repository).map((item) => item.name);
if (missingRepo.length > 0) {
  console.warn('Missing repository URL for:', missingRepo.join(', '));
}
