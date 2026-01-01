/**
 * 得点計算の統合テスト
 * Integration tests for score calculation
 * 
 * 4人分の実際のゲームシナリオをテストする
 */

import { describe, it, expect } from 'vitest';
import { calculateFinalScore, calculateRanks, calculateYakitoriScores, calculateOkaForPlayers, calculateUma } from '../scoreCalculator.js';
import { roundScore } from '../mathUtils.js';

describe('得点計算統合テスト', () => {
  const defaultOkaSettings = {
    startPoints: 25000,
    returnPoints: 30000,
  };

  const defaultUmaSettings = {
    topBottom: 20,
    middlePair: 10,
  };

  it('4人麻雀の典型的なゲーム結果をテストする', () => {
    // 実際のゲーム結果例（端数あり）
    const gameResults = [
      { memberId: 'player1', memberName: '東家', rawScore: 45050 }, // -> 45000
      { memberId: 'player2', memberName: '南家', rawScore: 32160 }, // -> 32000
      { memberId: 'player3', memberName: '西家', rawScore: 17850 }, // -> 17800
      { memberId: 'player4', memberName: '北家', rawScore: 4940 },  // -> 5000
    ];

    // 順位計算
    const withRanks = calculateRanks(gameResults);
    
    // オカを一括計算（合計が0になるように調整）
    const okas = calculateOkaForPlayers(withRanks, 4, defaultOkaSettings);
    
    // 各プレイヤーの最終スコア計算
    const finalResults = withRanks.map((result, index) => {
      const uma = calculateUma(result.rank, 4, defaultUmaSettings);
      const oka = okas[index];
      const finalScore = roundScore(oka + uma);
      
      return {
        ...result,
        oka,
        uma,
        finalScore,
      };
    });

    // 結果検証
    expect(finalResults).toHaveLength(4);
    
    // 1位（45050点 -> 45000点）の検証
    const first = finalResults.find(r => r.rank === 1);
    expect(first.memberId).toBe('player1');
    expect(first.uma).toBe(20); // 1位ウマ
    
    // 2位（32160点 -> 32000点）の検証
    const second = finalResults.find(r => r.rank === 2);
    expect(second.memberId).toBe('player2');
    expect(second.uma).toBe(10); // 2位ウマ
    
    // 3位（17850点 -> 17800点）の検証
    const third = finalResults.find(r => r.rank === 3);
    expect(third.memberId).toBe('player3');
    expect(third.uma).toBe(-10); // 3位ウマ
    
    // 4位（4940点 -> 5000点）の検証
    const fourth = finalResults.find(r => r.rank === 4);
    expect(fourth.memberId).toBe('player4');
    expect(fourth.uma).toBe(-20); // 4位ウマ

    // オカの合計が0になることを確認
    const totalOka = finalResults.reduce((sum, r) => sum + r.oka, 0);
    expect(totalOka).toBe(0);
    
    // ウマの合計が0になることを確認
    const totalUma = finalResults.reduce((sum, r) => sum + r.uma, 0);
    expect(totalUma).toBe(0);

    // 合計スコアが0になることを確認（チップ除く）
    const totalFinalScore = finalResults.reduce((sum, r) => sum + r.finalScore, 0);
    expect(Math.abs(totalFinalScore)).toBeLessThan(0.1); // 五捨六入の誤差を考慮
  });

  it('3人麻雀の典型的なゲーム結果をテストする', () => {
    const gameResults = [
      { memberId: 'player1', memberName: '東家', rawScore: 50000 },
      { memberId: 'player2', memberName: '南家', rawScore: 35000 },
      { memberId: 'player3', memberName: '西家', rawScore: 20000 },
    ];

    const withRanks = calculateRanks(gameResults);
    const finalResults = withRanks.map(result => {
      const calculation = calculateFinalScore(
        result.rawScore,
        result.rank,
        3,
        defaultOkaSettings,
        defaultUmaSettings
      );
      
      return {
        ...result,
        ...calculation,
      };
    });

    expect(finalResults).toHaveLength(3);
    
    // 2位のウマが0であることを確認
    const second = finalResults.find(r => r.rank === 2);
    expect(second.uma).toBe(0);
  });

  it('ヤキトリペナルティの計算をテストする', () => {
    const gameResults = [
      { memberId: 'player1', isYakitori: false },
      { memberId: 'player2', isYakitori: true },
      { memberId: 'player3', isYakitori: true },
      { memberId: 'player4', isYakitori: false },
    ];

    const yakitoriScores = calculateYakitoriScores(gameResults, 12);

    // ヤキトリでない人（2人）: +6点ずつｓ
    expect(yakitoriScores['player4']).toBe(6);
    
    // ヤキトリの人（2人）: -6点ずつ
    expect(yakitoriScores['player2']).toBe(-6);
    expect(yakitoriScores['player3']).toBe(-6);

    // 合計が0になることを確認
    const total = Object.values(yakitoriScores).reduce((sum, score) => sum + score, 0);
    expect(total).toBe(0);
  });

  it('複数ゲームの累計スコアをテストする', () => {
    // ゲーム1の結果
    const game1Results = [
      { memberId: 'player1', rawScore: 45000, rank: 1, finalScoreWithChip: 35 },
      { memberId: 'player2', rawScore: 32000, rank: 2, finalScoreWithChip: 10 },
      { memberId: 'player3', rawScore: 18000, rank: 3, finalScoreWithChip: -10 },
      { memberId: 'player4', rawScore: 5000, rank: 4, finalScoreWithChip: -35 },
    ];

    // ゲーム2の結果
    const game2Results = [
      { memberId: 'player1', rawScore: 20000, rank: 3, finalScoreWithChip: -15 },
      { memberId: 'player2', rawScore: 40000, rank: 1, finalScoreWithChip: 30 },
      { memberId: 'player3', rawScore: 35000, rank: 2, finalScoreWithChip: 5 },
      { memberId: 'player4', rawScore: 5000, rank: 4, finalScoreWithChip: -20 },
    ];

    const games = [
      { results: game1Results },
      { results: game2Results },
    ];

    // 各プレイヤーの累計スコア計算
    const playerTotals = {};
    ['player1', 'player2', 'player3', 'player4'].forEach(playerId => {
      let total = 0;
      games.forEach(game => {
        const result = game.results.find(r => r.memberId === playerId);
        if (result) {
          total += result.finalScoreWithChip;
        }
      });
      playerTotals[playerId] = total;
    });

    // 結果検証
    expect(playerTotals['player1']).toBe(20); // 35 + (-15)
    expect(playerTotals['player2']).toBe(40); // 10 + 30
    expect(playerTotals['player3']).toBe(-5); // (-10) + 5
    expect(playerTotals['player4']).toBe(-55); // (-35) + (-20)

    // 全体の合計が0になることを確認
    const grandTotal = Object.values(playerTotals).reduce((sum, score) => sum + score, 0);
    expect(grandTotal).toBe(0);
  });
});