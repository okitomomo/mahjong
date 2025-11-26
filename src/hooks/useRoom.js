/**
 * 部屋詳細管理カスタムフック
 * Custom hook for managing room details
 * 
 * @typedef {import('../types/models').Room} Room
 * @typedef {import('../types/models').Member} Member
 * @typedef {import('../types/models').Game} Game
 * @typedef {import('../types/models').RoomSettings} RoomSettings
 */

import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { roomConverter, memberConverter, gameConverter, COLLECTIONS } from '../models/index.js';
import { updateRoomSettings as updateRoomSettingsService } from '../services/index.js';
import { getErrorMessage, logError } from '../utils/index.js';

/**
 * 部屋詳細を管理するカスタムフック
 * Custom hook for managing room details
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {{
 *   room: Room | null, 
 *   members: Member[], 
 *   games: Game[], 
 *   currentGame: Game | null,
 *   loading: boolean, 
 *   error: string | null, 
 *   updateSettings: (settings: RoomSettings) => Promise<void>
 * }}
 */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    // 部屋のリアルタイムリスナー
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId).withConverter(roomConverter);
    const unsubscribeRoom = onSnapshot(
      roomRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setRoom(docSnapshot.data());
          setError(null);
        } else {
          setRoom(null);
          setError('部屋が見つかりません');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching room:', err);
        setError(getErrorMessage(err));
        setLoading(false);
        logError(err, { context: 'useRoom.room', roomId });
      }
    );

    // メンバーのリアルタイムリスナー
    const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS)
      .withConverter(memberConverter);
    const membersQuery = query(membersRef, orderBy('joinedAt', 'asc'));
    const unsubscribeMembers = onSnapshot(
      membersQuery,
      (querySnapshot) => {
        const membersData = querySnapshot.docs.map(doc => doc.data());
        setMembers(membersData);
      },
      (err) => {
        console.error('Error fetching members:', err);
        logError(err, { context: 'useRoom.members', roomId });
      }
    );

    // 半荘履歴のリアルタイムリスナー
    const gamesRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES)
      .withConverter(gameConverter);
    const gamesQuery = query(gamesRef, orderBy('createdAt', 'desc'));
    const unsubscribeGames = onSnapshot(
      gamesQuery,
      (querySnapshot) => {
        const gamesData = querySnapshot.docs.map(doc => doc.data());
        setGames(gamesData);
      },
      (err) => {
        console.error('Error fetching games:', err);
        logError(err, { context: 'useRoom.games', roomId });
      }
    );

    // クリーンアップ
    return () => {
      unsubscribeRoom();
      unsubscribeMembers();
      unsubscribeGames();
    };
  }, [roomId]);

  /**
   * 現在の半荘（入力中の半荘）を取得
   * Get current game (inputting game)
   */
  const currentGame = useMemo(() => {
    if (!room || !room.currentGameId) {
      return null;
    }
    return games.find(g => g.id === room.currentGameId) || null;
  }, [room, games]);

  /**
   * 部屋設定を更新
   * Update room settings
   */
  const updateSettings = async (settings) => {
    try {
      setError(null);
      await updateRoomSettingsService(roomId, settings);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useRoom.updateSettings', roomId });
      throw err;
    }
  };

  return {
    room,
    members,
    games,
    currentGame,
    loading,
    error,
    updateSettings,
  };
}
