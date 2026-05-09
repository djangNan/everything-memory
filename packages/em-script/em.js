// Everything Memory — embeddable script (D2.1).
// Hand-bundled IIFE. Exposes window.EM = { init, identify, track, setDemographics }.
// Source of truth — copy into each app's /public/em.js (apps/admin, apps/mockple, apps/mockzon).
// SHA-256 via Web Crypto. POST { apiKey, userHash, eventType, properties, occurredAt } to ${apiBase}/events.
(function () {
  if (typeof window === 'undefined') return;

  var state = { apiKey: '', apiBase: '', userHash: '' };

  // Restore cached hash so reloads preserve identity without re-running identify().
  try {
    var cached = localStorage.getItem('em_user_hash');
    if (cached) state.userHash = cached;
  } catch (_) {}

  function warn() {
    try { console.warn.apply(console, ['[em]'].concat(Array.prototype.slice.call(arguments))); } catch (_) {}
  }

  async function sha256Hex(str) {
    var buf = new TextEncoder().encode(str);
    var digest = await crypto.subtle.digest('SHA-256', buf);
    var bytes = new Uint8Array(digest);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  async function postEvent(eventType, properties) {
    if (!state.apiKey || !state.apiBase) { warn('init() not called yet, dropping', eventType); return; }
    if (!state.userHash) { warn('no user (call identify first), dropping', eventType); return; }
    try {
      var r = await fetch(state.apiBase + '/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: state.apiKey,
          userHash: state.userHash,
          eventType: eventType,
          properties: properties || {},
          occurredAt: new Date().toISOString(),
        }),
      });
      if (!r.ok) { warn('post', eventType, 'status', r.status); }
    } catch (e) {
      warn('post error', e && e.message);
    }
  }

  window.EM = {
    init: function (opts) {
      if (!opts || !opts.apiKey) { warn('init: apiKey required'); return; }
      state.apiKey = String(opts.apiKey);
      state.apiBase = String(opts.apiBase || state.apiBase || '');
    },
    identify: async function (email) {
      if (!email) { warn('identify: email required'); return; }
      var normalized = String(email).trim().toLowerCase();
      var hash = await sha256Hex(normalized);
      state.userHash = hash;
      try { localStorage.setItem('em_user_hash', hash); } catch (_) {}
    },
    track: function (eventType, properties) {
      if (!eventType) return Promise.resolve();
      return postEvent(String(eventType), properties);
    },
    setDemographics: function (d) {
      return postEvent('demographics_set', d || {});
    },
  };
})();
