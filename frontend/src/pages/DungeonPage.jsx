import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PixelCharacter from '../components/PixelCharacter';

// ── Constants ────────────────────────────────────────────────────────
const HAND_SIZE = 5;
const MAX_ENERGY = 3;
const playerMaxHp = (level) => 100 + 20 * (level || 1);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const PET_DMG = { common: 4, rare: 8, epic: 14, legendary: 22, mythic: 32 };

const PLAYER_ANIM = {
  dash: 'battle-player-dash', slash: 'battle-player-dash', heavy: 'battle-player-heavy',
  spin: 'battle-player-spin', parry: 'battle-player-dash', missile: 'battle-player-cast',
  fire: 'battle-player-cast', frost: 'battle-player-cast', arrow: 'battle-player-cast',
  volley: 'battle-player-cast', lightning: 'battle-player-cast', shockwave: 'battle-player-heavy',
  poison: 'battle-player-cast', shadow: 'battle-player-cast', guard: 'battle-player-guard',
  heal: 'battle-player-heal',
};

const PROJECTILE = {
  missile: { emoji: '✨', color: '#a78bfa' }, fire: { emoji: '🔥', color: '#fb923c' },
  frost: { emoji: '❄️', color: '#67e8f9' },  arrow: { emoji: '🏹', color: '#fde047' },
  volley: { emoji: '🌧️', color: '#a5f3fc' }, lightning: { emoji: '⚡', color: '#fde047' },
  poison: { emoji: '☠️', color: '#86efac' }, shadow: { emoji: '🌑', color: '#c4b5fd' },
  shockwave: { emoji: '💥', color: '#fcd34d' },
};

const RARITY_COLOR = {
  starter: '#9ca3af', common: '#3b82f6', uncommon: '#8b5cf6', rare: '#f59e0b', mythic: '#f0abfc',
};

// Shuffle helper
const shuf = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

let cardInstanceCounter = 0;
// Each card in deck/hand needs a unique instance id so React can key them
// even when the same card appears multiple times in hand.
const instance = (card) => ({ ...card, _iid: ++cardInstanceCounter });

const computeIntent = (monster, t) => {
  if (t > 0 && t % 3 === 0) {
    const p = Math.round(monster.power * 1.6);
    return { kind: 'heavy', power: p, label: `${p}`, icon: '💥', tone: '#f97316' };
  }
  if (monster.tier >= 3 && t > 0 && t % 4 === 0) {
    return { kind: 'defend', power: 0, label: 'Defend', icon: '🛡', tone: '#60a5fa' };
  }
  return { kind: 'strike', power: monster.power, label: `${monster.power}`, icon: '⚔️', tone: '#fca5a5' };
};

