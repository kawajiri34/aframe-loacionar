# aframe-loacionar — ロケーションベースAR ナビゲーション

ユーザーの現在地周辺に目的地方向へのナビゲーション矢印を表示し、目的地に近づくと3Dオブジェクトが出現するWebベースのロケーションARアプリ。

## 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| AR フレームワーク | AR.js 3.x (location-based) | ブラウザのみでGPSベースARが可能 |
| 3D レンダリング | A-Frame 1.4+ | 宣言的に3Dシーンを記述できる |
| ナビゲーション | カスタムコンポーネント | グリッド矢印＋目的地マーカー |
| データ | 静的JSON | スポット情報（緯度経度・モデル・説明） |
| ホスティング | GitHub Pages等 | HTTPS必須（GPS・カメラ利用のため） |

## ファイル構成

```
aframe-loacionar/
├── index.html              # メインHTML（A-Frame ARシーン）
├── data/
│   ├── spots.json          # 目的地データ
│   └── 3dcar/              # 3Dモデル元ファイル（OBJ/FBX/BLEND）
├── assets/
│   └── models/
│       └── car.glb         # 変換済み3Dモデル（glTF）
├── js/
│   ├── app.js              # メイン：データ読込 → グリッド生成 → シーン構築
│   ├── grid.js             # グリッド座標計算（緯度経度変換・ベアリング計算）
│   └── components.js       # A-Frameカスタムコンポーネント（矢印・マーカー）
└── css/
    └── style.css           # UIオーバーレイ（距離表示・スポット名）
```

## 設計詳細

### データ構造（spots.json）

```json
[
  {
    "id": "spot-1",
    "name": "目的地",
    "lat": 43.064764,
    "lng": 141.361568,
    "model": "assets/models/car.glb",
    "description": "札幌"
  }
]
```

- `model` が `null` → プリミティブのピンマーカーを表示（浮遊アニメーション付き）
- `model` にglTFパスを指定 → 3Dモデルを読み込み、地面に接地するよう自動調整

### グリッド計算（grid.js）

ユーザーの現在地を中心に1km四方・100mグリッドを生成する。

- **グリッドポイント**: -500m〜+500m を100m刻み → 11×11 = **121点**
- **緯度経度変換**:
  - 1km in 緯度 = `1 / 111.32` 度
  - 1km in 経度 = `1 / (111.32 × cos(lat))` 度
- **ベアリング計算**（各グリッド点→目的地）:
  - `bearing = atan2(sin(Δlng)·cos(lat2), cos(lat1)·sin(lat2) - sin(lat1)·cos(lat2)·cos(Δlng))`
- ユーザーが**50m以上移動**するとグリッドを再生成

### カスタムコンポーネント（components.js）

#### `nav-arrow`
- コーン（矢先）＋シリンダー（軸）で矢印を構成
- ベアリング値でY軸回転し、目的地方向を指す
- **距離に応じた色分け**（近い=緑、遠い=赤）
- **距離に応じたサイズ変化**（近い=1倍〜遠い=3倍）— 遠くても視認しやすい

#### `destination-marker`
- デフォルト: 赤いシリンダー＋球のピン形状、上下の浮遊アニメーション付き
- glTFモデル指定時: `gltf-model`で読み込み、バウンディングボックスから接地位置を自動計算
- 目的地名のテキストラベル表示

### 表示距離ルール

| 対象 | 表示条件 |
|------|---------|
| ナビゲーション矢印 | 常にユーザー周囲1km四方に表示（移動で再配置） |
| 目的地3Dモデル | ユーザーから**500m以内**に近づいたら表示 |

### メインフロー（app.js）

1. `spots.json` をfetchで読み込み
2. スポット選択UIを表示
3. 選択されたスポットに対して:
   - 目的地マーカーを生成（非表示状態）
   - GPS追跡を開始
4. GPS更新ごとに:
   - 目的地までの距離をUIに表示
   - 目的地モデルの表示/非表示を制御（500m以内で表示）
   - 50m以上移動していたらグリッド矢印を再生成（旧矢印を削除→新規配置）

## 動作要件

- HTTPS環境（GPS・カメラAPIの利用に必須）
- スマートフォンブラウザ（iOS Safari / Android Chrome）
- GPS・カメラの使用許可

## サーバー起動手順

### ローカル開発（PC）

```bash
# プロジェクトディレクトリに移動
cd aframe-loacionar

# HTTPSサーバーを起動（方法1: serve）
npx serve .

# HTTPSサーバーを起動（方法2: http-server + 自己署名証明書）
npx http-server -S -C cert.pem -K key.pem -p 8080
```

### スマホからアクセス

1. PCとスマホを**同じWi-Fi**に接続
2. PCのローカルIPを確認:
   ```bash
   # macOS
   ipconfig getifaddr en0
   # Linux
   hostname -I
   ```
3. スマホのブラウザで `https://<PCのIP>:3000` にアクセス
4. 自己署名証明書の警告が出たら「詳細」→「アクセスする」で許可
5. カメラ・位置情報の使用を許可

### GitHub Pages でのデプロイ

```bash
# mainブランチにプッシュ
git add -A
git commit -m "deploy"
git push origin main
```

1. GitHubリポジトリの Settings → Pages
2. Source を「main」ブランチ、「/ (root)」に設定
3. `https://<username>.github.io/aframe-loacionar/` でアクセス可能

GitHub Pages は自動でHTTPS化されるため、証明書の問題なくスマホで動作します。

## 3Dモデルについて

- 目的地モデル: [Mercedes-Benz GLS 580](https://free3d.com/ja/3d-model/mercedes-benz-gls-580-2020-83444.html)（Free3D）
- OBJからglBに変換: `npx obj2gltf -i input.obj -o output.glb --binary`

## 注意事項

- GPSの精度はスマホで5〜15mの誤差あり。近距離のスポットでは位置がずれる可能性がある
- 121個のARエンティティはAR.jsで十分処理可能（50m移動ごとに再生成）
- ユーザーの周囲に常に矢印があるため、どこにいても目的地方向を確認できる
