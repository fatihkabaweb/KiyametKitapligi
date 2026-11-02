/*
 * Uygulama: yönlendirme, ekranlar ve etkileşimler.
 */
(function () {
  'use strict';

  const CFG = window.KK_CONFIG;
  const MD = window.KKMarkdown;
  const Store = window.KKStore;
  const Search = window.KKSearch;
  const esc = MD.escapeHtml;
  const STANDALONE = document.documentElement.hasAttribute('data-standalone');
  // Tek dosya sürümünü kendini kopyalayabilmesi için, ekran çizilmeden önce yakala
  const PRISTINE = STANDALONE ? '<!DOCTYPE html>\n' + document.documentElement.outerHTML : null;

  /* ================= Veri ================= */

  const RAW = window.KK_LIBRARY || { categories: [], articles: [] };
  const categories = RAW.categories;
  const catById = {};
  categories.forEach(function (c) { catById[c.id] = c; });
  const articles = RAW.articles.map(function (a) {
    const blocks = MD.parseBlocks(a.md);
    const toc = MD.assignHeadingIds(blocks, '');
    return Object.assign({}, a, { blocks: blocks, toc: toc, checks: MD.collectChecks(blocks, a.id) });
  });
  const byId = {};
  articles.forEach(function (a) { byId[a.id] = a; });
  articles.forEach(function (a) { a.text = MD.plainText(a.blocks, refTitle); });
  const backlinks = {};
  articles.forEach(function (a) {
    MD.collectRefs(a.blocks).forEach(function (r) {
      if (!byId[r] || r === a.id) return;
      (backlinks[r] = backlinks[r] || []);
      if (backlinks[r].indexOf(a.id) === -1) backlinks[r].push(a.id);
    });
  });
  let searchIndex = null;
  function index() { return searchIndex || (searchIndex = Search.buildIndex(articles)); }

  function refTitle(id) { return byId[id] ? byId[id].title : null; }
  function articlesIn(catId) { return articles.filter(function (a) { return a.cat === catId; }); }
  function readMinutes(a) { return Math.max(1, Math.round(a.words / 180)); }
  const totalWords = articles.reduce(function (s, a) { return s + a.words; }, 0);

  /* ================= Simgeler ================= */

  const I = {
    home: '<path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h12M8 8h6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    bookmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
    bookmarkFill: '<path d="M6 3h12v18l-6-4.5L6 21z" fill="currentColor"/>',
    more: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/>',
    pdf: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M12 11v6m-3-3 3 3 3-3"/>',
    text: '<path d="M4 18 9 6l5 12M5.6 14h6.8M15 18l3-7 3 7M15.9 16h4.2"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    note: '<path d="M5 3h10l4 4v14H5z"/><path d="M8 11h8M8 15h8M8 7h4"/>',
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v8h14v-8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    download: '<path d="M12 3v12m-4.5-4.5L12 15l4.5-4.5"/><path d="M5 19h14"/>',
    upload: '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M5 19h14"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    offline: '<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0"/><path d="M12 19.5v.01"/>',
    install: '<path d="M7 3h10v18H7z"/><path d="M12 7v7m-3-3 3 3 3-3M11 18h2"/>',
    copy: '<path d="M8 8h12v12H8z"/><path d="M4 16V4h12"/>'
  };

  function icon(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (I[name] || '') + '</svg>';
  }

  /* ================= Yardımcılar ================= */

  const $ = function (sel, el) { return (el || document).querySelector(sel); };
  const $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  let view = $('#view');

  let toastTimer = null;
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { t.hidden = true; }, 250);
    }, ms || 2600);
  }

  function busy(on, text) {
    const o = $('#overlay');
    if (on) { $('#overlay-text').textContent = text || 'Hazırlanıyor…'; o.hidden = false; }
    else o.hidden = true;
  }

  function nextFrame() {
    return new Promise(function (r) { requestAnimationFrame(function () { setTimeout(r, 30); }); });
  }

  function fmtDate(t) {
    try { return new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return new Date(t).toISOString().slice(0, 10); }
  }

  function fileSafe(s) {
    return MD.slugify(s).slice(0, 60) || 'belge';
  }

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const lazy = document.querySelector('script[type="text/x-kk-lazy"][data-src="' + src + '"]');
      const s = document.createElement('script');
      if (lazy) {
        s.textContent = lazy.textContent;
        document.head.appendChild(s);
        resolve();
        return;
      }
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error(src + ' yüklenemedi')); };
      document.head.appendChild(s);
    });
  }

  let pdfReady = null;
  function ensurePdf() {
    if (window.pdfMake && window.pdfMake.vfs && Object.keys(window.pdfMake.vfs).length) return Promise.resolve();
    if (!pdfReady) {
      pdfReady = CFG.lazyScripts.reduce(function (p, src) {
        return p.then(function () { return loadScript(src); });
      }, Promise.resolve()).catch(function (e) { pdfReady = null; throw e; });
    }
    return pdfReady;
  }

  /* ================= PDF ve Yazdırma ================= */

  async function exportPdf(list, opts) {
    if (!list.length && !(opts.notes && opts.notes.length)) { toast('Dışa aktarılacak bir şey seçilmedi.'); return; }
    busy(true, 'PDF motoru yükleniyor…');
    await nextFrame();
    try {
      await ensurePdf();
      busy(true, list.length > 20 ? 'PDF hazırlanıyor (' + list.length + ' makale). Bu biraz sürebilir…' : 'PDF hazırlanıyor…');
      await nextFrame();
      const doc = window.KKPdf.buildDoc(list, { categories: categories, byId: byId }, Object.assign({
        appName: CFG.name,
        emergencyNumber: CFG.emergencyNumber,
        checks: Store.checks()
      }, opts));
      const pdf = window.pdfMake.createPdf(doc);
      const blob = await new Promise(function (resolve, reject) {
        try { pdf.getBlob(resolve); } catch (e) { reject(e); }
      });
      saveBlob(blob, fileSafe(CFG.shortName + '-' + (opts.title || 'kitaplik')) + '.pdf');
      toast('PDF indirildi.');
    } catch (e) {
      console.error(e);
      toast('PDF oluşturulamadı: ' + (e && e.message ? e.message : e), 5000);
    } finally {
      busy(false);
    }
  }

  function printArticles(list, opts) {
    opts = opts || {};
    const root = $('#print-root');
    const checks = Store.checks();
    let html = '';
    if (opts.cover) {
      html += '<section class="print-cover"><div class="print-cover-bar"></div><h1>' + esc(CFG.name) + '</h1>' +
        '<p class="print-cover-title">' + esc(opts.title || '') + '</p>' +
        '<p class="print-cover-meta">' + list.length + ' makale · ' + esc(fmtDate(Date.now())) + '</p>' +
        '<div class="callout callout-tehlike"><div class="callout-title">Önemli</div><p>Bu bilgiler profesyonel yardımın yerini tutmaz. Yardıma ulaşabiliyorsanız önce ' + esc(CFG.emergencyNumber) + ' acil çağrı numarasını arayın.</p></div></section>';
    }
    if (opts.toc && list.length > 1) {
      html += '<section class="print-toc"><h1>İçindekiler</h1><ol>' + list.map(function (a) {
        return '<li>' + esc(a.title) + ' <span>(' + esc(catById[a.cat] ? catById[a.cat].ad : '') + ')</span></li>';
      }).join('') + '</ol></section>';
    }
    list.forEach(function (a) {
      html += '<article class="print-article"><p class="print-cat">' + esc(catById[a.cat] ? catById[a.cat].ad : '') + '</p>' +
        '<h1>' + esc(a.title) + '</h1>' + (a.summary ? '<p class="print-summary">' + esc(a.summary) + '</p>' : '') +
        MD.renderBlocks(a.blocks, { articleId: a.id, refTitle: refTitle, checks: opts.showChecks ? checks : {} }) + '</article>';
    });
    if (opts.notes && opts.notes.length) {
      html += '<article class="print-article"><h1>Notlarım</h1>' + opts.notes.map(function (n) {
        return '<h2>' + esc(n.title || 'Başlıksız not') + '</h2>' + String(n.body || '').split(/\n{2,}/).map(function (p) {
          return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
        }).join('');
      }).join('') + '</article>';
    }
    root.innerHTML = html;
    root.className = 'print-size-' + (opts.size || 'normal');
    document.body.classList.add('printing');
    const done = function () {
      document.body.classList.remove('printing');
      root.innerHTML = '';
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(function () {
      try { window.print(); } catch (e) { toast('Bu cihazda yazdırma desteklenmiyor. PDF indirmeyi deneyin.', 4000); done(); }
      // Bazı tarayıcılar afterprint olayını göndermez
      setTimeout(function () { if (document.body.classList.contains('printing')) done(); }, 120000);
    }, 50);
  }

  async function downloadStandalone() {
    busy(true, 'Tek dosya hazırlanıyor…');
    await nextFrame();
    try {
      let html;
      if (STANDALONE) {
        html = PRISTINE;
      } else {
        const read = function (p) {
          return fetch(p, { cache: 'force-cache' }).then(function (r) {
            if (!r.ok) throw new Error(p + ' okunamadı');
            return r.text();
          });
        };
        const indexHtml = await read('index.html');
        const svg = await read('icons/icon.svg').catch(function () { return null; });
        html = await window.KKBundle.assemble(indexHtml, read, {
          lazyScripts: CFG.lazyScripts,
          iconDataUri: svg ? 'data:image/svg+xml,' + encodeURIComponent(svg) : null
        });
      }
      saveBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), fileSafe(CFG.name) + '.html');
      toast('Tek dosya indirildi. Paylaşmaya hazır.');
    } catch (e) {
      console.error(e);
      toast('Dosya hazırlanamadı: ' + (e && e.message ? e.message : e), 5000);
    } finally {
      busy(false);
    }
  }

  /* ================= Kabuk (üst çubuk ve sekmeler) ================= */

  const TABS = [
    { id: 'home', href: '#/', label: 'Kitaplık', icon: 'home' },
    { id: 'search', href: '#/ara', label: 'Ara', icon: 'search' },
    { id: 'acil', href: '#/acil', label: 'ACİL', icon: 'alert', cls: 'tab-urgent' },
    { id: 'saved', href: '#/kaydedilenler', label: 'Kayıtlı', icon: 'bookmark' },
    { id: 'more', href: '#/menu', label: 'Menü', icon: 'more' }
  ];

  function renderShell() {
    $('#brand-name').textContent = CFG.name;
    $('#back-btn').innerHTML = icon('back');
    $('#tabbar').innerHTML = TABS.map(function (t) {
      return '<a class="tab ' + (t.cls || '') + '" href="' + t.href + '" data-tab="' + t.id + '">' + icon(t.icon) + '<span>' + esc(t.label) + '</span></a>';
    }).join('');
    document.title = CFG.name;
  }

  function setChrome(o) {
    o = o || {};
    $$('#tabbar .tab').forEach(function (t) {
      const on = t.getAttribute('data-tab') === o.tab;
      t.classList.toggle('active', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    $('#back-btn').hidden = !o.back;
    $('#brand').hidden = !!o.title || !!o.hideBrand;
    $('#topbar-title').textContent = o.title || '';
    $('#topbar-actions').innerHTML = o.actions || '';
    document.title = o.title ? o.title + ' · ' + CFG.name : CFG.name;
  }

  /* ================= Ortak parçalar ================= */

  function articleCard(a, extra) {
    const fav = Store.isFavorite(a.id);
    const nChecks = a.checks.length;
    return '<li><a class="card-row" href="#/m/' + encodeURIComponent(a.id) + '">' +
      '<div class="card-main"><div class="card-title">' + (a.urgent ? '<span class="badge badge-urgent">ACİL</span> ' : '') + esc(a.title) + '</div>' +
      '<div class="card-sub">' + (extra || esc(a.summary)) + '</div>' +
      '<div class="card-meta">' + icon('clock') + readMinutes(a) + ' dk' + (nChecks ? ' · ' + icon('list') + nChecks + ' madde' : '') + (fav ? ' · ' + icon('bookmarkFill') + 'Kayıtlı' : '') + '</div>' +
      '</div>' + icon('chevron', 'card-chevron') + '</a></li>';
  }

  function empty(msg, sub) {
    return '<div class="empty"><p class="empty-title">' + msg + '</p>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>';
  }

  function offlineStatusHtml() {
    if (STANDALONE) return '<span class="chip chip-ok">' + icon('check') + 'Tek dosya sürümü · internetsiz</span>';
    if (!('serviceWorker' in navigator)) return '<span class="chip chip-warn">Bu tarayıcı çevrim dışı kurulumu desteklemiyor</span>';
    return '<span class="chip" id="offline-chip">' + icon('offline') + 'Çevrim dışı durumu denetleniyor…</span>';
  }

  async function refreshOfflineChip() {
    const chip = $('#offline-chip');
    if (!chip) return;
    const ok = await offlineReady();
    chip.className = 'chip ' + (ok ? 'chip-ok' : 'chip-warn');
    chip.innerHTML = ok ? icon('check') + 'İnternetsiz kullanıma hazır' : icon('offline') + 'İnternetsiz kullanım için hazırlanıyor…';
  }

  async function offlineReady() {
    if (STANDALONE) return true;
    try {
      if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return false;
      const keys = await caches.keys();
      for (const k of keys) {
        if (k.indexOf('kk-') !== 0) continue;
        const c = await caches.open(k);
        if (await c.match('vendor/pdfmake/vfs_fonts.js', { ignoreSearch: true })) return true;
      }
    } catch (e) { /* yoksay */ }
    return false;
  }

  /* ================= Ekranlar ================= */

  function viewHome() {
    setChrome({ tab: 'home', hideBrand: true, actions: '<a class="icon-btn" href="#/ara" aria-label="Ara">' + icon('search') + '</a>' });
    const recent = Store.recent().map(function (r) { return byId[r.id]; }).filter(Boolean).slice(0, 3);
    let html = '<section class="hero">' +
      '<div class="hero-mark" aria-hidden="true"></div>' +
      '<h1 class="hero-title">' + esc(CFG.name) + '</h1>' +
      '<p class="hero-tag">' + esc(CFG.tagline) + '</p>' +
      '<div class="hero-status">' + offlineStatusHtml() + '</div>' +
      '<a class="searchbox" href="#/ara">' + icon('search') + '<span>Kütüphanede ara… (ör. su arıtma, kanama, deprem)</span></a>' +
      '</section>';

    html += '<a class="urgent-banner" href="#/acil">' + icon('alert') + '<span><strong>ACİL DURUM</strong><small>Hayat kurtaran bilgilere tek dokunuşla ulaşın</small></span>' + icon('chevron') + '</a>';

    if (recent.length) {
      html += '<section class="section"><h2 class="section-title">Okumaya devam et</h2><ul class="cards">' +
        recent.map(function (a) { return articleCard(a); }).join('') + '</ul></section>';
    }

    html += '<section class="section"><h2 class="section-title">Kategoriler</h2><ul class="cat-grid">' +
      categories.map(function (c) {
        const n = articlesIn(c.id).length;
        if (!n) return '';
        return '<li><a class="cat-tile" href="#/k/' + c.id + '"><span class="cat-icon" aria-hidden="true">' + c.ikon + '</span>' +
          '<span class="cat-name">' + esc(c.ad) + '</span><span class="cat-count">' + n + ' makale</span></a></li>';
      }).join('') + '</ul></section>';

    html += '<section class="section quick-actions">' +
      '<a class="qa" href="#/listeler">' + icon('list') + '<span>Kontrol listeleri</span></a>' +
      '<a class="qa" href="#/notlar">' + icon('note') + '<span>Not defteri</span></a>' +
      '<a class="qa" href="#/disa-aktar">' + icon('pdf') + '<span>PDF / Yazdır</span></a>' +
      '<a class="qa" href="#/disa-aktar#paylas">' + icon('share') + '<span>Kitaplığı paylaş</span></a>' +
      '</section>';

    html += '<p class="footnote">' + articles.length + ' makale · ' + categories.filter(function (c) { return articlesIn(c.id).length; }).length +
      ' kategori · yaklaşık ' + Math.round(totalWords / 1000) + ' bin kelime' + (RAW.built ? ' · Sürüm ' + esc(RAW.built) : '') + '</p>';
    view.innerHTML = html;
    refreshOfflineChip();
  }

  function viewUrgent() {
    setChrome({ tab: 'acil', title: 'Acil Durum' });
    const urgent = articles.filter(function (a) { return a.urgent; });
    view.innerHTML =
      '<a class="call-btn" href="tel:' + esc(CFG.emergencyNumber) + '">' + icon('phone') + '<span><strong>' + esc(CFG.emergencyNumber) + '</strong> Acil Çağrı</span></a>' +
      '<p class="hint">Şebeke varsa önce yardım çağırın. Konuşamıyorsanız konumunuzu ve durumu kısa mesajla bildirin.</p>' +
      '<ul class="urgent-grid">' + urgent.map(function (a) {
        const c = catById[a.cat];
        return '<li><a class="urgent-tile" href="#/m/' + encodeURIComponent(a.id) + '"><span class="urgent-icon" aria-hidden="true">' + (c ? c.ikon : '') + '</span><span>' + esc(a.title) + '</span></a></li>';
      }).join('') + '</ul>' +
      '<div class="row-actions"><button class="btn" data-action="pdf-urgent">' + icon('pdf') + 'Acil makaleleri PDF indir</button>' +
      '<button class="btn" data-action="print-urgent">' + icon('print') + 'Yazdır</button></div>';
  }

  function viewCategory(id) {
    const c = catById[id];
    if (!c) return viewNotFound();
    setChrome({ tab: 'home', back: true, title: c.ad });
    const list = articlesIn(id);
    view.innerHTML = '<header class="page-head"><span class="page-icon" aria-hidden="true">' + c.ikon + '</span><div><h1>' + esc(c.ad) + '</h1><p>' + esc(c.aciklama) + '</p></div></header>' +
      '<div class="row-actions"><button class="btn" data-action="pdf-cat" data-id="' + c.id + '">' + icon('pdf') + 'Kategoriyi PDF indir</button>' +
      '<button class="btn" data-action="print-cat" data-id="' + c.id + '">' + icon('print') + 'Yazdır</button></div>' +
      '<ul class="cards">' + list.map(function (a) { return articleCard(a); }).join('') + '</ul>';
  }

  function viewArticle(id, q) {
    const a = byId[id];
    if (!a) return viewNotFound();
    const c = catById[a.cat];
    const fav = Store.isFavorite(a.id);
    setChrome({
      tab: 'home', back: true, title: c ? c.ad : '',
      actions: '<button class="icon-btn" data-action="fav" data-id="' + a.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Kayıtlılardan çıkar' : 'Kaydet') + '">' + icon(fav ? 'bookmarkFill' : 'bookmark') + '</button>'
    });
    Store.addRecent(a.id);
    const checks = Store.checks();
    const siblings = articlesIn(a.cat);
    const pos = siblings.indexOf(a);
    const prev = siblings[pos - 1];
    const next = siblings[pos + 1];
    const toc = a.toc.filter(function (t) { return t.level <= 3; });

    let html = '<article class="article">' +
      '<nav class="crumbs"><a href="#/">Kitaplık</a> / <a href="#/k/' + a.cat + '">' + esc(c ? c.ad : a.cat) + '</a></nav>' +
      '<h1 class="article-title">' + esc(a.title) + '</h1>' +
      '<p class="article-summary">' + esc(a.summary) + '</p>' +
      '<div class="article-meta">' + icon('clock') + readMinutes(a) + ' dk okuma' + (a.urgent ? ' · <span class="badge badge-urgent">ACİL</span>' : '') + '</div>' +
      '<div class="toolbar" role="toolbar" aria-label="Makale araçları">' +
      '<button class="btn btn-sm" data-action="pdf-one" data-id="' + a.id + '">' + icon('pdf') + 'PDF</button>' +
      '<button class="btn btn-sm" data-action="print-one" data-id="' + a.id + '">' + icon('print') + 'Yazdır</button>' +
      '<button class="btn btn-sm" data-action="font-down" aria-label="Yazıyı küçült">A−</button>' +
      '<button class="btn btn-sm" data-action="font-up" aria-label="Yazıyı büyüt">A+</button>' +
      '</div>';

    if (a.checks.length) {
      const done = a.checks.filter(function (k) { return checks[k.key]; }).length;
      html += '<div class="progress-box" id="progress-box">' + progressHtml(done, a.checks.length) +
        '<button class="link-btn" data-action="reset-checks" data-id="' + a.id + '">Sıfırla</button></div>';
    }
    if (toc.length > 2) {
      html += '<details class="toc"><summary>Bu sayfada (' + toc.length + ' bölüm)</summary><ol>' + toc.map(function (t) {
        return '<li class="toc-l' + t.level + '"><a href="#" data-action="goto" data-target="' + esc(t.id) + '">' + esc(t.text) + '</a></li>';
      }).join('') + '</ol></details>';
    }
    html += '<div class="prose" id="prose">' + MD.renderBlocks(a.blocks, { articleId: a.id, refTitle: refTitle, checks: checks }) + '</div>';

    const back = (backlinks[a.id] || []).map(function (bid) { return byId[bid]; }).filter(Boolean);
    if (back.length) {
      html += '<section class="related"><h2>Bu konuya bağlanan makaleler</h2><ul class="chips">' + back.map(function (b) {
        return '<li><a class="chip-link" href="#/m/' + encodeURIComponent(b.id) + '">' + esc(b.title) + '</a></li>';
      }).join('') + '</ul></section>';
    }
    html += '<nav class="pager">' +
      (prev ? '<a class="pager-btn" href="#/m/' + encodeURIComponent(prev.id) + '"><small>Önceki</small>' + esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="pager-btn pager-next" href="#/m/' + encodeURIComponent(next.id) + '"><small>Sonraki</small>' + esc(next.title) + '</a>' : '<span></span>') +
      '</nav></article>';
    view.innerHTML = html;
    if (q) highlightIn($('#prose'), q);
  }

  function progressHtml(done, total) {
    const pct = total ? Math.round(done * 100 / total) : 0;
    return '<div class="progress-label"><strong>' + done + ' / ' + total + '</strong> madde tamam</div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + done + '"><span style="width:' + pct + '%"></span></div>';
  }

  function highlightIn(el, q) {
    const toks = Search.tokenize(q).filter(function (t) { return t.length > 1; });
    if (!toks.length || !el) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let first = null;
    nodes.forEach(function (n) {
      const text = n.nodeValue;
      const html = Search.highlight(text, null, toks);
      if (html.indexOf('<mark>') === -1) return;
      const span = document.createElement('span');
      span.innerHTML = html;
      n.parentNode.replaceChild(span, n);
      if (!first) first = span.querySelector('mark');
    });
    if (first) setTimeout(function () { first.scrollIntoView({ block: 'center' }); }, 60);
  }

  let lastQuery = '';
  function viewSearch(q) {
    setChrome({ tab: 'search', title: 'Ara' });
    q = q != null ? q : lastQuery;
    view.innerHTML = '<div class="search-page"><label class="search-field">' + icon('search') +
      '<input id="q" type="search" placeholder="Ne arıyorsunuz?" autocomplete="off" enterkeyhint="search" value="' + esc(q) + '" aria-label="Arama"></label>' +
      '<div id="results" aria-live="polite"></div></div>';
    const input = $('#q');
    const run = function () {
      lastQuery = input.value;
      const url = '#/ara' + (input.value ? '?q=' + encodeURIComponent(input.value) : '');
      if (location.hash !== url) history.replaceState(null, '', url);
      renderResults(input.value);
    };
    let tm = null;
    input.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(run, 120); });
    renderResults(q);
    setTimeout(function () { input.focus(); }, 30);
  }

  function renderResults(q) {
    const box = $('#results');
    if (!box) return;
    if (!q.trim()) {
      const tags = {};
      articles.forEach(function (a) { a.tags.slice(0, 3).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); });
      const sugg = ['kanama', 'su arıtma', 'deprem', 'kalp masajı', 'radyasyon', 'yanık', 'ateş yakma', 'çanta', 'sığınak', 'panik', 'mors', 'turnike'];
      box.innerHTML = '<p class="hint">Öneriler:</p><ul class="chips">' + sugg.map(function (s) {
        return '<li><a class="chip-link" href="#/ara?q=' + encodeURIComponent(s) + '">' + esc(s) + '</a></li>';
      }).join('') + '</ul>';
      return;
    }
    const res = Search.search(index(), q, 60);
    if (!res.length) { box.innerHTML = empty('Sonuç bulunamadı', 'Farklı veya daha kısa bir kelime deneyin.'); return; }
    box.innerHTML = '<p class="hint">' + res.length + ' sonuç</p><ul class="cards">' + res.map(function (r) {
      const a = r.article;
      return '<li><a class="card-row" href="#/m/' + encodeURIComponent(a.id) + '?q=' + encodeURIComponent(q) + '">' +
        '<div class="card-main"><div class="card-title">' + (a.urgent ? '<span class="badge badge-urgent">ACİL</span> ' : '') + esc(a.title) + '</div>' +
        '<div class="card-cat">' + esc(catById[a.cat] ? catById[a.cat].ad : '') + '</div>' +
        '<div class="card-sub">' + r.snippet + '</div></div>' + icon('chevron', 'card-chevron') + '</a></li>';
    }).join('') + '</ul>';
  }

  function viewSaved() {
    setChrome({ tab: 'saved', title: 'Kaydedilenler' });
    const favs = Store.favorites().map(function (id) { return byId[id]; }).filter(Boolean);
    const recent = Store.recent().map(function (r) { return byId[r.id]; }).filter(Boolean);
    let html = '<section class="section"><h2 class="section-title">Kaydettiğim makaleler</h2>';
    if (favs.length) {
      html += '<div class="row-actions"><button class="btn" data-action="pdf-favs">' + icon('pdf') + 'Hepsini PDF indir</button>' +
        '<button class="btn" data-action="print-favs">' + icon('print') + 'Yazdır</button></div>' +
        '<ul class="cards">' + favs.map(function (a) { return articleCard(a); }).join('') + '</ul>';
    } else {
      html += empty('Henüz kayıtlı makale yok', 'Bir makaleyi açıp üst köşedeki ' + icon('bookmark') + ' simgesine dokunun. Kendi el kitabınızı oluşturup tek seferde PDF olarak indirebilirsiniz.');
    }
    html += '</section>';
    if (recent.length) {
      html += '<section class="section"><h2 class="section-title">Son okunanlar</h2><ul class="cards">' +
        recent.map(function (a) { return articleCard(a); }).join('') + '</ul></section>';
    }
    view.innerHTML = html;
  }

  function viewMenu() {
    setChrome({ tab: 'more', title: 'Menü' });
    const items = [
      ['#/listeler', 'list', 'Kontrol listelerim', 'Çanta, stok ve hazırlık listelerindeki ilerlemeniz'],
      ['#/notlar', 'note', 'Not defteri', 'Kendi notlarınız, envanteriniz, günlüğünüz'],
      ['#/disa-aktar', 'pdf', 'PDF / Yazdır / Paylaş', 'Kitaplığın tamamını veya bir bölümünü dışa aktarın'],
      ['#/ayarlar', 'settings', 'Ayarlar', 'Tema, yazı boyutu, çevrim dışı durum'],
      ['#/hakkinda', 'info', 'Hakkında ve yasal uyarı', 'Bu kitaplık nedir, nasıl kullanılır']
    ];
    view.innerHTML = '<ul class="menu-list">' + items.map(function (it) {
      return '<li><a class="menu-item" href="' + it[0] + '">' + icon(it[1]) + '<span><strong>' + esc(it[2]) + '</strong><small>' + esc(it[3]) + '</small></span>' + icon('chevron', 'card-chevron') + '</a></li>';
    }).join('') + '</ul>';
  }

  function viewChecklists() {
    setChrome({ tab: 'more', back: true, title: 'Kontrol Listeleri' });
    const checks = Store.checks();
    const list = articles.filter(function (a) { return a.checks.length; });
    if (!list.length) { view.innerHTML = empty('Kontrol listesi içeren makale yok'); return; }
    view.innerHTML = '<p class="hint">İşaretleriniz bu cihazda saklanır. Listeyi açıp maddeleri işaretleyin.</p><ul class="cards">' + list.map(function (a) {
      const done = a.checks.filter(function (k) { return checks[k.key]; }).length;
      return '<li><a class="card-row" href="#/m/' + encodeURIComponent(a.id) + '"><div class="card-main"><div class="card-title">' + esc(a.title) + '</div>' +
        '<div class="card-cat">' + esc(catById[a.cat] ? catById[a.cat].ad : '') + '</div>' + progressHtml(done, a.checks.length) + '</div>' + icon('chevron', 'card-chevron') + '</a></li>';
    }).join('') + '</ul>';
  }

  function viewNotes() {
    setChrome({ tab: 'more', back: true, title: 'Not Defteri', actions: '<button class="icon-btn" data-action="note-new" aria-label="Yeni not">' + icon('plus') + '</button>' });
    const notes = Store.notes();
    let html = '<div class="row-actions"><button class="btn btn-primary" data-action="note-new">' + icon('plus') + 'Yeni not</button>' +
      (notes.length ? '<button class="btn" data-action="pdf-notes">' + icon('pdf') + 'PDF indir</button><button class="btn" data-action="print-notes">' + icon('print') + 'Yazdır</button>' : '') + '</div>';
    if (!notes.length) {
      html += empty('Henüz not yok', 'Envanter, ilaç listesi, buluşma noktaları, günlük… Notlarınız yalnızca bu cihazda saklanır. Menü &gt; PDF / Yazdır / Paylaş bölümünden yedekleyebilirsiniz.');
    } else {
      html += '<ul class="cards">' + notes.map(function (n) {
        const preview = String(n.body || '').replace(/\s+/g, ' ').slice(0, 120);
        return '<li><a class="card-row" href="#/notlar/' + encodeURIComponent(n.id) + '"><div class="card-main"><div class="card-title">' + esc(n.title || 'Başlıksız not') + '</div>' +
          '<div class="card-sub">' + esc(preview || 'Boş not') + '</div><div class="card-meta">' + icon('clock') + esc(fmtDate(n.updated)) + '</div></div>' + icon('chevron', 'card-chevron') + '</a></li>';
      }).join('') + '</ul>';
    }
    view.innerHTML = html;
  }

  function viewNote(id) {
    let note = id === 'yeni' ? { title: '', body: '' } : Store.getNote(id);
    if (!note) return viewNotFound();
    setChrome({
      tab: 'more', back: true, title: 'Not',
      actions: note.id ? '<button class="icon-btn" data-action="note-delete" data-id="' + esc(note.id) + '" aria-label="Notu sil">' + icon('trash') + '</button>' : ''
    });
    view.innerHTML = '<div class="note-editor">' +
      '<input id="note-title" class="note-title" placeholder="Başlık" value="' + esc(note.title || '') + '" aria-label="Not başlığı">' +
      '<textarea id="note-body" class="note-body" placeholder="Notunuzu yazın… (otomatik kaydedilir)" aria-label="Not metni">' + esc(note.body || '') + '</textarea>' +
      '<p class="hint" id="note-status">' + (note.updated ? 'Son kayıt: ' + esc(fmtDate(note.updated)) : 'Yazdıkça otomatik kaydedilir.') + '</p></div>';
    const t = $('#note-title');
    const b = $('#note-body');
    let tm = null;
    const save = function () {
      if (!note.id && !t.value.trim() && !b.value.trim()) return;
      note = Store.saveNote(Object.assign({}, note, { title: t.value, body: b.value }));
      if (location.hash === '#/notlar/yeni') history.replaceState(null, '', '#/notlar/' + encodeURIComponent(note.id));
      $('#note-status').textContent = 'Kaydedildi';
      $('#topbar-actions').innerHTML = '<button class="icon-btn" data-action="note-delete" data-id="' + esc(note.id) + '" aria-label="Notu sil">' + icon('trash') + '</button>';
    };
    const onInput = function () { $('#note-status').textContent = 'Yazılıyor…'; clearTimeout(tm); tm = setTimeout(save, 400); };
    t.addEventListener('input', onInput);
    b.addEventListener('input', onInput);
    if (!note.id) setTimeout(function () { t.focus(); }, 30);
  }

  function viewExport() {
    setChrome({ tab: 'more', back: true, title: 'PDF / Yazdır / Paylaş' });
    const notes = Store.notes();
    const favs = Store.favorites().filter(function (id) { return byId[id]; });
    view.innerHTML =
      '<section class="panel"><h2>' + icon('pdf') + 'PDF indir veya yazdır</h2>' +
      '<p class="hint">Kitaplığın tamamını ya da seçtiğiniz bölümleri internetsiz olarak PDF dosyasına dönüştürün veya doğrudan yazıcıya gönderin. Kâğıt kopya, elektrik kesildiğinde de çalışır.</p>' +
      '<fieldset class="field"><legend>Kapsam</legend>' +
      '<label class="radio"><input type="radio" name="scope" value="all" checked> Tüm kitaplık <small>(' + articles.length + ' makale)</small></label>' +
      '<label class="radio"><input type="radio" name="scope" value="urgent"> Yalnızca acil makaleler <small>(' + articles.filter(function (a) { return a.urgent; }).length + ')</small></label>' +
      '<label class="radio"><input type="radio" name="scope" value="favs"' + (favs.length ? '' : ' disabled') + '> Kaydettiklerim <small>(' + favs.length + ')</small></label>' +
      '<label class="radio"><input type="radio" name="scope" value="cats"> Seçtiğim kategoriler</label>' +
      '<div class="cat-picker" id="cat-picker" hidden>' + categories.map(function (c) {
        const n = articlesIn(c.id).length;
        if (!n) return '';
        return '<label class="check"><input type="checkbox" name="cat" value="' + c.id + '"> ' + c.ikon + ' ' + esc(c.ad) + ' <small>(' + n + ')</small></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="field"><legend>Seçenekler</legend>' +
      '<label class="check"><input type="checkbox" id="opt-cover" checked> Kapak sayfası</label>' +
      '<label class="check"><input type="checkbox" id="opt-toc" checked> İçindekiler</label>' +
      '<label class="check"><input type="checkbox" id="opt-break" checked> Her makale yeni sayfadan başlasın</label>' +
      '<label class="check"><input type="checkbox" id="opt-checks"> Kontrol listelerimdeki işaretleri göster</label>' +
      '<label class="check"><input type="checkbox" id="opt-notes"' + (notes.length ? '' : ' disabled') + '> Notlarımı ekle <small>(' + notes.length + ')</small></label>' +
      '<div class="inline-fields"><label>Sayfa <select id="opt-page"><option value="A4">A4</option><option value="A5">A5 (cep boyu)</option></select></label>' +
      '<label>Yazı <select id="opt-size"><option value="kucuk">Küçük (kâğıt tasarrufu)</option><option value="normal" selected>Normal</option><option value="buyuk">Büyük</option></select></label></div>' +
      '</fieldset>' +
      '<p class="hint" id="export-summary"></p>' +
      '<div class="row-actions"><button class="btn btn-primary" data-action="export-pdf">' + icon('pdf') + 'PDF indir</button>' +
      '<button class="btn" data-action="export-print">' + icon('print') + 'Yazdır</button></div></section>' +

      '<section class="panel" id="paylas"><h2>' + icon('share') + 'Kitaplığı çoğalt ve paylaş</h2>' +
      '<p class="hint">Uygulamanın tamamını tek bir <strong>.html</strong> dosyası olarak indirin. Bu dosyayı USB bellek, Bluetooth, e-posta veya mesajlaşma uygulamasıyla başkalarına verebilirsiniz. Dosya, kurulum gerektirmeden ve internet olmadan herhangi bir tarayıcıda açılır; PDF ve yazdırma özellikleri de içindedir.</p>' +
      '<div class="row-actions"><button class="btn btn-primary" data-action="standalone">' + icon('download') + 'Tek dosya indir (yaklaşık 3 MB)</button></div></section>' +

      '<section class="panel"><h2>' + icon('copy') + 'Verilerimi yedekle</h2>' +
      '<p class="hint">Kaydettikleriniz, notlarınız ve kontrol listesi işaretleriniz yalnızca bu cihazdadır. Yedek dosyası alıp başka bir cihaza aktarabilirsiniz.</p>' +
      '<div class="row-actions"><button class="btn" data-action="backup">' + icon('download') + 'Yedek indir</button>' +
      '<label class="btn">' + icon('upload') + 'Yedekten geri yükle<input type="file" id="restore-file" accept=".json,application/json" hidden></label></div></section>';

    const update = function () {
      const scope = $('input[name="scope"]:checked').value;
      $('#cat-picker').hidden = scope !== 'cats';
      const sel = selectedArticles();
      $('#export-summary').textContent = sel.list.length + ' makale seçildi · yaklaşık ' + Math.round(sel.list.reduce(function (s, a) { return s + a.words; }, 0) / 1000 * 10) / 10 + ' bin kelime';
    };
    view.addEventListener('change', function (e) {
      if (e.target.name === 'scope' || e.target.name === 'cat') update();
    });
    update();
    $('#restore-file').addEventListener('change', onRestore);
    if (location.hash.indexOf('#paylas') !== -1) setTimeout(function () { $('#paylas').scrollIntoView(); }, 50);
  }

  function selectedArticles() {
    const scope = ($('input[name="scope"]:checked') || {}).value || 'all';
    let list = articles;
    let title = 'Tüm Kitaplık';
    if (scope === 'urgent') { list = articles.filter(function (a) { return a.urgent; }); title = 'Acil Durum Makaleleri'; }
    if (scope === 'favs') { list = Store.favorites().map(function (id) { return byId[id]; }).filter(Boolean); title = 'Kişisel El Kitabım'; }
    if (scope === 'cats') {
      const cats = $$('input[name="cat"]:checked').map(function (i) { return i.value; });
      list = articles.filter(function (a) { return cats.indexOf(a.cat) !== -1; });
      title = cats.length === 1 && catById[cats[0]] ? catById[cats[0]].ad : 'Seçilmiş Bölümler';
    }
    return { list: list, title: title, group: scope !== 'favs' };
  }

  function exportOptions(sel) {
    return {
      title: sel.title,
      cover: $('#opt-cover').checked,
      toc: $('#opt-toc').checked,
      breakEachArticle: $('#opt-break').checked,
      showChecks: $('#opt-checks').checked,
      notes: $('#opt-notes').checked ? Store.notes() : null,
      pageSize: $('#opt-page').value,
      size: $('#opt-size').value,
      groupByCategory: sel.group && sel.list.length > 1
    };
  }

  function onRestore(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = function () {
      try {
        Store.importAll(JSON.parse(r.result));
        toast('Yedek geri yüklendi.');
      } catch (err) {
        toast('Geri yükleme başarısız: ' + err.message, 4500);
      }
      e.target.value = '';
    };
    r.readAsText(file);
  }

  function viewSettings() {
    setChrome({ tab: 'more', back: true, title: 'Ayarlar' });
    const s = Store.settings();
    const themes = [
      ['otomatik', 'Otomatik', 'Cihaz ayarını izler'],
      ['karanlik', 'Karanlık', 'Pil dostu, göz yormaz'],
      ['aydinlik', 'Aydınlık', 'Güneş altında okunaklı'],
      ['kirmizi', 'Kırmızı gece', 'Gece görüşünü korur, uzaktan az fark edilir'],
      ['kontrast', 'Yüksek kontrast', 'Az görenler için']
    ];
    view.innerHTML =
      '<section class="panel"><h2>Görünüm</h2><fieldset class="field"><legend>Tema</legend><div class="theme-grid">' + themes.map(function (t) {
        return '<label class="theme-opt theme-' + t[0] + '"><input type="radio" name="theme" value="' + t[0] + '"' + (s.theme === t[0] ? ' checked' : '') + '><span class="theme-swatch" aria-hidden="true"></span><span><strong>' + t[1] + '</strong><small>' + t[2] + '</small></span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="field"><legend>Yazı boyutu</legend><div class="range-row"><span class="small-a">A</span><input type="range" id="font-scale" min="0.85" max="1.6" step="0.05" value="' + s.fontScale + '" aria-label="Yazı boyutu"><span class="big-a">A</span></div>' +
      '<p class="prose sample">Örnek metin: Suyu fokurdadıktan sonra 1 dakika kaynatın.</p></fieldset></section>' +

      '<section class="panel"><h2>İnternetsiz kullanım</h2><div id="offline-detail"><p class="hint">Denetleniyor…</p></div>' +
      '<div class="row-actions" id="install-row"></div></section>' +

      '<section class="panel"><h2>Veriler</h2><p class="hint">Kayıtlı makaleler, notlar ve kontrol listesi işaretleri bu cihazda saklanır' + (Store.available ? '' : ' <strong>(bu tarayıcıda kalıcı depolama kapalı; veriler sayfa kapanınca silinir)</strong>') + '.</p>' +
      '<div class="row-actions"><a class="btn" href="#/disa-aktar">' + icon('copy') + 'Yedekle / geri yükle</a>' +
      '<button class="btn btn-danger" data-action="clear-data">' + icon('trash') + 'Tüm verilerimi sil</button></div></section>';

    view.addEventListener('change', function (e) {
      if (e.target.name === 'theme') { Store.setSetting('theme', e.target.value); applySettings(); }
    });
    $('#font-scale').addEventListener('input', function (e) { Store.setSetting('fontScale', Number(e.target.value)); applySettings(); });
    renderOfflineDetail();
  }

  async function renderOfflineDetail() {
    const box = $('#offline-detail');
    if (!box) return;
    const ready = await offlineReady();
    let html = '';
    if (STANDALONE) {
      html = '<p><span class="chip chip-ok">' + icon('check') + 'Tek dosya sürümü</span></p><p class="hint">Bu dosya her şeyi içinde taşır; internete hiç ihtiyaç duymaz. Dosyayı kaybetmemek için birkaç yere kopyalayın.</p>';
    } else {
      html = '<p><span class="chip ' + (ready ? 'chip-ok' : 'chip-warn') + '">' + (ready ? icon('check') + 'Tüm içerik cihaza indirildi' : icon('offline') + 'Henüz tamamlanmadı') + '</span></p>';
      if (navigator.storage && navigator.storage.persisted) {
        const persisted = await navigator.storage.persisted().catch(function () { return false; });
        html += '<p class="hint">Kalıcı depolama: <strong>' + (persisted ? 'açık' : 'kapalı') + '</strong>. ' +
          (persisted ? 'Tarayıcı, yer açmak için bu kitaplığı silmez.' : 'Açarsanız tarayıcı yer darlığında kitaplığı silmez.') + '</p>';
        if (!persisted) html += '<div class="row-actions"><button class="btn" data-action="persist">Kalıcı depolamayı iste</button></div>';
      }
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate().catch(function () { return null; });
        if (est && est.usage) html += '<p class="hint">Kullanılan alan: yaklaşık ' + (est.usage / 1048576).toFixed(1) + ' MB</p>';
      }
    }
    box.innerHTML = html;
    renderInstallRow();
  }

  /* --- Kurulum (Ana ekrana ekle) --- */
  let installEvent = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installEvent = e;
    renderInstallRow();
  });

  function renderInstallRow() {
    const row = $('#install-row');
    if (!row) return;
    const isStandaloneDisplay = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (STANDALONE || isStandaloneDisplay) { row.innerHTML = ''; return; }
    if (installEvent) {
      row.innerHTML = '<button class="btn btn-primary" data-action="install">' + icon('install') + 'Uygulamayı cihaza kur</button>';
    } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      row.innerHTML = '<p class="hint">iPhone/iPad: Safari\'de <strong>Paylaş</strong> düğmesine, ardından <strong>Ana Ekrana Ekle</strong> seçeneğine dokunun.</p>';
    } else {
      row.innerHTML = '<p class="hint">Tarayıcı menüsünden <strong>Uygulamayı yükle</strong> veya <strong>Ana ekrana ekle</strong> seçeneğini kullanabilirsiniz.</p>';
    }
  }

  function viewAbout() {
    setChrome({ tab: 'more', back: true, title: 'Hakkında' });
    view.innerHTML = '<article class="prose about">' +
      '<h2>' + esc(CFG.name) + '</h2>' +
      '<p>' + esc(CFG.description) + '</p>' +
      '<p>Kitaplık bir kez açıldıktan sonra <strong>internet olmadan</strong> çalışır. Tüm makaleler, arama, PDF oluşturma ve yazdırma cihazınızın içinde gerçekleşir; hiçbir veri dışarı gönderilmez.</p>' +
      '<aside class="callout callout-tehlike"><div class="callout-title">Yasal uyarı</div>' +
      '<p>Buradaki bilgiler genel eğitim amaçlıdır ve profesyonel tıbbi, hukuki veya teknik yardımın yerini tutmaz. Yardıma ulaşabiliyorsanız önce <strong>' + esc(CFG.emergencyNumber) + '</strong> acil çağrı numarasını arayın ve resmi kurumların (AFAD, sağlık ekipleri, kolluk) talimatlarına uyun. Bilgileri uygularken kendi güvenliğinizi gözetin; sonuçlarından kullanıcı sorumludur.</p></aside>' +
      '<h3>Nasıl kullanılır?</h3><ul>' +
      '<li><strong>ACİL</strong> sekmesi, panik anında gereken makalelere tek dokunuşla ulaştırır.</li>' +
      '<li>Makalelerdeki kutucuklar işaretlenebilir; ilerlemeniz cihazda saklanır.</li>' +
      '<li>Önemli makaleleri kaydedin, ardından "Kaydedilenler" ekranından kişisel el kitabınızı PDF olarak indirin.</li>' +
      '<li>Menü &gt; PDF / Yazdır / Paylaş ekranından kitaplığın tamamını kâğıda dökebilir veya tek dosya olarak başkalarıyla paylaşabilirsiniz.</li>' +
      '<li>Gece kullanımında <strong>Kırmızı gece</strong> teması gözlerinizin karanlığa uyumunu bozmaz.</li></ul>' +
      '<h3>Kaynaklar</h3><p>İçerik; Dünya Sağlık Örgütü (WHO), AFAD, Türk Kızılay, Uluslararası Kızılhaç Komitesi (ICRC), Avrupa Resüsitasyon Konseyi (ERC) ve benzeri kurumların halka açık yönergeleri esas alınarak derlenmiştir.</p>' +
      '<p class="hint">' + articles.length + ' makale · ' + (RAW.built ? 'Sürüm ' + esc(RAW.built) : '') + '</p></article>';
  }

  function viewNotFound() {
    setChrome({ tab: 'home', back: true, title: 'Bulunamadı' });
    view.innerHTML = empty('Sayfa bulunamadı', '<a href="#/">Kitaplığa dön</a>');
  }

  /* ================= Ayarlar ================= */

  function applySettings() {
    const s = Store.settings();
    if (s.theme && s.theme !== 'otomatik') document.documentElement.setAttribute('data-theme', s.theme);
    else document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.setProperty('--fs', s.fontScale || 1);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bar').trim();
      if (bg) meta.setAttribute('content', bg);
    }
  }

  /* ================= Olaylar ================= */

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const act = el.getAttribute('data-action');
    const id = el.getAttribute('data-id');
    switch (act) {
      case 'back':
        if (history.length > 1) history.back(); else location.hash = '#/';
        break;
      case 'goto': {
        e.preventDefault();
        const t = document.getElementById(el.getAttribute('data-target'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'fav': {
        const on = Store.toggleFavorite(id);
        el.setAttribute('aria-pressed', on);
        el.setAttribute('aria-label', on ? 'Kayıtlılardan çıkar' : 'Kaydet');
        el.innerHTML = icon(on ? 'bookmarkFill' : 'bookmark');
        toast(on ? 'Kaydedildi.' : 'Kayıtlılardan çıkarıldı.');
        break;
      }
      case 'font-up': case 'font-down': {
        const s = Store.settings();
        const v = Math.min(1.6, Math.max(0.85, Math.round(((s.fontScale || 1) + (act === 'font-up' ? 0.1 : -0.1)) * 100) / 100));
        Store.setSetting('fontScale', v);
        applySettings();
        break;
      }
      case 'reset-checks': {
        const a = byId[id];
        if (a && confirm('Bu listedeki tüm işaretler kaldırılsın mı?')) {
          Store.clearChecks(a.checks.map(function (c) { return c.key; }));
          $$('#prose input[data-check]').forEach(function (i) { i.checked = false; });
          updateProgress(a);
        }
        break;
      }
      case 'pdf-one': exportPdf([byId[id]], { title: byId[id].title, cover: false, toc: false, showChecks: true }); break;
      case 'print-one': printArticles([byId[id]], { showChecks: true }); break;
      case 'pdf-cat': exportPdf(articlesIn(id), { title: catById[id].ad, subtitle: catById[id].aciklama, cover: true, toc: true }); break;
      case 'print-cat': printArticles(articlesIn(id), { title: catById[id].ad, cover: true, toc: true }); break;
      case 'pdf-urgent': exportPdf(articles.filter(function (a) { return a.urgent; }), { title: 'Acil Durum Makaleleri', subtitle: 'Hayat kurtaran bilgiler', cover: true, toc: true }); break;
      case 'print-urgent': printArticles(articles.filter(function (a) { return a.urgent; }), { title: 'Acil Durum Makaleleri', cover: true, toc: true }); break;
      case 'pdf-favs': exportPdf(Store.favorites().map(function (i) { return byId[i]; }).filter(Boolean), { title: 'Kişisel El Kitabım', cover: true, toc: true, showChecks: true }); break;
      case 'print-favs': printArticles(Store.favorites().map(function (i) { return byId[i]; }).filter(Boolean), { title: 'Kişisel El Kitabım', cover: true, toc: true, showChecks: true }); break;
      case 'pdf-notes': exportPdf([], { title: 'Notlarım', cover: false, toc: false, notes: Store.notes() }); break;
      case 'print-notes': printArticles([], { notes: Store.notes() }); break;
      case 'export-pdf': { const sel = selectedArticles(); exportPdf(sel.list, exportOptions(sel)); break; }
      case 'export-print': { const sel = selectedArticles(); printArticles(sel.list, exportOptions(sel)); break; }
      case 'standalone': downloadStandalone(); break;
      case 'backup': {
        const data = JSON.stringify(Store.exportAll(), null, 1);
        saveBlob(new Blob([data], { type: 'application/json' }), fileSafe(CFG.shortName + '-yedek-' + new Date().toISOString().slice(0, 10)) + '.json');
        toast('Yedek indirildi.');
        break;
      }
      case 'note-new': location.hash = '#/notlar/yeni'; break;
      case 'note-delete':
        if (confirm('Bu not kalıcı olarak silinsin mi?')) { Store.deleteNote(id); location.hash = '#/notlar'; toast('Not silindi.'); }
        break;
      case 'clear-data':
        if (confirm('Kayıtlı makaleler, notlar, kontrol listesi işaretleri ve ayarlar silinecek. Emin misiniz?')) {
          Store.clearAll(); applySettings(); toast('Veriler silindi.'); route();
        }
        break;
      case 'persist':
        navigator.storage.persist().then(function (ok) {
          toast(ok ? 'Kalıcı depolama açıldı.' : 'Tarayıcı izin vermedi. Uygulamayı ana ekrana eklemek genellikle yardımcı olur.', 4500);
          renderOfflineDetail();
        });
        break;
      case 'install':
        if (installEvent) {
          installEvent.prompt();
          installEvent.userChoice.finally(function () { installEvent = null; renderInstallRow(); });
        }
        break;
    }
  });

  document.addEventListener('change', function (e) {
    const key = e.target.getAttribute && e.target.getAttribute('data-check');
    if (!key) return;
    Store.setCheck(key, e.target.checked);
    const m = location.hash.match(/^#\/m\/([^?]+)/);
    if (m && byId[decodeURIComponent(m[1])]) updateProgress(byId[decodeURIComponent(m[1])]);
  });

  function updateProgress(a) {
    const box = $('#progress-box');
    if (!box) return;
    const checks = Store.checks();
    const done = a.checks.filter(function (k) { return checks[k.key]; }).length;
    box.innerHTML = progressHtml(done, a.checks.length) + '<button class="link-btn" data-action="reset-checks" data-id="' + a.id + '">Sıfırla</button>';
  }

  /* ================= Yönlendirme ================= */

  const scrollPos = {};
  let currentKey = null;

  function route() {
    const hash = location.hash || '#/';
    const qIdx = hash.indexOf('?');
    const path = (qIdx === -1 ? hash : hash.slice(0, qIdx)).replace(/^#/, '').replace(/#.*$/, '') || '/';
    const params = new URLSearchParams(qIdx === -1 ? '' : hash.slice(qIdx + 1).replace(/#.*$/, ''));
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);

    if (currentKey) scrollPos[currentKey] = window.scrollY;
    // Yeni bir görünüm çizilirken eski dinleyicileri temizlemek için #view'i yeniden oluştur
    const fresh = view.cloneNode(false);
    view.parentNode.replaceChild(fresh, view);
    view = fresh;

    switch (parts[0]) {
      case undefined: viewHome(); break;
      case 'acil': viewUrgent(); break;
      case 'k': viewCategory(parts[1]); break;
      case 'm': viewArticle(parts[1], params.get('q')); break;
      case 'ara': viewSearch(params.get('q') || ''); break;
      case 'kaydedilenler': viewSaved(); break;
      case 'menu': viewMenu(); break;
      case 'listeler': viewChecklists(); break;
      case 'notlar': if (parts[1]) viewNote(parts[1]); else viewNotes(); break;
      case 'disa-aktar': viewExport(); break;
      case 'ayarlar': viewSettings(); break;
      case 'hakkinda': viewAbout(); break;
      default: viewNotFound();
    }
    currentKey = path;
    const y = scrollPos[path];
    if (!params.get('q')) window.scrollTo(0, y && navType === 'back' ? y : 0);
    navType = 'push';
  }

  let navType = 'push';
  window.addEventListener('popstate', function () { navType = 'back'; });

  /* ================= Başlat ================= */

  function registerSW() {
    if (STANDALONE || !('serviceWorker' in navigator) || location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        reg.addEventListener('updatefound', function () {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'activated') {
              refreshOfflineChip();
              if (hadController) toast('Kitaplık güncellendi. En yeni içerik için sayfayı yenileyin.', 6000);
              else toast('Kitaplık cihaza indirildi. Artık internetsiz kullanabilirsiniz.', 5000);
            }
          });
        });
      }).catch(function (e) { console.warn('SW kaydı başarısız', e); });
      navigator.serviceWorker.addEventListener('controllerchange', function () { refreshOfflineChip(); });
    });
  }

  renderShell();
  applySettings();
  window.addEventListener('hashchange', route);
  route();
  registerSW();
  Store.onChange(function (what) { if (what === 'import') route(); });
})();
