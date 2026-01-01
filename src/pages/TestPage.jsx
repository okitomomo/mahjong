/**
 * 得点計算テストページ
 * Score calculation test page
 */

import React from 'react';
import { ScoreTestTool } from '../components/ScoreTestTool.jsx';
import { Layout } from '../components/Layout.jsx';

export function TestPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            得点計算テストツール
          </h1>
          <p className="text-gray-600">
            4人分のブラウザを開かずに、得点計算をテストできます
          </p>
        </div>
        
        <ScoreTestTool />
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">使い方</h2>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• 「ランダムゲーム生成」で自動的にテストデータを作成</li>
            <li>• 各シナリオボタンで典型的なケースをテスト</li>
            <li>• 素点を直接編集して計算結果を確認</li>
            <li>• 設定を変更して異なるルールでの計算をテスト</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}