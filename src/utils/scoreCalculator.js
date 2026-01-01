/**
 * スコア計算ユーティリティ
 * Score calculation utilities
 * 
 * @typedef {import('../types/models').OkaSettings} OkaSettings
 * @typedef {import('../types/models').UmaSettings} UmaSettings
 * @typedef {import('../types/models').ScoreCalculation} ScoreCalculation
 */

import { roundScore, roundGoshaRokunyu } from './mathUtils.js';

/**
 * 素点を1000の位で五捨六入（百の位を見て判定）
 * Round raw score to nearest 1000 using go-sha roku-nyu (based on hundreds digit)
 * 
 * @param {number} rawScore - 素点 (Raw score)
 * @returns {number} 1000の位で五捨六入された素点 (Raw score rounded to nearest 1000)
 */
export function roundRawScore(rawScore) {
  // 1000で割って五捨六入し、再び1000を掛ける
  const divided = rawScore / 1000;
  const rounded = roundGoshaRokunyu(divided, 0);
  return rounded * 1000;
}

/**
 * オカを計算
 * Calculate Oka (starting point adjustment)
 * 
 * 計算手順:
 * 1. 素点を100の位で五捨六入
 * 2. (五捨六入後の素点 - 返し点) / 1000 でオカを計算
 * 3. 2位以下は基本オカのみ、1位は一括計算で調整される
 * 
 * 注意: 1位のオカは他のプレイヤーとの関係で決まるため、
 * 単体計算では正確な値が出ません。calculateOkaForPlayersを使用してください。
 * 
 * @param {number} rawScore - 素点 (Raw score)
 * @param {number} rank - 順位 (1-4) (Rank)
 * @param {number} playerCount - プレイヤー数 (3 or 4) (Player count)
 * @param {OkaSettings} okaSettings - オカ設定 (Oka settings)
 * @returns {number} オカ (Oka value)
 */
export function calculateOka(rawScore, rank, playerCount, okaSettings) {
  const { returnPoints } = okaSettings;
  
  // 1. 素点を100の位で五捨六入
  const roundedRawScore = roundRawScore(rawScore);
  
  // 2. 基本オカ: (五捨六入後の素点 - 返し点) / 1000
  const baseOka = (roundedRawScore - returnPoints) / 1000;
  
  if (rank === 1) {
    // 1位: 単体計算では基本オカ + オカボーナスを返す（参考値）
    // 実際の値は calculateOkaForPlayers で調整される
    const { startPoints } = okaSettings;
    const totalOkaBonus = ((returnPoints - startPoints) / 1000) * playerCount;
    return roundGoshaRokunyu(baseOka + totalOkaBonus, 0);
  } else {
    // 2位以下: 基本オカのみ
    return roundGoshaRokunyu(baseOka, 0);
  }
}

/**
 * 複数プレイヤーのオカを一括計算（合計が0になるように調整）
 * Calculate Oka for multiple players (adjusted so total equals 0)
 * 
 * @param {Array<{rawScore: number, rank: number}>} players - プレイヤー配列
 * @param {number} playerCount - プレイヤー数 (3 or 4)
 * @param {OkaSettings} okaSettings - オカ設定
 * @returns {Array<number>} 各プレイヤーのオカ配列
 */
export function calculateOkaForPlayers(players, playerCount, okaSettings) {
  const { returnPoints } = okaSettings;
  
  // 2位以下のオカを先に計算
  const okas = [];
  let nonFirstPlayersOkaSum = 0;
  
  players.forEach((player, index) => {
    if (player.rank !== 1) {
      // 2位以下: 基本オカのみ
      const roundedRawScore = roundRawScore(player.rawScore);
      const baseOka = (roundedRawScore - returnPoints) / 1000;
      const roundedOka = roundGoshaRokunyu(baseOka, 0);
      okas[index] = roundedOka;
      nonFirstPlayersOkaSum += roundedOka;
    }
  });
  
  // 1位のオカは2位以下の合計のマイナス値
  const firstPlayerIndex = players.findIndex(p => p.rank === 1);
  if (firstPlayerIndex !== -1) {
    okas[firstPlayerIndex] = -nonFirstPlayersOkaSum;
  }
  
  return okas;
}

