/**
 * スコアボードコンポーネント（麻雀の一般的な得点記録帳形式）
 * Score board component (traditional mahjong score sheet format)
 */

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useScoreCalculator } from '../hooks/index.js';
import { COLLECTIONS } from '../models/index.js';

export function ScoreBoard({ roomId, members, games, room }) {
  const { calculateTotalScores } = useScoreCalculator(roomId);
  const memberScores = calculateTotalScores;
  
  // スコア詳細モーダルの状態
  const [selectedScore, setSelectedScore] = useState(null);
  
  // チップ受け取り履歴の状態
  const [chipTransfers, setChipTransfers] = useState([]);

  // チップ受け取り履歴をリアルタイムで取得
  useEffect(() => {
    if (!room?.settings?.chip?.enabled) {
      setChipTransfers([]);
      return;
    }

    console.log('Setting up chip transfers listener for room:', roomId);

    const transfersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.CHIP_TRANSFERS);
    const q = query(transfersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log('Chip transfers updated, count:', querySnapshot.docs.length);
        const transfers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChipTransfers(transfers);
      },
      (error) => {
        console.error('Error listening to chip transfers:', error);
        // エラーが発生した場合は空配列を設定
        setChipTransfers([]);
      }
    );

    // クリーンアップ関数でリスナーを解除
    return () => {
      console.log('Cleaning up chip transfers listener');
      unsubscribe();
    };
  }, [roomId, room?.settings?.chip?.enabled]);

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

  // チップ受け取り履歴を疑似的な半荘データとして変換
  const chipTransferRows = chipTransfers.map((transfer, index) => {
    console.log('Processing chip transfer:', transfer);
    return {
      id: `chip-${transfer.id}`,
      gameNumber: `🎯${index + 1}`,
      isChipTransfer: true,
      transfer: transfer,
      results: members.map(member => {
        const chipScore = (room?.settings?.chip?.pointsPerChip || 0) * transfer.chipCount;
        
        if (member.id === transfer.fromMemberId) {
          // 渡した人はプラス
          return {
            memberId: member.id,
            memberName: member.name,
            finalScoreWithChip: chipScore,
            isChipTransfer: true,
            chipTransferType: 'sender'
          };
        } else if (member.id === transfer.toMemberId) {
          // 受け取った人はマイナス
          return {
            memberId: member.id,
            memberName: member.name,
            finalScoreWithChip: -chipScore,
            isChipTransfer: true,
            chipTransferType: 'receiver'
          };
        } else {
          // 関係ない人は0
          return {
            memberId: member.id,
            memberName: member.name,
            finalScoreWithChip: 0,
            isChipTransfer: true,
            chipTransferType: 'none'
          };
        }
      })
    };
  });

  // 全ての行（半荘 + チップ受け取り）を時系列順に並べる
  const allRows = [
    ...completedGames.map(game => ({ ...game, isChipTransfer: false })),
    ...chipTransferRows
  ].sort((a, b) => {
    // 半荘は gameNumber で、チップは createdAt で比較
    if (a.isChipTransfer && b.isChipTransfer) {
      return a.transfer.createdAt?.toDate?.() - b.transfer.createdAt?.toDate?.();
    } else if (a.isChipTransfer) {
      // チップと半荘の比較は createdAt vs 半荘の時刻（仮に半荘番号順とする）
      return 1; // チップを後に表示
    } else if (b.isChipTransfer) {
      return -1; // 半荘を先に表示
    } else {
      return a.gameNumber - b.gameNumber;
    }
  });

  console.log('ScoreBoard allRows:', {
    completedGamesCount: completedGames.length,
    chipTransferRowsCount: chipTransferRows.length,
    allRowsCount: allRows.length,
    chipTransfers: chipTransfers.length
  });

  // メンバーをスコア降順でソート
  const sortedMemberScores = [...memberScores].sort((a, b) => b.totalScore - a.totalScore);

  // 各メンバーの各半荘のスコアを取得する関数
  const getMemberScoreForGame = (row, memberId) => {
    if (row.isChipTransfer) {
      // チップ受け取りの場合
      const result = row.results.find(r => r.memberId === memberId);
      return result ? {
        status: 'completed',
        score: result.finalScoreWithChip,
        result: result,
        row: row,
        isChipTransfer: true
      } : null;
    } else {
      // 通常の半荘の場合
      const result = row.results.find(r => r.memberId === memberId);
      if (!result) return null;
      
      if (row.status === 'inputting') {
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
        row: row,
        isChipTransfer: false
      };
    }
  };

  // スコアセルをクリックしたときの処理
  const handleScoreClick = (scoreData, memberName) => {
    if (scoreData && scoreData.status === 'completed') {
      if (scoreData.isChipTransfer) {
        // チップ受け取りの詳細を表示
        const transfer = scoreData.row.transfer;
        setSelectedScore({
          memberName,
          isChipTransfer: true,
          chipTransfer: {
            fromMemberName: transfer.fromMemberName,
            toMemberName: transfer.toMemberName,
            chipCount: transfer.chipCount,
            pointsPerChip: room?.settings?.chip?.pointsPerChip || 0,
            totalScore: scoreData.score,
            createdAt: transfer.createdAt?.toDate?.()?.toLocaleString('ja-JP') || '日時不明'
          }
        });
      } else {
        // 通常の半荘詳細を表示
        console.log('Score data:', scoreData.result);
        setSelectedScore({
          memberName,
          gameNumber: scoreData.row.gameNumber,
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
          isChipTransfer: false
        });
      }
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
            {selectedScore.isChipTransfer ? (
              // チップ受け取り詳細
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                  🎯 チップ受け取り - {selectedScore.memberName}
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                    <span className="text-sm text-gray-700">受け取り内容</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedScore.chipTransfer.fromMemberName} → {selectedScore.chipTransfer.toMemberName}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                    <span className="text-sm text-gray-700">チップ枚数</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedScore.chipTransfer.chipCount}枚
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                    <span className="text-sm text-gray-700">1枚あたり</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedScore.chipTransfer.pointsPerChip || 0}点
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 mt-3">
                    <span className="text-sm text-gray-900 font-bold">スコア変動</span>
                    <span className={`text-lg font-bold ${
                      selectedScore.chipTransfer.totalScore > 0 ? 'text-green-600' : 
                      selectedScore.chipTransfer.totalScore < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {formatScore(selectedScore.chipTransfer.totalScore)}
                    </span>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500 mt-1">
                    {selectedScore.chipTransfer.createdAt}
                  </div>
                </div>
              </>
            ) : (
              // 通常の半荘詳細
              <>
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
              </>
            )}
            
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">スコアボード</h2>
            {room?.isSettled && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                清算済み
              </span>
            )}
          </div>
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
              {/* 確定済み半荘とチップ受け取りの行 */}
              {allRows.map((row) => (
                <tr key={row.id} className="border-b border-gray-200 active:bg-gray-50">
                  <td className="px-2 py-2 text-center text-xs font-medium text-gray-900 border-r border-gray-300 sticky left-0 bg-white z-10 w-16">
                    {row.gameNumber}
                  </td>
                  {sortedMemberScores.map((memberScore) => {
                    const scoreData = getMemberScoreForGame(row, memberScore.memberId);
                    const score = scoreData?.score || 0;
                    const isYakitori = scoreData?.result?.isYakitori || false;
                    const isChipTransfer = row.isChipTransfer;
                    
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
                              {isChipTransfer && scoreData.result.chipTransferType !== 'none' && (
                                <span className="text-xs text-gray-500">🎯</span>
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
                                  {isChipTransfer && scoreData.result.chipTransferType !== 'none' && (
                                    <span className="text-xs text-gray-500">🎯</span>
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
                                  {isChipTransfer && scoreData.result.chipTransferType !== 'none' && (
                                    <span className="text-xs text-gray-500">🎯</span>
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
