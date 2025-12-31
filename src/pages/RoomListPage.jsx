/**
 * 部屋一覧ページ
 * Room list page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useRooms, useUserId } from '../hooks/index.js';
import { useToast } from '../hooks/useToast.js';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { ToastContainer } from '../components/Toast.jsx';
import { LoadingPage } from '../components/Loading.jsx';
import { COLLECTIONS, gameConverter } from '../models/index.js';
import { extractUniqueMembers, formatMemberNames } from '../utils/index.js';

export function RoomListPage() {
  const navigate = useNavigate();
  const { rooms, loading, error, createRoom, deleteRoom } = useRooms();
  const { userId } = useUserId();
  const { toasts, removeToast, showError } = useToast();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [roomMembers, setRoomMembers] = useState({});

  // 各部屋のメンバー情報を取得
  useEffect(() => {
    const fetchRoomMembers = async () => {
      const membersMap = {};
      
      for (const room of rooms) {
        try {
          const gamesRef = collection(db, COLLECTIONS.ROOMS, room.id, COLLECTIONS.GAMES)
            .withConverter(gameConverter);
          const gamesSnapshot = await getDocs(gamesRef);
          const games = gamesSnapshot.docs.map(doc => doc.data());
          
          const members = extractUniqueMembers(games);
          membersMap[room.id] = members;
        } catch (err) {
          console.error(`Failed to fetch members for room ${room.id}:`, err);
          membersMap[room.id] = [];
        }
      }
      
      setRoomMembers(membersMap);
    };
    
    if (rooms.length > 0) {
      fetchRoomMembers();
    }
  }, [rooms]);

  const handleCreateRoom = async () => {
    if (!userId) {
      showError('ユーザーIDが取得できませんでした');
      return;
    }

    try {
      setCreating(true);
      const roomId = await createRoom(userId);
      navigate(`/rooms/${roomId}`, { state: { isNew: true } });
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRoomClick = (roomId) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleDeleteRoom = async (roomId, roomName, e) => {
    // イベントの伝播を止める（部屋クリックを防ぐ）
    e.stopPropagation();
    
    // 確認メッセージ
    const confirmed = window.confirm(
      `部屋「${roomName}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setDeleting(roomId);
      await deleteRoom(roomId);
    } catch (err) {
      console.error('Failed to delete room:', err);
      showError('部屋の削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <LoadingPage message="部屋一覧を読み込み中..." />;
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="bg-gray-50 min-h-screen">
        <div className="px-3 py-4">
        {/* パンくずリスト */}
        <Breadcrumb
          items={[
            { label: 'ホーム', path: '/' },
            { label: '部屋一覧' },
          ]}
        />

        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            麻雀戦績管理
          </h1>
          <p className="text-sm text-gray-600">
            部屋を作成して、半荘のスコアを記録
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 部屋作成ボタン */}
        <div className="mb-4">
          <button
            onClick={handleCreateRoom}
            disabled={creating}
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg active:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {creating ? '作成中...' : '+ 新しい部屋を作成'}
          </button>
        </div>

        {/* 部屋一覧 */}
        {rooms.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-2 text-sm">まだ部屋がありません</p>
            <p className="text-xs text-gray-400">
              「新しい部屋を作成」から始めましょう
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => {
              const members = roomMembers[room.id] || [];
              const memberNames = formatMemberNames(members);
              
              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick(room.id)}
                  className="bg-white p-3 rounded-lg shadow-sm active:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {room.name}
                        </h3>
                        {room.isSettled && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            清算済み
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {memberNames}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleDeleteRoom(room.id, room.name, e)}
                        disabled={deleting === room.id}
                        className="p-2 text-red-600 active:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="部屋を削除"
                      >
                        {deleting === room.id ? (
                          <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
