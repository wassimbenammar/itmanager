import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getEquipement, createEquipement, updateEquipement } from '../api/equipements';
import { getUtilisateurs } from '../api/utilisateurs';
import { getFournisseurs } from '../api/fournisseurs';

const TYPES = ['ordinateur', 'serveur', 'reseau', 'mobile', 'autre'];
const STATUTS = ['actif', 'hors_service', 'maintenance', 'stock'];

const EMPTY = {
  nom: '', type: 'ordinateur', numero_serie: '', fabricant: '', modele: '', date_achat: '',
  statut: 'actif', utilisateur_id: '', localisation: '', notes: '',
  date_garantie_debut: '', date_garantie_fin: '', garantie_fournisseur: '',
  date_fin_vie: '', numero_bon_commande: '',
  fournisseur_id: '', adresse_ip: '', adresse_mac: '', hostname: '',
  prix_achat: '', duree_amortissement_ans: '',
};

export default function EquipementFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const { data: eq } = useQuery({ queryKey: ['equipement', id], queryFn: () => getEquipement(id), enabled: isEdit });
  const { data: users } = useQuery({ queryKey: ['utilisateurs-all'], queryFn: () => getUtilisateurs({ limit: 200 }) });
  const { data: fournisseurs } = useQuery({ queryKey: ['fournisseurs'], queryFn: () => getFournisseurs() });

  useEffect(() => {
    if (eq) setForm({ ...EMPTY, ...eq, utilisateur_id: eq.utilisateur_id || '' });
  }, [eq]);

  const mutation = useMutation({
    mutationFn: isEdit ? (d) => updateEquipement(id, d) : createEquipement,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipements'] }); navigate('/equipements'); },
    onError: (err) => setError(err.response?.data?.error || 'Erreur'),
  });

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = { ...form, utilisateur_id: form.utilisateur_id ? +form.utilisateur_id : null };
    mutation.mutate(payload);
  }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-400 mb-1.5';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{isEdit ? 'Modifier l\'équipement' : 'Nouvel équipement'}</h1>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:sm:col-span-2">
            <label className={labelCls}>Nom *</label>
            <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Type *</label>
            <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Statut *</label>
            <select className={inputCls} value={form.statut} onChange={e => set('statut', e.target.value)}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fabricant</label>
            <input className={inputCls} value={form.fabricant} onChange={e => set('fabricant', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Modèle</label>
            <input className={inputCls} value={form.modele} onChange={e => set('modele', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Numéro de série</label>
            <input className={inputCls} value={form.numero_serie} onChange={e => set('numero_serie', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Date d'achat</label>
            <input type="date" className={inputCls} value={form.date_achat} onChange={e => set('date_achat', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Utilisateur assigné</label>
            <select className={inputCls} value={form.utilisateur_id} onChange={e => set('utilisateur_id', e.target.value)}>
              <option value="">— Aucun —</option>
              {users?.data?.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Localisation</label>
            <input className={inputCls} value={form.localisation} onChange={e => set('localisation', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Warranty & lifecycle fields */}
          <div className="sm:col-span-2 border-t border-gray-700 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Garantie & cycle de vie</p>
          </div>
          <div>
            <label className={labelCls}>Début garantie</label>
            <input type="date" className={inputCls} value={form.date_garantie_debut} onChange={e => set('date_garantie_debut', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Fin garantie</label>
            <input type="date" className={inputCls} value={form.date_garantie_fin} onChange={e => set('date_garantie_fin', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Fournisseur garantie</label>
            <input className={inputCls} value={form.garantie_fournisseur} onChange={e => set('garantie_fournisseur', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Fin de vie prévue</label>
            <input type="date" className={inputCls} value={form.date_fin_vie} onChange={e => set('date_fin_vie', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Bon de commande</label>
            <input className={inputCls} value={form.numero_bon_commande} onChange={e => set('numero_bon_commande', e.target.value)} />
          </div>

          {/* Network & financial */}
          <div className="sm:col-span-2 border-t border-gray-700 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Réseau & Financier</p>
          </div>
          <div>
            <label className={labelCls}>Fournisseur</label>
            <select className={inputCls} value={form.fournisseur_id} onChange={e => set('fournisseur_id', e.target.value)}>
              <option value="">— Aucun —</option>
              {fournisseurs?.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Hostname</label>
            <input className={inputCls} value={form.hostname} onChange={e => set('hostname', e.target.value)} placeholder="pc-john-doe" />
          </div>
          <div>
            <label className={labelCls}>Adresse IP</label>
            <input className={inputCls} value={form.adresse_ip} onChange={e => set('adresse_ip', e.target.value)} placeholder="192.168.1.x" />
          </div>
          <div>
            <label className={labelCls}>Adresse MAC</label>
            <input className={inputCls} value={form.adresse_mac} onChange={e => set('adresse_mac', e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
          </div>
          <div>
            <label className={labelCls}>Prix d'achat (€)</label>
            <input type="number" step="0.01" className={inputCls} value={form.prix_achat} onChange={e => set('prix_achat', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Durée amortissement (ans)</label>
            <input type="number" min="1" max="20" className={inputCls} value={form.duree_amortissement_ans} onChange={e => set('duree_amortissement_ans', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 border border-gray-700 rounded-lg transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {mutation.isPending ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
