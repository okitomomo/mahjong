/**
 * ユーザーID生成ユーティリティ
 * User ID generation utilities
 */

/**
 * UUID v4を生成
 * Generate UUID v4
 * 
 * @returns {string} UUID
 */
export function generateUserId() {
  // UUID v4形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * UUIDが有効な形式かチェック
 * Check if UUID is valid format
 * 
 * @param {string} uuid - UUID文字列
 * @returns {boolean}
 */
export function isValidUserId(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
}
