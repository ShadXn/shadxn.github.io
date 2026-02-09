/* Training Game - simple local web app
   - Loads activities from data/activities.json
   - Prompts for username and persists to localStorage
   - Tracks XP, Gold, Level
   - Allows completing activities up to maxPerDay per activity (per day resets)
   - Simple shop demo to spend gold for XP boosts
*/

const STORAGE_KEY = 'training_game_state_v1';
const USER_KEY = 'training_game_user_v1';
const ACTIVITIES_PATH = 'data/activities.json';

// Investment definitions for the Game tab.
// requiredPlayerLevel: player must be at or above this level to invest
// rate: XP per gold per cycle (8 hours)
// xpPerLevel: how much investment-XP is required to raise investment level
const INVESTMENT_DEFS = [
  { id: 'grocery', name: 'Grocery Store', requiredPlayerLevel: 2, baseCost: 10, rate: 0.02, moneyRate: 0.05, xpPerLevel: 100, upgrades: [
      { id: 'g1', name: 'Increased Variety', baseCost: 20, costMultiplier: 1.5, maxLevel: 5, moneyMultiplierPerRank: 0.12, xpMultiplierPerRank: 0.08, levelReqBase: 2, description: 'Increase money and XP gain per cycle.' },
      { id: 'g2', name: 'Faster Service', baseCost: 40, costMultiplier: 1.6, maxLevel: 5, moneyMultiplierPerRank: 0.18, xpMultiplierPerRank: 0.12, levelReqBase: 3, description: 'Further boost yields.' },
      { id: 'g3', name: 'Local Partnerships', baseCost: 80, costMultiplier: 1.7, maxLevel: 5, moneyMultiplierPerRank: 0.25, xpMultiplierPerRank: 0.18, levelReqBase: 4, description: 'Unlock bigger customers.' }
    ] },
  { id: 'coffee', name: 'Coffee Shop', requiredPlayerLevel: 4, baseCost: 25, rate: 0.03, moneyRate: 0.06, xpPerLevel: 150, upgrades: [
      { id: 'c1', name: 'Better Beans', baseCost: 30, costMultiplier: 1.5, maxLevel: 5, moneyMultiplierPerRank: 0.10, xpMultiplierPerRank: 0.10, levelReqBase: 4, description: 'Improve product quality for more returns.' },
      { id: 'c2', name: 'Loyalty Program', baseCost: 60, costMultiplier: 1.6, maxLevel: 5, moneyMultiplierPerRank: 0.20, xpMultiplierPerRank: 0.15, levelReqBase: 5, description: 'Customers return more often.' }
    ] },
  { id: 'local_shop', name: 'Local Shop', requiredPlayerLevel: 6, baseCost: 50, rate: 0.04, moneyRate: 0.07, xpPerLevel: 200, upgrades: [
      { id: 'l1', name: 'Expanded Shelf', baseCost: 60, costMultiplier: 1.5, maxLevel: 5, moneyMultiplierPerRank: 0.15, xpMultiplierPerRank: 0.12, levelReqBase: 6, description: 'More products, more sales.' },
      { id: 'l2', name: 'Staff Training', baseCost: 120, costMultiplier: 1.6, maxLevel: 5, moneyMultiplierPerRank: 0.25, xpMultiplierPerRank: 0.2, levelReqBase: 7, description: 'Better service increases yields.' }
    ] }
];

let activitiesData = null;
let state = null; // { xp, gold, counts: {key: {date:string,count:number}}, lastDate }
let user = null;
let countdownInterval = null;

