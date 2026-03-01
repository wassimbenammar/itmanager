import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getCompte, createCompte, updateCompte } from '../api/comptes';
import { getUtilisateurs } from '../api/utilisateurs';

const SERVICES = ['microsoft365', 'sharepoint', 'saas', 'portail', 'autre'];
const NIVEAUX = ['lecture', 'ecriture', 'admin', 'owner'];
const EMPTY = { service: 'autre', nom_service: '', identifiant: '', type_compte: '', utilisateur_id: '', date_creation: '', derniere_utilisation: '', niveau_acces: 'lecture', actif: true, notes: '' };

export default function CompteFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const { data: compte } = useQuery({ queryKey: ['compte', id], queryFn: () => getCompte(id), enabled: isEdit });
  const { data: users } = useQuery({ queryKey: ['utilisateurs-all'], queryFn: () => getUtilisateurs({ limit: 200 }) });

  useEffect(() => {
    if (compte) setForm({ ...EMPTY, ...compte, utilisateur_id: compte.utilisateur_id || '', actif: compte.actif === 1 });
  }, [compte]);

  const mutation = useMutation({
    mutationFn: isEdit ? (d) => updateCompte(id, d) : createCompte,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comptes'] }); navigate('/comptes'); },
    onError: (err) => setError(err.response?.data?.error || 'Erreur'),
  });

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-400 mb-1.5';
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  function handleSubmit(e) {
    e.preventDefault(); setError('');
    mutation.mutate({ ...form, utilisateur_id: form.utilisateur_id ? +form.utilisateur_id : null });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
        <h1 className="text-2xl font-bold text-gray-100">{isEdit ? 'Modifier le compte' : 'Nouveau compte externe'}</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Service *</label>
            <select className={inputCls} value={form.service} onChange={e => set('service', e.target.value)}>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nom du service *</label>
            <input className={inputCls} value={form.nom_service} onChange={e => set('nom_service', e.target.value)} required />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Identifiant *</label>
            <input className={inputCls} value={form.identifiant} onChange={e => set('identifiant', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Type de compte</label>
            <input className={inputCls} value={form.type_compte} onChange={e => set('type_compte', e.target.value)} placeholder="ex: utilisateur, service..." />
          </div>
          <div>
            <label className={labelCls}>Niveau d'accès</label>
            <select className={inputCls} value={form.niveau_acces} onChange={e => set('niveau_acces', e.target.value)}>
              {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Utilisateur</label>
            <select className={inputCls} value={form.utilisateur_id} onChange={e => set('utilisateur_id', e.target.value)}>
              <option value="">— Aucun —</option>
              {users?.data?.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Statut</label>
            <select className={inputCls} value={form.actif ? 'true' : 'false'} onChange={e => set('actif', e.target.value === 'true')}>
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date de création</label>
            <input type="date" className={inputCls} value={form.date_creation} onChange={e => set('date_creation', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Dernière utilisation</label>
            <input type="date" className={inputCls} value={form.derniere_utilisation} onChange={e => set('derniere_utilisation', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 border border-gray-700 rounded-lg transition-colors">Annuler</button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {mutation.isPending ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
