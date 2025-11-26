/**
 * ユーザーID生成のプロパティテスト
 * Property tests for user ID generation
 * 
 * Feature: mahjong-score-management, Property 5: ユーザーIDの一意性
 */

import { describe, it, expect } from 'vitest';
import { generateUserId, isValidUserId } from '../userIdGenerator.js';

describe('ユーザーID生成', () => {
  /**
   * Property 5: ユーザーIDの一意性
   * 任意の2つの異なるユーザーに対して、それぞれのユーザーIDは異なる値でなければならない
   * Validates: Requirements 2.2, 8.1
   */
  it('生成されたユーザーIDは一意である', () => {
    const iterations = 1000;
    const generatedIds = new Set();
    
    for (let i = 0; i < iterations; i++) {
      const userId = generateUserId();
      
      // 有効なUUID形式であることを確認
      expect(isValidUserId(userId)).toBe(true);
      
      // 重複がないことを確認
      expect(generatedIds.has(userId)).toBe(false);
      
      generatedIds.add(userId);
    }
    
    // 全てのIDが一意であることを確認
    expect(generatedIds.size).toBe(iterations);
  });

  it('生成されたユーザーIDはUUID v4形式である', () => {
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const userId = generateUserId();
      
      // UUID v4形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(isValidUserId(userId)).toBe(true);
    }
  });

  it('isValidUserIdは有効なUUID v4を正しく判定する', () => {
    const validUuids = [
      '550e8400-e29b-41d4-a716-446655440000',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      '6ba7b810-9dad-41d1-80b4-00c04fd430c8', // v4に修正
    ];
    
    validUuids.forEach(uuid => {
      expect(isValidUserId(uuid)).toBe(true);
    });
  });

  it('isValidUserIdは無効なUUIDを正しく判定する', () => {
    const invalidUuids = [
      '',
      'not-a-uuid',
      '550e8400-e29b-41d4-a716',
      '550e8400-e29b-51d4-a716-446655440000', // バージョンが5
      '550e8400-e29b-41d4-c716-446655440000', // バリアントが不正
      123,
      null,
      undefined,
    ];
    
    invalidUuids.forEach(uuid => {
      expect(isValidUserId(uuid)).toBe(false);
    });
  });
});
