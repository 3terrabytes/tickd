import { useState, useEffect } from 'react';
import { api } from '../api';

const ALL_ITEMS = [
  { id: 'sword_iron', name: 'Iron Sword', emoji: '🗡️', type: 'weapon' },
  { id: 'sword_silver', name: 'Silver Sword', emoji: '⚔️', type: 'weapon' },
  { id: 'sword_obsidian', name: 'Obsidian Sword', emoji: '🔪', type: 'weapon' },
  { id: 'staff_oak', name: 'Oak Staff', emoji: '🪄', type: 'weapon' },
  { id: 'staff_arcane', name: 'Arcane Staff', emoji: '✨', type: 'weapon' },
  { id: 'staff_void', name: 'Void Staff', emoji: '🌌', type: 'weapon' },
  { id: 'bow_hunters', name: "Hunter's Bow", emoji: '🏹', type: 'weapon' },
  { id: 'bow_elven', name: 'Elven Bow', emoji: '🎯', type: 'weapon' },
  { id: 'bow_storm', name: 'Storm Bow', emoji: '⚡', type: 'weapon' },
  { id: 'axe_battle', name: 'Battle Axe', emoji: '🪓', type: 'weapon' },
  { id: 'axe_rune', name: 'Runic Axe', emoji: '🔱', type: 'weapon' },
  { id: 'dagger_shadow', name: 'Shadow Dagger', emoji: '🌑', type: 'weapon' },
  { id: 'hammer_storm', name: 'Stormhammer', emoji: '🔨', type: 'weapon' },
  { id: 'scythe_death', name: "Death's Scythe", emoji: '💀', type: 'weapon' },
  { id: 'blade_soul', name: 'Soul Blade', emoji: '🌟', type: 'weapon' },
  { id: 'wand_chaos', name: 'Chaos Wand', emoji: '💫', type: 'weapon' },
  { id: 'lance_celestial', name: 'Celestial Lance', emoji: '☄️', type: 'weapon' },
  { id: 'armor_leather', name: 'Leather Armor', emoji: '🥋', type: 'armor' },
  { id: 'armor_chain', name: 'Chainmail', emoji: '🛡️', type: 'armor' },
  { id: 'armor_plate', name: 'Plate Armor', emoji: '⚙️', type: 'armor' },
  { id: 'robe_mage', name: 'Mage Robes', emoji: '👘', type: 'armor' },
  { id: 'robe_archmage', name: 'Archmage Robes', emoji: '🎭', type: 'armor' },
  { id: 'cloak_shadow', name: 'Shadow Cloak', emoji: '🌒', type: 'armor' },
  { id: 'armor_dragon', name: 'Dragonscale Mail', emoji: '🐉', type: 'armor' },
  { id: 'armor_celestial', name: 'Celestial Plate', emoji: '☀️', type: 'armor' },
  { id: 'armor_void', name: 'Void Shroud', emoji: '🌌', type: 'armor' },
  { id: 'hood_assassin', name: "Assassin's Hood", emoji: '🕶️', type: 'armor' },
  { id: 'cloak_phoenix', name: 'Phoenix Cloak', emoji: '🦅', type: 'armor' },
  { id: 'banner_red', name: 'Red Banner', emoji: '🚩', type: 'banner' },
  { id: 'banner_blue', name: 'Blue Banner', emoji: '🔵', type: 'banner' },
  { id: 'banner_green', name: 'Green Banner', emoji: '🟢', type: 'banner' },
  { id: 'banner_purple', name: 'Purple Banner', emoji: '🟣', type: 'banner' },
  { id: 'banner_gold', name: 'Gold Banner', emoji: '🌟', type: 'banner' },
  { id: 'banner_midnight', name: 'Midnight Banner', emoji: '🌙', type: 'banner' },
  { id: 'banner_galaxy', name: 'Galaxy Banner', emoji: '🌌', type: 'banner' },
  { id: 'banner_flame', name: 'Flame Banner', emoji: '🔥', type: 'banner' },
  { id: 'banner_storm', name: 'Storm Banner', emoji: '⛈️', type: 'banner' },
  { id: 'banner_aurora', name: 'Aurora Banner', emoji: '🌈', type: 'banner' },
  { id: 'banner_void', name: 'Void Banner', emoji: '🕳️', type: 'banner' },
  { id: 'badge_flame', name: 'Flame Badge', emoji: '🔥', type: 'badge' },
  { id: 'badge_star', name: 'Star Badge', emoji: '⭐', type: 'badge' },
  { id: 'badge_bolt', name: 'Bolt Badge', emoji: '⚡', type: 'badge' },
  { id: 'badge_leaf', name: 'Leaf Badge', emoji: '🍃', type: 'badge' },
  { id: 'badge_skull', name: 'Skull Badge', emoji: '💀', type: 'badge' },
  { id: 'badge_crown', name: 'Crown Badge', emoji: '👑', type: 'badge' },
  { id: 'badge_gem', name: 'Gem Badge', emoji: '💎', type: 'badge' },
  { id: 'badge_moon', name: 'Moon Badge', emoji: '🌙', type: 'badge' },
  { id: 'badge_dragon', name: 'Dragon Badge', emoji: '🐉', type: 'badge' },
  { id: 'badge_ghost', name: 'Ghost Badge', emoji: '👻', type: 'badge' },
  { id: 'badge_phoenix', name: 'Phoenix Badge', emoji: '🦅', type: 'badge' },
  { id: 'badge_legend', name: 'Legend Badge', emoji: '🏆', type: 'badge' },
  { id: 'badge_infinity', name: 'Infinity Badge', emoji: '♾️', type: 'badge' },
  { id: 'badge_void', name: 'Void Badge', emoji: '🕳️', type: 'badge' },
  { id: 'pet_cat', name: 'Cat', emoji: '🐱', type: 'pet' },
  { id: 'pet_fox', name: 'Fox', emoji: '🦊', type: 'pet' },
  { id: 'pet_owl', name: 'Owl', emoji: '🦉', type: 'pet' },
  { id: 'pet_dragon', name: 'Dragon', emoji: '🐲', type: 'pet' },
  { id: 'baguette_stale', name: 'Stale Baguette', emoji: '🥖', type: 'misc' },
  { id: 'potion_xp', name: 'XP Potion', emoji: '🧪', type: 'misc' },
  { id: 'scroll_streak', name: 'Streak Scroll', emoji: '📜', type: 'misc' },
];

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [editXp, setEditXp] = useState('');
  const [editGold, setEditGold] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [itemFilter, setItemFilter] = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.admin.listUsers();
      setUsers(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const selectUser = async (user) => {
    setSelected(user);
    setEditXp(String(user.xp));
    setEditGold(String(user.gold));
    setEditLevel(String(user.level));
    try {
      const inv = await api.admin.getInventory(user.id);
      setInventory(inv.map(i => i.item_id));
    } catch {
      setInventory([]);
    }
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      const updated = await api.admin.updateUser(selected.id, {
        xp: parseInt(editXp),
        gold: parseInt(editGold),
        level: parseInt(editLevel),
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      setSelected(prev => ({ ...prev, ...updated }));
      showToast('Stats saved');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setSaving(false);
  };

  const grantItem = async (itemId) => {
    try {
      await api.admin.grantItem(selected.id, itemId);
      setInventory(prev => [...prev, itemId]);
      showToast('Item granted');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.admin.removeItem(selected.id, itemId);
      setInventory(prev => prev.filter(i => i !== itemId));
      showToast('Item removed');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredItems = ALL_ITEMS.filter(i => itemFilter === 'all' || i.type === itemFilter);

  const s = {
    page: { display: 'flex', gap: 20, height: 'calc(100vh - 130px)', overflow: 'hidden' },
    sidebar: { width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 },
    main: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
    card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 },
    input: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
    userRow: (active) => ({
      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
      border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
      transition: 'all 0.1s',
    }),
    statRow: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 },
    label: { fontSize: 12, color: 'var(--text-muted)', width: 50, flexShrink: 0 },
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          background: toast.type === 'error' ? '#7f1d1d' : '#064e3b',
          border: `1px solid ${toast.type === 'error' ? '#ef444455' : '#10b98155'}`,
          color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
          padding: '10px 20px', borderRadius: 10, fontWeight: 500, fontSize: 14,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 22, marginBottom: 4 }}>⚡ Admin Panel</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{users.length} players registered</p>
      </div>

      <div style={s.page}>
        {/* Player list */}
        <div style={s.sidebar}>
          <input
            style={s.input}
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredUsers.map(u => (
              <div key={u.id} style={s.userRow(selected?.id === u.id)} onClick={() => selectUser(u)}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {u.username} {u.is_admin && <span style={{ color: 'var(--gold)', fontSize: 11 }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lv.{u.level} · {u.xp} XP · {u.gold}g</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit panel */}
        {selected ? (
          <div style={s.main}>
            {/* Stats */}
            <div style={s.card}>
              <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 14, marginBottom: 14 }}>
                📊 {selected.username}'s Stats
              </h3>
              <div style={s.statRow}>
                <span style={s.label}>XP</span>
                <input style={s.input} type="number" value={editXp} onChange={e => setEditXp(e.target.value)} />
              </div>
              <div style={s.statRow}>
                <span style={s.label}>Gold</span>
                <input style={s.input} type="number" value={editGold} onChange={e => setEditGold(e.target.value)} />
              </div>
              <div style={s.statRow}>
                <span style={s.label}>Level</span>
                <input style={s.input} type="number" value={editLevel} onChange={e => setEditLevel(e.target.value)} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: 4, padding: '8px 20px', fontSize: 13 }}
                onClick={saveStats} disabled={saving}>
                {saving ? 'Saving...' : 'Save Stats'}
              </button>
            </div>

            {/* Inventory */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 14 }}>🎒 Inventory ({inventory.length} items)</h3>
                <select
                  value={itemFilter}
                  onChange={e => setItemFilter(e.target.value)}
                  style={{ ...s.input, width: 'auto', padding: '6px 10px' }}
                >
                  <option value="all">All types</option>
                  <option value="weapon">Weapons</option>
                  <option value="armor">Armour</option>
                  <option value="banner">Banners</option>
                  <option value="badge">Badges</option>
                  <option value="pet">Pets</option>
                  <option value="misc">Misc</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                {filteredItems.map(item => {
                  const owned = inventory.includes(item.id);
                  return (
                    <div key={item.id} style={{
                      padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${owned ? 'var(--accent)' : 'var(--border)'}`,
                      background: owned ? 'rgba(99,102,241,0.1)' : 'var(--bg3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                    }}>
                      <span style={{ fontSize: 13 }}>{item.emoji} {item.name}</span>
                      <button
                        onClick={() => owned ? removeItem(item.id) : grantItem(item.id)}
                        style={{
                          flexShrink: 0, padding: '3px 8px', borderRadius: 6, border: 'none',
                          cursor: 'pointer', fontSize: 11, fontWeight: 600,
                          background: owned ? '#7f1d1d' : 'rgba(99,102,241,0.3)',
                          color: owned ? '#fca5a5' : 'var(--accent2)',
                        }}>
                        {owned ? '−' : '+'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Select a player to edit
          </div>
        )}
      </div>
    </div>
  );
}
