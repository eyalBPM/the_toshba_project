import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { findPrintListById } from '@/db/print-list-repository';
import { prisma } from '@/db/prisma';
import { listResponsesByRevision } from '@/db/opinion-repository';
import { PrintListPrintView } from '@/ui/components/print-list-print-view';

interface PrintSettings {
  includeExplanations?: boolean;
  includeClusters?: boolean;
  articleIds?: string[];
  ordering?: 'custom' | 'creation' | 'approval';
}

export default async function PrintListPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [currentUser, list] = await Promise.all([
    getCurrentUser(),
    findPrintListById(id),
  ]);

  if (!currentUser) redirect(`/login?callbackUrl=/print-lists/${id}/print`);
  if (!list) notFound();
  if (list.userId !== currentUser.id) notFound();

  const settings = (list.settings as PrintSettings) ?? {};
  const articleIds = settings.articleIds ?? [];

  if (articleIds.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8" dir="rtl">
        <p className="text-gray-500">לא נבחרו ערכים להדפסה.</p>
      </main>
    );
  }

  // Fetch articles with their current revision content
  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    select: {
      id: true,
      title: true,
      currentRevisionId: true,
      createdAt: true,
    },
  });

  // Order articles based on settings
  let orderedArticles = articles;
  if (settings.ordering === 'custom') {
    const idOrder = new Map(articleIds.map((aid, i) => [aid, i]));
    orderedArticles = [...articles].sort(
      (a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0),
    );
  } else if (settings.ordering === 'creation') {
    orderedArticles = [...articles].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  // Fetch content for each article's current revision
  const articleData = await Promise.all(
    orderedArticles.map(async (article) => {
      let content: unknown = null;
      let opinions: Array<{
        id: string;
        content: unknown;
        user: { id: string; name: string };
        cluster: { id: string; title: string; visibility: string; ownerUserId: string };
      }> = [];

      if (article.currentRevisionId) {
        const revision = await prisma.articleRevision.findUnique({
          where: { id: article.currentRevisionId },
          select: { content: true },
        });
        content = revision?.content;

        if (settings.includeClusters) {
          opinions = await listResponsesByRevision(
            article.currentRevisionId,
            currentUser.id,
          );
        }
      }

      return {
        id: article.id,
        title: article.title,
        content,
        opinions: opinions.map((o) => ({
          id: o.id,
          content: o.content,
          user: { name: o.user.name },
          cluster: { title: o.cluster.title },
        })),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PrintListPrintView
        articles={articleData}
        includeClusters={settings.includeClusters ?? false}
      />
    </main>
  );
}
