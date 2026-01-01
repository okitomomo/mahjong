/**
 * 素点の100の位五捨六入テスト
 * Tests for raw score rounding to nearest 100
 */

import { describe, it, expect } from 'vitest';
import { roundRawScore, calculateOka } from '../scoreCalculator.js';

describe('素点の1000の位五捨六入', () => {
  describe('roundRawScore', () => {
    it('1000の位で五捨六入される（百の位を見て判定）', () => {
      // 百の位が5以下は切り捨て
      expect(roundRawScore(49400)).toBe(49000); // 百の位4 → 切り捨て
      expect(roundRawScore(49500)).toBe(49000); // 百の位5 → 切り捨て
      expect(roundRawScore(50400)).toBe(50000); // 百の位4 → 切り捨て
      expect(roundRawScore(50500)).toBe(50000); // 百の位5 → 切り捨て
      
      // 百の位が6以上は切り上げ
      expect(roundRawScore(49600)).toBe(50000); // 百の位6 → 切り上げ
      expect(roundRawScore(50600)).toBe(51000); // 百の位6 → 切り上げ
      expect(roundRawScore(49700)).toBe(50000); // 百の位7 → 切り上げ
      expect(roundRawScore(49900)).toBe(50000); // 百の位9 → 切り上げ
    });

    it('既に1000の倍数の場合はそのまま', () => {
      expect(roundRawScore(25000)).toBe(25000);
      expect(roundRawScore(30000)).toBe(30000);
      expect(roundRawScore(0)).toBe(0);
    });

    it('負の値でも正しく動作する', () => {
      expect(roundRawScore(-49500)).toBe(-49000);
      expect(roundRawScore(-49600)).toBe(-50000);
    });
  });

  describe('オカ計算での素点五捨六入', () => {
    const okaSettings = {
      startPoints: 25000,
      returnPoints: 30000,
    };

    it('例: 49400点の2位のオカ計算', () => {
      // 49400 -> 49000 (1000の位で五捨六入)
      // 49000 - 30000 = 19000
      // 19000 / 1000 = 19
      const oka = calculateOka(49400, 2, 4, okaSettings);
      expect(oka).toBe(19);
    });

    it('例: 49500点の2位のオカ計算', () => {
      // 49500 -> 49000 (百の位5は切り捨て)
      // 49000 - 30000 = 19000
      // 19000 / 1000 = 19
      const oka = calculateOka(49500, 2, 4, okaSettings);
      expect(oka).toBe(19);
    });

    it('例: 49600点の2位のオカ計算', () => {
      // 49600 -> 50000 (百の位6は切り上げ)
      // 50000 - 30000 = 20000
      // 20000 / 1000 = 20
      const oka = calculateOka(49600, 2, 4, okaSettings);
      expect(oka).toBe(20);
    });

    it('オカが整数になることを確認', () => {
      // 1000の位で五捨六入するので、オカは必ず整数になる
      expect(calculateOka(31000, 2, 4, okaSettings)).toBe(1);
      expect(calculateOka(31500, 2, 4, okaSettings)).toBe(1); // 31000に切り捨て
      expect(calculateOka(31600, 2, 4, okaSettings)).toBe(2); // 32000に切り上げ
    });

    it('1位の場合のオカボーナス計算', () => {
      // 45000点の1位
      // 45000 -> 45000 (既に1000の倍数)
      // 基本オカ: (45000 - 30000) / 1000 = 15
      // オカボーナス: (30000 - 25000) / 1000 * 4 = 20
      // 合計: 15 + 20 = 35
      const oka = calculateOka(45000, 1, 4, okaSettings);
      expect(oka).toBe(35);
    });

    it('1位で素点に端数がある場合', () => {
      // 45400点の1位
      // 45400 -> 45000 (百の位4は切り捨て)
      // 基本オカ: (45000 - 30000) / 1000 = 15
      // オカボーナス: (30000 - 25000) / 1000 * 4 = 20
      // 合計: 15 + 20 = 35
      const oka = calculateOka(45400, 1, 4, okaSettings);
      expect(oka).toBe(35);
    });

    it('1位で素点が切り上げられる場合', () => {
      // 44600点の1位
      // 44600 -> 45000 (百の位6は切り上げ)
      // 基本オカ: (45000 - 30000) / 1000 = 15
      // オカボーナス: (30000 - 25000) / 1000 * 4 = 20
      // 合計: 15 + 20 = 35
      const oka = calculateOka(44600, 1, 4, okaSettings);
      expect(oka).toBe(35);
    });
  });

  describe('3人麻雀でのオカ計算', () => {
    const okaSettings = {
      startPoints: 35000,
      returnPoints: 35000,
    };

    it('返し点と開始点が同じ場合のオカボーナス', () => {
      // 50000点の1位、3人麻雀
      // 50000 -> 50000 (既に100の倍数)
      // 基本オカ: (50000 - 35000) / 1000 = 15
      // オカボーナス: (35000 - 35000) / 1000 * 3 = 0
      // 合計: 15 + 0 = 15
      const oka = calculateOka(50000, 1, 3, okaSettings);
      expect(oka).toBe(15);
    });
  });
});