import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { Monitor, Package, Globe, AlertTriangle } from 'lucide-react';
import { getDashboard } from '../api/dashboard';
import { getNotifications } from '../api/notifications';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const TYPE_LABELS = {
  ordinateur: 'PC', serveur: 'Serveur', reseau: 'Réseau',
  mobile: 'Mobile', autre: 'Autre'
};
const STATUT_LABELS = {
  actif: 'Actif', hors_service: 'HS', maintenance: 'Maint.', stock: 'Stock'
};
const SERVICE_LABELS = {
  microsoft365: 'M365', sharepoint: 'SharePoint', saas: 'SaaS',
  portail: 'Portail', autre: 'Autre'
};

const TOOLTIP_STYLE = { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f3f4f6' };
const TICK_STYLE = { fill: '#9ca3af', fontSize: 11 };

function KpiCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 sm:p-2.5 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { data: dash, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const { data: notifs } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });

  if (isLoading) return <div className="text-gray-400 animate-pulse">Chargement...</div>;

  const { kpis, charts } = dash || {};

  const equipParType = (charts?.equipementsParType || []).map(r => ({
    name: TYPE_LABELS[r.type] || r.type, count: r.count
  }));
  const equipParStatut = (charts?.equipementsParStatut || []).map(r => ({
    name: STATUT_LABELS[r.statut] || r.statut, value: r.count
  }));
  const licStatut = charts?.licencesParStatut || [];
  const compParService = (charts?.comptesParService || []).map(r => ({
    name: SERVICE_LABELS[r.service] || r.service, count: r.count
  }));

  const alertes = notifs?.alertes || [];
  const errors = alertes.filter(a => a.severity === 'error');
  const warnings = alertes.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble du parc informatique</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={Monitor} label="Équipements" value={kpis?.totalEquipements} sub={`${kpis?.equipementsActifs} actifs`} color="blue" />
        <KpiCard icon={Package} label="Licences" value={kpis?.licencesTotal} sub={`${kpis?.licencesExpirees} expirée(s)`} color={kpis?.licencesExpirees > 0 ? 'red' : 'green'} />
        <KpiCard icon={Globe} label="Comptes actifs" value={kpis?.comptesActifs} sub={`sur ${kpis?.comptesTotal} total`} color="green" />
        <KpiCard icon={AlertTriangle} label="Alertes" value={notifs?.count ?? 0} sub={`${errors.length} critique(s)`} color={errors.length > 0 ? 'red' : warnings.length > 0 ? 'yellow' : 'blue'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Équipements par type">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={equipParType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Équipements" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Statuts des équipements">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={equipParStatut} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {equipParStatut.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Licences : actives vs expirées">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={licStatut} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Licences">
                {licStatut.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'Actives' ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Comptes externes par service">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={compParService} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={TICK_STYLE} />
              <YAxis tick={TICK_STYLE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Comptes" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Alertes actives ({alertes.length})
          </h3>
          <div className="space-y-2">
            {alertes.slice(0, 10).map((a, i) => (
              <Link
                key={i}
                to={`/${a.entite === 'logiciel' ? 'logiciels' : a.entite === 'equipement' ? 'equipements' : 'comptes'}/${a.id}`}
                className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === 'error' ? 'bg-red-500' : a.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                <span className="text-sm text-gray-300">{a.message}</span>
              </Link>
            ))}
            {alertes.length > 10 && (
              <p className="text-xs text-gray-500 px-3">+ {alertes.length - 10} autre(s) alerte(s)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
