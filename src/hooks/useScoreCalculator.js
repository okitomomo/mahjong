/**
 * スコア計算カスタムフック
 * Custom hook for score calculation
 * 
 * @typedef {import('../types/models').Member} Member
 * @typedef {import('../types/models').Game} Game
 * @typedef {import('../types/models').MemberScore} MemberScore
 * @typedef {import('../types/models').ScoreCalculation} ScoreCalculation
 */

import { useMemo } from 'react';
import { useRoom } from './useRoom.js';
import {
  calculateFinalScore,
  calculateMemberTotalScore,
} from '../utils/index.js';

/**
 * スコア計算を行うカスタムフック
 * Custom hook for score calculation
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {{calculateScore: (rawScore: number, rank: number, playerCount: number) => ScoreCalculation, calculateTotalScores: () => MemberScore[], loading: boolean}}
 */
export function useScoreCalculator(roomId) {
  const { room, members, games, loading } = useRoom(roomId);

  /**
   * 単一の半荘スコアを計算
   * Calculate score for a single game
   */
  const calculateScore = (rawScore, rank, playerCount) => {
    if (!room) {
      throw new Error('部屋情報が読み込まれていません');
    }

    return calculateFinalScore(
      rawScore,
      rank,
      playerCount,
      room.settings.oka,
      room.settings.uma
    );
  };

  /**
   * 全メンバーの合計スコアを計算
   * Calculate total scores for all members
   */
  const calculateTotalScores = useMemo(() => {
    if (!members.length || !games || !room) {
      return [];
    }

    // 確定済み半荘のみをフィルタ
    const completedGames = games.filter(game => game.status === 'completed');

    const memberScores = members.map(member => {
      const { totalScore, gamesPlayed, ranks } = calculateMemberTotalScore(
        member.id, 
        completedGames,
        room.settings.yakitori
      );

      return {
        memberId: member.id,
        memberName: member.name,
        totalScore,
        gamesPlayed,
        ranks,
      };
    });

    // 合計スコアの降順でソート
    return memberScores.sort((a, b) => b.totalScore - a.totalScore);
  }, [members, games, room]);

  return {
    calculateScore,
    calculateTotalScores,
    loading,
  };
}
