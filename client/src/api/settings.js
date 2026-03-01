import api from './client';

export function getWarrantySettings() {
  return api.get('/settings/warranty').then(r => r.data);
}

export function saveWarrantySettings(data) {
  return api.post('/settings/warranty', data).then(r => r.data);
}

export const getSmtpSettings = () => api.get('/settings/smtp').then(r => r.data);
export const saveSmtpSettings = (d) => api.post('/settings/smtp', d).then(r => r.data);
export const testSmtp = () => api.post('/settings/smtp/test').then(r => r.data);
