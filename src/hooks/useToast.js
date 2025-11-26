/**
 * トースト通知管理カスタムフック
 * Custom hook for managing toast notifications
 */

import { useState, useCallback } from 'react';

let toastId = 0;

/**
 * トースト通知を管理するカスタムフック
 * @returns {{
 *   toasts: Array<{id: string, message: string, type: string, duration: number}>,
 *   showToast: (message: string, type?: string, duration?: number) => void,
 *   removeToast: (id: string) => void,
 *   showSuccess: (message: string) => void,
 *   showError: (message: string) => void,
 *   showInfo: (message: string) => void,
 *   showWarning: (message: string) => void,
 * }}
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = `toast-${toastId++}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message) => {
    showToast(message, 'error', 4000); // エラーは少し長めに表示
  }, [showToast]);

  const showInfo = useCallback((message) => {
    showToast(message, 'info');
  }, [showToast]);

  const showWarning = useCallback((message) => {
    showToast(message, 'warning');
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
