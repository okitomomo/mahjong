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

export function RoomSettings({ room, onUpdate, initiallyOpen = false }) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [settings, setSettings] = useState(room.settings);
  const [saving, setSaving] = useState(false);
  
  // バリデーション状態
  const [validationErrors, setValidationErrors] = useState([]);

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
        {/* ウマ設定 */}
        <div>
          <div className="flex flex-col gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">ウマ</h3>
            <div className="flex gap-2">
              <button
                onClick={applyGoto}
                className="flex-1 px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded active:bg-blue-200 transition-colors"
              >
                ゴットー (10/5)
              </button>
              <button
                onClick={applyOneTwo}
                className="flex-1 px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded active:bg-green-200 transition-colors"
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ヤキトリ設定 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">ヤキトリ</h3>
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
                disabled={!settings.yakitori.enabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

        {/* チップ設定 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">チップ</h3>
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
                disabled={!settings.chip.enabled}
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
                disabled={!settings.chip.enabled}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>

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
          <div className="flex gap-2 pt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg active:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300 disabled:bg-gray-100 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
