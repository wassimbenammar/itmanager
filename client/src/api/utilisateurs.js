import api from './client';

export const getUtilisateurs = (params) => api.get('/utilisateurs', { params }).then((r) => r.data);
export const getUtilisateur = (id) => api.get(`/utilisateurs/${id}`).then((r) => r.data);
export const createUtilisateur = (data) => api.post('/utilisateurs', data).then((r) => r.data);
export const updateUtilisateur = (id, data) => api.put(`/utilisateurs/${id}`, data).then((r) => r.data);
export const deleteUtilisateur = (id) => api.delete(`/utilisateurs/${id}`).then((r) => r.data);
export const getUtilisateurEquipements = (id) => api.get(`/utilisateurs/${id}/equipements`).then((r) => r.data);
export const getUtilisateurLicences = (id) => api.get(`/utilisateurs/${id}/licences`).then((r) => r.data);
export const getUtilisateurComptes = (id) => api.get(`/utilisateurs/${id}/comptes`).then((r) => r.data);
