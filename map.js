// ============================================
// ドラゴンバトルロイヤル（仮） - マップエンジン
// MC City Planner ISOと同じisometric描画
// ============================================

// === isometric定数 ===
const ISO_W = 48;     // タイル幅の半分（菱形の横半径）
const ISO_H = 24;     // タイル高さの半分（菱形の縦半径）
const MAP_SIZE = 12;  // 12x12 のマップ

// === タイルタイプ ===
const TILE = {
  GRASS:  { id: 'grass',  emoji: '',   color: '#7cb342', accent: '#558b2f', name: '草原' },
  TREE:   { id: 'tree',   emoji: '🌳', color: '#7cb342', accent: '#558b2f', name: '木',     blocked: true },
  ROCK:   { id: 'rock',   emoji: '🪨', color: '#a1887f', accent: '#6d4c41', name: '岩',     blocked: true },
  WATER:  { id: 'water',  emoji: '🌊', color: '#4fc3f7', accent: '#0288d1', name: '川',     blocked: true },
  FLOWER: { id: 'flower', emoji: '🌼', color: '#7cb342', accent: '#558b2f', name: '花' },
  BUSH:   { id: 'bush',   emoji: '🌿', color: '#7cb342', accent: '#558b2f', name: '草むら' },
  SAND:   { id: 'sand',   emoji: '',   color: '#fff59d', accent: '#fbc02d', name: '砂地' },
  PATH:   { id: 'path',   emoji: '',   color: '#bcaaa4', accent: '#795548', name: '道' },
};

// === マップ状態 ===
let mapState = {
  tiles: [],       // [y][x] = TILE
  player: { x: 6, y: 6, facing: 'down' },
  pet: null,       // {x, y}
  enemies: [],     // [{x, y, data, id}]
  width: MAP_SIZE,
  height: MAP_SIZE,
  cameraX: 0,
  cameraY: 0,
};

// === マップ生成 ===
function generateMap() {
  const tiles = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    const row = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      // ランダムに地形配置
      const r = Math.random();
      let tile;
      if (r < 0.05) tile = TILE.TREE;
      else if (r < 0.08) tile = TILE.ROCK;
      else if (r < 0.10) tile = TILE.WATER;
      else if (r < 0.13) tile = TILE.FLOWER;
      else if (r < 0.16) tile = TILE.BUSH;
      else tile = TILE.GRASS;
      row.push(tile);
    }
    tiles.push(row);
  }
  
  // プレイヤーの位置はクリアに（草原に強制）
  const px = Math.floor(MAP_SIZE / 2);
  const py = Math.floor(MAP_SIZE / 2);
  tiles[py][px] = TILE.GRASS;
  tiles[py][px-1] = TILE.GRASS;
  tiles[py][px+1] = TILE.GRASS;
  tiles[py-1][px] = TILE.GRASS;
  tiles[py+1][px] = TILE.GRASS;
  
  mapState.tiles = tiles;
  mapState.player.x = px;
  mapState.player.y = py;
  mapState.enemies = [];
  
  // ペット同伴
  if (game.pet) {
    mapState.pet = { x: px - 1, y: py };
  } else {
    mapState.pet = null;
  }
  
  // 敵を配置
  spawnEnemies(3 + Math.floor(Math.random() * 2));
}

// === 敵の配置 ===
function spawnEnemies(count) {
  let enemyIdCounter = mapState.enemies.length;
  for (let i = 0; i < count; i++) {
    let attempt = 0;
    while (attempt < 30) {
      const ex = Math.floor(Math.random() * MAP_SIZE);
      const ey = Math.floor(Math.random() * MAP_SIZE);
      // プレイヤーから3マス以上離す
      const dist = Math.abs(ex - mapState.player.x) + Math.abs(ey - mapState.player.y);
      if (dist >= 3 && !isBlocked(ex, ey) && !getEnemyAt(ex, ey)) {
        const minLevel = Math.max(1, game.player.level - 1);
        const maxLevel = game.player.level + 1;
        const available = NORMAL_DRAGONS.filter(d => d.level >= minLevel && d.level <= maxLevel);
        const enemyData = available.length > 0
          ? available[Math.floor(Math.random() * available.length)]
          : NORMAL_DRAGONS[0];
        mapState.enemies.push({
          x: ex,
          y: ey,
          data: enemyData,
          id: 'enemy_' + (++enemyIdCounter) + '_' + Date.now(),
          hp: enemyData.hp,  // フィールド上で「つつかれた」ダメージを保持
        });
        break;
      }
      attempt++;
    }
  }
}

