const UNREAD_COUNT_EVENT = 'notifications:unread-count-changed';

export interface UnreadCountChangedDetail {
  unreadCount: number;
}

export function emitUnreadCount(unreadCount: number): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<UnreadCountChangedDetail>(UNREAD_COUNT_EVENT, {
      detail: { unreadCount },
    }),
  );
}

export function subscribeUnreadCount(
  handler: (unreadCount: number) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<UnreadCountChangedDetail>).detail;
    if (detail && typeof detail.unreadCount === 'number') {
      handler(detail.unreadCount);
    }
  };
  window.addEventListener(UNREAD_COUNT_EVENT, listener);
  return () => window.removeEventListener(UNREAD_COUNT_EVENT, listener);
}
