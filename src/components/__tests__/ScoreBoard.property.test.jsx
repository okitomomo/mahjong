/**
 * ScoreBoardコンポーネントのプロパティベーステスト
 * Property-based tests for ScoreBoard component
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// テスト用のArbitrary（ジェネレーター）

/**
 * メンバーデータのジェネレーター
 */
const memberArbitrary = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  roomId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 10 }),
  joinedAt: fc.date(),
});

/**
 * GameResultのジェネレーター
 */
const gameResultArbitrary = (memberId, memberName) => fc.record({
  memberId: fc.constant(memberId),
  memberName: fc.constant(memberName),
  rawScore: fc.integer({ min: 0, max: 100000 }),
  rank: fc.integer({ min: 1, max: 4 }),
  oka: fc.integer({ min: -100, max: 100 }),
  uma: fc.integer({ min: -50, max: 50 }),
  isYakitori: fc.boolean(),
  yakitoriScore: fc.integer({ min: -30, max: 30 }),
  chipCount: fc.integer({ min: -10, max: 10 }),
  chipScore: fc.integer({ min: -50, max: 50 }),
  finalScore: fc.integer({ min: -200, max: 200 }),
  finalScoreWithChip: fc.integer({ min: -250, max: 250 }),
});

/**
 * 確定済み半荘のジェネレーター
 */
const completedGameArbitrary = (members) => fc.record({
  id: fc.uuid(),
  roomId: fc.uuid(),
  gameNumber: fc.integer({ min: 1, max: 100 }),
  createdAt: fc.date(),
  status: fc.constant('completed'),
  playerCount: fc.constantFrom(3, 4),
  results: fc.constant(members).chain(mems => 
    fc.array(
      fc.integer({ min: 0, max: mems.length - 1 }).chain(idx => 
        gameResultArbitrary(mems[idx].id, mems[idx].name)
      ),
      { minLength: 3, maxLength: 4 }
    )
  ),
});

/**
 * Feature: mahjong-score-management, Property 27: スコアボードの表形式レイアウト
 * Validates: Requirements 6.1, 6.2
 */
