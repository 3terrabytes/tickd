import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function levelTitle(level) {
  const t = ['','Rookie','Apprentice','Explorer','Achiever','Challenger','Warrior','Champion','Master','Grandmaster','Legend'];
  return t[Math.min(level, t.length - 1)];
}

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

const RARITY_COLORS = { common: '#9ca3af', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b' };
const RARITY_BG     = { common: '#9ca3af22', rare: '#3b82f622', epic: '#8b5cf622', legendary: '#f59e0b22' };

// ── Mini streak calendar for a friend ──────────────────────────────────────
function StreakCalendar({ completedDays = [] }) {
  const today = new Date();
  const days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ iso, label: d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) });
  }
  const done = new Set(completedDays.map(d => d.slice(0, 10)));
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last 28 Days</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {days.map(({ iso, label }) => (
          <div key={iso} title={label} style={{
            width: 18, height: 18, borderRadius: 4,
            background: done.has(iso) ? 'var(--green)' : 'var(--bg3)',
            border: `1px solid ${done.has(iso) ? 'var(--green)' : 'var(--border)'}`,
            opacity: done.has(iso) ? 1 : 0.5,
            transition: 'all 0.15s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--green)' }}/>
          Completed
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'var(--bg3)', border: '1px solid var(--border)' }}/>
          Missed
        </span>
      </div>
    </div>
  );
}

