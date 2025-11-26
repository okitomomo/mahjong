/**
 * 部屋操作サービス
 * Room operations service
 * 
 * @typedef {import('../types/models').Room} Room
 * @typedef {import('../types/models').RoomSettings} RoomSettings
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import {
  roomConverter,
  createNewRoom,
  COLLECTIONS,
  gameConverter,
  createNewGame,
} from '../models/index.js';

/**
 * 部屋を作成
 * Create a new room
 * 
 * @returns {Promise<string>} 作成された部屋のID (Created room ID)
 */
export async function createRoom() {
  try {
    const newRoom = createNewRoom();
    const roomsRef = collection(db, COLLECTIONS.ROOMS).withConverter(roomConverter);
    const docRef = await addDoc(roomsRef, newRoom);
    const roomId = docRef.id;
    
    // 自動的に最初のゲームを作成
    try {
      const newGame = createNewGame(roomId, 1);
      const gamesRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES)
        .withConverter(gameConverter);
      const gameDocRef = await addDoc(gamesRef, newGame);
      
      // 部屋のcurrentGameIdを更新
      await updateCurrentGameId(roomId, gameDocRef.id);
    } catch (gameError) {
      console.error('Error creating initial game:', gameError);
      // ゲーム作成に失敗しても部屋は作成されている
      // ユーザーは手動でゲームを作成できる
    }
    
    return roomId;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('部屋の作成に失敗しました');
  }
}

/**
 * 部屋一覧を取得（作成日時降順）
 * Get list of rooms (ordered by creation date descending)
 * 
 * @returns {Promise<Room[]>} 部屋の配列 (Array of rooms)
 */
export async function getRooms() {
  try {
    const roomsRef = collection(db, COLLECTIONS.ROOMS).withConverter(roomConverter);
    const q = query(roomsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting rooms:', error);
    throw new Error('部屋一覧の取得に失敗しました');
  }
}

/**
 * 部屋詳細を取得
 * Get room details
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {Promise<Room | null>} 部屋データ、存在しない場合はnull (Room data or null if not found)
 */
export async function getRoom(roomId) {
  try {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId).withConverter(roomConverter);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      return roomSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting room:', error);
    throw new Error('部屋の取得に失敗しました');
  }
}

/**
 * 部屋設定を更新し、全半荘のスコアを再計算
 * Update room settings and recalculate all game scores
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {RoomSettings} settings - 新しい設定 (New settings)
 * @returns {Promise<void>}
 */
export async function updateRoomSettings(roomId, settings) {
  try {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(roomRef, {
      settings: {
        uma: {
          topBottom: settings.uma.topBottom,
          middlePair: settings.uma.middlePair,
        },
        oka: {
          startPoints: settings.oka.startPoints,
          returnPoints: settings.oka.returnPoints,
        },
        yakitori: {
          enabled: settings.yakitori.enabled,
          penalty: settings.yakitori.penalty,
        },
        chip: {
          enabled: settings.chip.enabled,
          initialCount: settings.chip.initialCount,
          pointsPerChip: settings.chip.pointsPerChip,
        },
      },
    });
    
    // 全半荘のスコアを再計算
    await recalculateAllGames(roomId, settings);
  } catch (error) {
    console.error('Error updating room settings:', error);
    throw new Error('部屋設定の更新に失敗しました');
  }
}

/**
 * 部屋の全半荘のスコアを再計算
 * Recalculate scores for all games in a room
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {RoomSettings} settings - 部屋設定 (Room settings)
 * @returns {Promise<void>}
 */
async function recalculateAllGames(roomId, settings) {
  try {
    // gameServiceから必要な関数をインポート
    const { getGames } = await import('./gameService.js');
    const { 
      calculateRanks, 
      calculateOka, 
      calculateUma, 
      calculateChipScore,
      calculateFinalScoreWithChip,
      calculateYakitoriScores,
    } = await import('../utils/index.js');
    const { GAME_STATUS } = await import('../models/index.js');
    
    // 全半荘を取得
    const games = await getGames(roomId);
    
    // 確定済みの半荘のみ再計算
    const completedGames = games.filter(g => g.status === GAME_STATUS.COMPLETED);
    
    for (const game of completedGames) {
      const playerCount = game.results.filter(r => r.rawScore !== undefined).length;
      
      // スコアと順位を計算
      const scoresWithMembers = game.results.map(r => ({
        memberId: r.memberId,
        rawScore: r.rawScore,
      }));
      const rankedScores = calculateRanks(scoresWithMembers);
      
      // 各プレイヤーのスコアを計算
      const okaSettings = {
        startPoints: settings.oka.startPoints,
        returnPoints: settings.oka.returnPoints,
      };
      const umaSettings = {
        topBottom: settings.uma.topBottom,
        middlePair: settings.uma.middlePair,
      };
      
      // ヤキトリスコアを計算
      const yakitoriScores = settings.yakitori.enabled
        ? calculateYakitoriScores(
            game.results.map(r => ({ memberId: r.memberId, isYakitori: r.isYakitori ?? false })),
            settings.yakitori.penalty
          )
        : {};
      
      const calculatedResults = game.results.map((result) => {
        // このメンバーの順位を取得
        const rankedScore = rankedScores.find(rs => rs.memberId === result.memberId);
        const rank = rankedScore?.rank ?? 1;
        
        const oka = calculateOka(result.rawScore, rank, playerCount, okaSettings);
        const uma = calculateUma(rank, playerCount, umaSettings);
        const yakitoriScore = yakitoriScores[result.memberId] ?? 0;
        const finalScore = oka + uma + yakitoriScore;
        const chipScore = calculateChipScore(
          result.chipCount ?? 0,
          settings.chip.pointsPerChip
        );
        const finalScoreWithChip = calculateFinalScoreWithChip(finalScore, chipScore);
        
        return {
          ...result,
          rank,
          oka,
          uma,
          yakitoriScore,
          finalScore,
          chipScore,
          finalScoreWithChip,
        };
      });
      
      // 半荘を更新
      const gameRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES, game.id);
      await updateDoc(gameRef, {
        results: calculatedResults,
      });
    }
  } catch (error) {
    console.error('Error recalculating games:', error);
    throw new Error('スコアの再計算に失敗しました');
  }
}

/**
 * 部屋を削除
 * Delete a room
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {Promise<void>}
 */
export async function deleteRoom(roomId) {
  try {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await deleteDoc(roomRef);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw new Error('部屋の削除に失敗しました');
  }
}

/**
 * 部屋の現在の半荘IDを更新
 * Update room's current game ID
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string | null} gameId - 半荘ID、nullの場合は現在の半荘なし (Game ID or null if no current game)
 * @returns {Promise<void>}
 */
export async function updateCurrentGameId(roomId, gameId) {
  try {
    const roomRef = doc(db, COLLECTIONS.ROOMS, roomId);
    await updateDoc(roomRef, {
      currentGameId: gameId,
    });
  } catch (error) {
    console.error('Error updating current game ID:', error);
    throw new Error('現在の半荘IDの更新に失敗しました');
  }
}
