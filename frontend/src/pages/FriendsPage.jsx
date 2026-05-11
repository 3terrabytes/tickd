import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

function levelTitle(level) {
  const t = ['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return t[Math.min(level, t.length - 1)];
}
const RARITY_COLORS = { common:'#9ca3af', rare:'#3b82f6', epic:'#8b5cf6', legendary:'#f59e0b' };

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends]         = useState([]);
  const [pending, setPending]         = useState([]);
  const [allUsers, setAllUsers]       = useState([]);
  const [search, setSearch]           = useState('');
  const [tab, setTab]                 = useState('leaderboard');
  const [loading, setLoading]         = useState(false);
  const [trades, setTrades]           = useState([]);
  const [giftHistory, setGiftHistory] = useState([]);
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const load = useCallback(async () => {
    const [f, p] = await Promise.all([api.friends.list(), api.friends.pending()]);
    setFriends(f); setPending(p);
  }, []);

  const loadAll = useCallback(async (q='') => {
    setLoading(true);
    try { setAllUsers(await api.friends.all(q)); } catch {}
    setLoading(false);
  }, []);

  const loadGifts = useCallback(async () => {
    const [t, h] = await Promise.all([api.gifts.tradePending(), api.gifts.history()]);
    setTrades(t); setGiftHistory(h);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab==='find')  loadAll(search);  }, [tab, search, loadAll]);
  useEffect(() => { if (tab==='gifts') loadGifts(); }, [tab, loadGifts]);

  const sendRequest = async (id) => { try { await api.friends.request(id); loadAll(search); } catch {} };
  const accept      = async (id)  => { await api.friends.accept(id); await load(); };
  const remove      = async (id)  => { await api.friends.remove(id); await load(); loadAll(search); };

  const acceptTrade  = async (id) => { try { await api.gifts.tradeAccept(id);  showToast('Trade accepted!'); loadGifts(); } catch(e){ showToast(e.message,'error'); } };
  const declineTrade = async (id) => { await api.gifts.tradeDecline(id); showToast('Trade declined'); loadGifts(); };

  const pendingTradeCount = trades.filter(t => t.direction==='incoming').length;

  const board = [
    { id: user?.id, username: user?.username, xp: user?.xp||0, level: user?.level||1,
      avatar_skin: user?.avatar_skin, avatar_hair: user?.avatar_hair,
      avatar_eyes: user?.avatar_eyes, avatar_hair_style: user?.avatar_hair_style,
      isSelf: true, equipped: {} },
    ...friends
  ].sort((a,b) => b.xp - a.xp);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingBottom:32, position:'relative' }}>

      {toast && (
        <div style={{
          position:'fixed', top:20, left:'50%', transform:'translateX(-50%)', zIndex:200,
          background: toast.type==='error' ? '#7f1d1d' : '#064e3b',
          border:`1px solid ${toast.type==='error' ? '#ef444455':'#10b98155'}`,
          color: toast.type==='error' ? '#fca5a5':'#6ee7b7',
          padding:'10px 20px', borderRadius:10, fontWeight:500, fontSize:14,
          whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.5)'
        }} className="animate-fade">{toast.msg}</div>
      )}

      <div style={S.tabs}>
        {['leaderboard','friends','find','gifts'].map(t => (
          <button key={t} style={{ ...S.tab, ...(tab===t?S.tabActive:{}) }} onClick={() => setTab(t)}>
            {t==='leaderboard' ? '🏆 Board'
            : t==='friends'    ? `Friends${pending.length?` (${pending.length})`:''}`
            : t==='find'       ? '🔍 Find'
            :                    `🎁 Gifts${pendingTradeCount>0?` (${pendingTradeCount})`:''}`}
          </button>
        ))}
      </div>

      {/* LEADERBOARD */}
      {tab==='leaderboard' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {board.length<=1 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center' }}>Add friends to see them on the board</p>}
          {board.map((p,i) => <PlayerCard key={p.id} player={p} rank={i+1}/>)}
        </div>
      )}

      {/* FRIENDS */}
      {tab==='friends' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pending.length>0 && <>
            <h3 style={S.sectionTitle}>Pending Requests</h3>
            {pending.map(p => (
              <div key={p.id} className="card" style={S.rowCard}>
                <PixelCharacter equipped={p.equipped||{}} appearance={p} size={52}/>
                <div style={{ flex:1 }}>
                  <NameWithBanner user={p}/>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Lv.{p.level} {levelTitle(p.level)}</div>
                </div>
                <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => accept(p.id)}>Accept</button>
                <button className="btn btn-ghost"   style={{ padding:'8px 14px', fontSize:13 }} onClick={() => remove(p.id)}>Decline</button>
              </div>
            ))}
          </>}
          <h3 style={S.sectionTitle}>Your Friends ({friends.length})</h3>
          {friends.length===0 && <div style={S.empty}><p style={{ color:'var(--text-muted)', fontSize:14 }}>No friends yet — use the Find tab!</p></div>}
          {friends.map(f => <FriendCard key={f.id} friend={f} allFriends={friends} myInventory={[]} onRemove={() => remove(f.id)} onToast={showToast} onRefresh={loadGifts}/>)}
        </div>
      )}

      {/* FIND */}
      {tab==='find' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username..." style={S.input} autoFocus/>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12 }}>
            {loading && <p style={{ color:'var(--text-muted)', textAlign:'center', padding:16 }}>Loading...</p>}
            {!loading && allUsers.map(u => {
              const isFriend = u.friendship_status==='accepted';
              const sent     = u.friendship_status==='pending' && u.friendship_dir==='sent';
              const received = u.friendship_status==='pending' && u.friendship_dir==='received';
              return (
                <div key={u.id} className="card" style={S.rowCard}>
                  <PixelCharacter equipped={u.equipped||{}} appearance={u} size={52}/>
                  <div style={{ flex:1 }}>
                    <NameWithBanner user={u}/>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>Lv.{u.level} {levelTitle(u.level)}</div>
                  </div>
                  {isFriend  ? <span style={{ fontSize:12, color:'var(--green)' }}>✓ Friends</span>
                  : sent     ? <span style={{ fontSize:12, color:'var(--text-muted)' }}>Sent</span>
                  : received ? <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => accept(u.id)}>Accept</button>
                  :            <button className="btn btn-primary" style={{ padding:'8px 14px', fontSize:13 }} onClick={() => sendRequest(u.id)}>+ Add</button>}
                </div>
              );
            })}
            {!loading && allUsers.length===0 && search  && <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:24 }}>No players found</p>}
            {!loading && allUsers.length===0 && !search && <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:24 }}>No other players yet</p>}
          </div>
        </div>
      )}

      {/* GIFTS */}
      {tab==='gifts' && (
        <GiftsTab
          friends={friends}
          trades={trades}
          giftHistory={giftHistory}
          onAcceptTrade={acceptTrade}
          onDeclineTrade={declineTrade}
          onToast={showToast}
          onRefresh={loadGifts}
        />
      )}
    </div>
  );
}

