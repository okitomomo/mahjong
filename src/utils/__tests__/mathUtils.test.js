/**
 * 数学ユーティリティのテスト
 * Tests for math utilities
 */

import { describe, it, expect } from 'vitest';
import { roundGoshaRokunyu, roundScore } from '../mathUtils.js';

describe('五捨六入テスト', () => {
  describe('roundGoshaRokunyu', () => {
    it('正の数の五捨六入（小数点第1位）', () => {
      // 5以下は切り捨て
      expect(roundGoshaRokunyu(1.25, 1)).toBe(1.2);
      expect(roundGoshaRokunyu(1.15, 1)).toBe(1.1);
      expect(roundGoshaRokunyu(1.05, 1)).toBe(1.0);
      expect(roundGoshaRokunyu(1.55, 1)).toBe(1.5);
      
      // 6以上は切り上げ
      expect(roundGoshaRokunyu(1.26, 1)).toBe(1.3);
      expect(roundGoshaRokunyu(1.16, 1)).toBe(1.2);
      expect(roundGoshaRokunyu(1.06, 1)).toBe(1.1);
      expect(roundGoshaRokunyu(1.56, 1)).toBe(1.6);
      expect(roundGoshaRokunyu(1.99, 1)).toBe(2.0);
    });

    it('負の数の五捨六入（小数点第1位）', () => {
      // 5以下は切り捨て（絶対値が小さくなる方向）
      expect(roundGoshaRokunyu(-1.25, 1)).toBe(-1.2);
      expect(roundGoshaRokunyu(-1.15, 1)).toBe(-1.1);
      expect(roundGoshaRokunyu(-1.05, 1)).toBe(-1.0);
      
      // 6以上は切り上げ（絶対値が大きくなる方向）
      expect(roundGoshaRokunyu(-1.26, 1)).toBe(-1.3);
      expect(roundGoshaRokunyu(-1.16, 1)).toBe(-1.2);
      expect(roundGoshaRokunyu(-1.06, 1)).toBe(-1.1);
    });

    it('整数の場合はそのまま返す', () => {
      expect(roundGoshaRokunyu(5, 1)).toBe(5);
      expect(roundGoshaRokunyu(-3, 1)).toBe(-3);
      expect(roundGoshaRokunyu(0, 1)).toBe(0);
    });

    it('小数点第2位での五捨六入', () => {
      expect(roundGoshaRokunyu(1.235, 2)).toBe(1.23);
      expect(roundGoshaRokunyu(1.236, 2)).toBe(1.24);
      expect(roundGoshaRokunyu(1.225, 2)).toBe(1.22);
      expect(roundGoshaRokunyu(1.226, 2)).toBe(1.23);
    });

    it('特殊な値の処理', () => {
      expect(roundGoshaRokunyu(NaN, 1)).toBeNaN();
      expect(roundGoshaRokunyu(Infinity, 1)).toBe(Infinity);
      expect(roundGoshaRokunyu(-Infinity, 1)).toBe(-Infinity);
    });
  });

  describe('roundScore', () => {
    it('スコア計算用の五捨六入', () => {
      // オカ計算の例
      expect(roundScore(15 / 1000)).toBe(0.0); // 0.015 -> 0.0
      expect(roundScore(16 / 1000)).toBe(0.0); // 0.016 -> 0.0
      expect(roundScore(25 / 1000)).toBe(0.0); // 0.025 -> 0.0
      expect(roundScore(26 / 1000)).toBe(0.0); // 0.026 -> 0.0
      
      expect(roundScore(150 / 1000)).toBe(0.1); // 0.15 -> 0.1
      expect(roundScore(160 / 1000)).toBe(0.2); // 0.16 -> 0.2
      expect(roundScore(250 / 1000)).toBe(0.2); // 0.25 -> 0.2
      expect(roundScore(260 / 1000)).toBe(0.3); // 0.26 -> 0.3
      
      // 実際のオカ計算例
      expect(roundScore((45000 - 30000) / 1000)).toBe(15.0);
      expect(roundScore((32000 - 30000) / 1000)).toBe(2.0);
      expect(roundScore((18000 - 30000) / 1000)).toBe(-12.0);
      expect(roundScore((5000 - 30000) / 1000)).toBe(-25.0);
    });
  });

  describe('麻雀の実際の計算例', () => {
    it('オカ計算での五捨六入', () => {
      // 1位のオカボーナス計算例
      const startPoints = 25000;
      const returnPoints = 30000;
      const playerCount = 4;
      
      const okaBonus = roundScore(((returnPoints - startPoints) / 1000) * playerCount);
      expect(okaBonus).toBe(20.0); // (30000-25000)/1000 * 4 = 20.0
      
      // 微妙な計算例
      const rawScore = 25001;
      const baseOka = roundScore((rawScore - returnPoints) / 1000);
      expect(baseOka).toBe(-5.0); // (25001-30000)/1000 = -4.999 -> -5.0
    });

    it('ウマとオカの合計での五捨六入', () => {
      const oka = 15.3;
      const uma = 20;
      const finalScore = roundScore(oka + uma);
      expect(finalScore).toBe(35.3);
      
      const oka2 = -12.7;
      const uma2 = -20;
      const finalScore2 = roundScore(oka2 + uma2);
      expect(finalScore2).toBe(-32.7);
    });
  });
});