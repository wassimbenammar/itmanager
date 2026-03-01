import api from './client';

export function getSearch(q) {
  return api.get('/search', { params: { q } }).then(r => r.data);
}
