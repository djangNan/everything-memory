// Everything Memory — STUB (D2.0). Final IIFE build replaces this at T+2:00.
// Signatures match packages/em-script/src/index.ts so j can wire embeds now.
(function () {
  if (typeof window === 'undefined') return;
  window.EM = {
    init: function (opts) {
      window.__EM_KEY = opts && opts.apiKey;
      window.__EM_API = (opts && opts.apiBase) || window.__EM_API || '';
      console.log('[em:stub] init', opts);
    },
    identify: function (email) {
      var hash = 'stub_' + String(email || '').trim().toLowerCase();
      window.__EM_HASH = hash;
      try { localStorage.setItem('em_user_hash', hash); } catch (e) {}
      console.log('[em:stub] identify', email, '→', hash);
      return Promise.resolve();
    },
    track: function (eventType, properties) {
      console.log('[em:stub] track', eventType, properties);
      return Promise.resolve();
    },
    setDemographics: function (d) {
      console.log('[em:stub] setDemographics', d);
      return Promise.resolve();
    },
  };
})();
