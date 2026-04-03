/**
 * グリッド座標計算モジュール
 * ユーザー現在地を中心に1km四方の100mグリッド座標を生成し、
 * 各グリッド点から目的地へのベアリングを計算する
 */

const EARTH_RADIUS_KM = 6371;
const KM_PER_DEG_LAT = 111.32;

/**
 * 緯度に応じた経度1度あたりのkm数を返す
 */
function kmPerDegLng(latDeg) {
  return KM_PER_DEG_LAT * Math.cos((latDeg * Math.PI) / 180);
}

/**
 * 2点間のベアリング（方位角）を度で返す（北=0, 東=90）
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

/**
 * 2点間の距離をkmで返す（Haversine公式）
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(Δλ / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * ユーザー現在地を中心に1km四方・100mグリッドを生成
 * 各グリッド点には目的地方向へのベアリングを付与
 * @param {number} userLat - ユーザーの緯度
 * @param {number} userLng - ユーザーの経度
 * @param {number} destLat - 目的地の緯度
 * @param {number} destLng - 目的地の経度
 * @returns {Array<{lat: number, lng: number, bearing: number, distToDest: number}>}
 */
function generateGrid(userLat, userLng, destLat, destLng) {
  // -500m〜+500m を 100m刻み → 11点 × 11点 = 121点
  const points = [];

  for (let dx = -500; dx <= 500; dx += 100) {
    for (let dy = -500; dy <= 500; dy += 100) {
      const dxKm = dx / 1000;
      const dyKm = dy / 1000;

      const lat = userLat + dyKm / KM_PER_DEG_LAT;
      const lng = userLng + dxKm / kmPerDegLng(userLat);

      const bearing = calculateBearing(lat, lng, destLat, destLng);
      const distToDest = distanceKm(lat, lng, destLat, destLng);

      points.push({ lat, lng, bearing, distToDest });
    }
  }

  return points;
}

export { generateGrid, calculateBearing, distanceKm };
