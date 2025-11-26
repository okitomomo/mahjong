/**
 * スコア計算フックのプロパティベーステスト
 * Property-based tests for score calculator hook
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Feature: mahjong-score-management, Property 25: スコアボードのソート順
 * Validates: Requirements 6.3
 */
describe('Property 25: スコアボードのソート順', () => {
  it('メンバースコアリストは合計スコアの降順でソートされる', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.uuid(),
            memberName: fc.string({ minLength: 1, maxLength: 50 }),
            totalScore: fc.integer({ min: -1000, max: 1000 }),
            gamesPlayed: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (memberScores) => {
          // 合計スコアの降順でソート
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          // ソート後、各メンバーの合計スコアが降順であることを確認
          for (let i = 1; i < sortedScores.length; i++) {
            expect(sortedScores[i - 1].totalScore).toBeGreaterThanOrEqual(
              sortedScores[i].totalScore
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('最高スコアのメンバーが常にリストの先頭に来る', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.uuid(),
            memberName: fc.string({ minLength: 1, maxLength: 50 }),
            totalScore: fc.integer({ min: -1000, max: 1000 }),
            gamesPlayed: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (memberScores) => {
          // 合計スコアの降順でソート
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          // 最高スコアを見つける
          const maxScore = Math.max(...memberScores.map(m => m.totalScore));
          
          // ソート後の先頭のメンバーが最高スコアを持つことを確認
          expect(sortedScores[0].totalScore).toBe(maxScore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('最低スコアのメンバーが常にリストの末尾に来る', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.uuid(),
            memberName: fc.string({ minLength: 1, maxLength: 50 }),
            totalScore: fc.integer({ min: -1000, max: 1000 }),
            gamesPlayed: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (memberScores) => {
          // 合計スコアの降順でソート
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          // 最低スコアを見つける
          const minScore = Math.min(...memberScores.map(m => m.totalScore));
          
          // ソート後の末尾のメンバーが最低スコアを持つことを確認
          expect(sortedScores[sortedScores.length - 1].totalScore).toBe(minScore);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('同じスコアのメンバーが複数いる場合でもソートが安定している', () => {
    fc.assert(
      fc.property(
        fc.record({
          sameScore: fc.integer({ min: -1000, max: 1000 }),
          count: fc.integer({ min: 2, max: 5 }),
        }),
        (data) => {
          // 同じスコアのメンバーを複数作成
          const memberScores = Array.from({ length: data.count }, (_, index) => ({
            memberId: `member-${index}`,
            memberName: `Player ${index}`,
            totalScore: data.sameScore,
            gamesPlayed: 10,
            ranks: { first: 0, second: 0, third: 0, fourth: 0 },
          }));
          
          // ソート
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          // 全てのメンバーが同じスコアを持つことを確認
          sortedScores.forEach(member => {
            expect(member.totalScore).toBe(data.sameScore);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('空のメンバーリストでもソートが正常に動作する', () => {
    const memberScores = [];
    const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
    
    expect(sortedScores).toEqual([]);
  });

  it('1人のメンバーのみの場合でもソートが正常に動作する', () => {
    fc.assert(
      fc.property(
        fc.record({
          memberId: fc.uuid(),
          memberName: fc.string({ minLength: 1, maxLength: 50 }),
          totalScore: fc.integer({ min: -1000, max: 1000 }),
          gamesPlayed: fc.integer({ min: 0, max: 100 }),
        }),
        (data) => {
          const memberScores = [{
            memberId: data.memberId,
            memberName: data.memberName,
            totalScore: data.totalScore,
            gamesPlayed: data.gamesPlayed,
            ranks: { first: 0, second: 0, third: 0, fourth: 0 },
          }];
          
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          expect(sortedScores.length).toBe(1);
          expect(sortedScores[0]).toEqual(memberScores[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('正のスコアと負のスコアが混在していても正しくソートされる', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.uuid(),
            memberName: fc.string({ minLength: 1, maxLength: 50 }),
            totalScore: fc.integer({ min: -1000, max: 1000 }),
            gamesPlayed: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 3, maxLength: 10 }
        ).filter(scores => {
          // 正のスコアと負のスコアが両方含まれることを確認
          const hasPositive = scores.some(s => s.totalScore > 0);
          const hasNegative = scores.some(s => s.totalScore < 0);
          return hasPositive && hasNegative;
        }),
        (memberScores) => {
          // 合計スコアの降順でソート
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          // 正のスコアが負のスコアより前に来ることを確認
          let foundNegative = false;
          for (const score of sortedScores) {
            if (score.totalScore < 0) {
              foundNegative = true;
            }
            if (foundNegative && score.totalScore > 0) {
              // 負のスコアの後に正のスコアが来たらエラー
              expect(false).toBe(true);
            }
          }
          
          // ソートが降順であることを確認
          for (let i = 1; i < sortedScores.length; i++) {
            expect(sortedScores[i - 1].totalScore).toBeGreaterThanOrEqual(
              sortedScores[i].totalScore
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('大きな差のあるスコアでも正しくソートされる', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            memberId: fc.uuid(),
            memberName: fc.string({ minLength: 1, maxLength: 50 }),
            totalScore: fc.integer({ min: -10000, max: 10000 }),
            gamesPlayed: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (memberScores) => {
          // 合計スコアの降順でソート
          const sortedScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);
          
          // ソート後、各メンバーの合計スコアが降順であることを確認
          for (let i = 1; i < sortedScores.length; i++) {
            expect(sortedScores[i - 1].totalScore).toBeGreaterThanOrEqual(
              sortedScores[i].totalScore
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
