/**
 * Firestoreコンバーター - 型安全なデータ変換
 * Firestore converters for type-safe data transformation
 * 
 * @typedef {import('../types/models').Room} Room
 * @typedef {import('../types/models').Member} Member
 * @typedef {import('../types/models').Game} Game
 * @typedef {import('../types/models').RoomSettings} RoomSettings
 * @typedef {import('../types/models').UmaSettings} UmaSettings
 * @typedef {import('../types/models').OkaSettings} OkaSettings
 * @typedef {import('../types/models').YakitoriSettings} YakitoriSettings
 * @typedef {import('../types/models').ChipSettings} ChipSettings
 * @typedef {import('../types/models').GameResult} GameResult
 */

import { Timestamp } from 'firebase/firestore';

/**
 * デフォルトのウマ設定を取得（ゴットー）
 * Get default Uma settings (Goto: 10/5)
 * @returns {UmaSettings}
 */
export function getDefaultUmaSettings() {
  return {
    topBottom: 10,
    middlePair: 5,
  };
}

/**
 * デフォルトのオカ設定を取得
 * Get default Oka settings
 * @returns {OkaSettings}
 */
export function getDefaultOkaSettings() {
  return {
    startPoints: 25000,
    returnPoints: 30000,
  };
}

/**
 * デフォルトのヤキトリ設定を取得
 * Get default Yakitori settings
 * @returns {YakitoriSettings}
 */
export function getDefaultYakitoriSettings() {
  return {
    enabled: true,
    penalty: -30,
  };
}

/**
 * デフォルトのチップ設定を取得
 * Get default Chip settings
 * @returns {ChipSettings}
 */
export function getDefaultChipSettings() {
  return {
    enabled: false,
    initialCount: 0,
    pointsPerChip: 5,
  };
}

/**
 * デフォルトの部屋設定を取得
 * Get default Room settings
 * @returns {RoomSettings}
 */
export function getDefaultRoomSettings() {
  return {
    uma: getDefaultUmaSettings(),
    oka: getDefaultOkaSettings(),
    yakitori: getDefaultYakitoriSettings(),
    chip: getDefaultChipSettings(),
  };
}

/**
 * 部屋のFirestoreコンバーター
 * Firestore converter for Room
 */
export const roomConverter = {
  /**
   * RoomオブジェクトをFirestoreドキュメントに変換
   * Convert Room object to Firestore document
   * @param {Room} room
   * @returns {Object}
   */
  toFirestore: (room) => {
    return {
      name: room.name,
      createdAt: room.createdAt,
      settings: {
        uma: {
          topBottom: room.settings.uma.topBottom,
          middlePair: room.settings.uma.middlePair,
        },
        oka: {
          startPoints: room.settings.oka.startPoints,
          returnPoints: room.settings.oka.returnPoints,
        },
        yakitori: {
          enabled: room.settings.yakitori.enabled,
          penalty: room.settings.yakitori.penalty,
        },
        chip: {
          enabled: room.settings.chip.enabled,
          initialCount: room.settings.chip.initialCount,
          pointsPerChip: room.settings.chip.pointsPerChip,
        },
      },
      currentGameId: room.currentGameId ?? null,
    };
  },

  /**
   * FirestoreドキュメントをRoomオブジェクトに変換
   * Convert Firestore document to Room object
   * @param {import('firebase/firestore').QueryDocumentSnapshot} snapshot
   * @returns {Room}
   */
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      createdAt: data.createdAt,
      settings: {
        uma: {
          topBottom: data.settings?.uma?.topBottom ?? 40,
          middlePair: data.settings?.uma?.middlePair ?? 10,
        },
        oka: {
          startPoints: data.settings?.oka?.startPoints ?? 25000,
          returnPoints: data.settings?.oka?.returnPoints ?? 30000,
        },
        yakitori: {
          enabled: data.settings?.yakitori?.enabled ?? false,
          penalty: data.settings?.yakitori?.penalty ?? 30,
        },
        chip: {
          enabled: data.settings?.chip?.enabled ?? false,
          initialCount: data.settings?.chip?.initialCount ?? 0,
          pointsPerChip: data.settings?.chip?.pointsPerChip ?? 5,
        },
      },
      currentGameId: data.currentGameId ?? null,
    };
  },
};

/**
 * メンバーのFirestoreコンバーター
 * Firestore converter for Member
 */
