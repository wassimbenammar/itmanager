import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2, Mail, Phone } from 'lucide-react';
import { getFournisseurs, deleteFournisseur } from '../api/fournisseurs';
import { SearchBar } from '../components/common/SearchBar';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export default function FournisseursPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['fournisseurs', search],
    queryFn: () => getFournisseurs({ search: search || undefined }),
  });

  const del = useMutation({
    mutationFn: deleteFournisseur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fournisseurs'] }); setDeleteId(null); },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Fournisseurs</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des prestataires et fournisseurs</p>
        </div>
        <Link to="/fournisseurs/nouveau" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> Nouveau fournisseur
        </Link>
      </div>

      <div className="max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un fournisseur..." />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building2 size={32} className="mx-auto mb-2 opacity-40" />
            <p>Aucun fournisseur trouvé</p>
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800">
                {['Fournisseur', 'Contact', 'Équipements', 'Logiciels', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {items.map(f => (
                <tr key={f.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{f.nom}</div>
                        {f.site_web && <div className="text-xs text-gray-500">{f.site_web}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-400">{f.contact_nom || '—'}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {f.contact_email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={10} />{f.contact_email}</span>}
                      {f.contact_tel && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={10} />{f.contact_tel}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 text-center">{f.nb_equipements}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 text-center">{f.nb_logiciels}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/fournisseurs/${f.id}/modifier`} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => setDeleteId(f.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
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

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => del.mutate(deleteId)}
        loading={del.isPending}
        title="Supprimer le fournisseur"
        message="Êtes-vous sûr de vouloir supprimer ce fournisseur ? Les équipements et logiciels liés ne seront pas supprimés."
      />
    </div>
  );
}
