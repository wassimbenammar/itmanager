import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Monitor, Package, Globe, Pencil } from 'lucide-react';
import { getUtilisateur, updateUtilisateur, getUtilisateurEquipements, getUtilisateurLicences, getUtilisateurComptes } from '../api/utilisateurs';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'it_staff', 'viewer'];

export default function UtilisateurDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({});
  const [editError, setEditError] = useState('');

  const { data: u } = useQuery({ queryKey: ['utilisateur', id], queryFn: () => getUtilisateur(id) });
  const { data: equips } = useQuery({ queryKey: ['u-equips', id], queryFn: () => getUtilisateurEquipements(id) });
  const { data: licences } = useQuery({ queryKey: ['u-licences', id], queryFn: () => getUtilisateurLicences(id) });
  const { data: comptes } = useQuery({ queryKey: ['u-comptes', id], queryFn: () => getUtilisateurComptes(id) });

  const update = useMutation({
    mutationFn: (data) => updateUtilisateur(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['utilisateur', id] }); setShowEdit(false); setEditError(''); },
    onError: (err) => setEditError(err.response?.data?.error || 'Erreur'),
  });

  function openEdit() {
    if (u) setForm({ nom: u.nom, prenom: u.prenom, email: u.email, departement: u.departement || '', role: u.role, username: u.username, actif: u.actif === 1, password: '' });
    setShowEdit(true);
  }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const canManage = ['admin', 'it_staff'].includes(me?.role);

  if (!u) return <div className="text-gray-400">Chargement...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{u.prenom} {u.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge value={u.role} />
              <StatusBadge value={u.actif} />
              <span className="text-sm text-gray-500">@{u.username}</span>
            </div>
          </div>
        </div>
        {canManage && (
          <button onClick={openEdit} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            <Pencil size={14} /> Modifier
          </button>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[['Email', u.email], ['Département', u.departement], ['Membre depuis', new Date(u.created_at).toLocaleDateString('fr-FR')]].map(([label, val]) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 uppercase">{label}</dt>
              <dd className="mt-1 text-sm text-gray-100">{val || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Équipements */}
      <Section icon={Monitor} title="Équipements assignés" count={equips?.length}>
        {equips?.length ? (
          <ul className="divide-y divide-gray-800">
            {equips.map(e => (
              <li key={e.id} className="flex items-center justify-between px-5 py-3">
                <Link to={`/equipements/${e.id}`} className="text-sm text-blue-400 hover:text-blue-300">{e.nom}</Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{e.type}</span>
                  <StatusBadge value={e.statut} />
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState text="Aucun équipement assigné" />}
      </Section>

      {/* Licences */}
      <Section icon={Package} title="Licences attribuées" count={licences?.length}>
        {licences?.length ? (
          <ul className="divide-y divide-gray-800">
            {licences.map(l => (
              <li key={l.id} className="flex items-center justify-between px-5 py-3">
                <Link to={`/logiciels/${l.logiciel_id}`} className="text-sm text-blue-400 hover:text-blue-300">{l.nom}</Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{l.fournisseur}</span>
                  <StatusBadge value={l.type_licence} />
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState text="Aucune licence attribuée" />}
      </Section>

      {/* Comptes */}
      <Section icon={Globe} title="Comptes externes" count={comptes?.length}>
        {comptes?.length ? (
          <ul className="divide-y divide-gray-800">
            {comptes.map(c => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm text-gray-200">{c.nom_service}</div>
                  <div className="text-xs text-gray-500 font-mono">{c.identifiant}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{c.niveau_acces}</span>
                  <StatusBadge value={c.actif} />
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState text="Aucun compte externe" />}
      </Section>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'utilisateur">
        {editError && <div className="mb-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{editError}</div>}
        <form onSubmit={e => { e.preventDefault(); setEditError(''); const payload = { ...form }; if (!payload.password) delete payload.password; update.mutate(payload); }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-400 mb-1">Prénom</label><input className={inputCls} value={form.prenom || ''} onChange={e => set('prenom', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Nom</label><input className={inputCls} value={form.nom || ''} onChange={e => set('nom', e.target.value)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Email</label><input type="email" className={inputCls} value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Département</label><input className={inputCls} value={form.departement || ''} onChange={e => set('departement', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Rôle</label>
              <select className={inputCls} value={form.role || 'viewer'} onChange={e => set('role', e.target.value)} disabled={me?.id === +id}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-400 mb-1">Statut</label>
              <select className={inputCls} value={form.actif ? 'true' : 'false'} onChange={e => set('actif', e.target.value === 'true')}>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
            <div><label className="block text-xs text-gray-400 mb-1">Nouveau mot de passe</label><input type="password" className={inputCls} value={form.password || ''} onChange={e => set('password', e.target.value)} placeholder="Laisser vide pour ne pas changer" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg">Annuler</button>
            <button type="submit" disabled={update.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg">
              {update.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
        <Icon size={16} className="text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
        {count !== undefined && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="px-5 py-4 text-sm text-gray-500">{text}</div>;
}
