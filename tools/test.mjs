// Kullanım: node --test tools/  (veya npm test)
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadContent, ROOT } from './content.mjs';

const require = createRequire(import.meta.url);
const MD = require(path.join(ROOT, 'app/js/markdown.js'));
const Search = require(path.join(ROOT, 'app/js/search.js'));
const Pdf = require(path.join(ROOT, 'app/js/pdf.js'));
const Bundle = require(path.join(ROOT, 'app/js/bundle.js'));

test('Türkçe harf katlama', () => {
  assert.equal(MD.fold('İĞÜŞÖÇ ığüşöç I'), 'igusoc igusoc i');
  assert.equal(MD.slugify('Yöntem 1: Kaynatma (En Güvenilir)'), 'yontem-1-kaynatma-en-guvenilir');
});

test('ön bilgi ayrıştırma', () => {
  const { meta, body } = MD.parseFrontMatter('---\nbaslik: Deneme Başlık\netiketler: [a, b]\nacil: evet\n---\n\nGövde\n');
  assert.equal(meta.baslik, 'Deneme Başlık');
  assert.equal(meta.etiketler, 'a, b');
  assert.equal(meta.acil, 'evet');
  assert.equal(body.trim(), 'Gövde');
});

test('bloklar: başlık, liste, kontrol listesi, uyarı kutusu, tablo', () => {
  const src = [
    '## Başlık', '',
    'Paragraf **kalın** ve *italik* ve [[su-aritma]] ve [[x|etiket]].', '',
    '1. Bir', '2. İki', '   - alt madde', '3. Üç', '',
    '- [ ] yapılacak', '- [x] yapıldı', '',
    '> [!TEHLIKE] Dikkat', '> Kutu içi metin.', '',
    '| A | B |', '|---|:-:|', '| 1 | 2 |', '',
    '---'
  ].join('\n');
  const b = MD.parseBlocks(src);
  assert.deepEqual(b.map((x) => x.t), ['h', 'p', 'ol', 'ul', 'quote', 'table', 'hr']);
  assert.equal(b[2].items.length, 3);
  assert.equal(b[2].items[1].children[0].t, 'ul');
  assert.equal(b[3].items[0].check, false);
  assert.equal(b[3].items[1].check, true);
  assert.equal(b[4].kind, 'tehlike');
  assert.equal(b[4].title, 'Dikkat');
  assert.equal(b[5].aligns[1], 'center');
  const refs = MD.collectRefs(b);
  assert.deepEqual(refs, ['su-aritma', 'x']);
});

test('satır içi: kalın, italik, kod, bağlantı, kaçış', () => {
  const n = MD.parseInline('a **b *c*** `d` [e](https://x.y) \\*f\\* snake_case_word');
  const html = MD.renderInline(n, {});
  assert.match(html, /<strong>b <em>c<\/em><\/strong>/);
  assert.match(html, /<code>d<\/code>/);
  assert.match(html, /href="https:\/\/x\.y"/);
  assert.match(html, /\*f\*/);
  assert.match(html, /snake_case_word/);
});

test('HTML güvenliği: kaçış ve javascript: bağlantıları', () => {
  const html = MD.renderBlocks(MD.parseBlocks('<script>alert(1)</script> [tıkla](javascript:alert(1))'), {});
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /javascript:/);
});

test('kontrol listesi anahtarları kararlı', () => {
  assert.equal(MD.checkKey('a', 'Su  bidonu'), MD.checkKey('a', 'Su  bidonu'));
  assert.notEqual(MD.checkKey('a', 'Su'), MD.checkKey('b', 'Su'));
});

const lib = loadContent();

test('içerik geçerli ve tüm iç bağlantılar çözülüyor', () => {
  assert.deepEqual(lib.errors, []);
  const ids = new Set(lib.articles.map((a) => a.id));
  const broken = [];
  for (const a of lib.articles) for (const r of a._refs) if (!ids.has(r)) broken.push(`${a.id} -> ${r}`);
  assert.deepEqual(broken, []);
  assert.ok(lib.articles.length > 0);
});

test('her makalenin özeti ve en az bir bölümü var', () => {
  for (const a of lib.articles) {
    assert.ok(a.summary.length > 10, a.id + ' özeti çok kısa');
    assert.ok(a.words > 120, a.id + ' çok kısa (' + a.words + ' kelime)');
  }
});

test('arama Türkçe karakter duyarsız çalışır', () => {
  const arts = lib.articles.map((a) => {
    const blocks = MD.parseBlocks(a.md);
    return Object.assign({}, a, { blocks, text: MD.plainText(blocks) });
  });
  const idx = Search.buildIndex(arts);
  const r1 = Search.search(idx, 'su aritma');
  assert.equal(r1[0].article.id, 'su-aritma');
  const r2 = Search.search(idx, 'SU ARITMA');
  assert.equal(r2[0].article.id, 'su-aritma');
  assert.deepEqual(Search.search(idx, 'qqqzzzxx'), []);
});

test('PDF belge tanımı tüm makaleler için üretilir', () => {
  const arts = lib.articles.map((a) => Object.assign({}, a, { blocks: MD.parseBlocks(a.md) }));
  const byId = {};
  arts.forEach((a) => { byId[a.id] = a; });
  const doc = Pdf.buildDoc(arts, { categories: lib.categories, byId }, { appName: 'Test', cover: true, toc: true, groupByCategory: true });
  assert.ok(doc.content.length > arts.length);
  assert.equal(doc.pageSize, 'A4');
  JSON.stringify(doc.content); // döngüsel yapı olmamalı
});

test('tek dosya paketleyici betikleri güvenle gömer', async () => {
  const files = { 'a.js': 'var s = "</script><b>";', 'a.css': 'body{}' };
  const html = await Bundle.assemble(
    '<html lang="tr"><head><link rel="stylesheet" href="a.css"><link rel="manifest" href="m.json"></head><body><script src="a.js"></script></body></html>',
    (p) => files[p],
    { lazyScripts: [] }
  );
  assert.match(html, /data-standalone="1"/);
  assert.match(html, /<style data-src="a.css">/);
  assert.match(html, /<\\\/script><b>/);
  assert.doesNotMatch(html, /manifest/);
});
