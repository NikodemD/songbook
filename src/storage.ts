const DB_NAME = "songbook";
const STORE = "songs";
const TAB_STORE = "tabs";
const DB_VERSION = 2;

export interface Song {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  sourceUrl?: string;
  image?: Blob;
}

export interface GuitarTab {
  id: string;
  title: string;
  sourceUrl?: string;
  tab: string;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(TAB_STORE)) {
        db.createObjectStore(TAB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listSongs(): Promise<Song[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const songs = (req.result as Song[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(songs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Song | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveSong(song: Song): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(song);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSong(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listTabs(): Promise<GuitarTab[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TAB_STORE, "readonly");
    const req = tx.objectStore(TAB_STORE).getAll();
    req.onsuccess = () => {
      const tabs = (req.result as GuitarTab[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(tabs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getTab(id: string): Promise<GuitarTab | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(TAB_STORE, "readonly").objectStore(TAB_STORE).get(id);
    req.onsuccess = () => resolve(req.result as GuitarTab | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveTab(tab: GuitarTab): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TAB_STORE, "readwrite");
    tx.objectStore(TAB_STORE).put(tab);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteTab(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TAB_STORE, "readwrite");
    tx.objectStore(TAB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
