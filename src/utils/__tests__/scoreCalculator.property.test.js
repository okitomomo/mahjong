/**
 * スコア計算のプロパティベーステスト
 * Property-based tests for score calculation
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateOka,
  calculateUma,
  calculateFinalScore,
  calculateChipScore,
  calculateFinalScoreWithChip,
  calculateRanks,
  calculateMemberTotalScore,
  roundRawScore,
} from '../scoreCalculator.js';
import { roundScore } from '../mathUtils.js';

/**
 * Feature: mahjong-score-management, Property 14: オカ計算の正確性
 * Validates: Requirements 5.1
 */
describe('Property 14: オカ計算の正確性', () => {
  it('1位の場合、オカは (素点 - 返し点) / 1000 + (返し点 - 開始点) / 1000 × プレイヤー数 で計算される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }), // rawScore
        fc.integer({ min: 3, max: 4 }), // playerCount
        fc.integer({ min: 10000, max: 50000 }), // startPoints
        fc.integer({ min: 10000, max: 50000 }), // returnPoints
        (rawScore, playerCount, startPoints, returnPoints) => {
          const okaSettings = { startPoints, returnPoints };
          const rank = 1;
          
          const oka = calculateOka(rawScore, rank, playerCount, okaSettings);
          
          // 五捨六入を適用した期待値を計算
          const expectedBaseOka = roundScore((rawScore - returnPoints) / 1000);
          const expectedBonus = roundScore(((returnPoints - startPoints) / 1000) * playerCount);
          const expected = roundScore(expectedBaseOka + expectedBonus);
          
          expect(oka).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('2位以下の場合、オカは (素点 - 返し点) / 1000 で計算される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }), // rawScore
        fc.integer({ min: 2, max: 4 }), // rank (2-4)
        fc.integer({ min: 3, max: 4 }), // playerCount
        fc.integer({ min: 10000, max: 50000 }), // startPoints
        fc.integer({ min: 10000, max: 50000 }), // returnPoints
        (rawScore, rank, playerCount, startPoints, returnPoints) => {
          const okaSettings = { startPoints, returnPoints };
          
          const oka = calculateOka(rawScore, rank, playerCount, okaSettings);
          
          // 五捨六入を適用した期待値を計算
          const expected = roundScore((rawScore - returnPoints) / 1000);
          
          expect(oka).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 15: ウマの適用
 * Validates: Requirements 5.2
 */
describe('Property 15: ウマの適用', () => {
  it('4人麻雀の場合、各順位に対応するウマ値が正しく適用される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // rank
        fc.integer({ min: -100, max: 100 }), // topBottom
        fc.integer({ min: -100, max: 100 }), // middlePair
        (rank, topBottom, middlePair) => {
          const playerCount = 4;
          const umaSettings = { topBottom, middlePair };
          
          const uma = calculateUma(rank, playerCount, umaSettings);
          
          let expected;
          switch (rank) {
            case 1:
              expected = topBottom;
              break;
            case 2:
              expected = middlePair;
              break;
            case 3:
              expected = -middlePair;
              break;
            case 4:
              expected = -topBottom;
              break;
          }
          
          expect(uma).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('3人麻雀の場合、各順位に対応するウマ値が正しく適用される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // rank
        fc.integer({ min: -100, max: 100 }), // topBottom
        fc.integer({ min: -100, max: 100 }), // middlePair
        (rank, topBottom, middlePair) => {
          const playerCount = 3;
          const umaSettings = { topBottom, middlePair };
          
          const uma = calculateUma(rank, playerCount, umaSettings);
          
          let expected;
          switch (rank) {
            case 1:
              expected = topBottom;
              break;
            case 2:
              expected = 0;
              break;
            case 3:
              expected = -topBottom;
              break;
          }
          
          expect(uma).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 16: 最終スコア計算式
 * Validates: Requirements 5.3
 */
describe('Property 16: 最終スコア計算式', () => {
  it('最終スコア（チップ除く）は オカ + ウマ で計算される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }), // rawScore
        fc.integer({ min: 1, max: 4 }), // rank
        fc.integer({ min: 3, max: 4 }), // playerCount
        fc.integer({ min: 10000, max: 50000 }), // startPoints
        fc.integer({ min: 10000, max: 50000 }), // returnPoints
        fc.integer({ min: -100, max: 100 }), // topBottom
        fc.integer({ min: -100, max: 100 }), // middlePair
        (rawScore, rank, playerCount, startPoints, returnPoints, topBottom, middlePair) => {
          const okaSettings = { startPoints, returnPoints };
          const umaSettings = { topBottom, middlePair };
          
          const result = calculateFinalScore(rawScore, rank, playerCount, okaSettings, umaSettings);
          
          const expectedOka = calculateOka(rawScore, rank, playerCount, okaSettings);
          const expectedUma = calculateUma(rank, playerCount, umaSettings);
          const expectedFinalScore = roundScore(expectedOka + expectedUma);
          
          expect(result.oka).toBe(expectedOka);
          expect(result.uma).toBe(expectedUma);
          expect(result.finalScore).toBe(expectedFinalScore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 18: チップスコアの計算
 * Validates: Requirements 5.5
 */
describe('Property 18: チップスコアの計算', () => {
  it('チップスコアは チップ増減 × 1枚あたりのスコア で計算される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }), // chipCount
        fc.integer({ min: 1, max: 20 }), // pointsPerChip
        (chipCount, pointsPerChip) => {
          const chipScore = calculateChipScore(chipCount, pointsPerChip);
          
          const expected = chipCount * pointsPerChip;
          
          expect(chipScore).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 18-2: 最終スコア（チップ含む）の計算
 * Validates: Requirements 5.5
 */
describe('Property 18-2: 最終スコア（チップ含む）の計算', () => {
  it('最終スコア（チップ含む）は 最終スコア（チップ除く） + チップスコア で計算される', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: 10000 }).map(n => n / 10), // finalScore (小数点1位まで)
        fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // chipScore (小数点1位まで)
        (finalScore, chipScore) => {
          const finalScoreWithChip = calculateFinalScoreWithChip(finalScore, chipScore);
          
          const expected = roundScore(finalScore + chipScore);
          
          expect(finalScoreWithChip).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 11: 順位の降順計算
 * Validates: Requirements 3.6, 4.1
 */
describe('Property 11: 順位の降順計算', () => {
  it('計算された順位は得点の降順に対応している', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.string({ minLength: 1, maxLength: 20 }),
            rawScore: fc.integer({ min: 0, max: 100000 }),
          }),
          { minLength: 3, maxLength: 4 }
        ),
        (scores) => {
          const withRanks = calculateRanks(scores);
          
          // 順位順にソート
          const sorted = [...withRanks].sort((a, b) => a.rank - b.rank);
          
          // 各順位について、次の順位よりも得点が高いか同じであることを確認
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].rawScore).toBeGreaterThanOrEqual(sorted[i + 1].rawScore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 12: 同点時の同順位処理
 * Validates: Requirements 4.2
 */
describe('Property 12: 同点時の同順位処理', () => {
  it('同じ得点を持つプレイヤーは同じ順位である', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.string({ minLength: 1, maxLength: 20 }),
            rawScore: fc.integer({ min: 0, max: 100000 }),
          }),
          { minLength: 3, maxLength: 4 }
        ),
        (scores) => {
          const withRanks = calculateRanks(scores);
          
          // 同じ得点のプレイヤーを探す
          for (let i = 0; i < withRanks.length; i++) {
            for (let j = i + 1; j < withRanks.length; j++) {
              if (withRanks[i].rawScore === withRanks[j].rawScore) {
                // 同点の場合、順位も同じであるべき
                expect(withRanks[i].rank).toBe(withRanks[j].rank);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 20: 合計スコアの計算
 * Validates: Requirements 6.1, 6.2
 */
describe('Property 20: 合計スコアの計算', () => {
  it('合計スコアはそのメンバーが参加した全半荘の最終スコアの合計である', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // memberId
        fc.array(
          fc.record({
            id: fc.string(),
            roomId: fc.string(),
            gameNumber: fc.integer({ min: 1, max: 100 }),
            playedAt: fc.constant(null),
            playerCount: fc.constantFrom(3, 4),
            results: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 20 }),
                memberName: fc.string(),
                rawScore: fc.integer({ min: 0, max: 100000 }),
                rank: fc.integer({ min: 1, max: 4 }),
                uma: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                oka: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                chipCount: fc.integer({ min: -10, max: 10 }),
                chipScore: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                finalScore: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                finalScoreWithChip: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
              }),
              { minLength: 3, maxLength: 4 }
            ),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (memberId, games) => {
          const result = calculateMemberTotalScore(memberId, games);
          
          // 手動で合計を計算
          let expectedTotal = 0;
          let expectedGamesPlayed = 0;
          
          for (const game of games) {
            const playerResult = game.results.find(r => r.memberId === memberId);
            if (playerResult) {
              expectedTotal += playerResult.finalScoreWithChip;
              expectedGamesPlayed++;
            }
          }
          
          expect(result.totalScore).toBeCloseTo(expectedTotal, 10);
          expect(result.gamesPlayed).toBe(expectedGamesPlayed);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 22: 参加半荘数のカウント
 * Validates: Requirements 6.2, 6.4
 */
describe('Property 22: 参加半荘数のカウント', () => {
  it('表示される参加半荘数はそのメンバーが参加した半荘の数と一致する', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }), // memberId
        fc.array(
          fc.record({
            id: fc.string(),
            roomId: fc.string(),
            gameNumber: fc.integer({ min: 1, max: 100 }),
            playedAt: fc.constant(null),
            playerCount: fc.constantFrom(3, 4),
            results: fc.array(
              fc.record({
                memberId: fc.string({ minLength: 1, maxLength: 20 }),
                memberName: fc.string(),
                rawScore: fc.integer({ min: 0, max: 100000 }),
                rank: fc.integer({ min: 1, max: 4 }),
                uma: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                oka: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                chipCount: fc.integer({ min: -10, max: 10 }),
                chipScore: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                finalScore: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
                finalScoreWithChip: fc.integer({ min: -1000, max: 1000 }).map(n => n / 10), // 小数点1位まで
              }),
              { minLength: 3, maxLength: 4 }
            ),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        (memberId, games) => {
          const result = calculateMemberTotalScore(memberId, games);
          
          // 手動で参加半荘数をカウント
          const expectedGamesPlayed = games.filter(game =>
            game.results.some(r => r.memberId === memberId)
          ).length;
          
          expect(result.gamesPlayed).toBe(expectedGamesPlayed);
        }
      ),
      { numRuns: 100 }
    );
  });
});


