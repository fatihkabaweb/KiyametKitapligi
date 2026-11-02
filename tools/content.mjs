// İçerik okuma ve doğrulama (build.mjs ve testler tarafından kullanılır).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MD = require(path.join(ROOT, 'app/js/markdown.js'));

const GLYPH_RANGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/pdf-glyphs.json'), 'utf8'));

function hasGlyph(cp) {
  if (cp === 10 || cp === 9) return true;
  let lo = 0, hi = GLYPH_RANGES.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b] = GLYPH_RANGES[mid];
    if (cp < a) hi = mid - 1; else if (cp > b) lo = mid + 1; else return true;
  }
  return false;
}

const TRUE_WORDS = new Set(['evet', 'true', '1', 'yes']);

/**
 * İçerik klasörünü okur. Hatalar `errors`, uyarılar `warnings` dizisinde döner.
 */
export function loadContent() {
  const contentDir = path.join(ROOT, 'content');
  const categories = JSON.parse(fs.readFileSync(path.join(contentDir, 'kategoriler.json'), 'utf8'));
  const errors = [];
  const warnings = [];
  const articles = [];
  const ids = new Map();
  const catIds = new Set(categories.map((c) => c.id));

  for (const cat of categories) {
    const dir = path.join(contentDir, cat.id);
    if (!fs.existsSync(dir)) { warnings.push(`Kategori klasörü yok: content/${cat.id}/`); continue; }
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const rel = `content/${cat.id}/${file}`;
      const id = file.replace(/\.md$/, '');
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) errors.push(`${rel}: dosya adı yalnızca küçük harf, rakam ve tire içermeli`);
      if (ids.has(id)) errors.push(`${rel}: "${id}" kimliği zaten kullanılıyor (${ids.get(id)})`);
      ids.set(id, rel);

      const src = fs.readFileSync(path.join(dir, file), 'utf8');
      const { meta, body } = MD.parseFrontMatter(src);
      for (const key of ['baslik', 'ozet']) {
        if (!meta[key]) errors.push(`${rel}: ön bilgide "${key}" eksik`);
      }
      // PDF yazı tipi kapsamı (emoji ve oklar PDF'te görünmez)
      const lines = src.split('\n');
      lines.forEach((line, n) => {
        for (const ch of line) {
          const cp = ch.codePointAt(0);
          if (!hasGlyph(cp)) {
            errors.push(`${rel}:${n + 1}: "${ch}" (U+${cp.toString(16).toUpperCase().padStart(4, '0')}) karakteri PDF yazı tipinde yok; kaldırın veya değiştirin`);
          }
        }
      });
      let blocks;
      try {
        blocks = MD.parseBlocks(body);
      } catch (e) {
        errors.push(`${rel}: ayrıştırılamadı: ${e.message}`);
        continue;
      }
      if (blocks.some((b) => b.t === 'h' && b.level === 1)) warnings.push(`${rel}: "# " başlık kullanmayın; başlık ön bilgiden gelir. "## " ile başlayın`);
      const words = MD.plainText(blocks).split(/\s+/).filter(Boolean).length;
      articles.push({
        id,
        cat: cat.id,
        title: meta.baslik || id,
        summary: meta.ozet || '',
        tags: (meta.etiketler || '').split(',').map((t) => t.trim()).filter(Boolean),
        order: Number(meta.sira) || 100,
        urgent: TRUE_WORDS.has(String(meta.acil || '').toLowerCase()),
        words,
        md: body.trim() + '\n',
        _refs: MD.collectRefs(blocks),
        _rel: rel
      });
    }
  }

  // Bilinmeyen kategori klasörleri
  for (const d of fs.readdirSync(contentDir)) {
    const full = path.join(contentDir, d);
    if (fs.statSync(full).isDirectory() && !catIds.has(d)) warnings.push(`content/${d}/ kategoriler.json içinde tanımlı değil; yok sayıldı`);
  }

  // Kırık iç bağlantılar
  for (const a of articles) {
    for (const r of a._refs) {
      if (!ids.has(r)) warnings.push(`${a._rel}: [[${r}]] bağlantısı hiçbir makaleye karşılık gelmiyor`);
    }
  }

  articles.sort((a, b) => {
    const ca = categories.findIndex((c) => c.id === a.cat);
    const cb = categories.findIndex((c) => c.id === b.cat);
    return ca - cb || a.order - b.order || a.title.localeCompare(b.title, 'tr');
  });

  return { categories, articles, errors, warnings };
}
