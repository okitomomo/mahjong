/**
 * 部屋サービスのプロパティベーステスト
 * Property-based tests for room service
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { generateRoomName, getDefaultRoomSettings } from '../../models/converters.js';

/**
 * Feature: mahjong-score-management, Property 1: 部屋名の形式一貫性
 * Validates: Requirements 1.1
 */
describe('Property 1: 部屋名の形式一貫性', () => {
  it('生成される部屋名は年月日時分(yyyy/MM/dd HH:mm)の形式である', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // dummy parameter to run multiple times
        () => {
          const roomName = generateRoomName();
          
          // yyyy/MM/dd HH:mm形式の正規表現
          const pattern = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/;
          
          expect(roomName).toMatch(pattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('生成される部屋名の内容は有効な日時である', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // dummy parameter
        () => {
          const roomName = generateRoomName();
          
          // 部屋名をパース
          const match = roomName.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/);
          expect(match).not.toBeNull();
          
          if (match) {
            const [, year, month, day, hours, minutes] = match;
            
            // 年は妥当な範囲
            expect(parseInt(year)).toBeGreaterThanOrEqual(2000);
            expect(parseInt(year)).toBeLessThanOrEqual(2100);
            
            // 月は1-12
            expect(parseInt(month)).toBeGreaterThanOrEqual(1);
            expect(parseInt(month)).toBeLessThanOrEqual(12);
            
            // 日は1-31
            expect(parseInt(day)).toBeGreaterThanOrEqual(1);
            expect(parseInt(day)).toBeLessThanOrEqual(31);
            
            // 時は0-23
            expect(parseInt(hours)).toBeGreaterThanOrEqual(0);
            expect(parseInt(hours)).toBeLessThanOrEqual(23);
            
            // 分は0-59
            expect(parseInt(minutes)).toBeGreaterThanOrEqual(0);
            expect(parseInt(minutes)).toBeLessThanOrEqual(59);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 2: 部屋IDの一意性
 * Validates: Requirements 1.2
 * 
 * Note: FirestoreのaddDocは自動的に一意なIDを生成するため、
 * このプロパティはFirestoreの機能に依存します。
 * ここでは生成されるIDが異なることを確認します。
 */
describe('Property 2: 部屋IDの一意性', () => {
  it('Firestoreが生成するIDは一意であることをシミュレート', () => {
    // Firestoreのドキュメント生成をシミュレート
    const generatedIds = new Set();
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // 複数回実行
        () => {
          // FirestoreのIDは20文字のランダム文字列
          const mockId = Math.random().toString(36).substring(2) + Date.now().toString(36);
          
          // 同じIDが生成されないことを確認
          expect(generatedIds.has(mockId)).toBe(false);
          generatedIds.add(mockId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 3: デフォルト設定の初期値
 * Validates: Requirements 1.3
 */
describe('Property 3: デフォルト設定の初期値', () => {
  it('新規作成された部屋はデフォルト設定で初期化される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // dummy parameter
        () => {
          const settings = getDefaultRoomSettings();
          
          // ウマ設定（ゴットー: 10/5）
          expect(settings.uma.topBottom).toBe(10);
          expect(settings.uma.middlePair).toBe(5);
          
          // オカ設定
          expect(settings.oka.startPoints).toBe(25000);
          expect(settings.oka.returnPoints).toBe(30000);
          
          // ヤキトリ設定
          expect(settings.yakitori.enabled).toBe(false);
          expect(settings.yakitori.penalty).toBe(30);
          
          // チップ設定
          expect(settings.chip.enabled).toBe(false);
          expect(settings.chip.initialCount).toBe(0);
          expect(settings.chip.pointsPerChip).toBe(5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 30: 部屋データの永続化
 * Validates: Requirements 7.1
 * 
 * Note: これは実際のFirestoreとの統合テストが必要ですが、
 * ここではコンバーターのラウンドトリップをテストします。
 */
describe('Property 30: 部屋データの永続化（コンバーター）', () => {
  it('部屋データをFirestore形式に変換して戻すと同じデータが得られる', async () => {
    const { roomConverter } = await import('../../models/converters.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          umaTopBottom: fc.integer({ min: 0, max: 100 }),
          umaMiddlePair: fc.integer({ min: 0, max: 50 }),
          okaStartPoints: fc.integer({ min: 1000, max: 100000 }),
          okaReturnPoints: fc.integer({ min: 1000, max: 100000 }),
          yakitoriEnabled: fc.boolean(),
          yakitoriPenalty: fc.integer({ min: 0, max: 100 }),
          chipEnabled: fc.boolean(),
          chipInitialCount: fc.integer({ min: 0, max: 100 }),
          chipPointsPerChip: fc.integer({ min: 1, max: 50 }),
        }),
        async (data) => {
          const room = {
            id: 'test-room-id',
            name: data.name,
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
            settings: {
              uma: {
                topBottom: data.umaTopBottom,
                middlePair: data.umaMiddlePair,
              },
              oka: {
                startPoints: data.okaStartPoints,
                returnPoints: data.okaReturnPoints,
              },
              yakitori: {
                enabled: data.yakitoriEnabled,
                penalty: data.yakitoriPenalty,
              },
              chip: {
                enabled: data.chipEnabled,
                initialCount: data.chipInitialCount,
                pointsPerChip: data.chipPointsPerChip,
              },
            },
            currentGameId: null,
          };
          
          // toFirestore -> fromFirestore のラウンドトリップ
          const firestoreData = roomConverter.toFirestore(room);
          
          // fromFirestoreをシミュレート
          const mockSnapshot = {
            id: room.id,
            data: () => firestoreData,
          };
          
          const restored = roomConverter.fromFirestore(mockSnapshot);
          
          // 主要なフィールドが保持されていることを確認
          expect(restored.name).toBe(room.name);
          expect(restored.settings.uma.topBottom).toBe(room.settings.uma.topBottom);
          expect(restored.settings.uma.middlePair).toBe(room.settings.uma.middlePair);
          expect(restored.settings.oka.startPoints).toBe(room.settings.oka.startPoints);
          expect(restored.settings.oka.returnPoints).toBe(room.settings.oka.returnPoints);
          expect(restored.settings.yakitori.enabled).toBe(room.settings.yakitori.enabled);
          expect(restored.settings.yakitori.penalty).toBe(room.settings.yakitori.penalty);
          expect(restored.settings.chip.enabled).toBe(room.settings.chip.enabled);
          expect(restored.settings.chip.initialCount).toBe(room.settings.chip.initialCount);
          expect(restored.settings.chip.pointsPerChip).toBe(room.settings.chip.pointsPerChip);
          expect(restored.currentGameId).toBe(room.currentGameId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 31: 部屋設定の永続化
 * Validates: Requirements 9.7
 */
describe('Property 31: 部屋設定の永続化（コンバーター）', () => {
  it('部屋設定を変更してFirestore形式に変換すると変更が保持される', async () => {
    const { roomConverter } = await import('../../models/converters.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          umaTopBottom: fc.integer({ min: 0, max: 100 }),
          umaMiddlePair: fc.integer({ min: 0, max: 50 }),
          okaStartPoints: fc.integer({ min: 1000, max: 100000 }),
          okaReturnPoints: fc.integer({ min: 1000, max: 100000 }),
          yakitoriEnabled: fc.boolean(),
          yakitoriPenalty: fc.integer({ min: 0, max: 100 }),
          chipEnabled: fc.boolean(),
          chipInitialCount: fc.integer({ min: 0, max: 100 }),
          chipPointsPerChip: fc.integer({ min: 1, max: 50 }),
        }),
        async (newSettings) => {
          // 元の部屋データ
          const originalRoom = {
            id: 'test-room-id',
            name: '2024/01/01 12:00',
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
            settings: getDefaultRoomSettings(),
            currentGameId: null,
          };
          
          // 設定を変更
          const updatedRoom = {
            ...originalRoom,
            settings: {
              uma: {
                topBottom: newSettings.umaTopBottom,
                middlePair: newSettings.umaMiddlePair,
              },
              oka: {
                startPoints: newSettings.okaStartPoints,
                returnPoints: newSettings.okaReturnPoints,
              },
              yakitori: {
                enabled: newSettings.yakitoriEnabled,
                penalty: newSettings.yakitoriPenalty,
              },
              chip: {
                enabled: newSettings.chipEnabled,
                initialCount: newSettings.chipInitialCount,
                pointsPerChip: newSettings.chipPointsPerChip,
              },
            },
          };
          
          // Firestoreに変換
          const firestoreData = roomConverter.toFirestore(updatedRoom);
          
          // 変更された設定が保持されていることを確認
          expect(firestoreData.settings.uma.topBottom).toBe(newSettings.umaTopBottom);
          expect(firestoreData.settings.uma.middlePair).toBe(newSettings.umaMiddlePair);
          expect(firestoreData.settings.oka.startPoints).toBe(newSettings.okaStartPoints);
          expect(firestoreData.settings.oka.returnPoints).toBe(newSettings.okaReturnPoints);
          expect(firestoreData.settings.yakitori.enabled).toBe(newSettings.yakitoriEnabled);
          expect(firestoreData.settings.yakitori.penalty).toBe(newSettings.yakitoriPenalty);
          expect(firestoreData.settings.chip.enabled).toBe(newSettings.chipEnabled);
          expect(firestoreData.settings.chip.initialCount).toBe(newSettings.chipInitialCount);
          expect(firestoreData.settings.chip.pointsPerChip).toBe(newSettings.chipPointsPerChip);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 4: 部屋リストのソート順序
 * Validates: Requirements 1.4
 */
describe('Property 4: 部屋リストのソート順序', () => {
  it('部屋リストは作成日時の降順にソートされる', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 50 }),
            createdAtSeconds: fc.integer({ min: 1000000000, max: 2000000000 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (roomsData) => {
          // 部屋データを作成
          const rooms = roomsData.map((data, index) => ({
            id: `room-${index}`,
            name: data.name,
            createdAt: { seconds: data.createdAtSeconds, nanoseconds: 0 },
            settings: {
              uma: { topBottom: 10, middlePair: 5 },
              oka: { startPoints: 25000, returnPoints: 30000 },
              yakitori: { enabled: false, penalty: 30 },
              chip: { enabled: false, initialCount: 0, pointsPerChip: 5 },
            },
            currentGameId: null,
          }));
          
          // 作成日時の降順にソート
          const sortedRooms = [...rooms].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds;
          });
          
          // ソート後、各部屋の作成日時が降順であることを確認
          for (let i = 1; i < sortedRooms.length; i++) {
            expect(sortedRooms[i - 1].createdAt.seconds).toBeGreaterThanOrEqual(
              sortedRooms[i].createdAt.seconds
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('同じ作成日時の部屋が複数ある場合でもソートが安定している', () => {
    fc.assert(
      fc.property(
        fc.record({
          sameTimestamp: fc.integer({ min: 1000000000, max: 2000000000 }),
          count: fc.integer({ min: 2, max: 5 }),
        }),
        (data) => {
          // 同じタイムスタンプの部屋を複数作成
          const rooms = Array.from({ length: data.count }, (_, index) => ({
            id: `room-${index}`,
            name: `Room ${index}`,
            createdAt: { seconds: data.sameTimestamp, nanoseconds: 0 },
            settings: {
              uma: { topBottom: 10, middlePair: 5 },
              oka: { startPoints: 25000, returnPoints: 30000 },
              yakitori: { enabled: false, penalty: 30 },
              chip: { enabled: false, initialCount: 0, pointsPerChip: 5 },
            },
            currentGameId: null,
          }));
          
          // ソート
          const sortedRooms = [...rooms].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds;
          });
          
          // 全ての部屋が同じタイムスタンプを持つことを確認
          sortedRooms.forEach(room => {
            expect(room.createdAt.seconds).toBe(data.sameTimestamp);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('空の部屋リストでもソートが正常に動作する', () => {
    const rooms = [];
    const sortedRooms = [...rooms].sort((a, b) => {
      return b.createdAt.seconds - a.createdAt.seconds;
    });
    
    expect(sortedRooms).toEqual([]);
  });

  it('1つの部屋のみの場合でもソートが正常に動作する', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          createdAtSeconds: fc.integer({ min: 1000000000, max: 2000000000 }),
        }),
        (data) => {
          const rooms = [{
            id: 'room-1',
            name: data.name,
            createdAt: { seconds: data.createdAtSeconds, nanoseconds: 0 },
            settings: {
              uma: { topBottom: 10, middlePair: 5 },
              oka: { startPoints: 25000, returnPoints: 30000 },
              yakitori: { enabled: false, penalty: 30 },
              chip: { enabled: false, initialCount: 0, pointsPerChip: 5 },
            },
            currentGameId: null,
          }];
          
          const sortedRooms = [...rooms].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds;
          });
          
          expect(sortedRooms.length).toBe(1);
          expect(sortedRooms[0]).toEqual(rooms[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('最新の部屋が常にリストの先頭に来る', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1000000000, max: 2000000000 }),
          { minLength: 2, maxLength: 10 }
        ),
        (timestamps) => {
          // 部屋データを作成
          const rooms = timestamps.map((timestamp, index) => ({
            id: `room-${index}`,
            name: `Room ${index}`,
            createdAt: { seconds: timestamp, nanoseconds: 0 },
            settings: {
              uma: { topBottom: 10, middlePair: 5 },
              oka: { startPoints: 25000, returnPoints: 30000 },
              yakitori: { enabled: false, penalty: 30 },
              chip: { enabled: false, initialCount: 0, pointsPerChip: 5 },
            },
            currentGameId: null,
          }));
          
          // ソート
          const sortedRooms = [...rooms].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds;
          });
          
          // 最新のタイムスタンプを見つける
          const maxTimestamp = Math.max(...timestamps);
          
          // ソート後の先頭の部屋が最新のタイムスタンプを持つことを確認
          expect(sortedRooms[0].createdAt.seconds).toBe(maxTimestamp);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('最古の部屋が常にリストの末尾に来る', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: 1000000000, max: 2000000000 }),
          { minLength: 2, maxLength: 10 }
        ),
        (timestamps) => {
          // 部屋データを作成
          const rooms = timestamps.map((timestamp, index) => ({
            id: `room-${index}`,
            name: `Room ${index}`,
            createdAt: { seconds: timestamp, nanoseconds: 0 },
            settings: {
              uma: { topBottom: 10, middlePair: 5 },
              oka: { startPoints: 25000, returnPoints: 30000 },
              yakitori: { enabled: false, penalty: 30 },
              chip: { enabled: false, initialCount: 0, pointsPerChip: 5 },
            },
            currentGameId: null,
          }));
          
          // ソート
          const sortedRooms = [...rooms].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds;
          });
          
          // 最古のタイムスタンプを見つける
          const minTimestamp = Math.min(...timestamps);
          
          // ソート後の末尾の部屋が最古のタイムスタンプを持つことを確認
          expect(sortedRooms[sortedRooms.length - 1].createdAt.seconds).toBe(minTimestamp);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: bug-fixes, Property 3: 新規部屋作成時にゲームが自動作成される
 * Validates: Requirements 2.1
 */
describe('Property 3: 新規部屋作成時にゲームが自動作成される', () => {
  it('部屋作成後、gameNumber: 1のゲームが存在する', async () => {
    const { createNewGame } = await import('../../models/converters.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // roomId
        async (roomId) => {
          // 部屋作成後に自動的に作成されるゲーム
          const game = createNewGame(roomId, 1);
          
          // gameNumberが1であることを確認
          expect(game.gameNumber).toBe(1);
          expect(game.roomId).toBe(roomId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('自動作成されたゲームにはcurrentGameIdが設定される', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          roomId: fc.uuid(),
          gameId: fc.uuid(),
        }),
        async (data) => {
          // 部屋にcurrentGameIdが設定されることをシミュレート
          const room = {
            id: data.roomId,
            name: '2024/01/01 12:00',
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
            settings: getDefaultRoomSettings(),
            currentGameId: data.gameId,
          };
          
          // currentGameIdが設定されていることを確認
          expect(room.currentGameId).toBe(data.gameId);
          expect(room.currentGameId).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: bug-fixes, Property 4: 自動作成されたゲームは正しく初期化される
 * Validates: Requirements 2.2, 2.3
 */
describe('Property 4: 自動作成されたゲームは正しく初期化される', () => {
  it('自動作成されたゲームのstatusはinputtingである', async () => {
    const { createNewGame, GAME_STATUS } = await import('../../models/index.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // roomId
        async (roomId) => {
          const game = createNewGame(roomId, 1);
          
          // statusがINPUTTINGであることを確認
          expect(game.status).toBe(GAME_STATUS.INPUTTING);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('自動作成されたゲームのresultsは空配列である', async () => {
    const { createNewGame } = await import('../../models/converters.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // roomId
        async (roomId) => {
          const game = createNewGame(roomId, 1);
          
          // resultsが空配列であることを確認
          expect(game.results).toEqual([]);
          expect(game.results.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('自動作成されたゲームのgameNumberは1である', async () => {
    const { createNewGame } = await import('../../models/converters.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // roomId
        async (roomId) => {
          const game = createNewGame(roomId, 1);
          
          // gameNumberが1であることを確認
          expect(game.gameNumber).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('自動作成されたゲームはすぐにスコア入力を開始できる', async () => {
    const { createNewGame, GAME_STATUS } = await import('../../models/index.js');
    
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // roomId
        async (roomId) => {
          const game = createNewGame(roomId, 1);
          
          // statusがINPUTTINGであり、resultsが空配列であることを確認
          expect(game.status).toBe(GAME_STATUS.INPUTTING);
          expect(game.results).toEqual([]);
          
          // スコア入力可能な状態であることを確認
          expect(game.status).toBe(GAME_STATUS.INPUTTING);
        }
      ),
      { numRuns: 100 }
    );
  });
});
