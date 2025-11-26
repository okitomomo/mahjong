/**
 * メンバーサービスのプロパティベーステスト
 * Property-based tests for member service
 * 
 * Feature: mahjong-score-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { memberConverter, createNewMember } from '../../models/converters.js';

/**
 * Feature: mahjong-score-management, Property 7: メンバー情報の永続化
 * Validates: Requirements 2.5, 7.2
 */
describe('Property 7: メンバー情報の永続化', () => {
  it('メンバーデータをFirestore形式に変換して戻すと同じデータが得られる', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          roomId: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (data) => {
          const member = {
            id: 'test-member-id',
            userId: data.userId,
            roomId: data.roomId,
            name: data.name,
            joinedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
          };
          
          // toFirestore -> fromFirestore のラウンドトリップ
          const firestoreData = memberConverter.toFirestore(member);
          
          // fromFirestoreをシミュレート
          const mockSnapshot = {
            id: member.id,
            data: () => firestoreData,
          };
          
          const restored = memberConverter.fromFirestore(mockSnapshot);
          
          // 全てのフィールドが保持されていることを確認
          expect(restored.id).toBe(member.id);
          expect(restored.userId).toBe(member.userId);
          expect(restored.roomId).toBe(member.roomId);
          expect(restored.name).toBe(member.name);
          expect(restored.joinedAt).toEqual(member.joinedAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('createNewMemberで作成したメンバーは必須フィールドを全て持つ', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          roomId: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (data) => {
          const member = createNewMember(data.userId, data.roomId, data.name);
          
          // 必須フィールドの存在確認
          expect(member.userId).toBe(data.userId);
          expect(member.roomId).toBe(data.roomId);
          expect(member.name).toBe(data.name);
          expect(member.joinedAt).toBeDefined();
          
          // joinedAtがTimestampオブジェクトであることを確認
          expect(member.joinedAt).toHaveProperty('seconds');
          expect(member.joinedAt).toHaveProperty('nanoseconds');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('異なるメンバーデータは異なる値として保存される', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId1: fc.uuid(),
          userId2: fc.uuid(),
          roomId: fc.uuid(),
          name1: fc.string({ minLength: 1, maxLength: 50 }),
          name2: fc.string({ minLength: 1, maxLength: 50 }),
        }).filter(data => data.userId1 !== data.userId2 || data.name1 !== data.name2),
        (data) => {
          const member1 = createNewMember(data.userId1, data.roomId, data.name1);
          const member2 = createNewMember(data.userId2, data.roomId, data.name2);
          
          // 少なくとも1つのフィールドが異なることを確認
          const isDifferent = 
            member1.userId !== member2.userId ||
            member1.name !== member2.name;
          
          expect(isDifferent).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('メンバー名に特殊文字が含まれていても正しく保存される', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          roomId: fc.uuid(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (data) => {
          const member = {
            id: 'test-member-id',
            userId: data.userId,
            roomId: data.roomId,
            name: data.name,
            joinedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
          };
          
          // Firestoreに変換
          const firestoreData = memberConverter.toFirestore(member);
          
          // 名前が正しく保存されることを確認
          expect(firestoreData.name).toBe(data.name);
          
          // 復元
          const mockSnapshot = {
            id: member.id,
            data: () => firestoreData,
          };
          
          const restored = memberConverter.fromFirestore(mockSnapshot);
          
          // 名前が正しく復元されることを確認
          expect(restored.name).toBe(data.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('同じ部屋に複数のメンバーを追加できる', () => {
    fc.assert(
      fc.property(
        fc.record({
          roomId: fc.uuid(),
          members: fc.array(
            fc.record({
              userId: fc.uuid(),
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (data) => {
          const createdMembers = data.members.map(m => 
            createNewMember(m.userId, data.roomId, m.name)
          );
          
          // 全てのメンバーが同じroomIdを持つことを確認
          createdMembers.forEach(member => {
            expect(member.roomId).toBe(data.roomId);
          });
          
          // 各メンバーが正しいuserIdとnameを持つことを確認
          createdMembers.forEach((member, index) => {
            expect(member.userId).toBe(data.members[index].userId);
            expect(member.name).toBe(data.members[index].name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
