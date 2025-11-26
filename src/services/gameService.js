/**
 * 半荘記録操作サービス
 * Game operations service
 * 
 * @typedef {import('../types/models').Game} Game
 * @typedef {import('../types/models').GameResult} GameResult
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import {
  gameConverter,
  createNewGame,
  createGameResult,
  COLLECTIONS,
  GAME_STATUS,
  validateGame,
  validateScoreRange,
} from '../models/index.js';
import { 
  calculateRanks, 
  calculateOka, 
  calculateUma, 
  calculateFinalScore,
  calculateChipScore,
  calculateFinalScoreWithChip,
  calculateYakitoriScores,
} from '../utils/index.js';
import { updateCurrentGameId } from './roomService.js';

/**
 * 新しい半荘を作成（入力中状態）
 * Create a new game (inputting status)
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string | null} previousGameId - 前の半荘ID（検証・確定用） (Previous game ID for validation)
 * @param {import('../types/models').RoomSettings} [roomSettings] - 部屋設定（スコア計算用） (Room settings for score calculation)
 * @returns {Promise<{gameId: string, validationError: string | null}>} 作成された半荘IDと検証エラー
 */
export async function createGame(roomId, previousGameId = null, roomSettings = null) {
  try {
    // 前の半荘が存在する場合は検証・確定
    if (previousGameId) {
      const validationResult = await validateAndCompleteGame(roomId, previousGameId, roomSettings);
      if (!validationResult.valid) {
        return {
          gameId: null,
          validationError: validationResult.errors.join(', '),
        };
      }
    }
    
    // 現在の半荘数を取得して次の番号を決定
    const games = await getGames(roomId);
    const gameNumber = games.length + 1;
    
    const newGame = createNewGame(roomId, gameNumber);
    const gamesRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES)
      .withConverter(gameConverter);
    const docRef = await addDoc(gamesRef, newGame);
    
    // 部屋のcurrentGameIdを更新
    await updateCurrentGameId(roomId, docRef.id);
    
    return {
      gameId: docRef.id,
      validationError: null,
    };
  } catch (error) {
    console.error('Error creating game:', error);
    throw new Error(`半荘の作成に失敗しました: ${error.message}`);
  }
}

/**
 * 部屋の半荘履歴を取得
 * Get game history for a room
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {Promise<Game[]>} 半荘の配列 (Array of games)
 */
export async function getGames(roomId) {
  try {
    const gamesRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES)
      .withConverter(gameConverter);
    const q = query(gamesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting games:', error);
    throw new Error('半荘履歴の取得に失敗しました');
  }
}

/**
 * 半荘詳細を取得
 * Get game details
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} gameId - 半荘ID (Game ID)
 * @returns {Promise<Game | null>} 半荘データ、存在しない場合はnull (Game data or null if not found)
 */
export async function getGame(roomId, gameId) {
  try {
    const gameRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES, gameId)
      .withConverter(gameConverter);
    const gameSnap = await getDoc(gameRef);
    
    if (gameSnap.exists()) {
      return gameSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting game:', error);
    throw new Error('半荘の取得に失敗しました');
  }
}

/**
 * 半荘に得点を入力
 * Submit score to a game
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} gameId - 半荘ID (Game ID)
 * @param {string} memberId - メンバーID (Member ID)
 * @param {string} memberName - メンバー名 (Member name)
 * @param {number} rawScore - 素点 (Raw score)
 * @param {number} [chipCount=0] - チップ増減 (Chip count change)
 * @param {boolean} [isYakitori=false] - ヤキトリ（その半荘で1度も上がっていない） (Yakitori flag)
 * @returns {Promise<void>}
 */
