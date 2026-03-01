import api from './client';

export const getComptes = (params) => api.get('/comptes', { params }).then((r) => r.data);
export const getCompte = (id) => api.get(`/comptes/${id}`).then((r) => r.data);
export const createCompte = (data) => api.post('/comptes', data).then((r) => r.data);
export const updateCompte = (id, data) => api.put(`/comptes/${id}`, data).then((r) => r.data);
export const deleteCompte = (id) => api.delete(`/comptes/${id}`).then((r) => r.data);
