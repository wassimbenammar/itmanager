import { useQuery } from '@tanstack/react-query';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { getInventoryReport, getWarrantyReport, getLicensesReport, getMaintenancesReport, csvUrl } from '../api/reports';
import { StatusBadge } from '../components/common/StatusBadge';

const today = new Date().toISOString().split('T')[0];

function Section({ title, description, queryKey, queryFn, csvType, columns, renderRow, children }) {
  const { data = [], isLoading, refetch } = useQuery({ queryKey, queryFn });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors" title="Actualiser">
            <RefreshCw size={14} />
          </button>
          <a href={csvUrl(csvType)} download className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors">
            <Download size={12} /> CSV
          </a>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg transition-colors">
            <Printer size={12} /> Imprimer
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Chargement...</div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">Aucune donnée</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {columns.map(c => (
                  <th key={c} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.map((row, i) => renderRow(row, i))}
            </tbody>
          </table>
        </div>
      )}
      {children}
    </div>
  );
}

function Td({ children, mono }) {
  return <td className={`px-4 py-2.5 text-sm ${mono ? 'font-mono text-xs' : ''} text-gray-400 whitespace-nowrap`}>{children || '—'}</td>;
}

function warrantyBadge(date) {
  if (!date) return <span className="text-gray-600">—</span>;
  const diff = (new Date(date) - new Date()) / 86400000;
  if (diff < 0) return <span className="text-red-400 text-xs">Expirée ({date})</span>;
  if (diff < 90) return <span className="text-yellow-400 text-xs">≤ 90j ({date})</span>;
  return <span className="text-green-400 text-xs">{date}</span>;
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Rapports</h1>
        <p className="text-gray-500 text-sm mt-1">Exportez et analysez les données du parc</p>
      </div>

      {/* Inventory */}
      <Section
        title="Inventaire complet"
        description="Tous les équipements avec leurs informations"
        queryKey={['report-inventory']}
        queryFn={getInventoryReport}
        csvType="inventory"
        columns={['Nom', 'Type', 'Fabricant', 'Modèle', 'Série', 'Statut', 'Utilisateur', 'Localisation', 'Prix achat']}
        renderRow={(row, i) => (
          <tr key={i} className="hover:bg-gray-800/30">
            <Td>{row.nom}</Td>
            <Td>{row.type}</Td>
            <Td>{row.fabricant}</Td>
            <Td>{row.modele}</Td>
            <td className="px-4 py-2.5 text-xs font-mono text-gray-500 whitespace-nowrap">{row.numero_serie || '—'}</td>
            <td className="px-4 py-2.5 whitespace-nowrap"><StatusBadge value={row.statut} /></td>
            <Td>{row.utilisateur_nom}</Td>
            <Td>{row.localisation}</Td>
            <Td>{row.prix_achat ? `${row.prix_achat} €` : null}</Td>
          </tr>
        )}
      />

      {/* Warranty */}
      <Section
        title="Garanties"
        description="Équipements avec dates de garantie"
        queryKey={['report-warranty']}
        queryFn={getWarrantyReport}
        csvType="warranty"
        columns={['Équipement', 'Fabricant', 'Série', 'Statut', 'Garantie début', 'Garantie fin', 'Fournisseur', 'Utilisateur']}
        renderRow={(row, i) => (
          <tr key={i} className="hover:bg-gray-800/30">
            <Td>{row.nom}</Td>
            <Td>{row.fabricant}</Td>
            <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{row.numero_serie || '—'}</td>
            <td className="px-4 py-2.5"><StatusBadge value={row.statut} /></td>
            <Td>{row.date_garantie_debut}</Td>
            <td className="px-4 py-2.5">{warrantyBadge(row.date_garantie_fin)}</td>
            <Td>{row.garantie_fournisseur}</Td>
            <Td>{row.utilisateur_nom}</Td>
          </tr>
        )}
      />

      {/* Licenses */}
      <Section
        title="Conformité licences"
        description="Utilisation des licences par rapport aux droits achetés"
        queryKey={['report-licences']}
        queryFn={getLicensesReport}
        csvType="licences"
        columns={['Logiciel', 'Fournisseur', 'Type', 'Licences achetées', 'Attribuées', 'Disponibles', 'Expiration', 'État']}
        renderRow={(row, i) => {
          const pct = row.nombre_licences > 0 ? Math.round((row.licences_attribuees / row.nombre_licences) * 100) : 0;
          const overused = row.licences_attribuees > row.nombre_licences;
          return (
            <tr key={i} className="hover:bg-gray-800/30">
              <Td>{row.nom}</Td>
              <Td>{row.fournisseur}</Td>
              <Td>{row.type_licence}</Td>
              <td className="px-4 py-2.5 text-sm text-gray-400 text-center">{row.nombre_licences}</td>
              <td className={`px-4 py-2.5 text-sm text-center font-medium ${overused ? 'text-red-400' : 'text-gray-400'}`}>{row.licences_attribuees}</td>
              <td className={`px-4 py-2.5 text-sm text-center ${row.licences_disponibles < 0 ? 'text-red-400' : row.licences_disponibles === 0 ? 'text-yellow-400' : 'text-green-400'}`}>{row.licences_disponibles}</td>
              <td className="px-4 py-2.5">{warrantyBadge(row.date_expiration)}</td>
              <td className="px-4 py-2.5">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${row.etat === 'expiré' ? 'bg-red-500/10 text-red-400' : row.etat === 'expire_bientot' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                  {row.etat}
                </span>
              </td>
            </tr>
          );
        }}
      />

      {/* Maintenances */}
      <Section
        title="Maintenances"
        description="Historique et planification des interventions"
        queryKey={['report-maintenances']}
        queryFn={getMaintenancesReport}
        csvType="maintenances"
        columns={['Équipement', 'Titre', 'Type', 'Statut', 'Planifiée', 'Réalisée', 'Coût', 'Prestataire']}
        renderRow={(row, i) => (
          <tr key={i} className="hover:bg-gray-800/30">
            <Td>{row.equipement_nom}</Td>
            <Td>{row.titre}</Td>
            <Td>{row.type}</Td>
            <Td>{row.statut}</Td>
            <Td>{row.date_planifiee}</Td>
            <Td>{row.date_realisee}</Td>
            <Td>{row.cout ? `${row.cout} €` : null}</Td>
            <Td>{row.prestataire}</Td>
          </tr>
        )}
      />
    </div>
  );
}
