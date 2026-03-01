import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getComptes, deleteCompte } from '../api/comptes';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const SERVICES = ['microsoft365', 'sharepoint', 'saas', 'portail', 'autre'];
const SERVICE_LABELS = { microsoft365: 'Microsoft 365', sharepoint: 'SharePoint', saas: 'SaaS', portail: 'Portail', autre: 'Autre' };

export default function ComptesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [service, setService] = useState('');
  const [actif, setActif] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['comptes', { search, service, actif, page }],
    queryFn: () => getComptes({ search: search || undefined, service: service || undefined, actif: actif !== '' ? actif : undefined, page }),
  });

  const del = useMutation({
    mutationFn: deleteCompte,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comptes'] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Comptes externes</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des accès aux services externes</p>
        </div>
        <Link to="/comptes/nouveau" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Nouveau compte
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-40">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher..." />
        </div>
        <select value={service} onChange={e => { setService(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Tous les services</option>
          {SERVICES.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
        </select>
        <select value={actif} onChange={e => { setActif(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun compte trouvé</div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800">
                {['Service', 'Identifiant', 'Type', 'Accès', 'Utilisateur', 'Statut', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data?.data?.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-200">{c.nom_service}</div>
                    <div className="text-xs text-gray-500">{SERVICE_LABELS[c.service] || c.service}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{c.identifiant}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.type_compte || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c.niveau_acces || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{c.utilisateur_nom || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={c.actif} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/comptes/${c.id}/modifier`} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></Link>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
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
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => del.mutate(deleteId)} loading={del.isPending}
        title="Supprimer le compte" message="Supprimer ce compte externe ? Cette action est irréversible."
      />
    </div>
  );
}
