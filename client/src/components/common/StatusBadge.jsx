import { clsx } from 'clsx';

const STATUT_CONFIG = {
  // Équipements
  actif: { label: 'Actif', cls: 'bg-green-500/20 text-green-400' },
  hors_service: { label: 'Hors service', cls: 'bg-red-500/20 text-red-400' },
  maintenance: { label: 'Maintenance', cls: 'bg-yellow-500/20 text-yellow-400' },
  stock: { label: 'Stock', cls: 'bg-gray-500/20 text-gray-400' },
  // Comptes
  1: { label: 'Actif', cls: 'bg-green-500/20 text-green-400' },
  0: { label: 'Inactif', cls: 'bg-gray-500/20 text-gray-400' },
  // Licences
  perpetuelle: { label: 'Perpétuelle', cls: 'bg-blue-500/20 text-blue-400' },
  abonnement: { label: 'Abonnement', cls: 'bg-purple-500/20 text-purple-400' },
  volume: { label: 'Volume', cls: 'bg-cyan-500/20 text-cyan-400' },
  oem: { label: 'OEM', cls: 'bg-orange-500/20 text-orange-400' },
  // Rôles
  admin: { label: 'Admin', cls: 'bg-red-500/20 text-red-400' },
  it_staff: { label: 'IT Staff', cls: 'bg-blue-500/20 text-blue-400' },
  viewer: { label: 'Lecteur', cls: 'bg-gray-500/20 text-gray-400' },
};

export function StatusBadge({ value, label }) {
  const config = STATUT_CONFIG[value] || { label: label || String(value), cls: 'bg-gray-500/20 text-gray-400' };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', config.cls)}>
      {config.label}
    </span>
  );
}
