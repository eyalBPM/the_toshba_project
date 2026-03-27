import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth-utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'לוח בקרה' },
  { href: '/admin/revisions', label: 'גרסאות' },
  { href: '/admin/minor-changes', label: 'שינויים מינוריים' },
  { href: '/admin/images', label: 'תמונות' },
  { href: '/admin/users', label: 'משתמשים' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'Admin' && user.role !== 'Senior')) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      <aside className="w-48 shrink-0 border-l border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-4 text-sm font-bold text-gray-700">ניהול</h2>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
