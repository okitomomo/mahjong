/**
 * メンバー抽出ユーティリティのプロパティベーステスト
 * Property-based tests for member extraction utilities
 * 
 * Feature: bug-fixes
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { extractUniqueMembers, formatMemberNames } from '../memberExtractor.js';
import { GAME_STATUS } from '../../models/constants.js';

/**
 * Feature: bug-fixes, Property 1: 部屋一覧にメンバー名が表示される
 * Validates: Requirements 1.1
 */
describe('Property 1: 部屋一覧にメンバー名が表示される', () => {
  it('ゲームに参加しているメンバーの名前が抽出される', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            roomId: fc.uuid(),
            gameNumber: fc.integer({ min: 1, max: 100 }),
            status: fc.constantFrom(GAME_STATUS.INPUTTING, GAME_STATUS.COMPLETED),
            results: fc.array(
              fc.record({
                memberId: fc.uuid(),
                memberName: fc.string({ minLength: 1, maxLength: 50 }),
                rawScore: fc.option(fc.integer({ min: 0, max: 200000 })),
              }),
              { minLength: 1, maxLength: 4 }
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (games) => {
          const members = extractUniqueMembers(games);
          
          // 各ゲームの各メンバーが抽出されたメンバーリストに含まれることを確認
          games.forEach(game => {
            game.results.forEach(result => {
              const found = members.find(m => m.id === result.memberId);
              expect(found).toBeDefined();
              expect(found.name).toBe(result.memberName);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('抽出されたメンバーリストをフォーマットすると名前が含まれる', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (members) => {
          const formatted = formatMemberNames(members);
          
          // フォーマットされた文字列に各メンバーの名前が含まれることを確認
          // （最大表示数を超える場合は一部のみ）
          const maxDisplay = 3;
          const displayMembers = members.slice(0, Math.min(members.length, maxDisplay));
          
          displayMembers.forEach(member => {
            expect(formatted).toContain(member.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('空のゲームリストの場合、空のメンバーリストが返される', () => {
    const games = [];
    const members = extractUniqueMembers(games);
    
    expect(members).toEqual([]);
  });

  it('空のメンバーリストの場合、「参加者なし」と表示される', () => {
    const members = [];
    const formatted = formatMemberNames(members);
    
    expect(formatted).toBe('参加者なし');
  });
});

/**
 * Feature: bug-fixes, Property 2: すべてのメンバー名が表示される
 * Validates: Requirements 1.2
 */
describe('Property 2: すべてのメンバー名が表示される', () => {
  it('複数のメンバーがいる場合、すべてのメンバーが抽出される', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            roomId: fc.uuid(),
            gameNumber: fc.integer({ min: 1, max: 100 }),
            status: fc.constantFrom(GAME_STATUS.INPUTTING, GAME_STATUS.COMPLETED),
            results: fc.array(
              fc.record({
                memberId: fc.uuid(),
                memberName: fc.string({ minLength: 1, maxLength: 50 }),
                rawScore: fc.option(fc.integer({ min: 0, max: 200000 })),
              }),
              { minLength: 3, maxLength: 4 }
            ).filter(results => {
              // 全てのメンバーIDが一意であることを確認
              const ids = results.map(r => r.memberId);
              return new Set(ids).size === ids.length;
            }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (games) => {
          const members = extractUniqueMembers(games);
          
          // 全てのユニークなメンバーが抽出されることを確認
          const allMemberIds = new Set();
          games.forEach(game => {
            game.results.forEach(result => {
              allMemberIds.add(result.memberId);
            });
          });
          
          expect(members.length).toBe(allMemberIds.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('3人以下のメンバーの場合、すべての名前が表示される', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 3 }
        ).filter(members => {
          // 全てのメンバーIDが一意であることを確認
          const ids = members.map(m => m.id);
          return new Set(ids).size === ids.length;
        }),
        (members) => {
          const formatted = formatMemberNames(members);
          
          // すべてのメンバー名が含まれることを確認
          members.forEach(member => {
            expect(formatted).toContain(member.name);
          });
          
          // 「他X名」が含まれないことを確認
          expect(formatted).not.toContain('他');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('4人以上のメンバーの場合、最初の3人と「他X名」が表示される', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 4, maxLength: 10 }
        ).filter(members => {
          // 全てのメンバーIDが一意であることを確認
          const ids = members.map(m => m.id);
          return new Set(ids).size === ids.length;
        }),
        (members) => {
          const formatted = formatMemberNames(members);
          
          // 最初の3人の名前が含まれることを確認
          members.slice(0, 3).forEach(member => {
            expect(formatted).toContain(member.name);
          });
          
          // 「他X名」が含まれることを確認
          const remaining = members.length - 3;
          expect(formatted).toContain(`他${remaining}名`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('同じメンバーが複数のゲームに参加している場合、重複せずに抽出される', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          member: fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          gameCount: fc.integer({ min: 2, max: 10 }),
        }),
        (data) => {
          // 同じメンバーが複数のゲームに参加
          const games = Array.from({ length: data.gameCount }, (_, i) => ({
            id: `game-${i}`,
            roomId: data.roomId,
            gameNumber: i + 1,
            status: GAME_STATUS.COMPLETED,
            results: [
              {
                memberId: data.member.id,
                memberName: data.member.name,
                rawScore: 25000,
              },
            ],
          }));
          
          const members = extractUniqueMembers(games);
          
          // メンバーが1人だけ抽出されることを確認
          expect(members.length).toBe(1);
          expect(members[0].id).toBe(data.member.id);
          expect(members[0].name).toBe(data.member.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('複数のゲームから異なるメンバーを抽出できる', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          games: fc.array(
            fc.record({
              gameNumber: fc.integer({ min: 1, max: 100 }),
              members: fc.array(
                fc.record({
                  id: fc.uuid(),
                  name: fc.string({ minLength: 1, maxLength: 50 }),
                }),
                { minLength: 3, maxLength: 4 }
              ).filter(members => {
                const ids = members.map(m => m.id);
                return new Set(ids).size === ids.length;
              }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
        }),
        (data) => {
          const games = data.games.map((gameData, i) => ({
            id: `game-${i}`,
            roomId: data.roomId,
            gameNumber: gameData.gameNumber,
            status: GAME_STATUS.COMPLETED,
            results: gameData.members.map(member => ({
              memberId: member.id,
              memberName: member.name,
              rawScore: 25000,
            })),
          }));
          
          const members = extractUniqueMembers(games);
          
          // 全てのユニークなメンバーが抽出されることを確認
          const allMemberIds = new Set();
          data.games.forEach(gameData => {
            gameData.members.forEach(member => {
              allMemberIds.add(member.id);
            });
          });
          
          expect(members.length).toBe(allMemberIds.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('resultsが空のゲームがあっても正常に動作する', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          gamesWithMembers: fc.array(
            fc.record({
              gameNumber: fc.integer({ min: 1, max: 100 }),
              results: fc.array(
                fc.record({
                  memberId: fc.uuid(),
                  memberName: fc.string({ minLength: 1, maxLength: 50 }),
                }),
                { minLength: 1, maxLength: 4 }
              ),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          emptyGamesCount: fc.integer({ min: 1, max: 3 }),
        }),
        (data) => {
          // メンバーがいるゲーム
          const gamesWithMembers = data.gamesWithMembers.map((gameData, i) => ({
            id: `game-${i}`,
            roomId: data.roomId,
            gameNumber: gameData.gameNumber,
            status: GAME_STATUS.INPUTTING,
            results: gameData.results.map(result => ({
              memberId: result.memberId,
              memberName: result.memberName,
            })),
          }));
          
          // 空のゲーム
          const emptyGames = Array.from({ length: data.emptyGamesCount }, (_, i) => ({
            id: `empty-game-${i}`,
            roomId: data.roomId,
            gameNumber: 100 + i,
            status: GAME_STATUS.INPUTTING,
            results: [],
          }));
          
          const allGames = [...gamesWithMembers, ...emptyGames];
          const members = extractUniqueMembers(allGames);
          
          // メンバーがいるゲームからのみメンバーが抽出されることを確認
          const expectedMemberIds = new Set();
          data.gamesWithMembers.forEach(gameData => {
            gameData.results.forEach(result => {
              expectedMemberIds.add(result.memberId);
            });
          });
          
          expect(members.length).toBe(expectedMemberIds.size);
        }
      ),
      { numRuns: 100 }
    );
  });
});
