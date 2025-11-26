/**
 * Cookie管理のプロパティテスト
 * Property tests for cookie management
 * 
 * Feature: mahjong-score-management, Property 6: Cookie保存とラウンドトリップ
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import Cookies from 'js-cookie';
import {
  saveUserIdToCookie,
  getUserIdFromCookie,
  removeUserIdCookie,
  getOrCreateUserId,
} from '../cookieManager.js';
import { generateUserId, isValidUserId } from '../userIdGenerator.js';
import { COOKIE_KEYS } from '../../models/constants.js';

describe('Cookie管理', () => {
  // 各テストの前後でCookieをクリーンアップ
  beforeEach(() => {
    removeUserIdCookie();
  });

  afterEach(() => {
    removeUserIdCookie();
  });

  /**
   * Property 6: Cookie保存とラウンドトリップ
   * 任意のユーザーIDに対して、Cookieに保存した後に読み取ると同じIDが取得できなければならない
   * Validates: Requirements 2.3, 8.2, 8.3, 8.4
   */
  it('Cookieに保存したユーザーIDは読み取り時に同じ値が取得できる', () => {
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const userId = generateUserId();
      
      // Cookieに保存
      saveUserIdToCookie(userId);
      
      // 読み取り
      const retrievedUserId = getUserIdFromCookie();
      
      // 同じ値が取得できることを確認
      expect(retrievedUserId).toBe(userId);
      expect(isValidUserId(retrievedUserId)).toBe(true);
      
      // クリーンアップ
      removeUserIdCookie();
    }
  });

  it('生成されたユーザーIDをCookieに保存して読み取ると同じ値が取得できる', () => {
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const userId = generateUserId();
      
      // Cookieに保存
      saveUserIdToCookie(userId);
      
      // 読み取り
      const retrievedUserId = getUserIdFromCookie();
      
      // 同じ値が取得できることを確認
      expect(retrievedUserId).toBe(userId);
      expect(isValidUserId(retrievedUserId)).toBe(true);
      
      // クリーンアップ
      removeUserIdCookie();
    }
  });

  it('Cookieが存在しない場合はnullを返す', () => {
    removeUserIdCookie();
    
    const userId = getUserIdFromCookie();
    
    expect(userId).toBeNull();
  });

  it('無効なUUIDがCookieに保存されている場合はnullを返す', () => {
    // 無効なUUIDを直接Cookieに設定
    Cookies.set(COOKIE_KEYS.USER_ID, 'invalid-uuid');
    
    const userId = getUserIdFromCookie();
    
    expect(userId).toBeNull();
  });

  it('getOrCreateUserIdはCookieが存在する場合は既存のIDを返す', () => {
    const originalUserId = generateUserId();
    saveUserIdToCookie(originalUserId);
    
    const userId = getOrCreateUserId();
    
    expect(userId).toBe(originalUserId);
  });

  it('getOrCreateUserIdはCookieが存在しない場合は新規IDを生成して保存する', () => {
    removeUserIdCookie();
    
    const userId = getOrCreateUserId();
    
    expect(isValidUserId(userId)).toBe(true);
    
    // Cookieに保存されていることを確認
    const retrievedUserId = getUserIdFromCookie();
    expect(retrievedUserId).toBe(userId);
  });

  it('removeUserIdCookieはCookieを削除する', () => {
    const userId = generateUserId();
    saveUserIdToCookie(userId);
    
    // Cookieが存在することを確認
    expect(getUserIdFromCookie()).toBe(userId);
    
    // 削除
    removeUserIdCookie();
    
    // Cookieが存在しないことを確認
    expect(getUserIdFromCookie()).toBeNull();
  });

  it('複数回の保存と読み取りでラウンドトリップが成功する', () => {
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      const count = Math.floor(Math.random() * 10) + 1; // 1-10個
      
      for (let j = 0; j < count; j++) {
        const userId = generateUserId();
        
        // 保存
        saveUserIdToCookie(userId);
        
        // 読み取り
        const retrieved = getUserIdFromCookie();
        
        // 検証（保存直後に読み取り）
        expect(retrieved).toBe(userId);
        expect(isValidUserId(retrieved)).toBe(true);
      }
      
      // クリーンアップ
      removeUserIdCookie();
    }
  });
});
