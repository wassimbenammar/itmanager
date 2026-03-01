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
