const BASE = process.env.REACT_APP_API_URL || '';

const req = async (method, path, body) => {
  const token = localStorage.getItem('hq_token');
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  auth: {
    register: (b) => req('POST', '/auth/register', b),
    login: (b) => req('POST', '/auth/login', b),
    me: () => req('GET', '/auth/me'),
  },
  habits: {
    list: () => req('GET', '/habits'),
    create: (b) => req('POST', '/habits', b),
    delete: (id) => req('DELETE', `/habits/${id}`),
    complete: (id) => req('POST', `/habits/${id}/complete`),
    uncomplete: (id) => req('DELETE', `/habits/${id}/complete`),
  },
  friends: {
    list: () => req('GET', '/friends'),
    all: (q) => req('GET', `/friends/all${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    pending: () => req('GET', '/friends/pending'),
    search: (q) => req('GET', `/friends/search?q=${encodeURIComponent(q)}`),
    request: (id) => req('POST', `/friends/request/${id}`),
    accept: (id) => req('POST', `/friends/accept/${id}`),
    remove: (id) => req('DELETE', `/friends/${id}`),
  },
  avatar: {
    shop: () => req('GET', '/avatar/shop'),
    buy: (id) => req('POST', `/avatar/shop/buy/${id}`),
    inventory: () => req('GET', '/avatar/inventory'),
    equip: (id) => req('POST', `/avatar/equip/${id}`),
    unequip: (slot) => req('DELETE', `/avatar/equip/${slot}`),
    saveAppearance: (b) => req('POST', '/avatar/appearance', b),
  }
};
