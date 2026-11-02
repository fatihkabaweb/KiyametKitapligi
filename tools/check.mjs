// Kullanım: node tools/check.mjs  — içeriği doğrular, hiçbir dosya yazmaz.
import { loadContent } from './content.mjs';

const { categories, articles, errors, warnings } = loadContent();
for (const w of warnings) console.warn('UYARI  ' + w);
for (const e of errors) console.error('HATA   ' + e);

const totalWords = articles.reduce((s, a) => s + a.words, 0);
console.log(`\n${categories.length} kategori, ${articles.length} makale, ~${totalWords} kelime.`);
for (const c of categories) {
  const n = articles.filter((a) => a.cat === c.id).length;
  console.log(`  ${c.id.padEnd(12)} ${String(n).padStart(3)} makale`);
}
if (errors.length) {
  console.error(`\n${errors.length} hata bulundu.`);
  process.exit(1);
}
console.log('\nİçerik geçerli.');
