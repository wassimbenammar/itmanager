import api from './client';

export const getAudit = (params) => api.get('/audit', { params }).then((r) => r.data);
