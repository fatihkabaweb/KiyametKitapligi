/*
 * Çevrim dışı tam metin arama. Türkçe harf duyarsız: "su aritma" yazınca "su arıtma" bulunur.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./markdown.js'));
  else root.KKSearch = factory(root.KKMarkdown);
})(typeof self !== 'undefined' ? self : this, function (MD) {
  'use strict';

  const fold = MD.fold;

  function tokenize(s) {
    return fold(s).split(/[^a-z0-9]+/).filter(function (t) { return t.length > 0; });
  }

  function words(s) {
    return ' ' + tokenize(s).join(' ') + ' ';
  }

  /** Makale dizisinden arama dizini oluşturur. Her makalede `blocks` ve `text` hazır olmalı. */
  function buildIndex(articles) {
    return articles.map(function (a) {
      const headings = [];
      a.blocks.forEach(function (b) { if (b.t === 'h') headings.push(MD.inlineText(b.inl)); });
      const body = a.text.replace(/\s+/g, ' ');
      const folded = fold(body);
      return {
        a: a,
        title: words(a.title),
        tags: words(a.tags.join(' ')),
        summary: words(a.summary),
        headings: words(headings.join(' ')),
        body: body,
        bodyFold: folded.length === body.length ? folded : null,
        bodyWords: words(body)
      };
    });
  }

  function countOcc(hay, needle, cap) {
    let n = 0;
    let i = 0;
    while (n < cap && (i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
    return n;
  }

  function fieldScore(field, tok, isLast) {
    if (field.indexOf(' ' + tok + ' ') !== -1) return 2;          // tam kelime
    if (field.indexOf(' ' + tok) !== -1) return isLast ? 1.5 : 1; // kelime başı (önek)
    if (tok.length >= 4 && field.indexOf(tok) !== -1) return 0.5; // kelime içi
    return 0;
  }

  function search(index, query, limit) {
    const toks = tokenize(query);
    if (!toks.length) return [];
    // Nadir kelimeler daha değerlidir (ör. "su arıtma" aramasında "arıtma", "su"dan önemlidir)
    const N = index.length || 1;
    const weight = toks.map(function (tok) {
      let df = 0;
      index.forEach(function (e) {
        if (e.title.indexOf(' ' + tok) !== -1 || e.tags.indexOf(' ' + tok) !== -1 || e.bodyWords.indexOf(' ' + tok) !== -1) df++;
      });
      return 1 + Math.log(N / (1 + df));
    });
    const phrase = toks.length > 1 ? ' ' + toks.join(' ') : null;
    const results = [];
    index.forEach(function (e) {
      let total = 0;
      for (let k = 0; k < toks.length; k++) {
        const tok = toks[k];
        const isLast = k === toks.length - 1;
        const s =
          fieldScore(e.title, tok, isLast) * 12 +
          fieldScore(e.tags, tok, isLast) * 7 +
          fieldScore(e.summary, tok, isLast) * 4 +
          fieldScore(e.headings, tok, isLast) * 3;
        const inBody = countOcc(e.bodyWords, ' ' + tok, 6);
        if (!s && !inBody) return; // her kelime bir yerde geçmeli
        total += (s + inBody) * weight[k];
      }
      if (phrase) {
        // Kelimeler yan yana geçiyorsa (öbek eşleşmesi) ek puan
        if (e.title.indexOf(phrase) !== -1) total += 40;
        if (e.tags.indexOf(phrase) !== -1) total += 30;
        if (e.summary.indexOf(phrase) !== -1 || e.headings.indexOf(phrase) !== -1) total += 15;
        total += countOcc(e.bodyWords, phrase, 5) * 3;
      }
      if (e.a.urgent) total += 1;
      results.push({ article: e.a, score: total, snippet: snippet(e, toks) });
    });
    results.sort(function (x, y) { return y.score - x.score || x.article.title.localeCompare(y.article.title, 'tr'); });
    return results.slice(0, limit || 50);
  }

  /** Eşleşmenin geçtiği yerden kısa bir alıntı; eşleşmeler <mark> ile işaretli (HTML). */
  function snippet(e, toks) {
    const src = e.body;
    const hay = e.bodyFold;
    if (!hay) return MD.escapeHtml(src.slice(0, 160)) + (src.length > 160 ? '…' : '');
    let pos = -1;
    for (let k = 0; k < toks.length && pos === -1; k++) pos = hay.indexOf(toks[k]);
    if (pos === -1) return MD.escapeHtml(e.a.summary);
    const start = Math.max(0, src.lastIndexOf(' ', Math.max(0, pos - 60)));
    const end = Math.min(src.length, pos + 120);
    const cut = src.slice(start, end);
    const cutFold = hay.slice(start, end);
    return (start > 0 ? '…' : '') + highlight(cut, cutFold, toks) + (end < src.length ? '…' : '');
  }

  /** `text` içindeki eşleşmeleri işaretler. `folded`, `text` ile aynı uzunlukta katlanmış hali olmalı. */
  function highlight(text, folded, toks) {
    if (!folded || folded.length !== text.length) folded = fold(text);
    if (folded.length !== text.length) return MD.escapeHtml(text);
    const marks = new Array(text.length).fill(false);
    toks.forEach(function (tok) {
      let i = 0;
      while ((i = folded.indexOf(tok, i)) !== -1) {
        for (let j = i; j < i + tok.length; j++) marks[j] = true;
        i += tok.length;
      }
    });
    let out = '';
    let open = false;
    for (let i = 0; i < text.length; i++) {
      if (marks[i] && !open) { out += '<mark>'; open = true; }
      if (!marks[i] && open) { out += '</mark>'; open = false; }
      out += MD.escapeHtml(text[i]);
    }
    if (open) out += '</mark>';
    return out;
  }

  return { tokenize: tokenize, buildIndex: buildIndex, search: search, highlight: highlight };
});
