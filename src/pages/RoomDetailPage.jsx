/**
 * 部屋詳細ページ
 * Room detail page
 */

import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useRoom, useUserId, useMembers, useGames } from '../hooks/index.js';
import { useToast } from '../hooks/useToast.js';
import { useChipTransfer } from '../hooks/useChipTransfer.js';
import { validateScoreRange, validateChipCountRange } from '../models/index.js';
import { ScoreBoard } from '../components/ScoreBoard.jsx';
import { RoomSettings } from '../components/RoomSettings.jsx';
import { ChipTransferModal } from '../components/ChipTransferModal.jsx';
import { Breadcrumb } from '../components/Breadcrumb.jsx';
import { ToastContainer } from '../components/Toast.jsx';
import { LoadingPage } from '../components/Loading.jsx';

export function RoomDetailPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const { room, members, games, currentGame, loading, error, updateSettings, settleRoom } = useRoom(roomId);
  const { userId, getRoomName, setRoomName } = useUserId();
  const { currentUserMember, addMember } = useMembers(roomId);
  const { createGame, submitScore, error: gameError } = useGames(roomId, room?.currentGameId, room?.settings);
  const { receiveChip, isReceiving } = useChipTransfer(roomId, currentUserMember);
  const { toasts, removeToast, showError, showSuccess } = useToast();
  
  const [isNewRoom, setIsNewRoom] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  
  // スコア入力モーダル
  const [showScoreModal, setShowScoreModal] = useState(false);
  
  // チップ受渡モーダル
  const [showChipTransferModal, setShowChipTransferModal] = useState(false);
  
  // ヘルプモーダル
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [chipInput, setChipInput] = useState('0');
  const [isYakitori, setIsYakitori] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  
  // 検証エラー表示
  const [validationError, setValidationError] = useState(null);
  
  // リアルタイムバリデーション
  const [scoreValidation, setScoreValidation] = useState({ valid: true });
  const [chipValidation, setChipValidation] = useState({ valid: true });

  // 「清算する」ボタンの表示可否を判定
  const canSettle = useMemo(() => {
    if (!room || room.isSettled) {
      return false;
    }
    
    // 確定済みの半荘が1つ以上ある、または入力中の半荘がある場合に清算可能
    const completedGames = games.filter(g => g.status === 'completed');
    const inputtingGame = games.find(g => g.status === 'inputting');
    
    return completedGames.length > 0 || inputtingGame;
  }, [room, games]);

  // 「新しい半荘を開始」ボタンの表示可否を判定
  const canStartNewGame = useMemo(() => {
    if (!currentGame || validationError || !room || room.isSettled) {
      return false;
    }
    
    // スコア入力済みのプレイヤーを取得
    const playersWithScores = currentGame.results.filter(r => r.rawScore !== undefined);
    const playerCount = playersWithScores.length;
    
    // 3人未満の場合は非表示
    if (playerCount < 3) {
      return false;
    }
    
    // スコアの合計をチェック
    const totalScore = playersWithScores.reduce((sum, r) => sum + r.rawScore, 0);
    // 部屋設定に基づいて期待される合計を計算
    const startPoints = room.settings.oka.startPoints;
    const expectedTotal = startPoints * playerCount;
    
    return totalScore === expectedTotal;
  }, [currentGame, validationError, room]);

  // 新規作成直後かチェック
  useEffect(() => {
    if (location.state?.isNew) {
      setIsNewRoom(true);
    }
  }, [location]);

  // 入室時の名前チェック
  useEffect(() => {
    if (!roomId || !userId || loading) return;

    const roomName = getRoomName(roomId);
    
    // 部屋ごとの名前が保存されていない場合、ダイアログを表示
    if (!roomName && !currentUserMember) {
      setShowNameDialog(true);
    } else if (roomName && !currentUserMember) {
      // Cookieに名前があるがメンバー登録されていない場合、自動登録
      addMember(userId, roomName).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, loading, currentUserMember]);

  // 名前を送信
  const handleSubmitName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmittingName(true);
    try {
      // Cookieに保存
      setRoomName(roomId, nameInput.trim());
      // Firestoreに登録
      await addMember(userId, nameInput.trim());
      setShowNameDialog(false);
      setNameInput('');
    } catch (err) {
      console.error('Failed to add member:', err);
      showError('名前の登録に失敗しました');
    } finally {
      setIsSubmittingName(false);
    }
  };

  // 清算を実行
  const handleSettle = async () => {
    if (isSettling) return;

    // 入力中の半荘があるかチェック
    const inputtingGame = games.find(g => g.status === 'inputting');
    const hasInputtingGame = !!inputtingGame;
    
    // 入力中の半荘がある場合の警告メッセージ
    let confirmMessage = '部屋を清算しますか？\n\n清算後は新しい半荘を開始できなくなります。';
    
    if (hasInputtingGame) {
      // 入力済みのプレイヤーがいるかチェック
      const playersWithScores = inputtingGame.results.filter(r => r.rawScore !== undefined);
      
      if (playersWithScores.length > 0) {
        confirmMessage = `⚠️ 入力中の第${inputtingGame.gameNumber}回があります\n\n` +
          `${playersWithScores.length}人が既に得点を入力していますが、この半荘は破棄されます。\n\n` +
          '本当に清算しますか？\n\n清算後は新しい半荘を開始できなくなります。';
      } else {
        confirmMessage = `⚠️ 入力中の第${inputtingGame.gameNumber}回があります\n\n` +
          'まだ誰も得点を入力していませんが、この半荘は破棄されます。\n\n' +
          '本当に清算しますか？\n\n清算後は新しい半荘を開始できなくなります。';
      }
    }
    
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    setIsSettling(true);
    try {
      await settleRoom();
      // 成功メッセージは表示しない（リアルタイム更新で反映される）
    } catch (err) {
      console.error('Failed to settle room:', err);
      showError('清算に失敗しました');
    } finally {
      setIsSettling(false);
    }
  };

  // 新しい半荘を開始
  const handleCreateGame = async () => {
    if (isCreatingGame) return;

    setIsCreatingGame(true);
    setValidationError(null);
    try {
      const result = await createGame();
      
      if (result.validationError) {
        // 検証エラーを状態に保存して表示
        setValidationError({
          message: result.validationError,
          previousGameNumber: currentGame?.gameNumber,
        });
      } else if (result.gameId) {
        // 成功 - 何もしない（リアルタイム更新で反映される）
      }
    } catch (err) {
      console.error('Failed to create game:', err);
      showError('半荘の作成に失敗しました');
    } finally {
      setIsCreatingGame(false);
    }
  };

  // チップ受け取りを実行
  const handleChipReceive = async (fromMemberId, fromMemberName, chipCount) => {
    try {
      await receiveChip(fromMemberId, fromMemberName, chipCount);
      setShowChipTransferModal(false);
      showSuccess(`${fromMemberName}から${chipCount}枚受け取りました`);
    } catch (err) {
      console.error('Failed to receive chip:', err);
      // エラーはモーダル内で表示される
    }
  };

  // スコア入力モーダルを開く
  const handleOpenScoreModal = () => {
    if (!currentUserMember || !currentGame) return;
    
    // 清算済み部屋への入力は拒否
    if (room.isSettled) {
      showError('清算済みの部屋は修正できません');
      return;
    }
    
    // 確定済み半荘への入力は拒否
    if (currentGame.status === 'completed') {
      showError('確定済みの半荘は修正できません');
      return;
    }
    
    // 既に入力済みの場合は、その値を表示
    const myResult = currentGame.results.find(r => r.memberId === currentUserMember.id);
    if (myResult && myResult.rawScore !== undefined) {
      setScoreInput(myResult.rawScore.toString());
      setChipInput((myResult.chipCount || 0).toString());
      setIsYakitori(myResult.isYakitori || false);
    } else {
      setScoreInput('');
      setChipInput('0');
      setIsYakitori(false);
    }
    
    // バリデーション状態をリセット
    setScoreValidation({ valid: true });
    setChipValidation({ valid: true });
    
    setShowScoreModal(true);
  };

  // 得点入力時のバリデーション
  const handleScoreInputChange = (value) => {
    setScoreInput(value);
    
    if (value === '') {
      setScoreValidation({ valid: true });
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setScoreValidation({ valid: false, error: '数値を入力してください' });
      return;
    }
    
    const validation = validateScoreRange(numValue);
    setScoreValidation(validation);
  };
  
  // チップ入力時のバリデーション
  const handleChipInputChange = (value) => {
    setChipInput(value);
    
    if (value === '') {
      setChipValidation({ valid: true });
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setChipValidation({ valid: false, error: '数値を入力してください' });
      return;
    }
    
    const validation = validateChipCountRange(numValue);
    setChipValidation(validation);
  };

  // スコアを送信
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    if (!currentUserMember || !scoreInput) return;

    const rawScore = parseInt(scoreInput, 10);
    const chipCount = parseInt(chipInput, 10) || 0;

    if (isNaN(rawScore)) {
      showError('得点を正しく入力してください');
      return;
    }
    
    // 最終バリデーション
    const scoreVal = validateScoreRange(rawScore);
    if (!scoreVal.valid) {
      showError(scoreVal.error);
      return;
    }
    
    if (room.settings.chip.enabled) {
      const chipVal = validateChipCountRange(chipCount);
      if (!chipVal.valid) {
        showError(chipVal.error);
        return;
      }
    }

    setIsSubmittingScore(true);
    try {
      await submitScore(currentUserMember.id, currentUserMember.name, rawScore, chipCount, isYakitori);
      setShowScoreModal(false);
      setScoreInput('');
      setChipInput('0');
      setIsYakitori(false);
      setScoreValidation({ valid: true });
      setChipValidation({ valid: true });
      
      // スコア修正後、検証エラーをクリア（再検証は次回の半荘作成時に行われる）
      if (validationError && validationError.previousGameNumber === currentGame?.gameNumber) {
        setValidationError(null);
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
      showError('得点の送信に失敗しました');
    } finally {
      setIsSubmittingScore(false);
    }
  };

  if (loading) {
    return <LoadingPage message="部屋情報を読み込み中..." />;
  }

  if (error || !room) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '部屋が見つかりません'}</p>
          <Link
            to="/rooms"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            部屋一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* チップ受け取りモーダル */}
      <ChipTransferModal
        isOpen={showChipTransferModal}
        onClose={() => setShowChipTransferModal(false)}
        members={members}
        currentUserMember={currentUserMember}
        onReceive={handleChipReceive}
        isSubmitting={isReceiving}
      />
      
      {/* ヘルプモーダル */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">使い方</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 基本的な流れ */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">基本的な流れ</h3>
                <ol className="space-y-3 list-decimal list-inside text-gray-700">
                  <li className="pl-2">
                    <span className="font-medium">部屋に入室</span>
                    <p className="ml-6 mt-1 text-sm text-gray-600">
                      初回入室時に名前を入力します。この名前は部屋ごとに保存されます。
                    </p>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">部屋設定を確認</span>
                    <p className="ml-6 mt-1 text-sm text-gray-600">
                      ウマ、オカ、ヤキトリ、チップの設定を確認・変更できます。
                    </p>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">得点を入力</span>
                    <p className="ml-6 mt-1 text-sm text-gray-600">
                      半荘終了後、各自が自分の得点を入力します。
                    </p>
                  </li>
                  <li className="pl-2">
                    <span className="font-medium">次の半荘を開始</span>
                    <p className="ml-6 mt-1 text-sm text-gray-600">
                      全員の入力が完了し、得点合計が正しければ「新しい半荘を開始」ボタンが表示されます。
                    </p>
                  </li>
                </ol>
              </section>

              {/* 得点入力のルール */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">得点入力のルール</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-medium">100点刻みで入力</span>
                      <p className="text-sm text-gray-600 mt-0.5">例: 25000, 35400, -12300</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-medium">得点合計が一致する必要がある</span>
                      <p className="text-sm text-gray-600 mt-0.5">
                        3人: 開始点×3（デフォルト105,000点）<br />
                        4人: 開始点×4（デフォルト100,000点）
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-medium">入力後も修正可能</span>
                      <p className="text-sm text-gray-600 mt-0.5">確定前であれば何度でも修正できます</p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* 部屋設定について */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">部屋設定について</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">ウマ</h4>
                    <p className="text-sm text-gray-600">
                      順位点の設定。「ゴットー (10/5)」「ワンツー (20/10)」のプリセットあり。
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">オカ</h4>
                    <p className="text-sm text-gray-600">
                      開始点と返し点の設定。開始点・返し点ともに100点刻みで入力。返し点は開始点以上である必要があります。
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">ヤキトリ</h4>
                    <p className="text-sm text-gray-600">
                      1度も上がっていない場合のペナルティ。ペナルティは2でも3でも割り切れる数値（6の倍数）で入力。
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">チップ</h4>
                    <p className="text-sm text-gray-600">
                      役満などで授受するチップの設定。初期枚数と1枚あたりのポイントを設定できます。
                    </p>
                  </div>
                </div>
              </section>

              {/* よくある質問 */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">よくある質問</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Q. 得点を間違えて入力してしまった</h4>
                    <p className="text-sm text-gray-600">
                      A. 確定前であれば、同じボタンから何度でも修正できます。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Q. 「新しい半荘を開始」ボタンが表示されない</h4>
                    <p className="text-sm text-gray-600">
                      A. 以下を確認してください：<br />
                      ・3人以上が得点を入力しているか<br />
                      ・得点合計が正しいか（3人: 開始点×3、4人: 開始点×4）
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Q. 検証エラーが表示された</h4>
                    <p className="text-sm text-gray-600">
                      A. エラーメッセージに従って得点を修正してください。全員の入力が正しくなれば、再度「新しい半荘を開始」ボタンが表示されます。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Q. 部屋設定を途中で変更できる？</h4>
                    <p className="text-sm text-gray-600">
                      A. はい、いつでも変更できます。変更は次の半荘から適用されます。
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* スコア入力モーダル */}
      {showScoreModal && currentGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              第{currentGame.gameNumber}回 - 得点{currentGame.results.find(r => r.memberId === currentUserMember?.id)?.rawScore !== undefined ? '修正' : '入力'}
            </h2>
            
            {/* 検証エラーがある場合の警告 */}
            {validationError && validationError.previousGameNumber === currentGame.gameNumber && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      この半荘は検証エラーがあります。正しい得点を入力してください。
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 他のメンバーの入力状況 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">入力状況</h3>
              <div className="space-y-2">
                {currentGame.results.map((result) => (
                  <div key={result.memberId} className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${result.memberId === currentUserMember?.id ? 'text-blue-600' : 'text-gray-900'}`}>
                      {result.memberName}
                      {result.memberId === currentUserMember?.id && ' (あなた)'}
                    </span>
                    {result.rawScore !== undefined ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        入力済み ({result.rawScore.toLocaleString()}点)
                      </span>
                    ) : (
                      <span className="text-gray-400">未入力</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* スコア入力フォーム */}
            <form onSubmit={handleSubmitScore}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  あなたの得点 *
                </label>
                <input
                  type="number"
                  value={scoreInput}
                  onChange={(e) => handleScoreInputChange(e.target.value)}
                  placeholder="例: 35000"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    !scoreValidation.valid
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  autoFocus
                  disabled={isSubmittingScore}
                  required
                />
                {!scoreValidation.valid && scoreValidation.error && (
                  <p className="mt-1 text-sm text-red-600">{scoreValidation.error}</p>
                )}
              </div>

              {room.settings.yakitori.enabled && (
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isYakitori}
                      onChange={(e) => setIsYakitori(e.target.checked)}
                      disabled={isSubmittingScore}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ヤキトリ（この半荘で1度も上がっていない）
                    </span>
                  </label>
                </div>
              )}

              {room.settings.chip.enabled && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チップ増減
                  </label>
                  <input
                    type="number"
                    value={chipInput}
                    onChange={(e) => handleChipInputChange(e.target.value)}
                    placeholder="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      !chipValidation.valid
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={isSubmittingScore}
                  />
                  {!chipValidation.valid && chipValidation.error ? (
                    <p className="mt-1 text-sm text-red-600">{chipValidation.error}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      プラスの場合は正の数、マイナスの場合は負の数を入力
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  disabled={isSubmittingScore}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!scoreInput || isSubmittingScore || !scoreValidation.valid || !chipValidation.valid}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingScore ? '送信中...' : (currentGame.results.find(r => r.memberId === currentUserMember?.id)?.rawScore !== undefined ? '更新' : '送信')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 名前入力ダイアログ */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              部屋に入室
            </h2>
            <p className="text-gray-600 mb-4">
              この部屋で使用する名前を入力してください
            </p>
            <form onSubmit={handleSubmitName}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="名前を入力"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
                disabled={isSubmittingName}
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!nameInput.trim() || isSubmittingName}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingName ? '登録中...' : '入室'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-gray-50">
        <div className="px-3 py-4">
        {/* パンくずリスト */}
        <Breadcrumb
          items={[
            { label: 'ホーム', path: '/' },
            { label: '部屋一覧', path: '/rooms' },
            { label: room.name },
          ]}
        />

        {/* ヘッダー */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900 truncate flex-1">
              {room.name}
            </h1>
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="使い方を見る"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span>メンバー: {members.length}人</span>
            <span>半荘数: {games.filter(g => g.status === 'completed').length}回</span>
            {currentUserMember && (
              <span className="text-blue-600">あなた: {currentUserMember.name}</span>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {gameError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{gameError}</p>
          </div>
        )}

        {/* 検証エラー表示 */}
        {validationError && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  第{validationError.previousGameNumber}回の検証に失敗しました
                </h3>
                <div className="mb-4">
                  <p className="text-red-800 font-medium mb-2">エラー内容:</p>
                  <div className="bg-white p-3 rounded border border-red-200 space-y-2">
                    {validationError.message.split(', ').map((error, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <p className="text-red-700">{error}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 現在の入力状況を表示 */}
                {currentGame && currentGame.gameNumber === validationError.previousGameNumber && (
                  <div className="mb-4">
                    <p className="text-red-800 font-medium mb-2">現在の入力状況:</p>
                    <div className="bg-white p-3 rounded border border-red-200">
                      <div className="space-y-2">
                        {currentGame.results.map((result) => (
                          <div key={result.memberId} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-900">{result.memberName}</span>
                            {result.rawScore !== undefined ? (
                              <span className="text-green-600">
                                {result.rawScore.toLocaleString()}点
                              </span>
                            ) : (
                              <span className="text-red-600 font-medium">未入力</span>
                            )}
                          </div>
                        ))}
                        {currentGame.results.filter(r => r.rawScore !== undefined).length > 0 && (
                          <div className="pt-2 mt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm font-medium">
                              <span className="text-gray-900">合計</span>
                              <span className={`${
                                currentGame.results.reduce((sum, r) => sum + (r.rawScore || 0), 0) === 
                                (currentGame.results.filter(r => r.rawScore !== undefined).length === 3 ? 105000 : 100000)
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {currentGame.results.reduce((sum, r) => sum + (r.rawScore || 0), 0).toLocaleString()}点
                                {' / '}
                                {currentGame.results.filter(r => r.rawScore !== undefined).length === 3 ? '105,000' : '100,000'}点
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  <p className="text-red-800 font-medium mb-2">修正方法:</p>
                  <ol className="list-decimal list-inside space-y-1 text-red-700">
                    <li>上の「現在の入力状況」で何が間違っているか確認してください</li>
                    <li>「第{validationError.previousGameNumber}回 - 得点を修正」ボタンから自分の得点を修正してください</li>
                    <li>全員の入力が正しくなったら、再度「新しい半荘を開始」ボタンを押してください</li>
                  </ol>
                </div>
                <button
                  onClick={() => setValidationError(null)}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="mb-4 flex flex-col gap-2">
          {room.isSettled && (
            <div className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">清算済み</span>
              </div>
              {room.settledAt && (
                <div className="text-xs text-gray-500 mt-1">
                  {room.settledAt.toDate().toLocaleString('ja-JP')}
                </div>
              )}
            </div>
          )}
          
          {!room.isSettled && currentGame && (
            <button
              onClick={handleOpenScoreModal}
              disabled={!currentUserMember}
              className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                validationError
                  ? 'bg-red-600 text-white active:bg-red-700 ring-2 ring-red-200 animate-pulse'
                  : 'bg-green-600 text-white active:bg-green-700'
              }`}
            >
              {validationError && '⚠️ '}
              {currentGame.results.find(r => r.memberId === currentUserMember?.id)?.rawScore !== undefined
                ? `第${currentGame.gameNumber}回 - 得点を修正`
                : `第${currentGame.gameNumber}回 - 得点を入力`}
            </button>
          )}
          
          {!room.isSettled && canStartNewGame && (
            <button
              onClick={handleCreateGame}
              disabled={isCreatingGame || !currentUserMember}
              className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isCreatingGame ? '作成中...' : `+ 第${games.filter(g => g.status === 'completed').length + 1}回 - 新しい半荘を開始`}
            </button>
          )}
          
          {!room.isSettled && room.settings.chip.enabled && currentUserMember && (
            <button
              onClick={() => setShowChipTransferModal(true)}
              className="w-full px-4 py-3 bg-purple-600 text-white text-sm font-medium rounded-lg active:bg-purple-700 transition-colors shadow-sm"
            >
              🎯 チップを受け取る
            </button>
          )}
          
          {!room.isSettled && canSettle && (
            <button
              onClick={handleSettle}
              disabled={isSettling || !currentUserMember}
              className="w-full px-4 py-3 bg-orange-600 text-white text-sm font-medium rounded-lg active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSettling ? '清算中...' : '🏁 清算する'}
            </button>
          )}
        </div>

        {/* 部屋設定 */}
        <div className="mb-4">
          <RoomSettings 
            room={room} 
            games={games} 
            onUpdate={updateSettings} 
            initiallyOpen={isNewRoom}
            currentUserId={userId}
            members={members}
            isCreator={
              // 新しい部屋の場合: creatorUserIdで判定
              room?.creatorUserId !== undefined && room?.creatorUserId !== null
                ? room?.creatorUserId === userId && userId !== null
                // 既存の部屋の場合: 最初にメンバー登録した人を作成者として扱う
                : members.length > 0 && members.sort((a, b) => a.createdAt - b.createdAt)[0]?.userId === userId
            }
          />
        </div>

        {/* スコアボード（半荘履歴統合） */}
        <div>
          <ScoreBoard roomId={roomId} members={members} games={games} room={room} />
        </div>
        </div>
      </div>
    </>
  );
}
