import api from './client';

export const getEquipements = (params) => api.get('/equipements', { params }).then((r) => r.data);
export const getEquipement = (id) => api.get(`/equipements/${id}`).then((r) => r.data);
export const createEquipement = (data) => api.post('/equipements', data).then((r) => r.data);
export const updateEquipement = (id, data) => api.put(`/equipements/${id}`, data).then((r) => r.data);
export const deleteEquipement = (id) => api.delete(`/equipements/${id}`).then((r) => r.data);
