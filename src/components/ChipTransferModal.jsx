/**
 * チップ受け取りモーダルコンポーネント
 * Chip receive modal component
 */

import { useState, useEffect } from 'react';
import { validateChipCountRange } from '../models/index.js';

export function ChipTransferModal({ 
  isOpen, 
  onClose, 
  members, 
  currentUserMember, 
  onReceive,
  isSubmitting = false 
}) {
  const [senderId, setSenderId] = useState('');
  const [chipCount, setChipCount] = useState('');
  const [validationError, setValidationError] = useState(null);

  // モーダルが開かれた時に状態をリセット
  useEffect(() => {
    if (isOpen) {
      setSenderId('');
      setChipCount('');
      setValidationError(null);
    }
  }, [isOpen]);

  // 渡し手として選択可能なメンバー（自分以外）
  const availableSenders = members.filter(member => 
    member.id !== currentUserMember?.id
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!senderId || !chipCount) {
      setValidationError('渡し手と枚数を入力してください');
      return;
    }

    const count = parseInt(chipCount, 10);
    if (isNaN(count) || count <= 0) {
      setValidationError('1以上の枚数を入力してください');
      return;
    }

    // チップ枚数の範囲チェック
    const validation = validateChipCountRange(count);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    const sender = members.find(m => m.id === senderId);
    if (!sender) {
      setValidationError('渡し手が見つかりません');
      return;
    }

    try {
      await onReceive(senderId, sender.name, count);
      // 成功時はモーダルを閉じる（親コンポーネントで処理）
    } catch (error) {
      setValidationError(error.message || 'チップの受け取りに失敗しました');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">チップを受け取る</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              誰から受け取りますか？ *
            </label>
            <select
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              required
            >
              <option value="">選択してください</option>
              {availableSenders.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              受け取る枚数 *
            </label>
            <input
              type="number"
              min="1"
              value={chipCount}
              onChange={(e) => setChipCount(e.target.value)}
              placeholder="例: 2"
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              受け取る枚数を入力してください（1以上）
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !senderId || !chipCount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '処理中...' : '受け取る'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}