/* PITCH+ v6 — stockage local : chrome.storage.local dans l'extension, localStorage en mode page (tests, démo). */
const hasChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
export const store = {
  async get(keys) {
    if (hasChrome) return new Promise(r => chrome.storage.local.get(keys, r));
    const out = {};
    (Array.isArray(keys) ? keys : [keys]).forEach(k => { try { const v = localStorage.getItem('pp6.' + k); if (v != null) out[k] = JSON.parse(v); } catch (e) { } });
    return out;
  },
  async set(obj) {
    if (hasChrome) return new Promise(r => chrome.storage.local.set(obj, r));
    Object.keys(obj).forEach(k => { try { localStorage.setItem('pp6.' + k, JSON.stringify(obj[k])); } catch (e) { } });
  },
  async remove(keys) {
    if (hasChrome) return new Promise(r => chrome.storage.local.remove(keys, r));
    (Array.isArray(keys) ? keys : [keys]).forEach(k => { try { localStorage.removeItem('pp6.' + k); } catch (e) { } });
  }
};
export const K = { ICS_URL: 'icsUrl', ICS_TEXT: 'icsText', ICS_AT: 'icsFetchedAt', ICS_ERR: 'icsError', PITCH: 'pitchState', SNAP: 'snapshot', NOTES: 'notes', PREFS: 'prefs' };
/** Masque le secret d'une URL ICS pour l'affichage : …71B2 */
export function maskIcsUrl(u) {
  try { const x = new URL(u); const t = x.searchParams.get('icalsecurise') || ''; return x.origin + x.pathname + (t ? '?icalsecurise=…' + t.slice(-4) : ''); } catch (e) { return '…'; }
}
export function isIcsUrl(u) { return /^https:\/\/planning\.icam\.fr\/Telechargements\/ical\/[^?]+\.ics\?/.test(String(u || '').trim()); }