// ── Main page ────────────────────────────────────────────────────────
export default function DungeonPage() {
  const { user, refreshUser } = useAuth();

  // Catalogue + per-run state
  const [starter, setStarter] = useState(null);  // { deck, available, weaponClass, magic, armor }
  const [inventory, setInventory] = useState({ equipped: {} });
  const [biomes, setBiomes] = useState([]);
  const [selectedBiome, setSelectedBiome] = useState('catacombs');
  const [selectedAscension, setSelectedAscension] = useState(0);

  // Run state
  const [run, setRun] = useState(null);            // { map, biome, ascension }
  const [position, setPosition] = useState(null);  // current node id
  const [phase, setPhase] = useState('entrance');  // entrance | map | battle | shop | rest | treasure | event | rewarded | card_reward | dead | cleared
  const [activeNode, setActiveNode] = useState(null);

  // Player run-vitals
  const [hp, setHp] = useState(0);
  const [maxHp, setMaxHp] = useState(0);
  const [gold, setGold] = useState(0); // dungeon-only sub-purse
  const [potions, setPotions] = useState([]);
  const [relics, setRelics] = useState([]);

  // Combat state
  const [deck, setDeck] = useState([]);            // master deck (full library)
  const [drawPile, setDrawPile] = useState([]);
  const [hand, setHand] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [exhaustPile, setExhaustPile] = useState([]);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [block, setBlock] = useState(0);
  const [monsterHp, setMonsterHp] = useState(0);
  const [statuses, setStatuses] = useState({});
  const [intent, setIntent] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [busy, setBusy] = useState(false);

  // Visuals
  const [log, setLog] = useState([]);
  const [toast, setToast] = useState(null);
  const [playerAnim, setPlayerAnim] = useState('');
  const [monsterAnim, setMonsterAnim] = useState('');
  const [petAnim, setPetAnim] = useState('');
  const [projectile, setProjectile] = useState(null);
  const [damages, setDamages] = useState([]);
  const [encounter, setEncounter] = useState(null);
  const [banner, setBanner] = useState(null);
  const [stageShake, setStageShake] = useState(false);
  const [rewardCount, setRewardCount] = useState({ xp: 0, gold: 0 });
  const [rewardCardChoices, setRewardCardChoices] = useState([]);

  // Shop / treasure
  const [shopOffer, setShopOffer] = useState([]);
  const [potionCatalog, setPotionCatalog] = useState([]);

  // ── Helpers ─────────────────────────────────────────────────────────
  const addLog = (line) => setLog(l => [...l.slice(-9), line]);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };
  const popDamage = (target, value, opts = {}) => {
    const id = Date.now() + Math.random();
    setDamages(d => [...d, { id, target, value, ...opts }]);
    setTimeout(() => setDamages(d => d.filter(x => x.id !== id)), 1100);
  };
  const flashBanner = (text, color, ms = 900) => {
    setBanner({ text, color });
    setTimeout(() => setBanner(null), ms);
  };
  const shake = (ms = 450) => {
    setStageShake(true);
    setTimeout(() => setStageShake(false), ms);
  };
  const showEncounter = async (monster) => {
    setEncounter(monster);
    await sleep(1400);
    setEncounter(null);
    flashBanner('FIGHT!', '#fca5a5', 700);
    await sleep(550);
  };

  // ── Initial load ───────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [ld, inv, bm, pots] = await Promise.all([
        api.dungeon.loadout(),
        api.avatar.inventory().catch(() => ({ equipped: {} })),
        api.dungeon.biomes(),
        api.dungeon.potions(),
      ]);
      setStarter(ld);
      setInventory(inv);
      setBiomes(bm);
      setPotionCatalog(pots);
    } catch (err) {
      addLog('⚠ Load failed: ' + (err.message || 'unknown'));
    }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Apply relic effects at hooks ───────────────────────────────────
  const relicSum = (effectType) => relics.reduce((sum, r) =>
    r.effect?.type === effectType ? sum + (r.effect.value || 0) : sum, 0);
  const hasRelic = (id) => relics.some(r => r.id === id);

  // Pet damage based on equipped companion's rarity
  const petBaseDamage = () => {
    const pet = inventory?.equipped?.companion;
    if (!pet) return 0;
    return PET_DMG[pet.rarity] || 4;
  };

  // ── Start a new run ─────────────────────────────────────────────────
  const startRun = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.dungeon.startRun({ biome: selectedBiome, ascension: selectedAscension });
      const mx = playerMaxHp(user.level) + relicSum('max_hp');
      setRun(data);
      const start = data.map.nodes.find(n => n.type === 'start');
      setPosition(start?.id ?? null);
      setHp(mx);
      setMaxHp(mx);
      setGold(0);
      setPotions([]);
      setRelics([]);
      setLog([]);
      setPhase('map');
      addLog(`🚪 You enter ${data.biome?.name || 'the dungeon'}${data.ascension ? ` · Ascension ${data.ascension}` : ''}.`);
    } catch (err) {
      addLog('⚠ ' + err.message);
    }
    setBusy(false);
  };

  // ── Combat lifecycle ────────────────────────────────────────────────
  const beginCombat = async (node) => {
    if (!node?.monster) {
      addLog('⚠ Bad monster data — returning to map.');
      setPhase('map');
      return;
    }
    setActiveNode(node);
    setMonsterHp(node.monster.hp);
    setTurnCount(0);
    setStatuses({});
    setIntent(computeIntent(node.monster, 0));

    // Shuffle deck into draw pile, clear hand/discard/exhaust
    const drawDeck = shuf(deck.length ? deck : starter.deck.map(instance));
    if (!deck.length) setDeck(drawDeck); // first-ever combat in run
    setDrawPile(drawDeck);
    setHand([]);
    setDiscardPile([]);
    setExhaustPile([]);

    // Energy + block, with relic hooks
    setEnergy(MAX_ENERGY + relicSum('energy'));
    setBlock(relicSum('block'));
    // Combat-start heal relics
    const healAtStart = relics.reduce((s, r) => r.hook === 'combat_start' && r.effect?.type === 'heal' ? s + r.effect.value : s, 0);
    if (healAtStart > 0) {
      setHp(prev => Math.min(maxHp, prev + healAtStart));
      addLog(`💖 Relics heal you for ${healAtStart} HP.`);
    }

    setPhase('battle');
    await showEncounter(node.monster);
    addLog(`${node.monster.sprite} ${node.monster.name}. ${node.monster.taunt}`);
    // Draw initial hand
    drawN(HAND_SIZE);
  };

  // Move N cards from drawPile to hand, reshuffling discard if needed.
  const drawN = (n) => {
    setDrawPile(prevDraw => {
      setDiscardPile(prevDisc => {
        let draw = [...prevDraw];
        let disc = [...prevDisc];
        const drawn = [];
        for (let i = 0; i < n; i++) {
          if (!draw.length) {
            if (!disc.length) break;
            draw = shuf(disc);
            disc = [];
          }
          drawn.push(draw.shift());
        }
        setHand(h => [...h, ...drawn]);
        return disc;
      });
      // The functional update for drawPile happens via setDrawPile's next render —
      // but because we also need the hand to actually update, we do it in the
      // discard updater above. Now return the *new* drawPile from this updater.
      return prevDraw; // placeholder — corrected synchronously below
    });
    // The above pattern is messy with React batching; simpler version:
  };

  // Simpler synchronous draw — read latest state from refs/locals each call.
  const drawCards = (n, fromDraw = null, fromDisc = null) => {
    let draw = fromDraw !== null ? [...fromDraw] : [...drawPile];
    let disc = fromDisc !== null ? [...fromDisc] : [...discardPile];
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (!draw.length) {
        if (!disc.length) break;
        draw = shuf(disc);
        disc = [];
      }
      drawn.push(draw.shift());
    }
    setDrawPile(draw);
    setDiscardPile(disc);
    setHand(h => [...h, ...drawn]);
  };

  // ── Play a card ─────────────────────────────────────────────────────
  const playCard = async (card, idx) => {
    if (phase !== 'battle' || busy) return;
    if (energy < (card.energyCost || 1)) {
      showToast('Not enough energy', 'error');
      return;
    }
    const monster = activeNode?.monster;
    if (!monster) return;

    setBusy(true);

    // Pay energy; move card out of hand
    setEnergy(e => e - (card.energyCost || 1));
    setHand(h => h.filter((_, i) => i !== idx));

    // Animate player
    const anim = PLAYER_ANIM[card.animation] || 'battle-player-dash';
    setPlayerAnim(anim);
    const projConfig = PROJECTILE[card.animation];
    if (projConfig) {
      await sleep(120);
      setProjectile({ ...projConfig, id: Date.now() });
      setTimeout(() => setProjectile(null), 600);
    }
    await sleep(300);

    let monsterHpAfter = monsterHp;

    // Apply block FIRST (skills with block)
    if (card.block) {
      setBlock(b => b + card.block);
      popDamage('player', `+${card.block}🛡`, { heal: true });
      addLog(`🛡 ${card.name}: +${card.block} block.`);
    }

    // Then heal / damage
    if (card.tag === 'heal') {
      const heal = card.heal || 20;
      setHp(prev => Math.min(maxHp, prev + heal));
      popDamage('player', heal, { heal: true });
      addLog(`💚 ${card.name}: restored ${heal} HP.`);
    } else if (card.power > 0) {
      // Dmg = power + magic/4 + first-hit-bonus relic + toy-hammer +1
      const magicBonus = Math.floor((starter?.magic || 0) / 4);
      const firstHitBonus = (relicSum('first_hit_bonus') && turnCount === 0) ? relicSum('first_hit_bonus') : 0;
      const dmgBonus = relicSum('damage_bonus');
      const variance = 0.9 + Math.random() * 0.2;
      const crit = Math.random() < 0.10;
      const raw = ((card.power || 0) + magicBonus + firstHitBonus + dmgBonus) * variance * (crit ? 2 : 1);
      const dmg = Math.max(1, Math.round(raw));
      monsterHpAfter = Math.max(0, monsterHp - dmg);
      setMonsterHp(monsterHpAfter);
      setMonsterAnim('battle-monster-hurt');
      popDamage('monster', dmg, { crit });
      if (crit || ['heavy', 'shockwave', 'lightning'].includes(card.animation)) shake();
      addLog(`${card.emoji} ${card.name}: ${dmg} dmg${crit ? ' CRIT!' : ''}.`);

      if (card.tag === 'burn' && monsterHpAfter > 0) {
        setStatuses(s => ({ ...s, burn: 3 }));
        addLog(`🔥 ${monster.name} is BURNING.`);
      } else if (card.tag === 'poison' && monsterHpAfter > 0) {
        setStatuses(s => ({ ...s, poison: 3 }));
        addLog(`☠️ ${monster.name} is POISONED.`);
      } else if (card.tag === 'stun' && monsterHpAfter > 0) {
        setStatuses(s => ({ ...s, stun: 1 }));
        addLog(`⚡ ${monster.name} is STUNNED.`);
      } else if (card.tag === 'lifesteal') {
        const ls = Math.round(dmg / 2);
        setHp(prev => Math.min(maxHp, prev + ls));
        popDamage('player', ls, { heal: true });
        addLog(`👻 Drained ${ls} HP.`);
      } else if (card.tag === 'draw') {
        drawCards(1);
        addLog(`🃏 Drew 1 extra.`);
      }

      await sleep(500);
      setPlayerAnim('');
      setMonsterAnim('');
    } else {
      await sleep(200);
      setPlayerAnim('');
    }

    // Pet auto-attack
    const petDmg = petBaseDamage();
    if (petDmg > 0 && monsterHpAfter > 0 && card.cardType === 'attack') {
      setPetAnim('pet-attack');
      await sleep(180);
      setMonsterAnim('battle-monster-hurt');
      popDamage('monster', petDmg, {});
      monsterHpAfter = Math.max(0, monsterHpAfter - petDmg);
      setMonsterHp(monsterHpAfter);
      const petName = inventory?.equipped?.companion?.name || 'Companion';
      addLog(`${inventory?.equipped?.companion?.emoji || '🐾'} ${petName}: ${petDmg} dmg.`);
      await sleep(380);
      setPetAnim('');
      setMonsterAnim('');
    }

    // Move card to discard (or exhaust if card-specific)
    setDiscardPile(d => [...d, card]);

    // Monster dead?
    if (monsterHpAfter <= 0) {
      await sleep(200);
      setMonsterAnim('battle-monster-die');
      addLog(`💀 ${monster.name} falls.`);
      // Lucky coin / on-kill gold relic
      const goldRelic = relicSum('gold');
      if (goldRelic > 0) setGold(g => g + goldRelic);
      await sleep(700);
      flashBanner('VICTORY!', '#fde047', 1100);
      await sleep(500);
      // Claim reward
      try {
        const res = await api.dungeon.reward(monster.id);
        setRewardCount({ xp: 0, gold: 0 });
        countUpReward(res.xp, res.gold);
        setGold(g => g + res.gold);
        // Pull 3 card choices for the reward step
        const tier = monster.tier || 1;
        try {
          const r = await api.dungeon.rewardCards(tier);
          setRewardCardChoices(r.cards || []);
        } catch { setRewardCardChoices([]); }
        await refreshUser();
      } catch (err) { addLog('⚠ ' + err.message); }
      setPhase('rewarded');
      setBusy(false);
      return;
    }

    setBusy(false);
  };

  // Animate XP/gold counter
  const countUpReward = (xp, gold) => {
    const steps = 22;
    let i = 0;
    const tick = setInterval(() => {
      i++;
      const t = Math.min(1, i / steps);
      const eased = 1 - Math.pow(1 - t, 3);
      setRewardCount({ xp: Math.round(xp * eased), gold: Math.round(gold * eased) });
      if (t >= 1) clearInterval(tick);
    }, 800 / steps);
  };

  // ── End turn ─────────────────────────────────────────────────────
  const endTurn = async () => {
    if (phase !== 'battle' || busy) return;
    setBusy(true);
    const monster = activeNode?.monster;
    if (!monster) { setBusy(false); return; }

    // Discard hand
    setDiscardPile(d => [...d, ...hand]);
    setHand([]);

    // DoT ticks
    let dotDmg = 0;
    let nextStatuses = { ...statuses };
    if ((nextStatuses.burn || 0) > 0) { dotDmg += 6; nextStatuses.burn -= 1; popDamage('monster', 6, {}); addLog('🔥 Burn -6.'); }
    if ((nextStatuses.poison || 0) > 0) { dotDmg += 4; nextStatuses.poison -= 1; popDamage('monster', 4, {}); addLog('☠️ Poison -4.'); }

    let mhp = monsterHp;
    if (dotDmg > 0) {
      mhp = Math.max(0, mhp - dotDmg);
      setMonsterHp(mhp);
      await sleep(400);
      if (mhp <= 0) {
        setMonsterAnim('battle-monster-die');
        addLog(`💀 ${monster.name} succumbs.`);
        await sleep(700);
        flashBanner('VICTORY!', '#fde047', 1100);
        await sleep(500);
        try {
          const res = await api.dungeon.reward(monster.id);
          setRewardCount({ xp: 0, gold: 0 });
          countUpReward(res.xp, res.gold);
          setGold(g => g + res.gold);
          const r = await api.dungeon.rewardCards(monster.tier || 1).catch(() => ({ cards: [] }));
          setRewardCardChoices(r.cards || []);
          await refreshUser();
        } catch (err) { addLog('⚠ ' + err.message); }
        setPhase('rewarded');
        setBusy(false);
        return;
      }
    }
    setStatuses(nextStatuses);

    // Monster's turn (or skipped if stunned)
    const currIntent = intent || computeIntent(monster, turnCount);
    await sleep(250);
    if ((nextStatuses.stun || 0) > 0) {
      setStatuses(s => ({ ...s, stun: 0 }));
      addLog(`⚡ ${monster.name} is stunned — skips turn.`);
      await sleep(380);
    } else if (currIntent.kind === 'defend') {
      addLog(`🛡 ${monster.name} braces.`);
      await sleep(380);
    } else {
      setMonsterAnim('battle-monster-attack');
      await sleep(220);
      const power = currIntent.power;
      const armor = starter?.armor || 0;
      const variance = 0.9 + Math.random() * 0.2;
      let raw = Math.max(1, power * variance - armor * 0.4);
      let dmg = Math.round(raw);
      // Block absorbs first
      const absorbed = Math.min(block, dmg);
      const newBlock = block - absorbed;
      const through = dmg - absorbed;
      setBlock(newBlock);
      setPlayerAnim('battle-player-hurt');
      popDamage('player', dmg, { crit: currIntent.kind === 'heavy' });
      setHp(prev => {
        const next = Math.max(0, prev - through);
        if (next <= 0) {
          // Phoenix Egg revive
          if (hasRelic('phoenix_egg') && !relics.find(r => r.id === 'phoenix_egg')._used) {
            const revivedHp = Math.round(maxHp * 0.3);
            setRelics(rs => rs.map(r => r.id === 'phoenix_egg' ? { ...r, _used: true } : r));
            flashBanner('REVIVED!', '#fde047', 1200);
            addLog('🥚 Phoenix Egg revives you.');
            return revivedHp;
          }
          (async () => {
            shake(600);
            flashBanner('DEFEAT', '#fca5a5', 1400);
            addLog('💀 You fall.');
            await sleep(900);
            setPhase('dead');
            setBusy(false);
          })();
        }
        return next;
      });
      addLog(`${monster.sprite} ${monster.name}: ${dmg} dmg (${absorbed} blocked).`);
      await sleep(450);
      setMonsterAnim('');
      setPlayerAnim('');
      if (dmg > 15 || currIntent.kind === 'heavy') shake(350);
    }

    // Tick to next turn — reset energy/block, draw new hand
    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    setIntent(computeIntent(monster, nextTurn));
    // Sundial relic: +1 energy every 3rd turn
    const sundialBonus = (hasRelic('sundial') && nextTurn > 0 && nextTurn % 3 === 0) ? 1 : 0;
    setEnergy(MAX_ENERGY + relicSum('energy') + sundialBonus);
    setBlock(0);
    const handCount = HAND_SIZE + relicSum('extra_draw');
    // Draw fresh hand
    setTimeout(() => drawCards(handCount, drawPile, [...discardPile, ...hand]), 50);

    setBusy(false);
  };

  // ── Card reward step ─────────────────────────────────────────────
  const pickRewardCard = (card) => {
    if (card) {
      setDeck(d => [...d, instance(card)]);
      addLog(`🃏 Added ${card.name} to your deck.`);
    }
    setRewardCardChoices([]);
    setPhase('map');
  };
  const skipRewardCard = () => { setRewardCardChoices([]); setPhase('map'); };

  // ── Room navigation ──────────────────────────────────────────────
  const enterNode = async (node) => {
    if (!node) return;
    setActiveNode(node);
    setPosition(node.id);
    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      await beginCombat(node);
    } else if (node.type === 'shop') {
      setShopOffer(shuf([...potionCatalog]).slice(0, 3));
      setPhase('shop');
    } else if (node.type === 'rest') {
      setPhase('rest');
    } else if (node.type === 'treasure') {
      setPhase('treasure');
    } else if (node.type === 'event') {
      setPhase('event');
    }
  };

  const claimTreasure = async () => {
    try {
      const tier = Math.max(1, Math.floor((activeNode?.floor || 1) / 1.5));
      const res = await api.dungeon.treasure(tier);
      setGold(g => g + res.gold);
      addLog(`💰 Treasure: +${res.gold} gold.`);
      // 50% chance of also dropping a relic.
      if (Math.random() < 0.5) {
        const r = await api.dungeon.pickRelic('uncommon').catch(() => null);
        if (r?.relic) {
          setRelics(rs => [...rs, r.relic]);
          addLog(`✨ Found relic: ${r.relic.emoji} ${r.relic.name}.`);
        }
      }
      setPhase('map');
    } catch (err) { addLog('⚠ ' + err.message); }
  };

  const buyPotion = async (potionId) => {
    const p = shopOffer.find(x => x.id === potionId);
    if (!p) return;
    if (gold < p.cost) { showToast('Not enough gold', 'error'); return; }
    setGold(g => g - p.cost);
    setPotions(ps => [...ps, p]);
    setShopOffer(s => s.filter(x => x.id !== potionId));
    addLog(`🧪 Bought ${p.name}.`);
  };

  const rest = () => {
    const healed = Math.round(maxHp * 0.3);
    setHp(prev => Math.min(maxHp, prev + healed));
    addLog(`🍖 Rested. +${healed} HP.`);
    setPhase('map');
  };

  const upgradeRandomCard = () => {
    // Pick a random non-starter card and bump its power.
    const upgradable = deck.length ? deck : starter.deck.map(instance);
    const idx = Math.floor(Math.random() * upgradable.length);
    const card = upgradable[idx];
    if (!card) { setPhase('map'); return; }
    const upgraded = { ...card, power: Math.round((card.power || 0) * 1.4 + 2), name: `${card.name}+`, _upgraded: true };
    const newDeck = upgradable.map((c, i) => i === idx ? upgraded : c);
    setDeck(newDeck);
    addLog(`🔨 Upgraded ${card.name} → ${upgraded.name}.`);
    setPhase('map');
  };

  const eventChoice = (choice) => {
    for (const out of choice.outcome) {
      if (out.kind === 'hp')   setHp(prev => Math.max(0, Math.min(maxHp, prev + out.delta)));
      if (out.kind === 'gold') setGold(g => Math.max(0, g + out.delta));
      if (out.kind === 'relic') {
        api.dungeon.pickRelic(out.rarity).then(r => {
          if (r.relic) {
            setRelics(rs => [...rs, r.relic]);
            addLog(`✨ Found relic: ${r.relic.emoji} ${r.relic.name}.`);
          }
        }).catch(() => {});
      }
      if (out.kind === 'card') {
        api.dungeon.rewardCards(2).then(r => {
          if (r.cards?.length) {
            setDeck(d => [...d, instance(r.cards[0])]);
            addLog(`🃏 Learned ${r.cards[0].name}.`);
          }
        }).catch(() => {});
      }
      if (out.kind === 'remove_card' && deck.length) {
        const idx = Math.floor(Math.random() * deck.length);
        const removed = deck[idx];
        setDeck(d => d.filter((_, i) => i !== idx));
        addLog(`🪶 Forgot ${removed.name}.`);
      }
    }
    addLog(`📖 Chose: ${choice.label}.`);
    setPhase('map');
  };

  // ── Move advance / exit ─────────────────────────────────────────
  const continueAfterReward = () => {
    if (activeNode?.type === 'boss') {
      flashBanner('DUNGEON CLEARED', '#fde047', 1600);
      setTimeout(() => {
        setRun(null); setPhase('entrance');
        addLog('🏆 You cleared the dungeon!');
        refreshUser();
      }, 1700);
    } else {
      setPhase('map');
    }
  };
  const fleeRun = () => {
    setRun(null);
    setPhase('entrance');
    setDeck([]);
    setRelics([]);
    setPotions([]);
    addLog('You retreat from the dungeon.');
  };

  // ── Render helpers ──────────────────────────────────────────────
  if (!starter) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;
  }

  // Available nodes for next move = current node's outgoing edges
  const map = run?.map;
  const nextNodes = (position !== null && map)
    ? map.edges.filter(e => e?.[0] === position).map(e => map.nodes.find(n => n.id === e[1])).filter(Boolean)
    : [];

  // ── Entrance screen ─────────────────────────────────────────────
  if (phase === 'entrance' || !run) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
        <div className="card" style={{ padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 0%, rgba(127,29,29,0.25) 0%, transparent 60%), var(--bg2)' }}>
          <span className="dungeon-torch" style={{ position: 'absolute', top: 12, left: 12, fontSize: 22 }}>🔥</span>
          <span className="dungeon-torch right" style={{ position: 'absolute', top: 12, right: 12, fontSize: 22 }}>🔥</span>

          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 4 }}>
            ⚔️ DUNGEON ENTRANCE
          </div>
          <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 26, marginBottom: 4 }}>Choose Your Path</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 18 }}>
            Card-based combat · Branching map · Pick up relics and cards as you go
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div className="battle-idle" style={{ position: 'relative', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))' }}>
              <PixelCharacter appearance={user || {}} equipped={inventory.equipped} size={110} />
            </div>
          </div>

          {/* Biome picker */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
            {biomes.map(b => {
              const locked = !b.unlocked;
              const active = selectedBiome === b.id;
              return (
                <button key={b.id}
                  disabled={locked}
                  onClick={() => setSelectedBiome(b.id)}
                  style={{
                    background: active ? `linear-gradient(135deg, ${b.palette.primary}33, ${b.palette.secondary})` : 'var(--bg3)',
                    border: `2px solid ${active ? b.palette.primary : 'var(--border)'}`,
                    borderRadius: 12, padding: 14, cursor: locked ? 'not-allowed' : 'pointer',
                    color: 'var(--text)', textAlign: 'center',
                    opacity: locked ? 0.45 : 1, transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 30, marginBottom: 4 }}>{b.sprite}</div>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', minHeight: 28 }}>{b.desc}</div>
                  {locked && (
                    <div style={{ fontSize: 10, color: '#fca5a5', marginTop: 6 }}>
                      🔒 Reach Ascension {b.unlockAtAscension}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Ascension picker */}
          {(user?.dungeon_ascension > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ascension:</span>
              {[...Array((user?.dungeon_ascension || 0) + 2).keys()].map(a => (
                <button key={a}
                  onClick={() => setSelectedAscension(a)}
                  style={{
                    padding: '4px 10px', borderRadius: 99,
                    background: selectedAscension === a ? '#ef4444' : 'var(--bg3)',
                    color: selectedAscension === a ? 'white' : 'var(--text-muted)',
                    border: `1px solid ${selectedAscension === a ? '#ef4444' : 'var(--border)'}`,
                    cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}>A{a}</button>
              ))}
            </div>
          )}

          <button className="btn btn-primary" onClick={startRun} disabled={busy}
            style={{ padding: '12px 28px', fontSize: 14, background: '#7f1d1d', borderColor: '#ef4444' }}>
            {busy ? '...' : '⚔️ Enter the Dungeon'}
          </button>
        </div>

        {log.length > 0 && <LogPanel log={log} />}
      </div>
    );
  }

  // ── Map view ────────────────────────────────────────────────────
  if (phase === 'map') {
    return (
      <MapView
        run={run}
        position={position}
        nextNodes={nextNodes}
        hp={hp} maxHp={maxHp} gold={gold}
        relics={relics} potions={potions} deck={deck.length ? deck : starter.deck.map(instance)}
        onNode={enterNode}
        onFlee={fleeRun}
      />
    );
  }

  // ── Battle view ─────────────────────────────────────────────────
  if (phase === 'battle' || phase === 'rewarded') {
    return (
      <BattleView
        user={user} inventory={inventory}
        node={activeNode}
        hp={hp} maxHp={maxHp} block={block}
        monsterHp={monsterHp} intent={intent} statuses={statuses}
        energy={energy} maxEnergy={MAX_ENERGY + relicSum('energy')}
        hand={hand} drawPile={drawPile} discardPile={discardPile}
        deck={deck}
        playerAnim={playerAnim} monsterAnim={monsterAnim}
        petAnim={petAnim} projectile={projectile} damages={damages}
        encounter={encounter} banner={banner} stageShake={stageShake}
        relics={relics}
        phase={phase} rewardCount={rewardCount}
        rewardCardChoices={rewardCardChoices}
        onPlayCard={playCard}
        onEndTurn={endTurn}
        onClaimRewardCard={pickRewardCard}
        onSkipRewardCard={skipRewardCard}
        onContinue={continueAfterReward}
        onFlee={fleeRun}
        busy={busy}
        log={log}
        toast={toast}
      />
    );
  }

  // ── Shop ────────────────────────────────────────────────────────
  if (phase === 'shop') {
    return (
      <RoomCard title="🛒 The Merchant" subtitle="Buy potions for the journey ahead">
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>💰 You have {gold} gold</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
          {shopOffer.map(p => (
            <div key={p.id} className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{p.emoji}</div>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{p.desc}</div>
              <button className="btn btn-primary" onClick={() => buyPotion(p.id)}
                disabled={gold < p.cost}
                style={{ width: '100%', padding: '6px', fontSize: 12, opacity: gold < p.cost ? 0.4 : 1 }}>
                💰 {p.cost}
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={() => setPhase('map')} style={{ marginTop: 14, padding: '8px 18px' }}>Leave</button>
      </RoomCard>
    );
  }

  // ── Rest site ─────────────────────────────────────────────────
  if (phase === 'rest') {
    return (
      <RoomCard title="🍖 Rest Site" subtitle="Pick one">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 6 }}>
          <button className="btn btn-primary" onClick={rest} style={{ padding: '14px' }}>
            🍖 Rest<br/><span style={{ fontSize: 10, opacity: 0.7 }}>Heal 30% Max HP</span>
          </button>
          <button className="btn btn-primary" onClick={upgradeRandomCard}
            style={{ padding: '14px', background: '#7c3aed', borderColor: '#a78bfa' }}>
            🔨 Smith<br/><span style={{ fontSize: 10, opacity: 0.7 }}>Upgrade a random card</span>
          </button>
        </div>
        <button className="btn btn-ghost" onClick={() => setPhase('map')} style={{ marginTop: 14, padding: '8px 18px' }}>Skip</button>
      </RoomCard>
    );
  }

  // ── Treasure ────────────────────────────────────────────────
  if (phase === 'treasure') {
    return (
      <RoomCard title="📦 Treasure" subtitle="Crack it open?">
        <div style={{ fontSize: 56, marginBottom: 10 }}>🎁</div>
        <button className="btn btn-gold" onClick={claimTreasure} style={{ padding: '10px 28px' }}>Open</button>
      </RoomCard>
    );
  }

  // ── Event ───────────────────────────────────────────────────
  if (phase === 'event') {
    const ev = activeNode?.event;
    if (!ev) return <RoomCard title="???" subtitle="Nothing happens."><button className="btn btn-ghost" onClick={() => setPhase('map')}>Continue</button></RoomCard>;
    return (
      <RoomCard title={`${ev.sprite || '❓'} ${ev.title}`} subtitle={ev.text}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {ev.choices.map((c, i) => (
            <button key={i} onClick={() => eventChoice(c)}
              className="btn btn-primary"
              style={{ padding: '12px', textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{c.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{c.desc}</div>
            </button>
          ))}
        </div>
      </RoomCard>
    );
  }

  // ── Dead ────────────────────────────────────────────────────
  if (phase === 'dead') {
    return (
      <RoomCard title="💀 Defeated" subtitle="Your run ends here. No rewards.">
        <button className="btn btn-ghost" onClick={fleeRun} style={{ padding: '10px 24px', marginTop: 8 }}>Leave</button>
      </RoomCard>
    );
  }

  return null;
}

// ── Subcomponents ────────────────────────────────────────────

function HpBar({ value, max, color, block }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ position: 'relative', height: 16, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}>
        {value} / {max}{block ? ` · 🛡${block}` : ''}
      </div>
    </div>
  );
}

function LogPanel({ log }) {
  return (
    <div className="card" style={{ padding: 12, maxHeight: 140, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>BATTLE LOG</div>
      {log.length === 0
        ? <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Silence.</div>
        : log.map((l, i) => <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>{l}</div>)}
    </div>
  );
}

function RoomCard({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}>
      <div className="card" style={{ padding: 20, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 22, marginBottom: 6 }}>{title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function MapView({ run, position, nextNodes, hp, maxHp, gold, relics, potions, deck, onNode, onFlee }) {
  const map = run.map;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}>
      {/* Run header */}
      <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 14, color: 'var(--gold)' }}>
            {run.biome?.sprite} {run.biome?.name}{run.ascension ? ` · A${run.ascension}` : ''}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <span style={{ color: '#6ee7b7' }}>❤️ {hp}/{maxHp}</span>
            <span style={{ color: '#fbbf24' }}>💰 {gold}</span>
            <span style={{ color: '#a78bfa' }}>🃏 {deck.length}</span>
          </div>
        </div>
        {(relics.length > 0 || potions.length > 0) && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {relics.map((r, i) => (
              <span key={i} title={`${r.name}: ${r.desc}`}
                style={{ padding: '4px 8px', background: 'var(--bg3)', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)' }}>
                {r.emoji} {r.name}
              </span>
            ))}
            {potions.map((p, i) => (
              <span key={i} title={p.desc}
                style={{ padding: '4px 8px', background: 'var(--bg3)', borderRadius: 6, fontSize: 12, border: '1px solid var(--border)' }}>
                {p.emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Map graph */}
      <div className="card" style={{ padding: 16, position: 'relative' }}>
        <svg width="100%" height={Math.max(...map.nodes.map(n => n.floor)) * 70 + 80} style={{ overflow: 'visible' }}>
          {map.edges.map((e, i) => {
            const a = map.nodes.find(n => n.id === e[0]);
            const b = map.nodes.find(n => n.id === e[1]);
            if (!a || !b) return null;
            const ax = a.col * 70 + 40, ay = (Math.max(...map.nodes.map(n => n.floor)) - a.floor) * 70 + 40;
            const bx = b.col * 70 + 40, by = (Math.max(...map.nodes.map(n => n.floor)) - b.floor) * 70 + 40;
            const isNext = a.id === position && nextNodes.some(n => n.id === b.id);
            return (
              <line key={i} x1={ax} y1={ay} x2={bx} y2={by}
                stroke={isNext ? '#fbbf24' : '#3a3a55'}
                strokeWidth={isNext ? 2.5 : 1.5}
                strokeDasharray={isNext ? '' : '4 4'}
              />
            );
          })}
          {map.nodes.map(n => {
            const cx = n.col * 70 + 40;
            const cy = (Math.max(...map.nodes.map(x => x.floor)) - n.floor) * 70 + 40;
            const isCur = n.id === position;
            const reachable = nextNodes.some(nn => nn.id === n.id);
            const label = n.type === 'battle' || n.type === 'elite' || n.type === 'boss'
              ? (n.monster?.sprite || '⚔️')
              : n.type === 'shop' ? '🛒'
              : n.type === 'rest' ? '🍖'
              : n.type === 'treasure' ? '📦'
              : n.type === 'event' ? '❓'
              : '🚪';
            return (
              <g key={n.id} style={{ cursor: reachable ? 'pointer' : 'default' }}
                onClick={() => reachable && onNode(n)}>
                <circle cx={cx} cy={cy} r={20}
                  fill={isCur ? '#10b981' : reachable ? '#7f1d1d' : 'var(--bg3)'}
                  stroke={n.type === 'boss' ? '#fbbf24' : n.type === 'elite' ? '#fb923c' : reachable ? '#fca5a5' : '#444'}
                  strokeWidth={n.type === 'boss' ? 2.5 : 1.5}
                  style={{ filter: reachable ? 'drop-shadow(0 0 8px #ef444466)' : 'none' }}
                />
                <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20">{label}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <button className="btn btn-ghost" onClick={onFlee} style={{ padding: '8px', fontSize: 12, alignSelf: 'flex-end' }}>
        🏃 Abandon Run
      </button>
    </div>
  );
}

function BattleView({
  user, inventory, node, hp, maxHp, block, monsterHp, intent, statuses,
  energy, maxEnergy, hand, drawPile, discardPile, deck,
  playerAnim, monsterAnim, petAnim, projectile, damages,
  encounter, banner, stageShake, relics, phase, rewardCount,
  rewardCardChoices, onPlayCard, onEndTurn,
  onClaimRewardCard, onSkipRewardCard, onContinue, onFlee, busy, log, toast,
}) {
  if (!node?.monster) return null;
  const monster = node.monster;
  const isBoss = monster.tier === 5;
  const isElite = monster.tier === 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 32 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          background: toast.type === 'error' ? '#7f1d1d' : '#064e3b',
          padding: '8px 16px', borderRadius: 8, fontSize: 13, color: toast.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>
          {toast.msg}
        </div>
      )}

      {/* Stage */}
      <div className={`card ${stageShake ? 'battle-shake' : ''} ${isBoss ? 'boss-room' : ''}`} style={{
        padding: 0, overflow: 'hidden', position: 'relative',
        background: isBoss ? 'radial-gradient(circle at 50% 30%, rgba(127,29,29,0.4) 0%, #0a0a0f 70%)'
          : 'radial-gradient(ellipse at 50% 30%, #1f1f3a 0%, #0a0a14 75%)',
        border: `1px solid ${isBoss ? '#7f1d1d' : '#2a2a3a'}`,
        minHeight: 320,
      }}>
        <span className="dungeon-torch" style={{ position: 'absolute', top: 8, left: 8, fontSize: 22 }}>🔥</span>
        <span className="dungeon-torch right" style={{ position: 'absolute', top: 8, right: 8, fontSize: 22 }}>🔥</span>

        <div style={{ padding: 16, position: 'relative', minHeight: 320 }}>
          {/* HP bars + intent */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3, color: '#6ee7b7' }}>
                {user?.username} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· Lv {user?.level}</span>
              </div>
              <HpBar value={hp} max={maxHp} color="#10b981" block={block} />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6,
                color: isBoss ? '#fde047' : isElite ? '#fb923c' : '#fca5a5' }}>
                {phase === 'battle' && intent && (
                  <span className="monster-intent" style={{ color: intent.tone }}>{intent.icon} {intent.label}</span>
                )}
                <span>{isBoss && '👑 '}{isElite && '🔥 '}{monster.name} · T{monster.tier}</span>
              </div>
              <HpBar value={monsterHp} max={monster.hp} color={isBoss ? '#fbbf24' : isElite ? '#fb923c' : '#ef4444'} />
              {(statuses.burn > 0 || statuses.poison > 0 || statuses.stun > 0) && (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                  {statuses.burn > 0 && <span className="status-icon" style={{ fontSize: 12, padding: '2px 6px', background: 'rgba(249,115,22,0.2)', border: '1px solid #ea580c', borderRadius: 6 }}>🔥 {statuses.burn}</span>}
                  {statuses.poison > 0 && <span className="status-icon" style={{ fontSize: 12, padding: '2px 6px', background: 'rgba(34,197,94,0.2)', border: '1px solid #22c55e', borderRadius: 6 }}>☠️ {statuses.poison}</span>}
                  {statuses.stun > 0 && <span className="status-icon" style={{ fontSize: 12, padding: '2px 6px', background: 'rgba(253,224,71,0.2)', border: '1px solid #fde047', borderRadius: 6 }}>⚡ STUN</span>}
                </div>
              )}
            </div>
          </div>

          {/* Combatants */}
          <div style={{ position: 'relative', height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 30px' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20,
              background: 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.6) 0%, transparent 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, position: 'relative' }}>
              <div className={`${playerAnim || 'battle-idle'}`} style={{ position: 'relative' }}>
                <PixelCharacter appearance={user || {}} equipped={inventory.equipped} size={120} />
                {damages.filter(d => d.target === 'player').map(d => (
                  <div key={d.id} className={`battle-damage ${d.heal ? 'heal' : ''} ${d.crit ? 'crit' : ''}`}>
                    {d.heal ? `${d.value}` : d.value}
                  </div>
                ))}
                {block > 0 && (
                  <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 12, fontWeight: 700, color: '#60a5fa',
                    textShadow: '0 0 6px #60a5fa, 0 0 0 #000', padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(0,0,0,0.6)' }}>
                    🛡 {block}
                  </div>
                )}
              </div>
              {inventory?.equipped?.companion && (
                <div className={petAnim || 'pet-idle'} style={{ fontSize: 50, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
                  {inventory.equipped.companion.emoji}
                </div>
              )}
            </div>

            <div className={`${monsterAnim || 'battle-idle'}`} style={{
              position: 'relative', fontSize: isBoss ? 140 : isElite ? 120 : 110, lineHeight: 1,
              filter: isBoss ? 'drop-shadow(0 0 24px #ef444466)' : isElite ? 'drop-shadow(0 0 18px #fb923c66)' : 'none' }}>
              <span>{monster.sprite}</span>
              {damages.filter(d => d.target === 'monster').map(d => (
                <div key={d.id} className={`battle-damage ${d.crit ? 'crit' : ''}`}>{d.value}</div>
              ))}
            </div>

            {projectile && <span key={projectile.id} className="battle-projectile" style={{ color: projectile.color }}>{projectile.emoji}</span>}
          </div>

          {encounter && (
            <div className="encounter-banner" style={{
              position: 'absolute', inset: 0, zIndex: 6,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.85) 70%, transparent 100%)' }}>
              <div style={{ fontSize: 80, marginBottom: 6 }}>{encounter.sprite}</div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 24, fontWeight: 700, color: encounter.tier === 5 ? '#fde047' : '#fca5a5' }}>
                {encounter.tier === 5 && '👑 '}{encounter.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>"{encounter.taunt}"</div>
            </div>
          )}

          {banner && <div className="battle-banner" style={{ color: banner.color }}>{banner.text}</div>}
        </div>
      </div>

      {/* Energy + End turn */}
      {phase === 'battle' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'radial-gradient(circle, #fde047 0%, #b45309 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: 18, color: '#000',
            boxShadow: '0 0 16px #fde04766',
          }}>{energy}/{maxEnergy}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>🃏 {drawPile.length} draw</span>
            <span>🗑️ {discardPile.length} discard</span>
          </div>
          <button onClick={onEndTurn} disabled={busy}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: 13, background: '#b45309', borderColor: '#fbbf24' }}>
            End Turn →
          </button>
        </div>
      )}

      {/* Hand */}
      {phase === 'battle' && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, padding: '4px 0',
          flexWrap: 'wrap', minHeight: 140,
        }}>
          {hand.map((card, idx) => {
            const playable = energy >= (card.energyCost || 1) && !busy;
            return (
              <button key={card._iid}
                onClick={() => playable && onPlayCard(card, idx)}
                disabled={!playable}
                style={{
                  width: 100, minHeight: 130, padding: 8, borderRadius: 10,
                  background: playable ? 'linear-gradient(180deg, var(--bg2), var(--bg3))' : 'var(--bg3)',
                  border: `2px solid ${playable ? (RARITY_COLOR[card.pool] || '#9ca3af') : 'var(--border)'}`,
                  cursor: playable ? 'pointer' : 'not-allowed',
                  opacity: playable ? 1 : 0.55,
                  color: 'var(--text)', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transform: playable ? 'translateY(0)' : 'none',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}>
                <div style={{
                  position: 'absolute', top: -8, left: -8,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'radial-gradient(circle, #fde047, #b45309)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: 12, color: '#000',
                  boxShadow: '0 0 6px #fde04766',
                }}>{card.energyCost || 1}</div>
                <div style={{ fontSize: 22, marginTop: 6 }}>{card.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.1, minHeight: 26, padding: '0 2px' }}>{card.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.2, minHeight: 28 }}>
                  {card.desc || (card.power ? `${card.power} dmg` : '')}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Victory rewarded screen */}
      {phase === 'rewarded' && (
        <>
          <div className="card animate-fade" style={{ padding: 18, textAlign: 'center', borderColor: '#f59e0b66', background: 'rgba(245,158,11,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 14 }}>
              <div className="reward-counter">
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>XP</div>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 28, fontWeight: 700, color: '#a78bfa' }}>+{rewardCount.xp}</div>
              </div>
              <div className="reward-counter" style={{ animationDelay: '0.15s' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>GOLD</div>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>+{rewardCount.gold}</div>
              </div>
            </div>
          </div>

          {/* Card pick */}
          {rewardCardChoices.length > 0 ? (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10, textAlign: 'center' }}>
                CHOOSE A CARD TO ADD TO YOUR DECK
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {rewardCardChoices.map(card => (
                  <button key={card.id} onClick={() => onClaimRewardCard(card)}
                    style={{
                      padding: 12, borderRadius: 10, cursor: 'pointer',
                      background: 'linear-gradient(180deg, var(--bg2), var(--bg3))',
                      border: `2px solid ${RARITY_COLOR[card.pool] || '#9ca3af'}`,
                      color: 'var(--text)', textAlign: 'center',
                    }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{card.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{card.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{card.desc}</div>
                    <div style={{ fontSize: 10, color: RARITY_COLOR[card.pool], marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {card.pool} · {card.energyCost || 1}⚡
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={onSkipRewardCard} style={{ padding: '8px 18px' }}>Skip</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-gold" onClick={onContinue} style={{ padding: '12px 24px' }}>Continue →</button>
          )}
        </>
      )}

      {/* Flee button during battle */}
      {phase === 'battle' && (
        <button className="btn btn-ghost" onClick={onFlee} style={{ padding: '6px', fontSize: 11, alignSelf: 'flex-end' }}>
          🏃 Flee
        </button>
      )}

      <LogPanel log={log} />
    </div>
  );
}
