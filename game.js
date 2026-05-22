// ============================================
// ドラゴンバトルロイヤル（仮） - ゲームロジック
// ============================================

// === ゲーム状態 ===
let game = {
  player: {
    level: 1,
    hp: 20,
    maxHp: 20,
    attack: 5,
    exp: 0,
    gold: 0,
    defeatedCount: 0,
  },
  inventory: [],      // {id, name, emoji, desc, type, value, ...}
  equipment: null,    // {id, name, emoji, maxHpBonus, atkBonus}
  pet: null,          // {id, name, emoji, attack}
  defeatedEnemies: [],// 倒した敵の履歴
  currentField: 0,    // フィールドID
  encounterCount: 0,  // 現在のフィールドで戦った数
  inNarrowPath: false,// 狭い道にいるか
  inPit: false,       // 落とし穴の中か
  currentEnemy: null, // 戦闘中の敵
  isBossBattle: false,
  shopTab: 'item',
};

// === ステータス計算 ===
function getTotalAttack() {
  let atk = game.player.attack;
  if (game.equipment) atk += game.equipment.atkBonus;
  return atk;
}

function getTotalMaxHp() {
  let hp = game.player.maxHp;
  if (game.equipment) hp += game.equipment.maxHpBonus;
  return hp;
}

// === 画面切り替え ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// === 起動時 ===
window.addEventListener('DOMContentLoaded', () => {
  // セーブデータあれば「つづきから」ボタン表示
  if (localStorage.getItem(SAVE_KEY)) {
    document.getElementById('load-btn').style.display = 'inline-block';
  }
});

// === ゲーム開始 ===
function startGame() {
  // 新規ゲーム
  game = {
    player: { level: 1, hp: 20, maxHp: 20, attack: 5, exp: 0, gold: 0, defeatedCount: 0 },
    inventory: [],
    equipment: null,
    pet: null,
    defeatedEnemies: [],
    currentField: 0,
    encounterCount: 0,
    inNarrowPath: false,
    inPit: false,
    currentEnemy: null,
    isBossBattle: false,
    shopTab: 'item',
  };
  enterField();
}

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);
  if (data) {
    try {
      const loaded = JSON.parse(data);
      game = { ...game, ...loaded };
      enterField();
      showMessage("つづきから はじめるよ！");
    } catch (e) {
      alert("セーブデータが よみこめませんでした");
    }
  }
}

// === フィールド画面に入る ===
function enterField() {
  showScreen('field-screen');
  updateFieldUI();
  drawField();
  showMessage(getFieldMessage());
}

function getFieldMessage() {
  if (game.inNarrowPath) {
    return "せまい道を 進んでいる... ボスが ちかい！";
  }
  const f = FIELDS[game.currentField];
  return `${f.name}を 探検しよう！ (あと${STEPS_TO_BOSS - game.encounterCount}回で 狭い道が 現れる)`;
}

function drawField() {
  const container = document.getElementById('field-bg');
  const scene = document.getElementById('field-scene');
  
  if (game.inNarrowPath) {
    container.className = 'field-container narrow';
  } else {
    const f = FIELDS[game.currentField];
    container.className = 'field-container ' + f.className;
  }
  
  // 風景要素をランダム配置
  scene.innerHTML = '';
  const f = game.inNarrowPath 
    ? { elements: ["🪨", "🌑", "⛰️"] }
    : FIELDS[game.currentField];
  
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'scene-element';
    el.textContent = f.elements[Math.floor(Math.random() * f.elements.length)];
    el.style.left = (Math.random() * 80 + 5) + '%';
    el.style.top = (Math.random() * 60 + 10) + '%';
    el.style.fontSize = (Math.random() * 1.5 + 1.5) + 'rem';
    el.style.opacity = 0.4 + Math.random() * 0.5;
    scene.appendChild(el);
  }
  
  // ペット表示
  const fieldPet = document.getElementById('field-pet');
  if (game.pet) {
    fieldPet.textContent = game.pet.emoji;
    fieldPet.style.display = 'block';
  } else {
    fieldPet.style.display = 'none';
  }
}

