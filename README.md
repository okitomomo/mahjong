# 麻雀戦績管理システム

React + Firebase Firestoreを使用した麻雀の戦績管理Webアプリケーションです。

## 機能

- 部屋の作成と管理
- メンバー管理（Cookie-based認証）
- 半荘のスコア記録
- ウマ・オカ・ヤキトリ・チップの計算
- リアルタイムスコアボード
- 部屋ごとのルール設定

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

詳細は [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) を参照してください。

1. Firebaseプロジェクトを作成
2. Firestoreを有効化
3. `.env`ファイルにFirebase設定を記述

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Firestoreセキュリティルールのデプロイ

Firebase CLIをインストール:

```bash
npm install -g firebase-tools
```

Firebaseにログイン:

```bash
firebase login
```

プロジェクトIDを設定:

```bash
# .firebaserc.exampleをコピー
cp .firebaserc.example .firebaserc
```

`.firebaserc`を編集して実際のプロジェクトIDを設定:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

セキュリティルールをデプロイ:

```bash
firebase deploy --only firestore:rules
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### テスト用のユーザーID指定

開発環境では、URLパラメータでユーザーIDを指定できます（テストやデバッグに便利）：

```
http://localhost:5173/?userId=550e8400-e29b-41d4-a716-446655440000#/
```

複数のブラウザやタブで異なるユーザーとして動作確認する場合：

```
# ユーザー1
http://localhost:5173/?userId=550e8400-e29b-41d4-a716-446655440001#/rooms

# ユーザー2
http://localhost:5173/?userId=550e8400-e29b-41d4-a716-446655440002#/rooms/abc123
```

**重要**: HashRouterを使用しているため、`?userId=xxx`は`#`の前に配置してください。

**注意**: この機能は開発環境（`npm run dev`）でのみ有効です。本番ビルドでは無効化されます。

### ビルド

```bash
npm run build
```

### テストの実行

```bash
npm test
```

### プロパティベーステストの実行

```bash
npm test -- --run
```

## デプロイ

### Firebase Hostingへのデプロイ

```bash
npm run build
firebase deploy --only hosting
```

### セキュリティルールのみデプロイ

```bash
firebase deploy --only firestore:rules
```

## プロジェクト構造

```
.
├── src/
│   ├── components/      # Reactコンポーネント
│   ├── hooks/          # カスタムフック
│   ├── services/       # Firestore操作
│   ├── utils/          # ユーティリティ関数
│   ├── models/         # データモデル
│   ├── pages/          # ページコンポーネント
│   └── routes/         # ルーティング設定
├── firestore.rules     # Firestoreセキュリティルール
├── firebase.json       # Firebase設定
└── .firebaserc         # Firebaseプロジェクト設定
```

## 技術スタック

- **フロントエンド**: React 19.2, React Router 6.30
- **スタイリング**: Tailwind CSS 3.4
- **ビルドツール**: Vite 5.2
- **データベース**: Firebase Firestore
- **テスト**: Vitest, fast-check (Property-Based Testing)

## ライセンス

MIT