function isBlocked(x, y) {
  if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return true;
  const tile = mapState.tiles[y][x];
  return tile && tile.blocked;
}

function getEnemyAt(x, y) {
  return mapState.enemies.find(e => e.x === x && e.y === y);
}

// === isometric座標変換 ===
function isoX(gx, gy) {
  return (gx - gy) * ISO_W;
}
function isoY(gx, gy) {
  return (gx + gy) * ISO_H;
}

// === マップ描画 ===
let mapCanvas, mapCtx;

function initMapCanvas() {
  mapCanvas = document.getElementById('map-canvas');
  mapCtx = mapCanvas.getContext('2d');
  resizeMapCanvas();
  window.addEventListener('resize', resizeMapCanvas);
}

function resizeMapCanvas() {
  const container = document.getElementById('map-container');
  if (!container || !mapCanvas) return;
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  mapCanvas.width = rect.width * dpr;
  mapCanvas.height = rect.height * dpr;
  mapCanvas.style.width = rect.width + 'px';
  mapCanvas.style.height = rect.height + 'px';
  mapCtx.scale(dpr, dpr);
  drawMap();
}

function drawMap() {
  if (!mapCtx || !mapState.tiles.length) return;
  
  const rect = mapCanvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  
  // 背景
  mapCtx.fillStyle = '#1a3a1a';
  mapCtx.fillRect(0, 0, w, h);
  
  // カメラ：プレイヤーを画面中央に
  const pIsoX = isoX(mapState.player.x, mapState.player.y);
  const pIsoY = isoY(mapState.player.x, mapState.player.y);
  const offsetX = w / 2 - pIsoX;
  const offsetY = h / 2 - pIsoY - 20;
  
  mapState.cameraX = offsetX;
  mapState.cameraY = offsetY;
  
  // 描画順：奥から手前（y+xが小さい順）
  // 1. すべてのタイル（地面）
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      drawTile(x, y, offsetX, offsetY);
    }
  }
  
  // 2. オブジェクト（木・岩など）とキャラクター（painter's algorithm）
  const objects = [];
  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const tile = mapState.tiles[y][x];
      if (tile.emoji && tile.id !== 'flower' && tile.id !== 'bush') {
        objects.push({ x, y, type: 'tile', tile });
      } else if (tile.emoji) {
        // 小さい装飾は地面に直接描画したいので低優先度
        objects.push({ x, y, type: 'decor', tile });
      }
    }
  }
  // 敵
  mapState.enemies.forEach(e => objects.push({ x: e.x, y: e.y, type: 'enemy', enemy: e }));
  // ペット
  if (mapState.pet) {
    objects.push({ x: mapState.pet.x, y: mapState.pet.y, type: 'pet' });
  }
  // プレイヤー
  objects.push({ x: mapState.player.x, y: mapState.player.y, type: 'player' });
  
  // y+xでソート（奥から手前）。同じならtypeで優先順位（地形→装飾→キャラ）
  const typeOrder = { tile: 0, decor: 1, enemy: 2, pet: 3, player: 4 };
  objects.sort((a, b) => {
    const da = a.x + a.y;
    const db = b.x + b.y;
    if (da !== db) return da - db;
    return typeOrder[a.type] - typeOrder[b.type];
  });
  
  // 描画
  for (const obj of objects) {
    const px = isoX(obj.x, obj.y) + offsetX;
    const py = isoY(obj.x, obj.y) + offsetY;
    
    if (obj.type === 'tile' || obj.type === 'decor') {
      drawEmojiOnTile(obj.tile.emoji, px, py, obj.type === 'decor' ? 22 : 36);
    } else if (obj.type === 'enemy') {
      drawEnemySprite(obj.enemy, px, py);
    } else if (obj.type === 'pet') {
      drawEmojiOnTile(game.pet.emoji, px, py, 28);
    } else if (obj.type === 'player') {
      drawPlayer(px, py);
    }
  }
  
  // 隣接する敵をハイライト
  const adj = getAdjacentEnemy();
  if (adj) {
    const ex = isoX(adj.x, adj.y) + offsetX;
    const ey = isoY(adj.x, adj.y) + offsetY;
    mapCtx.save();
    mapCtx.strokeStyle = 'rgba(255, 235, 59, 0.9)';
    mapCtx.lineWidth = 3;
    drawDiamond(ex, ey, ISO_W - 4, ISO_H - 2);
    mapCtx.stroke();
    mapCtx.restore();
  }
}

