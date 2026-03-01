import api from './client';

export const getInventoryReport = () => api.get('/reports/inventory').then(r => r.data);
export const getWarrantyReport = () => api.get('/reports/warranty').then(r => r.data);
export const getLicensesReport = () => api.get('/reports/licences').then(r => r.data);
export const getMaintenancesReport = () => api.get('/reports/maintenances').then(r => r.data);

export function csvUrl(type) {
  return `/api/reports/${type}?format=csv`;
}
export function equipementsCsvUrl(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return `/api/equipements/export/csv${qs ? '?' + qs : ''}`;
}