function updateFieldUI() {
  const maxHp = getTotalMaxHp();
  // HPが上限を超えないように
  if (game.player.hp > maxHp) game.player.hp = maxHp;
  
  document.getElementById('player-level').textContent = game.player.level;
  document.getElementById('player-hp').textContent = game.player.hp;
  document.getElementById('player-max-hp').textContent = maxHp;
  document.getElementById('player-gold').textContent = game.player.gold;
  
  const hpPercent = (game.player.hp / maxHp) * 100;
  const hpFill = document.getElementById('player-hp-fill');
  hpFill.style.width = hpPercent + '%';
  hpFill.className = 'hp-fill' + (hpPercent < 30 ? ' critical' : hpPercent < 60 ? ' low' : '');
  
  const expNeeded = expForNextLevel(game.player.level);
  document.getElementById('player-exp').textContent = game.player.exp;
  document.getElementById('player-next-exp').textContent = expNeeded;
  document.getElementById('exp-fill').style.width = (game.player.exp / expNeeded * 100) + '%';
  
  // 狭い道ボタンの表示
  const narrowBtn = document.getElementById('narrow-btn');
  if (game.encounterCount >= STEPS_TO_BOSS && !game.inNarrowPath) {
    narrowBtn.style.display = 'block';
  } else {
    narrowBtn.style.display = 'none';
  }
}

function showMessage(text) {
  document.getElementById('field-message').textContent = text;
}

// === 冒険する ===
function explore() {
  if (game.inNarrowPath) {
    // 狭い道での冒険：落とし穴か通常ドラゴン
    const r = Math.random();
    if (r < 0.3) {
      // 落とし穴に落ちる！
      fallIntoPit();
    } else {
      encounterEnemy(false);
    }
  } else {
    // 通常フィールド：ドラゴン出現 or フィールド変化
    if (Math.random() < 0.15 && game.encounterCount > 0) {
      // フィールド変化
      changeField();
    } else {
      encounterEnemy(false);
    }
  }
}

function changeField() {
  let newField;
  do {
    newField = Math.floor(Math.random() * FIELDS.length);
  } while (newField === game.currentField && FIELDS.length > 1);
  
  game.currentField = newField;
  drawField();
  showMessage(`${FIELDS[newField].name} に やってきた！`);
}

// === 狭い道に入る ===
function enterNarrowPath() {
  game.inNarrowPath = true;
  game.encounterCount = 0;
  drawField();
  updateFieldUI();
  showMessage("せまい道に 入った... ボスが まっている！");
}

// === 落とし穴 ===
function fallIntoPit() {
  game.inPit = true;
  showScreen('pit-screen');
  renderDefeatedList();
  document.getElementById('ladder-btn').style.display = 'none';
  document.getElementById('search-btn').style.display = 'inline-block';
  document.getElementById('pit-hint').textContent = "梯子を さがそう！";
}

function renderDefeatedList() {
  const list = document.getElementById('defeated-list');
  if (game.defeatedEnemies.length === 0) {
    list.innerHTML = '<div class="defeated-empty">まだ 倒した敵が いない...</div>';
    return;
  }
  list.innerHTML = '';
  // 重複を含めて記録順に表示（息子のアイデアどおり「倒した敵の名前が刻まれている」）
  game.defeatedEnemies.slice().reverse().forEach((name, i) => {
    const entry = document.createElement('div');
    entry.className = 'defeated-entry';
    entry.textContent = `† ${name}`;
    list.appendChild(entry);
  });
}

function searchLadder() {
  // 何回かに1回で梯子発見
  if (Math.random() < 0.4) {
    document.getElementById('search-btn').style.display = 'none';
    document.getElementById('ladder-btn').style.display = 'inline-block';
    document.getElementById('pit-hint').textContent = "梯子を 見つけた！";
  } else {
    document.getElementById('pit-hint').textContent = "ここには ない... もう一度 さがそう";
  }
}

function climbLadder() {
  game.inPit = false;
  showScreen('field-screen');
  drawField();
  updateFieldUI();
  showMessage("せまい道に もどってきた！");
}