function drawTile(x, y, offsetX, offsetY) {
  const tile = mapState.tiles[y][x];
  const px = isoX(x, y) + offsetX;
  const py = isoY(x, y) + offsetY;
  
  // 菱形タイル
  mapCtx.beginPath();
  drawDiamond(px, py, ISO_W, ISO_H);
  
  // グラデーション
  const grad = mapCtx.createLinearGradient(px, py - ISO_H, px, py + ISO_H);
  grad.addColorStop(0, tile.color);
  grad.addColorStop(1, tile.accent);
  mapCtx.fillStyle = grad;
  mapCtx.fill();
  
  // タイル枠
  mapCtx.strokeStyle = 'rgba(0,0,0,0.2)';
  mapCtx.lineWidth = 1;
  mapCtx.stroke();
}

function drawDiamond(cx, cy, w, h) {
  mapCtx.beginPath();
  mapCtx.moveTo(cx, cy - h);
  mapCtx.lineTo(cx + w, cy);
  mapCtx.lineTo(cx, cy + h);
  mapCtx.lineTo(cx - w, cy);
  mapCtx.closePath();
}

function drawEmojiOnTile(emoji, px, py, size) {
  mapCtx.save();
  mapCtx.font = `${size}px sans-serif`;
  mapCtx.textAlign = 'center';
  mapCtx.textBaseline = 'bottom';
  // 影
  mapCtx.shadowColor = 'rgba(0,0,0,0.4)';
  mapCtx.shadowBlur = 4;
  mapCtx.shadowOffsetY = 2;
  mapCtx.fillText(emoji, px, py + 8);
  mapCtx.restore();
}

function drawPlayer(px, py) {
  mapCtx.save();
  // 影
  mapCtx.beginPath();
  mapCtx.ellipse(px, py + 4, 16, 6, 0, 0, Math.PI * 2);
  mapCtx.fillStyle = 'rgba(0,0,0,0.4)';
  mapCtx.fill();
  
  // プレイヤー絵文字
  mapCtx.font = '42px sans-serif';
  mapCtx.textAlign = 'center';
  mapCtx.textBaseline = 'bottom';
  mapCtx.fillText('🧒', px, py + 10);
  mapCtx.restore();
}

