interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

interface TechNewsFeedProps {
  items: NewsItem[];
}

export function TechNewsFeed({ items }: TechNewsFeedProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tech News</h2>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No news items available
          </div>
        ) : (
          items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.summary}</p>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(item.publishedAt).toLocaleDateString()}
              </span>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