/**
 * ウマを計算
 * Calculate Uma (rank bonus)
 * 
 * 4人麻雀:
 * - 1位: +topBottom
 * - 2位: +middlePair
 * - 3位: -middlePair
 * - 4位: -topBottom
 * 
 * 3人麻雀:
 * - 1位: +topBottom
 * - 2位: 0
 * - 3位: -topBottom
 * 
 * @param {number} rank - 順位 (1-4) (Rank)
 * @param {number} playerCount - プレイヤー数 (3 or 4) (Player count)
 * @param {UmaSettings} umaSettings - ウマ設定 (Uma settings)
 * @returns {number} ウマ (Uma value)
 */
export function calculateUma(rank, playerCount, umaSettings) {
  const { topBottom, middlePair } = umaSettings;
  
  if (playerCount === 4) {
    // 4人麻雀
    switch (rank) {
      case 1:
        return topBottom;
      case 2:
        return middlePair;
      case 3:
        return -middlePair;
      case 4:
        return -topBottom;
      default:
        return 0;
    }
  } else if (playerCount === 3) {
    // 3人麻雀
    switch (rank) {
      case 1:
        return topBottom;
      case 2:
        return 0;
      case 3:
        return -topBottom;
      default:
        return 0;
    }
  }
  
  return 0;
}

/**
 * 最終スコアを計算（チップ除く）
 * Calculate final score (excluding chips)
 * 
 * 計算式: オカ + ウマ
 * 
 * @param {number} rawScore - 素点 (Raw score)
 * @param {number} rank - 順位 (1-4) (Rank)
 * @param {number} playerCount - プレイヤー数 (3 or 4) (Player count)
 * @param {OkaSettings} okaSettings - オカ設定 (Oka settings)
 * @param {UmaSettings} umaSettings - ウマ設定 (Uma settings)
 * @returns {ScoreCalculation} スコア計算結果 (Score calculation result)
 */
export function calculateFinalScore(rawScore, rank, playerCount, okaSettings, umaSettings) {
  const oka = calculateOka(rawScore, rank, playerCount, okaSettings);
  const uma = calculateUma(rank, playerCount, umaSettings);
  const finalScore = roundScore(oka + uma);
  
  return {
    oka,
    uma,
    finalScore,
  };
}

/**
 * ヤキトリスコアを計算
 * Calculate Yakitori score
 * 
 * ヤキトリの人: -(ペナルティ / ヤキトリ人数)
 * ヤキトリでない人: +(ペナルティ / ヤキトリでない人数)
 * 
 * @param {Array<{memberId: string, isYakitori: boolean}>} results - 半荘結果配列 (Game results)
 * @param {number} penalty - ペナルティスコア（正の値で指定） (Penalty score, specified as positive value)
 * @returns {Object.<string, number>} メンバーIDをキーとしたヤキトリスコアのマップ (Map of member IDs to Yakitori scores)
 */
export function calculateYakitoriScores(results, penalty) {
  const yakitoriMembers = results.filter(r => r.isYakitori);
  const nonYakitoriMembers = results.filter(r => !r.isYakitori);
  
  const yakitoriCount = yakitoriMembers.length;
  const nonYakitoriCount = nonYakitoriMembers.length;
  
  const scores = {};
  
  // ヤキトリがいない、または全員ヤキトリの場合は0
  if (yakitoriCount === 0 || nonYakitoriCount === 0) {
    results.forEach(r => {
      scores[r.memberId] = 0;
    });
    return scores;
  }
  
  // ペナルティを正の値として扱う（絶対値を取る）
  const absPenalty = Math.abs(penalty);
  
  // ヤキトリの人: -(ペナルティ / ヤキトリ人数) を五捨六入
  const yakitoriPenalty = roundScore(-(absPenalty / yakitoriCount));
  yakitoriMembers.forEach(r => {
    scores[r.memberId] = yakitoriPenalty;
  });
  
  // ヤキトリでない人: +(ペナルティ / ヤキトリでない人数) を五捨六入
  const nonYakitoriBonus = roundScore(absPenalty / nonYakitoriCount);
  nonYakitoriMembers.forEach(r => {
    scores[r.memberId] = nonYakitoriBonus;
  });
  
  return scores;
}