export async function submitScore(roomId, gameId, memberId, memberName, rawScore, chipCount = 0, isYakitori = false) {
  try {
    // 得点のバリデーション
    const scoreValidation = validateScoreRange(rawScore);
    if (!scoreValidation.valid) {
      throw new Error(scoreValidation.error);
    }
    
    const game = await getGame(roomId, gameId);
    
    if (!game) {
      throw new Error('半荘が見つかりません');
    }
    
    if (game.status !== GAME_STATUS.INPUTTING) {
      throw new Error('この半荘は入力を受け付けていません');
    }
    
    // 既存の結果を更新または新規追加
    const existingResultIndex = game.results.findIndex(r => r.memberId === memberId);
    
    let updatedResults;
    if (existingResultIndex >= 0) {
      // 既存の結果を更新
      updatedResults = [...game.results];
      updatedResults[existingResultIndex] = {
        ...updatedResults[existingResultIndex],
        rawScore,
        chipCount,
        isYakitori,
      };
    } else {
      // 新規追加
      const newResult = createGameResult(memberId, memberName);
      newResult.rawScore = rawScore;
      newResult.chipCount = chipCount;
      newResult.isYakitori = isYakitori;
      updatedResults = [...game.results, newResult];
    }
    
    // resultsを正しい形式に変換
    const formattedResults = updatedResults.map((result) => {
      const resultData = {
        memberId: result.memberId,
        memberName: result.memberName,
      };
      if (result.rawScore !== undefined) resultData.rawScore = result.rawScore;
      if (result.rank !== undefined) resultData.rank = result.rank;
      if (result.uma !== undefined) resultData.uma = result.uma;
      if (result.oka !== undefined) resultData.oka = result.oka;
      if (result.isYakitori !== undefined) resultData.isYakitori = result.isYakitori;
      if (result.yakitoriScore !== undefined) resultData.yakitoriScore = result.yakitoriScore;
      if (result.chipCount !== undefined) resultData.chipCount = result.chipCount;
      if (result.chipScore !== undefined) resultData.chipScore = result.chipScore;
      if (result.finalScore !== undefined) resultData.finalScore = result.finalScore;
      if (result.finalScoreWithChip !== undefined) resultData.finalScoreWithChip = result.finalScoreWithChip;
      return resultData;
    });
    
    const gameRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES, gameId);
    await updateDoc(gameRef, {
      results: formattedResults,
    });
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

/**
 * 半荘を検証して確定
 * Validate and complete a game
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} gameId - 半荘ID (Game ID)
 * @param {import('../types/models').RoomSettings} [roomSettings] - 部屋設定（スコア計算用） (Room settings for score calculation)
 * @returns {Promise<{valid: boolean, errors: string[]}>} 検証結果
 */
export async function validateAndCompleteGame(roomId, gameId, roomSettings = null) {
  try {
    const game = await getGame(roomId, gameId);
    
    if (!game) {
      return {
        valid: false,
        errors: ['半荘が見つかりません'],
      };
    }
    
    if (game.status === GAME_STATUS.COMPLETED) {
      return { valid: true, errors: [] };
    }
    
    // 検証（部屋設定の開始点を渡す）
    const startPoints = roomSettings?.oka?.startPoints;
    const validationResult = validateGame(game, startPoints);
    
    if (!validationResult.valid) {
      // 検証失敗 - ステータスは変更せず、inputtingのまま保持
      // ユーザーがスコアを修正できるようにする
      return validationResult;
    }
    
    // 検証成功 - スコア計算して確定
    const playerCount = game.results.filter(r => r.rawScore !== undefined).length;
    
    // スコアと順位を計算
    const scoresWithMembers = game.results.map(r => ({
      memberId: r.memberId,
      rawScore: r.rawScore,
    }));
    const rankedScores = calculateRanks(scoresWithMembers);
    
    // 各プレイヤーのスコアを計算
    const okaSettings = {
      startPoints: roomSettings?.oka?.startPoints ?? 25000,
      returnPoints: roomSettings?.oka?.returnPoints ?? 30000,
    };
    const umaSettings = {
      topBottom: roomSettings?.uma?.topBottom ?? 10,
      middlePair: roomSettings?.uma?.middlePair ?? 5,
    };
    
    // ヤキトリスコアを計算
    const yakitoriScores = roomSettings?.yakitori?.enabled
      ? calculateYakitoriScores(
          game.results.map(r => ({ memberId: r.memberId, isYakitori: r.isYakitori ?? false })),
          roomSettings.yakitori.penalty
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
        roomSettings?.chip?.pointsPerChip ?? 5
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
    
    const gameRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.GAMES, gameId);
    await updateDoc(gameRef, {
      status: GAME_STATUS.COMPLETED,
      playerCount,
      results: calculatedResults,
    });
    
    return { valid: true, errors: [] };
  } catch (error) {
    console.error('Error validating and completing game:', error);
    throw error;
  }
}