// ── GIFTS TAB ────────────────────────────────────────────
function GiftsTab({ friends, trades, giftHistory, onAcceptTrade, onDeclineTrade, onToast, onRefresh }) {
  const [subtab, setSubtab]           = useState('inbox');
  const [myInventory, setMyInventory] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [giftItem, setGiftItem]       = useState('');
  const [giftMsg, setGiftMsg]         = useState('');
  const [offerItem, setOfferItem]     = useState('');
  const [requestItem, setRequestItem] = useState('');
  const [tradeMsg, setTradeMsg]       = useState('');
  const [friendInv, setFriendInv]     = useState([]);
  const [sending, setSending]         = useState(false);

  useEffect(() => {
    api.avatar.inventory().then(d => setMyInventory(d.items || []));
  }, []);

  useEffect(() => {
    if (!selectedFriend) { setFriendInv([]); return; }
    // We don't have a public inventory endpoint per user,
    // so we rely on trade validation server-side — just show a text input for item name
  }, [selectedFriend]);

  const sendGift = async (e) => {
    e.preventDefault();
    if (!selectedFriend || !giftItem) return;
    setSending(true);
    try {
      await api.gifts.send({ receiver_id: selectedFriend, item_id: giftItem, message: giftMsg });
      onToast('Gift sent! 🎁');
      setGiftItem(''); setGiftMsg('');
      api.avatar.inventory().then(d => setMyInventory(d.items || []));
      onRefresh();
    } catch(err) { onToast(err.message, 'error'); }
    setSending(false);
  };

  const proposeTrade = async (e) => {
    e.preventDefault();
    if (!selectedFriend || !offerItem || !requestItem) return;
    setSending(true);
    try {
      await api.gifts.tradePropose({ receiver_id: selectedFriend, offer_item_id: offerItem, request_item_id: requestItem, message: tradeMsg });
      onToast('Trade proposed! ⚔️');
      setOfferItem(''); setRequestItem(''); setTradeMsg('');
      onRefresh();
    } catch(err) { onToast(err.message, 'error'); }
    setSending(false);
  };

  const incoming = trades.filter(t => t.direction==='incoming');
  const outgoing = trades.filter(t => t.direction==='outgoing');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...S.tabs, gridTemplateColumns:'1fr 1fr 1fr 1fr' }}>
        {['inbox','send','trade','history'].map(t => (
          <button key={t} style={{ ...S.tab, ...(subtab===t?S.tabActive:{}) }} onClick={() => setSubtab(t)}>
            {t==='inbox'   ? `📬 Inbox${incoming.length?` (${incoming.length})`:''}`
            : t==='send'   ? '🎁 Send Gift'
            : t==='trade'  ? `⚔️ Trade${outgoing.length?` (${outgoing.length})`:''}`
            :                '📜 History'}
          </button>
        ))}
      </div>

      {/* INBOX */}
      {subtab==='inbox' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {incoming.length===0 && <div style={S.empty}><p style={{ color:'var(--text-muted)' }}>No incoming trades</p></div>}
          {incoming.map(t => (
            <div key={t.id} className="card" style={{ padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontSize:20 }}>⚔️</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:600 }}>{t.proposer_name}</span>
                  <span style={{ color:'var(--text-muted)', fontSize:13 }}> wants to trade</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                <ItemPill item={t.offer_item} label="They offer"/>
                <span style={{ color:'var(--text-muted)', fontSize:18 }}>⇄</span>
                <ItemPill item={t.request_item} label="They want"/>
              </div>
              {t.message && <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:10, fontStyle:'italic' }}>"{t.message}"</p>}
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={() => onAcceptTrade(t.id)}>Accept Trade</button>
                <button className="btn btn-ghost"   style={{ flex:1 }} onClick={() => onDeclineTrade(t.id)}>Decline</button>
              </div>
            </div>
          ))}
          {outgoing.length>0 && <>
            <h3 style={{ ...S.sectionTitle, marginTop:8 }}>Outgoing Proposals</h3>
            {outgoing.map(t => (
              <div key={t.id} className="card" style={{ padding:14, display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:18 }}>⏳</span>
                <div style={{ flex:1, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{t.receiver_name}</span>
                  <span style={{ color:'var(--text-muted)' }}> · awaiting response</span>
                  <div style={{ display:'flex', gap:6, marginTop:6, flexWrap:'wrap' }}>
                    <ItemPill item={t.offer_item} label="You offer"/>
                    <span style={{ color:'var(--text-muted)', fontSize:16 }}>⇄</span>
                    <ItemPill item={t.request_item} label="You want"/>
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => onDeclineTrade(t.id)}>Cancel</button>
              </div>
            ))}
          </>}
        </div>
      )}

      {/* SEND GIFT */}
      {subtab==='send' && (
        <form onSubmit={sendGift} className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <h3 style={{ fontFamily:'Cinzel,serif', fontSize:15 }}>Send a Gift</h3>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>The item will be removed from your inventory and given to your friend instantly.</p>

          <Label text="Friend">
            <select value={selectedFriend} onChange={e => setSelectedFriend(e.target.value)} style={S.select} required>
              <option value="">Select a friend...</option>
              {friends.map(f => <option key={f.id} value={f.id}>{f.username}</option>)}
            </select>
          </Label>

          <Label text="Item to gift">
            <select value={giftItem} onChange={e => setGiftItem(e.target.value)} style={S.select} required>
              <option value="">Select from your inventory...</option>
              {myInventory.map(item => (
                <option key={item.id} value={item.id}>{item.emoji || '🏷️'} {item.name} ({item.rarity})</option>
              ))}
            </select>
          </Label>

          {myInventory.length===0 && <p style={{ color:'var(--text-muted)', fontSize:12 }}>Your inventory is empty. Buy items in the Shop first.</p>}

          <Label text="Message (optional)">
            <input value={giftMsg} onChange={e => setGiftMsg(e.target.value)} placeholder="A short message..." style={S.input} maxLength={200}/>
          </Label>

          <button className="btn btn-gold" type="submit" disabled={sending || !giftItem || !selectedFriend}>
            {sending ? 'Sending...' : '🎁 Send Gift'}
          </button>
        </form>
      )}

      {/* PROPOSE TRADE */}
      {subtab==='trade' && (
        <form onSubmit={proposeTrade} className="card" style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <h3 style={{ fontFamily:'Cinzel,serif', fontSize:15 }}>Propose a Trade</h3>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Offer one of your items in exchange for one of theirs. They must accept for the swap to happen.</p>

          <Label text="Friend">
            <select value={selectedFriend} onChange={e => setSelectedFriend(e.target.value)} style={S.select} required>
              <option value="">Select a friend...</option>
              {friends.map(f => <option key={f.id} value={f.id}>{f.username}</option>)}
            </select>
          </Label>

          <Label text="Your offer (from your inventory)">
            <select value={offerItem} onChange={e => setOfferItem(e.target.value)} style={S.select} required>
              <option value="">Select item to offer...</option>
              {myInventory.map(item => (
                <option key={item.id} value={item.id}>{item.emoji || '🏷️'} {item.name} ({item.rarity})</option>
              ))}
            </select>
          </Label>

          <Label text="Item you want (enter item ID)">
            <input value={requestItem} onChange={e => setRequestItem(e.target.value)}
              placeholder="e.g. sword_silver, armor_dragon..." style={S.input}/>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Ask your friend which item IDs they have. The server will verify they own it.</p>
          </Label>

          <Label text="Message (optional)">
            <input value={tradeMsg} onChange={e => setTradeMsg(e.target.value)} placeholder="e.g. fair deal?" style={S.input} maxLength={200}/>
          </Label>

          <button className="btn btn-primary" type="submit" disabled={sending || !offerItem || !requestItem || !selectedFriend}>
            {sending ? 'Proposing...' : '⚔️ Propose Trade'}
          </button>
        </form>
      )}

      {/* HISTORY */}
      {subtab==='history' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {giftHistory.length===0 && <div style={S.empty}><p style={{ color:'var(--text-muted)' }}>No gift history yet</p></div>}
          {giftHistory.map(g => {
            const isSender = g.sender_id === parseInt(localStorage.getItem('hq_uid') || '0');
            return (
              <div key={g.id} className="card" style={{ padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:22 }}>🎁</span>
                <div style={{ flex:1, fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{g.sender_name}</span>
                  <span style={{ color:'var(--text-muted)' }}> gifted </span>
                  <span style={{ color: RARITY_COLORS[g.item?.rarity]||'var(--text)' }}>{g.item?.emoji} {g.item?.name}</span>
                  <span style={{ color:'var(--text-muted)' }}> to </span>
                  <span style={{ fontWeight:600 }}>{g.receiver_name}</span>
                  {g.message && <div style={{ color:'var(--text-muted)', fontStyle:'italic', marginTop:2 }}>"{g.message}"</div>}
                </div>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(g.created_at).toLocaleDateString()}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ItemPill({ item, label }) {
  if (!item) return null;
  const color = RARITY_COLORS[item.rarity] || 'var(--text-muted)';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      <span style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--bg3)', border:`1px solid ${color}44`, borderRadius:8, padding:'5px 10px' }}>
        <span style={{ fontSize:18 }}>{item.type==='banner' ? '🏷️' : item.emoji}</span>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color }}>{item.name}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)' }}>{item.rarity}{item.magic>0 ? ` · ✨${item.magic}`:''}</div>
        </div>
      </div>
    </div>
  );
}

function Label({ text, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em' }}>{text}</span>
      {children}
    </div>
  );
}

function NameWithBanner({ user }) {
  const banner = user.equipped?.banner;
  const badge  = user.equipped?.badge;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
      {banner && <div style={{ background:banner.color, borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{banner.name}</div>}
      <span style={{ fontWeight:500 }}>{user.username}</span>
      {badge && <span style={{ fontSize:15 }}>{badge.emoji}</span>}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontSize:13 }}>{icon}</span>
      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600 }}>{value}</span>
    </div>
  );
}

