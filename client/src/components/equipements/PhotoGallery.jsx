import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPhotos, getPhoto, addPhoto, deletePhoto } from '../../api/equipementExtras';
import { Upload, Trash2, X, ImageOff } from 'lucide-react';

export function PhotoGallery({ equipementId }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['equipement-photos', equipementId],
    queryFn: () => getPhotos(equipementId),
  });

  const delMutation = useMutation({
    mutationFn: (pid) => deletePhoto(equipementId, pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipement-photos', equipementId] }),
  });

  async function openLightbox(photo) {
    const full = await getPhoto(equipementId, photo.id);
    setLightbox(full);
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const dataUrl = await readFileAsDataURL(file);
        await addPhoto(equipementId, dataUrl, file.name);
      }
      qc.invalidateQueries({ queryKey: ['equipement-photos', equipementId] });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (isLoading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Upload size={14} /> {uploading ? 'Upload...' : 'Ajouter des photos'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-600 gap-2">
          <ImageOff size={32} />
          <span className="text-sm">Aucune photo</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden bg-gray-800 border border-gray-700 aspect-video cursor-pointer" onClick={() => openLightbox(photo)}>
              <PhotoThumb photoId={photo.id} equipementId={equipementId} nom={photo.nom} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <button
                className="absolute top-1 right-1 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); delMutation.mutate(photo.id); }}
              >
                <Trash2 size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setLightbox(null)}>
            <X size={24} />
          </button>
          <img src={lightbox.data} alt={lightbox.nom || 'Photo'} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ photoId, equipementId, nom }) {
  const { data } = useQuery({
    queryKey: ['photo-full', photoId],
    queryFn: () => getPhoto(equipementId, photoId),
    staleTime: 300_000,
  });
  if (!data) return <div className="w-full h-full bg-gray-700 animate-pulse" />;
  return <img src={data.data} alt={nom || 'Photo'} className="w-full h-full object-cover" />;
}
