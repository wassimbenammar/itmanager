import api from './client';

// Photos
export const getPhotos = (id) => api.get(`/equipements/${id}/photos`).then(r => r.data);
export const getPhoto = (id, pid) => api.get(`/equipements/${id}/photos/${pid}`).then(r => r.data);
export const addPhoto = (id, data, nom) => api.post(`/equipements/${id}/photos`, { data, nom }).then(r => r.data);
export const deletePhoto = (id, pid) => api.delete(`/equipements/${id}/photos/${pid}`).then(r => r.data);

// Remises
export const getRemises = (id) => api.get(`/equipements/${id}/remises`).then(r => r.data);
export const addRemise = (id, payload) => api.post(`/equipements/${id}/remises`, payload).then(r => r.data);

// Logiciels liés
export const getEquipementLogiciels = (id) => api.get(`/equipements/${id}/logiciels`).then(r => r.data);
export const addEquipementLogiciel = (id, payload) => api.post(`/equipements/${id}/logiciels`, payload).then(r => r.data);
export const removeEquipementLogiciel = (id, lid) => api.delete(`/equipements/${id}/logiciels/${lid}`).then(r => r.data);

// Lifecycle
export const getLifecycle = (id) => api.get(`/equipements/${id}/lifecycle`).then(r => r.data);

// Warranty
export const warrantyLookup = (id) => api.post(`/equipements/${id}/warranty/lookup`).then(r => r.data);

// Documents
export const getEquipementDocuments = (id) => api.get(`/equipements/${id}/documents`).then(r => r.data);
export const addEquipementDocument = (id, d) => api.post(`/equipements/${id}/documents`, d).then(r => r.data);
export const getEquipementDocument = (id, did) => api.get(`/equipements/${id}/documents/${did}`).then(r => r.data);
export const deleteEquipementDocument = (id, did) => api.delete(`/equipements/${id}/documents/${did}`).then(r => r.data);

// Maintenances
export const getEquipementMaintenances = (id) => api.get(`/equipements/${id}/maintenances`).then(r => r.data);
export const addEquipementMaintenance = (id, d) => api.post(`/equipements/${id}/maintenances`, d).then(r => r.data);
export const updateEquipementMaintenance = (id, mid, d) => api.put(`/equipements/${id}/maintenances/${mid}`, d).then(r => r.data);
export const deleteEquipementMaintenance = (id, mid) => api.delete(`/equipements/${id}/maintenances/${mid}`).then(r => r.data);

// Tags
export const getEquipementTags = (id) => api.get(`/equipements/${id}/tags`).then(r => r.data);
export const addEquipementTag = (id, tid) => api.post(`/equipements/${id}/tags/${tid}`).then(r => r.data);
export const removeEquipementTag = (id, tid) => api.delete(`/equipements/${id}/tags/${tid}`).then(r => r.data);

// Clone
export const cloneEquipement = (id) => api.post(`/equipements/${id}/clone`).then(r => r.data);

// Bulk + CSV
export const bulkEquipements = (d) => api.post('/equipements/bulk', d).then(r => r.data);
