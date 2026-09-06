import fs from 'node:fs';

const css = fs.readFileSync(new URL('../src/reference-exact.css', import.meta.url), 'utf8');

if (css.includes('.alfhd-main section,.alfhd-main article{')) {
  console.error('FAIL: global section/article card styling still applies inside conversation workspace');
  process.exit(1);
}

if (!css.includes('.alfhd-main:not(.alfhd-main-conv) section,.alfhd-main:not(.alfhd-main-conv) article{')) {
  console.error('FAIL: conversation-safe section/article selector is missing');
  process.exit(1);
}

console.log('PASS: conversation workspace is excluded from generic section/article card styling');
