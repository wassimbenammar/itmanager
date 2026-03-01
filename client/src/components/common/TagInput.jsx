import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { getTags } from '../../api/tags';
import { getEquipementTags, addEquipementTag, removeEquipementTag } from '../../api/equipementExtras';
import { TagBadge } from './TagBadge';

export function TagInput({ equipementId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: allTags = [] } = useQuery({ queryKey: ['tags'], queryFn: getTags });
  const { data: currentTags = [] } = useQuery({
    queryKey: ['equipement-tags', equipementId],
    queryFn: () => getEquipementTags(equipementId),
  });

  const currentIds = new Set(currentTags.map(t => t.id));
  const available = allTags.filter(t => !currentIds.has(t.id));

  const add = useMutation({
    mutationFn: (tid) => addEquipementTag(equipementId, tid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipement-tags', equipementId] }),
  });

  const remove = useMutation({
    mutationFn: (tid) => removeEquipementTag(equipementId, tid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipement-tags', equipementId] }),
  });

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="flex items-center flex-wrap gap-1.5" ref={ref}>
      {currentTags.map(tag => (
        <TagBadge key={tag.id} tag={tag} onRemove={t => remove.mutate(t.id)} />
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-300 border border-dashed border-gray-700 hover:border-gray-500 rounded-full transition-colors"
        >
          <Plus size={10} /> Tag
        </button>
        {open && (
          <div className="absolute left-0 top-7 z-20 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-[140px] max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">Tous les tags utilisés</div>
            ) : available.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => { add.mutate(tag.id); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <span style={{ backgroundColor: tag.couleur }} className="w-2 h-2 rounded-full flex-shrink-0" />
                <span className="text-gray-200">{tag.nom}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
