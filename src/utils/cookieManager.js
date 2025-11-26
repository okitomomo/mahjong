/**
 * Cookie管理ユーティリティ
 * Cookie management utilities
 */

import Cookies from 'js-cookie';
import { COOKIE_KEYS, COOKIE_EXPIRATION_DAYS } from '../models/constants.js';
import { generateUserId, isValidUserId } from './userIdGenerator.js';

/**
 * ユーザーIDをCookieに保存
 * Save user ID to cookie
 * 
 * @param {string} userId - ユーザーID (User ID)
 * @returns {void}
 */
export function saveUserIdToCookie(userId) {
  Cookies.set(COOKIE_KEYS.USER_ID, userId, { 
    expires: COOKIE_EXPIRATION_DAYS,
    sameSite: 'Lax',
  });
}

/**
 * CookieからユーザーIDを読み取り
 * Read user ID from cookie
 * 
 * @returns {string | null} ユーザーID、存在しない場合はnull (User ID or null if not found)
 */
export function getUserIdFromCookie() {
  const userId = Cookies.get(COOKIE_KEYS.USER_ID);
  
  // 有効なUUIDの場合のみ返す
  if (userId && isValidUserId(userId)) {
    return userId;
  }
  
  return null;
}

/**
 * ユーザーIDのCookieを削除
 * Remove user ID cookie
 * 
 * @returns {void}
 */
export function removeUserIdCookie() {
  Cookies.remove(COOKIE_KEYS.USER_ID);
}

/**
 * URLパラメータからユーザーIDを取得（開発環境のみ）
 * Get user ID from URL parameter (development only)
 * 
 * HashRouterを使用しているため、?userId=xxxは#の前に配置する必要があります
 * Since using HashRouter, ?userId=xxx must be placed before the #
 * 例: http://localhost:8080/?userId=xxx#/rooms/123
 * 
 * @returns {string | null} ユーザーID、存在しない場合はnull (User ID or null if not found)
 */
export function getUserIdFromUrlParam() {
  // 本番環境では無効化
  if (import.meta.env.PROD) {
    return null;
  }
  
  // HashRouterの場合、window.location.searchを使用（#の前のクエリパラメータ）
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  
  // 有効なUUIDの場合のみ返す
  if (userId && isValidUserId(userId)) {
    return userId;
  }
  
  return null;
}

/**
 * ユーザーIDを取得または生成
 * Get or generate user ID
 * 
 * Cookieに保存されているユーザーIDを取得し、存在しない場合は新規生成してCookieに保存
 * 開発環境ではURLパラメータ(?userId=xxx)でオーバーライド可能
 * Get user ID from cookie, or generate new one and save to cookie if not exists
 * In development, can be overridden with URL parameter (?userId=xxx)
 * 
 * @returns {string} ユーザーID (User ID)
 */
export function getOrCreateUserId() {
  // 開発環境: URLパラメータを優先
  const urlUserId = getUserIdFromUrlParam();
  if (urlUserId) {
    return urlUserId;
  }
  
  let userId = getUserIdFromCookie();
  
  if (!userId) {
    userId = generateUserId();
    saveUserIdToCookie(userId);
  }
  
  return userId;
}

/**
 * 部屋ごとの名前をCookieに保存
 * Save room-specific name to cookie
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} name - 名前 (Name)
 * @returns {void}
 */
export function saveRoomNameToCookie(roomId, name) {
  const roomNames = getRoomNamesFromCookie();
  roomNames[roomId] = name;
  
  Cookies.set(COOKIE_KEYS.ROOM_NAMES, JSON.stringify(roomNames), {
    expires: COOKIE_EXPIRATION_DAYS,
    sameSite: 'Lax',
  });
}

/**
 * Cookieから部屋ごとの名前を読み取り
 * Read room-specific names from cookie
 * 
 * @returns {Object.<string, string>} 部屋IDをキーとした名前のマップ (Map of room IDs to names)
 */
export function getRoomNamesFromCookie() {
  const roomNamesStr = Cookies.get(COOKIE_KEYS.ROOM_NAMES);
  
  if (!roomNamesStr) {
    return {};
  }
  
  try {
    const roomNames = JSON.parse(roomNamesStr);
    return typeof roomNames === 'object' && roomNames !== null ? roomNames : {};
  } catch (error) {
    console.error('Failed to parse room names from cookie:', error);
    return {};
  }
}

/**
 * 特定の部屋の名前をCookieから取得
 * Get name for a specific room from cookie
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {string | null} 名前、存在しない場合はnull (Name or null if not found)
 */
export function getRoomNameFromCookie(roomId) {
  const roomNames = getRoomNamesFromCookie();
  return roomNames[roomId] || null;
}

/**
 * 特定の部屋の名前をCookieから削除
 * Remove name for a specific room from cookie
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {void}
 */
export function removeRoomNameFromCookie(roomId) {
  const roomNames = getRoomNamesFromCookie();
  delete roomNames[roomId];
  
  if (Object.keys(roomNames).length === 0) {
    Cookies.remove(COOKIE_KEYS.ROOM_NAMES);
  } else {
    Cookies.set(COOKIE_KEYS.ROOM_NAMES, JSON.stringify(roomNames), {
      expires: COOKIE_EXPIRATION_DAYS,
      sameSite: 'Lax',
    });
  }
}