// === 敵に遭遇 ===
function encounterEnemy(isBoss) {
  if (isBoss) {
    // ボス
    const availableBosses = BOSS_DRAGONS.filter(b => b.level <= game.player.level + 2);
    const boss = availableBosses.length > 0 
      ? availableBosses[Math.floor(Math.random() * availableBosses.length)]
      : BOSS_DRAGONS[0];
    
    game.currentEnemy = {
      ...boss,
      currentHp: boss.hp,
      isBoss: true,
    };
    game.isBossBattle = true;
  } else {
    // 通常ドラゴン（プレイヤーレベル±1の範囲）
    const minLevel = Math.max(1, game.player.level - 1);
    const maxLevel = game.player.level + 1;
    const available = NORMAL_DRAGONS.filter(d => d.level >= minLevel && d.level <= maxLevel);
    const enemy = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : NORMAL_DRAGONS[0];
    
    game.currentEnemy = {
      ...enemy,
      currentHp: enemy.hp,
      isBoss: false,
    };
    game.isBossBattle = false;
  }
  
  startBattle();
}

// === バトル開始 ===
function startBattle() {
  showScreen('battle-screen');
  
  const enemy = game.currentEnemy;
  document.getElementById('enemy-name').textContent = enemy.name;
  document.getElementById('enemy-hp').textContent = enemy.currentHp;
  document.getElementById('enemy-max-hp').textContent = enemy.hp;
  document.getElementById('enemy-hp-fill').style.width = '100%';
  
  const sprite = document.getElementById('enemy-sprite');
  sprite.textContent = enemy.emoji;
  sprite.className = 'enemy-sprite' + (enemy.isBoss ? ' boss' : '');
  
  document.getElementById('battle-screen').classList.toggle('boss', enemy.isBoss);
  
  document.getElementById('battle-message').textContent = 
    enemy.isBoss 
      ? `⚠️ ボス！ ${enemy.name} が あらわれた！ ⚠️`
      : `${enemy.name} が あらわれた！`;
  
  updateBattleUI();
  
  // ペット表示
  const battlePet = document.getElementById('battle-pet');
  const petBtn = document.getElementById('pet-attack-btn');
  if (game.pet) {
    battlePet.textContent = game.pet.emoji;
    battlePet.style.display = 'inline-block';
    petBtn.style.display = 'block';
  } else {
    battlePet.style.display = 'none';
    petBtn.style.display = 'none';
  }
}

function updateBattleUI() {
  const maxHp = getTotalMaxHp();
  document.getElementById('battle-player-hp').textContent = game.player.hp;
  document.getElementById('battle-player-max-hp').textContent = maxHp;
  document.getElementById('battle-player-hp-fill').style.width = (game.player.hp / maxHp * 100) + '%';
  
  const enemy = game.currentEnemy;
  document.getElementById('enemy-hp').textContent = Math.max(0, enemy.currentHp);
  document.getElementById('enemy-hp-fill').style.width = Math.max(0, enemy.currentHp / enemy.hp * 100) + '%';
}

// ダメージ表示
function showDamage(targetEl, damage, isPlayer = false) {
  const dmg = document.createElement('div');
  dmg.className = 'damage-popup' + (isPlayer ? ' player-damage' : '');
  dmg.textContent = '-' + damage;
  const rect = targetEl.getBoundingClientRect();
  dmg.style.left = (rect.left + rect.width / 2 - 20) + 'px';
  dmg.style.top = (rect.top + rect.height / 3) + 'px';
  document.body.appendChild(dmg);
  setTimeout(() => dmg.remove(), 1000);
}

// === プレイヤー攻撃 ===
function playerAttack() {
  disableBattleButtons();
  
  const damage = getTotalAttack() + Math.floor(Math.random() * 3);
  const enemy = game.currentEnemy;
  enemy.currentHp -= damage;
  
  const sprite = document.getElementById('enemy-sprite');
  sprite.classList.add('hit');
  setTimeout(() => sprite.classList.remove('hit'), 400);
  
  showDamage(sprite, damage);
  document.getElementById('battle-message').textContent = `${enemy.name} に ${damage} のダメージ！`;
  
  setTimeout(() => {
    updateBattleUI();
    if (enemy.currentHp <= 0) {
      victory();
    } else {
      enemyAttack();
    }
  }, 600);
}

