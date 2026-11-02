// Kullanım: node tools/build.mjs
//
// 1. content/ klasöründeki makaleleri doğrular ve app/data/library.js dosyasını üretir.
// 2. app/js/config.js içindeki adı manifest'e ve index.html'e işler.
// 3. app/sw.js içindeki önbellek listesini ve sürümü günceller.
// 4. dist/ klasörüne paylaşılabilir tek dosya sürümünü yazar.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { loadContent, ROOT } from './content.mjs';

const require = createRequire(import.meta.url);
const APP = path.join(ROOT, 'app');
const DIST = path.join(ROOT, 'dist');
const CFG = require(path.join(APP, 'js/config.js'));
const Bundle = require(path.join(APP, 'js/bundle.js'));

const rel = (p) => path.relative(ROOT, p);
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const prev = fs.existsSync(file) ? fs.readFileSync(file) : null;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (prev && prev.equals(buf)) return false;
  fs.writeFileSync(file, buf);
  console.log('  yazıldı: ' + rel(file));
  return true;
};

/* ---------- 1. İçerik ---------- */

const { categories, articles, errors, warnings } = loadContent();
for (const w of warnings) console.warn('UYARI  ' + w);
if (errors.length) {
  for (const e of errors) console.error('HATA   ' + e);
  console.error(`\n${errors.length} hata nedeniyle derleme durduruldu.`);
  process.exit(1);
}

const contentHash = crypto.createHash('sha256')
  .update(JSON.stringify({ categories, articles: articles.map((a) => [a.id, a.md, a.title, a.summary, a.tags, a.order, a.urgent]) }))
  .digest('hex').slice(0, 10);

// Sürüm etiketi: içerik değişmedikçe sabit kalır
const libFile = path.join(APP, 'data/library.js');
let built = new Date().toISOString().slice(0, 10);
if (fs.existsSync(libFile)) {
  const m = fs.readFileSync(libFile, 'utf8').match(/"hash":"([0-9a-f]+)","built":"([^"]+)"/);
  if (m && m[1] === contentHash) built = m[2];
}

const library = {
  hash: contentHash,
  built,
  categories: categories.filter((c) => articles.some((a) => a.cat === c.id)),
  articles: articles.map((a) => ({
    id: a.id, cat: a.cat, title: a.title, summary: a.summary, tags: a.tags,
    order: a.order, urgent: a.urgent, words: a.words, md: a.md
  }))
};

console.log('Derleniyor…');
write(libFile,
  '/* Bu dosya `node tools/build.mjs` tarafından content/ klasöründen üretilir. Elle düzenlemeyin. */\n' +
  'window.KK_LIBRARY = ' + JSON.stringify(library) + ';\n');

/* ---------- 2. Ad ve manifest ---------- */

const manifest = {
  name: CFG.name,
  short_name: CFG.shortName,
  description: CFG.description,
  lang: 'tr',
  dir: 'ltr',
  id: './',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: CFG.themeColor,
  theme_color: CFG.themeColor,
  categories: ['books', 'education', 'health', 'reference'],
  icons: [
    { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
write(path.join(APP, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const indexFile = path.join(APP, 'index.html');
let indexHtml = fs.readFileSync(indexFile, 'utf8');
indexHtml = indexHtml
  .replace(/<title>[^<]*<\/title>/, `<title>${escAttr(CFG.name)}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(CFG.description)}">`)
  .replace(/<meta name="theme-color" content="[^"]*">/, `<meta name="theme-color" content="${escAttr(CFG.themeColor)}">`);
write(indexFile, indexHtml);

/* ---------- 3. Hizmet çalışanı ---------- */

function listFiles(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (name.startsWith('.')) continue;
    if (fs.statSync(full).isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

const assets = listFiles(APP).filter((f) => f !== 'sw.js' && !f.endsWith('.map') && !/(^|\/)LICENSE$/.test(f));
const assetHash = crypto.createHash('sha256');
for (const f of assets) assetHash.update(f).update(fs.readFileSync(path.join(APP, f)));
const swFile = path.join(APP, 'sw.js');
const swSrc = fs.readFileSync(swFile, 'utf8');
const swVersion = assetHash.digest('hex').slice(0, 12);
const block = `/* BUILD:START */\nconst VERSION = '${swVersion}';\nconst ASSETS = ${JSON.stringify(['./', ...assets], null, 2)};\n/* BUILD:END */`;
write(swFile, swSrc.replace(/\/\* BUILD:START \*\/[\s\S]*?\/\* BUILD:END \*\//, block));

/* ---------- 4. Tek dosya sürümü ---------- */

const svg = fs.readFileSync(path.join(APP, 'icons/icon.svg'), 'utf8').trim();
const standalone = await Bundle.assemble(indexHtml, (p) => fs.readFileSync(path.join(APP, p), 'utf8'), {
  lazyScripts: CFG.lazyScripts,
  iconDataUri: 'data:image/svg+xml,' + encodeURIComponent(svg)
});
const slug = (CFG.name || 'kitaplik').toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const standaloneFile = path.join(DIST, slug + '.html');
write(standaloneFile, standalone);

const words = articles.reduce((s, a) => s + a.words, 0);
console.log(`\nTamam: ${articles.length} makale, ${library.categories.length} kategori, ~${words} kelime.`);
console.log(`Önbellek sürümü ${swVersion}, ${assets.length + 1} dosya.`);
console.log(`Tek dosya: ${rel(standaloneFile)} (${(Buffer.byteLength(standalone) / 1048576).toFixed(2)} MB)`);
