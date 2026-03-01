import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateUtilisateur } from '../api/utilisateurs';
import { useAuth } from '../context/AuthContext';

export default function ParametresPage() {
  const { user } = useAuth();
  const [pwd, setPwd] = useState({ current: '', nouveau: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const update = useMutation({
    mutationFn: (data) => updateUtilisateur(user.id, data),
    onSuccess: () => { setPwdSuccess('Mot de passe mis à jour.'); setPwd({ current: '', nouveau: '', confirm: '' }); setPwdError(''); },
    onError: (err) => setPwdError(err.response?.data?.error || 'Erreur'),
  });

  function handlePwdChange(e) {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwd.nouveau !== pwd.confirm) return setPwdError('Les mots de passe ne correspondent pas.');
    if (pwd.nouveau.length < 6) return setPwdError('Le mot de passe doit contenir au moins 6 caractères.');
    update.mutate({ password: pwd.nouveau });
  }

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors';

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion du compte</p>
      </div>

      {/* Info compte */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Informations du compte</h2>
        <dl className="space-y-3">
          {[['Nom', `${user?.prenom} ${user?.nom}`], ['Identifiant', user?.username], ['Email', user?.email], ['Rôle', user?.role]].map(([label, val]) => (
            <div key={label} className="flex items-center justify-between">
              <dt className="text-sm text-gray-500">{label}</dt>
              <dd className="text-sm text-gray-100">{val || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Changement mot de passe */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Changer le mot de passe</h2>

        {pwdError && <div className="mb-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{pwdError}</div>}
        {pwdSuccess && <div className="mb-3 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">{pwdSuccess}</div>}

        <form onSubmit={handlePwdChange} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Nouveau mot de passe</label>
            <input type="password" className={inputCls} value={pwd.nouveau} onChange={e => setPwd(p => ({ ...p, nouveau: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Confirmer le mot de passe</label>
            <input type="password" className={inputCls} value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={update.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {update.isPending ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>

      {/* Version */}
      <div className="text-center text-xs text-gray-600">
        ITManager v1.0.0 · Node.js + React + SQLite
      </div>
    </div>
  );
}
