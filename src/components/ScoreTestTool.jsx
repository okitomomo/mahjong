/**
 * 得点計算テストツール
 * Score calculation test tool for browser testing
 */

import React, { useState } from 'react';
import { calculateOkaForPlayers, calculateUma, calculateRanks, calculateYakitoriScores } from '../utils/scoreCalculator.js';
import { roundScore } from '../utils/mathUtils.js';
import { generateRandomGameResults, generateTypicalScenarios, generateRoomSettings } from '../utils/testDataGenerator.js';

export function ScoreTestTool() {
  const [playerCount, setPlayerCount] = useState(4);
  const [gameResults, setGameResults] = useState([]);
  const [roomSettings, setRoomSettings] = useState(generateRoomSettings());
  const [calculatedResults, setCalculatedResults] = useState([]);

  // ランダムゲーム生成
  const generateRandomGame = () => {
    const results = generateRandomGameResults({ 
      playerCount, 
      validTotal: true, 
      startPoints: roomSettings.oka.startPoints 
    });
    setGameResults(results);
    calculateScores(results);
  };

  // 典型的なシナリオ選択
  const loadScenario = (scenarioName) => {
    const scenarios = generateTypicalScenarios(roomSettings.oka.startPoints);
    const results = scenarios[scenarioName];
    if (results) {
      setPlayerCount(results.length);
      setGameResults(results);
      calculateScores(results);
    }
  };

  // スコア計算実行
  const calculateScores = (results) => {
    // 順位計算
    const withRanks = calculateRanks(results);
    
    // オカを一括計算（合計が0になるように調整）
    const okas = calculateOkaForPlayers(withRanks, playerCount, roomSettings.oka);
    
    // 各プレイヤーの最終スコア計算
    const finalResults = withRanks.map((result, index) => {
      const oka = okas[index];
      const uma = calculateUma(result.rank, playerCount, roomSettings.uma);
      const finalScore = roundScore(oka + uma);
      
      return {
        ...result,
        oka,
        uma,
        finalScore,
      };
    });

    // ヤキトリスコア計算（有効な場合）
    let yakitoriScores = {};
    if (roomSettings.yakitori.enabled) {
      const yakitoriResults = finalResults.map(r => ({
        memberId: r.memberId,
        isYakitori: r.rawScore < 30000, // 30000点未満をヤキトリとする
      }));
      yakitoriScores = calculateYakitoriScores(yakitoriResults, roomSettings.yakitori.penalty);
    }

    // 最終結果にヤキトリスコアを追加
    const resultsWithYakitori = finalResults.map(result => ({
      ...result,
      yakitoriScore: yakitoriScores[result.memberId] || 0,
      finalScoreWithYakitori: result.finalScore + (yakitoriScores[result.memberId] || 0),
    }));

    setCalculatedResults(resultsWithYakitori);
  };

  // 手動で素点を変更
  const updateRawScore = (index, newScore) => {
    const updated = [...gameResults];
    updated[index].rawScore = parseInt(newScore) || 0;
    setGameResults(updated);
    calculateScores(updated);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">得点計算テストツール</h2>
      
      {/* 設定パネル */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">設定</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">プレイヤー数</label>
            <select 
              value={playerCount} 
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
            >
              <option value={3}>3人</option>
              <option value={4}>4人</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">開始点</label>
            <input 
              type="number" 
              value={roomSettings.oka.startPoints}
              onChange={(e) => setRoomSettings({
                ...roomSettings,
                oka: { ...roomSettings.oka, startPoints: parseInt(e.target.value) || 25000 }
              })}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">返し点</label>
            <input 
              type="number" 
              value={roomSettings.oka.returnPoints}
              onChange={(e) => setRoomSettings({
                ...roomSettings,
                oka: { ...roomSettings.oka, returnPoints: parseInt(e.target.value) || 30000 }
              })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">ウマ（1-4位）</label>
            <input 
              type="number" 
              value={roomSettings.uma.topBottom}
              onChange={(e) => setRoomSettings({
                ...roomSettings,
                uma: { ...roomSettings.uma, topBottom: parseInt(e.target.value) || 20 }
              })}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">ウマ（2-3位）</label>
            <input 
              type="number" 
              value={roomSettings.uma.middlePair}
              onChange={(e) => setRoomSettings({
                ...roomSettings,
                uma: { ...roomSettings.uma, middlePair: parseInt(e.target.value) || 10 }
              })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={roomSettings.yakitori.enabled}
              onChange={(e) => setRoomSettings({
                ...roomSettings,
                yakitori: { ...roomSettings.yakitori, enabled: e.target.checked }
              })}
              className="mr-2"
            />
            ヤキトリ有効
          </label>
          
          {roomSettings.yakitori.enabled && (
            <div>
              <label className="block text-sm font-medium mb-1">ペナルティ</label>
              <input 
                type="number" 
                value={roomSettings.yakitori.penalty}
                onChange={(e) => setRoomSettings({
                  ...roomSettings,
                  yakitori: { ...roomSettings.yakitori, penalty: parseInt(e.target.value) || 12 }
                })}
                className="w-20 p-2 border rounded"
              />
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={generateRandomGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          ランダムゲーム生成
        </button>
        
        <button 
          onClick={() => loadScenario('bigDifference')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          大差ゲーム
        </button>
        
        <button 
          onClick={() => loadScenario('closeGame')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          接戦ゲーム
        </button>
        
        <button 
          onClick={() => loadScenario('tiedGame')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          同点ゲーム
        </button>
        
        {playerCount === 3 && (
          <button 
            onClick={() => loadScenario('threePlayers')}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            3人麻雀
          </button>
        )}
      </div>

      {/* 結果表示 */}
      {gameResults.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">ゲーム結果</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">プレイヤー</th>
                  <th className="px-4 py-2 text-right">素点</th>
                  <th className="px-4 py-2 text-center">順位</th>
                  <th className="px-4 py-2 text-right">オカ</th>
                  <th className="px-4 py-2 text-right">ウマ</th>
                  <th className="px-4 py-2 text-right">基本スコア</th>
                  {roomSettings.yakitori.enabled && (
                    <>
                      <th className="px-4 py-2 text-center">ヤキトリ</th>
                      <th className="px-4 py-2 text-right">ヤキトリスコア</th>
                    </>
                  )}
                  <th className="px-4 py-2 text-right font-bold">最終スコア</th>
                </tr>
              </thead>
              <tbody>
                {calculatedResults.map((result, index) => (
                  <tr key={result.memberId} className="border-t">
                    <td className="px-4 py-2 font-medium">{result.memberName}</td>
                    <td className="px-4 py-2 text-right">
                      <input 
                        type="number"
                        value={result.rawScore}
                        onChange={(e) => updateRawScore(index, e.target.value)}
                        className="w-20 p-1 text-right border rounded"
                        step="100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">{result.rank}位</td>
                    <td className="px-4 py-2 text-right">{result.oka}</td>
                    <td className="px-4 py-2 text-right">{result.uma}</td>
                    <td className="px-4 py-2 text-right">{result.finalScore}</td>
                    {roomSettings.yakitori.enabled && (
                      <>
                        <td className="px-4 py-2 text-center">
                          {result.rawScore < 30000 ? '🔥' : '✅'}
                        </td>
                        <td className="px-4 py-2 text-right">{result.yakitoriScore}</td>
                      </>
                    )}
                    <td className="px-4 py-2 text-right font-bold">
                      {result.finalScoreWithYakitori}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={roomSettings.yakitori.enabled ? 8 : 6} className="px-4 py-2 text-right font-bold">
                    合計:
                  </td>
                  <td className="px-4 py-2 text-right font-bold">
                    {calculatedResults.reduce((sum, r) => sum + r.finalScoreWithYakitori, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 検証情報 */}
      {calculatedResults.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">検証情報</h4>
          <ul className="text-sm space-y-1">
            <li>
              素点合計: {gameResults.reduce((sum, r) => sum + r.rawScore, 0).toLocaleString()}点
              {gameResults.reduce((sum, r) => sum + r.rawScore, 0) === (roomSettings.oka.startPoints * playerCount) ? 
                ' ✅' : ' ❌'}
            </li>
            <li>
              最終スコア合計: {calculatedResults.reduce((sum, r) => sum + r.finalScoreWithYakitori, 0)}
              {Math.abs(calculatedResults.reduce((sum, r) => sum + r.finalScoreWithYakitori, 0)) < 0.1 ? 
                ' ✅' : ' ❌'}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}