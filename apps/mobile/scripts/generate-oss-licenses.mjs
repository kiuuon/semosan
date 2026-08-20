import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.join(__dirname, '..');
const repoRoot = path.join(mobileRoot, '../..');
const mdOutPath = path.join(repoRoot, 'OSS_LICENSES.md');
const tsOutPath = path.join(mobileRoot, 'lib/data/ossLicenses.ts');
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
      license: String(pkg.license || 'UNKNOWN'),
      repository: normalizeRepoUrl(pkg.repository),
    };
  } catch (error) {
    console.warn(`Failed to resolve ${name}:`, error.message);
    return {
      name,
      version: '',
      license: 'UNKNOWN',
      repository: '',
    };
  }
}

const items = directDeps.map(readPackageMeta);

const mdLines = [
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
  mdLines.push(`| \`${item.name}\` | ${item.version || '-'} | ${item.license} | ${repo} |`);
}

mdLines.push('');
fs.writeFileSync(mdOutPath, `${mdLines.join('\n')}\n`);

const tsLines = [
  'export type OssLicenseItem = {',
  '  name: string;',
  '  version: string;',
  '  license: string;',
  '  repository: string;',
  '};',
  '',
  'export const OSS_LICENSES_INTRO =',
  "  '세모산은 다양한 오픈소스 소프트웨어를 사용하여 제공됩니다. 아래에 직접 사용하는 패키지와 라이선스를 안내합니다.';",
  '',
  'export const OSS_LICENSES: OssLicenseItem[] = [',
];

for (const item of items) {
  tsLines.push('  {');
  tsLines.push(`    name: ${JSON.stringify(item.name)},`);
  tsLines.push(`    version: ${JSON.stringify(item.version)},`);
  tsLines.push(`    license: ${JSON.stringify(item.license)},`);
  tsLines.push(`    repository: ${JSON.stringify(item.repository)},`);
  tsLines.push('  },');
}

tsLines.push('];', '');
fs.writeFileSync(tsOutPath, `${tsLines.join('\n')}\n`);

console.log(`Wrote ${items.length} direct packages to ${mdOutPath} and ${tsOutPath}`);

const missingRepo = items.filter((item) => !item.repository).map((item) => item.name);
if (missingRepo.length > 0) {
  console.warn('Missing repository URL for:', missingRepo.join(', '));
}
