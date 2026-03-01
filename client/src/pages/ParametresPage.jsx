import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUtilisateur } from '../api/utilisateurs';
import { getWarrantySettings, saveWarrantySettings, getSmtpSettings, saveSmtpSettings, testSmtp } from '../api/settings';
import { getTags, createTag, updateTag, deleteTag } from '../api/tags';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Circle, Download, Send, Plus, Trash2, Pencil } from 'lucide-react';

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

      {/* Admin sections */}
      {user?.role === 'admin' && (
        <>
          <WarrantyApiConfig inputCls={inputCls} />
          <SmtpConfig inputCls={inputCls} />
          <TagManager inputCls={inputCls} />
          <BackupSection />
        </>
      )}

      {/* Version */}
      <div className="text-center text-xs text-gray-600">
        ITManager v1.0.0 · Node.js + React + SQLite
      </div>
    </div>
  );
}

function WarrantyApiConfig({ inputCls }) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState({
    dell_client_id: '', dell_client_secret: '',
    hp_api_key: '', hp_api_secret: '',
    lenovo_client_id: '',
  });

  const { data: configured = {} } = useQuery({
    queryKey: ['warranty-settings'],
    queryFn: getWarrantySettings,
  });

  const save = useMutation({
    mutationFn: saveWarrantySettings,
    onSuccess: () => {
      setSuccess('Clés enregistrées avec succès.');
      setError('');
      setFields({ dell_client_id: '', dell_client_secret: '', hp_api_key: '', hp_api_secret: '', lenovo_client_id: '' });
    },
    onError: (err) => setError(err.response?.data?.error || 'Erreur lors de la sauvegarde'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setSuccess(''); setError('');
    save.mutate(fields);
  }

  function StatusBadge({ set }) {
    return set
      ? <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={11} /> Configuré</span>
      : <span className="flex items-center gap-1 text-xs text-gray-500"><Circle size={11} /> Non configuré</span>;
  }

  function Field({ label, fieldKey, placeholder }) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm text-gray-400">{label}</label>
          <StatusBadge set={configured[fieldKey]} />
        </div>
        <input
          type="password"
          className={inputCls}
          placeholder={configured[fieldKey] ? '••••••••••••  (laisser vide pour conserver)' : placeholder}
          value={fields[fieldKey]}
          onChange={e => setFields(f => ({ ...f, [fieldKey]: e.target.value }))}
          autoComplete="new-password"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-1">APIs Garantie constructeur</h2>
      <p className="text-xs text-gray-500 mb-5">
        Ces clés sont chiffrées en base et utilisées pour récupérer automatiquement les informations de garantie Dell, HP et Lenovo.
      </p>

      {success && <div className="mb-4 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">{success}</div>}
      {error && <div className="mb-4 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dell */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1">Dell</div>
          <Field label="Client ID" fieldKey="dell_client_id" placeholder="Client ID Dell" />
          <Field label="Client Secret" fieldKey="dell_client_secret" placeholder="Client Secret Dell" />
        </div>

        {/* HP */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1">HP</div>
          <Field label="API Key" fieldKey="hp_api_key" placeholder="API Key HP" />
          <Field label="API Secret" fieldKey="hp_api_secret" placeholder="API Secret HP" />
        </div>

        {/* Lenovo */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1">Lenovo</div>
          <Field label="Client ID" fieldKey="lenovo_client_id" placeholder="Client ID Lenovo" />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={save.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {save.isPending ? 'Enregistrement...' : 'Enregistrer les clés'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SmtpConfig({ inputCls }) {
  const qc = useQueryClient();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [testMsg, setTestMsg] = useState('');

  const { data: smtp = {} } = useQuery({ queryKey: ['smtp-settings'], queryFn: getSmtpSettings });

  const [fields, setFields] = useState({ smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '' });

  const save = useMutation({
    mutationFn: saveSmtpSettings,
    onSuccess: () => { setSuccess('Configuration SMTP enregistrée.'); setError(''); qc.invalidateQueries({ queryKey: ['smtp-settings'] }); },
    onError: (err) => setError(err.response?.data?.error || 'Erreur'),
  });

  const test = useMutation({
    mutationFn: testSmtp,
    onSuccess: () => setTestMsg('✓ Connexion SMTP réussie'),
    onError: (err) => setTestMsg('✗ ' + (err.response?.data?.error || err.message)),
  });

  function handleSubmit(e) {
    e.preventDefault(); setSuccess(''); setError(''); setTestMsg('');
    save.mutate(fields);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-1">Configuration SMTP</h2>
      <p className="text-xs text-gray-500 mb-5">Serveur d'envoi d'emails pour les alertes d'expiration.</p>

      {success && <div className="mb-4 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg">{success}</div>}
      {error && <div className="mb-4 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}
      {testMsg && <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${testMsg.startsWith('✓') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{testMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Serveur SMTP {smtp.smtp_host && <span className="text-green-400 text-xs ml-1">✓ {smtp.smtp_host}</span>}</label>
            <input className={inputCls} placeholder="smtp.example.com" value={fields.smtp_host} onChange={e => setFields(f => ({ ...f, smtp_host: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Port {smtp.smtp_port && <span className="text-xs text-gray-500 ml-1">({smtp.smtp_port})</span>}</label>
            <input className={inputCls} placeholder="587" value={fields.smtp_port} onChange={e => setFields(f => ({ ...f, smtp_port: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Utilisateur {smtp.smtp_user && <span className="text-xs text-gray-500 ml-1">({smtp.smtp_user})</span>}</label>
            <input className={inputCls} placeholder="user@example.com" value={fields.smtp_user} onChange={e => setFields(f => ({ ...f, smtp_user: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Mot de passe {smtp.smtp_pass && <span className="text-green-400 text-xs ml-1">✓ configuré</span>}</label>
            <input type="password" className={inputCls} placeholder={smtp.smtp_pass ? '••••••••  (laisser vide pour conserver)' : 'Mot de passe'} value={fields.smtp_pass} onChange={e => setFields(f => ({ ...f, smtp_pass: e.target.value }))} autoComplete="new-password" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-400 mb-1.5">Adresse expéditeur {smtp.smtp_from && <span className="text-xs text-gray-500 ml-1">({smtp.smtp_from})</span>}</label>
            <input className={inputCls} placeholder="itmanager@example.com" value={fields.smtp_from} onChange={e => setFields(f => ({ ...f, smtp_from: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => { setTestMsg(''); test.mutate(); }} disabled={test.isPending} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors disabled:opacity-50">
            <Send size={13} /> {test.isPending ? 'Test...' : 'Tester'}
          </button>
          <button type="submit" disabled={save.isPending} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {save.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TagManager({ inputCls }) {
  const qc = useQueryClient();
  const [newTag, setNewTag] = useState({ nom: '', couleur: '#6366f1' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: getTags });

  const create = useMutation({
    mutationFn: createTag,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setNewTag({ nom: '', couleur: '#6366f1' }); },
  });
  const upd = useMutation({
    mutationFn: ({ id, d }) => updateTag(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setEditId(null); },
  });
  const del = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">Gestion des tags</h2>

      <div className="space-y-2 mb-4">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2">
            {editId === tag.id ? (
              <>
                <input type="color" value={editData.couleur} onChange={e => setEditData(d => ({ ...d, couleur: e.target.value }))} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                <input className="flex-1 bg-transparent text-sm text-gray-200 outline-none border-b border-gray-600 pb-0.5" value={editData.nom} onChange={e => setEditData(d => ({ ...d, nom: e.target.value }))} />
                <button onClick={() => upd.mutate({ id: tag.id, d: editData })} className="text-xs text-blue-400 hover:text-blue-300">OK</button>
                <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
              </>
            ) : (
              <>
                <span style={{ backgroundColor: tag.couleur }} className="w-4 h-4 rounded-full flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-300">{tag.nom}</span>
                <button onClick={() => { setEditId(tag.id); setEditData({ nom: tag.nom, couleur: tag.couleur }); }} className="p-1 text-gray-500 hover:text-blue-400"><Pencil size={12} /></button>
                <button onClick={() => del.mutate(tag.id)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
              </>
            )}
          </div>
        ))}
        {tags.length === 0 && <p className="text-xs text-gray-500">Aucun tag créé.</p>}
      </div>

      <form onSubmit={e => { e.preventDefault(); if (newTag.nom) create.mutate(newTag); }} className="flex items-center gap-2">
        <input type="color" value={newTag.couleur} onChange={e => setNewTag(t => ({ ...t, couleur: e.target.value }))} className="w-8 h-8 rounded cursor-pointer bg-transparent flex-shrink-0" />
        <input className={inputCls + ' flex-1'} placeholder="Nom du tag" value={newTag.nom} onChange={e => setNewTag(t => ({ ...t, nom: e.target.value }))} />
        <button type="submit" disabled={!newTag.nom || create.isPending} className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex-shrink-0">
          <Plus size={14} /> Ajouter
        </button>
      </form>
    </div>
  );
}

function BackupSection() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-300 mb-1">Sauvegarde de la base de données</h2>
      <p className="text-xs text-gray-500 mb-4">Téléchargez une copie complète de la base de données SQLite.</p>
      <a
        href="/api/settings/backup"
        download
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors"
      >
        <Download size={14} /> Télécharger la sauvegarde
      </a>
    </div>
  );
}
