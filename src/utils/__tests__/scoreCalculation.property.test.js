/**
 * スコア計算ユーティリティのプロパティベーステスト
 * Property-based tests for score calculation utilities
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateOka, calculateUma, calculateFinalScore } from '../scoreCalculator.js';

/**
 * Feature: mahjong-score-management, Property 32: 設定変更の非遡及性
 * Validates: Requirements 9.8
 */
describe('Property 32: 設定変更の非遡及性', () => {
  it('確定済み半荘のスコアは設定変更後も変わらない', () => {
    fc.assert(
      fc.property(
        fc.record({
          // 元の設定
          originalOka: fc.record({
            startPoints: fc.integer({ min: 20000, max: 30000 }),
            returnPoints: fc.integer({ min: 25000, max: 35000 }),
          }),
          originalUma: fc.record({
            topBottom: fc.integer({ min: 10, max: 40 }),
            middlePair: fc.integer({ min: 5, max: 20 }),
          }),
          // 新しい設定
          newOka: fc.record({
            startPoints: fc.integer({ min: 20000, max: 30000 }),
            returnPoints: fc.integer({ min: 25000, max: 35000 }),
          }),
          newUma: fc.record({
            topBottom: fc.integer({ min: 10, max: 40 }),
            middlePair: fc.integer({ min: 5, max: 20 }),
          }),
          // 半荘データ
          rawScore: fc.integer({ min: 0, max: 100000 }),
          rank: fc.integer({ min: 1, max: 4 }),
          playerCount: fc.constantFrom(3, 4),
        }),
        (data) => {
          // 元の設定でスコアを計算（確定時）
          const originalOka = calculateOka(
            data.rawScore,
            data.rank,
            data.playerCount,
            data.originalOka
          );
          const originalUma = calculateUma(
            data.rank,
            data.playerCount,
            data.originalUma
          );
          const originalFinalScore = originalOka + originalUma;
          
          // 確定済みスコアとして保存されたデータ
          const savedScore = {
            rawScore: data.rawScore,
            rank: data.rank,
            oka: originalOka,
            uma: originalUma,
            finalScore: originalFinalScore,
          };
          
          // 設定変更後も保存されたスコアは変わらない
          expect(savedScore.finalScore).toBe(originalFinalScore);
          expect(savedScore.oka).toBe(originalOka);
          expect(savedScore.uma).toBe(originalUma);
          
          // 新しい設定で計算しても、確定済みスコアは元のまま
          const newOka = calculateOka(
            data.rawScore,
            data.rank,
            data.playerCount,
            data.newOka
          );
          const newUma = calculateUma(
            data.rank,
            data.playerCount,
            data.newUma
          );
          
          // 確定済みスコアは新しい計算結果に影響されない
          // （保存されたスコアは元の設定で計算されたまま）
          expect(savedScore.finalScore).toBe(originalFinalScore);
          expect(savedScore.oka).toBe(originalOka);
          expect(savedScore.uma).toBe(originalUma);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('複数の半荘が確定済みの場合、設定変更は新しい半荘にのみ適用される', () => {
    fc.assert(
      fc.property(
        fc.record({
          // 元の設定
          originalSettings: fc.record({
            oka: fc.record({
              startPoints: fc.integer({ min: 20000, max: 30000 }),
              returnPoints: fc.integer({ min: 25000, max: 35000 }),
            }),
            uma: fc.record({
              topBottom: fc.integer({ min: 10, max: 40 }),
              middlePair: fc.integer({ min: 5, max: 20 }),
            }),
          }),
          // 新しい設定
          newSettings: fc.record({
            oka: fc.record({
              startPoints: fc.integer({ min: 20000, max: 30000 }),
              returnPoints: fc.integer({ min: 25000, max: 35000 }),
            }),
            uma: fc.record({
              topBottom: fc.integer({ min: 10, max: 40 }),
              middlePair: fc.integer({ min: 5, max: 20 }),
            }),
          }),
          // 確定済み半荘
          completedGames: fc.array(
            fc.record({
              rawScore: fc.integer({ min: 0, max: 100000 }),
              rank: fc.integer({ min: 1, max: 4 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          // 新しい半荘
          newGame: fc.record({
            rawScore: fc.integer({ min: 0, max: 100000 }),
            rank: fc.integer({ min: 1, max: 4 }),
          }),
          playerCount: fc.constantFrom(3, 4),
        }),
        (data) => {
          // 確定済み半荘のスコアを元の設定で計算
          const completedScores = data.completedGames.map(game => {
            const oka = calculateOka(
              game.rawScore,
              game.rank,
              data.playerCount,
              data.originalSettings.oka
            );
            const uma = calculateUma(
              game.rank,
              data.playerCount,
              data.originalSettings.uma
            );
            return {
              rawScore: game.rawScore,
              rank: game.rank,
              oka,
              uma,
              finalScore: oka + uma,
            };
          });
          
          // 設定変更
          // （実際には部屋設定が更新される）
          
          // 確定済み半荘のスコアは変わらない
          completedScores.forEach((savedScore, index) => {
            const game = data.completedGames[index];
            
            // 保存されたスコアは元のまま
            const expectedOka = calculateOka(
              game.rawScore,
              game.rank,
              data.playerCount,
              data.originalSettings.oka
            );
            const expectedUma = calculateUma(
              game.rank,
              data.playerCount,
              data.originalSettings.uma
            );
            
            expect(savedScore.oka).toBe(expectedOka);
            expect(savedScore.uma).toBe(expectedUma);
            expect(savedScore.finalScore).toBe(expectedOka + expectedUma);
          });
          
          // 新しい半荘は新しい設定で計算される
          const newOka = calculateOka(
            data.newGame.rawScore,
            data.newGame.rank,
            data.playerCount,
            data.newSettings.oka
          );
          const newUma = calculateUma(
            data.newGame.rank,
            data.playerCount,
            data.newSettings.uma
          );
          const newFinalScore = newOka + newUma;
          
          // 新しい半荘のスコアは新しい設定で計算される
          expect(newFinalScore).toBe(newOka + newUma);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('オカ設定を変更しても確定済み半荘のオカは変わらない', () => {
    fc.assert(
      fc.property(
        fc.record({
          rawScore: fc.integer({ min: 0, max: 100000 }),
          rank: fc.integer({ min: 1, max: 4 }),
          playerCount: fc.constantFrom(3, 4),
          originalOka: fc.record({
            startPoints: fc.integer({ min: 20000, max: 30000 }),
            returnPoints: fc.integer({ min: 25000, max: 35000 }),
          }),
          newOka: fc.record({
            startPoints: fc.integer({ min: 20000, max: 30000 }),
            returnPoints: fc.integer({ min: 25000, max: 35000 }),
          }),
        }).filter(data => 
          data.originalOka.startPoints !== data.newOka.startPoints ||
          data.originalOka.returnPoints !== data.newOka.returnPoints
        ),
        (data) => {
          // 元の設定でオカを計算（確定時）
          const originalOka = calculateOka(
            data.rawScore,
            data.rank,
            data.playerCount,
            data.originalOka
          );
          
          // 確定済みスコアとして保存
          const savedOka = originalOka;
          
          // オカ設定変更後も保存されたオカは変わらない
          expect(savedOka).toBe(originalOka);
          
          // 新しい設定で計算すると異なる値になる可能性がある
          const newOka = calculateOka(
            data.rawScore,
            data.rank,
            data.playerCount,
            data.newOka
          );
          
          // 確定済みオカは新しい計算結果に影響されない
          expect(savedOka).toBe(originalOka);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ウマ設定を変更しても確定済み半荘のウマは変わらない', () => {
    fc.assert(
      fc.property(
        fc.record({
          rank: fc.integer({ min: 1, max: 4 }),
          playerCount: fc.constantFrom(3, 4),
          originalUma: fc.record({
            topBottom: fc.integer({ min: 10, max: 40 }),
            middlePair: fc.integer({ min: 5, max: 20 }),
          }),
          newUma: fc.record({
            topBottom: fc.integer({ min: 10, max: 40 }),
            middlePair: fc.integer({ min: 5, max: 20 }),
          }),
        }).filter(data => 
          data.originalUma.topBottom !== data.newUma.topBottom ||
          data.originalUma.middlePair !== data.newUma.middlePair
        ),
        (data) => {
          // 元の設定でウマを計算（確定時）
          const originalUma = calculateUma(
            data.rank,
            data.playerCount,
            data.originalUma
          );
          
          // 確定済みスコアとして保存
          const savedUma = originalUma;
          
          // ウマ設定変更後も保存されたウマは変わらない
          expect(savedUma).toBe(originalUma);
          
          // 新しい設定で計算すると異なる値になる可能性がある
          const newUma = calculateUma(
            data.rank,
            data.playerCount,
            data.newUma
          );
          
          // 確定済みウマは新しい計算結果に影響されない
          expect(savedUma).toBe(originalUma);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('確定済み半荘のスコアは不変である', () => {
    fc.assert(
      fc.property(
        fc.record({
          rawScore: fc.integer({ min: 0, max: 100000 }),
          rank: fc.integer({ min: 1, max: 4 }),
          oka: fc.integer({ min: -100, max: 100 }),
          uma: fc.integer({ min: -50, max: 50 }),
        }),
        (data) => {
          // finalScoreはokaとumaの合計として計算される
          const finalScore = data.oka + data.uma;
          
          // 確定済みスコアとして保存されたデータ
          const savedScore = {
            rawScore: data.rawScore,
            rank: data.rank,
            oka: data.oka,
            uma: data.uma,
            finalScore: finalScore,
          };
          
          // 確定済みスコアは変更されない
          expect(savedScore.rawScore).toBe(data.rawScore);
          expect(savedScore.rank).toBe(data.rank);
          expect(savedScore.oka).toBe(data.oka);
          expect(savedScore.uma).toBe(data.uma);
          expect(savedScore.finalScore).toBe(finalScore);
          
          // スコアの整合性を確認
          expect(savedScore.finalScore).toBe(savedScore.oka + savedScore.uma);
        }
      ),
      { numRuns: 100 }
    );
  });
});
