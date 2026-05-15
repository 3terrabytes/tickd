import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

const RARITY_STYLES = {
  common:    { color: '#9ca3af', label: 'Common',    border: '#9ca3af44' },
  rare:      { color: '#3b82f6', label: 'Rare',      border: '#3b82f644' },
  epic:      { color: '#8b5cf6', label: 'Epic',      border: '#8b5cf644' },
  legendary: { color: '#f59e0b', label: 'Legendary', border: '#f59e0b44' },
};

const SLOT_LABELS = { weapon: '🗡️ Weapon', armor: '🛡️ Armor', banner: '🏷️ Banner', badge: '🎖️ Badge', companion: '🐾 Companion', title: '📛 Title' };
const TYPES = ['weapon', 'armor', 'banner', 'badge', 'companion', 'title'];

export default function AvatarPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('avatar');
  const [shopData, setShopData] = useState({ gold: 0, items: [], ownedIds: [] });
  const [inventory, setInventory] = useState({ items: [], equipped: {} });
  const [shopFilter, setShopFilter] = useState('all');
  const [buying, setBuying] = useState(null);
  const [equipping, setEquipping] = useState(null);
  const [using, setUsing] = useState(null);
  const [confirmUse, setConfirmUse] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    const [shop, inv] = await Promise.all([api.avatar.shop(), api.avatar.inventory()]);
    setShopData(shop);
    setInventory(inv);
    await refreshUser();
  };

  useEffect(() => { load(); }, []);

  const buy = async (item) => {
    if (buying) return;
    setBuying(item.id);
    try {
      const res = await api.avatar.buy(item.id);
      setShopData(s => ({ ...s, gold: res.gold, ownedIds: [...s.ownedIds, item.id] }));
      showToast(`Purchased ${item.name}!`);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBuying(null);
    }
  };

  const equip = async (item) => {
    if (equipping) return;
    setEquipping(item.id);
    try {
      await api.avatar.equip(item.id);
      showToast(`Equipped ${item.name}!`);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEquipping(null);
    }
  };

  const unequip = async (slot) => {
    await api.avatar.unequip(slot);
    showToast(`Unequipped ${slot}`);
    await load();
  };

  const useItem = async (item) => {
    if (using) return;
    setUsing(item.id);
    setConfirmUse(null);
    try {
      const res = await api.avatar.use(item.id);
      const msg = res.xpGained ? `+${res.xpGained} XP!`
        : res.goldGained ? `+${res.goldGained} gold!`
        : res.shieldActive ? 'Streak Shield active!'
        : res.message || 'Used!';
      showToast(`${item.name}: ${msg}`);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUsing(null);
    }
  };

  const filteredShop = shopFilter === 'all'
    ? shopData.items
    : shopData.items.filter(i => i.type === shopFilter);

  const totalMagic = Object.values(inventory.equipped)
    .filter(Boolean)
    .reduce((s, i) => s + (i.magic || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32, position: 'relative' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#7f1d1d' : '#064e3b',
          border: `1px solid ${toast.type === 'error' ? '#ef444444' : '#10b98144'}`,
          color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7',
          padding: '10px 20px', borderRadius: 10, fontWeight: 500, fontSize: 14,
          zIndex: 200, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }} className="animate-fade">{toast.msg}</div>
      )}

      {confirmUse && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300
        }}>
          <div className="card" style={{ padding: 24, maxWidth: 300, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{confirmUse.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{confirmUse.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              This item is one-time use and will be consumed. Are you sure?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmUse(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => useItem(confirmUse)}>Use it</button>
            </div>
          </div>
        </div>
      )}

      {/* Gold display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end' }}>
        <span style={{ fontSize: 18 }}>💰</span>
        <span style={{ fontFamily: 'Cinzel, serif', color: '#f59e0b', fontWeight: 700, fontSize: 18 }}>{(user?.gold || shopData.gold).toLocaleString()}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>gold</span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['avatar', 'shop', 'inventory'].map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            onClick={() => setTab(t)}>
            {t === 'avatar' ? '⚔️ Avatar' : t === 'shop' ? '🛒 Shop' : '🎒 Inventory'}
          </button>
        ))}
      </div>

      {/* AVATAR TAB */}
      {tab === 'avatar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Character card */}
          <div style={styles.characterCard} className="card">
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <PixelCharacter equipped={inventory.equipped} size={120} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {inventory.equipped.banner && (
                    <div style={{
                      background: inventory.equipped.banner.color,
                      borderRadius: 6, padding: '3px 10px',
                      fontSize: 12, fontWeight: 600, color: 'white',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                    }}>
                      {inventory.equipped.banner.name}
                    </div>
                  )}
                  {inventory.equipped.badge && (
                    <span style={{ fontSize: 20 }}>{inventory.equipped.badge.emoji}</span>
                  )}
                </div>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                  {user?.username}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                  Level {user?.level} · {totalMagic > 0 ? `✨ ${totalMagic} Magic Power` : 'No gear equipped'}
                </div>
                {/* Equipped slots summary */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TYPES.map(slot => {
                    const item = inventory.equipped[slot];
                    return (
                      <div key={slot} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12,
                        background: item ? 'var(--bg3)' : 'transparent',
                        border: `1px solid ${item ? RARITY_STYLES[item.rarity]?.border || 'var(--border)' : 'var(--border)'}`,
                        color: item ? RARITY_STYLES[item.rarity]?.color : 'var(--text-muted)',
                        cursor: item ? 'pointer' : 'default'
                      }} onClick={() => item && unequip(slot)}>
                        {item ? `${item.emoji || '🏷️'} ${item.name}` : SLOT_LABELS[slot]}
                        {item && <span style={{ marginLeft: 4, opacity: 0.5 }}>✕</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Click an equipped item to unequip it. Visit the Shop to buy gear, or Inventory to equip what you own.
          </p>
        </div>
      )}

      {/* SHOP TAB */}
      {tab === 'shop' && (
        <div>
          <div style={styles.filterRow}>
            {['all', ...TYPES].map(f => (
              <button key={f} style={{ ...styles.filterBtn, ...(shopFilter === f ? styles.filterBtnActive : {}) }}
                onClick={() => setShopFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={styles.grid}>
            {filteredShop.map(item => {
              const owned = shopData.ownedIds.includes(item.id);
              const canAfford = (user?.gold || shopData.gold) >= item.cost;
              const r = RARITY_STYLES[item.rarity];
              return (
                <div key={item.id} style={{
                  ...styles.shopCard,
                  border: `1px solid ${r.border}`,
                  opacity: owned ? 0.6 : 1,
                }}>
                  {item.type === 'banner' ? (
                    <div style={{ width: '100%', height: 48, borderRadius: 8, background: item.color, marginBottom: 8 }} />
                  ) : (
                    <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>{item.emoji}</div>
                  )}
                  <div style={{ fontSize: 12, color: r.color, fontWeight: 600, marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8, flex: 1 }}>{item.desc}</div>
                  {item.magic > 0 && (
                    <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 6 }}>✨ {item.magic} Magic</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>💰 {item.cost}</span>
                    {owned ? (
                      <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Owned</span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: 12, opacity: canAfford ? 1 : 0.4 }}
                        disabled={!canAfford || buying === item.id}
                        onClick={() => buy(item)}
                      >
                        {buying === item.id ? '...' : 'Buy'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {tab === 'inventory' && (
        <div>
          {inventory.items.length === 0 ? (
            <div style={styles.empty}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎒</div>
              <p style={{ color: 'var(--text-muted)' }}>Your inventory is empty. Visit the Shop!</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {inventory.items.map(item => {
                const isEquipped = Object.values(inventory.equipped).some(e => e?.id === item.id);
                const r = RARITY_STYLES[item.rarity];
                return (
                  <div key={item.id} style={{
                    ...styles.shopCard,
                    border: `1px solid ${isEquipped ? r.color : r.border}`,
                    background: isEquipped ? `${r.border}` : 'var(--bg2)',
                  }}>
                    {item.type === 'banner' ? (
                      <div style={{ width: '100%', height: 48, borderRadius: 8, background: item.color, marginBottom: 8 }} />
                    ) : (
                      <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>{item.emoji}</div>
                    )}
                    <div style={{ fontSize: 12, color: r.color, fontWeight: 600, marginBottom: 2 }}>{r.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
                    {item.magic > 0 && (
                      <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 6 }}>✨ {item.magic} Magic</div>
                    )}
                    <div style={{ flex: 1 }} />
                    {item.type === 'consumable' ? (
                      <button className="btn btn-primary" style={{ width: '100%', fontSize: 12, padding: '6px', background: '#b45309', borderColor: '#b45309' }}
                        disabled={using === item.id}
                        onClick={() => setConfirmUse(item)}>
                        {using === item.id ? '...' : '⚡ Use'}
                      </button>
                    ) : isEquipped ? (
                      <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12, padding: '6px' }}
                        onClick={() => unequip(item.type)}>Unequip</button>
                    ) : (
                      <button className="btn btn-primary" style={{ width: '100%', fontSize: 12, padding: '6px' }}
                        disabled={equipping === item.id}
                        onClick={() => equip(item)}>
                        {equipping === item.id ? '...' : 'Equip'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  tabs: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    background: 'var(--bg2)', borderRadius: 10, padding: 4,
    border: '1px solid var(--border)'
  },
  tab: {
    padding: '10px 6px', border: 'none', background: 'transparent',
    color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, borderRadius: 7, cursor: 'pointer'
  },
  tabActive: { background: 'var(--bg3)', color: 'var(--text)' },
  characterCard: { padding: 24 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: {
    padding: '6px 14px', borderRadius: 99, border: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer'
  },
  filterBtnActive: { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12
  },
  shopCard: {
    background: 'var(--bg2)', borderRadius: 12, padding: 14,
    display: 'flex', flexDirection: 'column', transition: 'transform 0.15s ease'
  },
  empty: { textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }
};
