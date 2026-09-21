/* PITCH+ v6 — content script sur pitch-icam.rima1.fr : exécute les GET de l'API PITCH avec la session
   déjà ouverte et renvoie le JSON brut. Lecture seule : jamais de POST/PUT. */
(function () {
  if (window.__pp6cs) return;
  window.__pp6cs = true;
  chrome.runtime.onMessage.addListener(function (msg, sender, send) {
    if (!msg || !msg.type) return;
    if (msg.type === 'ping') { send({ ok: true, url: location.href }); return; }
    if (msg.type === 'fetch') {
      var path = String(msg.path || '');
      if (!/^\/api\//.test(path)) { send({ ok: false, error: 'chemin refusé' }); return; }
      fetch(location.origin + path, { credentials: 'include', method: 'GET' }).then(function (r) {
        var ct = r.headers.get('content-type') || '';
        if (r.status === 401 || r.status === 403 || r.redirected && /login|connexion|account/i.test(r.url)) { send({ ok: false, auth: true, status: r.status }); return; }
        if (!r.ok) { send({ ok: false, status: r.status }); return; }
        if (!/json/i.test(ct)) { send({ ok: false, auth: true, status: r.status, ct: ct }); return; }
        return r.json().then(function (d) { send({ ok: true, data: d }); });
      }).catch(function (e) { send({ ok: false, error: String(e) }); });
      return true;
    }
  });
})();
