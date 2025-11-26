/**
 * レイアウトコンポーネント
 * Layout component with header
 */

import { Header } from './Header.jsx';

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
}
