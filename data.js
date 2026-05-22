// ============================================
// ドラゴンバトルロイヤル（仮） - ゲームデータ
// ============================================

// === 通常ドラゴン（敵） ===
const NORMAL_DRAGONS = [
  { name: "こドラゴン",      emoji: "🐲", hp: 6,   attack: 1, exp: 5,   gold: 4,   level: 1 },
  { name: "くさドラゴン",    emoji: "🐉", hp: 10,  attack: 2, exp: 8,   gold: 6,   level: 1 },
  { name: "いわドラゴン",    emoji: "🦖", hp: 15,  attack: 3, exp: 12,  gold: 10,  level: 2 },
  { name: "かわドラゴン",    emoji: "🐊", hp: 20,  attack: 4, exp: 15,  gold: 12,  level: 2 },
  { name: "もりドラゴン",    emoji: "🐍", hp: 26,  attack: 5, exp: 20,  gold: 15,  level: 3 },
  { name: "ほのおドラゴン",  emoji: "🔥", hp: 33,  attack: 7, exp: 28,  gold: 20,  level: 4 },
  { name: "こおりドラゴン",  emoji: "❄️", hp: 40,  attack: 8, exp: 35,  gold: 25,  level: 5 },
  { name: "かみなりドラゴン",emoji: "⚡", hp: 48,  attack: 10,exp: 45,  gold: 30,  level: 6 },
  { name: "やみドラゴン",    emoji: "🌑", hp: 58,  attack: 12,exp: 55,  gold: 38,  level: 7 },
  { name: "ひかりドラゴン",  emoji: "✨", hp: 70,  attack: 14,exp: 70,  gold: 48,  level: 8 },
];

// === ボスドラゴン ===
const BOSS_DRAGONS = [
  { 
    name: "ボス・グラドラ",   emoji: "👹", hp: 60,  attack: 8,  exp: 50,  gold: 50,  level: 3,
    dropItem: "ドラゴンのツメ"
  },
  { 
    name: "ボス・イフリート", emoji: "🔥", hp: 100, attack: 12, exp: 100, gold: 100, level: 5,
    dropItem: "ほのおの石"
  },
  { 
    name: "ボス・リヴァイア", emoji: "🐋", hp: 150, attack: 16, exp: 180, gold: 180, level: 7,
    dropItem: "うみの宝玉"
  },
  { 
    name: "ボス・サンダーガ", emoji: "⚡", hp: 220, attack: 22, exp: 300, gold: 300, level: 9,
    dropItem: "らいげきのツノ"
  },
  { 
    name: "魔王ドラゴン",     emoji: "👺", hp: 350, attack: 30, exp: 500, gold: 500, level: 12,
    dropItem: "まおうのウロコ"
  },
];

// === フィールドの環境 ===
const FIELDS = [
  { name: "草原",   className: "",       elements: ["🌳", "🌱", "🌿", "🌼", "🪨"] },
  { name: "森",     className: "forest", elements: ["🌲", "🌳", "🍄", "🌿", "🦋"] },
  { name: "岩場",   className: "rocky",  elements: ["🪨", "⛰️", "🗿", "🪨", "🌵"] },
  { name: "川岸",   className: "river",  elements: ["🐟", "🌊", "🪨", "🌿", "🌳"] },
];

// === ショップ商品 ===
const SHOP_ITEMS = {
  item: [
    { id: "potion_s",   name: "ちいさな ポーション", emoji: "🧪", desc: "HP+15 かいふくする", price: 20,  type: "heal", value: 15 },
    { id: "potion_m",   name: "ポーション",         emoji: "🧴", desc: "HP+40 かいふくする", price: 50,  type: "heal", value: 40 },
    { id: "potion_l",   name: "おおきな ポーション", emoji: "⚗️", desc: "HP+100 かいふくする",price: 120, type: "heal", value: 100 },
    { id: "elixir",     name: "エリクサー",         emoji: "💎", desc: "HPを ぜんかい",      price: 300, type: "heal_full" },
    { id: "atk_potion", name: "ちからのくすり",     emoji: "💪", desc: "こうげき+1",         price: 200, type: "atk_up", value: 1 },
  ],
  food: [
    { id: "apple",  name: "りんご",       emoji: "🍎", desc: "HP+8 おいしい",     price: 10,  type: "heal", value: 8 },
    { id: "bread",  name: "パン",         emoji: "🍞", desc: "HP+20 ふっくら",    price: 25,  type: "heal", value: 20 },
    { id: "meat",   name: "おにく",       emoji: "🍖", desc: "HP+50 ジューシー",  price: 70,  type: "heal", value: 50 },
    { id: "cake",   name: "ケーキ",       emoji: "🎂", desc: "HP+30 あまい",      price: 40,  type: "heal", value: 30 },
    { id: "sushi",  name: "おすし",       emoji: "🍣", desc: "HP+80 さいこう",    price: 100, type: "heal", value: 80 },
  ],
  clothes: [
    { id: "cloth_normal", name: "ふつうの ふく",   emoji: "👕", desc: "HP+10",       price: 50,   type: "equip", maxHpBonus: 10,  atkBonus: 0 },
    { id: "cloth_leather",name: "かわの よろい",   emoji: "🥋", desc: "HP+25 こうげき+2",  price: 150,  type: "equip", maxHpBonus: 25,  atkBonus: 2 },
    { id: "cloth_iron",   name: "てつの よろい",   emoji: "🛡️", desc: "HP+50 こうげき+4",  price: 400,  type: "equip", maxHpBonus: 50,  atkBonus: 4 },
    { id: "cloth_gold",   name: "おうごんの よろい", emoji: "🌟", desc: "HP+100 こうげき+8", price: 1000, type: "equip", maxHpBonus: 100, atkBonus: 8 },
    { id: "cloth_dragon", name: "ドラゴンの よろい", emoji: "🐲", desc: "HP+200 こうげき+15",price: 3000, type: "equip", maxHpBonus: 200, atkBonus: 15 },
  ],
  pet: [
    { id: "pet_dog",    name: "いぬ",        emoji: "🐶", desc: "こうげき+3 でたたかう", price: 100,  type: "pet", attack: 3 },
    { id: "pet_cat",    name: "ねこ",        emoji: "🐱", desc: "こうげき+5 でたたかう", price: 200,  type: "pet", attack: 5 },
    { id: "pet_rabbit", name: "うさぎ",      emoji: "🐰", desc: "こうげき+4 すばやい",   price: 180,  type: "pet", attack: 4 },
    { id: "pet_fox",    name: "きつね",      emoji: "🦊", desc: "こうげき+8 かしこい",   price: 500,  type: "pet", attack: 8 },
    { id: "pet_dragon", name: "こドラゴン",  emoji: "🐲", desc: "こうげき+15 さいきょう",price: 2000, type: "pet", attack: 15 },
    { id: "pet_unicorn",name: "ユニコーン",  emoji: "🦄", desc: "こうげき+12 まほう",    price: 1500, type: "pet", attack: 12 },
  ]
};

// === 進行ステップ ===
// 通常ドラゴンを倒すと encounterCount++
// 一定数倒すと「狭い道へ」ボタンが出現 → ボス出現
const STEPS_TO_BOSS = 3;  // 何体倒すと狭い道が出現するか

// === レベルアップに必要なEXP ===
function expForNextLevel(level) {
  return Math.floor(10 * Math.pow(1.5, level - 1));
}

// === セーブキー ===
const SAVE_KEY = "dragon_battle_royal_save_v1";
