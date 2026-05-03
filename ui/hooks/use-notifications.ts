'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

export interface NotificationItem {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface ListPage {
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
}

interface ListData {
  pages: ListPage[];
  pageParams: (string | undefined)[];
}

const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;
const LIST_KEY = ['notifications', 'list'] as const;

const POLL_INTERVAL_MS = 600_000;

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications?unread=true');
  if (!res.ok) throw new Error('Failed to fetch unread count');
  const json = await res.json();
  return (json.data?.unreadCount as number | undefined) ?? 0;
}

async function fetchPage(cursor?: string): Promise<ListPage> {
  const params = new URLSearchParams({ limit: '20' });
  if (cursor) params.set('cursor', cursor);
  const res = await fetch(`/api/notifications?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const json = await res.json();
  return json.data as ListPage;
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationsList(initialPage?: ListPage) {
  return useInfiniteQuery({
    queryKey: LIST_KEY,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [undefined] }
      : undefined,
  });
}

interface MutationContext {
  prevCount: number | undefined;
  prevList: ListData | undefined;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string | undefined, MutationContext>({
    mutationFn: async (notificationId) => {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationId ? { notificationId } : {}),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY });
      await queryClient.cancelQueries({ queryKey: LIST_KEY });

      const prevCount = queryClient.getQueryData<number>(UNREAD_COUNT_KEY);
      const prevList = queryClient.getQueryData<ListData>(LIST_KEY);

      queryClient.setQueryData<ListData>(LIST_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              !notificationId || n.id === notificationId ? { ...n, read: true } : n,
            ),
          })),
        };
      });

      if (typeof prevCount === 'number') {
        if (notificationId) {
          const wasUnread = prevList
            ? prevList.pages.some((p) =>
                p.notifications.some((n) => n.id === notificationId && !n.read),
              )
            : true;
          if (wasUnread) {
            queryClient.setQueryData(UNREAD_COUNT_KEY, Math.max(0, prevCount - 1));
          }
        } else {
          queryClient.setQueryData(UNREAD_COUNT_KEY, 0);
        }
      }

      return { prevCount, prevList };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.prevCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, ctx.prevCount);
      }
      if (ctx.prevList !== undefined) {
        queryClient.setQueryData(LIST_KEY, ctx.prevList);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}