// ── Expanded friend profile mini-card ──────────────────────────────────────
function FriendProfileCard({ friend, onClose }) {
  const [details, setDetails] = useState(null);
  useEffect(() => {
    api.profile.get(friend.username).then(setDetails).catch(() => {});
  }, [friend.username]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', border: '1px solid var(--border-bright)',
        borderRadius: 16, padding: 24, maxWidth: 440, width: '100%',
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: friend.avatar_color || '#6366f1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'white', fontSize: 22,
          }}>
            {friend.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 18, margin: 0 }}>{friend.username}</h3>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Lv.{friend.level} {levelTitle(friend.level)}</div>
          </div>
          <Link to={`/users/${friend.username}`} style={{
            fontSize: 12, color: 'var(--accent2)', textDecoration: 'none',
            background: 'var(--bg3)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            Full Profile →
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { icon: '🔥', label: 'Best Streak', val: details?.best_streak != null ? `${details.best_streak}d` : `${friend.best_streak ?? '?'}d` },
            { icon: '⚡', label: 'XP', val: friend.xp?.toLocaleString() ?? '🔒' },
            { icon: '📋', label: 'Habits', val: details?.habits?.length ?? friend.total_habits ?? '?' },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Habits list */}
        {details?.habits?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Habits</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {details.habits.map((h, i) => (
                <span key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>
                  {h.emoji || '🎯'} {h.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Streak calendar */}
        {details?.completed_days && (
          <StreakCalendar completedDays={details.completed_days} />
        )}

        <button onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '10px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Visual item card for trade UI ──────────────────────────────────────────
function VisualItemCard({ item, selected, onClick }) {
  const rarityColor = RARITY_COLORS[item.rarity] || '#9ca3af';
  const rarityBg    = RARITY_BG[item.rarity]    || '#9ca3af22';
  return (
    <button type="button" onClick={() => onClick(item)} style={{
      background: selected ? rarityBg : 'var(--bg3)',
      border: `2px solid ${selected ? rarityColor : 'var(--border)'}`,
      borderRadius: 12, padding: '12px 10px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      transition: 'all 0.15s', transform: selected ? 'scale(1.04)' : 'scale(1)',
      boxShadow: selected ? `0 0 16px ${rarityColor}44` : 'none',
      position: 'relative',
    }}>
      <div style={{ fontSize: 28 }}>{item.type === 'banner' ? '🏷️' : item.emoji}</div>
      <div style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: selected ? rarityColor : 'var(--text)', lineHeight: 1.2 }}>{item.name}</div>
      <div style={{ fontSize: 10, color: rarityColor, fontWeight: 600, textTransform: 'uppercase' }}>{item.rarity}</div>
      {item.magic > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>✨ {item.magic}</div>}
    </button>
  );
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends]           = useState([]);
  const [pending, setPending]           = useState([]);
  const [search, setSearch]             = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requested, setRequested]       = useState(new Set());
  const [tab, setTab]                   = useState('leaderboard');
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Trade state
  const [myInventory, setMyInventory]       = useState([]);
  const [friendInventory, setFriendInventory] = useState([]);
  const [tradeFriend, setTradeFriend]       = useState(null);
  const [myOfferItem, setMyOfferItem]       = useState(null);
  const [wantItem, setWantItem]             = useState(null);
  const [tradeMsg, setTradeMsg]             = useState('');
  const [tradePending, setTradePending]     = useState([]);
  const [tradeStatus, setTradeStatus]       = useState(null);

  // Gift state
  const [giftFriend, setGiftFriend]   = useState(null);
  const [giftItem, setGiftItem]       = useState(null);
  const [giftMsg, setGiftMsg]         = useState('');
  const [giftStatus, setGiftStatus]   = useState(null);

  const load = async () => {
    const [f, p, tp, inv] = await Promise.all([
      api.friends.list(),
      api.friends.pending(),
      api.gifts.tradePending(),
      api.avatar.inventory(),
    ]);
    setFriends(Array.isArray(f) ? f : []);
    setPending(Array.isArray(p) ? p : []);
    setTradePending(Array.isArray(tp) ? tp : []);
    setMyInventory(Array.isArray(inv) ? inv : (inv?.items ?? []));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const results = await api.friends.search(search);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const sendRequest = async (id) => {
    try { await api.friends.request(id); setRequested(s => new Set([...s, id])); } catch {}
  };
  const accept = async (id) => { await api.friends.accept(id); await load(); };
  const remove = async (id) => { await api.friends.remove(id); await load(); };

  const openTrade = async (friend) => {
    setTradeFriend(friend);
    setMyOfferItem(null); setWantItem(null); setTradeMsg(''); setTradeStatus(null);
    const inv = await api.profile.inventory(friend.username).catch(() => []);
    setFriendInventory(Array.isArray(inv) ? inv : (inv?.items ?? []));
    setTab('trade');
  };

  const openGift = (friend) => {
    setGiftFriend(friend);
    setGiftItem(null); setGiftMsg(''); setGiftStatus(null);
    setTab('gift');
  };

  const sendTrade = async () => {
    if (!myOfferItem || !wantItem || !tradeFriend) return;
    try {
      await api.gifts.tradePropose({
        receiver_id: tradeFriend.id,
        offer_item_id: myOfferItem.id,
        want_item_id: wantItem.id,
        message: tradeMsg,
      });
      setTradeStatus({ type: 'success', msg: `Trade proposed to ${tradeFriend.username}!` });
      setMyOfferItem(null); setWantItem(null);
    } catch (e) {
      setTradeStatus({ type: 'error', msg: e.message });
    }
  };

  const sendGift = async () => {
    if (!giftItem || !giftFriend) return;
    try {
      const res = await api.gifts.send({ receiver_id: giftFriend.id, item_id: giftItem.id, message: giftMsg });
      setGiftStatus({ type: 'success', msg: `Gift sent! +${res.xp_gained || 0} XP for your generosity 🎁` });
      setGiftItem(null);
      await load();
    } catch (e) {
      setGiftStatus({ type: 'error', msg: e.message });
    }
  };

  // Leaderboard
  const board = [
    { id: user?.id, username: user?.username + ' (you)', xp: user?.xp || 0, level: user?.level || 1, avatar_color: user?.avatar_color, isSelf: true },
    ...friends
  ].sort((a, b) => b.xp - a.xp);

  const TABS = [
    { key: 'leaderboard', label: '🏆 Board' },
    { key: 'friends',     label: `👥 Friends${pending.length ? ` (${pending.length})` : ''}` },
    { key: 'find',        label: '🔍 Find' },
    { key: 'gift',        label: '🎁 Gift' },
    { key: 'trade',       label: `⚔️ Trade${tradePending.length ? ` (${tradePending.length})` : ''}` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>

      {selectedFriend && (
        <FriendProfileCard friend={selectedFriend} onClose={() => setSelectedFriend(null)} />
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 12, padding: 4, border: '1px solid var(--border)', gap: 2, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, minWidth: 70, padding: '9px 6px', border: 'none', borderRadius: 9, cursor: 'pointer',
            background: tab === t.key ? 'var(--bg3)' : 'transparent',
            color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Click a player to view their profile
          </p>
          {board.map((p, i) => (
            <PlayerCard key={p.id} player={p} rank={i + 1}
              onClick={() => !p.isSelf && setSelectedFriend(p)} />
          ))}
        </div>
      )}

      {/* ── FRIENDS ── */}
      {tab === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pending.length > 0 && (
            <div>
              <SectionTitle>Pending Requests</SectionTitle>
              {pending.map(p => (
                <div key={p.id} style={S.friendRow} className="card">
                  <Avatar user={p} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{p.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{p.level} {levelTitle(p.level)}</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => accept(p.id)}>Accept</button>
                  <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => remove(p.id)}>Decline</button>
                </div>
              ))}
            </div>
          )}

          <SectionTitle>Your Friends ({friends.length})</SectionTitle>
          {friends.length === 0 && (
            <div style={S.empty}><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No friends yet — find players below!</p></div>
          )}
          {friends.map(f => (
            <div key={f.id} className="card" style={{ ...S.friendRow, cursor: 'pointer' }}
              onClick={() => setSelectedFriend(f)}>
              <Avatar user={f} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{f.username}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Lv.{f.level} · {f.completed_today}/{f.total_habits} today · 🔥{f.best_streak}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => openGift(f)}>🎁</button>
                <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => openTrade(f)}>⚔️</button>
                <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11, color: 'var(--red)' }} onClick={() => remove(f.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FIND ── */}
      {tab === 'find' && (
        <div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by username..." style={S.input} autoFocus />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {searchResults.map(u => {
              const isFriend = friends.some(f => f.id === u.id);
              const sent = requested.has(u.id);
              return (
                <div key={u.id} style={S.friendRow} className="card">
                  <Avatar user={u} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lv.{u.level} {levelTitle(u.level)}</div>
                  </div>
                  {isFriend ? (
                    <span style={{ fontSize: 12, color: 'var(--green)' }}>✓ Friends</span>
                  ) : sent ? (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sent!</span>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => sendRequest(u.id)}>+ Add</button>
                  )}
                </div>
              );
            })}
            {search && searchResults.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 24 }}>No players found</p>
            )}
          </div>
        </div>
      )}

      {/* ── GIFT ── */}
      {tab === 'gift' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 16, marginBottom: 16 }}>🎁 Send a Gift</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Give an item from your inventory. You'll earn XP based on the rarity!
          </p>

          {/* Pick friend */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>To</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {friends.map(f => (
                <button key={f.id} type="button" onClick={() => setGiftFriend(f)} style={{
                  padding: '8px 14px', borderRadius: 8, border: `1px solid ${giftFriend?.id === f.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: giftFriend?.id === f.id ? 'rgba(99,102,241,0.15)' : 'var(--bg3)',
                  color: giftFriend?.id === f.id ? 'var(--accent2)' : 'var(--text-muted)',
                  fontSize: 13, cursor: 'pointer',
                }}>
                  {f.username}
                </button>
              ))}
              {friends.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add friends first!</p>}
            </div>
          </div>

          {/* Pick item */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Item to Gift</div>
            {myInventory.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Your inventory is empty. Buy items in the Avatar shop!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 8 }}>
                {myInventory.map(item => (
                  <VisualItemCard key={item.id} item={item} selected={giftItem?.id === item.id} onClick={setGiftItem} />
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <input value={giftMsg} onChange={e => setGiftMsg(e.target.value)}
            placeholder="Message (optional)" style={{ ...S.input, marginBottom: 12 }} />

          {giftStatus && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: giftStatus.type === 'success' ? '#064e3b' : '#7f1d1d',
              color: giftStatus.type === 'success' ? '#6ee7b7' : '#fca5a5',
              fontSize: 13, border: `1px solid ${giftStatus.type === 'success' ? '#10b98155' : '#ef444455'}`,
            }}>{giftStatus.msg}</div>
          )}

          <button className="btn btn-gold" style={{ padding: '12px 24px', fontSize: 14 }}
            disabled={!giftFriend || !giftItem} onClick={sendGift}>
            Send Gift 🎁
          </button>
        </div>
      )}

      {/* ── TRADE ── */}
      {tab === 'trade' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Incoming trades */}
          {tradePending.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 14, marginBottom: 12, color: 'var(--gold)' }}>⚔️ Incoming Trades</h3>
              {tradePending.map(trade => (
                <div key={trade.id} style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    <strong>{trade.sender_name}</strong> offers <strong>{trade.offer_item_name}</strong> for your <strong>{trade.want_item_name}</strong>
                  </div>
                  {trade.message && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>"{trade.message}"</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}
                      onClick={() => api.gifts.tradeAccept(trade.id).then(load)}>Accept</button>
                    <button className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}
                      onClick={() => api.gifts.tradeDecline(trade.id).then(load)}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Propose trade */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'Cinzel,serif', fontSize: 16, marginBottom: 16 }}>⚔️ Propose a Trade</h3>

            {/* Pick friend */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Trade With</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {friends.map(f => (
                  <button key={f.id} type="button" onClick={() => openTrade(f)} style={{
                    padding: '8px 14px', borderRadius: 8, border: `1px solid ${tradeFriend?.id === f.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: tradeFriend?.id === f.id ? 'rgba(99,102,241,0.15)' : 'var(--bg3)',
                    color: tradeFriend?.id === f.id ? 'var(--accent2)' : 'var(--text-muted)',
                    fontSize: 13, cursor: 'pointer',
                  }}>
                    {f.username}
                  </button>
                ))}
                {friends.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Add friends first!</p>}
              </div>
            </div>

            {tradeFriend && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 12, alignItems: 'start', marginBottom: 16 }}>
                  {/* My offer */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>You Offer</div>
                    {myInventory.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Empty inventory</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: 6 }}>
                        {myInventory.map(item => (
                          <VisualItemCard key={item.id} item={item} selected={myOfferItem?.id === item.id} onClick={setMyOfferItem} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 40, fontSize: 20, color: 'var(--text-muted)' }}>⇌</div>

                  {/* They offer */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>You Want</div>
                    {friendInventory.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tradeFriend.username}'s inventory is empty or private</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: 6 }}>
                        {friendInventory.map(item => (
                          <VisualItemCard key={item.id} item={item} selected={wantItem?.id === item.id} onClick={setWantItem} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {(myOfferItem || wantItem) && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, border: '1px solid var(--border)' }}>
                    {myOfferItem && <span>Your <strong style={{ color: RARITY_COLORS[myOfferItem.rarity] }}>{myOfferItem.name}</strong></span>}
                    {myOfferItem && wantItem && <span style={{ color: 'var(--text-muted)' }}> for </span>}
                    {wantItem && <span>their <strong style={{ color: RARITY_COLORS[wantItem.rarity] }}>{wantItem.name}</strong></span>}
                  </div>
                )}

                <input value={tradeMsg} onChange={e => setTradeMsg(e.target.value)}
                  placeholder="Message (optional)" style={{ ...S.input, marginBottom: 12 }} />

                {tradeStatus && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                    background: tradeStatus.type === 'success' ? '#064e3b' : '#7f1d1d',
                    color: tradeStatus.type === 'success' ? '#6ee7b7' : '#fca5a5',
                    fontSize: 13, border: `1px solid ${tradeStatus.type === 'success' ? '#10b98155' : '#ef444455'}`,
                  }}>{tradeStatus.msg}</div>
                )}

                <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}
                  disabled={!myOfferItem || !wantItem} onClick={sendTrade}>
                  Propose Trade ⚔️
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: user.avatar_color || '#6366f1',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Cinzel, serif', fontWeight: 700, color: 'white', fontSize: 16, flexShrink: 0,
    }}>
      {user.username?.[0]?.toUpperCase()}
    </div>
  );
}

