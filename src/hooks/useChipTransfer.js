/**
 * チップ受け取り機能のカスタムフック
 * Custom hook for chip receive functionality
 */

import { useState, useCallback } from 'react';
import { recordChipTransfer } from '../services/roomService.js';

/**
 * チップ受け取り機能のフック
 * @param {string} roomId - 部屋ID
 * @param {Object} currentUserMember - 現在のユーザーのメンバー情報
 * @returns {Object} チップ受け取り機能
 */
export function useChipTransfer(roomId, currentUserMember) {
  const [isReceiving, setIsReceiving] = useState(false);
  const [error, setError] = useState(null);

  const receiveChip = useCallback(async (fromMemberId, fromMemberName, chipCount) => {
    if (!currentUserMember) {
      throw new Error('ユーザー情報が見つかりません');
    }

    console.log('useChipTransfer: Starting chip receive', {
      roomId,
      fromMemberId,
      fromMemberName,
      toMemberId: currentUserMember.id,
      toMemberName: currentUserMember.name,
      chipCount
    });

    setIsReceiving(true);
    setError(null);

    try {
      // 受け取る側が入力するので、fromからtoへの受渡として記録
      await recordChipTransfer(
        roomId,
        fromMemberId,
        fromMemberName,
        currentUserMember.id,
        currentUserMember.name,
        chipCount
      );
      console.log('useChipTransfer: Chip receive completed successfully');
    } catch (err) {
      console.error('useChipTransfer: Error receiving chip', err);
      setError(err.message);
      throw err;
    } finally {
      setIsReceiving(false);
    }
  }, [roomId, currentUserMember]);

  return {
    receiveChip,
    isReceiving,
    error,
  };
}