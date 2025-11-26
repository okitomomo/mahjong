/**
 * メンバー管理カスタムフック
 * Custom hook for managing members
 * 
 * @typedef {import('../types/models').Member} Member
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { memberConverter, COLLECTIONS } from '../models/index.js';
import { addMember as addMemberService } from '../services/index.js';
import { getErrorMessage, logError } from '../utils/index.js';
import { useUserId } from './useUserId.js';

/**
 * メンバーを管理するカスタムフック
 * Custom hook for managing members
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {{
 *   members: Member[], 
 *   loading: boolean, 
 *   error: string | null, 
 *   addMember: (userId: string, name: string) => Promise<string>,
 *   getMemberIdForCurrentUser: () => string | null,
 *   currentUserMember: Member | null,
 * }}
 */
export function useMembers(roomId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useUserId();

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    // メンバーのリアルタイムリスナー
    const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS)
      .withConverter(memberConverter);
    const q = query(membersRef, orderBy('joinedAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const membersData = querySnapshot.docs.map(doc => doc.data());
        setMembers(membersData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching members:', err);
        setError(getErrorMessage(err));
        setLoading(false);
        logError(err, { context: 'useMembers', roomId });
      }
    );

    // クリーンアップ
    return () => unsubscribe();
  }, [roomId]);

  /**
   * 現在のユーザーのメンバーIDを取得
   * Get member ID for current user
   * 
   * @returns {string | null} メンバーID、存在しない場合はnull (Member ID or null if not found)
   */
  const getMemberIdForCurrentUser = () => {
    const member = members.find(m => m.userId === userId);
    return member ? member.id : null;
  };

  /**
   * 現在のユーザーのメンバー情報
   * Current user's member information
   */
  const currentUserMember = useMemo(() => {
    return members.find(m => m.userId === userId) || null;
  }, [members, userId]);

  /**
   * メンバーを追加
   * Add a member
   */
  const addMember = async (userId, name) => {
    try {
      setError(null);
      const memberId = await addMemberService(userId, roomId, name);
      return memberId;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'useMembers.addMember', roomId, userId, name });
      throw err;
    }
  };

  return {
    members,
    loading,
    error,
    addMember,
    getMemberIdForCurrentUser,
    currentUserMember,
  };
}
