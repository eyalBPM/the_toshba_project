'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PrintListSettings {
  includeExplanations?: boolean;
  includeClusters?: boolean;
  articleIds?: string[];
  ordering?: 'custom' | 'creation' | 'approval';
}

interface Article {
  id: string;
  title: string;
  slug: string;
}

interface PrintListFormProps {
  printListId: string;
  initialSettings: PrintListSettings;
}

export function PrintListForm({ printListId, initialSettings }: PrintListFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<PrintListSettings>(initialSettings);
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/articles?search=${encodeURIComponent(search)}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => setArticles(json.data ?? []));
  }, [search]);

  const selectedIds = new Set(settings.articleIds ?? []);

  function toggleArticle(id: string) {
    const current = settings.articleIds ?? [];
    const next = selectedIds.has(id)
      ? current.filter((aid) => aid !== id)
      : [...current, id];
    setSettings({ ...settings, articleIds: next });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/print-lists/${printListId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Settings toggles */}
      <div className="space-y-2 rounded-md border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeExplanations ?? false}
            onChange={(e) =>
              setSettings({ ...settings, includeExplanations: e.target.checked })
            }
          />
          כלול פסקאות הסבר
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeClusters ?? false}
            onChange={(e) =>
              setSettings({ ...settings, includeClusters: e.target.checked })
            }
          />
          כלול חוות דעת
        </label>
        <div>
          <label className="text-sm font-medium text-gray-700">סדר:</label>
          <select
            className="mr-2 rounded border border-gray-300 px-2 py-1 text-sm"
            value={settings.ordering ?? 'custom'}
            onChange={(e) =>
              setSettings({
                ...settings,
                ordering: e.target.value as PrintListSettings['ordering'],
              })
            }
          >
            <option value="custom">מותאם אישית</option>
            <option value="creation">תאריך יצירה</option>
            <option value="approval">תאריך אישור</option>
          </select>
        </div>
      </div>

      {/* Article selection */}
      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-700">בחירת ערכים</h3>
        <input
          type="text"
          className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="חיפוש ערכים..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {articles.map((article) => (
            <label
              key={article.id}
              className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(article.id)}
                onChange={() => toggleArticle(article.id)}
              />
              {article.title}
            </label>
          ))}
        </div>
        {(settings.articleIds?.length ?? 0) > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {settings.articleIds?.length} ערכים נבחרו
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'שומר...' : saved ? '✓ נשמר' : 'שמור'}
        </button>
        <a
          href={`/print-lists/${printListId}/print`}
          target="_blank"
          className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          תצוגת הדפסה
        </a>
      </div>
    </div>
  );
}
