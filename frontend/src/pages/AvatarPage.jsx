import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

const RARITY = {
  common:    { color: '#9ca3af', label: 'Common',    border: '#9ca3af44' },
  rare:      { color: '#3b82f6', label: 'Rare',      border: '#3b82f644' },
  epic:      { color: '#8b5cf6', label: 'Epic',      border: '#8b5cf644' },
  legendary: { color: '#f59e0b', label: 'Legendary', border: '#f59e0b44' },
};

const TYPES = ['weapon','armor','banner','badge'];
const SLOT_LABELS = { weapon:'🗡️ Weapon', armor:'🛡️ Armor', banner:'🏷️ Banner', badge:'🎖️ Badge' };

const SKIN_TONES = ['#FDDBB4','#e8b88a','#c68642','#8D5524','#4a2912'];
const HAIR_COLORS = ['#1a1a1a','#8B4513','#DAA520','#FF6B35','#c0c0c0','#ffffff','#cc3399','#3366cc'];
const EYE_COLORS  = ['#2a4a8a','#2a7a3a','#8a3a2a','#7a6a2a','#5a2a7a','#1a6a7a'];
const HAIR_STYLE_NAMES = ['Spiky','Long','Short Crop','Ponytail'];

export default function AvatarPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('avatar');
  const [shopData, setShopData] = useState({ gold: 0, items: [], ownedIds: [] });
  const [inventory, setInventory] = useState({ items: [], equipped: {} });
  const [shopFilter, setShopFilter] = useState('all');
  const [buying, setBuying] = useState(null);
  const [equipping, setEquipping] = useState(null);
  const [toast, setToast] = useState(null);
  const [appearance, setAppearance] = useState({
    avatar_skin: '#e8b88a', avatar_hair: '#8B4513',
    avatar_eyes: '#2a4a8a', avatar_hair_style: 0
  });
  const [savingAppearance, setSavingAppearance] = useState(false);

  const showToast = (msg, type='success') => {
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

  // Sync appearance from user object
  useEffect(() => {
    if (user) {
      setAppearance({
        avatar_skin:       user.avatar_skin       || '#e8b88a',
        avatar_hair:       user.avatar_hair       || '#8B4513',
        avatar_eyes:       user.avatar_eyes       || '#2a4a8a',
        avatar_hair_style: user.avatar_hair_style || 0,
      });
    }
  }, [user?.id]);

  const saveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await api.avatar.saveAppearance({
        skin: appearance.avatar_skin,
        hair: appearance.avatar_hair,
        eyes: appearance.avatar_eyes,
        hair_style: appearance.avatar_hair_style,
      });
      await refreshUser();
      showToast('Appearance saved!');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSavingAppearance(false); }
  };

  const buy = async (item) => {
    if (buying) return;
    setBuying(item.id);
    try {
      const res = await api.avatar.buy(item.id);
      showToast(`Purchased ${item.name}!`);
      await load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setBuying(null); }
  };

  const equip = async (item) => {
    if (equipping) return;
    setEquipping(item.id);
    try {
      await api.avatar.equip(item.id);
      showToast(`Equipped ${item.name}!`);
      await load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setEquipping(null); }
  };

  const unequip = async (slot) => {
    await api.avatar.unequip(slot);
    showToast(`Unequipped ${slot}`);
    await load();
  };

  const filteredShop = shopFilter === 'all' ? shopData.items : shopData.items.filter(i => i.type === shopFilter);
  const totalMagic = Object.values(inventory.equipped).filter(Boolean).reduce((s,i) => s + (i.magic||0), 0);
  const gold = user?.gold ?? shopData.gold;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingBottom:32, position:'relative' }}>

      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)',
          background: toast.type==='error' ? '#7f1d1d' : '#064e3b',
          border:`1px solid ${toast.type==='error' ? '#ef444444' : '#10b98144'}`,
          color: toast.type==='error' ? '#fca5a5' : '#6ee7b7',
          padding:'10px 20px', borderRadius:10, fontWeight:500, fontSize:14,
          zIndex:200, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.5)'
        }} className="animate-fade">{toast.msg}</div>
      )}

      {/* Gold */}
      <div style={{ display:'flex', alignItems:'center', gap:8, alignSelf:'flex-end' }}>
        <span style={{ fontSize:18 }}>💰</span>
        <span style={{ fontFamily:'Cinzel,serif', color:'#f59e0b', fontWeight:700, fontSize:18 }}>{gold.toLocaleString()}</span>
        <span style={{ color:'var(--text-muted)', fontSize:13 }}>gold</span>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {['avatar','shop','inventory'].map(t => (
          <button key={t} style={{ ...S.tab, ...(tab===t ? S.tabActive : {}) }} onClick={() => setTab(t)}>
            {t==='avatar' ? '⚔️ Avatar' : t==='shop' ? '🛒 Shop' : '🎒 Inventory'}
          </button>
        ))}
      </div>

      {/* ── AVATAR TAB ── */}
      {tab==='avatar' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Character preview card */}
          <div style={S.charCard} className="card">
            <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
              <PixelCharacter equipped={inventory.equipped} appearance={appearance} size={130}/>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  {inventory.equipped.banner && (
                    <div style={{ background:inventory.equipped.banner.color, borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:600, color:'white', textShadow:'0 1px 3px rgba(0,0,0,0.5)' }}>
                      {inventory.equipped.banner.name}
                    </div>
                  )}
                  {inventory.equipped.badge && <span style={{ fontSize:20 }}>{inventory.equipped.badge.emoji}</span>}
                </div>
                <div style={{ fontFamily:'Cinzel,serif', fontSize:20, fontWeight:700, marginBottom:2 }}>{user?.username}</div>
                <div style={{ color:'var(--text-muted)', fontSize:13, marginBottom:12 }}>
                  Level {user?.level} · {totalMagic>0 ? `✨ ${totalMagic} Magic Power` : 'No gear equipped'}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {TYPES.map(slot => {
                    const item = inventory.equipped[slot];
                    return (
                      <div key={slot} style={{
                        padding:'4px 10px', borderRadius:6, fontSize:12,
                        background: item ? 'var(--bg3)' : 'transparent',
                        border:`1px solid ${item ? (RARITY[item.rarity]?.border||'var(--border)') : 'var(--border)'}`,
                        color: item ? (RARITY[item.rarity]?.color||'var(--text)') : 'var(--text-muted)',
                        cursor: item ? 'pointer' : 'default'
                      }} onClick={() => item && unequip(slot)}>
                        {item ? `${item.emoji||'🏷️'} ${item.name}` : SLOT_LABELS[slot]}
                        {item && <span style={{ marginLeft:4, opacity:0.5 }}>✕</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Appearance customiser */}
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontFamily:'Cinzel,serif', fontSize:15, marginBottom:16 }}>Appearance — Free to Customise</h3>

            <Section label="Skin Tone">
              {SKIN_TONES.map(c => (
                <Swatch key={c} color={c} active={appearance.avatar_skin===c}
                  onClick={() => setAppearance(a => ({ ...a, avatar_skin:c }))}/>
              ))}
            </Section>

            <Section label="Hair Colour">
              {HAIR_COLORS.map(c => (
                <Swatch key={c} color={c} active={appearance.avatar_hair===c}
                  onClick={() => setAppearance(a => ({ ...a, avatar_hair:c }))}/>
              ))}
            </Section>

            <Section label="Eye Colour">
              {EYE_COLORS.map(c => (
                <Swatch key={c} color={c} active={appearance.avatar_eyes===c}
                  onClick={() => setAppearance(a => ({ ...a, avatar_eyes:c }))}/>
              ))}
            </Section>

            <Section label="Hair Style">
              <div style={{ display:'flex', gap:8 }}>
                {HAIR_STYLE_NAMES.map((name, i) => (
                  <button key={i} type="button"
                    onClick={() => setAppearance(a => ({ ...a, avatar_hair_style:i }))}
                    style={{
                      padding:'6px 12px', borderRadius:8, border:'1px solid',
                      borderColor: appearance.avatar_hair_style===i ? 'var(--accent)' : 'var(--border)',
                      background: appearance.avatar_hair_style===i ? 'rgba(99,102,241,0.15)' : 'var(--bg3)',
                      color: appearance.avatar_hair_style===i ? 'var(--text)' : 'var(--text-muted)',
                      fontSize:12, cursor:'pointer'
                    }}>{name}</button>
                ))}
              </div>
            </Section>

            <button className="btn btn-primary" style={{ marginTop:4 }}
              onClick={saveAppearance} disabled={savingAppearance}>
              {savingAppearance ? 'Saving...' : 'Save Appearance'}
            </button>
          </div>
        </div>
      )}

      {/* ── SHOP TAB ── */}
      {tab==='shop' && (
        <div>
          <div style={S.filterRow}>
            {['all',...TYPES].map(f => (
              <button key={f} style={{ ...S.filterBtn, ...(shopFilter===f ? S.filterBtnActive : {}) }}
                onClick={() => setShopFilter(f)}>
                {f==='all' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <div style={S.grid}>
            {filteredShop.map(item => {
              const owned = shopData.ownedIds.includes(item.id);
              const canAfford = gold >= item.cost;
              const r = RARITY[item.rarity];
              return (
                <div key={item.id} style={{ ...S.card, border:`1px solid ${r.border}`, opacity:owned?0.65:1 }}>
                  {item.type==='banner'
                    ? <div style={{ width:'100%', height:48, borderRadius:8, background:item.color, marginBottom:8 }}/>
                    : <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>{item.emoji}</div>}
                  <div style={{ fontSize:11, color:r.color, fontWeight:600, marginBottom:2 }}>{r.label}</div>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:2 }}>{item.name}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:6, flex:1 }}>{item.desc}</div>
                  {item.magic>0 && <div style={{ fontSize:11, color:'#a78bfa', marginBottom:6 }}>✨ {item.magic} Magic</div>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'#f59e0b', fontWeight:700, fontSize:12 }}>💰 {item.cost}</span>
                    {owned
                      ? <span style={{ fontSize:12, color:'var(--green)' }}>✓ Owned</span>
                      : <button className="btn btn-primary" style={{ padding:'6px 12px', fontSize:12, opacity:canAfford?1:0.4 }}
                          disabled={!canAfford||buying===item.id} onClick={() => buy(item)}>
                          {buying===item.id ? '...' : 'Buy'}
                        </button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── INVENTORY TAB ── */}
      {tab==='inventory' && (
        <div>
          {inventory.items.length===0
            ? <div style={S.empty}><div style={{ fontSize:48, marginBottom:12 }}>🎒</div><p style={{ color:'var(--text-muted)' }}>Your inventory is empty. Visit the Shop!</p></div>
            : <div style={S.grid}>
                {inventory.items.map(item => {
                  if (!item || !item.id) return null;
                  const isEquipped = Object.values(inventory.equipped).some(e => e?.id===item.id);
                  const r = RARITY[item.rarity] || RARITY.common;
                  return (
                    <div key={item.id} style={{ ...S.card, border:`1px solid ${isEquipped ? r.color : r.border}`, background:isEquipped?`${r.border}`:'var(--bg2)' }}>
                      {item.type==='banner'
                        ? <div style={{ width:'100%', height:48, borderRadius:8, background:item.color, marginBottom:8 }}/>
                        : <div style={{ fontSize:36, textAlign:'center', marginBottom:8 }}>{item.emoji}</div>}
                      <div style={{ fontSize:11, color:r.color, fontWeight:600, marginBottom:2 }}>{r.label}</div>
                      <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{item.name}</div>
                      {item.magic>0 && <div style={{ fontSize:11, color:'#a78bfa', marginBottom:6 }}>✨ {item.magic} Magic</div>}
                      <div style={{ flex:1 }}/>
                      {isEquipped
                        ? <button className="btn btn-ghost" style={{ width:'100%', fontSize:12, padding:'6px' }} onClick={() => unequip(item.type)}>Unequip</button>
                        : <button className="btn btn-primary" style={{ width:'100%', fontSize:12, padding:'6px' }}
                            disabled={equipping===item.id} onClick={() => equip(item)}>
                            {equipping===item.id ? '...' : 'Equip'}
                          </button>}
                    </div>
                  );
                })}
              </div>}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6, fontWeight:500 }}>{label}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>{children}</div>
    </div>
  );
}

function Swatch({ color, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width:28, height:28, borderRadius:'50%', background:color, cursor:'pointer',
      border: active ? '3px solid white' : '2px solid transparent',
      boxShadow: active ? `0 0 0 2px var(--accent)` : 'none',
      transition:'all 0.15s'
    }}/>
  );
}

const S = {
  tabs:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background:'var(--bg2)', borderRadius:10, padding:4, border:'1px solid var(--border)' },
  tab:{ padding:'10px 6px', border:'none', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:500, borderRadius:7, cursor:'pointer' },
  tabActive:{ background:'var(--bg3)', color:'var(--text)' },
  charCard:{ padding:24 },
  filterRow:{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' },
  filterBtn:{ padding:'6px 14px', borderRadius:99, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:13, cursor:'pointer' },
  filterBtnActive:{ background:'var(--accent)', color:'white', borderColor:'var(--accent)' },
  grid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12 },
  card:{ background:'var(--bg2)', borderRadius:12, padding:14, display:'flex', flexDirection:'column', transition:'transform 0.15s ease' },
  empty:{ textAlign:'center', padding:'48px 24px', color:'var(--text-muted)' }
};
