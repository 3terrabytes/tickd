import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

// ── Tuning constants ──────────────────────────────────────────────────
// Player max HP scales with level: 100 + 20 per level. Damage subtracts from
// this in-battle value only; we never decrement real XP server-side on hit.
const playerMaxHp = (level) => 100 + 20 * (level || 1);

// Player attack damage = base power + magic, with light random variance.
const rollDamage = (attack, magic) => {
  const base = (attack.power || 0) + (magic || 0) * 0.5;
  if (!base) return 0;
  const variance = 0.85 + Math.random() * 0.3; // 0.85x to 1.15x
  const crit = Math.random() < 0.12;
  return { dmg: Math.round(base * variance * (crit ? 2 : 1)), crit };
};

// Monster picks a basic hit; uses its power + small variance.
const monsterDamage = (monster, armor) => {
  const variance = 0.9 + Math.random() * 0.2;
  const raw = (monster.power || 0) * variance;
  const mitigated = Math.max(1, raw - armor * 0.4);
  return Math.round(mitigated);
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Animation class lookups
const PLAYER_ANIM = {
  dash: 'battle-player-dash',
  slash: 'battle-player-dash',
  heavy: 'battle-player-heavy',
  spin: 'battle-player-spin',
  parry: 'battle-player-dash',
  missile: 'battle-player-cast',
  fire: 'battle-player-cast',
  frost: 'battle-player-cast',
  arrow: 'battle-player-cast',
  volley: 'battle-player-cast',
  lightning: 'battle-player-cast',
  shockwave: 'battle-player-heavy',
  poison: 'battle-player-cast',
  shadow: 'battle-player-cast',
  guard: 'battle-player-guard',
  heal: 'battle-player-heal',
};

// Optional projectile emoji that flies across the battle field.
const PROJECTILE = {
  missile: { emoji: '✨', color: '#a78bfa' },
  fire:    { emoji: '🔥', color: '#fb923c' },
  frost:   { emoji: '❄️', color: '#67e8f9' },
  arrow:   { emoji: '🏹', color: '#fde047' },
  volley:  { emoji: '🌧️', color: '#a5f3fc' },
  lightning:{ emoji: '⚡', color: '#fde047' },
  poison:  { emoji: '☠️', color: '#86efac' },
  shadow:  { emoji: '🌑', color: '#c4b5fd' },
  shockwave:{ emoji: '💥', color: '#fcd34d' },
};

export default function DungeonPage() {
  const { user, refreshUser } = useAuth();
  const [loadout, setLoadout] = useState(null);  // { slots, slotDetails, available, weaponClass, magic, armor }
  const [inventory, setInventory] = useState({ equipped: {} });
  const [run, setRun] = useState(null);          // { rooms: [monster, ...], currentIndex }
  const [hp, setHp] = useState(0);
  const [maxHp, setMaxHp] = useState(0);
  const [monsterHp, setMonsterHp] = useState(0);
  const [battleState, setBattleState] = useState('idle'); // idle | active | won | lost | rewarded
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editingLoadout, setEditingLoadout] = useState(false);
  const [cooldowns, setCooldowns] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [guarding, setGuarding] = useState(false);
  const [reward, setReward] = useState(null);

  // Visual effect state
  const [playerAnim, setPlayerAnim] = useState('');
  const [monsterAnim, setMonsterAnim] = useState('');
  const [projectile, setProjectile] = useState(null);
  const [damages, setDamages] = useState([]); // {id, target, value, crit, heal}
  const [encounter, setEncounter] = useState(null); // monster being introduced
  const [banner, setBanner] = useState(null);       // big centred banner text
  const [stageShake, setStageShake] = useState(false);
  const [lootDrop, setLootDrop] = useState(null);   // { xp, gold } pop above monster
  const [rewardCount, setRewardCount] = useState({ xp: 0, gold: 0 });

  const addLog = (line) => setLog(l => [...l.slice(-8), line]);
  const popDamage = (target, value, opts = {}) => {
    const id = Date.now() + Math.random();
    setDamages(d => [...d, { id, target, value, ...opts }]);
    setTimeout(() => setDamages(d => d.filter(x => x.id !== id)), 1100);
  };

  // Centred banner ("FIGHT!" / "VICTORY!" / "DEFEAT") shown for ms milliseconds.
  const flashBanner = (text, color, ms = 900) => {
    setBanner({ text, color });
    setTimeout(() => setBanner(null), ms);
  };

  // Shake the battle stage for big hits / crits / boss attacks.
  const shake = (ms = 450) => {
    setStageShake(true);
    setTimeout(() => setStageShake(false), ms);
  };

  // Pre-battle encounter intro: shows the monster name + taunt sliding in,
  // then resolves so the battle proper can start.
  const showEncounter = async (monster) => {
    setEncounter(monster);
    await sleep(1400);
    setEncounter(null);
    flashBanner('FIGHT!', '#fca5a5', 700);
    await sleep(600);
  };

  // Animate the reward XP/gold counters from 0 → final value.
  const countUpReward = (xp, gold) => {
    const steps = 22;
    const dur = 800;
    let i = 0;
    const tick = setInterval(() => {
      i++;
      const t = Math.min(1, i / steps);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setRewardCount({ xp: Math.round(xp * eased), gold: Math.round(gold * eased) });
      if (t >= 1) clearInterval(tick);
    }, dur / steps);
  };

  const loadLoadout = useCallback(async () => {
    const [data, inv] = await Promise.all([
      api.dungeon.loadout(),
      api.avatar.inventory().catch(() => ({ equipped: {} })),
    ]);
    setLoadout(data);
    setInventory(inv);
  }, []);

  useEffect(() => { loadLoadout(); }, [loadLoadout]);

  useEffect(() => {
    if (!user) return;
    setMaxHp(playerMaxHp(user.level));
  }, [user]);

  const startRun = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.dungeon.startRun();
      const mx = playerMaxHp(user.level);
      setRun({ rooms: data.rooms, currentIndex: 0 });
      setHp(mx);
      setMaxHp(mx);
      setMonsterHp(data.rooms[0].hp);
      setCooldowns({ 0: 0, 1: 0, 2: 0, 3: 0 });
      setLog([]);
      addLog(`🚪 You step into the dungeon.`);
      // Show encounter intro before battle starts.
      await showEncounter(data.rooms[0]);
      addLog(`${data.rooms[0].sprite} ${data.rooms[0].name} blocks your path. ${data.rooms[0].taunt}`);
      setBattleState('active');
    } catch (err) {
      addLog('⚠ ' + err.message);
    }
    setBusy(false);
  };

  const advanceRoom = async () => {
    const next = run.currentIndex + 1;
    if (next >= run.rooms.length) {
      flashBanner('DUNGEON CLEARED', '#fde047', 1600);
      await sleep(1700);
      addLog('🏆 You cleared the dungeon!');
      setRun(null);
      setBattleState('idle');
      return;
    }
    const nextMonster = run.rooms[next];
    setRun({ ...run, currentIndex: next });
    setMonsterHp(nextMonster.hp);
    setCooldowns({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setRewardCount({ xp: 0, gold: 0 });
    addLog(`🚪 You move to the next room.`);
    await showEncounter(nextMonster);
    addLog(`${nextMonster.sprite} ${nextMonster.name}. ${nextMonster.taunt}`);
    setBattleState('active');
  };

  const claimReward = async () => {
    const m = run.rooms[run.currentIndex];
    try {
      const res = await api.dungeon.reward(m.id);
      setReward({ xp: res.xp, gold: res.gold });
      addLog(`🏆 +${res.xp} XP · +${res.gold} gold`);
      await refreshUser();
      setBattleState('rewarded');
      // Animate the counters from 0 to the real values.
      setRewardCount({ xp: 0, gold: 0 });
      countUpReward(res.xp, res.gold);
    } catch (err) {
      addLog('⚠ ' + err.message);
    }
  };

  // ── Combat ────────────────────────────────────────────────────────
  const useAttack = async (slotIdx) => {
    if (battleState !== 'active' || busy) return;
    if (cooldowns[slotIdx] > 0) return;
    const attack = loadout.slotDetails[slotIdx];
    if (!attack) return;
    const monster = run.rooms[run.currentIndex];

    setBusy(true);

    // ─ Player turn ─
    const anim = PLAYER_ANIM[attack.animation] || 'battle-player-dash';
    setPlayerAnim(anim);

    const projConfig = PROJECTILE[attack.animation];
    if (projConfig) {
      await sleep(150);
      setProjectile({ ...projConfig, id: Date.now() });
      setTimeout(() => setProjectile(null), 600);
    }

    await sleep(350);

    // Healing path
    if (attack.tag === 'heal') {
      const heal = attack.heal || 30;
      const newHp = Math.min(maxHp, hp + heal);
      setHp(newHp);
      popDamage('player', heal, { heal: true });
      addLog(`💚 ${attack.name}: restored ${heal} HP.`);
      setPlayerAnim('');
    } else if (attack.tag === 'defend') {
      setGuarding(true);
      popDamage('player', 'GUARD', { heal: true });
      addLog(`🛡 ${attack.name}: bracing for impact.`);
      setPlayerAnim('');
    } else {
      // Damage path
      const { dmg, crit } = rollDamage(attack, loadout.magic);
      setMonsterAnim('battle-monster-hurt');
      popDamage('monster', dmg, { crit });
      // Heavy and crit attacks shake the camera.
      if (crit || attack.animation === 'heavy' || attack.animation === 'shockwave' || attack.animation === 'lightning') {
        shake();
      }
      const newMonsterHp = Math.max(0, monsterHp - dmg);
      setMonsterHp(newMonsterHp);
      addLog(`${attack.emoji} ${attack.name} hits ${monster.name} for ${dmg}${crit ? ' (CRIT!)' : ''}.`);

      // Lifesteal
      if (attack.tag === 'lifesteal') {
        const lifesteal = Math.round(dmg / 2);
        const newHp = Math.min(maxHp, hp + lifesteal);
        setHp(newHp);
        popDamage('player', lifesteal, { heal: true });
        addLog(`👻 Drained ${lifesteal} HP.`);
      }

      await sleep(550);
      setPlayerAnim('');
      setMonsterAnim('');

      if (newMonsterHp <= 0) {
        setMonsterAnim('battle-monster-die');
        setLootDrop({ xp: monster.xp, gold: monster.gold, id: Date.now() });
        addLog(`💀 ${monster.name} falls!`);
        await sleep(700);
        flashBanner('VICTORY!', '#fde047', 1100);
        await sleep(600);
        setBattleState('won');
        setBusy(false);
        return;
      }
    }

    // Set cooldown
    setCooldowns(c => ({ ...c, [slotIdx]: attack.cooldown || 0 }));

    // ─ Monster turn ─
    await sleep(300);
    setMonsterAnim('battle-monster-attack');
    await sleep(250);
    let dmg = monsterDamage(monster, loadout.armor);
    if (guarding) {
      dmg = Math.round(dmg * 0.4);
      setGuarding(false);
    }
    setPlayerAnim('battle-player-hurt');
    popDamage('player', dmg);
    const newHp = Math.max(0, hp - (attack.tag === 'heal' ? 0 : dmg) + (attack.tag === 'heal' ? attack.heal || 30 : 0));
    // We already applied heal above; recompute strictly from current hp - dmg
    const finalHp = Math.max(0, (attack.tag === 'heal' ? Math.min(maxHp, hp + (attack.heal || 30)) : hp) - dmg);
    setHp(finalHp);
    addLog(`${monster.sprite} ${monster.name} strikes for ${dmg}.`);
    await sleep(500);
    setMonsterAnim('');
    setPlayerAnim('');

    if (finalHp <= 0) {
      shake(600);
      flashBanner('DEFEAT', '#fca5a5', 1400);
      addLog('💀 You fall. No rewards earned.');
      await sleep(900);
      setBattleState('lost');
      setBusy(false);
      return;
    }
    // Monsters always shake a bit on hit — feels weighty.
    if (dmg > 15) shake(350);

    // Tick cooldowns down for all slots
    setCooldowns(c => {
      const out = {};
      for (let i = 0; i < 4; i++) out[i] = Math.max(0, (i === slotIdx ? (attack.cooldown || 0) : (c[i] || 0)) - (i === slotIdx ? 0 : 1));
      return out;
    });

    setBusy(false);
  };

  const flee = () => {
    setRun(null);
    setBattleState('idle');
    setReward(null);
    addLog('You retreat from the dungeon.');
  };

  // ── Render ────────────────────────────────────────────────────────
  if (!loadout) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  }

  if (editingLoadout) {
    return <LoadoutEditor
      loadout={loadout}
      onSave={async (slots) => {
        await api.dungeon.saveLoadout(slots);
        await loadLoadout();
        setEditingLoadout(false);
      }}
      onCancel={() => setEditingLoadout(false)}
    />;
  }

  // ENTRANCE — show stats + start button
  if (battleState === 'idle' || !run) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
        <div className="card" style={{
          padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 0%, rgba(127,29,29,0.25) 0%, transparent 60%), var(--bg2)',
        }}>
          <span className="dungeon-torch" style={{ position: 'absolute', top: 12, left: 12, fontSize: 22 }}>🔥</span>
          <span className="dungeon-torch right" style={{ position: 'absolute', top: 12, right: 12, fontSize: 22 }}>🔥</span>

          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 4 }}>
            🏰 THE CATACOMBS
          </div>
          <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 26, marginBottom: 4 }}>The Dungeon</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            Six rooms. Escalating monsters. A boss at the end. Die and you get nothing.
          </p>

          {/* Avatar preview — your fighter, dressed for war */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div className="battle-idle" style={{
              position: 'relative',
              filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
            }}>
              <PixelCharacter appearance={user || {}} equipped={inventory.equipped} size={120} />
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
            marginBottom: 20, textAlign: 'left',
          }}>
            <StatChip label="Max HP"    value={maxHp || playerMaxHp(user?.level)} icon="❤️" />
            <StatChip label="Magic"     value={loadout.magic}  icon="✨" />
            <StatChip label="Armor"     value={loadout.armor}  icon="🛡️" />
            <StatChip label="Weapon"    value={loadout.weaponClass || 'unarmed'} icon="🗡️" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>
              EQUIPPED ATTACKS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {loadout.slotDetails.map((a, i) => (
                <div key={i} style={{
                  background: 'var(--bg3)', borderRadius: 8, padding: 8, border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{a.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {a.tag === 'heal' ? `+${a.heal} HP` : `${a.power} dmg`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setEditingLoadout(true)}
              style={{ padding: '10px 18px', fontSize: 13 }}>
              ⚙️ Edit Loadout
            </button>
            <button className="btn btn-primary" onClick={startRun} disabled={busy}
              style={{ padding: '10px 24px', fontSize: 14, background: '#7f1d1d', borderColor: '#ef4444' }}>
              {busy ? '...' : '⚔️ Enter the Dungeon'}
            </button>
          </div>
        </div>

        {log.length > 0 && <LogPanel log={log} />}
      </div>
    );
  }

  const monster = run.rooms[run.currentIndex];
  const playerHpPct = (hp / maxHp) * 100;
  const monsterHpPct = (monsterHp / monster.hp) * 100;

  const isBoss = monster.tier === 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}>
      {/* Dungeon corridor — rooms as connected nodes */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: 'var(--gold)' }}>
            🏰 THE CATACOMBS
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>
            ROOM {run.currentIndex + 1} OF {run.rooms.length}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Dashed path behind the nodes */}
          <div style={{
            position: 'absolute', left: 16, right: 16, top: '50%',
            borderTop: '2px dashed var(--border)', zIndex: 1,
          }} />
          {run.rooms.map((r, i) => {
            const state = i < run.currentIndex ? 'cleared'
              : i === run.currentIndex ? 'current'
              : r.tier === 5 ? 'boss'
              : 'locked';
            return (
              <div key={i}
                className={`corridor-node ${state}`}
                title={state === 'locked' ? '???' : r.name}>
                {state === 'cleared' ? '✓'
                  : r.tier === 5 ? '👑'
                  : state === 'current' ? r.sprite
                  : '?'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Battle stage */}
      <div className={`card ${stageShake ? 'battle-shake' : ''} ${isBoss ? 'boss-room' : ''}`} style={{
        padding: 0, overflow: 'hidden', position: 'relative',
        background: isBoss
          ? 'radial-gradient(circle at 50% 30%, rgba(127,29,29,0.4) 0%, #0a0a0f 70%)'
          : 'radial-gradient(ellipse at 50% 30%, #1f1f3a 0%, #0a0a14 75%)',
        border: `1px solid ${isBoss ? '#7f1d1d' : '#2a2a3a'}`,
        minHeight: 320,
      }}>
        {/* Torches in the corners */}
        <span className="dungeon-torch" style={{ position: 'absolute', top: 8, left: 8, fontSize: 22 }}>🔥</span>
        <span className="dungeon-torch right" style={{ position: 'absolute', top: 8, right: 8, fontSize: 22 }}>🔥</span>

        <div style={{ padding: 16, position: 'relative', minHeight: 320 }}>

          {/* HP bars */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3, color: '#6ee7b7' }}>
                {user?.username} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· Lv {user?.level}</span>
              </div>
              <HpBar value={hp} max={maxHp} color="#10b981" />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3, color: isBoss ? '#fde047' : '#fca5a5' }}>
                {isBoss && '👑 '}{monster.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· T{monster.tier}</span>
              </div>
              <HpBar value={monsterHp} max={monster.hp} color={isBoss ? '#fbbf24' : '#ef4444'} />
            </div>
          </div>

          {/* Combatants */}
          <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 30px' }}>
            {/* Floor shadow under combatants */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20,
              background: 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.6) 0%, transparent 70%)' }} />

            <div className={`${playerAnim || 'battle-idle'}`} style={{ position: 'relative' }}>
              <PixelCharacter appearance={user || {}} equipped={inventory.equipped} size={130} />
              {damages.filter(d => d.target === 'player').map(d => (
                <div key={d.id} className={`battle-damage ${d.heal ? 'heal' : ''} ${d.crit ? 'crit' : ''}`}>
                  {d.heal ? `+${d.value}` : d.value}
                </div>
              ))}
              {guarding && (
                <div style={{
                  position: 'absolute', inset: -10, borderRadius: '50%',
                  border: '2px solid #60a5fa', boxShadow: '0 0 18px #60a5fa88',
                  animation: 'bob 1.2s ease-in-out infinite',
                }} />
              )}
            </div>

            <div className={`${monsterAnim || 'battle-idle'}`} style={{
              position: 'relative',
              fontSize: isBoss ? 140 : 110, lineHeight: 1,
              filter: isBoss ? 'drop-shadow(0 0 24px #ef444466)' : 'none',
            }}>
              <span>{monster.sprite}</span>
              {damages.filter(d => d.target === 'monster').map(d => (
                <div key={d.id} className={`battle-damage ${d.crit ? 'crit' : ''}`}>
                  {d.value}
                </div>
              ))}
              {/* Loot pop on death */}
              {lootDrop && battleState === 'won' && (
                <div key={lootDrop.id} className="loot-pop" style={{
                  position: 'absolute', top: 10, left: '50%',
                  fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: 18,
                  color: '#fcd34d', textShadow: '0 0 8px rgba(0,0,0,0.9), 2px 2px 0 #7c2d12',
                  whiteSpace: 'nowrap',
                }}>
                  +{lootDrop.xp} XP · +{lootDrop.gold} 💰
                </div>
              )}
            </div>

            {projectile && (
              <span key={projectile.id} className="battle-projectile" style={{ color: projectile.color }}>
                {projectile.emoji}
              </span>
            )}
          </div>

          {/* Encounter intro overlay — monster slides in with name + taunt */}
          {encounter && (
            <div className="encounter-banner" style={{
              position: 'absolute', inset: 0, zIndex: 6,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.85) 70%, transparent 100%)',
            }}>
              <div style={{ fontSize: 80, marginBottom: 6 }}>{encounter.sprite}</div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 24, fontWeight: 700, color: encounter.tier === 5 ? '#fde047' : '#fca5a5' }}>
                {encounter.tier === 5 && '👑 '}{encounter.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                "{encounter.taunt}"
              </div>
            </div>
          )}

          {/* Centred banner (FIGHT! / VICTORY! / DEFEAT) */}
          {banner && (
            <div className="battle-banner" style={{ color: banner.color }}>
              {banner.text}
            </div>
          )}
        </div>
      </div>

      {/* Attack buttons / outcome */}
      {battleState === 'active' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {loadout.slotDetails.map((a, i) => {
            const cd = cooldowns[i] || 0;
            const disabled = busy || cd > 0;
            return (
              <button key={i} onClick={() => useAttack(i)} disabled={disabled} style={{
                background: disabled ? 'var(--bg3)' : 'var(--bg2)',
                border: `1px solid ${disabled ? 'var(--border)' : 'var(--accent)'}`,
                borderRadius: 10, padding: 10, cursor: disabled ? 'not-allowed' : 'pointer',
                color: 'var(--text)', textAlign: 'center',
                opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 20, marginBottom: 2 }}>{a.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {cd > 0 ? `Cooldown: ${cd}` : a.tag === 'heal' ? `+${a.heal} HP` : `${a.power} dmg`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {battleState === 'won' && (
        <div className="card animate-fade" style={{
          padding: 18, textAlign: 'center',
          borderColor: '#10b98166', background: 'rgba(16,185,129,0.08)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 20, color: '#6ee7b7', marginBottom: 8 }}>Victory!</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Spoils: {monster.xp} XP &amp; {monster.gold} gold await
          </div>
          <button className="btn btn-primary" onClick={claimReward}
            style={{ padding: '10px 28px', fontSize: 14, background: '#059669', borderColor: '#10b981' }}>
            🏆 Claim Rewards
          </button>
        </div>
      )}

      {battleState === 'rewarded' && (
        <div className="card animate-fade" style={{
          padding: 18, textAlign: 'center',
          borderColor: '#f59e0b66', background: 'rgba(245,158,11,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 14 }}>
            <div className="reward-counter">
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>XP GAINED</div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>
                +{rewardCount.xp}
              </div>
            </div>
            <div className="reward-counter" style={{ animationDelay: '0.15s' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>GOLD</div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>
                +{rewardCount.gold} 💰
              </div>
            </div>
          </div>
          <button className="btn btn-gold" onClick={advanceRoom} style={{ padding: '10px 28px', fontSize: 14 }}>
            {run.currentIndex + 1 >= run.rooms.length ? '🚪 Exit Dungeon' : '🚪 Next Room →'}
          </button>
        </div>
      )}

      {battleState === 'lost' && (
        <div className="card animate-fade" style={{ padding: 16, textAlign: 'center', borderColor: '#ef444466', background: 'rgba(239,68,68,0.08)' }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>💀</div>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 18, color: '#fca5a5', marginBottom: 4 }}>Defeated</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            You return to the entrance empty-handed.
          </div>
          <button className="btn btn-ghost" onClick={flee} style={{ padding: '10px 24px' }}>
            Leave
          </button>
        </div>
      )}

      {battleState === 'active' && (
        <button className="btn btn-ghost" onClick={flee} style={{ padding: '8px', fontSize: 12, alignSelf: 'flex-end' }}>
          🏃 Flee
        </button>
      )}

      <LogPanel log={log} />
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────

function HpBar({ value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ position: 'relative', height: 14, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color,
        transition: 'width 0.4s ease',
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      }}>
        {value} / {max}
      </div>
    </div>
  );
}

function StatChip({ label, value, icon }) {
  return (
    <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function LogPanel({ log }) {
  return (
    <div className="card" style={{ padding: 12, maxHeight: 140, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
        BATTLE LOG
      </div>
      {log.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>The dungeon is quiet.</div>
      ) : log.map((line, i) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2, lineHeight: 1.4 }}>{line}</div>
      ))}
    </div>
  );
}

function LoadoutEditor({ loadout, onSave, onCancel }) {
  const [slots, setSlots] = useState(loadout.slots);
  const [pickerSlot, setPickerSlot] = useState(null);

  const pickAttack = (id) => {
    if (pickerSlot === null) return;
    const newSlots = [...slots];
    newSlots[pickerSlot] = id;
    setSlots(newSlots);
    setPickerSlot(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
      <div className="card" style={{ padding: 16 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 18, marginBottom: 4 }}>Edit Loadout</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          Pick 4 attacks. Available moves depend on your equipped weapon ({loadout.weaponClass || 'unarmed'}).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {slots.map((id, i) => {
            const a = loadout.available.find(x => x.id === id);
            const active = pickerSlot === i;
            return (
              <button key={i} onClick={() => setPickerSlot(i)} style={{
                background: active ? 'rgba(99,102,241,0.18)' : 'var(--bg3)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, padding: 12, cursor: 'pointer', color: 'var(--text)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Slot {i + 1}</div>
                <div style={{ fontSize: 22, margin: '4px 0' }}>{a?.emoji || '➕'}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{a?.name || 'Empty'}</div>
              </button>
            );
          })}
        </div>

        {pickerSlot !== null && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Pick an attack for slot {pickerSlot + 1}:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
              {loadout.available.map(a => {
                const isSelected = slots[pickerSlot] === a.id;
                return (
                  <button key={a.id} onClick={() => pickAttack(a.id)} style={{
                    background: isSelected ? 'rgba(99,102,241,0.18)' : 'var(--bg2)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8, padding: 8, textAlign: 'left',
                    color: 'var(--text)', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{a.emoji} <span style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</span></div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.desc}</div>
                    <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>
                      {a.tag === 'heal' ? `+${a.heal} HP` : `${a.power} dmg`}{a.cooldown ? ` · CD ${a.cooldown}` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ padding: '8px 16px' }}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(slots)} style={{ padding: '8px 16px' }}>Save Loadout</button>
        </div>
      </div>
    </div>
  );
}
