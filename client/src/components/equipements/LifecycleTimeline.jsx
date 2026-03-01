import { useQuery } from '@tanstack/react-query';
import { getLifecycle } from '../../api/equipementExtras';

const STATUT_STYLES = {
  actif: 'bg-green-500 text-green-100',
  maintenance: 'bg-yellow-500 text-yellow-100',
  hors_service: 'bg-red-500 text-red-100',
  stock: 'bg-gray-500 text-gray-100',
};

const STATUT_DOT = {
  actif: 'bg-green-500',
  maintenance: 'bg-yellow-500',
  hors_service: 'bg-red-500',
  stock: 'bg-gray-500',
};

const STATUT_LABELS = {
  actif: 'Actif',
  maintenance: 'Maintenance',
  hors_service: 'Hors service',
  stock: 'Stock',
};

export function LifecycleTimeline({ equipementId }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['equipement-lifecycle', equipementId],
    queryFn: () => getLifecycle(equipementId),
  });

  if (isLoading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  if (events.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-8">Aucun événement de cycle de vie</div>;
  }

  return (
    <div className="relative">
      {/* vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-700" />

      <div className="space-y-6">
        {events.map((event, idx) => (
          <div key={event.id} className="relative flex gap-4 pl-10">
            {/* dot */}
            <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-gray-900 ${STATUT_DOT[event.statut_apres] || 'bg-gray-500'}`} />

            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 flex-wrap">
                {event.statut_avant ? (
                  <>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUT_STYLES[event.statut_avant] || 'bg-gray-600 text-gray-200'}`}>
                      {STATUT_LABELS[event.statut_avant] || event.statut_avant}
                    </span>
                    <span className="text-gray-600 text-xs">→</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-600">Création →</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUT_STYLES[event.statut_apres] || 'bg-gray-600 text-gray-200'}`}>
                  {STATUT_LABELS[event.statut_apres] || event.statut_apres}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <span>{new Date(event.created_at).toLocaleString('fr-FR')}</span>
                {event.utilisateur_nom && <span>· {event.utilisateur_nom}</span>}
              </div>
              {event.notes && <div className="mt-1 text-xs text-gray-400">{event.notes}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
