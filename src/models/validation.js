/**
 * バリデーションユーティリティ
 * Validation utilities
 * 
 * @typedef {import('../types/models').RoomSettings} RoomSettings
 */

import { 
  VALID_PLAYER_COUNTS, 
  GAME_STATUS,
  TOTAL_SCORE_3_PLAYER,
  TOTAL_SCORE_4_PLAYER,
} from './constants.js';

/**
 * プレイヤー数が有効かチェック
 * Check if player count is valid (3 or 4)
 * @param {number} playerCount - プレイヤー数
 * @returns {boolean}
 */
export function isValidPlayerCount(playerCount) {
  return VALID_PLAYER_COUNTS.includes(playerCount);
}

/**
 * 得点が有効な数値かチェック
 * Check if score is a valid number
 * @param {any} score - 得点
 * @returns {boolean}
 */
export function isValidScore(score) {
  return typeof score === 'number' && !isNaN(score) && isFinite(score);
}

/**
 * 得点が100点刻みかチェック
 * Check if score is a multiple of 100
 * @param {number} score - 得点
 * @returns {boolean}
 */
export function isValidScoreIncrement(score) {
  if (!isValidScore(score)) {
    return false;
  }
  return score % 100 === 0;
}

/**
 * 得点が妥当な範囲内かチェック（詳細版）
 * Check if score is within valid range
 * @param {number} score - 得点
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateScoreRange(score) {
  if (!isValidScore(score)) {
    return { valid: false, error: '得点は数値で入力してください' };
  }
  
  if (!isValidScoreIncrement(score)) {
    return { valid: false, error: '得点は100点刻みで入力してください' };
  }
  
  if (score < -200000) {
    return { valid: false, error: '得点は-200,000点以上で入力してください' };
  }
  
  if (score > 200000) {
    return { valid: false, error: '得点は200,000点以下で入力してください' };
  }
  
  return { valid: true };
}

/**
 * メンバー名が有効かチェック
 * Check if member name is valid (non-empty string)
 * @param {string} name - メンバー名
 * @returns {boolean}
 */
export function isValidMemberName(name) {
  return typeof name === 'string' && name.trim().length > 0;
}

/**
 * 半荘の状態が有効かチェック
 * Check if game status is valid
 * @param {string} status - 半荘の状態
 * @returns {boolean}
 */
export function isValidGameStatus(status) {
  return Object.values(GAME_STATUS).includes(status);
}

/**
 * 半荘が入力中かチェック
 * Check if game is in inputting status
 * @param {import('../types/models').Game} game - 半荘
 * @returns {boolean}
 */
export function isGameInputting(game) {
  return game.status === GAME_STATUS.INPUTTING;
}

/**
 * 半荘が確定済みかチェック
 * Check if game is completed
 * @param {import('../types/models').Game} game - 半荘
 * @returns {boolean}
 */
export function isGameCompleted(game) {
  return game.status === GAME_STATUS.COMPLETED;
}

/**
 * 半荘の検証 - 人数チェック
 * Validate game - player count check
 * @param {import('../types/models').GameResult[]} results - 結果配列
 * @returns {boolean}
 */
export function validateGamePlayerCount(results) {
  const playerCount = results.filter(r => r.rawScore !== undefined).length;
  return isValidPlayerCount(playerCount);
}

/**
 * 半荘の検証 - 得点合計チェック
 * Validate game - total score check
 * @param {import('../types/models').GameResult[]} results - 結果配列
 * @param {number} [startPoints] - 開始点（指定された場合は部屋設定に基づいて計算）
 * @returns {boolean}
 */
export function validateGameTotalScore(results, startPoints) {
  const playersWithScores = results.filter(r => r.rawScore !== undefined);
  const playerCount = playersWithScores.length;
  
  if (!isValidPlayerCount(playerCount)) {
    return false;
  }
  
  const totalScore = playersWithScores.reduce((sum, r) => sum + r.rawScore, 0);
  
  // startPointsが指定されている場合は、それを使用して期待値を計算
  let expectedTotal;
  if (startPoints !== undefined) {
    expectedTotal = startPoints * playerCount;
  } else {
    // 後方互換性のため、指定されていない場合は固定値を使用
    expectedTotal = playerCount === 3 ? TOTAL_SCORE_3_PLAYER : TOTAL_SCORE_4_PLAYER;
  }
  
  return totalScore === expectedTotal;
}

