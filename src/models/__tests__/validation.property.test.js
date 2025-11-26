/**
 * バリデーションのプロパティベーステスト
 * Property-based tests for validation
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateGamePlayerCount,
  validateGameTotalScore,
  validateGameAllSubmitted,
  validateScoreRange,
  isGameCompleted,
  isValidScoreIncrement,
  validateOkaSettingsRange,
  validateYakitoriSettingsRange,
} from '../validation.js';
import { TOTAL_SCORE_3_PLAYER, TOTAL_SCORE_4_PLAYER, GAME_STATUS } from '../constants.js';

/**
 * Feature: mahjong-score-management, Property 11: 半荘検証 - 人数チェック
 * Validates: Requirements 4.1
 */
describe('Property 11: 半荘検証 - 人数チェック', () => {
  it('入力数が3人または4人の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        (playerCount) => {
          // 指定された人数分の結果を生成
          const results = Array.from({ length: playerCount }, (_, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: 25000,
          }));
          
          const isValid = validateGamePlayerCount(results);
          
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('入力数が3人または4人でない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }).filter(n => n !== 3 && n !== 4), // invalid playerCount
        (playerCount) => {
          // 指定された人数分の結果を生成
          const results = Array.from({ length: playerCount }, (_, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: 25000,
          }));
          
          const isValid = validateGamePlayerCount(results);
          
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 12: 半荘検証 - 得点合計チェック
 * Validates: Requirements 4.2
 */
describe('Property 12: 半荘検証 - 得点合計チェック', () => {
  it('3人麻雀で得点合計が105000点の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 105000 }), { minLength: 3, maxLength: 3 }),
        (scores) => {
          // 合計が105000になるように調整
          const total = scores.reduce((sum, s) => sum + s, 0);
          const diff = TOTAL_SCORE_3_PLAYER - total;
          const adjustedScores = [...scores];
          adjustedScores[0] += diff;
          
          const results = adjustedScores.map((score, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: score,
          }));
          
          const isValid = validateGameTotalScore(results);
          
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('4人麻雀で得点合計が100000点の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100000 }), { minLength: 4, maxLength: 4 }),
        (scores) => {
          // 合計が100000になるように調整
          const total = scores.reduce((sum, s) => sum + s, 0);
          const diff = TOTAL_SCORE_4_PLAYER - total;
          const adjustedScores = [...scores];
          adjustedScores[0] += diff;
          
          const results = adjustedScores.map((score, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: score,
          }));
          
          const isValid = validateGameTotalScore(results);
          
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('得点合計が正しくない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        fc.integer({ min: -10000, max: 10000 }).filter(n => n !== 0), // offset (not zero)
        (playerCount, offset) => {
          const expectedTotal = playerCount === 3 ? TOTAL_SCORE_3_PLAYER : TOTAL_SCORE_4_PLAYER;
          const scorePerPlayer = Math.floor(expectedTotal / playerCount);
          
          const results = Array.from({ length: playerCount }, (_, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: i === 0 ? scorePerPlayer + offset : scorePerPlayer,
          }));
          
          const isValid = validateGameTotalScore(results);
          
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 13: 半荘検証 - 入力完了チェック
 * Validates: Requirements 4.3
 */
describe('Property 13: 半荘検証 - 入力完了チェック', () => {
  it('全員が得点を入力している場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        (playerCount) => {
          const results = Array.from({ length: playerCount }, (_, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: 25000,
          }));
          
          const isValid = validateGameAllSubmitted(results);
          
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('未入力の得点がある場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        fc.integer({ min: 0, max: 3 }), // index of unsubmitted player
        (playerCount, unsubmittedIndex) => {
          if (unsubmittedIndex >= playerCount) return; // skip if index out of range
          
          const results = Array.from({ length: playerCount }, (_, i) => ({
            memberId: `member${i}`,
            memberName: `Player ${i}`,
            rawScore: i === unsubmittedIndex ? undefined : 25000,
          }));
          
          const isValid = validateGameAllSubmitted(results);
          
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('結果配列が空の場合、検証は失敗する', () => {
    const results = [];
    const isValid = validateGameAllSubmitted(results);
    expect(isValid).toBe(false);
  });
});

/**
 * Feature: bug-fixes, Property 5: 得点バリデーションは100の倍数のみ受け入れる
 * Validates: Requirements 3.1
 */
describe('Property 5: 得点バリデーションは100の倍数のみ受け入れる', () => {
  it('100の倍数の得点の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2000 }), // multiplier
        (multiplier) => {
          const score = multiplier * 100;
          const isValid = isValidScoreIncrement(score);
          
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: bug-fixes, Property 6: 無効な得点はエラーを返す
 * Validates: Requirements 3.2
 */
describe('Property 6: 無効な得点はエラーを返す', () => {
  it('100の倍数でない得点の場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200000 }).filter(n => n % 100 !== 0), // not multiple of 100
        (score) => {
          const isValid = isValidScoreIncrement(score);
          
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('100の倍数でない得点の場合、validateScoreRangeはエラーを返す', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 200000 }).filter(n => n % 100 !== 0), // not multiple of 100
        (score) => {
          const result = validateScoreRange(score);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBe('得点は100点刻みで入力してください');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: mahjong-score-management, Property 8: 得点入力の妥当性検証
 * Validates: Requirements 3.4
 */
describe('Property 8: 得点入力の妥当性検証', () => {
  it('有効な得点（0-200000の範囲内、100の倍数）の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2000 }), // multiplier
        (multiplier) => {
          const score = multiplier * 100;
          const result = validateScoreRange(score);
          
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('負の得点の場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100000, max: -1 }), // negative score
        (score) => {
          const result = validateScoreRange(score);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('200000点を超える得点の場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200001, max: 1000000 }), // score over limit
        (score) => {
          const result = validateScoreRange(score);
          
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('非数値の場合、検証は失敗する', () => {
    const invalidValues = [
      undefined,
      null,
      'string',
      NaN,
      Infinity,
      -Infinity,
      {},
      [],
    ];
    
    invalidValues.forEach((value) => {
      const result = validateScoreRange(value);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

/**
 * Feature: mahjong-score-management, Property 16: 確定後の変更不可
 * Validates: Requirements 4.6
 */
describe('Property 16: 確定後の変更不可', () => {
  it('確定済み（completed）の半荘は変更不可と判定される', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        (playerCount) => {
          const game = {
            id: 'game1',
            roomId: 'room1',
            gameNumber: 1,
            createdAt: new Date(),
            status: GAME_STATUS.COMPLETED,
            playerCount,
            results: Array.from({ length: playerCount }, (_, i) => ({
              memberId: `member${i}`,
              memberName: `Player ${i}`,
              rawScore: 25000,
              rank: i + 1,
              finalScore: 0,
            })),
          };
          
          const isCompleted = isGameCompleted(game);
          
          expect(isCompleted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('入力中（inputting）の半荘は変更可能と判定される', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        (playerCount) => {
          const game = {
            id: 'game1',
            roomId: 'room1',
            gameNumber: 1,
            createdAt: new Date(),
            status: GAME_STATUS.INPUTTING,
            results: Array.from({ length: playerCount }, (_, i) => ({
              memberId: `member${i}`,
              memberName: `Player ${i}`,
            })),
          };
          
          const isCompleted = isGameCompleted(game);
          
          expect(isCompleted).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('無効（invalid）の半荘は変更可能と判定される', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(3, 4), // playerCount
        (playerCount) => {
          const game = {
            id: 'game1',
            roomId: 'room1',
            gameNumber: 1,
            createdAt: new Date(),
            status: GAME_STATUS.INVALID,
            results: Array.from({ length: playerCount }, (_, i) => ({
              memberId: `member${i}`,
              memberName: `Player ${i}`,
              rawScore: 25000,
            })),
          };
          
          const isCompleted = isGameCompleted(game);
          
          expect(isCompleted).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: room-settings-validation, Property 1: オカ設定は100点刻みである
 * Validates: Requirements 5.1
 */
describe('Property 1: オカ設定は100点刻みである', () => {
  it('開始点が100の倍数の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }), // multiplier for startPoints
        fc.integer({ min: 10, max: 1000 }), // multiplier for returnPoints
        (startMultiplier, returnMultiplier) => {
          const startPoints = startMultiplier * 100;
          const returnPoints = Math.max(startPoints, returnMultiplier * 100);
          
          const oka = { startPoints, returnPoints };
          const result = validateOkaSettingsRange(oka);
          
          // 範囲内であれば成功
          if (startPoints >= 1000 && startPoints <= 100000 && 
              returnPoints >= 1000 && returnPoints <= 100000) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('開始点が100の倍数でない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100000 }).filter(n => n % 100 !== 0), // not multiple of 100
        (startPoints) => {
          const returnPoints = startPoints + 100;
          
          const oka = { startPoints, returnPoints };
          const result = validateOkaSettingsRange(oka);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('開始点は100点刻みで入力してください');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('返し点が100の倍数でない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }), // multiplier for startPoints
        fc.integer({ min: 1000, max: 100000 }).filter(n => n % 100 !== 0), // returnPoints not multiple of 100
        (startMultiplier, returnPoints) => {
          const startPoints = startMultiplier * 100;
          
          const oka = { startPoints, returnPoints };
          const result = validateOkaSettingsRange(oka);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('返し点は100点刻みで入力してください');
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: room-settings-validation, Property 2: 返し点は開始点以上である
 * Validates: Requirements 5.2
 */
describe('Property 2: 返し点は開始点以上である', () => {
  it('返し点が開始点以上の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }), // multiplier for startPoints
        fc.integer({ min: 0, max: 1000 }), // additional multiplier for returnPoints
        (startMultiplier, additionalMultiplier) => {
          const startPoints = startMultiplier * 100;
          const returnPoints = startPoints + (additionalMultiplier * 100);
          
          const oka = { startPoints, returnPoints };
          const result = validateOkaSettingsRange(oka);
          
          // 範囲内であれば成功
          if (startPoints >= 1000 && startPoints <= 100000 && 
              returnPoints >= 1000 && returnPoints <= 100000) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('返し点が開始点未満の場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 1000 }), // multiplier for startPoints
        fc.integer({ min: 1, max: 19 }), // smaller multiplier for returnPoints
        (startMultiplier, returnMultiplier) => {
          const startPoints = startMultiplier * 100;
          const returnPoints = returnMultiplier * 100;
          
          const oka = { startPoints, returnPoints };
          const result = validateOkaSettingsRange(oka);
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('返し点は開始点以上で入力してください');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('返し点と開始点が同じ場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 1000 }), // multiplier
        (multiplier) => {
          const points = multiplier * 100;
          
          const oka = { startPoints: points, returnPoints: points };
          const result = validateOkaSettingsRange(oka);
          
          // 範囲内であれば成功
          if (points >= 1000 && points <= 100000) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: room-settings-validation, Property 3: ヤキトリペナルティは正の値である
 * Validates: Requirements 6.1
 */
describe('Property 3: ヤキトリペナルティは正の値である', () => {
  it('ペナルティが正の値の場合、検証は成功する（2と3の公倍数）', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }), // multiplier for LCM(2,3)=6
        (multiplier) => {
          const penalty = multiplier * 6; // 6の倍数は2でも3でも割り切れる
          
          const yakitori = { enabled: true, penalty };
          const result = validateYakitoriSettingsRange(yakitori);
          
          // 範囲内であれば成功
          if (penalty >= 0 && penalty <= 100) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ペナルティが負の値の場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: -1 }), // negative penalty
        (penalty) => {
          const yakitori = { enabled: true, penalty };
          const result = validateYakitoriSettingsRange(yakitori);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('正の値'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ペナルティが0の場合、検証は成功する', () => {
    const yakitori = { enabled: true, penalty: 0 };
    const result = validateYakitoriSettingsRange(yakitori);
    
    expect(result.valid).toBe(true);
  });
});

/**
 * Feature: room-settings-validation, Property 4: ヤキトリペナルティは2でも3でも割り切れる
 * Validates: Requirements 6.2
 */
describe('Property 4: ヤキトリペナルティは2でも3でも割り切れる', () => {
  it('2でも3でも割り切れる数値の場合、検証は成功する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 16 }), // multiplier for LCM(2,3)=6
        (multiplier) => {
          const penalty = multiplier * 6; // 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96
          
          const yakitori = { enabled: true, penalty };
          const result = validateYakitoriSettingsRange(yakitori);
          
          // 範囲内であれば成功
          if (penalty >= 0 && penalty <= 100) {
            expect(result.valid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('2で割り切れるが3で割り切れない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }).filter(n => n % 2 === 0 && n % 3 !== 0), // divisible by 2 but not 3
        (penalty) => {
          const yakitori = { enabled: true, penalty };
          const result = validateYakitoriSettingsRange(yakitori);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('2でも3でも割り切れる'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('3で割り切れるが2で割り切れない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 33 }).filter(n => n % 3 === 0 && n % 2 !== 0), // divisible by 3 but not 2
        (penalty) => {
          const yakitori = { enabled: true, penalty };
          const result = validateYakitoriSettingsRange(yakitori);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('2でも3でも割り切れる'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('2でも3でも割り切れない場合、検証は失敗する', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).filter(n => n % 2 !== 0 && n % 3 !== 0), // not divisible by 2 or 3
        (penalty) => {
          const yakitori = { enabled: true, penalty };
          const result = validateYakitoriSettingsRange(yakitori);
          
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.includes('2でも3でも割り切れる'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
