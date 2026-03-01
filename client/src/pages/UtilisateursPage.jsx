import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { getUtilisateurs, deleteUtilisateur, createUtilisateur } from '../api/utilisateurs';
import { SearchBar } from '../components/common/SearchBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { Pagination } from '../components/common/Pagination';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'it_staff', 'viewer'];
const EMPTY_FORM = { nom: '', prenom: '', email: '', departement: '', role: 'viewer', username: '', password: '', actif: true };

export default function UtilisateursPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['utilisateurs', { search, role, page }],
    queryFn: () => getUtilisateurs({ search: search || undefined, role: role || undefined, page }),
  });

  const del = useMutation({
    mutationFn: deleteUtilisateur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['utilisateurs'] }); setDeleteId(null); },
  });

  const create = useMutation({
    mutationFn: createUtilisateur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['utilisateurs'] }); setShowCreate(false); setForm(EMPTY_FORM); setFormError(''); },
    onError: (err) => setFormError(err.response?.data?.error || 'Erreur'),
  });

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const canManage = ['admin', 'it_staff'].includes(currentUser?.role);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Utilisateurs</h1>
          <p className="text-gray-500 text-sm mt-1">Annuaire interne</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Nouvel utilisateur
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-40">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Rechercher..." />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        {isLoading ? <div className="p-8 text-center text-gray-500">Chargement...</div>
          : data?.data?.length === 0 ? <div className="p-8 text-center text-gray-500">Aucun utilisateur trouvé</div>
          : (
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Nom', 'Email', 'Département', 'Rôle', 'Statut', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data?.data?.map(u => (
                  <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/utilisateurs/${u.id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">{u.prenom} {u.nom}</Link>
                      <div className="text-xs text-gray-500">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{u.departement || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge value={u.role} /></td>
                    <td className="px-4 py-3"><StatusBadge value={u.actif} /></td>
                    <td className="px-4 py-3">
                      {canManage && u.id !== currentUser?.id && (
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {data && <Pagination page={page} total={data.total} limit={data.limit} onPageChange={setPage} />}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => del.mutate(deleteId)} loading={del.isPending} title="Supprimer l'utilisateur" message="Supprimer cet utilisateur ? Ses équipements et comptes seront détachés." />

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setFormError(''); }} title="Nouvel utilisateur">
        {formError && <div className="mb-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{formError}</div>}
        <form onSubmit={e => { e.preventDefault(); setFormError(''); create.mutate(form); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-400 mb-1">Prénom *</label><input className={inputCls} value={form.prenom} onChange={e => set('prenom', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Nom *</label><input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)} required /></div>
            <div className="sm:col-span-2"><label className="block text-xs text-gray-400 mb-1">Email *</label><input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Identifiant *</label><input className={inputCls} value={form.username} onChange={e => set('username', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Mot de passe *</label><input type="password" className={inputCls} value={form.password} onChange={e => set('password', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Département</label><input className={inputCls} value={form.departement} onChange={e => set('departement', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Rôle</label>
              <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg">Annuler</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
              {create.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
