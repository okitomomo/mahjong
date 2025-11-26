/**
 * ローディング表示コンポーネント（モバイル専用）
 * Loading indicator component (Mobile-first)
 */

/**
 * ローディングスピナー
 */
export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizes[size]} border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
  );
}

/**
 * ページ全体のローディング表示
 */
export function LoadingPage({ message = '読み込み中...' }) {
  return (
    <div className="bg-gray-50 flex items-center justify-center py-20">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

/**
 * インラインローディング表示
 */
export function LoadingInline({ message = '読み込み中...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}
