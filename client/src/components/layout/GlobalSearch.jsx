import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Monitor, Package, Globe, Users } from 'lucide-react';
import { getSearch } from '../../api/search';

const SECTIONS = [
  { key: 'equipements', label: 'Équipements', icon: Monitor, route: (r) => `/equipements/${r.id}` },
  { key: 'logiciels', label: 'Licences', icon: Package, route: (r) => `/logiciels/${r.id}` },
  { key: 'utilisateurs', label: 'Utilisateurs', icon: Users, route: (r) => `/utilisateurs/${r.id}` },
  { key: 'comptes', label: 'Comptes', icon: Globe, route: (r) => `/comptes/${r.id}` },
];

function resultLabel(section, r) {
  if (section === 'equipements') return `${r.nom}${r.numero_serie ? ' · ' + r.numero_serie : ''}`;
  if (section === 'utilisateurs') return `${r.prenom} ${r.nom} · ${r.email}`;
  if (section === 'logiciels') return `${r.nom}${r.fournisseur ? ' · ' + r.fournisseur : ''}`;
  if (section === 'comptes') return `${r.nom_service} · ${r.identifiant}`;
  return r.nom || String(r.id);
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await getSearch(query);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 300);
    return () => clearTimeout(timerRef.current);
  }, [q, search]);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') { setOpen(false); setQ(''); } }
    function handleClick(e) { if (!containerRef.current?.contains(e.target)) setOpen(false); }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => { document.removeEventListener('keydown', handleKey); document.removeEventListener('mousedown', handleClick); };
  }, []);

  const hasResults = results && SECTIONS.some(s => results[s.key]?.length > 0);

  function handleSelect(section, result) {
    const route = SECTIONS.find(s => s.key === section)?.route(result);
    if (route) navigate(route);
    setOpen(false);
    setQ('');
    setResults(null);
  }

  return (
    <div ref={containerRef} className="relative px-2 mb-3">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {open && q.length >= 2 && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {loading && <div className="px-3 py-2 text-xs text-gray-500">Recherche...</div>}
          {!loading && !hasResults && results && (
            <div className="px-3 py-2 text-xs text-gray-500">Aucun résultat</div>
          )}
          {!loading && hasResults && (
            <div className="max-h-80 overflow-y-auto">
              {SECTIONS.map(({ key, label, icon: Icon }) => {
                const items = results[key] || [];
                if (!items.length) return null;
                return (
                  <div key={key}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-900/80 flex items-center gap-1.5">
                      <Icon size={11} /> {label}
                    </div>
                    {items.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(key, r)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors truncate"
                      >
                        {resultLabel(key, r)}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
