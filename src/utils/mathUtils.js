/**
 * 数学ユーティリティ
 * Math utilities
 */

/**
 * 五捨六入を行う
 * Round using "go-sha roku-nyu" (round down if digit is 5 or less, round up if 6 or more)
 * 
 * 五捨六入のルール:
 * - 対象桁の次の桁が5以下の場合は切り捨て
 * - 対象桁の次の桁が6以上の場合は切り上げ
 * 
 * @param {number} value - 丸める値
 * @param {number} [precision=1] - 小数点以下の桁数（デフォルト: 1桁）
 * @returns {number} 五捨六入された値
 */
export function roundGoshaRokunyu(value, precision = 1) {
  if (typeof value !== 'number' || !isFinite(value)) {
    return value;
  }
  
  // 整数の場合はそのまま返す
  if (Number.isInteger(value)) {
    return value;
  }
  
  const factor = Math.pow(10, precision);
  const nextFactor = Math.pow(10, precision + 1);
  
  // 文字列を使って正確な桁を取得（浮動小数点数の精度問題を回避）
  const valueStr = value.toFixed(precision + 3); // 十分な桁数で固定
  const decimalIndex = valueStr.indexOf('.');
  
  if (decimalIndex === -1) {
    return value;
  }
  
  // 対象桁の次の桁を取得
  const targetDigitIndex = decimalIndex + precision + 1;
  const nextDigit = targetDigitIndex < valueStr.length ? 
    parseInt(valueStr[targetDigitIndex], 10) : 0;
  
  // 五捨六入の判定
  const targetValue = value * factor;
  
  if (nextDigit <= 5) {
    // 切り捨て
    if (value >= 0) {
      return Math.floor(targetValue) / factor;
    } else {
      return Math.ceil(targetValue) / factor;
    }
  } else {
    // 切り上げ
    if (value >= 0) {
      return Math.ceil(targetValue) / factor;
    } else {
      return Math.floor(targetValue) / factor;
    }
  }
}

/**
 * スコア計算用の五捨六入（小数点第1位まで）
 * Round for score calculation (to 1 decimal place)
 * 
 * @param {number} value - 丸める値
 * @returns {number} 五捨六入された値（小数点第1位まで）
 */
export function roundScore(value) {
  return roundGoshaRokunyu(value, 1);
}