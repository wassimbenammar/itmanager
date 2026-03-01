import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEquipementLogiciels, addEquipementLogiciel, removeEquipementLogiciel } from '../../api/equipementExtras';
import { getLogiciels } from '../../api/logiciels';
import { Modal } from '../common/Modal';
import { Plus, Trash2, Package } from 'lucide-react';

export function SoftwareList({ equipementId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [dateInstall, setDateInstall] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: linked = [], isLoading } = useQuery({
    queryKey: ['equipement-logiciels', equipementId],
    queryFn: () => getEquipementLogiciels(equipementId),
  });

  const { data: allLogiciels } = useQuery({
    queryKey: ['logiciels-all'],
    queryFn: () => getLogiciels({ limit: 500 }),
  });

  const linkedIds = new Set(linked.map(l => l.logiciel_id));
  const available = allLogiciels?.data?.filter(l => !linkedIds.has(l.id)) || [];

  const addMutation = useMutation({
    mutationFn: (payload) => addEquipementLogiciel(equipementId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipement-logiciels', equipementId] });
      setOpen(false);
      setSelected('');
      setDateInstall('');
      setNotes('');
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (lid) => removeEquipementLogiciel(equipementId, lid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipement-logiciels', equipementId] }),
  });

  function handleAdd(e) {
    e.preventDefault();
    if (!selected) return;
    addMutation.mutate({ logiciel_id: +selected, date_installation: dateInstall || null, notes: notes || null });
  }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{linked.length} logiciel{linked.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-sm">Chargement...</div>
      ) : linked.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-600 gap-2">
          <Package size={32} />
          <span className="text-sm">Aucun logiciel installé</span>
        </div>
      ) : (
        <div className="space-y-2">
          {linked.map(l => (
            <div key={l.id} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
              <Package size={16} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200">{l.nom}</div>
                <div className="text-xs text-gray-500">
                  {l.fournisseur && <span>{l.fournisseur} · </span>}
                  {l.type_licence && <span>{l.type_licence}</span>}
                  {l.date_installation && <span> · Installé le {new Date(l.date_installation).toLocaleDateString('fr-FR')}</span>}
                </div>
                {l.notes && <div className="text-xs text-gray-600 mt-0.5">{l.notes}</div>}
              </div>
              <button
                onClick={() => removeMutation.mutate(l.logiciel_id)}
                disabled={removeMutation.isPending}
                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setError(''); }} title="Ajouter un logiciel">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <div className="text-sm text-red-400 bg-red-500/10 rounded px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Logiciel *</label>
            <select className={inputCls} value={selected} onChange={e => setSelected(e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {available.map(l => <option key={l.id} value={l.id}>{l.nom}{l.fournisseur ? ` (${l.fournisseur})` : ''}</option>)}
            </select>
            {available.length === 0 && <div className="text-xs text-gray-500 mt-1">Tous les logiciels sont déjà liés</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Date d'installation</label>
            <input type="date" className={inputCls} value={dateInstall} onChange={e => setDateInstall(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
            <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optionnel" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:text-gray-100 transition-colors">Annuler</button>
            <button type="submit" disabled={addMutation.isPending || !selected} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {addMutation.isPending ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