function drawEnemySprite(enemy, px, py) {
  mapCtx.save();
  // 影
  mapCtx.beginPath();
  mapCtx.ellipse(px, py + 4, 18, 7, 0, 0, Math.PI * 2);
  mapCtx.fillStyle = 'rgba(0,0,0,0.5)';
  mapCtx.fill();
  
  // 赤いオーラ
  const aura = mapCtx.createRadialGradient(px, py - 10, 5, px, py - 10, 30);
  aura.addColorStop(0, 'rgba(255,0,0,0.3)');
  aura.addColorStop(1, 'rgba(255,0,0,0)');
  mapCtx.fillStyle = aura;
  mapCtx.fillRect(px - 30, py - 40, 60, 60);
  
  // 敵絵文字
  mapCtx.font = '40px sans-serif';
  mapCtx.textAlign = 'center';
  mapCtx.textBaseline = 'bottom';
  mapCtx.fillText(enemy.data.emoji, px, py + 8);
  
  // HP表示（つつかれてダメージ受けた敵のみ）
  if (enemy.hp < enemy.data.hp) {
    const barW = 30;
    const barH = 4;
    const barX = px - barW / 2;
    const barY = py - 40;
    mapCtx.fillStyle = 'rgba(0,0,0,0.7)';
    mapCtx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    mapCtx.fillStyle = '#f44336';
    mapCtx.fillRect(barX, barY, barW * (enemy.hp / enemy.data.hp), barH);
  }
  
  mapCtx.restore();
}

// === 隣接判定 ===
function getAdjacentEnemy() {
  const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
  for (const d of dirs) {
    const e = getEnemyAt(mapState.player.x + d.dx, mapState.player.y + d.dy);
    if (e) return e;
  }
  return null;
}

// === プレイヤー移動 ===
function movePlayer(dir) {
  const dirs = {
    up:    { dx: 0,  dy: -1 },
    down:  { dx: 0,  dy: 1 },
    left:  { dx: -1, dy: 0 },
    right: { dx: 1,  dy: 0 },
  };
  const d = dirs[dir];
  if (!d) return;
  
  mapState.player.facing = dir;
  const nx = mapState.player.x + d.dx;
  const ny = mapState.player.y + d.dy;
  
  // 境界チェック
  if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) {
    showMessage("ここから 先には 行けない");
    drawMap();
    return;
  }
  
  // 障害物チェック
  if (isBlocked(nx, ny)) {
    const tile = mapState.tiles[ny][nx];
    showMessage(`${tile.name}が あって 進めない`);
    drawMap();
    return;
  }
  
  // 敵がいる場合は通り抜けられない
  if (getEnemyAt(nx, ny)) {
    showMessage("ドラゴンが いる！ つつくか たたかおう！");
    drawMap();
    updateAdjacentActions();
    return;
  }
  
  // 移動！
  const oldX = mapState.player.x;
  const oldY = mapState.player.y;
  mapState.player.x = nx;
  mapState.player.y = ny;
  
  // ペットも追従（プレイヤーの元位置に来る）
  if (mapState.pet) {
    mapState.pet.x = oldX;
    mapState.pet.y = oldY;
  }
  
  drawMap();
  updateAdjacentActions();
  
  // メッセージ更新
  const adj = getAdjacentEnemy();
  if (adj) {
    showMessage(`${adj.data.name} が ちかくに いる！`);
  } else if (mapState.enemies.length === 0) {
    showMessage("このエリアの ドラゴンは すべて 倒した！");
  } else {
    showMessage(`歩いている... のこり ${mapState.enemies.length}匹`);
  }
}

// === 隣接アクション表示制御 ===
function updateAdjacentActions() {
  const adj = getAdjacentEnemy();
  const area = document.getElementById('adjacent-actions');
  if (adj) {
    area.style.display = 'flex';
  } else {
    area.style.display = 'none';
  }
}

// === ドラゴンを「つつく」 ===
function pokeDragon() {
  const adj = getAdjacentEnemy();
  if (!adj) return;
  
  // 小ダメージ与えて、ランダムに移動させる
  const dmg = Math.max(1, Math.floor(getTotalAttack() / 3));
  adj.hp -= dmg;
  
  if (adj.hp <= 0) {
    // つついて倒した
    showMessage(`${adj.data.name} を つつき倒した！ EXP+${Math.floor(adj.data.exp / 2)}`);
    game.player.exp += Math.floor(adj.data.exp / 2);
    game.player.gold += Math.floor(adj.data.gold / 2);
    game.player.defeatedCount++;
    game.defeatedEnemies.push(adj.data.name);
    mapState.enemies = mapState.enemies.filter(e => e.id !== adj.id);
    checkLevelUpFromField();
    autoSave();
  } else {
    // ドラゴンが隣のマスに移動を試みる（離れる方向）
    showMessage(`${adj.data.name} に ${dmg} のダメージ！`);
    moveEnemyAway(adj);
  }
  
  updateFieldUI();
  updateAdjacentActions();
  drawMap();
}