// ----------------- helpers -----------------
function todayStr(){
  const d = new Date();
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

function loadUser(){
  const u = localStorage.getItem(USER_KEY);
  if(u) return JSON.parse(u);
  return null;
}

function saveUser(u){
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

function loadState(){
  const s = localStorage.getItem(STORAGE_KEY);
  if(s) return JSON.parse(s);
  // default state
  return { xp:0, gold:0, counts:{}, lastDate: todayStr(), investments: [] };
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// We store counts aggregated per-category (keyed by category id) with a date and count.
// This enforces the "maxPerDay per category" rule (e.g., any walking durations share the same 3/day limit).
function getCategoryCount(catId){
  const entry = state.counts[catId];
  if(!entry) return 0;
  if(entry.date !== todayStr()) return 0; // different day
  return entry.count || 0;
}

function incrementCategoryCount(catId){
  const today = todayStr();
  if(!state.counts[catId] || state.counts[catId].date !== today){
    state.counts[catId] = { date: today, count: 1 };
  } else {
    state.counts[catId].count = (state.counts[catId].count || 0) + 1;
  }
  saveState();
}

function migrateCountsLegacy(){
  // If old data used keys like "catId::minutes", convert to aggregated per-category counts.
  const today = todayStr();
  const newCounts = {};
  for(const key in state.counts){
    if(!Object.prototype.hasOwnProperty.call(state.counts, key)) continue;
    const entry = state.counts[key];
    if(!entry || entry.date !== today) continue; // ignore old-day entries

    if(key.includes('::')){
      const parts = key.split('::');
      const catId = parts[0];
      const c = entry.count || 0;
      if(!newCounts[catId]) newCounts[catId] = { date: today, count: 0 };
      newCounts[catId].count += c;
    } else {
      // already a category-keyed entry
      const catId = key;
      const c = entry.count || 0;
      if(!newCounts[catId]) newCounts[catId] = { date: today, count: 0 };
      newCounts[catId].count += c;
    }
  }
  state.counts = newCounts;
}

function resetDailyCounts(){
  state.counts = {};
  state.lastDate = todayStr();
  saveState();
}

function xpToLevel(xp){
  // Simple level curve: level increases every 100 xp
  return Math.floor(xp / 100);
}

function xpToNextLevel(xp){
  const lvl = xpToLevel(xp);
  const next = (lvl + 1) * 100;
  return next - xp;
}

function grantRewards(xpGain, goldGain){
  state.xp = (state.xp || 0) + Math.round(xpGain);
  state.gold = (state.gold || 0) + Math.round(goldGain);
  saveState();
}

// ----------------- render -----------------
function renderStats(){
  document.getElementById('display-username').textContent = user || 'Guest';
  document.getElementById('display-xp').textContent = `XP: ${state.xp}`;
  document.getElementById('display-gold').textContent = `Gold: ${state.gold}`;
  document.getElementById('display-level').textContent = `Level: ${xpToLevel(state.xp)}`;
  const bizTotal = computeTotalBusinessMoney();
  const bizEl = document.getElementById('display-business-money');
  if(bizEl) bizEl.textContent = `Business $: ${bizTotal}`;
}

function computeTotalBusinessMoney(){
  if(!state.investments) return 0;
  return (state.investments || []).reduce((s,i)=>s + (i.money || 0), 0);
}

function startCountdownUpdater(){
  if(countdownInterval) return; // already running
  countdownInterval = setInterval(()=>{
    document.querySelectorAll('.next-cycle').forEach(el=>{
      const maxed = el.dataset.maxed === '1';
      if(maxed){ el.textContent = 'Ready (5)'; return; }
      const nextTs = Number(el.dataset.next);
      if(!nextTs || isNaN(nextTs)){ el.textContent = ''; return; }
      const now = Date.now();
      let diff = nextTs - now;
      if(diff <= 0){ el.textContent = 'Ready'; return; }
      const hrs = Math.floor(diff / 3600000); diff %= 3600000;
      const mins = Math.floor(diff / 60000); diff %= 60000;
      const secs = Math.floor(diff / 1000);
      el.textContent = `${hrs}h ${mins}m ${secs}s`;
    });
  }, 1000);
}

function renderCategories(){
  const container = document.getElementById('categories');
  container.innerHTML = '';
  activitiesData.categories.forEach(cat=>{
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = cat.name;
    // visible per-category counter badge
    const categoryCount = getCategoryCount(cat.id);
    const countBadge = document.createElement('span');
    countBadge.className = 'category-count';
    countBadge.textContent = `${categoryCount} / ${cat.maxPerDay} today`;
    title.appendChild(countBadge);
    card.appendChild(title);
    const durations = document.createElement('div');
    durations.className = 'durations';

    cat.durations.forEach(amount=>{
      const btn = document.createElement('button');
      btn.className = 'duration-btn';
      // show unit-aware label
      if(cat.unit && cat.unit === 'reps'){
        btn.textContent = `${amount} reps`;
      } else {
        btn.textContent = `${amount} m`;
      }

      // compute reward preview for this option
      const xpPreview = Math.round(amount * (cat.xpMultiplier || 1));
      const goldPreview = Math.max(1, Math.floor(amount * (cat.goldMultiplier || 0)));

      if(categoryCount >= cat.maxPerDay){
        btn.disabled = true;
        btn.title = `Reached ${cat.maxPerDay} / day for ${cat.name} — rewards: +${xpPreview} XP, +${goldPreview} gold`;
      } else {
        const slotsLeft = cat.maxPerDay - categoryCount;
        btn.title = `+${xpPreview} XP, +${goldPreview} gold — ${slotsLeft} ${slotsLeft === 1 ? 'slot' : 'slots'} left today`;
      }

      btn.addEventListener('click', ()=>{
        onCompleteActivity(cat, amount, btn);
      });

      durations.appendChild(btn);
    });

    const meta = document.createElement('div');
    meta.className = 'duration-meta';
    meta.textContent = `Max per day: ${cat.maxPerDay} — XP multiplier ${cat.xpMultiplier}`;
    card.appendChild(durations);
    card.appendChild(meta);
    container.appendChild(card);
  });
}

// ----------------- tabs & shop rendering -----------------
function switchToTab(tabId){
  document.querySelectorAll('.tab').forEach(t=>{
    if(t.id === tabId) t.classList.remove('hidden'); else t.classList.add('hidden');
  });
  document.querySelectorAll('.tab-btn').forEach(b=>{
    if(b.dataset.tab === tabId) b.classList.add('active'); else b.classList.remove('active');
  });
  if(tabId === 'game-tab') renderGameTab();
  if(tabId === 'shop-tab') renderShopTab();
  if(tabId === 'training-tab') renderCategories();
}

function renderShopTab(){
  const container = document.getElementById('shop-content');
  container.innerHTML = '';
  SHOP_ITEMS.forEach(it=>{
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '8px 0';

    const label = document.createElement('div');
    label.textContent = `${it.name} — ${it.cost} gold`;
    const btn = document.createElement('button');
    btn.textContent = 'Buy';
    btn.addEventListener('click', ()=>{
      if(state.gold < it.cost){
        alert('Not enough gold');
        return;
      }
      state.gold -= it.cost;
      it.apply();
      saveState();
      renderStats();
      alert(`Purchased ${it.name}`);
      renderShopTab();
    });

    row.appendChild(label);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

// ----------------- activity handling -----------------
function onCompleteActivity(cat, amount, buttonEl){
  const currentCount = getCategoryCount(cat.id);
  if(currentCount >= cat.maxPerDay){
    alert('You already completed this activity the maximum times today.');
    return;
  }

  // Reward formula (works for minutes or reps)
  const xpGain = Math.round(amount * (cat.xpMultiplier || 1));
  const goldGain = Math.max(1, Math.floor(amount * (cat.goldMultiplier || 0)));

  // Confirm (show unit-aware message with reward preview)
  const unitLabel = (cat.unit && cat.unit === 'reps') ? 'reps' : 'minutes';
  const ok = confirm(`Complete ${cat.name} ${amount} ${unitLabel}?\nRewards: +${xpGain} XP, +${goldGain} gold`);
  if(!ok) return;

  incrementCategoryCount(cat.id);
  grantRewards(xpGain, goldGain);
  renderStats();
  renderCategories();
  alert(`+${Math.round(xpGain)} XP, +${Math.round(goldGain)} gold`);
}

// ----------------- shop -----------------
// Keep shop empty for now (no purchasable XP/gold items). Gold should only come from training activities.
const SHOP_ITEMS = [];

function openShop(){
  const modal = document.getElementById('shop-modal');
  const itemsDiv = document.getElementById('shop-items');
  itemsDiv.innerHTML = '';
  SHOP_ITEMS.forEach(it=>{
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '8px 0';

    const label = document.createElement('div');
    label.textContent = `${it.name} — ${it.cost} gold`;
    const btn = document.createElement('button');
    btn.textContent = 'Buy';
    btn.addEventListener('click', ()=>{
      if(state.gold < it.cost){
        alert('Not enough gold');
        return;
      }
      state.gold -= it.cost;
      it.apply();
      saveState();
      renderStats();
      alert(`Purchased ${it.name}`);
      openShop();
    });

    row.appendChild(label);
    row.appendChild(btn);
    itemsDiv.appendChild(row);
  });
  modal.classList.remove('hidden');
}

function generateId(prefix='id'){
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}

// ----------------- investments (game) -----------------
function perCycleXPFor(amount, def){
  const rate = def.rate || 0.02;
  // apply upgrade multipliers (if any) - handled by instance when calling
  return Math.max(1, Math.floor(amount * rate));
}

function perCycleMoneyFor(amount, def){
  const rate = def.moneyRate || 0.05;
  return Math.max(1, Math.floor(amount * rate));
}

function applyUpgradeMultipliers(inst, def, baseXP, baseMoney){
  // sum up multipliers from purchased upgrades on the instance
  let xpMult = 0;
  let moneyMult = 0;
  // inst.upgrades is a map { upgradeId: count }
  const purchasedMap = inst.upgrades || {};
  Object.keys(purchasedMap).forEach(uid => {
    const count = purchasedMap[uid] || 0;
    if(count <= 0) return;
    const up = (def.upgrades || []).find(u=>u.id === uid);
    if(up){ xpMult += (up.xpMultiplierPerRank || up.xpMultiplier || 0) * count; moneyMult += (up.moneyMultiplierPerRank || up.moneyMultiplier || 0) * count; }
  });
  const finalXP = Math.max(0, Math.floor(baseXP * (1 + xpMult)));
  const finalMoney = Math.max(0, Math.floor(baseMoney * (1 + moneyMult)));
  return { xp: finalXP, money: finalMoney };
}

function getUpgradeCount(inst, upId){
  if(!inst || !inst.upgrades) return 0;
  // support legacy array form
  if(Array.isArray(inst.upgrades)){
    return inst.upgrades.filter(x=>x===upId).length;
  }
  return inst.upgrades[upId] || 0;
}

function getUpgradeNextCost(up, currentCount){
  const base = up.baseCost || up.cost || up.costBase || 10;
  const mult = up.costMultiplier || up.costMult || 1.5;
  return Math.ceil(base * Math.pow(mult, currentCount));
}

function migrateInstanceUpgrades(){
  // convert legacy inst.upgrades arrays into maps {id:count}
  if(!state.investments) return;
  state.investments.forEach(inst=>{
    if(!inst.upgrades) inst.upgrades = {};
    if(Array.isArray(inst.upgrades)){
      const map = {};
      inst.upgrades.forEach(id=>{ map[id] = (map[id]||0) + 1; });
      inst.upgrades = map;
    }
  });
  saveState();
}

function renderGameTab(){
  const container = document.getElementById('game-content');
  container.innerHTML = '';

  const lvl = xpToLevel(state.xp);

  INVESTMENT_DEFS.forEach(def=>{
    const card = document.createElement('div');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = def.name;
    const req = document.createElement('div');
    req.className = 'duration-meta';
    req.textContent = `Requires player level: ${def.requiredPlayerLevel} — base cost: ${def.baseCost} gold`;
    card.appendChild(title);
    card.appendChild(req);

    // show active investment instances of this def
    const list = document.createElement('div');
    const instances = (state.investments || []).filter(i=>i.defId === def.id);
    if(instances.length === 0){
      const none = document.createElement('div');
      none.textContent = 'No active investments of this type.';
      list.appendChild(none);
    } else {
      instances.forEach(inst=>{
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 0';

        const left = document.createElement('div');
        const level = Math.floor((inst.xp || 0) / (def.xpPerLevel || 100));
        left.innerHTML = `<strong>Invested:</strong> ${inst.investedAmount} gold — <strong>Investment XP:</strong> ${inst.xp || 0} — <strong>Level</strong>: ${level}`;

        // compute cycles available since lastClaimAt
        const now = Date.now();
        const elapsed = now - (inst.lastClaimAt || inst.investedAt || now);
        const HOURS8 = 8*3600*1000;
        const cycles = Math.min(5, Math.floor(elapsed / HOURS8));
  const basePerCycleXP = perCycleXPFor(inst.investedAmount, def);
  const basePerCycleMoney = perCycleMoneyFor(inst.investedAmount, def);
  const yields = applyUpgradeMultipliers(inst, def, basePerCycleXP, basePerCycleMoney);
        const badge = document.createElement('div');
        badge.className = 'next-cycle';
        // compute next cycle timestamp if cycles < 5
        if(cycles >= 5){
          badge.dataset.maxed = '1';
          badge.dataset.next = '';
          badge.textContent = `Cycles ready: ${cycles} / 5 — +${yields.xp} XP, +${yields.money} $ per cycle`;
        } else {
          const last = inst.lastClaimAt || inst.investedAt || Date.now();
          const HOURS8 = 8*3600*1000;
          const nextTs = (last) + ((Math.floor((Date.now() - last) / HOURS8) + 1) * HOURS8);
          badge.dataset.maxed = '0';
          badge.dataset.next = String(nextTs);
          badge.textContent = `Cycles ready: ${cycles} / 5 — +${yields.xp} XP, +${yields.money} $ per cycle`;
        }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';

        const claimBtn = document.createElement('button');
        claimBtn.textContent = 'Claim';
        claimBtn.disabled = (cycles === 0);
        claimBtn.addEventListener('click', ()=>{
          const toClaim = cycles;
          if(toClaim <= 0){ alert('No cycles to claim yet.'); return; }
          const gainedXP = toClaim * yields.xp;
          const gainedMoney = toClaim * yields.money;
          inst.xp = (inst.xp || 0) + gainedXP;
          inst.money = (inst.money || 0) + gainedMoney;
          inst.lastClaimAt = Date.now();
          saveState();
          alert(`Claimed ${gainedXP} investment XP and ${gainedMoney} $ for ${def.name}.`);
          renderGameTab();
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Remove';
        cancelBtn.addEventListener('click', ()=>{
          if(!confirm('Remove this business? (no refunds)')) return;
          state.investments = state.investments.filter(x=>x.instanceId !== inst.instanceId);
          saveState();
          renderGameTab();
        });

        // upgrades: show next 2 available across all upgrade types (repeatable up to maxLevel)
        const upgradesDiv = document.createElement('div');
        const availableList = [];
        (def.upgrades || []).forEach(u=>{
          const count = getUpgradeCount(inst, u.id);
          const maxLevel = u.maxLevel || 5;
          if(count < maxLevel){
            const nextCost = getUpgradeNextCost(u, count);
            availableList.push({ upgrade: u, count, nextCost });
          }
        });
        // sort by nextCost ascending to show cheaper upgrades first
        availableList.sort((a,b)=>a.nextCost - b.nextCost);
        if(availableList.length === 0){
          const noneUp = document.createElement('div');
          noneUp.textContent = 'All upgrades purchased.';
          upgradesDiv.appendChild(noneUp);
        } else {
          const nextTwo = availableList.slice(0,2);
          nextTwo.forEach(entry => {
            const u = entry.upgrade;
            const count = entry.count;
            const cost = entry.nextCost;

            // compute hover preview: yields per cycle after buying this rank
            const simulatedUpgrades = Object.assign({}, inst.upgrades || {});
            simulatedUpgrades[u.id] = (simulatedUpgrades[u.id] || 0) + 1;
            const simInst = Object.assign({}, inst, { upgrades: simulatedUpgrades });
            const baseXPsim = perCycleXPFor(inst.investedAmount, def);
            const baseMonSim = perCycleMoneyFor(inst.investedAmount, def);
            const yieldsAfter = applyUpgradeMultipliers(simInst, def, baseXPsim, baseMonSim);

            // create a single full-width button to represent the upgrade (text contains name, cost and level)
            const upBtn = document.createElement('button');
            upBtn.textContent = `${u.name} ${cost}$ (${count}/${u.maxLevel || 5})`;
            upBtn.style.display = 'block';
            upBtn.style.width = '100%';
            upBtn.style.textAlign = 'left';

            // determine player level req for this rank
            const playerLvl = xpToLevel(state.xp);
            const playerReqBase = (u.levelReqBase || def.requiredPlayerLevel || 0);
            const requiredPlayerLevelForRank = playerReqBase + (count + 1);
            const buyDisabled = (inst.money || 0) < cost || playerLvl < requiredPlayerLevelForRank;
            if(buyDisabled){
              let reason = '';
              if(playerLvl < requiredPlayerLevelForRank) reason = `Requires player level ${requiredPlayerLevelForRank}`;
              else if((inst.money || 0) < cost) reason = `Requires ${cost} $ business money`;
              upBtn.disabled = true;
              upBtn.title = `${reason} — After purchase: +${yieldsAfter.xp} XP, +${yieldsAfter.money} $ per cycle`;
            } else {
              upBtn.title = `After purchase: +${yieldsAfter.xp} XP, +${yieldsAfter.money} $ per cycle`;
            }

            upBtn.addEventListener('click', ()=>{
              const money = inst.money || 0;
              if(xpToLevel(state.xp) < requiredPlayerLevelForRank){ alert(`Player level ${requiredPlayerLevelForRank} required to buy this rank.`); return; }
              if(money < cost){ alert('Not enough business money to buy this upgrade.'); return; }
              if(!confirm(`Buy ${u.name} rank ${count+1} for ${cost} $?`)) return;
              inst.money = money - cost;
              inst.upgrades = inst.upgrades || {};
              inst.upgrades[u.id] = (inst.upgrades[u.id] || 0) + 1;
              saveState();
              alert(`Purchased ${u.name} rank ${inst.upgrades[u.id]} for ${def.name}.`);
              renderGameTab();
            });

            const upRow = document.createElement('div');
            upRow.style.padding = '4px 0';
            upRow.appendChild(upBtn);
            upgradesDiv.appendChild(upRow);
          });
        }

        actions.appendChild(claimBtn);
        actions.appendChild(cancelBtn);

        row.appendChild(left);
        row.appendChild(badge);
        row.appendChild(actions);
        list.appendChild(row);

  // show money balance and per-cycle yields under the row
  const infoRow = document.createElement('div');
  infoRow.style.padding = '6px 0 12px 0';
  infoRow.innerHTML = `<div><strong>Business money:</strong> ${inst.money || 0} $</div><div><strong>Per cycle:</strong> +${yields.xp} XP, +${yields.money} $</div>`;
  list.appendChild(infoRow);

  const upHeader = document.createElement('div');
  upHeader.textContent = 'Upgrades:';
  list.appendChild(upHeader);
  list.appendChild(upgradesDiv);
      });
    }

    card.appendChild(list);

    // invest button (only if player level allowed)
    const footer = document.createElement('div');
    footer.className = 'modal-actions';
    if(lvl < def.requiredPlayerLevel){
      const locked = document.createElement('div');
      locked.textContent = `Locked — reach level ${def.requiredPlayerLevel} to unlock.`;
      footer.appendChild(locked);
    } else {
      const investBtn = document.createElement('button');
      investBtn.textContent = 'Invest';
      investBtn.addEventListener('click', ()=>{
        const amtStr = prompt(`Enter gold amount to invest into ${def.name} (you have ${state.gold}):`, String(def.baseCost));
        if(!amtStr) return;
        const amt = Math.floor(Number(amtStr));
        if(Number.isNaN(amt) || amt <= 0){ alert('Invalid amount'); return; }
        if(amt > state.gold){ alert('Not enough gold'); return; }
        // spend gold and create instance
        state.gold -= amt;
  const inst = { instanceId: generateId('inv'), defId: def.id, investedAmount: amt, investedAt: Date.now(), lastClaimAt: Date.now(), xp: 0, money: 0, upgrades: {} };
        state.investments = state.investments || [];
        state.investments.push(inst);
        saveState();
        renderStats();
        renderGameTab();
        alert(`Invested ${amt} gold into ${def.name}.`);
      });
      footer.appendChild(investBtn);
    }
    card.appendChild(footer);

    container.appendChild(card);
  });
}

// ----------------- init -----------------
async function init(){
  // load activity definitions
  try{
    const res = await fetch(ACTIVITIES_PATH);
    activitiesData = await res.json();
  }catch(e){
    console.error('Failed to load activities.json', e);
    activitiesData = { categories: [] };
  }

  user = loadUser();
  state = loadState();

  // daily reset if needed
  if(state.lastDate !== todayStr()){
    resetDailyCounts();
  } else {
    // Migrate any legacy per-duration counts to aggregated per-category counts (only if state is for today)
    migrateCountsLegacy();
    // Migrate legacy instance upgrades (arrays) to maps
    migrateInstanceUpgrades();
  }

  // if no user, show modal
  if(!user){
    document.getElementById('username-modal').classList.remove('hidden');
  }

  renderStats();
  renderCategories();

  // event bindings
  document.getElementById('save-username').addEventListener('click', ()=>{
    const input = document.getElementById('username-input');
    const name = (input.value || '').trim();
    if(!name){
      alert('Please enter a username');
      return;
    }
    user = name;
    saveUser(user);
    document.getElementById('username-modal').classList.add('hidden');
    renderStats();
  });

  // Info modal bindings
  const infoModal = document.getElementById('info-modal');
  const infoContent = document.getElementById('info-content');
  function buildInfoContent(){
    infoContent.innerHTML = '';
    const p1 = document.createElement('p');
    p1.textContent = 'Welcome — enter a username to start. The app gamifies everyday activities and saves progress locally in your browser.';
    const p2 = document.createElement('p');
    p2.textContent = 'Each category (Run, Walk, Push-ups, etc.) has a max number of completions per day. Completing any option in a category consumes one of those slots.';
    const p3 = document.createElement('p');
    p3.textContent = 'Hover an option to see the XP and gold you will receive. Confirming the action will grant the rewards and increment the category counter.';
  const p4 = document.createElement('p');
  p4.textContent = 'XP increases your player level (level = floor(XP / 100)). Gold comes only from training activities and can be spent in the Shop tab (currently empty). Use the Reset Day button to clear daily counts for testing.';
  const p5 = document.createElement('p');
  p5.textContent = 'Businesses (Game tab) are separate: when you invest gold into a business, it creates a business instance that accrues business-specific money and investment XP every 8 hours (up to 5 unclaimed cycles). Claiming gives the business XP and business money.';
  const p6 = document.createElement('p');
  p6.textContent = 'Business money is used only inside that business to buy upgrades (shown as the next 2 available upgrades). Upgrades increase money and XP yields for that business. This keeps training gold as the core scarce currency.';
  const p7 = document.createElement('p');
  p7.textContent = 'All data is stored locally (no cloud sync). Open this page on your phone to use it like an app.';
  [p1,p2,p3,p4,p5,p6,p7].forEach(n=>infoContent.appendChild(n));
  }

  document.getElementById('open-info').addEventListener('click', ()=>{
    buildInfoContent();
    infoModal.classList.remove('hidden');
  });
  document.getElementById('close-info').addEventListener('click', ()=>{
    infoModal.classList.add('hidden');
  });

  const openShopBtn = document.getElementById('open-shop');
  if(openShopBtn) openShopBtn.addEventListener('click', openShop);
  const closeShopBtn = document.getElementById('close-shop');
  if(closeShopBtn) closeShopBtn.addEventListener('click', ()=>{
    document.getElementById('shop-modal').classList.add('hidden');
  });

  // tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      switchToTab(btn.dataset.tab);
    });
  });

  // render initial shop tab content
  renderShopTab();

  // start countdown updater for next-cycle ETAs
  startCountdownUpdater();

  document.getElementById('reset-day').addEventListener('click', ()=>{
    if(confirm('Reset daily counts for testing?')){
      resetDailyCounts();
      renderCategories();
      alert('Daily counts reset');
    }
  });

  renderStats();
}

window.addEventListener('load', init);
