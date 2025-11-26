/**
 * パンくずリストコンポーネント（モバイル専用）
 * Breadcrumb navigation component (Mobile-first)
 */

import { Link } from 'react-router-dom';

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} label - 表示ラベル
 * @property {string} [path] - リンク先パス（最後の項目は省略可）
 */

/**
 * パンくずリストコンポーネント
 * @param {Object} props
 * @param {BreadcrumbItem[]} props.items - パンくずリストの項目
 */
export function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center overflow-x-auto text-xs text-gray-600 mb-3 pb-1" aria-label="パンくずリスト">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center flex-shrink-0">
            {index > 0 && (
              <svg
                className="w-3 h-3 mx-1.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            
            {isLast || !item.path ? (
              <span className="text-gray-900 font-medium truncate max-w-[120px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="text-blue-600 active:text-blue-700 truncate max-w-[100px]"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
