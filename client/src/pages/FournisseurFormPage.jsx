import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getFournisseur, createFournisseur, updateFournisseur } from '../api/fournisseurs';

const EMPTY = { nom: '', contact_nom: '', contact_email: '', contact_tel: '', site_web: '', notes: '' };

export default function FournisseurFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const { data: f } = useQuery({ queryKey: ['fournisseur', id], queryFn: () => getFournisseur(id), enabled: isEdit });

  useEffect(() => { if (f) setForm({ ...EMPTY, ...f }); }, [f]);

  const mutation = useMutation({
    mutationFn: isEdit ? (d) => updateFournisseur(id, d) : createFournisseur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fournisseurs'] }); navigate('/fournisseurs'); },
    onError: (err) => setError(err.response?.data?.error || 'Erreur'),
  });

  function set(field, val) { setForm(f => ({ ...f, [field]: val })); }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-400 mb-1.5';

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-100">{isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h1>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>}

      <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className={labelCls}>Nom du fournisseur *</label>
          <input className={inputCls} value={form.nom} onChange={e => set('nom', e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nom du contact</label>
            <input className={inputCls} value={form.contact_nom} onChange={e => set('contact_nom', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Email du contact</label>
            <input type="email" className={inputCls} value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Téléphone</label>
            <input className={inputCls} value={form.contact_tel} onChange={e => set('contact_tel', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Site web</label>
            <input className={inputCls} value={form.site_web} onChange={e => set('site_web', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea rows={3} className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {mutation.isPending ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
