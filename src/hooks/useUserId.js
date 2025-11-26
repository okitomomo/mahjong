/**
 * ユーザーID管理カスタムフック
 * User ID management custom hook
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  getOrCreateUserId, 
  removeUserIdCookie,
  saveRoomNameToCookie,
  getRoomNameFromCookie,
  removeRoomNameFromCookie,
} from '../utils/cookieManager.js';

/**
 * ユーザーIDと部屋ごとの名前を管理するカスタムフック
 * Custom hook for managing user ID and room-specific names
 * 
 * @returns {{
 *   userId: string,
 *   resetUserId: () => void,
 *   getRoomName: (roomId: string) => string | null,
 *   setRoomName: (roomId: string, name: string) => void,
 *   removeRoomName: (roomId: string) => void,
 * }}
 */
export function useUserId() {
  const [userId, setUserId] = useState(() => getOrCreateUserId());
  const location = useLocation();

  // URLパラメータの変更を監視（開発環境のみ）
  useEffect(() => {
    const newUserId = getOrCreateUserId();
    if (newUserId !== userId) {
      setUserId(newUserId);
    }
  }, [location.search]);

  /**
   * ユーザーIDをリセット（新規生成）
   * Reset user ID (generate new one)
   */
  const resetUserId = useCallback(() => {
    removeUserIdCookie();
    const newUserId = getOrCreateUserId();
    setUserId(newUserId);
  }, []);

  /**
   * 特定の部屋の名前を取得
   * Get name for a specific room
   * 
   * @param {string} roomId - 部屋ID (Room ID)
   * @returns {string | null} 名前、存在しない場合はnull (Name or null if not found)
   */
  const getRoomName = useCallback((roomId) => {
    return getRoomNameFromCookie(roomId);
  }, []);

  /**
   * 特定の部屋の名前を設定
   * Set name for a specific room
   * 
   * @param {string} roomId - 部屋ID (Room ID)
   * @param {string} name - 名前 (Name)
   * @returns {void}
   */
  const setRoomName = useCallback((roomId, name) => {
    saveRoomNameToCookie(roomId, name);
  }, []);

  /**
   * 特定の部屋の名前を削除
   * Remove name for a specific room
   * 
   * @param {string} roomId - 部屋ID (Room ID)
   * @returns {void}
   */
  const removeRoomName = useCallback((roomId) => {
    removeRoomNameFromCookie(roomId);
  }, []);

  return {
    userId,
    resetUserId,
    getRoomName,
    setRoomName,
    removeRoomName,
  };
}
