import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getEquipements, deleteEquipement } from '../api/equipements';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const TYPES = ['', 'ordinateur', 'serveur', 'reseau', 'mobile', 'autre'];
const STATUTS = ['', 'actif', 'hors_service', 'maintenance', 'stock'];
const TYPE_LABELS = { ordinateur: 'Ordinateur', serveur: 'Serveur', reseau: 'Réseau', mobile: 'Mobile', autre: 'Autre' };

export default function EquipementsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['equipements', { search, type, statut, page }],
    queryFn: () => getEquipements({ search: search || undefined, type: type || undefined, statut: statut || undefined, page }),
  });

  const del = useMutation({
    mutationFn: deleteEquipement,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipements'] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Équipements</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion du parc matériel</p>
        </div>
        <Link to="/equipements/nouveau" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Nouvel équipement
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-40">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher..." />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Tous les types</option>
          {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <select value={statut} onChange={e => { setStatut(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Tous les statuts</option>
          {STATUTS.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun équipement trouvé</div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800">
                {['Nom', 'Type', 'Fabricant / Modèle', 'Série', 'Statut', 'Utilisateur', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data?.data?.map(eq => (
                <tr key={eq.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/equipements/${eq.id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">{eq.nom}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{TYPE_LABELS[eq.type] || eq.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{[eq.fabricant, eq.modele].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{eq.numero_serie || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={eq.statut} /></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{eq.utilisateur_nom || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/equipements/${eq.id}/modifier`} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => setDeleteId(eq.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
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
    </div>
  );
}
