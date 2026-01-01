/**
 * テスト用データジェネレーター
 * Test data generator for score calculation testing
 */

/**
 * ランダムな4人麻雀の結果を生成
 * Generate random 4-player mahjong results
 * 
 * @param {Object} options - オプション
 * @param {number} options.playerCount - プレイヤー数（3または4）
 * @param {boolean} options.validTotal - 合計点数を正しくするか
 * @param {number} options.startPoints - 開始点（デフォルト：25000）
 * @returns {Array} ゲーム結果
 */
export function generateRandomGameResults(options = {}) {
  const { playerCount = 4, validTotal = true, startPoints = 25000 } = options;
  const totalPoints = startPoints * playerCount;
  
  // プレイヤー名生成
  const playerNames = ['東家', '南家', '西家', '北家'].slice(0, playerCount);
  
  if (validTotal) {
    // 合計が正しくなるように生成
    let scores = [];
    let remainingTotal = totalPoints;
    
    // 最後のプレイヤー以外をランダム生成
    for (let i = 0; i < playerCount - 1; i++) {
      // 残りのプレイヤー数を考慮して範囲を制限
      const remainingPlayers = playerCount - i;
      const minScore = Math.max(0, remainingTotal - (remainingPlayers - 1) * totalPoints * 0.8);
      const maxScore = Math.min(totalPoints * 0.8, remainingTotal);
      
      // 100点刻みでランダム生成
      const range = Math.floor((maxScore - minScore) / 100);
      const score = Math.floor(minScore / 100) * 100 + Math.floor(Math.random() * (range + 1)) * 100;
      
      scores.push(score);
      remainingTotal -= score;
    }
    
    // 最後のプレイヤーは残りの点数
    scores.push(remainingTotal);
    
    // 結果オブジェクト生成
    return scores.map((score, index) => ({
      memberId: `player${index + 1}`,
      memberName: playerNames[index],
      rawScore: score,
    }));
  } else {
    // ランダムな得点生成（合計は考慮しない）
    let scores = [];
    for (let i = 0; i < playerCount; i++) {
      // 0〜60000の範囲でランダム生成（100点刻み）
      const score = Math.floor(Math.random() * 600) * 100;
      scores.push(score);
    }
    
    // 結果オブジェクト生成
    return scores.map((score, index) => ({
      memberId: `player${index + 1}`,
      memberName: playerNames[index],
      rawScore: score,
    }));
  }
}

/**
 * 典型的なゲームシナリオを生成
 * Generate typical game scenarios
 * 
 * @param {number} startPoints - 開始点（デフォルト：25000）
 * @returns {Object} シナリオオブジェクト
 */
export function generateTypicalScenarios(startPoints = 25000) {
  const totalPoints = startPoints * 4;
  const threePlayerTotal = startPoints * 3;
  
  return {
    // 大差がついたゲーム
    bigDifference: [
      { memberId: 'player1', memberName: '東家', rawScore: Math.floor(totalPoints * 0.6) },
      { memberId: 'player2', memberName: '南家', rawScore: Math.floor(totalPoints * 0.25) },
      { memberId: 'player3', memberName: '西家', rawScore: Math.floor(totalPoints * 0.15) },
      { memberId: 'player4', memberName: '北家', rawScore: totalPoints - Math.floor(totalPoints * 0.6) - Math.floor(totalPoints * 0.25) - Math.floor(totalPoints * 0.15) },
    ],
    
    // 接戦
    closeGame: [
      { memberId: 'player1', memberName: '東家', rawScore: Math.floor(totalPoints * 0.28) },
      { memberId: 'player2', memberName: '南家', rawScore: Math.floor(totalPoints * 0.26) },
      { memberId: 'player3', memberName: '西家', rawScore: Math.floor(totalPoints * 0.24) },
      { memberId: 'player4', memberName: '北家', rawScore: totalPoints - Math.floor(totalPoints * 0.28) - Math.floor(totalPoints * 0.26) - Math.floor(totalPoints * 0.24) },
    ],
    
    // 同点あり
    tiedGame: [
      { memberId: 'player1', memberName: '東家', rawScore: Math.floor(totalPoints * 0.3) },
      { memberId: 'player2', memberName: '南家', rawScore: Math.floor(totalPoints * 0.25) },
      { memberId: 'player3', memberName: '西家', rawScore: Math.floor(totalPoints * 0.25) },
      { memberId: 'player4', memberName: '北家', rawScore: totalPoints - Math.floor(totalPoints * 0.3) - Math.floor(totalPoints * 0.25) - Math.floor(totalPoints * 0.25) },
    ],
    
    // 3人麻雀
    threePlayers: [
      { memberId: 'player1', memberName: '東家', rawScore: Math.floor(threePlayerTotal * 0.45) },
      { memberId: 'player2', memberName: '南家', rawScore: Math.floor(threePlayerTotal * 0.35) },
      { memberId: 'player3', memberName: '西家', rawScore: threePlayerTotal - Math.floor(threePlayerTotal * 0.45) - Math.floor(threePlayerTotal * 0.35) },
    ],
  };
}

