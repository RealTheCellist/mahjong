import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../../node_modules/riichi-mahjong-tiles/components/regular/regular-merged');
const DEST_DIR = path.resolve(__dirname, '../src/tiles');

const NAMES = [
  ...Array.from({ length: 9 }, (_, i) => `Man${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `Pin${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `Sou${i + 1}`),
  'Ton', 'Nan', 'Shaa', 'Pei', 'Haku', 'Hatsu', 'Chun',
];

for (const name of NAMES) {
  const componentName = `Regular${name}M`;
  const srcPath = path.join(SRC_DIR, `${componentName}.tsx`);
  const destPath = path.join(DEST_DIR, `${componentName}.tsx`);
  execFileSync('node', [path.join(__dirname, 'convert-tile.mjs'), srcPath, destPath, componentName], {
    stdio: 'inherit',
  });
  console.log('converted', componentName);
}
