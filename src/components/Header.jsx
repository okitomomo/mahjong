/**
 * ヘッダーコンポーネント（モバイル専用）
 * Header navigation component (Mobile-first)
 */

import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  
  // ホームページではヘッダーを表示しない
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-base font-bold text-gray-900 active:text-blue-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="truncate">麻雀戦績</span>
          </Link>
          
          <nav className="flex items-center">
            <Link
              to="/rooms"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/rooms' || location.pathname.startsWith('/rooms/')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 active:bg-gray-100'
              }`}
            >
              部屋一覧
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