/**
 * 半荘の検証 - 全員入力完了チェック
 * Validate game - all players submitted check
 * @param {import('../types/models').GameResult[]} results - 結果配列
 * @returns {boolean}
 */
export function validateGameAllSubmitted(results) {
  if (results.length === 0) {
    return false;
  }
  return results.every(r => r.rawScore !== undefined);
}

/**
 * 半荘の完全検証
 * Complete game validation
 * @param {import('../types/models').Game} game - 半荘
 * @param {number} [startPoints] - 開始点（部屋設定から取得）
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateGame(game, startPoints) {
  const errors = [];
  
  if (!validateGamePlayerCount(game.results)) {
    errors.push('プレイヤー数が3人または4人ではありません');
  }
  
  if (!validateGameAllSubmitted(game.results)) {
    errors.push('全員が得点を入力していません');
  }
  
  if (!validateGameTotalScore(game.results, startPoints)) {
    const playerCount = game.results.filter(r => r.rawScore !== undefined).length;
    const expected = startPoints !== undefined 
      ? startPoints * playerCount 
      : (playerCount === 3 ? TOTAL_SCORE_3_PLAYER : TOTAL_SCORE_4_PLAYER);
    errors.push(`得点合計が${expected.toLocaleString()}点ではありません`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * ウマ設定が有効かチェック
 * Check if Uma settings are valid
 * @param {import('../types/models').UmaSettings} uma - ウマ設定
 * @returns {boolean}
 */
export function isValidUmaSettings(uma) {
  return (
    typeof uma.topBottom === 'number' &&
    typeof uma.middlePair === 'number' &&
    isFinite(uma.topBottom) &&
    isFinite(uma.middlePair)
  );
}

/**
 * ウマ設定の範囲チェック（詳細版）
 * Validate Uma settings range
 * @param {import('../types/models').UmaSettings} uma - ウマ設定
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateUmaSettingsRange(uma) {
  const errors = [];
  
  if (!isValidUmaSettings(uma)) {
    errors.push('ウマ設定が不正です');
    return { valid: false, errors };
  }
  
  if (uma.topBottom < 0 || uma.topBottom > 100) {
    errors.push('トップ-ビリ間は0-100の範囲で入力してください');
  }
  
  if (uma.middlePair < 0 || uma.middlePair > 50) {
    errors.push('2-3位間は0-50の範囲で入力してください');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * オカ設定が有効かチェック
 * Check if Oka settings are valid
 * @param {import('../types/models').OkaSettings} oka - オカ設定
 * @returns {boolean}
 */
export function isValidOkaSettings(oka) {
  return (
    typeof oka.startPoints === 'number' &&
    typeof oka.returnPoints === 'number' &&
    oka.startPoints > 0 &&
    oka.returnPoints > 0 &&
    isFinite(oka.startPoints) &&
    isFinite(oka.returnPoints)
  );
}

/**
 * オカ設定の範囲チェック（詳細版）
 * Validate Oka settings range
 * @param {import('../types/models').OkaSettings} oka - オカ設定
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateOkaSettingsRange(oka) {
  const errors = [];
  
  if (!isValidOkaSettings(oka)) {
    errors.push('オカ設定が不正です');
    return { valid: false, errors };
  }
  
  if (oka.startPoints < 1000 || oka.startPoints > 100000) {
    errors.push('開始点は1,000-100,000の範囲で入力してください');
  }
  
  if (oka.startPoints % 100 !== 0) {
    errors.push('開始点は100点刻みで入力してください');
  }
  
  if (oka.returnPoints < 1000 || oka.returnPoints > 100000) {
    errors.push('返し点は1,000-100,000の範囲で入力してください');
  }
  
  if (oka.returnPoints % 100 !== 0) {
    errors.push('返し点は100点刻みで入力してください');
  }
  
  if (oka.returnPoints < oka.startPoints) {
    errors.push('返し点は開始点以上で入力してください');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * ヤキトリ設定が有効かチェック
 * Check if Yakitori settings are valid
 * @param {import('../types/models').YakitoriSettings} yakitori - ヤキトリ設定
 * @returns {boolean}
 */
export function isValidYakitoriSettings(yakitori) {
  return (
    typeof yakitori.enabled === 'boolean' &&
    typeof yakitori.penalty === 'number' &&
    isFinite(yakitori.penalty)
  );
}

