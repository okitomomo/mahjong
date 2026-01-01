import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoute from './routes/AppRoutes.jsx';
import './styles/input.css';

// 開発環境でのみブラウザテスト関数を読み込み
if (import.meta.env.DEV) {
  import('./utils/browserTest.js');
}

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <AppRoute />
    </React.StrictMode>
);