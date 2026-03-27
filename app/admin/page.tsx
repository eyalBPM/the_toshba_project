import Link from 'next/link';
import { prisma } from '@/db/prisma';

async function getDashboardCounts() {
  const [pendingRevisions, pendingMinorChanges, pendingImages, totalUsers] =
    await Promise.all([
      prisma.articleRevision.count({ where: { status: 'Pending' } }),
      prisma.minorChangeRequest.count({ where: { status: 'Pending' } }),
      prisma.image.count({ where: { status: 'PendingApproval' } }),
      prisma.user.count(),
    ]);
  return { pendingRevisions, pendingMinorChanges, pendingImages, totalUsers };
}

export default async function AdminDashboard() {
  const counts = await getDashboardCounts();

  const cards = [
    { label: 'גרסאות ממתינות', count: counts.pendingRevisions, href: '/admin/revisions' },
    { label: 'שינויים מינוריים', count: counts.pendingMinorChanges, href: '/admin/minor-changes' },
    { label: 'תמונות ממתינות', count: counts.pendingImages, href: '/admin/images' },
    { label: 'סה"כ משתמשים', count: counts.totalUsers, href: '/admin/users' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">לוח בקרה</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:bg-gray-50"
          >
            <p className="text-3xl font-bold text-blue-600">{card.count}</p>
            <p className="mt-1 text-sm text-gray-600">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
