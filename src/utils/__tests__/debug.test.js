/**
 * デバッグ用テスト
 */

import { describe, it, expect } from 'vitest';
import { roundRawScore, calculateOka } from '../scoreCalculator.js';
import { roundGoshaRokunyu } from '../mathUtils.js';

describe('デバッグ: 49400点の計算', () => {
  it('roundRawScore(49400)の動作を確認', () => {
    console.log('=== roundRawScore(49400) デバッグ ===');
    
    const rawScore = 49400;
    console.log('入力:', rawScore);
    
    // ステップ1: 100で割る
    const divided = rawScore / 100;
    console.log('100で割った値:', divided); // 494
    
    // ステップ2: 五捨六入（小数点以下0桁）
    const rounded = roundGoshaRokunyu(divided, 0);
    console.log('五捨六入後:', rounded); // 494のはず
    
    // ステップ3: 100を掛ける
    const result = rounded * 100;
    console.log('最終結果:', result); // 49400のはず
    
    // 実際の関数の結果
    const actualResult = roundRawScore(rawScore);
    console.log('roundRawScore結果:', actualResult);
    
    // 49400は既に100の倍数なので、そのまま49400になるはず
    // でも期待値は49000？
    expect(actualResult).toBe(49400); // まず現在の動作を確認
  });

  it('49400点は100の位で何に五捨六入されるべきか', () => {
    // 49400の100の位は4
    // 10の位は0、1の位は0
    // つまり下2桁は00
    // 00は5以下なので切り捨て → 49400のまま？
    
    // でも期待値が49000ということは...
    // もしかして49400の100の位（4）を見て、
    // 千の位で五捨六入する？
    
    console.log('49400の各桁:');
    console.log('万の位: 4');
    console.log('千の位: 9');
    console.log('百の位: 4'); // ← これを五捨六入？
    console.log('十の位: 0');
    console.log('一の位: 0');
    
    // 百の位が4なので5以下 → 切り捨て → 49000？
    expect(49400).toBe(49400); // まず理解を確認
  });

  it('正しい100の位五捨六入の理解', () => {
    // 100の位で五捨六入とは：
    // 49456 → 百の位は4、十の位は5、一の位は6
    // 十の位と一の位を見て五捨六入
    // 56は6以上なので切り上げ → 49500
    
    // 49400 → 百の位は4、十の位は0、一の位は0
    // 十の位と一の位を見て五捨六入
    // 00は5以下なので切り捨て → 49400
    
    // でも期待値が49000ということは、理解が間違っている？
  });
});