// === ペット攻撃 ===
function petAttack() {
  if (!game.pet) return;
  disableBattleButtons();
  
  const damage = game.pet.attack + Math.floor(Math.random() * 3);
  const enemy = game.currentEnemy;
  enemy.currentHp -= damage;
  
  const sprite = document.getElementById('enemy-sprite');
  sprite.classList.add('hit');
  setTimeout(() => sprite.classList.remove('hit'), 400);
  
  showDamage(sprite, damage);
  document.getElementById('battle-message').textContent = `${game.pet.name} の こうげき！ ${damage} のダメージ！`;
  
  setTimeout(() => {
    updateBattleUI();
    if (enemy.currentHp <= 0) {
      victory();
    } else {
      enemyAttack();
    }
  }, 600);
}

// === 敵の攻撃 ===
function enemyAttack() {
  const enemy = game.currentEnemy;
  const damage = enemy.attack + Math.floor(Math.random() * 3);
  game.player.hp -= damage;
  if (game.player.hp < 0) game.player.hp = 0;
  
  const playerSprite = document.querySelector('.player-battle-sprite');
  showDamage(playerSprite, damage, true);
  
  document.getElementById('battle-message').textContent = `${enemy.name} の こうげき！ ${damage} のダメージ！`;
  
  setTimeout(() => {
    updateBattleUI();
    if (game.player.hp <= 0) {
      gameOver();
    } else {
      enableBattleButtons();
    }
  }, 600);
}

function disableBattleButtons() {
  document.querySelectorAll('.btn-battle').forEach(b => b.disabled = true);
}
function enableBattleButtons() {
  document.querySelectorAll('.btn-battle').forEach(b => b.disabled = false);
}

// === 勝利 ===
function victory() {
  const enemy = game.currentEnemy;
  game.player.exp += enemy.exp;
  game.player.gold += enemy.gold;
  game.player.defeatedCount++;
  game.defeatedEnemies.push(enemy.name);
  
  document.getElementById('victory-title').textContent = enemy.isBoss ? '🎊 ボス撃破！ 🎊' : '🎊 勝利！ 🎊';
  document.getElementById('victory-enemy').textContent = enemy.name;
  document.getElementById('victory-exp').textContent = enemy.exp;
  document.getElementById('victory-gold').textContent = enemy.gold;
  
  // ボス撃破時のドロップアイテム
  const itemArea = document.getElementById('victory-item-area');
  if (enemy.isBoss && enemy.dropItem) {
    itemArea.style.display = 'block';
    document.getElementById('victory-item').textContent = enemy.dropItem;
    // インベントリに追加
    game.inventory.push({
      id: 'drop_' + Date.now(),
      name: enemy.dropItem,
      emoji: '✨',
      desc: 'ボスが落とした きちょうな しなもの',
      type: 'treasure'
    });
  } else {
    itemArea.style.display = 'none';
  }
  
  // レベルアップチェック
  const expNeeded = expForNextLevel(game.player.level);
  if (game.player.exp >= expNeeded) {
    document.getElementById('victory-popup').classList.add('show');
    setTimeout(() => {
      closeVictoryPopupSilent();
      levelUp();
    }, 100);
  } else {
    document.getElementById('victory-popup').classList.add('show');
  }
  
  // 自動セーブ
  autoSave();
}

function closeVictoryPopupSilent() {
  document.getElementById('victory-popup').classList.remove('show');
}

function closeVictoryPopup() {
  document.getElementById('victory-popup').classList.remove('show');
  
  const wasBoss = game.isBossBattle;
  game.currentEnemy = null;
  game.isBossBattle = false;
  
  if (wasBoss) {
    // ボス撃破後は通常フィールドに戻る
    game.inNarrowPath = false;
    game.encounterCount = 0;
    changeField();
    enterField();
    showMessage("ボスを倒した！ 新しい場所へ！");
  } else {
    // 通常戦闘後
    game.encounterCount++;
    enterField();
  }
}