function moveEnemyAway(enemy) {
  // プレイヤーから離れる方向を優先
  const dx = enemy.x - mapState.player.x;
  const dy = enemy.y - mapState.player.y;
  const candidates = [];
  if (dx > 0) candidates.push({ nx: enemy.x + 1, ny: enemy.y });
  if (dx < 0) candidates.push({ nx: enemy.x - 1, ny: enemy.y });
  if (dy > 0) candidates.push({ nx: enemy.x, ny: enemy.y + 1 });
  if (dy < 0) candidates.push({ nx: enemy.x, ny: enemy.y - 1 });
  // 周囲のすべての方向もフォールバック候補に
  candidates.push(
    { nx: enemy.x + 1, ny: enemy.y },
    { nx: enemy.x - 1, ny: enemy.y },
    { nx: enemy.x, ny: enemy.y + 1 },
    { nx: enemy.x, ny: enemy.y - 1 }
  );
  
  for (const c of candidates) {
    if (c.nx < 0 || c.nx >= MAP_SIZE || c.ny < 0 || c.ny >= MAP_SIZE) continue;
    if (isBlocked(c.nx, c.ny)) continue;
    if (c.nx === mapState.player.x && c.ny === mapState.player.y) continue;
    if (mapState.pet && c.nx === mapState.pet.x && c.ny === mapState.pet.y) continue;
    if (getEnemyAt(c.nx, c.ny)) continue;
    enemy.x = c.nx;
    enemy.y = c.ny;
    return;
  }
  // 移動できない場合はその場
}

// === 隣接時の戦闘開始 ===
function startBattleWithAdjacent() {
  const adj = getAdjacentEnemy();
  if (!adj) return;
  
  // フィールド上のHPを継承して戦闘へ
  game.currentEnemy = {
    ...adj.data,
    currentHp: adj.hp,
    isBoss: !!adj.isBoss,
    _mapEnemyId: adj.id,
  };
  game.isBossBattle = !!adj.isBoss;
  startBattle();
}

// === レベルアップチェック（フィールドから） ===
function checkLevelUpFromField() {
  const expNeeded = expForNextLevel(game.player.level);
  if (game.player.exp >= expNeeded) {
    levelUp();
  }
}

// === 十字キーイベント設定 ===
function initDpad() {
  document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
    const dir = btn.dataset.dir;
    let pressTimer = null;
    let pressed = false;
    
    const startPress = (e) => {
      e.preventDefault();
      if (pressed) return;
      pressed = true;
      movePlayer(dir);
      // 長押し連続移動
      pressTimer = setInterval(() => {
        movePlayer(dir);
      }, 250);
    };
    const endPress = () => {
      pressed = false;
      if (pressTimer) {
        clearInterval(pressTimer);
        pressTimer = null;
      }
    };
    
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('touchend', endPress);
    btn.addEventListener('touchcancel', endPress);
    btn.addEventListener('mousedown', startPress);
    btn.addEventListener('mouseup', endPress);
    btn.addEventListener('mouseleave', endPress);
  });
  
  // キーボード操作（PC用）
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('field-screen').classList.contains('active')) return;
    if (e.repeat) return;
    if (e.key === 'ArrowUp' || e.key === 'w') movePlayer('up');
    if (e.key === 'ArrowDown' || e.key === 's') movePlayer('down');
    if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer('left');
    if (e.key === 'ArrowRight' || e.key === 'd') movePlayer('right');
  });
}
