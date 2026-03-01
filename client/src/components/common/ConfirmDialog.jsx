import { Modal } from './Modal';

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmer', message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 border border-gray-700 rounded-lg transition-colors">
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {loading ? 'Suppression...' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  );
}
