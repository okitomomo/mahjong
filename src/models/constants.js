/**
 * システム定数
 * System constants
 */

/**
 * 半荘の状態
 * Game status
 */
export const GAME_STATUS = {
  INPUTTING: 'inputting',
  COMPLETED: 'completed',
  INVALID: 'invalid',
};

/**
 * 3人麻雀の得点合計
 * Total score for 3-player mahjong
 */
export const TOTAL_SCORE_3_PLAYER = 105000;

/**
 * 4人麻雀の得点合計
 * Total score for 4-player mahjong
 */
export const TOTAL_SCORE_4_PLAYER = 100000;

/**
 * 最小プレイヤー数
 * Minimum player count per game
 */
export const MIN_PLAYER_COUNT = 3;

/**
 * 最大プレイヤー数
 * Maximum player count per game
 */
export const MAX_PLAYER_COUNT = 4;

/**
 * 有効なプレイヤー数
 * Valid player counts
 */
export const VALID_PLAYER_COUNTS = [3, 4];

/**
 * ウマプリセット
 * Uma presets
 */
export const UMA_PRESETS = {
  GOTO: {
    TOP_BOTTOM: 10,
    MIDDLE_PAIR: 5,
  },
  ONE_TWO: {
    TOP_BOTTOM: 20,
    MIDDLE_PAIR: 10,
  },
};

/**
 * デフォルト設定値
 * Default configuration values
 */
export const DEFAULT_VALUES = {
  UMA: {
    TOP_BOTTOM: 10,  // ゴットー
    MIDDLE_PAIR: 5,  // ゴットー
  },
  OKA: {
    START_POINTS: 25000,
    RETURN_POINTS: 30000,
  },
  YAKITORI: {
    ENABLED: false,
    PENALTY: -30,
  },
  CHIP: {
    ENABLED: false,
    INITIAL_COUNT: 0,
    POINTS_PER_CHIP: 5,
  },
};

/**
 * Firestoreコレクション名
 * Firestore collection names
 */
export const COLLECTIONS = {
  ROOMS: 'rooms',
  MEMBERS: 'members',
  GAMES: 'games',
};

/**
 * Cookieキー
 * Cookie keys
 */
export const COOKIE_KEYS = {
  USER_ID: 'mahjong_user_id',
  ROOM_NAMES: 'mahjong_room_names', // 部屋ごとの名前を保存
};

/**
 * Cookie有効期限（日数）
 * Cookie expiration in days
 */
export const COOKIE_EXPIRATION_DAYS = 365;