function FriendCard({ friend: f, onRemove }) {
  const banner = f.equipped?.banner;
  const badge  = f.equipped?.badge;
  const weapon = f.equipped?.weapon;
  const armor  = f.equipped?.armor;
  const magic  = Object.values(f.equipped||{}).filter(Boolean).reduce((s,i) => s+(i.magic||0), 0);
  const gear   = [weapon, armor, banner, badge].filter(Boolean);

  return (
    <div className="card" style={{ padding:0, overflow:'hidden', position:'relative' }}>
      {banner && <div style={{ position:'absolute', top:0, left:0, right:0, height:44, background:banner.color, opacity:0.2 }}/>}
      <div style={{ display:'flex', gap:14, padding:'14px 16px', position:'relative', zIndex:1 }}>
        <div style={{ flexShrink:0 }}>
          <PixelCharacter equipped={f.equipped||{}} appearance={f} size={80}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:5 }}>
            {banner && <div style={{ background:banner.color, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.5)' }}>{banner.name}</div>}
            <span style={{ fontWeight:700, fontSize:15 }}>{f.username}</span>
            {badge && <span style={{ fontSize:16 }}>{badge.emoji}</span>}
            <span style={{ background:'var(--bg3)', padding:'2px 8px', borderRadius:99, fontSize:11, color:'var(--text-muted)' }}>Lv.{f.level} {levelTitle(f.level)}</span>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:8 }}>
            <Stat icon="🔥" label="Streak" value={f.best_streak||0}/>
            <Stat icon="✅" label="Today"  value={`${f.completed_today||0}/${f.total_habits||0}`}/>
            {magic>0 && <Stat icon="✨" label="Magic" value={magic}/>}
            <Stat icon="⭐" label="XP"    value={(f.xp||0).toLocaleString()}/>
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {gear.length===0
              ? <span style={{ fontSize:11, color:'var(--text-muted)' }}>No gear equipped</span>
              : gear.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, background:'var(--bg3)', borderRadius:6, padding:'3px 8px', border:`1px solid ${RARITY_COLORS[item.rarity]||'var(--border)'}55`, fontSize:11, color:RARITY_COLORS[item.rarity]||'var(--text-muted)' }}>
                  {item.type==='banner' ? <div style={{ width:10, height:10, borderRadius:2, background:item.color, display:'inline-block' }}/> : <span>{item.emoji}</span>}
                  {item.name}
                </div>
              ))}
          </div>
        </div>
        <button onClick={onRemove} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:16, padding:'4px 8px', borderRadius:6, cursor:'pointer', alignSelf:'flex-start' }}>✕</button>
      </div>
    </div>
  );
}

