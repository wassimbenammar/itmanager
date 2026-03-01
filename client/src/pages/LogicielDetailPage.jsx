import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { getLogiciel, deleteLogiciel, getAttributions, addAttribution, removeAttribution } from '../api/logiciels';
import { getUtilisateurs } from '../api/utilisateurs';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';

export default function LogicielDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const [showAttrib, setShowAttrib] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [attribError, setAttribError] = useState('');

  const { data: log } = useQuery({ queryKey: ['logiciel', id], queryFn: () => getLogiciel(id) });
  const { data: attributions } = useQuery({ queryKey: ['attributions', id], queryFn: () => getAttributions(id) });
  const { data: users } = useQuery({ queryKey: ['utilisateurs-all'], queryFn: () => getUtilisateurs({ limit: 200 }) });

  const del = useMutation({
    mutationFn: () => deleteLogiciel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['logiciels'] }); navigate('/logiciels'); },
  });

  const attrib = useMutation({
    mutationFn: () => addAttribution(id, { utilisateur_id: +selectedUser }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attributions', id] });
      qc.invalidateQueries({ queryKey: ['logiciel', id] });
      setShowAttrib(false); setSelectedUser(''); setAttribError('');
    },
    onError: (err) => setAttribError(err.response?.data?.error || 'Erreur'),
  });

  const retirer = useMutation({
    mutationFn: (userId) => removeAttribution(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attributions', id] });
      qc.invalidateQueries({ queryKey: ['logiciel', id] });
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const attribIds = new Set((attributions || []).map(a => a.utilisateur_id));
  const availableUsers = users?.data?.filter(u => !attribIds.has(u.id)) || [];

  if (!log) return <div className="text-gray-400">Chargement...</div>;

  const expired = log.date_expiration && log.date_expiration < today;
  const licencesSaturees = log.licences_utilisees >= log.nombre_licences;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{log.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge value={log.type_licence} />
              {expired && <span className="text-xs text-red-400">Expirée</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/logiciels/${id}/modifier`} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            <Pencil size={14} /> Modifier
          </Link>
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div><dt className="text-xs text-gray-500 uppercase">Fournisseur</dt><dd className="mt-1 text-sm text-gray-100">{log.fournisseur || '—'}</dd></div>
          <div><dt className="text-xs text-gray-500 uppercase">Expiration</dt><dd className={`mt-1 text-sm ${expired ? 'text-red-400' : 'text-gray-100'}`}>{log.date_expiration || '—'}</dd></div>
          <div><dt className="text-xs text-gray-500 uppercase">Licences utilisées</dt>
            <dd className={`mt-1 text-sm font-semibold ${licencesSaturees ? 'text-red-400' : 'text-gray-100'}`}>
              {log.licences_utilisees} / {log.nombre_licences}
            </dd>
          </div>
          <div><dt className="text-xs text-gray-500 uppercase">Clé de licence</dt><dd className="mt-1 text-sm text-gray-500 font-mono">{log.cle_licence || '—'}</dd></div>
          {log.notes && <div className="col-span-2"><dt className="text-xs text-gray-500 uppercase">Notes</dt><dd className="mt-1 text-sm text-gray-100">{log.notes}</dd></div>}
        </dl>
      </div>

      {/* Attributions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Utilisateurs assignés ({log.licences_utilisees}/{log.nombre_licences})</h2>
          <button
            onClick={() => setShowAttrib(true)}
            disabled={licencesSaturees}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            <UserPlus size={13} /> Attribuer
          </button>
        </div>
        {!attributions?.length ? (
          <div className="p-6 text-center text-gray-500 text-sm">Aucune attribution</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {attributions.map(a => (
              <li key={a.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link to={`/utilisateurs/${a.utilisateur_id}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                    {a.prenom} {a.nom}
                  </Link>
                  <div className="text-xs text-gray-500">{a.email} · {a.departement || 'N/A'}</div>
                </div>
                <button onClick={() => retirer.mutate(a.utilisateur_id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                  <UserMinus size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => del.mutate()} loading={del.isPending} title="Supprimer la licence" message={`Supprimer "${log.nom}" et toutes ses attributions ?`} />

      <Modal open={showAttrib} onClose={() => { setShowAttrib(false); setAttribError(''); }} title="Attribuer une licence" size="sm">
        {attribError && <div className="mb-3 text-sm text-red-400">{attribError}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Utilisateur</label>
            <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500">
              <option value="">— Choisir —</option>
              {availableUsers.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAttrib(false)} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg">Annuler</button>
            <button onClick={() => attrib.mutate()} disabled={!selectedUser || attrib.isPending}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
              {attrib.isPending ? 'Attribution...' : 'Attribuer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
