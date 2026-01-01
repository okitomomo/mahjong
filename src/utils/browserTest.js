/**
 * ブラウザコンソール用のテスト関数
 * Test functions for browser console
 */

import { calculateOkaForPlayers, calculateUma, calculateRanks } from './scoreCalculator.js';
import { roundScore } from './mathUtils.js';

// グローバルに関数を公開
window.mahjongTest = {
  /**
   * 簡単な得点計算テスト
   */
  quickTest() {
    console.log('=== 麻雀得点計算テスト ===');
    
    // テストデータ
    const gameResults = [
      { memberId: 'player1', memberName: '東家', rawScore: 45000 },
      { memberId: 'player2', memberName: '南家', rawScore: 32000 },
      { memberId: 'player3', memberName: '西家', rawScore: 18000 },
      { memberId: 'player4', memberName: '北家', rawScore: 5000 },
    ];

    const roomSettings = {
      oka: { startPoints: 25000, returnPoints: 30000 },
      uma: { topBottom: 20, middlePair: 10 },
    };

    // 順位計算
    const withRanks = calculateRanks(gameResults);
    
    // オカを一括計算（合計が0になるように調整）
    const okas = calculateOkaForPlayers(withRanks, 4, roomSettings.oka);
    
    // 各プレイヤーの最終スコア計算
    const finalResults = withRanks.map((result, index) => {
      const oka = okas[index];
      const uma = calculateUma(result.rank, 4, roomSettings.uma);
      const finalScore = roundScore(oka + uma);
      
      return {
        ...result,
        oka,
        uma,
        finalScore,
      };
    });

    // 結果表示
    console.table(finalResults.map(r => ({
      プレイヤー: r.memberName,
      素点: r.rawScore.toLocaleString(),
      順位: r.rank + '位',
      オカ: r.oka,
      ウマ: r.uma,
      最終スコア: r.finalScore,
    })));

    const total = finalResults.reduce((sum, r) => sum + r.finalScore, 0);
    console.log(`合計スコア: ${total} (0になるはず)`);
    
    return finalResults;
  },

  /**
   * カスタムテスト
   */
  customTest(scores, settings = {}) {
    const defaultSettings = {
      oka: { startPoints: 25000, returnPoints: 30000 },
      uma: { topBottom: 20, middlePair: 10 },
    };
    
    const roomSettings = { ...defaultSettings, ...settings };
    
    // 素点配列から結果オブジェクトを作成
    const gameResults = scores.map((score, index) => ({
      memberId: `player${index + 1}`,
      memberName: `プレイヤー${index + 1}`,
      rawScore: score,
    }));

    const withRanks = calculateRanks(gameResults);
    
    // オカを一括計算（合計が0になるように調整）
    const okas = calculateOkaForPlayers(withRanks, scores.length, roomSettings.oka);
    
    const finalResults = withRanks.map((result, index) => {
      const oka = okas[index];
      const uma = calculateUma(result.rank, scores.length, roomSettings.uma);
      const finalScore = roundScore(oka + uma);
      
      return { 
        ...result, 
        oka,
        uma,
        finalScore,
      };
    });

    console.table(finalResults.map(r => ({
      プレイヤー: r.memberName,
      素点: r.rawScore.toLocaleString(),
      順位: r.rank + '位',
      オカ: r.oka,
      ウマ: r.uma,
      最終スコア: r.finalScore,
    })));

    return finalResults;
  },

  /**
   * 使用例を表示
   */
  help() {
    console.log(`
=== 麻雀得点計算テスト 使用方法 ===

1. 基本テスト:
   mahjongTest.quickTest()

2. カスタムテスト:
   mahjongTest.customTest([45000, 32000, 18000, 5000])
   
3. 設定変更テスト:
   mahjongTest.customTest([45000, 32000, 18000, 5000], {
     oka: { startPoints: 30000, returnPoints: 30000 },
     uma: { topBottom: 30, middlePair: 10 }
   })

4. 3人麻雀テスト:
   mahjongTest.customTest([50000, 35000, 20000])
`);
  }
};

// 初期化メッセージ
console.log('麻雀テスト関数が利用可能です。mahjongTest.help() で使用方法を確認してください。');