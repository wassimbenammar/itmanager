import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Download, FileText } from 'lucide-react';
import { getEquipementDocuments, addEquipementDocument, getEquipementDocument, deleteEquipementDocument } from '../../api/equipementExtras';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function mimeIcon(mime) {
  if (!mime) return '📄';
  if (mime.startsWith('image/')) return '🖼';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('word')) return '📘';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return '📗';
  return '📄';
}

export function DocumentList({ equipementId }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', equipementId],
    queryFn: () => getEquipementDocuments(equipementId),
  });

  const add = useMutation({
    mutationFn: (d) => addEquipementDocument(equipementId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', equipementId] }),
  });

  const del = useMutation({
    mutationFn: (did) => deleteEquipementDocument(equipementId, did),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', equipementId] }),
  });

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        add.mutate({
          nom: file.name,
          type_mime: file.type,
          data: ev.target.result,
          taille: file.size,
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }

  async function downloadDoc(doc) {
    const full = await getEquipementDocument(equipementId, doc.id);
    const a = document.createElement('a');
    a.href = full.data;
    a.download = full.nom;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Documents & Pièces jointes</h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={add.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Upload size={12} /> Joindre un fichier
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-6 text-sm">Chargement...</div>
      ) : docs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <FileText size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Aucun document joint</p>
          <p className="text-xs mt-1">Joignez des factures, manuels, certificats...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
              <span className="text-xl flex-shrink-0">{mimeIcon(doc.type_mime)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate">{doc.nom}</div>
                <div className="text-xs text-gray-500 flex gap-2">
                  {doc.taille && <span>{formatSize(doc.taille)}</span>}
                  <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => downloadDoc(doc)} className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors" title="Télécharger">
                  <Download size={14} />
                </button>
                <button onClick={() => del.mutate(doc.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