/**
 * 複数ゲームのシリーズを生成
 * Generate a series of multiple games
 * 
 * @param {number} gameCount - ゲーム数
 * @param {number} playerCount - プレイヤー数
 * @param {number} startPoints - 開始点（デフォルト：25000）
 * @returns {Array} ゲームシリーズ
 */
export function generateGameSeries(gameCount = 5, playerCount = 4, startPoints = 25000) {
  const games = [];
  
  for (let i = 0; i < gameCount; i++) {
    const results = generateRandomGameResults({ playerCount, validTotal: true, startPoints });
    games.push({
      id: `game${i + 1}`,
      gameNumber: i + 1,
      results,
      status: 'completed',
    });
  }
  
  return games;
}

/**
 * ヤキトリ設定付きの結果を生成
 * Generate results with yakitori settings
 * 
 * @param {Array} baseResults - 基本結果
 * @param {number} yakitoriThreshold - ヤキトリ判定閾値（デフォルト: 30000）
 * @returns {Array} ヤキトリ情報付き結果
 */
export function addYakitoriInfo(baseResults, yakitoriThreshold = 30000) {
  return baseResults.map(result => ({
    ...result,
    isYakitori: result.rawScore < yakitoriThreshold,
  }));
}

/**
 * テスト用の部屋設定を生成
 * Generate room settings for testing
 */
export function generateRoomSettings(options = {}) {
  return {
    oka: {
      startPoints: options.startPoints || 25000,
      returnPoints: options.returnPoints || 30000,
    },
    uma: {
      topBottom: options.topBottom || 20,
      middlePair: options.middlePair || 10,
    },
    yakitori: {
      enabled: options.yakitoriEnabled || false,
      penalty: options.yakitoriPenalty || 12,
    },
    chip: {
      enabled: options.chipEnabled || false,
      pointsPerChip: options.pointsPerChip || 1,
    },
  };
}

/**
 * コンソールに結果を見やすく表示
 * Display results in a readable format
 * 
 * @param {Array} results - 結果配列
 * @param {string} title - タイトル
 */
export function displayResults(results, title = 'ゲーム結果') {
  console.log(`\n=== ${title} ===`);
  console.table(results.map(r => ({
    プレイヤー: r.memberName,
    素点: r.rawScore?.toLocaleString() || '未入力',
    順位: r.rank || '未確定',
    オカ: r.oka || 0,
    ウマ: r.uma || 0,
    最終スコア: r.finalScore || 0,
  })));
  
  if (results.some(r => r.finalScore !== undefined)) {
    const total = results.reduce((sum, r) => sum + (r.finalScore || 0), 0);
    console.log(`合計スコア: ${total}`);
  }
}

/**
 * ブラウザのコンソールでテストを実行
 * Run tests in browser console
 * 
 * @param {number} startPoints - 開始点（デフォルト：25000）
 */
export function runBrowserTest(startPoints = 25000) {
  console.log('=== 麻雀得点計算テスト ===');
  
  // 典型的なシナリオをテスト
  const scenarios = generateTypicalScenarios(startPoints);
  
  Object.entries(scenarios).forEach(([name, results]) => {
    displayResults(results, name);
  });
  
  // ランダムゲームもテスト
  const randomGame = generateRandomGameResults({ playerCount: 4, validTotal: true, startPoints });
  displayResults(randomGame, 'ランダムゲーム');
  
  console.log('\n=== テスト完了 ===');
  console.log('詳細なテストは npm run test で実行してください');
}