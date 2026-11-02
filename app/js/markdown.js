/*
 * Postapokaliptik.org — küçük, bağımlılıksız Markdown ayrıştırıcısı.
 *
 * Desteklenenler:
 *   ## Başlıklar, paragraflar, **kalın**, *italik*, `kod`,
 *   - madde işaretli / 1. numaralı listeler (iç içe),
 *   - [ ] kontrol listesi öğeleri,
 *   > [!UYARI] / [!TEHLIKE] / [!IPUCU] / [!NOT] uyarı kutuları,
 *   | tablolar |, --- yatay çizgi,
 *   [[makale-id]] veya [[makale-id|etiket]] iç bağlantılar,
 *   [metin](adres) bağlantılar.
 *
 * Hem tarayıcıda (window.KKMarkdown) hem Node'da (require) çalışır.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KKMarkdown = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Türkçe yardımcıları ---------- */

  function trLower(s) {
    return String(s).replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
  }

  /** Arama ve kimlikler için: küçük harf + Türkçe/aksanlı harfleri sadeleştir. */
  function fold(s) {
    return trLower(s)
      .replace(/[çćč]/g, 'c').replace(/ğ/g, 'g').replace(/[ıîïíì]/g, 'i')
      .replace(/[öôóò]/g, 'o').replace(/[şśš]/g, 's').replace(/[üûúù]/g, 'u')
      .replace(/[âáàä]/g, 'a').replace(/[éèêë]/g, 'e')
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function slugify(s) {
    return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'bolum';
  }

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Ön bilgi (front matter) ---------- */

  function parseFrontMatter(src) {
    src = String(src).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    const meta = {};
    if (!src.startsWith('---\n')) return { meta, body: src };
    const end = src.indexOf('\n---', 4);
    if (end === -1) return { meta, body: src };
    const head = src.slice(4, end);
    let body = src.slice(end + 4);
    body = body.replace(/^[^\n]*\n/, ''); // '---' satırının geri kalanı
    head.split('\n').forEach(function (line) {
      const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!m) return;
      let v = m[2].trim();
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1);
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      meta[m[1]] = v;
    });
    return { meta, body };
  }

  /* ---------- Satır içi (inline) ---------- */

  const ESCAPABLE = /[\\*_`[\]()#|>!-]/;

  function isWordChar(ch) {
    return !!ch && /[0-9A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/.test(ch);
  }

  function parseInline(s) {
    const out = [];
    let buf = '';
    let i = 0;
    function flush() {
      if (buf) { out.push({ t: 'text', v: buf }); buf = ''; }
    }
    while (i < s.length) {
      const c = s[i];
      if (c === '\\' && i + 1 < s.length && ESCAPABLE.test(s[i + 1])) {
        buf += s[i + 1]; i += 2; continue;
      }
      if (c === '[' && s[i + 1] === '[') {
        const end = s.indexOf(']]', i + 2);
        if (end > i + 2) {
          flush();
          const inner = s.slice(i + 2, end);
          const bar = inner.indexOf('|');
          out.push({
            t: 'ref',
            id: (bar === -1 ? inner : inner.slice(0, bar)).trim(),
            label: bar === -1 ? null : inner.slice(bar + 1).trim()
          });
          i = end + 2; continue;
        }
      }
      if (c === '*' && s[i + 1] === '*') {
        let end = s.indexOf('**', i + 2);
        if (end !== -1 && s[end + 2] === '*') end++; // "***": içteki italik önce kapanır
        if (end > i + 2) {
          flush();
          out.push({ t: 'b', c: parseInline(s.slice(i + 2, end)) });
          i = end + 2; continue;
        }
      }
      if ((c === '*' || c === '_') && s[i + 1] && s[i + 1] !== ' ' && s[i + 1] !== c &&
          !(c === '_' && isWordChar(s[i - 1]))) {
        let j = i + 1;
        let end = -1;
        while ((j = s.indexOf(c, j)) !== -1) {
          if (s[j - 1] !== ' ' && s[j + 1] !== c && !(c === '_' && isWordChar(s[j + 1]))) { end = j; break; }
          j++;
        }
        if (end > i + 1) {
          flush();
          out.push({ t: 'i', c: parseInline(s.slice(i + 1, end)) });
          i = end + 1; continue;
        }
      }
      if (c === '`') {
        const end = s.indexOf('`', i + 1);
        if (end > i + 1) {
          flush();
          out.push({ t: 'code', v: s.slice(i + 1, end) });
          i = end + 1; continue;
        }
      }
      if (c === '[') {
        const m = s.slice(i).match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
        if (m) {
          flush();
          out.push({ t: 'link', href: m[2], c: parseInline(m[1]) });
          i += m[0].length; continue;
        }
      }
      buf += c; i++;
    }
    flush();
    return out;
  }

  function inlineText(nodes, refTitle) {
    return nodes.map(function (n) {
      switch (n.t) {
        case 'text': case 'code': return n.v;
        case 'ref': return n.label || (refTitle && refTitle(n.id)) || n.id;
        default: return inlineText(n.c || [], refTitle);
      }
    }).join('');
  }

  /* ---------- Blok düzeyi ---------- */

  const RE_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
  const RE_HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
  const RE_LIST = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
  const RE_TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
  const RE_CALLOUT = /^\[!([A-Za-zÇĞİÖŞÜçğıöşü]+)\]\s*(.*)$/;

  const CALLOUT_KINDS = { uyari: 'uyari', dikkat: 'uyari', tehlike: 'tehlike', ipucu: 'ipucu', not: 'not', bilgi: 'not', onemli: 'tehlike' };

  function indentOf(line) {
    const m = line.match(/^ */);
    return m ? m[0].length : 0;
  }

  function startsBlock(line, next) {
    return RE_HEADING.test(line) || RE_HR.test(line) || /^\s*>/.test(line) ||
      RE_LIST.test(line) || (/^\s*\|/.test(line) && next !== undefined && RE_TABLE_SEP.test(next));
  }

  function splitRow(line) {
    let l = line.trim();
    if (l.startsWith('|')) l = l.slice(1);
    if (l.endsWith('|') && !l.endsWith('\\|')) l = l.slice(0, -1);
    const cells = [];
    let cur = '';
    for (let i = 0; i < l.length; i++) {
      if (l[i] === '\\' && l[i + 1] === '|') { cur += '|'; i++; continue; }
      if (l[i] === '|') { cells.push(cur.trim()); cur = ''; continue; }
      cur += l[i];
    }
    cells.push(cur.trim());
    return cells;
  }

  function parseList(lines, start) {
    // lines[start] bir liste öğesidir. Aynı girinti düzeyindeki öğeleri topla.
    const first = lines[start].match(RE_LIST);
    const baseIndent = first[1].length;
    const ordered = /\d/.test(first[2]);
    const list = { t: ordered ? 'ol' : 'ul', start: ordered ? parseInt(first[2], 10) : 1, items: [] };
    let i = start;
    while (i < lines.length) {
      const line = lines[i];
      const m = line.match(RE_LIST);
      if (!m || m[1].length !== baseIndent || /\d/.test(m[2]) !== ordered) break;
      let text = m[3];
      const contentIndent = baseIndent + m[2].length + 1;
      i++;
      const sub = [];
      // Devam satırları ve alt bloklar
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim()) {
          // Boş satır: sonraki satır bu öğeye girintili ise devam et
          let k = i + 1;
          while (k < lines.length && !lines[k].trim()) k++;
          if (k < lines.length && indentOf(lines[k]) > baseIndent) { sub.push(''); i++; continue; }
          break;
        }
        const ind = indentOf(l);
        if (ind > baseIndent) { sub.push(l.slice(Math.min(ind, contentIndent))); i++; continue; }
        if (!sub.length && !startsBlock(l, lines[i + 1]) && ind <= baseIndent && !RE_LIST.test(l)) {
          // tembel devam satırı
          text += ' ' + l.trim(); i++; continue;
        }
        break;
      }
      // Alt bloğun ilk düz satırları öğe metnine aittir
      while (sub.length && sub[0].trim() && !startsBlock(sub[0], sub[1])) {
        text += ' ' + sub.shift().trim();
      }
      let check = null;
      const cm = text.match(/^\[( |x|X)\]\s+(.*)$/);
      if (cm) { check = cm[1] !== ' '; text = cm[2]; }
      list.items.push({ inl: parseInline(text), raw: text, check: check, children: sub.length ? parseBlocks(sub.join('\n')) : [] });
      // Öğeler arasındaki boş satırları atla (aynı listeye devam ediyorsa)
      let k = i;
      while (k < lines.length && !lines[k].trim()) k++;
      if (k < lines.length && k !== i) {
        const nm = lines[k].match(RE_LIST);
        if (nm && nm[1].length === baseIndent && /\d/.test(nm[2]) === ordered) { i = k; continue; }
      }
    }
    return { block: list, next: i };
  }

  function parseBlocks(src) {
    const lines = String(src).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }

      let m = line.match(RE_HEADING);
      if (m) {
        blocks.push({ t: 'h', level: m[1].length, inl: parseInline(m[2]), raw: m[2] });
        i++; continue;
      }
      if (RE_HR.test(line)) { blocks.push({ t: 'hr' }); i++; continue; }

      if (/^\s*>/.test(line)) {
        const inner = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          inner.push(lines[i].replace(/^\s*> ?/, ''));
          i++;
        }
        let kind = null;
        let title = null;
        const cm = inner.length ? inner[0].trim().match(RE_CALLOUT) : null;
        if (cm) {
          kind = CALLOUT_KINDS[fold(cm[1])] || 'not';
          title = cm[2] ? cm[2] : null;
          inner.shift();
        }
        blocks.push({ t: 'quote', kind: kind, title: title, blocks: parseBlocks(inner.join('\n')) });
        continue;
      }

      if (/^\s*\|/.test(line) && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1])) {
        const head = splitRow(line).map(parseInline);
        const aligns = splitRow(lines[i + 1]).map(function (c) {
          const l = c.startsWith(':');
          const r = c.endsWith(':');
          return l && r ? 'center' : r ? 'right' : 'left';
        });
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) {
          rows.push(splitRow(lines[i]).map(parseInline));
          i++;
        }
        blocks.push({ t: 'table', head: head, aligns: aligns, rows: rows });
        continue;
      }

      if (RE_LIST.test(line)) {
        const r = parseList(lines, i);
        blocks.push(r.block);
        i = r.next;
        continue;
      }

      // Paragraf
      const para = [line.trim()];
      i++;
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i], lines[i + 1])) {
        para.push(lines[i].trim());
        i++;
      }
      // Satır sonunda iki boşluk veya \ = satır kırılımı
      const text = para.join('\n').replace(/\n/g, ' ');
      blocks.push({ t: 'p', inl: parseInline(text), raw: text });
    }
    return blocks;
  }

  /* ---------- Başlık kimlikleri ve içindekiler ---------- */

  function assignHeadingIds(blocks, prefix) {
    const used = {};
    const toc = [];
    (function walk(bs) {
      bs.forEach(function (b) {
        if (b.t === 'h') {
          let id = (prefix || '') + slugify(inlineText(b.inl));
          if (used[id]) { used[id]++; id += '-' + used[id]; } else used[id] = 1;
          b.id = id;
          toc.push({ id: id, level: b.level, text: inlineText(b.inl) });
        } else if (b.t === 'quote') walk(b.blocks);
      });
    })(blocks);
    return toc;
  }

  /* ---------- Düz metin (arama dizini için) ---------- */

  function plainText(blocks, refTitle) {
    const parts = [];
    (function walk(bs) {
      bs.forEach(function (b) {
        switch (b.t) {
          case 'h': case 'p': parts.push(inlineText(b.inl, refTitle)); break;
          case 'quote': if (b.title) parts.push(b.title); walk(b.blocks); break;
          case 'ul': case 'ol':
            b.items.forEach(function (it) { parts.push(inlineText(it.inl, refTitle)); walk(it.children); });
            break;
          case 'table':
            parts.push(b.head.map(function (c) { return inlineText(c, refTitle); }).join(' '));
            b.rows.forEach(function (r) { parts.push(r.map(function (c) { return inlineText(c, refTitle); }).join(' ')); });
            break;
        }
      });
    })(blocks);
    return parts.join('\n');
  }

  /* ---------- HTML çıktısı ---------- */

  const CALLOUT_LABELS = { uyari: 'Uyarı', tehlike: 'Tehlike', ipucu: 'İpucu', not: 'Not' };

  function checkKey(articleId, text) {
    return articleId + ':' + hash(fold(text));
  }

  function renderInline(nodes, opts) {
    return nodes.map(function (n) {
      switch (n.t) {
        case 'text': return escapeHtml(n.v);
        case 'b': return '<strong>' + renderInline(n.c, opts) + '</strong>';
        case 'i': return '<em>' + renderInline(n.c, opts) + '</em>';
        case 'code': return '<code>' + escapeHtml(n.v) + '</code>';
        case 'link': {
          const href = String(n.href);
          if (/^(javascript|data|vbscript):/i.test(href)) return renderInline(n.c, opts);
          const ext = /^[a-z]+:/i.test(href);
          return '<a href="' + escapeHtml(href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            renderInline(n.c, opts) + '</a>';
        }
        case 'ref': {
          const title = opts.refTitle ? opts.refTitle(n.id) : null;
          const label = n.label || title || n.id;
          if (!title) return '<span class="ref ref-missing">' + escapeHtml(label) + '</span>';
          return '<a class="ref" href="#/m/' + encodeURIComponent(n.id) + '">' + escapeHtml(label) + '</a>';
        }
        default: return '';
      }
    }).join('');
  }

  function renderBlocks(blocks, opts) {
    opts = opts || {};
    return blocks.map(function (b) {
      switch (b.t) {
        case 'h': {
          const lvl = Math.min(6, Math.max(2, b.level));
          return '<h' + lvl + (b.id ? ' id="' + escapeHtml(b.id) + '"' : '') + '>' + renderInline(b.inl, opts) + '</h' + lvl + '>';
        }
        case 'p': return '<p>' + renderInline(b.inl, opts) + '</p>';
        case 'hr': return '<hr>';
        case 'quote': {
          if (!b.kind) return '<blockquote>' + renderBlocks(b.blocks, opts) + '</blockquote>';
          return '<aside class="callout callout-' + b.kind + '" role="note">' +
            '<div class="callout-title">' + escapeHtml(b.title || CALLOUT_LABELS[b.kind]) + '</div>' +
            renderBlocks(b.blocks, opts) + '</aside>';
        }
        case 'ul': case 'ol': {
          const isCheck = b.items.some(function (it) { return it.check !== null; });
          const open = b.t === 'ol'
            ? '<ol' + (b.start !== 1 ? ' start="' + b.start + '"' : '') + '>'
            : '<ul' + (isCheck ? ' class="checklist"' : '') + '>';
          return open + b.items.map(function (it) {
            const inner = renderInline(it.inl, opts);
            const kids = it.children.length ? renderBlocks(it.children, opts) : '';
            if (it.check === null) return '<li>' + inner + kids + '</li>';
            const key = checkKey(opts.articleId || 'x', it.raw);
            const checked = opts.checks ? !!opts.checks[key] : it.check;
            return '<li class="check-item"><label><input type="checkbox" data-check="' + escapeHtml(key) + '"' +
              (checked ? ' checked' : '') + '><span>' + inner + '</span></label>' + kids + '</li>';
          }).join('') + '</' + b.t + '>';
        }
        case 'table': {
          const th = b.head.map(function (c, k) {
            return '<th style="text-align:' + (b.aligns[k] || 'left') + '">' + renderInline(c, opts) + '</th>';
          }).join('');
          const rows = b.rows.map(function (r) {
            return '<tr>' + r.map(function (c, k) {
              return '<td style="text-align:' + (b.aligns[k] || 'left') + '">' + renderInline(c, opts) + '</td>';
            }).join('') + '</tr>';
          }).join('');
          return '<div class="table-wrap"><table><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
        }
        default: return '';
      }
    }).join('\n');
  }

  /** Bir makaledeki kontrol listesi öğelerini (anahtar, metin) olarak döndürür. */
  function collectChecks(blocks, articleId) {
    const out = [];
    (function walk(bs) {
      bs.forEach(function (b) {
        if (b.t === 'ul' || b.t === 'ol') {
          b.items.forEach(function (it) {
            if (it.check !== null) out.push({ key: checkKey(articleId, it.raw), text: it.raw });
            walk(it.children);
          });
        } else if (b.t === 'quote') walk(b.blocks);
      });
    })(blocks);
    return out;
  }

  /** Makaledeki [[ref]] bağlantılarını toplar (doğrulama için). */
  function collectRefs(blocks) {
    const out = [];
    function inl(nodes) {
      nodes.forEach(function (n) {
        if (n.t === 'ref') out.push(n.id);
        else if (n.c) inl(n.c);
      });
    }
    (function walk(bs) {
      bs.forEach(function (b) {
        if (b.inl) inl(b.inl);
        if (b.t === 'quote') walk(b.blocks);
        if (b.t === 'ul' || b.t === 'ol') b.items.forEach(function (it) { inl(it.inl); walk(it.children); });
        if (b.t === 'table') { b.head.forEach(inl); b.rows.forEach(function (r) { r.forEach(inl); }); }
      });
    })(blocks);
    return out;
  }

  return {
    trLower: trLower,
    fold: fold,
    slugify: slugify,
    hash: hash,
    escapeHtml: escapeHtml,
    parseFrontMatter: parseFrontMatter,
    parseInline: parseInline,
    parseBlocks: parseBlocks,
    inlineText: inlineText,
    assignHeadingIds: assignHeadingIds,
    plainText: plainText,
    renderInline: renderInline,
    renderBlocks: renderBlocks,
    collectChecks: collectChecks,
    collectRefs: collectRefs,
    checkKey: checkKey,
    CALLOUT_LABELS: CALLOUT_LABELS
  };
});
