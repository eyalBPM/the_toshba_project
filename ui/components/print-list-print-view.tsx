'use client';

import { ContentRenderer } from './content-renderer';

interface ArticleData {
  id: string;
  title: string;
  content: unknown;
  opinions?: Array<{
    id: string;
    content: unknown;
    user: { name: string };
    cluster: { title: string };
  }>;
}

interface PrintListPrintViewProps {
  articles: ArticleData[];
  includeClusters: boolean;
}

export function PrintListPrintView({
  articles,
  includeClusters,
}: PrintListPrintViewProps) {
  return (
    <div className="print-view" dir="rtl">
      <div className="no-print mb-4">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          הדפס
        </button>
      </div>
      <style>{`
        @media print {
          .print-view .article-section { page-break-after: always; }
          .print-view .article-section:last-child { page-break-after: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>

      {articles.map((article, index) => (
        <div key={article.id} className="article-section mb-8">
          <h1 className="mb-4 text-2xl font-bold">{article.title}</h1>
          <div className="prose prose-sm max-w-none">
            <ContentRenderer content={article.content} />
          </div>

          {includeClusters && article.opinions && article.opinions.length > 0 && (
            <div className="mt-6 border-t border-gray-300 pt-4">
              <h2 className="mb-3 text-lg font-semibold">חוות דעת</h2>
              {article.opinions.map((opinion) => (
                <div key={opinion.id} className="mb-4">
                  <p className="text-sm font-medium text-gray-600">
                    {opinion.user.name} · {opinion.cluster.title}
                  </p>
                  <div className="mt-1 prose prose-sm max-w-none">
                    <ContentRenderer content={opinion.content} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {index < articles.length - 1 && (
            <hr className="mt-8 border-gray-200" />
          )}
        </div>
      ))}
    </div>
  );
}
