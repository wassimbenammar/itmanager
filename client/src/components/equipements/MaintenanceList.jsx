import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Wrench } from 'lucide-react';
import { getEquipementMaintenances, addEquipementMaintenance, updateEquipementMaintenance, deleteEquipementMaintenance } from '../../api/equipementExtras';

const TYPES = ['preventif', 'correctif', 'mise_a_jour'];
const STATUTS = ['planifie', 'en_cours', 'termine', 'annule'];
const STATUT_COLORS = { planifie: 'text-blue-400 bg-blue-500/10', en_cours: 'text-yellow-400 bg-yellow-500/10', termine: 'text-green-400 bg-green-500/10', annule: 'text-gray-500 bg-gray-500/10' };
const TYPE_LABELS = { preventif: 'Préventif', correctif: 'Correctif', mise_a_jour: 'Mise à jour' };

const EMPTY = { titre: '', type: 'preventif', statut: 'planifie', date_planifiee: '', date_realisee: '', cout: '', prestataire: '', notes: '' };

export function MaintenanceList({ equipementId }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['maintenances', equipementId],
    queryFn: () => getEquipementMaintenances(equipementId),
  });

  const create = useMutation({
    mutationFn: (d) => addEquipementMaintenance(equipementId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenances', equipementId] }); closeForm(); },
  });

  const upd = useMutation({
    mutationFn: ({ mid, d }) => updateEquipementMaintenance(equipementId, mid, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenances', equipementId] }); closeForm(); },
  });

  const del = useMutation({
    mutationFn: (mid) => deleteEquipementMaintenance(equipementId, mid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenances', equipementId] }),
  });

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(m) { setEditing(m); setForm({ titre: m.titre, type: m.type, statut: m.statut, date_planifiee: m.date_planifiee || '', date_realisee: m.date_realisee || '', cout: m.cout || '', prestataire: m.prestataire || '', notes: m.notes || '' }); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY); }

  function handleSubmit(e) {
    e.preventDefault();
    if (editing) upd.mutate({ mid: editing.id, d: form });
    else create.mutate(form);
  }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Interventions & Maintenance</h3>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <Plus size={12} /> Nouvelle intervention
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-200">{editing ? 'Modifier' : 'Nouvelle intervention'}</span>
            <button onClick={closeForm}><X size={16} className="text-gray-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Titre *</label>
                <input className={inputCls} value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Statut</label>
                <select className={inputCls} value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date planifiée</label>
                <input type="date" className={inputCls} value={form.date_planifiee} onChange={e => setForm(f => ({ ...f, date_planifiee: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date réalisée</label>
                <input type="date" className={inputCls} value={form.date_realisee} onChange={e => setForm(f => ({ ...f, date_realisee: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Coût (€)</label>
                <input type="number" step="0.01" className={inputCls} value={form.cout} onChange={e => setForm(f => ({ ...f, cout: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Prestataire</label>
                <input className={inputCls} value={form.prestataire} onChange={e => setForm(f => ({ ...f, prestataire: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                <textarea rows={2} className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg">Annuler</button>
              <button type="submit" disabled={create.isPending || upd.isPending} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
                {editing ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-500 py-6 text-sm">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Wrench size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucune intervention enregistrée</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(m => (
            <div key={m.id} className="bg-gray-800/60 border border-gray-700 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-200">{m.titre}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUT_COLORS[m.statut] || 'text-gray-400'}`}>{m.statut}</span>
                    <span className="text-xs text-gray-500">{TYPE_LABELS[m.type]}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                    {m.date_planifiee && <span>Planifié: {m.date_planifiee}</span>}
                    {m.date_realisee && <span>Réalisé: {m.date_realisee}</span>}
                    {m.cout && <span>Coût: {m.cout} €</span>}
                    {m.prestataire && <span>Prestataire: {m.prestataire}</span>}
                  </div>
                  {m.notes && <p className="text-xs text-gray-500 mt-1">{m.notes}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(m)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => del.mutate(m.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
