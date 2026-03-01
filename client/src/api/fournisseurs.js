import api from './client';

export const getFournisseurs = (p) => api.get('/fournisseurs', { params: p }).then(r => r.data);
export const getFournisseur = (id) => api.get(`/fournisseurs/${id}`).then(r => r.data);
export const createFournisseur = (d) => api.post('/fournisseurs', d).then(r => r.data);
export const updateFournisseur = (id, d) => api.put(`/fournisseurs/${id}`, d).then(r => r.data);
export const deleteFournisseur = (id) => api.delete(`/fournisseurs/${id}`).then(r => r.data);
