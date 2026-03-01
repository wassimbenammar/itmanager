import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Download, Copy, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { getEquipements, deleteEquipement } from '../api/equipements';
import { bulkEquipements } from '../api/equipementExtras';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const TYPES = ['', 'ordinateur', 'serveur', 'reseau', 'mobile', 'autre'];
const STATUTS = ['', 'actif', 'hors_service', 'maintenance', 'stock'];
const TYPE_LABELS = { ordinateur: 'Ordinateur', serveur: 'Serveur', reseau: 'Réseau', mobile: 'Mobile', autre: 'Autre' };
const STATUT_LIST = ['actif', 'hors_service', 'maintenance', 'stock'];

export default function EquipementsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['equipements', { search, type, statut, page }],
    queryFn: () => getEquipements({ search: search || undefined, type: type || undefined, statut: statut || undefined, page }),
  });

  const del = useMutation({
    mutationFn: deleteEquipement,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipements'] }); setDeleteId(null); },
  });

  const bulk = useMutation({
    mutationFn: bulkEquipements,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipements'] }); setSelected(new Set()); setBulkConfirm(null); },
  });

  const rows = data?.data || [];
  const allIds = rows.map(r => r.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  function toggleOne(id) {
    setSelected(s => { const ns = new Set(s); ns.has(id) ? ns.delete(id) : ns.add(id); return ns; });
  }

  function csvExportUrl() {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (type) p.set('type', type);
    if (statut) p.set('statut', statut);
    return `/api/equipements/export/csv?${p.toString()}`;
  }

  const selectCls = 'px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Équipements</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion du parc matériel</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={csvExportUrl()} download className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors">
            <Download size={14} /> CSV
          </a>
          <Link to="/equipements/nouveau" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nouvel équipement
          </Link>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-40">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher..." />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">Tous les types</option>
          {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">Tous les statuts</option>
          {STATUTS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-600/10 border border-blue-500/30 rounded-xl px-4 py-3">
          <span className="text-sm text-blue-400 font-medium">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button
                onClick={() => setBulkMenuOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Changer statut <ChevronDown size={12} />
              </button>
              {bulkMenuOpen && (
                <div className="absolute right-0 top-8 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[140px]">
                  {STATUT_LIST.map(s => (
                    <button key={s} onClick={() => { setBulkConfirm({ action: 'statut', statut: s }); setBulkMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setBulkConfirm({ action: 'delete' })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg transition-colors"
            >
              <Trash2 size={12} /> Supprimer
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:text-gray-300">Désélectionner</button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun équipement trouvé</div>
        ) : (
          <table className="w-full min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-500 hover:text-gray-300 transition-colors">
                    {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  </button>
                </th>
                {['Nom', 'Type', 'Fabricant / Modèle', 'Série', 'Statut', 'Utilisateur', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map(eq => (
                <tr key={eq.id} className={`hover:bg-gray-800/50 transition-colors ${selected.has(eq.id) ? 'bg-blue-600/5' : ''}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleOne(eq.id)} className="text-gray-500 hover:text-blue-400 transition-colors">
                      {selected.has(eq.id) ? <CheckSquare size={15} className="text-blue-400" /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/equipements/${eq.id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">{eq.nom}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{TYPE_LABELS[eq.type] || eq.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{[eq.fabricant, eq.modele].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{eq.numero_serie || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={eq.statut} /></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{eq.utilisateur_nom || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/equipements/${eq.id}/modifier`)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(eq.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => del.mutate(deleteId)}
        loading={del.isPending}
        title="Supprimer l'équipement"
        message="Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible."
      />

      <ConfirmDialog
        open={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => bulk.mutate({ ids: Array.from(selected), ...bulkConfirm })}
        loading={bulk.isPending}
        title={bulkConfirm?.action === 'delete' ? `Supprimer ${selected.size} équipement(s)` : `Changer statut → ${bulkConfirm?.statut}`}
        message={bulkConfirm?.action === 'delete'
          ? `Êtes-vous sûr de vouloir supprimer les ${selected.size} équipements sélectionnés ?`
          : `Appliquer le statut "${bulkConfirm?.statut}" aux ${selected.size} équipements sélectionnés ?`}
      />
    </div>
  );
}
