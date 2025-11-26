/**
 * 半荘入力ページ
 * Game input page
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoom, useMembers, useGames } from '../hooks/index.js';
import {
  calculateRanks,
  calculateFinalScore,
  calculateChipScore,
  calculateFinalScoreWithChip,
} from '../utils/index.js';
import { validateScoreRange, validateChipCountRange } from '../models/index.js';

export function GameInputPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { room, loading: roomLoading } = useRoom(roomId);
  const { members, loading: membersLoading } = useMembers(roomId);
  const { addGame } = useGames(roomId);

  const [playerCount, setPlayerCount] = useState(4);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [scores, setScores] = useState({});
  const [chips, setChips] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // バリデーション状態
  const [scoreValidations, setScoreValidations] = useState({});
  const [chipValidations, setChipValidations] = useState({});

  const loading = roomLoading || membersLoading;

  // プレイヤー数変更時に選択をリセット
  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    setSelectedMembers([]);
    setScores({});
    setChips({});
  };

  // メンバー選択
  const handleMemberSelect = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
      const newScores = { ...scores };
      delete newScores[memberId];
      setScores(newScores);
      const newChips = { ...chips };
      delete newChips[memberId];
      setChips(newChips);
    } else if (selectedMembers.length < playerCount) {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  // 得点入力
  const handleScoreChange = (memberId, value) => {
    setScores({
      ...scores,
      [memberId]: value === '' ? '' : Number(value),
    });
    
    // バリデーション
    if (value === '') {
      setScoreValidations({
        ...scoreValidations,
        [memberId]: { valid: true },
      });
      return;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      setScoreValidations({
        ...scoreValidations,
        [memberId]: { valid: false, error: '数値を入力してください' },
      });
      return;
    }
    
    const validation = validateScoreRange(numValue);
    setScoreValidations({
      ...scoreValidations,
      [memberId]: validation,
    });
  };

  // チップ入力
  const handleChipChange = (memberId, value) => {
    setChips({
      ...chips,
      [memberId]: value === '' ? '' : Number(value),
    });
    
    // バリデーション
    if (value === '') {
      setChipValidations({
        ...chipValidations,
        [memberId]: { valid: true },
      });
      return;
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      setChipValidations({
        ...chipValidations,
        [memberId]: { valid: false, error: '数値を入力してください' },
      });
      return;
    }
    
    const validation = validateChipCountRange(numValue);
    setChipValidations({
      ...chipValidations,
      [memberId]: validation,
    });
  };

  // 保存
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (selectedMembers.length !== playerCount) {
      setError(`${playerCount}人のプレイヤーを選択してください`);
      return;
    }

    for (const memberId of selectedMembers) {
      if (scores[memberId] === '' || scores[memberId] === undefined) {
        setError('全てのプレイヤーの得点を入力してください');
        return;
      }
      
      // 得点の範囲チェック
      const scoreVal = validateScoreRange(scores[memberId]);
      if (!scoreVal.valid) {
        setError(`得点が不正です: ${scoreVal.error}`);
        return;
      }
      
      // チップの範囲チェック
      if (room.settings.chip.enabled && chips[memberId] !== undefined && chips[memberId] !== '') {
        const chipVal = validateChipCountRange(chips[memberId]);
        if (!chipVal.valid) {
          setError(`チップ数が不正です: ${chipVal.error}`);
          return;
        }
      }
    }

    try {
      setSaving(true);

      // 順位計算
      const scoresWithMembers = selectedMembers.map((memberId) => ({
        memberId,
        rawScore: scores[memberId],
      }));
      const rankedScores = calculateRanks(scoresWithMembers);

      // スコア計算
      const results = rankedScores.map((item) => {
        const member = members.find((m) => m.id === item.memberId);
        const { oka, uma, finalScore } = calculateFinalScore(
          item.rawScore,
          item.rank,
          playerCount,
          room.settings.oka,
          room.settings.uma
        );

        const chipCount = room.settings.chip.enabled ? (chips[item.memberId] || 0) : 0;
        const chipScore = calculateChipScore(chipCount, room.settings.chip.pointsPerChip);
        const finalScoreWithChip = calculateFinalScoreWithChip(finalScore, chipScore);

        return {
          memberId: item.memberId,
          memberName: member.name,
          rawScore: item.rawScore,
          rank: item.rank,
          uma,
          oka,
          chipCount,
          chipScore,
          finalScore,
          finalScoreWithChip,
        };
      });

      // 保存
      await addGame(playerCount, results);
      navigate(`/rooms/${roomId}`);
    } catch (err) {
      console.error('Failed to save game:', err);
      setError('半荘の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">部屋が見つかりません</p>
          <Link to="/rooms" className="text-blue-600 hover:text-blue-700 underline">
            部屋一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            to={`/rooms/${roomId}`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            部屋に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">半荘を記録</h1>
          <p className="text-gray-600">{room.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* プレイヤー数選択 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">プレイヤー数</h2>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handlePlayerCountChange(3)}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  playerCount === 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                3人麻雀
              </button>
              <button
                type="button"
                onClick={() => handlePlayerCountChange(4)}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  playerCount === 4
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                4人麻雀
              </button>
            </div>
          </div>

          {/* メンバー選択 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              プレイヤー選択 ({selectedMembers.length}/{playerCount})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleMemberSelect(member.id)}
                  disabled={
                    !selectedMembers.includes(member.id) && selectedMembers.length >= playerCount
                  }
                  className={`p-3 rounded-lg font-medium transition-colors ${
                    selectedMembers.includes(member.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          {/* 得点入力 */}
          {selectedMembers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">得点入力</h2>
              <div className="space-y-4">
                {selectedMembers.map((memberId) => {
                  const member = members.find((m) => m.id === memberId);
                  const scoreVal = scoreValidations[memberId] || { valid: true };
                  const chipVal = chipValidations[memberId] || { valid: true };
                  
                  return (
                    <div key={memberId} className="space-y-1">
                      <div className="flex items-center gap-4">
                        <label className="w-32 font-medium text-gray-900">{member.name}</label>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={scores[memberId] || ''}
                            onChange={(e) => handleScoreChange(memberId, e.target.value)}
                            placeholder="得点"
                            className={`w-full px-4 py-2 border rounded-lg ${
                              !scoreVal.valid
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            required
                          />
                          {!scoreVal.valid && scoreVal.error && (
                            <p className="mt-1 text-sm text-red-600">{scoreVal.error}</p>
                          )}
                        </div>
                        {room.settings.chip.enabled && (
                          <div className="w-24">
                            <input
                              type="number"
                              value={chips[memberId] || ''}
                              onChange={(e) => handleChipChange(memberId, e.target.value)}
                              placeholder="チップ"
                              className={`w-full px-4 py-2 border rounded-lg ${
                                !chipVal.valid
                                  ? 'border-red-300 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            />
                            {!chipVal.valid && chipVal.error && (
                              <p className="mt-1 text-sm text-red-600">{chipVal.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 保存ボタン */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={
                saving || 
                selectedMembers.length !== playerCount ||
                selectedMembers.some(id => !scoreValidations[id]?.valid || scoreValidations[id]?.valid === false) ||
                (room.settings.chip.enabled && selectedMembers.some(id => !chipValidations[id]?.valid || chipValidations[id]?.valid === false))
              }
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <Link
              to={`/rooms/${roomId}`}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
