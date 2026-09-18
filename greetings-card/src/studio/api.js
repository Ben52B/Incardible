// Thin client for the API calls the studio needs. All requests are keyed by the
// customisation uuid (the capability the studio was opened with); the API
// resolves guest vs. logged-in storage itself.
import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const token = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
const isAuthed = () => !!token();
const authHeaders = () => (token() ? { 'x-access-token': token() } : {});

export const absUrl = (u) => {
  if (!u) return null;
  const s = String(u).replace(/\\/g, '/');
  return /^https?:\/\//i.test(s) ? s : `${BASE}/${s.replace(/^\/+/, '')}`;
};

export async function fetchCard(cardUuid) {
  const r = await axios.get(`${BASE}/api/cards/get/data/game/${cardUuid}`);
  return r.data.data;
}

export async function fetchTemplates() {
  const r = await axios.get(`${BASE}/api/templates`);
  return r.data.data;
}

export async function fetchMusic() {
  const r = await axios.get(`${BASE}/api/music`);
  return (r.data || []).map((m) => ({ ...m, url: absUrl(m.url) }));
}

/** Create-or-load the customisation for this studio session (guest or user). */
export async function ensureCustomization({ cardUuid, uuid, user }) {
  const r = await axios.post(`${BASE}/api/cards/upload-card-id`, {
    uuid: cardUuid,
    userCardId: uuid,
    email: user?.email || null,
    userId: user?._id || null,
    isAuthenticated: !!(user && isAuthed()),
  }, { headers: authHeaders() });
  return r.data.data;
}

export async function saveArData(uuid, data) {
  const r = await axios.post(`${BASE}/api/cards/upload-ar-data`, {
    uuid, data, isAuthenticated: isAuthed(),
  }, { headers: authHeaders() });
  return r.data.data;
}

export async function uploadPhoto(uuid, index, file, onProgress) {
  const fd = new FormData();
  fd.append('uuid', uuid);
  fd.append('index', String(index));
  fd.append('isAuthenticated', String(isAuthed()));
  fd.append('image', file, file.name || `photo-${index}.jpg`);
  const r = await axios.post(`${BASE}/api/cards/upload-image`, fd, {
    headers: authHeaders(),
    onUploadProgress: (e) => onProgress && e.total && onProgress(e.loaded / e.total),
  });
  return absUrl(r.data.data?.[`templateImage${index}`] || r.data.data?.url);
}

export async function uploadVideo(uuid, file, onProgress) {
  const fd = new FormData();
  fd.append('uuid', uuid);
  fd.append('isAuthenticated', String(isAuthed()));
  fd.append('video', file, file.name || 'video.mp4');
  const r = await axios.post(`${BASE}/api/cards/upload-template-video`, fd, {
    headers: authHeaders(),
    onUploadProgress: (e) => onProgress && e.total && onProgress(e.loaded / e.total),
  });
  const d = r.data.data || {};
  return absUrl(d.video || d.templateVideo || d.url);
}

export async function removeMedia(uuid, { isImage, index = 0 }) {
  await axios.post(`${BASE}/api/user/edit-data`, {
    uuid, isImage: isImage ? 1 : 0, index, isAuthenticated: isAuthed(),
  }, { headers: authHeaders() });
}

/** Print artwork for the inside of the card (A4 landscape PNG). Logged-in only. */
export async function uploadPrintArtwork(uuid, blob) {
  const fd = new FormData();
  fd.append('uuid', uuid);
  fd.append('image', blob, 'inside.png');
  const r = await axios.post(`${BASE}/api/cards/upload-text-ss`, fd, { headers: authHeaders() });
  return r.data.data;
}

export async function fetchDraft(uuid) {
  const r = await axios.get(`${BASE}/api/user/ar-experience/get/data/${uuid}`);
  return r.data.data;
}
