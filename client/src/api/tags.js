import api from './client';

export const getTags = () => api.get('/tags').then(r => r.data);
export const createTag = (d) => api.post('/tags', d).then(r => r.data);
export const updateTag = (id, d) => api.put(`/tags/${id}`, d).then(r => r.data);
export const deleteTag = (id) => api.delete(`/tags/${id}`).then(r => r.data);
