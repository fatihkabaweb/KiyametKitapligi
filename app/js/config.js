/*
 * Uygulamanın adı ve temel ayarları — TEK YER.
 * Adı değiştirmek için yalnızca burayı düzenleyip `node tools/build.mjs` çalıştırın;
 * manifest, sayfa başlığı ve PDF'ler buradan beslenir.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KK_CONFIG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    name: 'Kıyamet Kitaplığı',
    shortName: 'Kıyamet',
    tagline: 'İnternetsiz hayatta kalma kütüphanesi',
    description: 'Afet, savaş, salgın ve yalnız hayatta kalma koşulları için çevrim dışı çalışan, PDF olarak dışa aktarılabilen bilgi arşivi.',
    themeColor: '#151311',
    emergencyNumber: '112',
    storagePrefix: 'kk1:',
    // Yalnızca gerektiğinde yüklenen büyük dosyalar (PDF motoru)
    lazyScripts: ['vendor/pdfmake/pdfmake.min.js', 'vendor/pdfmake/vfs_fonts.js']
  };
});
