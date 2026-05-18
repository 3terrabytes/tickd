import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const EQUIP_SLOTS = ['weapon', 'armor', 'banner', 'badge', 'companion', 'title'];

const STATUS_COLORS = {
  open:     { bg: '#1e293b', fg: '#94a3b8' },
  planned:  { bg: '#1e3a8a', fg: '#93c5fd' },
  done:     { bg: '#064e3b', fg: '#6ee7b7' },
  rejected: { bg: '#7f1d1d', fg: '#fca5a5' },
};

export default function AdminPage() {
  const { user: me } = useAuth();
  const [section, setSection] = useState('users');

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 22, marginBottom: 4 }}>⚡ Master Panel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Signed in as {me?.username}</p>
      </div>

      <div style={{
        display: 'flex', background: 'var(--bg2)', borderRadius: 12, padding: 4,
        border: '1px solid var(--border)', gap: 2, marginBottom: 16,
      }}>
        {[
          { key: 'users',       label: '👥 Users' },
          { key: 'suggestions', label: '💡 Suggestions' },
        ].map(t => (
          <button key={t.key} onClick={() => setSection(t.key)} style={{
            flex: 1, padding: '9px 6px', border: 'none', borderRadius: 9, cursor: 'pointer',
            background: section === t.key ? 'var(--bg3)' : 'transparent',
            color: section === t.key ? 'var(--text)' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 500,
          }}>{t.label}</button>
        ))}
      </div>

      {section === 'users' && <UsersSection />}
      {section === 'suggestions' && <SuggestionsSection />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────────────────────

function UsersSection() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [editXp, setEditXp] = useState('');
  const [editGold, setEditGold] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | suspended | warn | admin
  const [itemFilter, setItemFilter] = useState('all');
  const [suspendOpen, setSuspendOpen] = useState(false);

  // Tick every 30s so suspension-banner countdowns + sidebar status chips
  // stay roughly fresh without hammering re-renders.
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    (async () => {
      try {
        const [u, i] = await Promise.all([api.admin.listUsers(), api.admin.items()]);
        setUsers(u);
        setItems(i);
      } catch (err) { showToast(err.message, 'error'); }
    })();
  }, []);

  const selectUser = async (user) => {
    setSelected(user);
    setEditXp(String(user.xp));
    setEditGold(String(user.gold));
    setEditLevel(String(user.level));
    try {
      const [inv, full] = await Promise.all([
        api.admin.getInventory(user.id),
        api.admin.getUser(user.id),
      ]);
      setInventory(inv.map(i => i.item_id));
      setEquipped(full.equipped || {});
    } catch {
      setInventory([]);
      setEquipped({});
    }
  };

  const refreshUser = async (id) => {
    const full = await api.admin.getUser(id);
    setSelected(full);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...full } : u));
    setEquipped(full.equipped || {});
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.updateUser(selected.id, {
        xp: parseInt(editXp), gold: parseInt(editGold), level: parseInt(editLevel),
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      setSelected(prev => ({ ...prev, ...updated }));
      showToast('Stats saved');
    } catch (err) { showToast(err.message, 'error'); }
    setSaving(false);
  };

  const grantItem = async (itemId) => {
    try {
      await api.admin.grantItem(selected.id, itemId);
      setInventory(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
      showToast('Granted');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const removeItem = async (itemId) => {
    try {
      await api.admin.removeItem(selected.id, itemId);
      setInventory(prev => prev.filter(i => i !== itemId));
      await refreshUser(selected.id);
      showToast('Removed');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const equipItem = async (itemId) => {
    try {
      await api.admin.equip(selected.id, itemId);
      await refreshUser(selected.id);
      showToast('Equipped');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const unequipSlot = async (slot) => {
    try {
      await api.admin.unequip(selected.id, slot);
      await refreshUser(selected.id);
      showToast('Unequipped');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const unsuspend = async () => {
    try {
      const updated = await api.admin.unsuspend(selected.id);
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      setSelected(prev => ({ ...prev, ...updated }));
      showToast('Suspension lifted');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const toggleAdmin = async () => {
    if (selected.id === me.id) return showToast("You can't change your own admin status", 'error');
    if (!window.confirm(`${selected.is_admin ? 'Remove' : 'Grant'} admin rights for ${selected.username}?`)) return;
    try {
      const updated = await api.admin.setAdmin(selected.id, !selected.is_admin);
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      setSelected(prev => ({ ...prev, ...updated }));
      showToast('Admin updated');
    } catch (err) { showToast(err.message, 'error'); }
  };

  // Resolve a user id (e.g. suspended_by) to a username from the in-memory list.
  const usernameById = (id) => users.find(u => u.id === id)?.username || `user#${id}`;

  // A user is "actively banned" if perm OR temp with an unexpired suspended_until.
  const isActivelyBanned = (u) => {
    if (u.suspension_type === 'perm') return true;
    if (u.suspension_type === 'temp' && u.suspended_until) {
      return new Date(u.suspended_until).getTime() > Date.now();
    }
    return false;
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch =
      u.username.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    if (!matchSearch) return false;
    switch (statusFilter) {
      case 'suspended': return isActivelyBanned(u);
      case 'warn':      return u.suspension_type === 'warn';
      case 'admin':     return !!u.is_admin;
      case 'active':    return !isActivelyBanned(u) && u.suspension_type !== 'warn';
      default:          return true;
    }
  });

  const STATUS_FILTERS = [
    { k: 'all',       label: 'All',       count: users.length },
    { k: 'active',    label: 'Active',    count: users.filter(u => !isActivelyBanned(u) && u.suspension_type !== 'warn').length },
    { k: 'suspended', label: '⛔ Banned', count: users.filter(isActivelyBanned).length },
    { k: 'warn',      label: '⚠️ Warned', count: users.filter(u => u.suspension_type === 'warn').length },
    { k: 'admin',     label: '⚡ Admins', count: users.filter(u => u.is_admin).length },
  ];

  const filteredItems = items.filter(i => itemFilter === 'all' || i.type === itemFilter);
  const itemTypes = useMemo(() => Array.from(new Set(items.map(i => i.type))), [items]);

  const s = {
    page: { display: 'flex', gap: 16, alignItems: 'flex-start' },
    sidebar: { width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 220px)' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 },
    card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 },
    input: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
    userRow: (active, suspended) => ({
      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
      background: active ? 'rgba(99,102,241,0.15)' : (suspended ? 'rgba(127,29,29,0.18)' : 'transparent'),
      border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
    }),
    label: { fontSize: 12, color: 'var(--text-muted)', width: 50, flexShrink: 0 },
  };

  return (
    <div>
      {toast && <Toast {...toast} />}

      {suspendOpen && selected && (
        <SuspendModal
          user={selected}
          onClose={() => setSuspendOpen(false)}
          onDone={(updated) => {
            setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setSelected(prev => ({ ...prev, ...updated }));
            setSuspendOpen(false);
            showToast('Suspension applied');
          }}
        />
      )}

      <div style={s.page}>
        <div style={s.sidebar}>
          <input style={s.input} placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {STATUS_FILTERS.map(f => {
              const active = statusFilter === f.k;
              return (
                <button key={f.k} onClick={() => setStatusFilter(f.k)} style={{
                  padding: '4px 10px', borderRadius: 99, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'rgba(99,102,241,0.18)' : 'var(--bg3)',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 500,
                }}>
                  {f.label} <span style={{ opacity: 0.6 }}>· {f.count}</span>
                </button>
              );
            })}
          </div>
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredUsers.map(u => {
              const susp = u.suspension_type === 'perm' || (u.suspension_type === 'temp' && u.suspended_until && new Date(u.suspended_until) > new Date());
              return (
                <div key={u.id} style={s.userRow(selected?.id === u.id, susp)} onClick={() => selectUser(u)}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {u.username}
                    {u.is_admin && <span style={{ marginLeft: 6, color: 'var(--gold)', fontSize: 10 }}>ADMIN</span>}
                    {susp && <span style={{ marginLeft: 6, color: '#fca5a5', fontSize: 10 }}>{u.suspension_type === 'perm' ? 'BANNED' : 'SUSPENDED'}</span>}
                    {u.suspension_type === 'warn' && <span style={{ marginLeft: 6, color: '#fbbf24', fontSize: 10 }}>WARN</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lv.{u.level} · {u.xp} XP · {u.gold}g</div>
                </div>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div style={s.main}>
            {/* Suspension banner */}
            {selected.suspension_type && (() => {
              const isWarn = selected.suspension_type === 'warn';
              const isTemp = selected.suspension_type === 'temp';
              const remainingMs = isTemp && selected.suspended_until
                ? new Date(selected.suspended_until).getTime() - Date.now()
                : 0;
              const expired = isTemp && remainingMs <= 0;
              return (
                <div style={{
                  ...s.card,
                  borderColor: isWarn ? '#f59e0b66' : '#ef444466',
                  background: isWarn ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isWarn ? '#fbbf24' : '#fca5a5' }}>
                        {isWarn && '⚠️ Active Warning'}
                        {isTemp && (expired
                          ? '⛔ Suspension expired (clears on next request)'
                          : `⛔ Suspended for ${formatDuration(Math.floor(remainingMs / 60000))}`
                        )}
                        {selected.suspension_type === 'perm' && '⛔ Permanently banned'}
                      </div>
                      {isTemp && !expired && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Unbans at {new Date(selected.suspended_until).toLocaleString()}
                        </div>
                      )}
                      {(selected.suspended_at || selected.suspended_by) && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Issued{selected.suspended_by ? ` by @${usernameById(selected.suspended_by)}` : ''}
                          {selected.suspended_at ? ` · ${new Date(selected.suspended_at).toLocaleString()}` : ''}
                        </div>
                      )}
                      {selected.suspension_reason && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, whiteSpace: 'pre-wrap' }}>
                          <span style={{ fontWeight: 600 }}>Reason: </span>{selected.suspension_reason}
                        </div>
                      )}
                    </div>
                    <button onClick={unsuspend} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Lift</button>
                  </div>
                </div>
              );
            })()}

            {/* Stats */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 14 }}>📊 {selected.username}</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSuspendOpen(true)} style={btnDanger}>Suspend</button>
                  <button onClick={toggleAdmin} style={btnGhost}>{selected.is_admin ? 'Remove admin' : 'Make admin'}</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                <Field label="XP"    value={editXp}    onChange={setEditXp} />
                <Field label="Gold"  value={editGold}  onChange={setEditGold} />
                <Field label="Level" value={editLevel} onChange={setEditLevel} />
              </div>
              <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}
                onClick={saveStats} disabled={saving}>
                {saving ? 'Saving...' : 'Save Stats'}
              </button>
            </div>

            {/* Equipped */}
            <div style={s.card}>
              <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 14, marginBottom: 12 }}>⚔️ Equipped</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {EQUIP_SLOTS.map(slot => {
                  const item = equipped[slot];
                  return (
                    <div key={slot} style={{ background: 'var(--bg3)', borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{slot}</div>
                      {item ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12 }}>{item.emoji} {item.name}</span>
                          <button onClick={() => unequipSlot(slot)} style={btnTiny}>×</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inventory & item catalog */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 14 }}>🎒 Inventory ({inventory.length})</h3>
                <select value={itemFilter} onChange={e => setItemFilter(e.target.value)}
                  style={{ ...s.input, width: 'auto', padding: '6px 10px' }}>
                  <option value="all">All types</option>
                  {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {filteredItems.map(item => {
                  const owned = inventory.includes(item.id);
                  const isEquipped = equipped[item.type]?.id === item.id;
                  return (
                    <div key={item.id} style={{
                      padding: '6px 8px', borderRadius: 8,
                      border: `1px solid ${isEquipped ? 'var(--gold)' : owned ? 'var(--accent)' : 'var(--border)'}`,
                      background: owned ? 'rgba(99,102,241,0.08)' : 'var(--bg3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                    }}>
                      <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.emoji} {item.name}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {owned && EQUIP_SLOTS.includes(item.type) && !isEquipped && (
                          <button onClick={() => equipItem(item.id)} style={{ ...btnTiny, color: 'var(--gold)' }} title="Equip">E</button>
                        )}
                        <button
                          onClick={() => owned ? removeItem(item.id) : grantItem(item.id)}
                          style={owned ? btnDangerTiny : btnAccentTiny}>
                          {owned ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, padding: 40 }}>
            Select a player to manage
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SUSPEND MODAL
// ──────────────────────────────────────────────────────────────────────────────

// Duration presets shown as quick-pick chips. Each is { label, minutes }.
const BAN_PRESETS = [
  { label: '1h',  minutes: 60 },
  { label: '6h',  minutes: 360 },
  { label: '24h', minutes: 1440 },
  { label: '3d',  minutes: 4320 },
  { label: '7d',  minutes: 10080 },
  { label: '30d', minutes: 43200 },
  { label: '90d', minutes: 129600 },
];

// Human-readable "Xd Yh Zm" formatter for the ban-until preview.
const formatDuration = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '—';
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = Math.floor(totalMinutes % 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '<1m';
};

function SuspendModal({ user, onClose, onDone }) {
  const [type, setType] = useState('warn');
  // Duration is stored in minutes internally — easier to pass to the API and
  // simpler to combine presets + custom input.
  const [minutes, setMinutes] = useState(10080); // default: 7 days
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState('hours'); // minutes | hours | days
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Apply a custom value as the user types — keeps the preview live.
  const applyCustom = (val, unit) => {
    setCustomValue(val);
    setCustomUnit(unit);
    const n = parseFloat(val);
    if (!n || n <= 0) return;
    const mul = unit === 'days' ? 1440 : unit === 'hours' ? 60 : 1;
    setMinutes(Math.round(n * mul));
  };

  const banUntil = type === 'temp' && minutes > 0
    ? new Date(Date.now() + minutes * 60 * 1000)
    : null;

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const payload = { type, reason };
      if (type === 'temp') payload.minutes = minutes;
      const updated = await api.admin.suspend(user.id, payload);
      onDone(updated);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
    }}>
      <div style={{ maxWidth: 440, width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
        <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 18, marginBottom: 14 }}>Suspend {user.username}</h3>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { v: 'warn', label: '⚠️ Warn',  desc: 'Banner, no block' },
              { v: 'temp', label: '⏳ Temp',  desc: 'Block for X days' },
              { v: 'perm', label: '⛔ Perm',  desc: 'Permanent ban' },
            ].map(o => (
              <button key={o.v} onClick={() => setType(o.v)} style={{
                padding: '10px 6px', borderRadius: 8, cursor: 'pointer', border: '1px solid',
                borderColor: type === o.v ? 'var(--accent)' : 'var(--border)',
                background: type === o.v ? 'rgba(99,102,241,0.15)' : 'var(--bg3)',
                color: 'var(--text)', fontSize: 12,
              }}>
                <div style={{ fontWeight: 600 }}>{o.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {type === 'temp' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Quick presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {BAN_PRESETS.map(p => {
                const active = minutes === p.minutes && !customValue;
                return (
                  <button key={p.label}
                    onClick={() => { setMinutes(p.minutes); setCustomValue(''); }}
                    style={{
                      padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                      border: '1px solid',
                      borderColor: active ? 'var(--accent)' : 'var(--border)',
                      background: active ? 'rgba(99,102,241,0.18)' : 'var(--bg3)',
                      color: 'var(--text)', fontSize: 12, fontWeight: 500,
                    }}>{p.label}</button>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Custom</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number" min="0" step="any"
                value={customValue}
                onChange={e => applyCustom(e.target.value, customUnit)}
                placeholder="e.g. 12"
                style={{
                  flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
              <select
                value={customUnit}
                onChange={e => applyCustom(customValue, e.target.value)}
                style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 13,
                }}
              >
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>

            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(127,29,29,0.18)', border: '1px solid #ef444433',
              fontSize: 12, color: '#fca5a5',
            }}>
              <div style={{ marginBottom: 2 }}>
                <strong>Duration:</strong> {formatDuration(minutes)}
              </div>
              {banUntil && (
                <div style={{ color: '#fecaca' }}>
                  <strong>Unbans:</strong> {banUntil.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Reason (shown to the user)</div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Why are you suspending this account?"
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        {err && <div style={{ color: '#fca5a5', fontSize: 12, marginBottom: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>Cancel</button>
          <button onClick={submit} disabled={busy} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: '#7f1d1d', borderColor: '#ef4444' }}>
            {busy ? 'Applying...' : 'Apply suspension'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SUGGESTIONS
// ──────────────────────────────────────────────────────────────────────────────

function SuggestionsSection() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    try { setList(await api.admin.listSuggestions()); }
    catch (err) { showToast(err.message, 'error'); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      const updated = await api.admin.updateSuggestion(id, status);
      setList(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    } catch (err) { showToast(err.message, 'error'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this suggestion?')) return;
    try {
      await api.admin.deleteSuggestion(id);
      setList(prev => prev.filter(s => s.id !== id));
      showToast('Deleted');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const filtered = list.filter(s => filter === 'all' || (s.status || 'open') === filter);

  return (
    <div>
      {toast && <Toast {...toast} />}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'open', 'planned', 'done', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === f ? 'var(--bg3)' : 'transparent',
            color: filter === f ? 'var(--text)' : 'var(--text-muted)',
            fontSize: 12, cursor: 'pointer',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No suggestions.</div>
        )}
        {filtered.map(s => {
          const status = s.status || 'open';
          const col = STATUS_COLORS[status];
          return (
            <div key={s.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    by {s.username || 'unknown'} · {s.votes} votes · {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ background: col.bg, color: col.fg, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  {status.toUpperCase()}
                </span>
              </div>
              {s.description && (
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 10, whiteSpace: 'pre-wrap' }}>{s.description}</div>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['open', 'planned', 'done', 'rejected'].map(st => (
                  <button key={st} onClick={() => setStatus(s.id, st)} disabled={status === st} style={{
                    padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
                    background: status === st ? 'var(--bg3)' : 'transparent',
                    color: status === st ? 'var(--text-muted)' : 'var(--text)',
                    fontSize: 11, cursor: status === st ? 'default' : 'pointer',
                  }}>{st}</button>
                ))}
                <button onClick={() => remove(s.id)} style={{ ...btnDangerTiny, padding: '5px 10px', fontSize: 11, marginLeft: 'auto' }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
      background: type === 'error' ? '#7f1d1d' : '#064e3b',
      border: `1px solid ${type === 'error' ? '#ef444455' : '#10b98155'}`,
      color: type === 'error' ? '#fca5a5' : '#6ee7b7',
      padding: '10px 20px', borderRadius: 10, fontWeight: 500, fontSize: 14,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>{msg}</div>
  );
}

const btnTiny     = { padding: '2px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: 'var(--bg2)', color: 'var(--text)' };
const btnAccentTiny = { ...btnTiny, background: 'rgba(99,102,241,0.3)', color: 'var(--accent2, #c7d2fe)' };
const btnDangerTiny = { ...btnTiny, background: '#7f1d1d', color: '#fca5a5' };
const btnGhost    = { padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 12, cursor: 'pointer' };
const btnDanger   = { padding: '6px 12px', borderRadius: 8, border: '1px solid #ef444455', background: '#7f1d1d', color: '#fca5a5', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
