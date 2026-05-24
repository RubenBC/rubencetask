// ── Mis Tareas — Service Worker ─────────────────────────────────────────────
const CACHE   = 'tareas-v1';
const DB_NAME = 'tareas-reminders';
const STORE   = 'reminders';

let timers = {};   // id → timeoutId (en memoria mientras el SW vive)

// ── IndexedDB ────────────────────────────────────────────────────────────────
function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e);
  });
}

async function idbPut(obj) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(obj);
    tx.oncomplete = res; tx.onerror = rej;
  });
}

async function idbDelete(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = res; tx.onerror = rej;
  });
}

async function idbAll() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = e => res(e.target.result);
    req.onerror   = rej;
  });
}

// ── Scheduling ───────────────────────────────────────────────────────────────
function scheduleOne(reminder) {
  const delay = new Date(reminder.dt).getTime() - Date.now();
  if (delay <= 0) {
    // Ya venció — mostrar de inmediato si falta menos de 60 s
    if (delay > -60000) fireNotification(reminder);
    return;
  }
  if (timers[reminder.id]) clearTimeout(timers[reminder.id]);
  timers[reminder.id] = setTimeout(() => fireNotification(reminder), delay);
}

function fireNotification(reminder) {
  self.registration.showNotification('⏰ ' + reminder.text, {
    body:             `Recordatorio programado para ${formatTime(reminder.dt)}`,
    icon:             '/icon.svg',
    badge:            '/icon.svg',
    tag:              'reminder-' + reminder.id,
    requireInteraction: true,
    vibrate:          [200, 100, 200],
    data:             { id: reminder.id },
    actions: [
      { action: 'open',   title: 'Abrir app' },
      { action: 'dismiss',title: 'Ignorar'   },
    ],
  });
  idbDelete(reminder.id);
  delete timers[reminder.id];
}

function formatTime(dt) {
  return new Date(dt).toLocaleString('es-MX', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
}

async function rescheduleAll() {
  const all = await idbAll();
  all.forEach(r => scheduleOne(r));
  console.log(`[SW] ${all.length} recordatorio(s) recargado(s)`);
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e  => e.waitUntil(clients.claim().then(rescheduleAll)));

// Cache básico para que la app funcione offline
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp.ok && e.request.method === 'GET') {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});

// ── Mensajes desde la página ─────────────────────────────────────────────────
self.addEventListener('message', async e => {
  const { type } = e.data;

  if (type === 'ADD_REMINDER') {
    await idbPut(e.data.reminder);
    scheduleOne(e.data.reminder);

  } else if (type === 'REMOVE_REMINDER') {
    await idbDelete(e.data.id);
    if (timers[e.data.id]) { clearTimeout(timers[e.data.id]); delete timers[e.data.id]; }

  } else if (type === 'RESCHEDULE') {
    // La página pide recargar todos (al abrirse)
    await rescheduleAll();
  }
});

// ── Click en notificación ────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type:'window' }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      return existing ? existing.focus() : clients.openWindow('/');
    })
  );
});
