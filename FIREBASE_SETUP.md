# Firebase セットアップガイド

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: mahjong-score-management）
4. Google Analyticsの設定（任意）
5. プロジェクトを作成

## 2. Firestoreの有効化

1. Firebase Consoleで作成したプロジェクトを開く
2. 左メニューから「Firestore Database」を選択
3. 「データベースの作成」をクリック
4. ロケーションを選択（例: asia-northeast1 (Tokyo)）
5. セキュリティルールを選択:
   - 開発中: 「テストモードで開始」を選択
   - 本番環境: 「本番モードで開始」を選択し、後でルールを設定

## 3. Firebase設定の取得

1. Firebase Consoleのプロジェクト設定（歯車アイコン）を開く
2. 「全般」タブを選択
3. 「マイアプリ」セクションで「ウェブアプリ」（</>アイコン）を選択
4. アプリのニックネームを入力（例: mahjong-web-app）
5. 「アプリを登録」をクリック
6. 表示されるFirebase SDKの設定をコピー

## 4. 環境変数の設定

1. プロジェクトルートの `.env` ファイルを開く
2. Firebase設定の値を以下のように設定:

```env
VITE_FIREBASE_API_KEY=あなたのAPIキー
VITE_FIREBASE_AUTH_DOMAIN=あなたのプロジェクトID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=あなたのプロジェクトID
VITE_FIREBASE_STORAGE_BUCKET=あなたのプロジェクトID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=あなたのセンダーID
VITE_FIREBASE_APP_ID=あなたのアプリID
```

## 5. Firestoreセキュリティルールの設定

### 方法1: Firebase CLIを使用（推奨）

1. Firebase CLIをインストール:
```bash
npm install -g firebase-tools
```

2. Firebaseにログイン:
```bash
firebase login
```

3. `.firebaserc`ファイルを作成してプロジェクトIDを設定:
```bash
# .firebaserc.exampleをコピー
cp .firebaserc.example .firebaserc
```

`.firebaserc`を編集:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

**注意**: `.firebaserc`は`.gitignore`に含まれているため、Gitにコミットされません。

4. セキュリティルールをデプロイ:
```bash
firebase deploy --only firestore:rules
```

### 方法2: Firebase Consoleから手動設定

Firebase Consoleの「Firestore Database」→「ルール」タブで以下のルールを設定:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 部屋は誰でも読み書き可能
    match /rooms/{roomId} {
      allow read, write: if true;
      
      // メンバーは誰でも読み書き可能
      match /members/{memberId} {
        allow read, write: if true;
      }
      
      // 半荘記録は誰でも読み書き可能
      match /games/{gameId} {
        allow read, write: if true;
      }
    }
  }
}
```

**注意**: このルールは認証なしで全てのユーザーがデータにアクセスできます。本番環境では適切な制限を追加してください。

### セキュリティルールの説明

- `allow read, write: if true;` - 全てのユーザーに読み書き権限を付与
- 本システムは認証機能を持たないため、全てのデータが公開されます
- 本番環境では以下のような制限を検討してください：
  - IPアドレス制限
  - レート制限
  - データサイズ制限
  - 特定のフィールドのみ書き込み可能にする

## 6. 動作確認

1. 開発サーバーを起動: `npm run dev`
2. ブラウザでアプリケーションを開く
3. Firebase Consoleでデータが正しく保存されているか確認

## トラブルシューティング

### エラー: "Firebase: Error (auth/invalid-api-key)"
- `.env` ファイルのAPIキーが正しいか確認
- 開発サーバーを再起動

### エラー: "Missing or insufficient permissions"
- Firestoreセキュリティルールが正しく設定されているか確認
- ルールの公開を忘れていないか確認

### データが保存されない
- Firebase Consoleでプロジェクトが正しく選択されているか確認
- ブラウザのコンソールでエラーメッセージを確認
- ネットワーク接続を確認