/**
 * ヤキトリ設定の範囲チェック（詳細版）
 * Validate Yakitori settings range
 * @param {import('../types/models').YakitoriSettings} yakitori - ヤキトリ設定
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateYakitoriSettingsRange(yakitori) {
  const errors = [];
  
  if (!isValidYakitoriSettings(yakitori)) {
    errors.push('ヤキトリ設定が不正です');
    return { valid: false, errors };
  }
  
  if (yakitori.penalty < 0 || yakitori.penalty > 100) {
    errors.push('ヤキトリペナルティは0~100の範囲で入力してください');
  }
  
  if (yakitori.penalty < 0) {
    errors.push('ヤキトリペナルティは正の値で入力してください');
  }
  
  if (yakitori.penalty > 0 && (yakitori.penalty % 2 !== 0 || yakitori.penalty % 3 !== 0)) {
    errors.push('ヤキトリペナルティは2でも3でも割り切れる数値で入力してください');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * チップ設定が有効かチェック
 * Check if Chip settings are valid
 * @param {import('../types/models').ChipSettings} chip - チップ設定
 * @returns {boolean}
 */
export function isValidChipSettings(chip) {
  return (
    typeof chip.enabled === 'boolean' &&
    typeof chip.initialCount === 'number' &&
    typeof chip.pointsPerChip === 'number' &&
    chip.initialCount >= 0 &&
    isFinite(chip.initialCount) &&
    isFinite(chip.pointsPerChip)
  );
}

/**
 * チップ設定の範囲チェック（詳細版）
 * Validate Chip settings range
 * @param {import('../types/models').ChipSettings} chip - チップ設定
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateChipSettingsRange(chip) {
  const errors = [];
  
  if (!isValidChipSettings(chip)) {
    errors.push('チップ設定が不正です');
    return { valid: false, errors };
  }
  
  if (chip.initialCount < 0 || chip.initialCount > 100) {
    errors.push('初期チップ枚数は0-100の範囲で入力してください');
  }
  
  if (chip.pointsPerChip < 1 || chip.pointsPerChip > 50) {
    errors.push('1枚あたりのスコアは1-50の範囲で入力してください');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 部屋設定が有効かチェック
 * Check if Room settings are valid
 * @param {RoomSettings} settings - 部屋設定
 * @returns {boolean}
 */
export function isValidRoomSettings(settings) {
  return (
    settings &&
    isValidUmaSettings(settings.uma) &&
    isValidOkaSettings(settings.oka) &&
    isValidYakitoriSettings(settings.yakitori) &&
    isValidChipSettings(settings.chip)
  );
}

/**
 * 順位が有効かチェック
 * Check if rank is valid (1-4)
 * @param {number} rank - 順位
 * @returns {boolean}
 */
export function isValidRank(rank) {
  return typeof rank === 'number' && rank >= 1 && rank <= 4 && Number.isInteger(rank);
}

/**
 * チップ数が有効かチェック
 * Check if chip count is valid
 * @param {number} chipCount - チップ数
 * @returns {boolean}
 */
export function isValidChipCount(chipCount) {
  return typeof chipCount === 'number' && isFinite(chipCount);
}

/**
 * チップ数の範囲チェック（詳細版）
 * Validate chip count range
 * @param {number} chipCount - チップ数
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateChipCountRange(chipCount) {
  if (!isValidChipCount(chipCount)) {
    return { valid: false, error: 'チップ数は数値で入力してください' };
  }
  
  if (chipCount < -50 || chipCount > 50) {
    return { valid: false, error: 'チップ数は-50~50の範囲で入力してください' };
  }
  
  return { valid: true };
}

/**
 * 部屋設定の完全検証
 * Complete room settings validation
 * @param {RoomSettings} settings - 部屋設定
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateRoomSettingsComplete(settings) {
  const errors = [];
  
  if (!settings) {
    return { valid: false, errors: ['部屋設定が存在しません'] };
  }
  
  const umaValidation = validateUmaSettingsRange(settings.uma);
  if (!umaValidation.valid) {
    errors.push(...umaValidation.errors);
  }
  
  const okaValidation = validateOkaSettingsRange(settings.oka);
  if (!okaValidation.valid) {
    errors.push(...okaValidation.errors);
  }
  
  const yakitoriValidation = validateYakitoriSettingsRange(settings.yakitori);
  if (!yakitoriValidation.valid) {
    errors.push(...yakitoriValidation.errors);
  }
  
  const chipValidation = validateChipSettingsRange(settings.chip);
  if (!chipValidation.valid) {
    errors.push(...chipValidation.errors);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
