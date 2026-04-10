import { useEffect } from 'react';

export function useBeforeUnload(active: boolean) {
  // Native beforeunload: covers refresh, URL bar change, tab close
  useEffect(() => {
    if (!active) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);

  // Intercept client-side navigation (Next.js <Link> clicks)
  useEffect(() => {
    if (!active) return;

    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      // Don't interfere with new-tab navigations
      if (anchor.target === '_blank' || e.metaKey || e.ctrlKey) return;

      // eslint-disable-next-line no-alert
      const confirmed = window.confirm('יש שינויים שלא נשמרו. האם לעזוב את הדף?');
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [active]);
}