// === レベルアップ ===
function levelUp() {
  const before = game.player.level;
  game.player.exp -= expForNextLevel(game.player.level);
  game.player.level++;
  game.player.maxHp += 5;
  game.player.attack += 2;
  game.player.hp = getTotalMaxHp(); // 全回復
  
  document.getElementById('levelup-from').textContent = before;
  document.getElementById('levelup-to').textContent = game.player.level;
  document.getElementById('levelup-popup').classList.add('show');
  
  // 連続レベルアップに対応
  if (game.player.exp >= expForNextLevel(game.player.level)) {
    // 一度ポップアップを閉じてから次へ
  }
}

// === ゲームオーバー ===
function gameOver() {
  game.player.gold = Math.floor(game.player.gold / 2);
  document.getElementById('gameover-popup').classList.add('show');
}

function returnToBase() {
  document.getElementById('gameover-popup').classList.remove('show');
  game.player.hp = getTotalMaxHp();
  game.inNarrowPath = false;
  game.inPit = false;
  game.encounterCount = 0;
  game.currentField = 0;
  game.currentEnemy = null;
  enterField();
  showMessage("家で 休んだ。HPが ぜんかいした！");
}

// === にげる ===
function runAway() {
  if (game.isBossBattle) {
    document.getElementById('battle-message').textContent = "ボス戦からは にげられない！";
    setTimeout(() => enemyAttack(), 1000);
    disableBattleButtons();
    return;
  }
  
  if (Math.random() < 0.7) {
    document.getElementById('battle-message').textContent = "うまく にげられた！";
    setTimeout(() => {
      game.currentEnemy = null;
      enterField();
    }, 1000);
  } else {
    document.getElementById('battle-message').textContent = "にげられない！";
    setTimeout(() => enemyAttack(), 800);
    disableBattleButtons();
  }
}

// === バトル中アイテム ===
function openBattleItems() {
  const list = document.getElementById('battle-items-list');
  const usable = game.inventory.filter(i => i.type === 'heal' || i.type === 'heal_full' || i.type === 'atk_up');
  
  if (usable.length === 0) {
    list.innerHTML = '<p style="text-align:center;opacity:0.7">つかえる アイテムが ない</p>';
  } else {
    list.innerHTML = '';
    usable.forEach((item, idx) => {
      const btn = document.createElement('button');
      btn.className = 'battle-item-btn';
      btn.innerHTML = `${item.emoji} ${item.name} <small>(${item.desc})</small>`;
      btn.onclick = () => useBattleItem(item.id);
      list.appendChild(btn);
    });
  }
  document.getElementById('battle-items-popup').classList.add('show');
}

function useBattleItem(id) {
  const idx = game.inventory.findIndex(i => i.id === id);
  if (idx < 0) return;
  const item = game.inventory[idx];
  
  let msg = '';
  if (item.type === 'heal') {
    const maxHp = getTotalMaxHp();
    const healed = Math.min(item.value, maxHp - game.player.hp);
    game.player.hp += healed;
    msg = `${item.name} を つかった！ HP+${healed}`;
  } else if (item.type === 'heal_full') {
    game.player.hp = getTotalMaxHp();
    msg = `${item.name} を つかった！ HPが ぜんかい！`;
  } else if (item.type === 'atk_up') {
    game.player.attack += item.value;
    msg = `${item.name} を つかった！ こうげき+${item.value}`;
  }
  
  game.inventory.splice(idx, 1);
  document.getElementById('battle-items-popup').classList.remove('show');
  updateBattleUI();
  document.getElementById('battle-message').textContent = msg;
  
  disableBattleButtons();
  setTimeout(() => enemyAttack(), 1000);
}

// === ショップ ===
function openShop() {
  if (game.inNarrowPath) {
    showMessage("狭い道では お店に いけない！");
    return;
  }
  showScreen('shop-screen');
  document.getElementById('shop-gold').textContent = game.player.gold;
  switchShopTab(game.shopTab);
}

