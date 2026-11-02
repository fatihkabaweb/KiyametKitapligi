/*
 * PDF oluşturma (pdfmake ile, tamamen cihaz içinde, internetsiz).
 * Makalelerin ayrıştırılmış blok yapısı pdfmake belge tanımına çevrilir.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./markdown.js'));
  else root.KKPdf = factory(root.KKMarkdown);
})(typeof self !== 'undefined' ? self : this, function (MD) {
  'use strict';

  const COLORS = {
    ink: '#1d1a15',
    dim: '#5f574b',
    accent: '#a3500b',
    rule: '#c9bfae',
    callout: {
      tehlike: { line: '#c62828', fill: '#fdecea', title: '#b71c1c' },
      uyari: { line: '#e08a00', fill: '#fff4e0', title: '#a35f00' },
      ipucu: { line: '#2e7d32', fill: '#e9f5ea', title: '#1b5e20' },
      not: { line: '#1e6fb8', fill: '#e8f1fb', title: '#145089' }
    }
  };

  const SIZES = {
    kucuk: { base: 9, h1: 18, h2: 12.5, h3: 10.5 },
    normal: { base: 10.5, h1: 21, h2: 14, h3: 12 },
    buyuk: { base: 12.5, h1: 24, h2: 16.5, h3: 14 }
  };

  /* ---------- Satır içi ---------- */

  function inl(nodes, ctx, style) {
    const out = [];
    style = style || {};
    nodes.forEach(function (n) {
      switch (n.t) {
        case 'text': out.push(Object.assign({ text: n.v }, style)); break;
        case 'b': Array.prototype.push.apply(out, inl(n.c, ctx, Object.assign({}, style, { bold: true }))); break;
        case 'i': Array.prototype.push.apply(out, inl(n.c, ctx, Object.assign({}, style, { italics: true }))); break;
        case 'code': out.push(Object.assign({ text: n.v, background: '#eeeae2' }, style)); break;
        case 'link': {
          const parts = inl(n.c, ctx, Object.assign({}, style, { color: COLORS.accent }));
          if (/^https?:/i.test(n.href)) parts.forEach(function (p) { p.link = n.href; });
          Array.prototype.push.apply(out, parts);
          break;
        }
        case 'ref': {
          const a = ctx.byId[n.id];
          const label = n.label || (a ? a.title : n.id);
          const node = Object.assign({ text: label, color: COLORS.accent }, style);
          if (a && ctx.included[n.id]) node.linkToDestination = 'art-' + n.id;
          out.push(node);
          break;
        }
      }
    });
    return out;
  }

  /* ---------- Bloklar ---------- */

  function checkBox(checked) {
    const c = [{ type: 'rect', x: 0, y: 1.5, w: 8, h: 8, lineWidth: 0.8, lineColor: COLORS.ink }];
    if (checked) {
      c.push({ type: 'line', x1: 1.5, y1: 3, x2: 6.5, y2: 8, lineWidth: 1, lineColor: COLORS.ink });
      c.push({ type: 'line', x1: 6.5, y1: 3, x2: 1.5, y2: 8, lineWidth: 1, lineColor: COLORS.ink });
    }
    return { canvas: c, width: 12 };
  }

  function listItems(list, ctx) {
    return list.items.map(function (it) {
      const text = { text: inl(it.inl, ctx) };
      if (it.check !== null) {
        const checked = ctx.opts.showChecks && ctx.checks && !!ctx.checks[MD.checkKey(ctx.articleId, it.raw)];
        const row = { columns: [checkBox(checked), { width: '*', text: inl(it.inl, ctx) }], columnGap: 4, margin: [0, 1, 0, 1] };
        return it.children.length ? { stack: [row].concat(blocks(it.children, ctx)) } : row;
      }
      return it.children.length ? { stack: [text].concat(blocks(it.children, ctx)) } : text;
    });
  }

  function blocks(bs, ctx) {
    const sz = ctx.sizes;
    const out = [];
    bs.forEach(function (b) {
      switch (b.t) {
        case 'h':
          out.push({
            text: inl(b.inl, ctx),
            style: b.level <= 2 ? 'h2' : 'h3',
            headlineLevel: b.level,
            keepWithNext: true
          });
          break;
        case 'p':
          out.push({ text: inl(b.inl, ctx), style: 'p' });
          break;
        case 'hr':
          out.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: ctx.contentWidth, y2: 0, lineWidth: 0.5, lineColor: COLORS.rule }], margin: [0, 6, 0, 8] });
          break;
        case 'ul': case 'ol': {
          const isCheck = b.items.some(function (it) { return it.check !== null; });
          if (isCheck) {
            out.push({ stack: listItems(b, ctx), margin: [4, 0, 0, sz.base * 0.6] });
          } else {
            const node = {};
            node[b.t] = listItems(b, ctx);
            if (b.t === 'ol' && b.start !== 1) node.start = b.start;
            node.margin = [4, 0, 0, sz.base * 0.6];
            out.push(node);
          }
          break;
        }
        case 'quote': {
          const c = b.kind ? COLORS.callout[b.kind] : { line: COLORS.rule, fill: '#f4f1ea', title: COLORS.dim };
          const inner = [];
          if (b.kind) inner.push({ text: (b.title || MD.CALLOUT_LABELS[b.kind]).toLocaleUpperCase('tr'), bold: true, color: c.title, fontSize: sz.base * 0.85, margin: [0, 0, 0, 3], characterSpacing: 0.5 });
          Array.prototype.push.apply(inner, blocks(b.blocks, ctx));
          if (inner.length) {
            const last = inner[inner.length - 1];
            last.margin = [0, 0, 0, 0];
          }
          out.push({
            table: { widths: ['*'], body: [[{ stack: inner, fillColor: c.fill }]] },
            layout: {
              hLineWidth: function () { return 0; },
              vLineWidth: function (i) { return i === 0 ? 3 : 0; },
              vLineColor: function () { return c.line; },
              paddingLeft: function () { return 10; },
              paddingRight: function () { return 8; },
              paddingTop: function () { return 6; },
              paddingBottom: function () { return 6; }
            },
            margin: [0, 2, 0, sz.base * 0.8],
            unbreakable: inner.length <= 4
          });
          break;
        }
        case 'table': {
          const head = b.head.map(function (cell, k) {
            return { text: inl(cell, ctx), bold: true, fillColor: '#ece6da', alignment: b.aligns[k] || 'left' };
          });
          const rows = b.rows.map(function (r) {
            const row = [];
            for (let k = 0; k < head.length; k++) {
              row.push({ text: r[k] ? inl(r[k], ctx) : '', alignment: b.aligns[k] || 'left' });
            }
            return row;
          });
          out.push({
            table: { headerRows: 1, widths: head.map(function () { return '*'; }), body: [head].concat(rows), dontBreakRows: true },
            layout: {
              hLineWidth: function (i, node) { return i === 0 || i === node.table.body.length ? 0.8 : 0.4; },
              vLineWidth: function () { return 0; },
              hLineColor: function () { return COLORS.rule; },
              paddingLeft: function () { return 5; },
              paddingRight: function () { return 5; },
              paddingTop: function () { return 3; },
              paddingBottom: function () { return 3; }
            },
            fontSize: sz.base * 0.92,
            margin: [0, 2, 0, sz.base * 0.9]
          });
          break;
        }
      }
    });
    return out;
  }

  /* ---------- Belge ---------- */

  /** "Ad.org" biçimindeki adı, uzantısı vurgu renginde olacak şekilde böler. */
  function brandRuns(name) {
    const m = String(name).match(/^(.+?)(\.[a-z]{2,10})$/i);
    return m ? [{ text: m[1] }, { text: m[2], color: COLORS.accent }] : String(name);
  }

  function trDate(d) {
    try {
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return d.toISOString().slice(0, 10);
    }
  }

  /**
   * opts: {
   *   title, subtitle, appName, cover (bool), toc (bool), pageSize ('A4'|'A5'),
   *   size ('kucuk'|'normal'|'buyuk'), showChecks (bool), groupByCategory (bool),
   *   breakEachArticle (bool, varsayılan true), checks ({anahtar: 1}), emergencyNumber,
   *   notes: [{title, body, updated}] (isteğe bağlı)
   * }
   * articles: [{id, cat, title, summary, blocks}] — sırayla
   * lib: {categories, byId}
   */
  function buildDoc(articles, lib, opts) {
    opts = opts || {};
    const sizes = SIZES[opts.size] || SIZES.normal;
    const pageSize = opts.pageSize || 'A4';
    const margins = pageSize === 'A5' ? [32, 36, 32, 44] : [46, 48, 46, 54];
    const pageWidth = pageSize === 'A5' ? 419.53 : 595.28;
    const contentWidth = pageWidth - margins[0] - margins[2];
    const included = {};
    articles.forEach(function (a) { included[a.id] = true; });
    const ctx = {
      byId: lib.byId, included: included, sizes: sizes, contentWidth: contentWidth,
      opts: opts, checks: opts.checks || null, articleId: ''
    };
    const appName = opts.appName || 'Kitaplık';
    const content = [];
    const single = articles.length === 1 && !opts.notes;

    if (opts.cover) {
      content.push({
        stack: [
          { canvas: [{ type: 'rect', x: 0, y: 0, w: contentWidth, h: 6, color: COLORS.accent }] },
          { text: brandRuns(appName), fontSize: sizes.h1 * 1.6, bold: true, margin: [0, 28, 0, 6], color: COLORS.ink },
          { text: opts.title || '', fontSize: sizes.h1 * 0.85, color: COLORS.accent, margin: [0, 0, 0, 4] },
          opts.subtitle ? { text: opts.subtitle, fontSize: sizes.base * 1.1, color: COLORS.dim, margin: [0, 0, 0, 18] } : { text: '' },
          { text: articles.length + ' makale  ·  ' + trDate(new Date()), fontSize: sizes.base, color: COLORS.dim, margin: [0, 0, 0, 30] },
          {
            table: {
              widths: ['*'],
              body: [[{
                stack: [
                  { text: 'ÖNEMLİ', bold: true, color: COLORS.callout.tehlike.title, fontSize: sizes.base * 0.9, margin: [0, 0, 0, 4] },
                  { text: 'Bu belgedeki bilgiler, profesyonel tıbbi, hukuki veya teknik yardıma ulaşılamadığı durumlar için hazırlanmıştır ve onların yerini tutmaz. Yardıma ulaşabiliyorsanız önce ' + (opts.emergencyNumber || '112') + ' acil çağrı numarasını arayın ve yetkililerin talimatlarına uyun.', fontSize: sizes.base * 0.95, lineHeight: 1.3 }
                ],
                fillColor: COLORS.callout.tehlike.fill
              }]]
            },
            layout: {
              hLineWidth: function () { return 0; },
              vLineWidth: function (i) { return i === 0 ? 3 : 0; },
              vLineColor: function () { return COLORS.callout.tehlike.line; },
              paddingLeft: function () { return 10; }, paddingRight: function () { return 10; },
              paddingTop: function () { return 8; }, paddingBottom: function () { return 8; }
            }
          },
          { text: 'Bu belgeyi yazdırıp su geçirmez bir poşette saklayın. Elektrik ve internet olmadığında da işinize yarar.', fontSize: sizes.base * 0.9, color: COLORS.dim, italics: true, margin: [0, 16, 0, 0] }
        ]
      });
    }

    if (opts.toc && !single) {
      content.push({
        toc: { title: { text: 'İçindekiler', style: 'h1' }, numberStyle: { color: COLORS.dim } },
        pageBreak: opts.cover ? 'before' : undefined
      });
    }

    let lastCat = null;
    const eachOnNewPage = opts.breakEachArticle !== false;
    let pendingBreak = content.length > 0; // kapak veya içindekilerden sonra yeni sayfa
    articles.forEach(function (a) {
      if (opts.groupByCategory && a.cat !== lastCat) {
        const cat = lib.categories.find(function (c) { return c.id === a.cat; });
        lastCat = a.cat;
        content.push({
          text: cat ? cat.ad : a.cat,
          style: 'cat',
          tocItem: true,
          tocStyle: { bold: true, color: COLORS.ink },
          tocMargin: [0, 6, 0, 2],
          pageBreak: pendingBreak ? 'before' : undefined
        });
        if (cat && cat.aciklama) content.push({ text: cat.aciklama, color: COLORS.dim, margin: [0, 0, 0, 14] });
        pendingBreak = false;
      }
      ctx.articleId = a.id;
      content.push({
        text: a.title,
        style: 'h1',
        id: 'art-' + a.id,
        tocItem: !single,
        tocMargin: opts.groupByCategory ? [12, 0, 0, 1] : [0, 0, 0, 1],
        tocStyle: { color: COLORS.ink },
        headlineLevel: 1,
        pageBreak: pendingBreak && eachOnNewPage ? 'before' : undefined,
        margin: pendingBreak && !eachOnNewPage ? [0, sizes.h1, 0, 4] : undefined
      });
      if (a.summary) content.push({ text: a.summary, style: 'summary' });
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: contentWidth, y2: 0, lineWidth: 1.2, lineColor: COLORS.accent }], margin: [0, 2, 0, 10] });
      Array.prototype.push.apply(content, blocks(a.blocks, ctx));
      pendingBreak = true;
    });

    if (opts.notes && opts.notes.length) {
      content.push({ text: 'Notlarım', style: 'cat', tocItem: true, tocStyle: { bold: true }, pageBreak: content.length ? 'before' : undefined });
      opts.notes.forEach(function (n) {
        content.push({ text: n.title || 'Başlıksız not', style: 'h2' });
        if (n.updated) content.push({ text: trDate(new Date(n.updated)), color: COLORS.dim, fontSize: sizes.base * 0.85, margin: [0, -2, 0, 6] });
        String(n.body || '').split(/\n{2,}/).forEach(function (para) {
          content.push({ text: para, style: 'p' });
        });
      });
    }

    return {
      pageSize: pageSize,
      pageMargins: margins,
      info: { title: (opts.title ? opts.title + ' — ' : '') + appName, author: appName, creator: appName, subject: opts.subtitle || '' },
      content: content,
      footer: function (currentPage, pageCount) {
        if (opts.cover && currentPage === 1) return null;
        return {
          columns: [
            { text: appName + (opts.title ? '  ·  ' + opts.title : ''), color: COLORS.dim, fontSize: 7.5 },
            { text: currentPage + ' / ' + pageCount, alignment: 'right', color: COLORS.dim, fontSize: 7.5 }
          ],
          margin: [margins[0], 18, margins[2], 0]
        };
      },
      pageBreakBefore: function (node, followingNodesOnPage) {
        // Başlık sayfanın en altında yalnız kalmasın
        return node.headlineLevel && followingNodesOnPage.length === 0;
      },
      defaultStyle: { font: 'Roboto', fontSize: sizes.base, lineHeight: 1.25, color: COLORS.ink },
      styles: {
        h1: { fontSize: sizes.h1, bold: true, margin: [0, 0, 0, 4], color: COLORS.ink },
        cat: { fontSize: sizes.h1 * 1.25, bold: true, color: COLORS.accent, margin: [0, 0, 0, 6] },
        h2: { fontSize: sizes.h2, bold: true, margin: [0, sizes.base * 0.9, 0, sizes.base * 0.4], color: COLORS.accent },
        h3: { fontSize: sizes.h3, bold: true, margin: [0, sizes.base * 0.6, 0, sizes.base * 0.3] },
        p: { margin: [0, 0, 0, sizes.base * 0.6] },
        summary: { fontSize: sizes.base * 1.05, italics: true, color: COLORS.dim, margin: [0, 0, 0, 6] }
      }
    };
  }

  return { buildDoc: buildDoc, SIZES: SIZES };
});
