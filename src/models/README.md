# データモデル (Data Models)

このディレクトリには、麻雀戦績管理システムのデータモデルとFirestoreコンバーターが含まれています。

This directory contains data models and Firestore converters for the Mahjong Score Management System.

## ファイル構成 (File Structure)

- `models.d.ts` - TypeScript型定義 (TypeScript type definitions)
- `converters.js` - Firestoreコンバーター (Firestore converters)
- `constants.js` - システム定数 (System constants)
- `validation.js` - バリデーション関数 (Validation functions)
- `index.js` - エクスポート (Exports)

## 使用例 (Usage Examples)

### 部屋の作成 (Creating a Room)

```javascript
import { createNewRoom, roomConverter } from './models';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// 新しい部屋を作成
const newRoom = createNewRoom();

// Firestoreに保存
const roomsRef = collection(db, 'rooms').withConverter(roomConverter);
const docRef = await addDoc(roomsRef, newRoom);
console.log('Room created with ID:', docRef.id);
```

### メンバーの追加 (Adding a Member)

```javascript
import { createNewMember, memberConverter } from './models';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// 新しいメンバーを作成
const newMember = createNewMember('user123', 'room456', 'プレイヤー名');

// Firestoreに保存
const membersRef = collection(db, 'rooms/room456/members').withConverter(memberConverter);
const docRef = await addDoc(membersRef, newMember);
console.log('Member added with ID:', docRef.id);
```

### 半荘の記録 (Recording a Game)

```javascript
import { createNewGame, gameConverter } from './models';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './config/firebase';

// 半荘結果を作成
const results = [
  {
    memberId: 'member1',
    memberName: 'プレイヤー1',
    rawScore: 40000,
    rank: 1,
    uma: 25,
    oka: 30,
    chipCount: 0,
    chipScore: 0,
    finalScore: 55,
    finalScoreWithChip: 55,
  },
  // ... 他のプレイヤー
];

const newGame = createNewGame('room456', 1, 4, results);

// Firestoreに保存
const gamesRef = collection(db, 'rooms/room456/games').withConverter(gameConverter);
const docRef = await addDoc(gamesRef, newGame);
console.log('Game recorded with ID:', docRef.id);
```

### バリデーション (Validation)

```javascript
import { isValidPlayerCount, isValidScore, canAddMember } from './models';

// プレイヤー数のチェック
if (!isValidPlayerCount(playerCount)) {
  console.error('プレイヤー数は3人または4人である必要があります');
}

// 得点のチェック
if (!isValidScore(score)) {
  console.error('得点は有効な数値である必要があります');
}

// メンバー追加可能かチェック
if (!canAddMember(currentMemberCount)) {
  console.error('部屋は最大10人までです');
}
```

## 型定義 (Type Definitions)

TypeScript型定義は `src/types/models.d.ts` に定義されています。
JSDocコメントを使用してJavaScriptファイルでも型チェックが可能です。

TypeScript type definitions are in `src/types/models.d.ts`.
Type checking is available in JavaScript files using JSDoc comments.

```javascript
/**
 * @typedef {import('./types/models').Room} Room
 * @typedef {import('./types/models').Member} Member
 * @typedef {import('./types/models').Game} Game
 */

/**
 * @param {Room} room
 * @returns {string}
 */
function getRoomName(room) {
  return room.name;
}
```

## デフォルト設定 (Default Settings)

システムのデフォルト設定は `constants.js` で定義されています：

- ウマ: トップ-ビリ間 40、2-3位間 10
- オカ: 開始点 25000、返し点 30000
- ヤキトリ: 無効、ペナルティ -30
- チップ: 無効、初期枚数 0、1枚あたり 5点
- 最大メンバー数: 10人

Default settings are defined in `constants.js`:

- Uma: Top-Bottom 40, Middle Pair 10
- Oka: Start Points 25000, Return Points 30000
- Yakitori: Disabled, Penalty -30
- Chip: Disabled, Initial Count 0, Points Per Chip 5
- Max Members: 10
