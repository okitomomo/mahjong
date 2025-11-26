/**
 * 半荘サービスのプロパティベーステスト
 * Property-based tests for game service
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { gameConverter, createNewGame, createGameResult } from '../../models/converters.js';
import { GAME_STATUS } from '../../models/constants.js';
import { submitScore } from '../gameService.js';

/**
 * Feature: bug-fixes, Property 7: 無効な得点は保存されない
 * Validates: Requirements 3.3
 */
describe('Property 7: 無効な得点は保存されない', () => {
  // submitScore関数をモック化
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('100の倍数でない得点の場合、submitScoreはエラーをスローする', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 200000 }).filter(n => n % 100 !== 0), // not multiple of 100
        async (score) => {
          // submitScoreを呼び出すとエラーがスローされることを確認
          await expect(
            submitScore('room-id', 'game-id', 'member-id', 'Member Name', score)
          ).rejects.toThrow('得点は100点刻みで入力してください');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('負の得点の場合、submitScoreはエラーをスローする', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: -100000, max: -1 }), // negative score
        async (score) => {
          await expect(
            submitScore('room-id', 'game-id', 'member-id', 'Member Name', score)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('200000点を超える得点の場合、submitScoreはエラーをスローする', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 200001, max: 1000000 }), // score over limit
        async (score) => {
          await expect(
            submitScore('room-id', 'game-id', 'member-id', 'Member Name', score)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('非数値の場合、submitScoreはエラーをスローする', async () => {
    const invalidValues = [
      NaN,
      Infinity,
      -Infinity,
    ];
    
    for (const value of invalidValues) {
      await expect(
        submitScore('room-id', 'game-id', 'member-id', 'Member Name', value)
      ).rejects.toThrow();
    }
  });
});

/**
 * Feature: mahjong-score-management, Property 9: 半荘回数の自動採番
 * Validates: Requirements 3.7
 */
describe('Property 9: 半荘回数の自動採番', () => {
  it('N回目の半荘の後に作成される半荘はN+1回目である', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          currentGameNumber: fc.integer({ min: 1, max: 100 }),
        }),
        (data) => {
          // N回目の半荘
          const currentGame = createNewGame(data.roomId, data.currentGameNumber);
          expect(currentGame.gameNumber).toBe(data.currentGameNumber);
          
          // N+1回目の半荘
          const nextGame = createNewGame(data.roomId, data.currentGameNumber + 1);
          expect(nextGame.gameNumber).toBe(data.currentGameNumber + 1);
          
          // 回数が1増えていることを確認
          expect(nextGame.gameNumber).toBe(currentGame.gameNumber + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('半荘番号は常に正の整数である', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 1000 }),
        }),
        (data) => {
          const game = createNewGame(data.roomId, data.gameNumber);
          
          expect(game.gameNumber).toBeGreaterThan(0);
          expect(Number.isInteger(game.gameNumber)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('複数の半荘を連続して作成すると番号が順番に増える', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          startNumber: fc.integer({ min: 1, max: 50 }),
          count: fc.integer({ min: 2, max: 10 }),
        }),
        (data) => {
          const games = [];
          for (let i = 0; i < data.count; i++) {
            games.push(createNewGame(data.roomId, data.startNumber + i));
          }
          
          // 各半荘の番号が順番に増えていることを確認
          for (let i = 1; i < games.length; i++) {
            expect(games[i].gameNumber).toBe(games[i - 1].gameNumber + 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 10: 半荘記録の永続化
 * Validates: Requirements 3.5
 */
describe('Property 10: 半荘記録の永続化', () => {
  it('半荘データをFirestore形式に変換して戻すと同じデータが得られる', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          status: fc.constantFrom(GAME_STATUS.INPUTTING, GAME_STATUS.COMPLETED, GAME_STATUS.INVALID),
          playerCount: fc.option(fc.constantFrom(3, 4)),
          results: fc.array(
            fc.record({
              memberId: fc.uuid(),
              memberName: fc.string({ minLength: 1, maxLength: 50 }),
              rawScore: fc.option(fc.integer({ min: 0, max: 200000 })),
              rank: fc.option(fc.integer({ min: 1, max: 4 })),
              uma: fc.option(fc.integer({ min: -50, max: 50 })),
              oka: fc.option(fc.integer({ min: -50, max: 50 })),
              isYakitori: fc.option(fc.boolean()),
              yakitoriScore: fc.option(fc.integer({ min: -100, max: 100 })),
              chipCount: fc.option(fc.integer({ min: -50, max: 50 })),
              chipScore: fc.option(fc.integer({ min: -250, max: 250 })),
              finalScore: fc.option(fc.integer({ min: -200, max: 200 })),
              finalScoreWithChip: fc.option(fc.integer({ min: -300, max: 300 })),
            }),
            { minLength: 0, maxLength: 4 }
          ),
        }),
        (data) => {
          const game = {
            id: 'test-game-id',
            roomId: data.roomId,
            gameNumber: data.gameNumber,
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
            status: data.status,
            results: data.results,
          };
          
          // playerCountが存在する場合のみ追加
          if (data.playerCount !== null) {
            game.playerCount = data.playerCount;
          }
          
          // toFirestore -> fromFirestore のラウンドトリップ
          const firestoreData = gameConverter.toFirestore(game);
          
          // fromFirestoreをシミュレート
          const mockSnapshot = {
            id: game.id,
            data: () => firestoreData,
          };
          
          const restored = gameConverter.fromFirestore(mockSnapshot);
          
          // 主要なフィールドが保持されていることを確認
          expect(restored.id).toBe(game.id);
          expect(restored.roomId).toBe(game.roomId);
          expect(restored.gameNumber).toBe(game.gameNumber);
          expect(restored.status).toBe(game.status);
          expect(restored.results.length).toBe(game.results.length);
          
          // playerCountの確認
          if (data.playerCount !== null) {
            expect(restored.playerCount).toBe(game.playerCount);
          }
          
          // 各結果の確認
          restored.results.forEach((result, index) => {
            const original = game.results[index];
            expect(result.memberId).toBe(original.memberId);
            expect(result.memberName).toBe(original.memberName);
            expect(result.rawScore).toBe(original.rawScore);
            expect(result.rank).toBe(original.rank);
            expect(result.uma).toBe(original.uma);
            expect(result.oka).toBe(original.oka);
            expect(result.isYakitori).toBe(original.isYakitori);
            expect(result.yakitoriScore).toBe(original.yakitoriScore);
            expect(result.chipCount).toBe(original.chipCount);
            expect(result.chipScore).toBe(original.chipScore);
            expect(result.finalScore).toBe(original.finalScore);
            expect(result.finalScoreWithChip).toBe(original.finalScoreWithChip);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('得点入力後のデータが正しく保存される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          memberId: fc.uuid(),
          memberName: fc.string({ minLength: 1, maxLength: 50 }),
          rawScore: fc.integer({ min: 0, max: 200000 }),
          chipCount: fc.integer({ min: -50, max: 50 }),
          isYakitori: fc.boolean(),
        }),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // 得点を追加
          const result = createGameResult(data.memberId, data.memberName);
          result.rawScore = data.rawScore;
          result.chipCount = data.chipCount;
          result.isYakitori = data.isYakitori;
          
          game.results.push(result);
          
          // Firestoreに変換
          const firestoreData = gameConverter.toFirestore(game);
          
          // 得点が正しく保存されることを確認
          expect(firestoreData.results.length).toBe(1);
          expect(firestoreData.results[0].memberId).toBe(data.memberId);
          expect(firestoreData.results[0].memberName).toBe(data.memberName);
          expect(firestoreData.results[0].rawScore).toBe(data.rawScore);
          expect(firestoreData.results[0].chipCount).toBe(data.chipCount);
          expect(firestoreData.results[0].isYakitori).toBe(data.isYakitori);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('複数プレイヤーの得点が全て保存される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          players: fc.array(
            fc.record({
              memberId: fc.uuid(),
              memberName: fc.string({ minLength: 1, maxLength: 50 }),
              rawScore: fc.integer({ min: 0, max: 200000 }),
            }),
            { minLength: 3, maxLength: 4 }
          ),
        }),
        (data) => {
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // 各プレイヤーの得点を追加
          data.players.forEach(player => {
            const result = createGameResult(player.memberId, player.memberName);
            result.rawScore = player.rawScore;
            game.results.push(result);
          });
          
          // Firestoreに変換
          const firestoreData = gameConverter.toFirestore(game);
          
          // 全てのプレイヤーの得点が保存されることを確認
          expect(firestoreData.results.length).toBe(data.players.length);
          
          firestoreData.results.forEach((result, index) => {
            expect(result.memberId).toBe(data.players[index].memberId);
            expect(result.memberName).toBe(data.players[index].memberName);
            expect(result.rawScore).toBe(data.players[index].rawScore);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('半荘の状態が正しく保存される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          status: fc.constantFrom(GAME_STATUS.INPUTTING, GAME_STATUS.COMPLETED, GAME_STATUS.INVALID),
        }),
        (data) => {
          const game = createNewGame(data.roomId, data.gameNumber);
          game.status = data.status;
          
          // Firestoreに変換
          const firestoreData = gameConverter.toFirestore(game);
          
          // 状態が正しく保存されることを確認
          expect(firestoreData.status).toBe(data.status);
          
          // 復元
          const mockSnapshot = {
            id: 'test-game-id',
            data: () => firestoreData,
          };
          
          const restored = gameConverter.fromFirestore(mockSnapshot);
          expect(restored.status).toBe(data.status);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 16: 確定後の変更不可
 * Validates: Requirements 4.6
 * 
 * Note: このプロパティは既にvalidation.property.test.jsで実装済みですが、
 * ここでは半荘サービスの観点から追加のテストを行います。
 */
describe('Property 16: 確定後の変更不可（半荘サービス観点）', () => {
  it('確定済み半荘のstatusはCOMPLETEDである', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          playerCount: fc.constantFrom(3, 4),
        }),
        (data) => {
          const game = createNewGame(data.roomId, data.gameNumber);
          game.status = GAME_STATUS.COMPLETED;
          game.playerCount = data.playerCount;
          
          // 確定済み半荘のstatusを確認
          expect(game.status).toBe(GAME_STATUS.COMPLETED);
          
          // Firestoreに変換して復元
          const firestoreData = gameConverter.toFirestore(game);
          const mockSnapshot = {
            id: 'test-game-id',
            data: () => firestoreData,
          };
          const restored = gameConverter.fromFirestore(mockSnapshot);
          
          // 復元後もstatusがCOMPLETEDであることを確認
          expect(restored.status).toBe(GAME_STATUS.COMPLETED);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('入力中の半荘のstatusはINPUTTINGである', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
        }),
        (data) => {
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // 新規作成時はINPUTTING
          expect(game.status).toBe(GAME_STATUS.INPUTTING);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 33: スコア入力の独立性
 * Validates: Requirements 8.4, 8.5
 */
describe('Property 33: スコア入力の独立性', () => {
  it('メンバーは自分の得点のみを入力でき、他のメンバーの得点は変更されない', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          member1Id: fc.uuid(),
          member1Name: fc.string({ minLength: 1, maxLength: 50 }),
          member1Score: fc.integer({ min: 0, max: 200000 }),
          member2Id: fc.uuid(),
          member2Name: fc.string({ minLength: 1, maxLength: 50 }),
          member2Score: fc.integer({ min: 0, max: 200000 }),
        }).filter(data => data.member1Id !== data.member2Id),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // メンバー1の得点を入力
          const result1 = createGameResult(data.member1Id, data.member1Name);
          result1.rawScore = data.member1Score;
          game.results.push(result1);
          
          // メンバー2の得点を入力
          const result2 = createGameResult(data.member2Id, data.member2Name);
          result2.rawScore = data.member2Score;
          game.results.push(result2);
          
          // メンバー1の得点が保持されていることを確認
          const member1Result = game.results.find(r => r.memberId === data.member1Id);
          expect(member1Result).toBeDefined();
          expect(member1Result.rawScore).toBe(data.member1Score);
          
          // メンバー2の得点が保持されていることを確認
          const member2Result = game.results.find(r => r.memberId === data.member2Id);
          expect(member2Result).toBeDefined();
          expect(member2Result.rawScore).toBe(data.member2Score);
          
          // 各メンバーが独立したデータを持っていることを確認
          expect(member1Result.memberId).not.toBe(member2Result.memberId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('メンバーが自分の得点を更新しても他のメンバーの得点は変更されない', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          member1Id: fc.uuid(),
          member1Name: fc.string({ minLength: 1, maxLength: 50 }),
          member1InitialScore: fc.integer({ min: 0, max: 200000 }),
          member1UpdatedScore: fc.integer({ min: 0, max: 200000 }),
          member2Id: fc.uuid(),
          member2Name: fc.string({ minLength: 1, maxLength: 50 }),
          member2Score: fc.integer({ min: 0, max: 200000 }),
        }).filter(data => data.member1Id !== data.member2Id && data.member1InitialScore !== data.member1UpdatedScore),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // メンバー1の初期得点を入力
          const result1 = createGameResult(data.member1Id, data.member1Name);
          result1.rawScore = data.member1InitialScore;
          game.results.push(result1);
          
          // メンバー2の得点を入力
          const result2 = createGameResult(data.member2Id, data.member2Name);
          result2.rawScore = data.member2Score;
          game.results.push(result2);
          
          // メンバー2の得点を保存
          const member2InitialScore = game.results.find(r => r.memberId === data.member2Id).rawScore;
          
          // メンバー1の得点を更新
          const member1Index = game.results.findIndex(r => r.memberId === data.member1Id);
          game.results[member1Index].rawScore = data.member1UpdatedScore;
          
          // メンバー1の得点が更新されていることを確認
          const member1Result = game.results.find(r => r.memberId === data.member1Id);
          expect(member1Result.rawScore).toBe(data.member1UpdatedScore);
          
          // メンバー2の得点が変更されていないことを確認
          const member2Result = game.results.find(r => r.memberId === data.member2Id);
          expect(member2Result.rawScore).toBe(member2InitialScore);
          expect(member2Result.rawScore).toBe(data.member2Score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('複数のメンバーが同時に得点を入力しても各メンバーの得点は独立している', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          players: fc.array(
            fc.record({
              memberId: fc.uuid(),
              memberName: fc.string({ minLength: 1, maxLength: 50 }),
              rawScore: fc.integer({ min: 0, max: 200000 }),
            }),
            { minLength: 3, maxLength: 4 }
          ).filter(players => {
            // 全てのメンバーIDが一意であることを確認
            const ids = players.map(p => p.memberId);
            return new Set(ids).size === ids.length;
          }),
        }),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // 各メンバーの得点を入力
          data.players.forEach(player => {
            const result = createGameResult(player.memberId, player.memberName);
            result.rawScore = player.rawScore;
            game.results.push(result);
          });
          
          // 各メンバーの得点が正しく保存されていることを確認
          data.players.forEach(player => {
            const result = game.results.find(r => r.memberId === player.memberId);
            expect(result).toBeDefined();
            expect(result.rawScore).toBe(player.rawScore);
            expect(result.memberName).toBe(player.memberName);
          });
          
          // 結果の数が正しいことを確認
          expect(game.results.length).toBe(data.players.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('メンバーIDが異なれば同じ得点でも独立して保存される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          member1Id: fc.uuid(),
          member1Name: fc.string({ minLength: 1, maxLength: 50 }),
          member2Id: fc.uuid(),
          member2Name: fc.string({ minLength: 1, maxLength: 50 }),
          sameScore: fc.integer({ min: 0, max: 200000 }),
        }).filter(data => data.member1Id !== data.member2Id),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // メンバー1の得点を入力
          const result1 = createGameResult(data.member1Id, data.member1Name);
          result1.rawScore = data.sameScore;
          game.results.push(result1);
          
          // メンバー2の得点を入力（同じ得点）
          const result2 = createGameResult(data.member2Id, data.member2Name);
          result2.rawScore = data.sameScore;
          game.results.push(result2);
          
          // 両方のメンバーの得点が保存されていることを確認
          expect(game.results.length).toBe(2);
          
          // 各メンバーの得点が正しいことを確認
          const member1Result = game.results.find(r => r.memberId === data.member1Id);
          const member2Result = game.results.find(r => r.memberId === data.member2Id);
          
          expect(member1Result.rawScore).toBe(data.sameScore);
          expect(member2Result.rawScore).toBe(data.sameScore);
          
          // メンバーIDは異なることを確認
          expect(member1Result.memberId).not.toBe(member2Result.memberId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 34: リアルタイム更新
 * Validates: Requirements 6.11, 8.6
 * 
 * Note: このプロパティはFirestoreのリアルタイムリスナーに依存しますが、
 * ここではデータ構造とコンバーターが正しく動作することをテストします。
 */
describe('Property 34: リアルタイム更新（データ構造）', () => {
  it('得点入力後のデータがFirestore形式に正しく変換される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          memberId: fc.uuid(),
          memberName: fc.string({ minLength: 1, maxLength: 50 }),
          rawScore: fc.integer({ min: 0, max: 200000 }),
          chipCount: fc.integer({ min: -50, max: 50 }),
          isYakitori: fc.boolean(),
        }),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // 得点を入力
          const result = createGameResult(data.memberId, data.memberName);
          result.rawScore = data.rawScore;
          result.chipCount = data.chipCount;
          result.isYakitori = data.isYakitori;
          game.results.push(result);
          
          // Firestoreに変換
          const firestoreData = gameConverter.toFirestore(game);
          
          // 変換後のデータが正しいことを確認
          expect(firestoreData.results.length).toBe(1);
          expect(firestoreData.results[0].memberId).toBe(data.memberId);
          expect(firestoreData.results[0].memberName).toBe(data.memberName);
          expect(firestoreData.results[0].rawScore).toBe(data.rawScore);
          expect(firestoreData.results[0].chipCount).toBe(data.chipCount);
          expect(firestoreData.results[0].isYakitori).toBe(data.isYakitori);
          
          // Firestoreから復元
          const mockSnapshot = {
            id: 'test-game-id',
            data: () => firestoreData,
          };
          const restored = gameConverter.fromFirestore(mockSnapshot);
          
          // 復元後のデータが元のデータと一致することを確認
          expect(restored.results.length).toBe(1);
          expect(restored.results[0].memberId).toBe(data.memberId);
          expect(restored.results[0].memberName).toBe(data.memberName);
          expect(restored.results[0].rawScore).toBe(data.rawScore);
          expect(restored.results[0].chipCount).toBe(data.chipCount);
          expect(restored.results[0].isYakitori).toBe(data.isYakitori);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('複数メンバーの得点更新が正しく反映される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          players: fc.array(
            fc.record({
              memberId: fc.uuid(),
              memberName: fc.string({ minLength: 1, maxLength: 50 }),
              rawScore: fc.integer({ min: 0, max: 200000 }),
            }),
            { minLength: 3, maxLength: 4 }
          ).filter(players => {
            const ids = players.map(p => p.memberId);
            return new Set(ids).size === ids.length;
          }),
        }),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // 各メンバーの得点を入力
          data.players.forEach(player => {
            const result = createGameResult(player.memberId, player.memberName);
            result.rawScore = player.rawScore;
            game.results.push(result);
          });
          
          // Firestoreに変換
          const firestoreData = gameConverter.toFirestore(game);
          
          // 全てのメンバーの得点が変換されていることを確認
          expect(firestoreData.results.length).toBe(data.players.length);
          
          // Firestoreから復元
          const mockSnapshot = {
            id: 'test-game-id',
            data: () => firestoreData,
          };
          const restored = gameConverter.fromFirestore(mockSnapshot);
          
          // 復元後、全てのメンバーの得点が正しいことを確認
          data.players.forEach(player => {
            const restoredResult = restored.results.find(r => r.memberId === player.memberId);
            expect(restoredResult).toBeDefined();
            expect(restoredResult.rawScore).toBe(player.rawScore);
            expect(restoredResult.memberName).toBe(player.memberName);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('得点の部分的な更新が正しく反映される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          member1Id: fc.uuid(),
          member1Name: fc.string({ minLength: 1, maxLength: 50 }),
          member1Score: fc.integer({ min: 0, max: 200000 }),
          member2Id: fc.uuid(),
          member2Name: fc.string({ minLength: 1, maxLength: 50 }),
          member3Id: fc.uuid(),
          member3Name: fc.string({ minLength: 1, maxLength: 50 }),
          member3Score: fc.integer({ min: 0, max: 200000 }),
        }).filter(data => {
          const ids = [data.member1Id, data.member2Id, data.member3Id];
          return new Set(ids).size === ids.length;
        }),
        (data) => {
          // 半荘を作成
          const game = createNewGame(data.roomId, data.gameNumber);
          
          // メンバー1の得点を入力
          const result1 = createGameResult(data.member1Id, data.member1Name);
          result1.rawScore = data.member1Score;
          game.results.push(result1);
          
          // メンバー2は未入力
          const result2 = createGameResult(data.member2Id, data.member2Name);
          game.results.push(result2);
          
          // メンバー3の得点を入力
          const result3 = createGameResult(data.member3Id, data.member3Name);
          result3.rawScore = data.member3Score;
          game.results.push(result3);
          
          // Firestoreに変換
          const firestoreData = gameConverter.toFirestore(game);
          
          // Firestoreから復元
          const mockSnapshot = {
            id: 'test-game-id',
            data: () => firestoreData,
          };
          const restored = gameConverter.fromFirestore(mockSnapshot);
          
          // メンバー1の得点が保存されていることを確認
          const restoredResult1 = restored.results.find(r => r.memberId === data.member1Id);
          expect(restoredResult1.rawScore).toBe(data.member1Score);
          
          // メンバー2の得点が未入力であることを確認
          const restoredResult2 = restored.results.find(r => r.memberId === data.member2Id);
          expect(restoredResult2.rawScore).toBeUndefined();
          
          // メンバー3の得点が保存されていることを確認
          const restoredResult3 = restored.results.find(r => r.memberId === data.member3Id);
          expect(restoredResult3.rawScore).toBe(data.member3Score);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('入力中の半荘のステータスが正しく保持される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gameNumber: fc.integer({ min: 1, max: 100 }),
          memberId: fc.uuid(),
          memberName: fc.string({ minLength: 1, maxLength: 50 }),
          rawScore: fc.integer({ min: 0, max: 200000 }),
        }),
        (data) => {
          // 半荘を作成（入力中状態）
          const game = createNewGame(data.roomId, data.gameNumber);
          expect(game.status).toBe(GAME_STATUS.INPUTTING);
          
          // 得点を入力
          const result = createGameResult(data.memberId, data.memberName);
          result.rawScore = data.rawScore;
          game.results.push(result);
          
          // Firestoreに変換して復元
          const firestoreData = gameConverter.toFirestore(game);
          const mockSnapshot = {
            id: 'test-game-id',
            data: () => firestoreData,
          };
          const restored = gameConverter.fromFirestore(mockSnapshot);
          
          // ステータスが入力中のまま保持されていることを確認
          expect(restored.status).toBe(GAME_STATUS.INPUTTING);
        }
      ),
      { numRuns: 100 }
    );
  });
});
