import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex gap-3.5 items-start">
        <div
          className={`p-2.5 rounded-lg shrink-0 ${
            variant === 'danger'
              ? 'bg-rose-50 text-rose-600 border border-rose-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}
        >
          {variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div className="text-xs text-slate-600 leading-relaxed pt-0.5">{message}</div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          id="confirm-dialog-cancel-btn"
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          id="confirm-dialog-confirm-btn"
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg text-white transition-all shadow-xs cursor-pointer ${
            variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

