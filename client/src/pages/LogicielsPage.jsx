import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { getLogiciels, deleteLogiciel } from '../api/logiciels';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

const TYPES = ['perpetuelle', 'abonnement', 'volume', 'oem'];

export default function LogicielsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeLicence, setTypeLicence] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['logiciels', { search, typeLicence, page }],
    queryFn: () => getLogiciels({ search: search || undefined, type_licence: typeLicence || undefined, page }),
  });

  const del = useMutation({
    mutationFn: deleteLogiciel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['logiciels'] }); setDeleteId(null); },
  });

  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  function expirationBadge(date) {
    if (!date) return null;
    if (date < today) return <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> Expirée</span>;
    if (date <= in30) return <span className="text-xs text-yellow-400 flex items-center gap-1"><AlertTriangle size={12} /> Expire bientôt</span>;
    return <span className="text-xs text-gray-500">{date}</span>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Licences logicielles</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des licences et attributions</p>
        </div>
        <Link to="/logiciels/nouveau" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Nouvelle licence
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-40">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher un logiciel..." />
        </div>
        <select value={typeLicence} onChange={e => { setTypeLicence(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucune licence trouvée</div>
        ) : (
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-800">
                {['Logiciel', 'Fournisseur', 'Type', 'Licences', 'Expiration', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data?.data?.map(l => (
                <tr key={l.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/logiciels/${l.id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">{l.nom}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{l.fournisseur || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge value={l.type_licence} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <span className={l.licences_utilisees >= l.nombre_licences ? 'text-red-400' : 'text-gray-300'}>
                        {l.licences_utilisees}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-500">{l.nombre_licences}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{expirationBadge(l.date_expiration)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/logiciels/${l.id}/modifier`} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></Link>
                      <button onClick={() => setDeleteId(l.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
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
        title="Supprimer la licence"
        message="Supprimer ce logiciel et toutes ses attributions ? Cette action est irréversible."
      />
    </div>
  );
}
