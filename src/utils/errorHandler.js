/**
 * エラーハンドリングユーティリティ
 * Error handling utilities
 */

/**
 * エラー型定義
 * Error types
 */
export const ErrorType = {
  VALIDATION: 'validation',
  FIRESTORE: 'firestore',
  COOKIE: 'cookie',
  UNKNOWN: 'unknown',
};

/**
 * アプリケーションエラークラス
 * Application error class
 */
export class AppError extends Error {
  constructor(type, message, field = null, code = null) {
    super(message);
    this.type = type;
    this.field = field;
    this.code = code;
    this.name = 'AppError';
  }
}

/**
 * Firestoreエラーがリトライ可能かチェック
 * Check if Firestore error is retryable
 * 
 * @param {Error} error - エラーオブジェクト (Error object)
 * @returns {boolean}
 */
export function isRetryableError(error) {
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
  ];
  
  return error.code && retryableCodes.includes(error.code);
}

/**
 * 指数バックオフでリトライ
 * Retry with exponential backoff
 * 
 * @param {Function} fn - 実行する関数 (Function to execute)
 * @param {number} maxRetries - 最大リトライ回数 (Maximum retry count)
 * @param {number} baseDelay - 基本遅延時間（ミリ秒） (Base delay in milliseconds)
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || !isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Firestoreエラーをユーザーフレンドリーなメッセージに変換
 * Convert Firestore error to user-friendly message
 * 
 * @param {Error} error - エラーオブジェクト (Error object)
 * @returns {string} ユーザーフレンドリーなメッセージ (User-friendly message)
 */
export function getErrorMessage(error) {
  if (error instanceof AppError) {
    return error.message;
  }
  
  // Firestoreエラーコードに基づくメッセージ
  switch (error.code) {
    case 'permission-denied':
      return 'アクセス権限がありません';
    case 'not-found':
      return 'データが見つかりません';
    case 'already-exists':
      return 'データが既に存在します';
    case 'unavailable':
      return 'サービスが一時的に利用できません。しばらくしてから再試行してください';
    case 'deadline-exceeded':
      return 'リクエストがタイムアウトしました。再試行してください';
    case 'resource-exhausted':
      return 'リソースが不足しています。しばらくしてから再試行してください';
    case 'unauthenticated':
      return '認証が必要です';
    case 'invalid-argument':
      return '入力値が不正です';
    default:
      return error.message || '予期しないエラーが発生しました';
  }
}

/**
 * エラーをログに記録
 * Log error
 * 
 * @param {Error} error - エラーオブジェクト (Error object)
 * @param {Object} context - コンテキスト情報 (Context information)
 */
export function logError(error, context = {}) {
  console.error('Error occurred:', {
    message: error.message,
    type: error.type || 'unknown',
    code: error.code,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
