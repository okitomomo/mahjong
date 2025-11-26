/**
 * 半荘履歴管理カスタムフック
 * Custom hook for managing game history
 * 
 * @typedef {import('../types/models').Game} Game
 * @typedef {import('../types/models').RoomSettings} RoomSettings
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { gameConverter, COLLECTIONS } from '../models/index.js';
import { 
  createGame as createGameService,
  submitScore as submitScoreService,
  validateAndCompleteGame as validateAndCompleteGameService,
} from '../services/index.js';
import { getErrorMessage, logError } from '../utils/index.js';

/**
 * 半荘履歴を管理するカスタムフック
 * Custom hook for managing game history
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string | null} currentGameId - 現在の半荘ID (Current game ID)
 * @param {RoomSettings | null} roomSettings - 部屋設定（スコア計算用） (Room settings for score calculation)
 * @returns {{
 *   games: Game[], 
 *   currentGame: Game | null,
 *   loading: boolean, 
 *   error: string | null, 
 *   createGame: () => Promise<{gameId: string | null, validationError: string | null}>,
 *   submitScore: (memberId: string, memberName: string, rawScore: number, chipCount?: number) => Promise<void>,
 *   validateAndCompleteGame: (gameId: string) => Promise<{valid: boolean, errors: string[]}>,
 * }}
 */
export function useGames(roomId, currentGameId = null, roomSettings = null) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    // 半荘履歴のリアルタイムリスナー
    const gamesRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES)
      .withConverter(gameConverter);
    const q = query(gamesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const gamesData = querySnapshot.docs.map(doc => doc.data());
        setGames(gamesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching games:', err);
        setError(getErrorMessage(err));
        setLoading(false);
        logError(err, { context: 'useGames', roomId });
      }
    );

    // クリーンアップ
    return () => unsubscribe();
  }, [roomId]);

  /**
   * 現在の半荘を取得
   * Get current game
   */
  const currentGame = useMemo(() => {
    if (!currentGameId) {
      return null;
    }
    return games.find(g => g.id === currentGameId) || null;
  }, [games, currentGameId]);

  /**
   * 新しい半荘を作成
   * Create a new game
   */
  const createGame = async () => {
    try {
      setError(null);
      
      // 現在の半荘がある場合は、それを前の半荘として検証・確定
      const previousGameId = currentGameId;
      
      const result = await createGameService(roomId, previousGameId, roomSettings);
      
      if (result.validationError) {
        setError(result.validationError);
      }
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useGames.createGame', roomId });
      throw err;
    }
  };

  /**
   * 得点を入力
   * Submit score
   */
  const submitScore = async (memberId, memberName, rawScore, chipCount = 0, isYakitori = false) => {
    try {
      setError(null);
      
      if (!currentGameId) {
        throw new Error('現在の半荘がありません');
      }
      
      await submitScoreService(roomId, currentGameId, memberId, memberName, rawScore, chipCount, isYakitori);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useGames.submitScore', roomId, currentGameId, memberId });
      throw err;
    }
  };

  /**
   * 半荘を検証して確定
   * Validate and complete game
   */
  const validateAndCompleteGame = async (gameId) => {
    try {
      setError(null);
      const result = await validateAndCompleteGameService(roomId, gameId, roomSettings);
      
      if (!result.valid) {
        setError(result.errors.join(', '));
      }
      
      return result;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useGames.validateAndCompleteGame', roomId, gameId });
      throw err;
    }
  };

  return {
    games,
    currentGame,
    loading,
    error,
    createGame,
    submitScore,
    validateAndCompleteGame,
  };
}