function switchShopTab(tab) {
  game.shopTab = tab;
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    const tabs = ['item','food','clothes','pet'];
    b.classList.toggle('active', tabs[i] === tab);
  });
  
  const items = SHOP_ITEMS[tab];
  const list = document.getElementById('shop-items');
  list.innerHTML = '';
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const owned = isOwned(item, tab);
    div.innerHTML = `
      <div class="shop-item-icon">${item.emoji}</div>
      <div class="shop-item-info">
        <div class="shop-item-name">${item.name}${owned ? ' <span style="color:#4ecdc4">（所持中）</span>' : ''}</div>
        <div class="shop-item-desc">${item.desc}</div>
        <div class="shop-item-price">💰 ${item.price} G</div>
      </div>
      <button class="btn-buy" ${game.player.gold < item.price ? 'disabled' : ''} onclick="buyItem('${tab}','${item.id}')">買う</button>
    `;
    list.appendChild(div);
  });
}

function isOwned(item, tab) {
  if (tab === 'clothes' && game.equipment && game.equipment.id === item.id) return true;
  if (tab === 'pet' && game.pet && game.pet.id === item.id) return true;
  return false;
}

function buyItem(tab, id) {
  const item = SHOP_ITEMS[tab].find(i => i.id === id);
  if (!item) return;
  if (game.player.gold < item.price) return;
  
  game.player.gold -= item.price;
  
  if (tab === 'clothes') {
    // 装備：上書き
    game.equipment = { ...item };
    // HPも増加分上乗せ（買い替えで最大HPが減らないように）
    game.player.hp = Math.min(game.player.hp + item.maxHpBonus, getTotalMaxHp());
  } else if (tab === 'pet') {
    game.pet = { ...item };
  } else {
    // アイテム・食料：インベントリに追加
    game.inventory.push({ ...item });
  }
  
  document.getElementById('shop-gold').textContent = game.player.gold;
  switchShopTab(tab);
  autoSave();
}

function closeShop() {
  enterField();
}

// === メニュー ===
function openMenu() {
  showScreen('menu-screen');
  document.getElementById('menu-level').textContent = game.player.level;
  document.getElementById('menu-hp').textContent = game.player.hp;
  document.getElementById('menu-max-hp').textContent = getTotalMaxHp();
  document.getElementById('menu-attack').textContent = getTotalAttack();
  document.getElementById('menu-exp').textContent = game.player.exp;
  document.getElementById('menu-defeated').textContent = game.player.defeatedCount;
  document.getElementById('menu-gold').textContent = game.player.gold;
  
  document.getElementById('equipment-list').innerHTML = game.equipment 
    ? `${game.equipment.emoji} ${game.equipment.name}` 
    : 'なし';
  
  document.getElementById('pet-list').innerHTML = game.pet 
    ? `${game.pet.emoji} ${game.pet.name}（こうげき+${game.pet.attack}）` 
    : 'なし';
  
  const itemsList = document.getElementById('items-list');
  if (game.inventory.length === 0) {
    itemsList.innerHTML = 'なし';
  } else {
    itemsList.innerHTML = '';
    // 同じアイテムをまとめる
    const counts = {};
    game.inventory.forEach(i => {
      const key = i.id.startsWith('drop_') ? i.name : i.id;
      if (!counts[key]) counts[key] = { item: i, count: 0 };
      counts[key].count++;
    });
    Object.values(counts).forEach(({ item, count }) => {
      const div = document.createElement('div');
      div.className = 'inventory-item';
      div.innerHTML = `${item.emoji} ${item.name} ${count > 1 ? `×${count}` : ''}`;
      itemsList.appendChild(div);
    });
  }
}

function closeMenu() {
  enterField();
}

// === セーブ／リセット ===
function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  alert("セーブしました！");
}

function autoSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

function resetGame() {
  if (confirm("ほんとうに リセットしますか？\nセーブデータが きえます！")) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

function closePopup(id) {
  document.getElementById(id).classList.remove('show');
}
