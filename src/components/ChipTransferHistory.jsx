/**
 * チップ受け取り履歴コンポーネント
 * Chip receive history component
 */

import { useState, useEffect } from 'react';
import { getChipTransfers } from '../services/roomService.js';

export function ChipTransferHistory({ roomId, isChipEnabled }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isChipEnabled || !isOpen) return;

    const loadTransfers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getChipTransfers(roomId);
        setTransfers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTransfers();
  }, [roomId, isChipEnabled, isOpen]);

  if (!isChipEnabled) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between active:bg-gray-50 transition-colors"
      >
        <h3 className="text-base font-bold text-gray-900">チップ受け取り履歴</h3>
        <div className="flex items-center gap-2">
          {transfers.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {transfers.length}件
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 p-3">
          {loading && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">読み込み中...</div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && transfers.length === 0 && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">チップの受け取り履歴はありません</div>
            </div>
          )}

          {!loading && !error && transfers.length > 0 && (
            <div className="space-y-2">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {transfer.fromMemberName} → {transfer.toMemberName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {transfer.createdAt?.toDate?.()?.toLocaleString('ja-JP') || '日時不明'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">
                      {transfer.chipCount}枚
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}