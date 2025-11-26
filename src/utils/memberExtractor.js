/**
 * メンバー情報抽出ユーティリティ
 * Member information extraction utilities
 */

/**
 * ゲーム結果からユニークなメンバーリストを抽出
 * Extract unique member list from game results
 * 
 * @param {import('../types/models').Game[]} games - ゲームの配列
 * @returns {Array<{id: string, name: string}>} ユニークなメンバーリスト
 */
export function extractUniqueMembers(games) {
  if (!games || games.length === 0) {
    return [];
  }
  
  const memberMap = new Map();
  
  games.forEach(game => {
    if (game.results && Array.isArray(game.results)) {
      game.results.forEach(result => {
        if (result.memberId && result.memberName && !memberMap.has(result.memberId)) {
          memberMap.set(result.memberId, {
            id: result.memberId,
            name: result.memberName,
          });
        }
      });
    }
  });
  
  return Array.from(memberMap.values());
}

/**
 * メンバーリストを名前の文字列に変換
 * Convert member list to comma-separated string
 * 
 * @param {Array<{id: string, name: string}>} members - メンバーリスト
 * @param {number} [maxDisplay=3] - 最大表示数
 * @returns {string} カンマ区切りのメンバー名
 */
export function formatMemberNames(members, maxDisplay = 3) {
  if (!members || members.length === 0) {
    return '参加者なし';
  }
  
  const names = members.map(m => m.name);
  
  if (names.length <= maxDisplay) {
    return names.join(', ');
  }
  
  const displayNames = names.slice(0, maxDisplay);
  const remaining = names.length - maxDisplay;
  return `${displayNames.join(', ')} 他${remaining}名`;
}