function PlayerCard({ player, rank, onClick }) {
  const medals = ['🥇', '🥈', '🥉'];
  const xpPrev = Math.floor(100 * Math.pow(player.level, 1.5));
  const xpNext = xpForLevel(player.level + 1);
  const pct    = Math.min(((player.xp - xpPrev) / (xpNext - xpPrev)) * 100, 100);

  return (
    <div onClick={onClick} style={{
      ...S.playerCard,
      cursor: player.isSelf ? 'default' : 'pointer',
      ...(player.isSelf ? { borderColor: 'var(--accent)', background: 'rgba(99,102,241,0.08)' } : {}),
      transition: 'all 0.15s',
    }}
    className="card"
    onMouseEnter={e => { if (!player.isSelf) e.currentTarget.style.borderColor = 'var(--border-bright)'; }}
    onMouseLeave={e => { if (!player.isSelf) e.currentTarget.style.borderColor = ''; }}>
      <div style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
        {rank <= 3 ? medals[rank - 1] : <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>#{rank}</span>}
      </div>
      <Avatar user={player} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{player.username}</span>
          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, background: player.isSelf ? 'var(--accent)' : 'var(--bg3)', color: player.isSelf ? 'white' : 'var(--text-muted)' }}>
            Lv.{player.level}
          </span>
        </div>
        <div className="xp-bar-wrap" style={{ marginTop: 4 }}>
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>{player.xp.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>XP</div>
      </div>
      {!player.isSelf && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</h3>;
}

const S = {
  friendRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  playerCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' },
  input: {
    width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  },
  empty: { textAlign: 'center', padding: 32 },
};
