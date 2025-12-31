/**
 * 部屋設定コンポーネント
 * Room settings component
 */

import { useState } from 'react';
import {
  validateUmaSettingsRange,
  validateOkaSettingsRange,
  validateYakitoriSettingsRange,
  validateChipSettingsRange,
} from '../models/index.js';

export function RoomSettings({ room, games = [], onUpdate, initiallyOpen = false, currentUserId, isCreator, members = [] }) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [settings, setSettings] = useState(room.settings);
  const [saving, setSaving] = useState(false);
  
  // バリデーション状態
  const [validationErrors, setValidationErrors] = useState([]);

  // 半荘が開始されているかチェック（確定済みまたは入力中の半荘が存在する）
  const hasStartedGames = games.length > 0;

  // デバッグ用ログ
  console.log('RoomSettings Debug:', {
    roomCreatorUserId: room?.creatorUserId,
    currentUserId,
    isCreator,
    hasStartedGames,
    roomId: room?.id,
    membersCount: members.length
  });

  // 作成者判定: 新しい部屋はcreatorUserId、既存の部屋は最初のメンバー
  const effectiveIsCreator = room?.creatorUserId !== undefined && room?.creatorUserId !== null
    ? isCreator  // 新しい部屋: 渡されたisCreatorを使用
    : members.length > 0 && members.sort((a, b) => a.createdAt - b.createdAt)[0]?.userId === currentUserId; // 既存の部屋: 最初のメンバー

  // ゴットー設定を適用
  const applyGoto = () => {
    setSettings({
      ...settings,
      uma: { topBottom: 10, middlePair: 5 },
    });
  };

  // ワンツー設定を適用
  const applyOneTwo = () => {
    setSettings({
      ...settings,
      uma: { topBottom: 20, middlePair: 10 },
    });
  };

  const handleSave = async () => {
    // 初回設定の場合（半荘がまだない場合）の確認アラート
    if (!hasStartedGames) {
      const yakitoriStatus = settings.yakitori.enabled ? '有効' : '無効';
      const chipStatus = settings.chip.enabled ? '有効' : '無効';
      
      const confirmMessage = 
        `部屋設定を保存すると最初の半荘が開始されます。\n\n` +
        `⚠️ 重要な注意事項 ⚠️\n` +
        `半荘開始後は以下の設定は変更できなくなります：\n\n` +
        `• ヤキトリ: ${yakitoriStatus}${settings.yakitori.enabled ? ` (ペナルティ: ${settings.yakitori.penalty}点)` : ''}\n` +
        `• チップ: ${chipStatus}${settings.chip.enabled ? ` (初期枚数: ${settings.chip.initialCount}枚、1枚あたり: ${settings.chip.pointsPerChip}点)` : ''}\n\n` +
        `この設定で保存してよろしいですか？`;
      
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return;
      }
    }

    // バリデーション
    const errors = [];
    
    const umaVal = validateUmaSettingsRange(settings.uma);
    if (!umaVal.valid) {
      errors.push(...umaVal.errors);
    }
    
    const okaVal = validateOkaSettingsRange(settings.oka);
    if (!okaVal.valid) {
      errors.push(...okaVal.errors);
    }
    
    const yakitoriVal = validateYakitoriSettingsRange(settings.yakitori);
    if (!yakitoriVal.valid) {
      errors.push(...yakitoriVal.errors);
    }
    
    const chipVal = validateChipSettingsRange(settings.chip);
    if (!chipVal.valid) {
      errors.push(...chipVal.errors);
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      setSaving(true);
      setValidationErrors([]);
      await onUpdate(settings);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setValidationErrors(['設定の保存に失敗しました']);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(room.settings);
    setValidationErrors([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between active:bg-gray-50 transition-colors"
      >
        <h2 className="text-base font-bold text-gray-900">部屋設定</h2>
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
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 p-3 space-y-4">
          {/* 初回設定時の作成者以外への待機メッセージ */}
          {!hasStartedGames && !effectiveIsCreator && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-orange-700 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">設定中です</span>
              </div>
              <div className="text-sm text-orange-600">
                部屋の作成者が初回設定を行っています。<br />
                しばらくお待ちください。
              </div>
            </div>
          )}

          {/* 初回設定時の作成者のみ、または半荘開始後は全員が設定を表示 */}
          {(hasStartedGames || effectiveIsCreator) && (
            <>
        {/* ウマ設定 */}
        <div>
          <div className="flex flex-col gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">ウマ</h3>
            <div className="flex gap-2">
              <button
                onClick={applyGoto}
                disabled={!hasStartedGames && !effectiveIsCreator}
                className="flex-1 px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded active:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ゴットー (10/5)
              </button>
              <button
                onClick={applyOneTwo}
                disabled={!hasStartedGames && !effectiveIsCreator}
                className="flex-1 px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded active:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ワンツー (20/10)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                トップ-ビリ間
              </label>
              <input
                type="number"
                value={settings.uma.topBottom}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    uma: { ...settings.uma, topBottom: Number(e.target.value) },
                  })
                }
                disabled={!hasStartedGames && !effectiveIsCreator}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                2-3位間
              </label>
              <input
                type="number"
                value={settings.uma.middlePair}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    uma: { ...settings.uma, middlePair: Number(e.target.value) },
                  })
                }
                disabled={!hasStartedGames && !effectiveIsCreator}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* オカ設定 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">オカ</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                開始点
              </label>
              <input
                type="number"
                value={settings.oka.startPoints}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    oka: { ...settings.oka, startPoints: Number(e.target.value) },
                  })
                }
                disabled={!hasStartedGames && !effectiveIsCreator}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                返し点
              </label>
              <input
                type="number"
                value={settings.oka.returnPoints}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    oka: { ...settings.oka, returnPoints: Number(e.target.value) },
                  })
                }
                disabled={!hasStartedGames && !effectiveIsCreator}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* ヤキトリ設定 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">ヤキトリ</h3>
            {hasStartedGames && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                半荘開始後は変更不可
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.yakitori.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      yakitori: { ...settings.yakitori, enabled: e.target.checked },
                    })
                  }
                  disabled={hasStartedGames || (!hasStartedGames && !effectiveIsCreator)}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">有効</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ペナルティ
              </label>
              <input
                type="number"
                min="0"
                value={settings.yakitori.penalty}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    yakitori: { ...settings.yakitori, penalty: Number(e.target.value) },
                  })
                }
                disabled={!settings.yakitori.enabled || hasStartedGames || (!hasStartedGames && !effectiveIsCreator)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* チップ設定 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">チップ</h3>
            {hasStartedGames && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                半荘開始後は変更不可
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.chip.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      chip: { ...settings.chip, enabled: e.target.checked },
                    })
                  }
                  disabled={hasStartedGames || (!hasStartedGames && !effectiveIsCreator)}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">有効</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                初期枚数
              </label>
              <input
                type="number"
                value={settings.chip.initialCount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    chip: { ...settings.chip, initialCount: Number(e.target.value) },
                  })
                }
                disabled={!settings.chip.enabled || hasStartedGames || (!hasStartedGames && !effectiveIsCreator)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                1枚あたり
              </label>
              <input
                type="number"
                value={settings.chip.pointsPerChip}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    chip: { ...settings.chip, pointsPerChip: Number(e.target.value) },
                  })
                }
                disabled={!settings.chip.enabled || hasStartedGames || (!hasStartedGames && !effectiveIsCreator)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

          {/* 初回設定時の注意事項 */}
          {!hasStartedGames && effectiveIsCreator && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">初回設定について</p>
                  <p className="text-sm text-yellow-700">
                    設定を保存すると最初の半荘が開始されます。<br />
                    <strong>ヤキトリとチップの設定は半荘開始後は変更できません</strong>ので、よく確認してから保存してください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* バリデーションエラー表示 */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">設定エラー</p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 保存・キャンセルボタン */}
          {(hasStartedGames || effectiveIsCreator) && (
            <div className="flex gap-2 pt-3">
              <button
                onClick={handleSave}
                disabled={saving || (!hasStartedGames && !effectiveIsCreator)}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg active:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? '保存中...' : (hasStartedGames ? '保存' : '保存して半荘開始')}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300 disabled:bg-gray-100 transition-colors"
              >
                キャンセル
              </button>
            </div>
          )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
