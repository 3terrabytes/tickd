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
    changeUsername: (b) => req('PATCH', '/auth/username', b),
    changePassword: (b) => req('PATCH', '/auth/password', b),
    warningSeen: () => req('PATCH', '/auth/warning-seen'),
  },
  admin: {
    listUsers: () => req('GET', '/admin/users'),
    getUser: (id) => req('GET', `/admin/users/${id}`),
    getInventory: (id) => req('GET', `/admin/users/${id}/inventory`),
    updateUser: (id, b) => req('PATCH', `/admin/users/${id}`, b),
    grantItem: (id, itemId) => req('POST', `/admin/users/${id}/items/${itemId}`),
    removeItem: (id, itemId) => req('DELETE', `/admin/users/${id}/items/${itemId}`),
    equip: (id, itemId) => req('POST', `/admin/users/${id}/equip/${itemId}`),
    unequip: (id, slot) => req('DELETE', `/admin/users/${id}/equip/${slot}`),
    suspend: (id, b) => req('POST', `/admin/users/${id}/suspend`, b),
    unsuspend: (id) => req('POST', `/admin/users/${id}/unsuspend`),
    setAdmin: (id, is_admin) => req('POST', `/admin/users/${id}/admin`, { is_admin }),
    listSuggestions: () => req('GET', '/admin/suggestions'),
    updateSuggestion: (id, status) => req('PATCH', `/admin/suggestions/${id}`, { status }),
    deleteSuggestion: (id) => req('DELETE', `/admin/suggestions/${id}`),
    items: () => req('GET', '/admin/items'),
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
    search: (q) => req('GET', `/friends/all?q=${encodeURIComponent(q)}`),
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
    use: (id) => req('POST', `/avatar/use/${id}`),
    saveAppearance: (b) => req('POST', '/avatar/appearance', b),
  },
  gifts: {
    send: (b) => req('POST', '/gifts/send', b),
    history: () => req('GET', '/gifts/history'),
    tradePropose: (b) => req('POST', '/gifts/trade/propose', b),
    tradePending: () => req('GET', '/gifts/trade/pending'),
    tradeAccept: (id) => req('POST', `/gifts/trade/accept/${id}`),
    tradeDecline: (id) => req('POST', `/gifts/trade/decline/${id}`),
  },
  suggestions: {
    list: () => req('GET', '/suggestions'),
    submit: (b) => req('POST', '/suggestions', b),
    vote: (id) => req('POST', `/suggestions/${id}/vote`),
    unvote: (id) => req('DELETE', `/suggestions/${id}/vote`),
  },
  settings: {
    get: () => req('GET', '/settings'),
    save: (b) => req('POST', '/settings', b),
  },
  profile: {
    get: (username) => req('GET', `/profile/${username}`),
    inventory: (username) => req('GET', `/profile/${username}/inventory`),
  },
  achievements: {
    list: () => req('GET', '/achievements'),
    check: () => req('POST', '/achievements/check'),
  },
  stats: {
    get: () => req('GET', '/stats'),
  },
};
