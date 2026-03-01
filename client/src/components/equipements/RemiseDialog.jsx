import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRemises, addRemise } from '../../api/equipementExtras';
import { getUtilisateurs } from '../../api/utilisateurs';
import { SignaturePad } from '../common/SignaturePad';
import { Modal } from '../common/Modal';
import { ClipboardCheck, X } from 'lucide-react';

const TYPE_LABELS = { attribution: 'Attribution', retour: 'Retour' };

export function RemiseDialog({ equipementId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ utilisateur_id: '', type: 'attribution', notes: '' });
  const [signature, setSignature] = useState(null);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [expandedSig, setExpandedSig] = useState(null);

  const { data: remises = [] } = useQuery({
    queryKey: ['equipement-remises', equipementId],
    queryFn: () => getRemises(equipementId),
  });

  const { data: users } = useQuery({
    queryKey: ['utilisateurs-all'],
    queryFn: () => getUtilisateurs({ limit: 200 }),
  });

  const mutation = useMutation({
    mutationFn: (payload) => addRemise(equipementId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipement-remises', equipementId] });
      setOpen(false);
      resetForm();
    },
  });

  function resetForm() {
    setForm({ utilisateur_id: '', type: 'attribution', notes: '' });
    setSignature(null);
    setSignatureConfirmed(false);
  }

  function handleSign(dataUrl) {
    setSignature(dataUrl);
    setSignatureConfirmed(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      utilisateur_id: form.utilisateur_id ? +form.utilisateur_id : null,
      type: form.type,
      notes: form.notes || null,
      signature: signature || null,
    });
  }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <ClipboardCheck size={14} /> Nouvelle remise
        </button>
      </div>

      {/* History */}
      {remises.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-8">Aucune remise enregistrée</div>
      ) : (
        <div className="space-y-3">
          {remises.map(r => (
            <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.type === 'attribution' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {TYPE_LABELS[r.type] || r.type}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString('fr-FR')}</span>
                </div>
                {r.utilisateur_nom && <div className="text-sm text-gray-200">{r.utilisateur_nom}</div>}
                {r.notes && <div className="text-xs text-gray-500 mt-1">{r.notes}</div>}
              </div>
              {r.signature && (
                <button onClick={() => setExpandedSig(r.signature)} className="flex-shrink-0">
                  <img src={r.signature} alt="Signature" className="h-12 w-24 object-contain bg-white/10 rounded border border-gray-600 hover:border-blue-500 transition-colors" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New remise modal */}
      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="Nouvelle remise">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Utilisateur</label>
            <select className={inputCls} value={form.utilisateur_id} onChange={e => setForm(f => ({ ...f, utilisateur_id: e.target.value }))}>
              <option value="">— Aucun —</option>
              {users?.data?.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Type *</label>
            <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
              <option value="attribution">Attribution</option>
              <option value="retour">Retour</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes</label>
            <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Signature</label>
            {signatureConfirmed ? (
              <div className="flex items-center gap-3">
                <img src={signature} alt="Signature" className="h-16 bg-white/10 rounded border border-green-600" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-green-400">Signature validée</span>
                  <button type="button" className="text-xs text-gray-400 hover:text-gray-200" onClick={() => { setSignature(null); setSignatureConfirmed(false); }}>Recommencer</button>
                </div>
              </div>
            ) : (
              <SignaturePad onSign={handleSign} />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setOpen(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:text-gray-100 transition-colors">Annuler</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Signature lightbox */}
      {expandedSig && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setExpandedSig(null)}>
          <button className="absolute top-4 right-4 text-white"><X size={24} /></button>
          <img src={expandedSig} alt="Signature" className="max-w-md max-h-64 object-contain bg-white rounded-lg p-4" />
        </div>
      )}
    </div>
  );
}
