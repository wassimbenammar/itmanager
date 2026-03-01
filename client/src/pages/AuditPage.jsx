import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAudit } from '../api/audit';
import { Pagination } from '../components/common/Pagination';

const TYPES = ['equipement', 'logiciel', 'compte', 'utilisateur', 'licence'];
const ACTION_COLORS = {
  create: 'text-green-400',
  update: 'text-blue-400',
  delete: 'text-red-400',
  attribuer_licence: 'text-purple-400',
  retirer_licence: 'text-orange-400',
};

export default function AuditPage() {
  const [entiteType, setEntiteType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { entiteType, from, to, page }],
    queryFn: () => getAudit({ entite_type: entiteType || undefined, from: from || undefined, to: to || undefined, page, limit: 50 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Journal d'audit</h1>
        <p className="text-gray-500 text-sm mt-1">Historique de toutes les modifications</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={entiteType} onChange={e => { setEntiteType(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Toutes les entités</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
        <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
        {(entiteType || from || to) && (
          <button onClick={() => { setEntiteType(''); setFrom(''); setTo(''); setPage(1); }}
            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-100 border border-gray-700 rounded-lg transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
          : data?.data?.length === 0 ? <div className="p-8 text-center text-gray-500">Aucune entrée d'audit</div>
          : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date', 'Utilisateur', 'Action', 'Entité', 'Libellé'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data?.data?.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {entry.utilisateur_nom || <span className="text-gray-600">Système</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${ACTION_COLORS[entry.action] || 'text-gray-400'}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{entry.entite_type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{entry.entite_label || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}
    </div>
  );
}
