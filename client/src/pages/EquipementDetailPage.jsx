import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, RefreshCw, AlertCircle, Copy } from 'lucide-react';
import { getEquipement, deleteEquipement } from '../api/equipements';
import { warrantyLookup, cloneEquipement } from '../api/equipementExtras';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { TagInput } from '../components/common/TagInput';
import { PhotoGallery } from '../components/equipements/PhotoGallery';
import { RemiseDialog } from '../components/equipements/RemiseDialog';
import { LifecycleTimeline } from '../components/equipements/LifecycleTimeline';
import { SoftwareList } from '../components/equipements/SoftwareList';
import { QRCodePrint } from '../components/equipements/QRCodePrint';
import { MaintenanceList } from '../components/equipements/MaintenanceList';
import { DocumentList } from '../components/equipements/DocumentList';

const TYPE_LABELS = { ordinateur: 'Ordinateur', serveur: 'Serveur', reseau: 'Réseau', mobile: 'Mobile', autre: 'Autre' };

const TABS = [
  { key: 'details', label: 'Détails' },
  { key: 'photos', label: 'Photos' },
  { key: 'logiciels', label: 'Logiciels' },
  { key: 'remises', label: 'Remises' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'documents', label: 'Documents' },
  { key: 'lifecycle', label: 'Cycle de vie' },
];

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-sm text-gray-100">{value || '—'}</dd>
    </div>
  );
}

function WarrantySection({ eq }) {
  const qc = useQueryClient();
  const id = String(eq.id);
  const [msg, setMsg] = useState(null);

  const lookup = useMutation({
    mutationFn: () => warrantyLookup(eq.id),
    onSuccess: (data) => {
      if (data.unsupported || data.manual) {
        setMsg(data.message);
      } else {
        setMsg(null);
        qc.invalidateQueries({ queryKey: ['equipement', id] });
      }
    },
    onError: (err) => setMsg(err.response?.data?.error || err.message),
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Garantie</h3>
        {eq.fabricant && eq.numero_serie && (
          <button
            onClick={() => lookup.mutate()}
            disabled={lookup.isPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={lookup.isPending ? 'animate-spin' : ''} />
            Récupérer garantie
          </button>
        )}
      </div>

      {msg && (
        <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
          {msg}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Field label="Fournisseur garantie" value={eq.garantie_fournisseur} />
        <Field label="Bon de commande" value={eq.numero_bon_commande} />
        <Field label="Début garantie" value={eq.date_garantie_debut} />
        <Field label="Fin garantie" value={eq.date_garantie_fin} />
        <Field label="Fin de vie" value={eq.date_fin_vie} />
      </dl>
    </div>
  );
}

export default function EquipementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');
  const [showDelete, setShowDelete] = useState(false);

  const { data: eq, isLoading } = useQuery({
    queryKey: ['equipement', id],
    queryFn: () => getEquipement(id),
  });

  const del = useMutation({
    mutationFn: () => deleteEquipement(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipements'] }); navigate('/equipements'); },
  });

  const clone = useMutation({
    mutationFn: () => cloneEquipement(id),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['equipements'] }); navigate(`/equipements/${data.id}`); },
  });

  if (isLoading) return <div className="text-gray-400">Chargement...</div>;
  if (!eq) return <div className="text-red-400">Équipement introuvable</div>;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{eq.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge value={eq.statut} />
              <span className="text-sm text-gray-500">{TYPE_LABELS[eq.type] || eq.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => clone.mutate()} disabled={clone.isPending} title="Dupliquer" className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
            <Copy size={16} />
          </button>
          <Link to={`/equipements/${id}/modifier`} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
            <Pencil size={14} /> Modifier
          </Link>
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Tags:</span>
        <TagInput equipementId={+id} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'details' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Fabricant" value={eq.fabricant} />
              <Field label="Modèle" value={eq.modele} />
              <Field label="Numéro de série" value={eq.numero_serie} />
              <Field label="Date d'achat" value={eq.date_achat} />
              <Field label="Localisation" value={eq.localisation} />
              <Field label="Utilisateur" value={eq.utilisateur_nom ? `${eq.utilisateur_nom}${eq.utilisateur_email ? ' (' + eq.utilisateur_email + ')' : ''}` : null} />
              {eq.hostname && <Field label="Hostname" value={eq.hostname} />}
              {eq.adresse_ip && <Field label="Adresse IP" value={eq.adresse_ip} />}
              {eq.adresse_mac && <Field label="Adresse MAC" value={eq.adresse_mac} />}
              {eq.prix_achat && <Field label="Prix d'achat" value={`${eq.prix_achat} €`} />}
              {eq.prix_achat && eq.duree_amortissement_ans && eq.date_achat && (() => {
                const ageAns = (new Date() - new Date(eq.date_achat)) / (365.25 * 86400000);
                const valeur = Math.max(0, eq.prix_achat * (1 - ageAns / eq.duree_amortissement_ans));
                return <Field label="Valeur résiduelle" value={`${valeur.toFixed(2)} €`} />;
              })()}
              {eq.notes && <div className="col-span-2"><Field label="Notes" value={eq.notes} /></div>}
            </dl>
          </div>

          <WarrantySection eq={eq} />

          <div className="flex justify-center">
            <QRCodePrint equipement={eq} />
          </div>

          <div className="text-xs text-gray-600">
            Créé le {new Date(eq.created_at).toLocaleDateString('fr-FR')} · Modifié le {new Date(eq.updated_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )}

      {tab === 'photos' && <PhotoGallery equipementId={+id} />}
      {tab === 'logiciels' && <SoftwareList equipementId={+id} />}
      {tab === 'remises' && <RemiseDialog equipementId={+id} />}
      {tab === 'maintenance' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <MaintenanceList equipementId={+id} />
        </div>
      )}
      {tab === 'documents' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <DocumentList equipementId={+id} />
        </div>
      )}
      {tab === 'lifecycle' && <LifecycleTimeline equipementId={+id} />}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => del.mutate()}
        loading={del.isPending}
        title="Supprimer l'équipement"
        message={`Supprimer "${eq.nom}" ? Cette action est irréversible.`}
      />
    </div>
  );
}
