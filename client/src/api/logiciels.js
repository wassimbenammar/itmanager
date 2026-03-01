import api from './client';

export const getLogiciels = (params) => api.get('/logiciels', { params }).then((r) => r.data);
export const getLogiciel = (id) => api.get(`/logiciels/${id}`).then((r) => r.data);
export const createLogiciel = (data) => api.post('/logiciels', data).then((r) => r.data);
export const updateLogiciel = (id, data) => api.put(`/logiciels/${id}`, data).then((r) => r.data);
export const deleteLogiciel = (id) => api.delete(`/logiciels/${id}`).then((r) => r.data);
export const getAttributions = (id) => api.get(`/logiciels/${id}/attributions`).then((r) => r.data);
export const addAttribution = (id, data) => api.post(`/logiciels/${id}/attributions`, data).then((r) => r.data);
export const removeAttribution = (id, userId) => api.delete(`/logiciels/${id}/attributions/${userId}`).then((r) => r.data);