function PlayerCard({ player, rank }) {
  const medals = ['🥇','🥈','🥉'];
  const banner = player.equipped?.banner;
  const badge  = player.equipped?.badge;
  const weapon = player.equipped?.weapon;
  const magic  = Object.values(player.equipped||{}).filter(Boolean).reduce((s,i) => s+(i.magic||0), 0);

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--bg2)', border:`1px solid ${player.isSelf?'var(--accent)':'var(--border)'}`, borderRadius:12, position:'relative', overflow:'hidden' }}>
      {banner && <div style={{ position:'absolute', inset:0, background:banner.color, opacity:0.12 }}/>}
      <div style={{ fontSize:20, width:28, textAlign:'center', zIndex:1, flexShrink:0 }}>
        {rank<=3 ? medals[rank-1] : <span style={{ color:'var(--text-muted)', fontSize:14 }}>#{rank}</span>}
      </div>
      <div style={{ zIndex:1, flexShrink:0 }}>
        <PixelCharacter equipped={player.equipped||{}} appearance={player} size={60}/>
      </div>
      <div style={{ flex:1, zIndex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4 }}>
          {banner && <div style={{ background:banner.color, borderRadius:4, padding:'1px 7px', fontSize:11, fontWeight:600, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.6)' }}>{banner.name}</div>}
          <span style={{ fontWeight:600 }}>{player.username}{player.isSelf?' (you)':''}</span>
          {badge  && <span style={{ fontSize:15 }}>{badge.emoji}</span>}
          {weapon && <span style={{ fontSize:13 }}>{weapon.emoji}</span>}
          <span style={{ background:player.isSelf?'var(--accent)':'var(--bg3)', color:player.isSelf?'white':'var(--text-muted)', padding:'2px 8px', borderRadius:99, fontSize:11 }}>Lv.{player.level}</span>
        </div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {player.best_streak>0 && <Stat icon="🔥" label="Streak" value={player.best_streak}/>}
          {magic>0              && <Stat icon="✨" label="Magic"  value={magic}/>}
          <Stat icon="⭐" label="XP" value={(player.xp||0).toLocaleString()}/>
        </div>
      </div>
    </div>
  );
}

const S = {
  tabs:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', background:'var(--bg2)', borderRadius:10, padding:4, border:'1px solid var(--border)' },
  tab:{ padding:'8px 4px', border:'none', background:'transparent', color:'var(--text-muted)', fontSize:12, fontWeight:500, borderRadius:7, cursor:'pointer' },
  tabActive:{ background:'var(--bg3)', color:'var(--text)' },
  sectionTitle:{ fontFamily:'Cinzel, serif', fontSize:13, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' },
  rowCard:{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' },
  input:{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none' },
  select:{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none' },
  empty:{ textAlign:'center', padding:32 }
};
