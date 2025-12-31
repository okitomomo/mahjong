/**
 * 部屋一覧管理カスタムフック
 * Custom hook for managing rooms list
 * 
 * @typedef {import('../types/models').Room} Room
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { roomConverter, COLLECTIONS } from '../models/index.js';
import { createRoom as createRoomService, deleteRoom as deleteRoomService } from '../services/index.js';
import { getErrorMessage, logError } from '../utils/index.js';

/**
 * 部屋一覧を管理するカスタムフック
 * Custom hook for managing rooms list
 * 
 * @returns {{rooms: Room[], loading: boolean, error: string | null, createRoom: () => Promise<string>, deleteRoom: (roomId: string) => Promise<void>}}
 */
export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // リアルタイムリスナーを設定
    const roomsRef = collection(db, COLLECTIONS.ROOMS).withConverter(roomConverter);
    const q = query(roomsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const roomsData = querySnapshot.docs.map(doc => doc.data());
        setRooms(roomsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching rooms:', err);
        setError(getErrorMessage(err));
        setLoading(false);
        logError(err, { context: 'useRooms' });
      }
    );

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  /**
   * 部屋を作成
   * Create a new room
   */
  const createRoom = async (creatorUserId) => {
    try {
      setError(null);
      const roomId = await createRoomService(creatorUserId);
      return roomId;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useRooms.createRoom' });
      throw err;
    }
  };

  /**
   * 部屋を削除
   * Delete a room
   */
  const deleteRoom = async (roomId) => {
    try {
      setError(null);
      await deleteRoomService(roomId);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useRooms.deleteRoom', roomId });
      throw err;
    }
  };

  return {
    rooms,
    loading,
    error,
    createRoom,
    deleteRoom,
  };
}
