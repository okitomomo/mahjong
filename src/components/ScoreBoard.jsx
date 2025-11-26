/**
 * スコアボードコンポーネント（麻雀の一般的な得点記録帳形式）
 * Score board component (traditional mahjong score sheet format)
 */

import React, { useState } from 'react';
import { useScoreCalculator } from '../hooks/index.js';

export function ScoreBoard({ roomId, members, games }) {
  const { calculateTotalScores } = useScoreCalculator(roomId);
  const memberScores = calculateTotalScores;
  
  // スコア詳細モーダルの状態
  const [selectedScore, setSelectedScore] = useState(null);

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">スコアボード</h2>
        <p className="text-gray-500 text-center py-8">
          まだメンバーがいません
        </p>
      </div>
    );
  }

  // 確定済みの半荘のみを取得（gameNumberでソート）
  const completedGames = games
    .filter(g => g.status === 'completed')
    .sort((a, b) => a.gameNumber - b.gameNumber);

  // 入力中の半荘を取得
  const inputtingGame = games.find(g => g.status === 'inputting');

  // メンバーをスコア降順でソート
  const sortedMemberScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);

  // 各メンバーの各半荘のスコアを取得する関数
  const getMemberScoreForGame = (game, memberId) => {
    const result = game.results.find(r => r.memberId === memberId);
    if (!result) return null;
    
    if (game.status === 'inputting') {
      // 入力中の場合は入力状況を表示
      if (result.rawScore !== undefined) {
        return { status: 'inputting', rawScore: result.rawScore };
      }
      return { status: 'pending' };
    }
    
    // 確定済みの場合はスコアを表示
    return {
      status: 'completed',
      score: result.finalScoreWithChip || 0,
      result: result,
      game: game
    };
  };

  // スコアセルをクリックしたときの処理
  const handleScoreClick = (scoreData, memberName) => {
    if (scoreData && scoreData.status === 'completed') {
      console.log('Score data:', scoreData.result);
      setSelectedScore({
        memberName,
        gameNumber: scoreData.game.gameNumber,
        rawScore: scoreData.result.rawScore,
        rank: scoreData.result.rank,
        oka: scoreData.result.oka,
        uma: scoreData.result.uma,
        isYakitori: scoreData.result.isYakitori,
        yakitoriScore: scoreData.result.yakitoriScore,
        finalScore: scoreData.result.finalScore,
        chipCount: scoreData.result.chipCount,
        chipScore: scoreData.result.chipScore,
        finalScoreWithChip: scoreData.result.finalScoreWithChip,
      });
    }
  };

  // スコアを+/-付きで表示する関数
  const formatScore = (score) => {
    if (score === 0) return '0.0';
    return score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
  };

  return (
    <>
      {/* スコア詳細モーダル */}
      {selectedScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              第{selectedScore.gameNumber}回 - {selectedScore.memberName}
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                <span className="text-sm text-gray-700">得点</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedScore.rawScore?.toLocaleString()} 点
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                <span className="text-sm text-gray-700">オカ</span>
                <span className={`text-sm font-medium ${
                  (selectedScore.oka || 0) > 0 ? 'text-green-600' : 
                  (selectedScore.oka || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatScore(selectedScore.oka || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                <span className="text-sm text-gray-700">ウマ</span>
                <span className={`text-sm font-medium ${
                  (selectedScore.uma || 0) > 0 ? 'text-green-600' : 
                  (selectedScore.uma || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatScore(selectedScore.uma || 0)}
                </span>
              </div>
              
              {selectedScore.yakitoriScore !== undefined && selectedScore.yakitoriScore !== 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    ヤキトリ
                    {selectedScore.isYakitori && <span className="text-base">🐔</span>}
                  </span>
                  <span className={`text-sm font-medium ${
                    (selectedScore.yakitoriScore || 0) > 0 ? 'text-green-600' : 
                    (selectedScore.yakitoriScore || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatScore(selectedScore.yakitoriScore || 0)}
                  </span>
                </div>
              )}
              
              {selectedScore.chipCount !== undefined && selectedScore.chipCount !== 0 && (
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <span className="text-sm text-gray-700">チップ</span>
                  <span className={`text-sm font-medium ${
                    (selectedScore.chipScore || 0) > 0 ? 'text-green-600' : 
                    (selectedScore.chipScore || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatScore(selectedScore.chipScore || 0)} ({selectedScore.chipCount > 0 ? '+' : ''}{selectedScore.chipCount}枚)
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 mt-3">
                <span className="text-sm text-gray-900 font-bold">最終スコア</span>
                <span className={`text-lg font-bold ${
                  (selectedScore.finalScoreWithChip || 0) > 0 ? 'text-green-600' : 
                  (selectedScore.finalScoreWithChip || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatScore(selectedScore.finalScoreWithChip || 0)}
                </span>
              </div>
              
              <div className="text-center text-xs text-gray-500 mt-1">
                順位: {typeof selectedScore.rank === 'number' ? selectedScore.rank : JSON.stringify(selectedScore.rank)}位
              </div>
            </div>
            
            <button
              onClick={() => setSelectedScore(null)}
              className="mt-4 w-full px-4 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg active:bg-gray-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">スコアボード</h2>
        </div>
        
        <div className="overflow-x-auto -mx-3 flex justify-center">
          <div className="inline-block min-w-full max-w-fit">
            <table className="border-collapse mx-auto">
            {/* ヘッダー行：メンバー名 */}
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-300">
                <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 border-r border-gray-300 sticky left-0 bg-gray-50 z-10 w-16">
                  回
                </th>
                {sortedMemberScores.map((memberScore, index) => (
                  <th
                    key={memberScore.memberId}
                    colSpan={2}
                    className="px-1 py-2 text-center text-xs font-bold text-gray-900 border-r border-gray-300 min-w-[80px]"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-0.5">
                        {index === 0 && <span className="text-sm">🥇</span>}
                        {index === 1 && <span className="text-sm">🥈</span>}
                        {index === 2 && <span className="text-sm">🥉</span>}
                        <span className="truncate max-w-[60px]">{memberScore.memberName}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-normal">
                        {memberScore.gamesPlayed}戦
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-2 py-1 text-center text-[10px] font-medium text-gray-600 border-r border-gray-300 sticky left-0 bg-gray-100 z-10 w-16">
                  
                </th>
                {sortedMemberScores.map((memberScore) => (
                  <React.Fragment key={memberScore.memberId}>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-600 border-r border-gray-200 w-12">
                      +
                    </th>
                    <th className="px-1 py-1 text-center text-[10px] font-medium text-gray-600 border-r border-gray-300 w-12">
                      -
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* 確定済み半荘の行 */}
              {completedGames.map((game) => (
                <tr key={game.id} className="border-b border-gray-200 active:bg-gray-50">
                  <td className="px-2 py-2 text-center text-xs font-medium text-gray-900 border-r border-gray-300 sticky left-0 bg-white z-10 w-16">
                    {game.gameNumber}
                  </td>
                  {sortedMemberScores.map((memberScore) => {
                    const scoreData = getMemberScoreForGame(game, memberScore.memberId);
                    const score = scoreData?.score || 0;
                    const isYakitori = scoreData?.result?.isYakitori || false;
                    
                    return (
                      <React.Fragment key={memberScore.memberId}>
                        {scoreData && score === 0 ? (
                          // スコアが0の場合は列を結合して表示
                          <td
                            colSpan={2}
                            className="px-1 py-2 text-center border-r border-gray-300 active:bg-blue-50 cursor-pointer"
                            onClick={() => handleScoreClick(scoreData, memberScore.memberName)}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="text-xs font-bold text-gray-900">
                                ±0.0
                              </div>
                              {isYakitori && (
                                <span className="text-sm" title="ヤキトリ">🐔</span>
                              )}
                            </div>
                          </td>
                        ) : (
                          <>
                            {/* プラス列 */}
                            <td
                              className={`px-1 py-2 text-center border-r border-gray-200 active:bg-blue-50 w-12 ${scoreData ? 'cursor-pointer' : ''}`}
                              onClick={() => scoreData && handleScoreClick(scoreData, memberScore.memberName)}
                            >
                              {scoreData && score > 0 ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="text-xs font-bold text-green-600 whitespace-nowrap">
                                    {score.toFixed(1)}
                                  </div>
                                  {isYakitori && (
                                    <span className="text-sm" title="ヤキトリ">🐔</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-300">-</div>
                              )}
                            </td>
                            {/* マイナス列 */}
                            <td
                              className={`px-1 py-2 text-center border-r border-gray-300 active:bg-blue-50 w-12 ${scoreData ? 'cursor-pointer' : ''}`}
                              onClick={() => scoreData && handleScoreClick(scoreData, memberScore.memberName)}
                            >
                              {scoreData && score < 0 ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="text-xs font-bold text-red-600 whitespace-nowrap">
                                    ▲{Math.abs(score).toFixed(1)}
                                  </div>
                                  {isYakitori && (
                                    <span className="text-sm" title="ヤキトリ">🐔</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-300">-</div>
                              )}
                            </td>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
              
              {/* 入力中の半荘の行 */}
              {inputtingGame && (
                <tr className="border-b-2 border-yellow-300 bg-yellow-50">
                  <td className="px-2 py-2 text-center text-xs font-medium text-gray-900 border-r border-gray-300 sticky left-0 bg-yellow-50 z-10 w-16">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{inputtingGame.gameNumber}</span>
                      <span className="text-[10px] text-yellow-700 font-normal">入力中</span>
                    </div>
                  </td>
                  {sortedMemberScores.map((memberScore) => {
                    const scoreData = getMemberScoreForGame(inputtingGame, memberScore.memberId);
                    
                    return (
                      <React.Fragment key={memberScore.memberId}>
                        <td colSpan={2} className="px-1 py-2 text-center border-r border-gray-300">
                          {scoreData ? (
                            scoreData.status === 'inputting' ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="text-[10px] text-green-600 font-medium">✓</div>
                                <div className="text-[10px] text-gray-600">
                                  {scoreData.rawScore.toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400">未入力</div>
                            )
                          ) : (
                            <div className="text-[10px] text-gray-400">-</div>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              )}
              
              {/* 累計スコア行 */}
              <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold">
                <td className="px-2 py-3 text-center text-xs font-bold text-gray-900 border-r border-gray-300 sticky left-0 bg-gray-100 z-10 w-16">
                  累計
                </td>
                {sortedMemberScores.map((memberScore) => (
                  <td
                    key={memberScore.memberId}
                    colSpan={2}
                    className="px-1 py-3 text-center border-r border-gray-300"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <div
                        className={`text-sm font-bold ${
                          memberScore.totalScore > 0
                            ? 'text-green-600'
                            : memberScore.totalScore < 0
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {formatScore(memberScore.totalScore)}
                      </div>
                      <div className="text-[10px] text-gray-600">
                        {memberScore.ranks.first}-{memberScore.ranks.second}-
                        {memberScore.ranks.third}-{memberScore.ranks.fourth}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}
