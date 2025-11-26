/**
 * 404 Not Foundページ（モバイル専用）
 * 404 Not Found page (Mobile-first)
 */

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">
          ページが見つかりません
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/"
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg active:bg-blue-700 transition-colors shadow-sm"
          >
            ホームへ戻る
          </Link>
          <Link
            to="/rooms"
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg active:bg-gray-300 transition-colors"
          >
            部屋一覧へ
          </Link>
        </div>
      </div>
    </div>
  );
}
