/**
 * メンバー操作サービス
 * Member operations service
 * 
 * @typedef {import('../types/models').Member} Member
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import {
  memberConverter,
  createNewMember,
  COLLECTIONS,
} from '../models/index.js';

/**
 * メンバーを追加
 * Add a member to a room
 * 
 * @param {string} userId - ユーザーID (User ID)
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} name - メンバー名 (Member name)
 * @returns {Promise<string>} 作成されたメンバーのID (Created member ID)
 */
export async function addMember(userId, roomId, name) {
  try {
    // 既に同じuserIdで参加しているかチェック
    const existingMember = await findMemberByUserId(roomId, userId);
    if (existingMember) {
      return existingMember.id;
    }
    
    const newMember = createNewMember(userId, roomId, name);
    const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS)
      .withConverter(memberConverter);
    const docRef = await addDoc(membersRef, newMember);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
}

/**
 * 部屋のメンバー一覧を取得
 * Get list of members in a room
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @returns {Promise<Member[]>} メンバーの配列 (Array of members)
 */
export async function getMembers(roomId) {
  try {
    const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS)
      .withConverter(memberConverter);
    const q = query(membersRef, orderBy('joinedAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting members:', error);
    throw new Error('メンバー一覧の取得に失敗しました');
  }
}

/**
 * メンバー詳細を取得
 * Get member details
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} memberId - メンバーID (Member ID)
 * @returns {Promise<Member | null>} メンバーデータ、存在しない場合はnull (Member data or null if not found)
 */
export async function getMember(roomId, memberId) {
  try {
    const memberRef = doc(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS, memberId)
      .withConverter(memberConverter);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      return memberSnap.data();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting member:', error);
    throw new Error('メンバーの取得に失敗しました');
  }
}

/**
 * userIdから部屋内のメンバーを検索
 * Find member in room by userId
 * 
 * @param {string} roomId - 部屋ID (Room ID)
 * @param {string} userId - ユーザーID (User ID)
 * @returns {Promise<Member | null>} メンバーデータ、存在しない場合はnull (Member data or null if not found)
 */
export async function findMemberByUserId(roomId, userId) {
  try {
    const membersRef = collection(db, COLLECTIONS.ROOMS, roomId, COLLECTIONS.MEMBERS)
      .withConverter(memberConverter);
    const q = query(membersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    
    return null;
  } catch (error) {
    console.error('Error finding member by userId:', error);
    throw new Error('メンバーの検索に失敗しました');
  }
}