/**
 * チップスコアを計算
 * Calculate chip score
 * 
 * 計算式: チップ増減 × 1枚あたりのスコア
 * 
 * @param {number} chipCount - チップ増減 (+/-) (Chip count change)
 * @param {number} pointsPerChip - 1枚あたりのスコア (Points per chip)
 * @returns {number} チップスコア (Chip score)
 */
export function calculateChipScore(chipCount, pointsPerChip) {
  return roundScore(chipCount * pointsPerChip);
}

/**
 * 最終スコア（チップ含む）を計算
 * Calculate final score including chips
 * 
 * 計算式: 最終スコア（チップ除く） + チップスコア
 * 
 * @param {number} finalScore - 最終スコア（チップ除く） (Final score excluding chips)
 * @param {number} chipScore - チップスコア (Chip score)
 * @returns {number} 最終スコア（チップ含む） (Final score including chips)
 */
export function calculateFinalScoreWithChip(finalScore, chipScore) {
  return roundScore(finalScore + chipScore);
}

/**
 * 素点から順位を計算
 * Calculate ranks from raw scores
 * 
 * 同点の場合は同順位として扱う
 * Ties are handled as same rank
 * 
 * @param {Array<{memberId: string, rawScore: number}>} scores - スコア配列 (Score array)
 * @returns {Array<{memberId: string, rawScore: number, rank: number}>} 順位付きスコア配列 (Scores with ranks)
 */
export function calculateRanks(scores) {
  // 得点の降順でソート
  const sorted = [...scores].sort((a, b) => b.rawScore - a.rawScore);
  
  // 順位を計算（同点は同順位）
  const withRanks = [];
  let currentRank = 1;
  
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].rawScore < sorted[i - 1].rawScore) {
      currentRank = i + 1;
    }
    
    withRanks.push({
      ...sorted[i],
      rank: currentRank,
    });
  }
  
  return withRanks;
}

/**
 * メンバーの合計スコアを計算
 * Calculate total scores for members
 * 
 * @param {string} memberId - メンバーID (Member ID)
 * @param {Array<import('../types/models').Game>} games - 半荘配列 (Games array)
 * @param {import('../types/models').YakitoriSettings} [yakitoriSettings] - ヤキトリ設定（非推奨：新仕様では使用しない）(Yakitori settings - deprecated)
 * @returns {{totalScore: number, gamesPlayed: number, ranks: {first: number, second: number, third: number, fourth: number}}}
 */
export function calculateMemberTotalScore(memberId, games, yakitoriSettings = null) {
  let totalScore = 0;
  let gamesPlayed = 0;
  const ranks = {
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
  };
  
  for (const game of games) {
    const result = game.results.find(r => r.memberId === memberId);
    if (result) {
      // finalScoreWithChipには既にヤキトリスコアが含まれている
      totalScore += result.finalScoreWithChip;
      gamesPlayed++;
      
      // 順位別回数をカウント
      switch (result.rank) {
        case 1:
          ranks.first++;
          break;
        case 2:
          ranks.second++;
          break;
        case 3:
          ranks.third++;
          break;
        case 4:
          ranks.fourth++;
          break;
      }
    }
  }
  
  return {
    totalScore,
    gamesPlayed,
    ranks,
  };
}


