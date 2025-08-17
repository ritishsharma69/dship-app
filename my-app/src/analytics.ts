type EventPayload = Record<string, unknown>;

// Basic de-duplication to avoid duplicate events in React 18 StrictMode (effects run twice in dev)
const RECENT_MS = 2000; // 2s window is enough to swallow duplicate mounts/clicks
const recent = new Map<string, number>();

const send = (name: string, payload: EventPayload = {}) => {
  const key = `${name}:${JSON.stringify(payload)}`;
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < RECENT_MS) return; // swallow duplicate
  recent.set(key, now);

  // GTM/GA4 friendly dataLayer push, with console fallback
  if ((window as any).dataLayer && Array.isArray((window as any).dataLayer)) {
    (window as any).dataLayer.push({ event: name, ...payload });
  } else {
    console.log('[analytics]', name, payload);
  }
};

export const events = {
  view_item: (data: { id: string; title: string; price: number }) =>
    send('view_item', { item_id: data.id, item_name: data.title, price: data.price }),

  // Keep event names backwards-compatible (e.g., 'begin_checkout'), but de-dupe at source
  cta_click: (data: { id: string; step: 'add_to_cart' | 'begin_checkout' }) =>
    send(data.step, { item_id: data.id }),

  scroll_depth: (data: { percent: number }) => send('scroll_depth', data),

  video_play: (data: { id: string }) => send('video_play', data),
};

