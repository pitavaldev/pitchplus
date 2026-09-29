/* PITCH+ v6 — service worker : rafraîchit le flux Hyperplanning (ICS) et ouvre le tableau de bord.
   Aucune donnée ne quitte le navigateur : la seule requête réseau est le GET du flux ICS de l'étudiant. */
import { store, K, isIcsUrl } from './lib/store.js';

const APP = 'app/app.html';
const ALARM = 'pp6-ics-refresh';

chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL(APP);
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length) return chrome.tabs.update(tabs[0].id, { active: true });
  chrome.tabs.create({ url });
});

const DAY = 24 * 60 * 60 * 1000;
function schedule(maxAge) { chrome.alarms.create(ALARM, { periodInMinutes: 24 * 60 }); refreshIcs(null, maxAge); }
chrome.runtime.onInstalled.addListener(() => schedule(0));
chrome.runtime.onStartup.addListener(() => schedule(DAY));
chrome.alarms.onAlarm.addListener(a => { if (a.name === ALARM) refreshIcs(); });

export async function refreshIcs(urlOverride, maxAgeMs) {
  const s = await store.get([K.ICS_URL, K.ICS_AT]);
  const url = urlOverride || s[K.ICS_URL];
  if (maxAgeMs && s[K.ICS_AT] && Date.now() - Date.parse(s[K.ICS_AT]) < maxAgeMs) return { ok: true, skipped: true, at: s[K.ICS_AT] };
  if (!url) return { ok: false, error: 'no-url' };
  if (!isIcsUrl(url)) return { ok: false, error: 'bad-url' };
  try {
    const r = await fetch(url, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    if (!/^BEGIN:VCALENDAR/.test(text.trim())) throw new Error('pas un calendrier');
    const at = new Date().toISOString();
    await store.set({ [K.ICS_TEXT]: text, [K.ICS_AT]: at, [K.ICS_ERR]: '' });
    return { ok: true, at, size: text.length };
  } catch (e) {
    await store.set({ [K.ICS_ERR]: String(e && e.message || e) });
    return { ok: false, error: String(e && e.message || e) };
  }
}

chrome.runtime.onMessage.addListener((msg, sender, send) => {
  if (!msg || !msg.type) return;
  if (msg.type === 'ics:refresh') { refreshIcs().then(send); return true; }
  if (msg.type === 'ics:set') {
    (async () => {
      const url = String(msg.url || '').trim();
      if (!isIcsUrl(url)) return send({ ok: false, error: 'bad-url' });
      await store.set({ [K.ICS_URL]: url });
      send(await refreshIcs(url));
    })();
    return true;
  }
  if (msg.type === 'ics:clear') { store.remove([K.ICS_URL, K.ICS_TEXT, K.ICS_AT, K.ICS_ERR]).then(() => send({ ok: true })); return true; }
});
