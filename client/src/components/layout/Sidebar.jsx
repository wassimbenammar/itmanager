import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, Package, Globe, Users,
  ClipboardList, Settings, LogOut, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '../../api/notifications';
import { GlobalSearch } from './GlobalSearch';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/equipements', icon: Monitor, label: 'Équipements' },
  { to: '/logiciels', icon: Package, label: 'Licences' },
  { to: '/comptes', icon: Globe, label: 'Comptes externes' },
  { to: '/utilisateurs', icon: Users, label: 'Utilisateurs' },
  { to: '/audit', icon: ClipboardList, label: 'Audit' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
];

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60_000,
  });

  const alertCount = notifs?.count ?? 0;

  return (
    <aside className={clsx(
      'w-56 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-30 transition-transform duration-200',
      open ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0'
    )}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">IT</div>
          <span className="font-semibold text-gray-100 text-sm">ITManager</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <GlobalSearch />
        <div className="space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                )
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {to === '/' && alertCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 bg-blue-700 rounded-full flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
            {user?.prenom?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-200 truncate">{user?.prenom} {user?.nom}</div>
            <div className="text-xs text-gray-500 truncate">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
