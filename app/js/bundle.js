/*
 * Tek dosya sürümü: uygulamanın tüm parçalarını (stil, kod, içerik, PDF motoru)
 * tek bir .html dosyasına gömer. Bu dosya USB, Bluetooth veya e-postayla paylaşılabilir
 * ve herhangi bir tarayıcıda internetsiz açılır.
 *
 * Aynı kod hem derleme aracında (Node) hem de uygulamanın içinde çalışır.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KKBundle = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function escScript(js) {
    return String(js).replace(/<\/(script)/gi, '<\\/$1');
  }

  function escStyle(css) {
    return String(css).replace(/<\/(style)/gi, '<\\/$1');
  }

  function attr(tag, name) {
    const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*"([^"]*)"', 'i'));
    return m ? m[1] : null;
  }

  function isLocal(href) {
    return href && !/^([a-z]+:|\/\/)/i.test(href);
  }

  /**
   * indexHtml: uygulamanın index.html metni
   * readText(path): Promise<string> veya string — yerel dosya içeriğini döndürür
   * opts.lazyScripts: yalnızca gerektiğinde çalıştırılacak betiklerin yolları
   * opts.iconDataUri: sekme simgesi için data: URI (isteğe bağlı)
   */
  async function assemble(indexHtml, readText, opts) {
    opts = opts || {};
    let html = String(indexHtml);

    // Çevrim içi parçaları kaldır: manifest, apple-touch-icon
    html = html.replace(/\s*<link[^>]+rel="manifest"[^>]*>/i, '');
    html = html.replace(/\s*<link[^>]+rel="apple-touch-icon"[^>]*>/i, '');

    // Sekme simgesi
    html = html.replace(/<link[^>]+rel="icon"[^>]*>/i, function (tag) {
      return opts.iconDataUri ? '<link rel="icon" href="' + opts.iconDataUri + '">' : '';
    });

    // Stil dosyaları
    const linkTags = html.match(/<link[^>]+rel="stylesheet"[^>]*>/gi) || [];
    for (const tag of linkTags) {
      const href = attr(tag, 'href');
      if (!isLocal(href)) continue;
      const css = await readText(href);
      html = html.replace(tag, function () { return '<style data-src="' + href + '">\n' + escStyle(css) + '\n</style>'; });
    }

    // Betikler
    const scriptTags = html.match(/<script[^>]+src="[^"]+"[^>]*><\/script>/gi) || [];
    for (const tag of scriptTags) {
      const src = attr(tag, 'src');
      if (!isLocal(src)) continue;
      const js = await readText(src);
      html = html.replace(tag, function () { return '<script data-src="' + src + '">\n' + escScript(js) + '\n</script>'; });
    }

    // Tembel betikler: çalıştırılmaz, gerektiğinde uygulama tarafından yürütülür
    let lazy = '';
    for (const src of opts.lazyScripts || []) {
      const js = await readText(src);
      lazy += '<script type="text/x-kk-lazy" data-src="' + src + '">\n' + escScript(js) + '\n</script>\n';
    }
    if (lazy) {
      const at = html.indexOf('<script data-src=');
      html = at === -1 ? html.replace('</body>', function () { return lazy + '</body>'; }) : html.slice(0, at) + lazy + html.slice(at);
    }

    html = html.replace(/<html([^>]*)>/i, function (m, rest) {
      return /data-standalone/.test(rest) ? m : '<html' + rest + ' data-standalone="1">';
    });
    return html;
  }

  return { assemble: assemble, escScript: escScript };
});
