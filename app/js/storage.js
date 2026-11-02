/*
 * Kullanıcı verileri: kaydedilenler, kontrol listesi işaretleri, notlar, ayarlar.
 * Her şey cihazda (localStorage) saklanır; hiçbir veri dışarı gönderilmez.
 */
(function (root) {
  'use strict';
  const PREFIX = (root.KK_CONFIG && root.KK_CONFIG.storagePrefix) || 'kk1:';
  const KEYS = ['favorites', 'checks', 'notes', 'settings', 'recent'];
  const memory = {};
  let available = true;

  try {
    const t = PREFIX + '__test';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
  } catch (e) {
    available = false;
  }

  function read(key, def) {
    if (key in memory) return memory[key];
    let val = def;
    if (available) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw != null) val = JSON.parse(raw);
      } catch (e) { /* bozuk veri: varsayılana dön */ }
    }
    memory[key] = val;
    return val;
  }

  function write(key, val) {
    memory[key] = val;
    if (!available) return false;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  const listeners = [];
  function emit(what) { listeners.forEach(function (fn) { try { fn(what); } catch (e) { /* yoksay */ } }); }

  const Store = {
    get available() { return available; },
    onChange: function (fn) { listeners.push(fn); },

    /* --- Kaydedilenler --- */
    favorites: function () { return read('favorites', []); },
    isFavorite: function (id) { return Store.favorites().indexOf(id) !== -1; },
    toggleFavorite: function (id) {
      const list = Store.favorites().slice();
      const i = list.indexOf(id);
      if (i === -1) list.unshift(id); else list.splice(i, 1);
      write('favorites', list);
      emit('favorites');
      return i === -1;
    },

    /* --- Kontrol listeleri --- */
    checks: function () { return read('checks', {}); },
    setCheck: function (key, on) {
      const c = Object.assign({}, Store.checks());
      if (on) c[key] = 1; else delete c[key];
      write('checks', c);
      emit('checks');
    },
    clearChecks: function (keys) {
      const c = Object.assign({}, Store.checks());
      keys.forEach(function (k) { delete c[k]; });
      write('checks', c);
      emit('checks');
    },

    /* --- Son okunanlar --- */
    recent: function () { return read('recent', []); },
    addRecent: function (id) {
      const list = Store.recent().filter(function (r) { return r.id !== id; });
      list.unshift({ id: id, t: Date.now() });
      write('recent', list.slice(0, 12));
    },

    /* --- Notlar --- */
    notes: function () { return read('notes', []); },
    getNote: function (id) { return Store.notes().find(function (n) { return n.id === id; }) || null; },
    saveNote: function (note) {
      const list = Store.notes().slice();
      const now = Date.now();
      const i = list.findIndex(function (n) { return n.id === note.id; });
      const rec = Object.assign({}, note, { updated: now });
      if (!rec.id) rec.id = 'n' + now.toString(36) + Math.random().toString(36).slice(2, 6);
      if (!rec.created) rec.created = now;
      if (i === -1) list.unshift(rec); else list[i] = rec;
      write('notes', list);
      emit('notes');
      return rec;
    },
    deleteNote: function (id) {
      write('notes', Store.notes().filter(function (n) { return n.id !== id; }));
      emit('notes');
    },

    /* --- Ayarlar --- */
    settings: function () {
      return Object.assign({ theme: 'otomatik', fontScale: 1 }, read('settings', {}));
    },
    setSetting: function (k, v) {
      const s = Object.assign({}, read('settings', {}));
      s[k] = v;
      write('settings', s);
      emit('settings');
    },

    /* --- Yedekleme --- */
    exportAll: function () {
      const data = { app: 'postapokaliptik-org', format: 1, exported: new Date().toISOString() };
      KEYS.forEach(function (k) { data[k] = read(k, null); });
      return data;
    },
    importAll: function (data) {
      if (!data || ['postapokaliptik-org', 'kiyamet-kitapligi'].indexOf(data.app) === -1) throw new Error('Bu dosya bir kitaplık yedeği değil.');
      KEYS.forEach(function (k) {
        if (data[k] == null) return;
        if (k === 'notes') {
          // Notları birleştir (aynı kimlik varsa yenisi kazanır)
          const byId = {};
          Store.notes().concat(data.notes).forEach(function (n) {
            if (n && n.id && (!byId[n.id] || (n.updated || 0) > (byId[n.id].updated || 0))) byId[n.id] = n;
          });
          write('notes', Object.values(byId).sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); }));
        } else if (k === 'favorites') {
          const merged = Store.favorites().slice();
          data.favorites.forEach(function (id) { if (merged.indexOf(id) === -1) merged.push(id); });
          write('favorites', merged);
        } else if (k === 'checks') {
          write('checks', Object.assign({}, Store.checks(), data.checks));
        } else {
          write(k, data[k]);
        }
      });
      emit('import');
    },
    clearAll: function () {
      KEYS.forEach(function (k) {
        delete memory[k];
        if (available) { try { localStorage.removeItem(PREFIX + k); } catch (e) { /* yoksay */ } }
      });
      emit('clear');
    }
  };

  root.KKStore = Store;
})(typeof self !== 'undefined' ? self : this);
