import { generateGrid, distanceKm } from './grid.js';

const DEST_VISIBILITY_KM = 0.5; // 目的地モデルは500m以内で表示
const REGRID_THRESHOLD_KM = 0.05; // 50m移動でグリッド再生成

const scene = document.querySelector('a-scene');
const overlay = document.getElementById('overlay');
const spotSelect = document.getElementById('spot-select');
const loading = document.getElementById('loading');
const spotNameEl = document.getElementById('spot-name');
const distanceEl = document.getElementById('distance');

let currentSpot = null;
let watchId = null;
let arrowEntities = [];
let destEntity = null;
let lastGridLat = null;
let lastGridLng = null;

/**
 * spots.json を読み込む
 */
async function loadSpots() {
  const res = await fetch('data/spots.json');
  return res.json();
}

/**
 * スポット選択UIを表示
 */
function showSpotSelect(spots) {
  loading.style.display = 'none';
  spotSelect.style.display = 'flex';

  const container = spotSelect.querySelector('.spot-list');
  container.innerHTML = '';

  spots.forEach((spot) => {
    const btn = document.createElement('button');
    btn.className = 'spot-btn';
    btn.textContent = `${spot.name} — ${spot.description}`;
    btn.addEventListener('click', () => startNavigation(spot));
    container.appendChild(btn);
  });
}

/**
 * ナビゲーション開始
 */
function startNavigation(spot) {
  currentSpot = spot;
  spotSelect.style.display = 'none';
  overlay.style.display = 'flex';
  spotNameEl.textContent = spot.name;

  // 目的地マーカーを生成（非表示状態）
  destEntity = document.createElement('a-entity');
  destEntity.setAttribute(
    'gps-projected-entity-place',
    `latitude: ${spot.lat}; longitude: ${spot.lng}`
  );
  destEntity.setAttribute('destination-marker', {
    model: spot.model || '',
    name: spot.name,
  });
  destEntity.setAttribute('visible', false);
  scene.appendChild(destEntity);

  // GPS追跡開始
  startTracking(spot);
}

/**
 * 既存の矢印エンティティをすべて削除
 */
function clearArrows() {
  arrowEntities.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
  arrowEntities = [];
}

/**
 * ユーザー現在地を中心にグリッド矢印を配置
 */
function placeArrows(userLat, userLng, spot) {
  clearArrows();

  const gridPoints = generateGrid(userLat, userLng, spot.lat, spot.lng);

  gridPoints.forEach((point) => {
    const entity = document.createElement('a-entity');
    entity.setAttribute(
      'gps-projected-entity-place',
      `latitude: ${point.lat}; longitude: ${point.lng}`
    );
    entity.setAttribute('nav-arrow', {
      bearing: point.bearing,
      distance: point.distToDest,
    });
    scene.appendChild(entity);
    arrowEntities.push(entity);
  });

  lastGridLat = userLat;
  lastGridLng = userLng;
}

/**
 * GPS追跡: 距離表示 + グリッド再生成 + 目的地表示制御
 */
function startTracking(spot) {
  if (!navigator.geolocation) return;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;

      // 目的地までの距離を表示
      const distToDest = distanceKm(userLat, userLng, spot.lat, spot.lng);
      if (distToDest < 1) {
        distanceEl.textContent = `${Math.round(distToDest * 1000)}m`;
      } else {
        distanceEl.textContent = `${distToDest.toFixed(1)}km`;
      }

      // 目的地モデルの表示/非表示
      if (destEntity) {
        destEntity.setAttribute('visible', distToDest <= DEST_VISIBILITY_KM);
      }

      // 初回 or 50m以上移動したらグリッド再生成
      if (
        lastGridLat === null ||
        distanceKm(userLat, userLng, lastGridLat, lastGridLng) >= REGRID_THRESHOLD_KM
      ) {
        placeArrows(userLat, userLng, spot);
      }
    },
    (err) => {
      console.warn('Geolocation error:', err);
      distanceEl.textContent = '距離不明';
    },
    { enableHighAccuracy: true }
  );
}

// 初期化
async function init() {
  try {
    const spots = await loadSpots();
    showSpotSelect(spots);
  } catch (err) {
    console.error('Failed to load spots:', err);
    loading.querySelector('p').textContent =
      'データの読み込みに失敗しました';
  }
}

init();