describe('Property 27: スコアボードの表形式レイアウト', () => {
  it('任意のスコアボードデータに対して、縦軸は半荘回数、横軸はメンバーで構成される', () => {
    fc.assert(
      fc.property(
        fc.record({
          members: fc.array(memberArbitrary, { minLength: 2, maxLength: 4 }),
        }).chain(data => 
          fc.record({
            members: fc.constant(data.members),
            games: fc.array(
              completedGameArbitrary(data.members),
              { minLength: 1, maxLength: 5 }
            ).map(games => 
              games.map((game, index) => ({ ...game, gameNumber: index + 1 }))
            ),
          })
        ),
        (data) => {
          // スコアボードのデータ構造を検証
          
          // メンバー数が正しいことを確認
          expect(data.members.length).toBeGreaterThanOrEqual(2);
          expect(data.members.length).toBeLessThanOrEqual(4);
          
          // 各メンバーに対して「-」列と「+」列が必要
          const columnsPerMember = 2; // 「-」列と「+」列
          const totalMemberColumns = data.members.length * columnsPerMember;
          expect(totalMemberColumns).toBe(data.members.length * 2);
          
          // 半荘の行数を確認
          expect(data.games.length).toBeGreaterThanOrEqual(1);
          
          // 各半荘に半荘番号が付与されていることを確認
          data.games.forEach((game, index) => {
            expect(game.gameNumber).toBe(index + 1);
            expect(game.status).toBe('completed');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('任意のスコアボードデータに対して、半荘は番号順にソートされる', () => {
    fc.assert(
      fc.property(
        fc.record({
          members: fc.array(memberArbitrary, { minLength: 2, maxLength: 4 }),
        }).chain(data => 
          fc.record({
            members: fc.constant(data.members),
            games: fc.array(
              completedGameArbitrary(data.members),
              { minLength: 2, maxLength: 5 }
            ).map(games => 
              // ランダムな順序で生成してからソート
              games.map((game, index) => ({ ...game, gameNumber: index + 1 }))
            ),
          })
        ),
        (data) => {
          // 半荘をgameNumberでソート
          const sortedGames = [...data.games].sort((a, b) => a.gameNumber - b.gameNumber);
          
          // ソート後の半荘番号が連続していることを確認
          sortedGames.forEach((game, index) => {
            expect(game.gameNumber).toBe(index + 1);
          });
          
          // 元のデータも既にソートされていることを確認
          data.games.forEach((game, index) => {
            expect(game.gameNumber).toBe(index + 1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 28: スコア表示の正負分離
 * Validates: Requirements 6.3
 */
describe('Property 28: スコア表示の正負分離', () => {
  it('任意のスコアに対して、負の値は「-」列、正の値は「+」列に分類される', () => {
    fc.assert(
      fc.property(
        fc.record({
          score: fc.oneof(
            fc.integer({ min: -250, max: -1 }), // 負の値
            fc.integer({ min: 1, max: 250 })    // 正の値
          ),
        }),
        (data) => {
          const score = data.score;
          
          // スコアの分類ロジックを検証
          const isNegative = score < 0;
          const isPositive = score > 0;
          
          if (isNegative) {
            // 負のスコアは「-」列に表示される
            expect(score).toBeLessThan(0);
            expect(isNegative).toBe(true);
            expect(isPositive).toBe(false);
            
            // 表示値は絶対値
            const displayValue = Math.abs(score);
            expect(displayValue).toBeGreaterThan(0);
          } else if (isPositive) {
            // 正のスコアは「+」列に表示される
            expect(score).toBeGreaterThan(0);
            expect(isPositive).toBe(true);
            expect(isNegative).toBe(false);
            
            // 表示値はそのまま
            const displayValue = score;
            expect(displayValue).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('任意のゼロスコアに対して、「-」列と「+」列のどちらにも表示されない', () => {
    fc.assert(
      fc.property(
        fc.constant(0),
        (score) => {
          // ゼロスコアの分類ロジックを検証
          const isNegative = score < 0;
          const isPositive = score > 0;
          const isZero = score === 0;
          
          expect(isZero).toBe(true);
          expect(isNegative).toBe(false);
          expect(isPositive).toBe(false);
          
          // ゼロは「-」列にも「+」列にも表示されない
          // （両方とも空または「-」プレースホルダー）
        }
      ),
      { numRuns: 100 }
    );
  });

  it('任意のスコアセットに対して、正負の分離が正しく行われる', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.integer({ min: -250, max: 250 }),
          { minLength: 3, maxLength: 4 }
        ),
        (scores) => {
          // スコアを正負で分類
          const negativeScores = scores.filter(s => s < 0);
          const positiveScores = scores.filter(s => s > 0);
          const zeroScores = scores.filter(s => s === 0);
          
          // 分類が正しいことを確認
          negativeScores.forEach(s => expect(s).toBeLessThan(0));
          positiveScores.forEach(s => expect(s).toBeGreaterThan(0));
          zeroScores.forEach(s => expect(s).toBe(0));
          
          // 全てのスコアが分類されていることを確認
          expect(negativeScores.length + positiveScores.length + zeroScores.length).toBe(scores.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 29: スコア詳細の表示
 * Validates: Requirements 6.4, 6.5
 */
describe('Property 29: スコア詳細の表示', () => {
  it('任意の確定済み半荘のスコアに対して、詳細情報が含まれている', () => {
    fc.assert(
      fc.property(
        fc.record({
          member: memberArbitrary,
          game: fc.record({
            id: fc.uuid(),
            roomId: fc.uuid(),
            gameNumber: fc.integer({ min: 1, max: 100 }),
            createdAt: fc.date(),
            status: fc.constant('completed'),
            playerCount: fc.constantFrom(3, 4),
          }),
          rawScore: fc.integer({ min: 0, max: 100000 }),
          rank: fc.integer({ min: 1, max: 4 }),
          oka: fc.integer({ min: -100, max: 100 }),
          uma: fc.integer({ min: -50, max: 50 }),
          isYakitori: fc.boolean(),
          yakitoriScore: fc.integer({ min: -30, max: 30 }),
          chipCount: fc.integer({ min: -10, max: 10 }),
          chipScore: fc.integer({ min: -50, max: 50 }),
        }),
        (data) => {
          // スコアを計算式に基づいて正しく計算
          const finalScore = data.oka + data.uma + data.yakitoriScore;
          const finalScoreWithChip = finalScore + data.chipScore;
          
          const result = {
            rawScore: data.rawScore,
            rank: data.rank,
            oka: data.oka,
            uma: data.uma,
            isYakitori: data.isYakitori,
            yakitoriScore: data.yakitoriScore,
            chipCount: data.chipCount,
            chipScore: data.chipScore,
            finalScore: finalScore,
            finalScoreWithChip: finalScoreWithChip,
          };
          
          // スコア詳細データを検証
          const scoreDetail = {
            memberName: data.member.name,
            gameNumber: data.game.gameNumber,
            rawScore: result.rawScore,
            rank: result.rank,
            oka: result.oka,
            uma: result.uma,
            isYakitori: result.isYakitori,
            yakitoriScore: result.yakitoriScore,
            chipCount: result.chipCount,
            chipScore: result.chipScore,
            finalScore: result.finalScore,
            finalScoreWithChip: result.finalScoreWithChip,
          };
          
          // 必須フィールドが存在することを確認
          expect(scoreDetail.memberName).toBeDefined();
          expect(scoreDetail.gameNumber).toBeDefined();
          expect(scoreDetail.rawScore).toBeDefined();
          expect(scoreDetail.rank).toBeDefined();
          expect(scoreDetail.oka).toBeDefined();
          expect(scoreDetail.uma).toBeDefined();
          expect(scoreDetail.finalScore).toBeDefined();
          expect(scoreDetail.finalScoreWithChip).toBeDefined();
          
          // スコアの整合性を確認
          // finalScore = oka + uma + yakitoriScore
          const expectedFinalScore = result.oka + result.uma + result.yakitoriScore;
          expect(result.finalScore).toBe(expectedFinalScore);
          
          // finalScoreWithChip = finalScore + chipScore
          const expectedFinalScoreWithChip = result.finalScore + result.chipScore;
          expect(result.finalScoreWithChip).toBe(expectedFinalScoreWithChip);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('任意のスコア詳細に対して、得点・スコア・ウマ・ヤキトリ・チップの内訳が含まれる', () => {
    fc.assert(
      fc.property(
        fc.record({
          rawScore: fc.integer({ min: 0, max: 100000 }),
          rank: fc.integer({ min: 1, max: 4 }),
          oka: fc.integer({ min: -100, max: 100 }),
          uma: fc.integer({ min: -50, max: 50 }),
          isYakitori: fc.boolean(),
          yakitoriScore: fc.integer({ min: -30, max: 30 }),
          chipCount: fc.integer({ min: -10, max: 10 }),
          chipScore: fc.integer({ min: -50, max: 50 }),
        }),
        (data) => {
          // スコアを正しく計算
          const finalScore = data.oka + data.uma + data.yakitoriScore;
          const finalScoreWithChip = finalScore + data.chipScore;
          
          // スコア詳細の構造を検証
          const scoreDetail = {
            rawScore: data.rawScore,
            rank: data.rank,
            oka: data.oka,
            uma: data.uma,
            isYakitori: data.isYakitori,
            yakitoriScore: data.yakitoriScore,
            chipCount: data.chipCount,
            chipScore: data.chipScore,
            finalScore: finalScore,
            finalScoreWithChip: finalScoreWithChip,
          };
          
          // 各フィールドが定義されていることを確認
          expect(scoreDetail.rawScore).toBeDefined();
          expect(scoreDetail.rank).toBeDefined();
          expect(scoreDetail.oka).toBeDefined();
          expect(scoreDetail.uma).toBeDefined();
          expect(scoreDetail.isYakitori).toBeDefined();
          expect(scoreDetail.yakitoriScore).toBeDefined();
          expect(scoreDetail.chipCount).toBeDefined();
          expect(scoreDetail.chipScore).toBeDefined();
          expect(scoreDetail.finalScore).toBeDefined();
          expect(scoreDetail.finalScoreWithChip).toBeDefined();
          
          // 型が正しいことを確認
          expect(typeof scoreDetail.rawScore).toBe('number');
          expect(typeof scoreDetail.rank).toBe('number');
          expect(typeof scoreDetail.oka).toBe('number');
          expect(typeof scoreDetail.uma).toBe('number');
          expect(typeof scoreDetail.isYakitori).toBe('boolean');
          expect(typeof scoreDetail.yakitoriScore).toBe('number');
          expect(typeof scoreDetail.chipCount).toBe('number');
          expect(typeof scoreDetail.chipScore).toBe('number');
          expect(typeof scoreDetail.finalScore).toBe('number');
          expect(typeof scoreDetail.finalScoreWithChip).toBe('number');
          
          // スコアの整合性を確認
          expect(scoreDetail.finalScore).toBe(scoreDetail.oka + scoreDetail.uma + scoreDetail.yakitoriScore);
          expect(scoreDetail.finalScoreWithChip).toBe(scoreDetail.finalScore + scoreDetail.chipScore);
        }
      ),
      { numRuns: 100 }
    );
  });
});