export const memberConverter = {
  /**
   * MemberオブジェクトをFirestoreドキュメントに変換
   * Convert Member object to Firestore document
   * @param {Member} member
   * @returns {Object}
   */
  toFirestore: (member) => {
    return {
      userId: member.userId,
      roomId: member.roomId,
      name: member.name,
      joinedAt: member.joinedAt,
    };
  },

  /**
   * FirestoreドキュメントをMemberオブジェクトに変換
   * Convert Firestore document to Member object
   * @param {import('firebase/firestore').QueryDocumentSnapshot} snapshot
   * @returns {Member}
   */
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      roomId: data.roomId,
      name: data.name,
      joinedAt: data.joinedAt,
    };
  },
};

/**
 * 半荘のFirestoreコンバーター
 * Firestore converter for Game
 */
export const gameConverter = {
  /**
   * GameオブジェクトをFirestoreドキュメントに変換
   * Convert Game object to Firestore document
   * @param {Game} game
   * @returns {Object}
   */
  toFirestore: (game) => {
    const data = {
      roomId: game.roomId,
      gameNumber: game.gameNumber,
      createdAt: game.createdAt,
      status: game.status,
      results: game.results.map((result) => {
        const resultData = {
          memberId: result.memberId,
          memberName: result.memberName,
        };
        // オプショナルフィールドは存在する場合のみ追加
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
      }),
    };
    // playerCountは確定時のみ存在
    if (game.playerCount !== undefined) {
      data.playerCount = game.playerCount;
    }
    return data;
  },

  /**
   * FirestoreドキュメントをGameオブジェクトに変換
   * Convert Firestore document to Game object
   * @param {import('firebase/firestore').QueryDocumentSnapshot} snapshot
   * @returns {Game}
   */
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    const game = {
      id: snapshot.id,
      roomId: data.roomId,
      gameNumber: data.gameNumber,
      createdAt: data.createdAt,
      status: data.status ?? 'inputting',
      results: data.results?.map((result) => ({
        memberId: result.memberId,
        memberName: result.memberName,
        rawScore: result.rawScore,
        rank: result.rank,
        uma: result.uma,
        oka: result.oka,
        isYakitori: result.isYakitori,
        yakitoriScore: result.yakitoriScore,
        chipCount: result.chipCount,
        chipScore: result.chipScore,
        finalScore: result.finalScore,
        finalScoreWithChip: result.finalScoreWithChip,
      })) ?? [],
    };
    // playerCountは確定時のみ存在
    if (data.playerCount !== undefined) {
      game.playerCount = data.playerCount;
    }
    return game;
  },
};

/**
 * 現在の日時から部屋名を生成（yyyy/MM/dd HH:mm形式）
 * Generate room name from current datetime (yyyy/MM/dd HH:mm format)
 * @returns {string}
 */
export function generateRoomName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 新しい部屋オブジェクトを作成
 * Create a new Room object
 * @returns {Omit<Room, 'id'>}
 */
export function createNewRoom() {
  return {
    name: generateRoomName(),
    createdAt: Timestamp.now(),
    settings: getDefaultRoomSettings(),
    currentGameId: null,
  };
}

/**
 * 新しいメンバーオブジェクトを作成
 * Create a new Member object
 * @param {string} userId - ユーザーID (User ID)
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} name - 表示名 (Display name)
 * @returns {Omit<Member, 'id'>}
 */
export function createNewMember(userId, roomId, name) {
  return {
    userId,
    roomId,
    name,
    joinedAt: Timestamp.now(),
  };
}

/**
 * 新しい半荘オブジェクトを作成（入力中状態）
 * Create a new Game object (inputting status)
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {number} gameNumber - N回目 (Game number)
 * @returns {Omit<Game, 'id'>}
 */
export function createNewGame(roomId, gameNumber) {
  return {
    roomId,
    gameNumber,
    createdAt: Timestamp.now(),
    status: 'inputting',
    results: [],
  };
}

/**
 * 半荘に新しいプレイヤーの結果を追加
 * Add a new player result to a game
 * @param {string} memberId - メンバーID (Member ID)
 * @param {string} memberName - メンバー名 (Member name)
 * @returns {GameResult}
 */
export function createGameResult(memberId, memberName) {
  return {
    memberId,
    memberName,
  };
}
