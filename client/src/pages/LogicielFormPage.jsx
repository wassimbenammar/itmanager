import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getLogiciel, createLogiciel, updateLogiciel } from '../api/logiciels';

const TYPES = ['perpetuelle', 'abonnement', 'volume', 'oem'];
const EMPTY = { nom: '', fournisseur: '', type_licence: 'perpetuelle', nombre_licences: 1, date_expiration: '', cle_licence: '', notes: '' };

export default function LogicielFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const { data: log } = useQuery({ queryKey: ['logiciel', id], queryFn: () => getLogiciel(id), enabled: isEdit });

  useEffect(() => {
    if (log) setForm({ ...EMPTY, ...log });
  }, [log]);

  const mutation = useMutation({
    mutationFn: isEdit ? (d) => updateLogiciel(id, d) : createLogiciel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['logiciels'] }); navigate('/logiciels'); },
    onError: (err) => setError(err.response?.data?.error || 'Erreur'),
  });

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-400 mb-1.5';
  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"><ArrowLeft size={18} /></button>
        <h1 className="text-2xl font-bold text-gray-100">{isEdit ? 'Modifier la licence' : 'Nouvelle licence'}</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate({ ...form, nombre_licences: +form.nombre_licences }); }}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Nom du logiciel *</label>
            <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Fournisseur</label>
            <input className={inputCls} value={form.fournisseur} onChange={e => set('fournisseur', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Type de licence</label>
            <select className={inputCls} value={form.type_licence} onChange={e => set('type_licence', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nombre de licences *</label>
            <input type="number" min={1} className={inputCls} value={form.nombre_licences} onChange={e => set('nombre_licences', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Date d'expiration</label>
            <input type="date" className={inputCls} value={form.date_expiration} onChange={e => set('date_expiration', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Clé de licence</label>
            <input className={inputCls} value={form.cle_licence || ''} onChange={e => set('cle_licence', e.target.value)}
              placeholder={isEdit ? '(conservée si non modifiée)' : ''} />
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
