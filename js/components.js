/**
 * A-Frame カスタムコンポーネント
 * - nav-arrow: ナビゲーション矢印
 * - destination-marker: 目的地マーカー
 */

AFRAME.registerComponent('nav-arrow', {
  schema: {
    bearing: { type: 'number', default: 0 },
    distance: { type: 'number', default: 0 },
    maxDistance: { type: 'number', default: 3.6 },
  },

  init: function () {
    const { bearing, distance, maxDistance } = this.data;

    // 距離に応じた色（近い=緑、遠い=赤）
    const ratio = Math.min(distance / maxDistance, 1);
    const r = Math.round(255 * ratio);
    const g = Math.round(255 * (1 - ratio));
    const color = `rgb(${r}, ${g}, 0)`;

    // 距離に応じたスケール（近い=小さい、遠い=大きい）
    // 0km → 1倍, maxDistance → 3倍 の範囲でスケール
    const scale = 1 + 2 * ratio;

    // 矢印の軸（コーン＝矢先 + シリンダー＝軸）
    const arrowGroup = document.createElement('a-entity');
    arrowGroup.setAttribute('rotation', `0 ${-bearing} 0`);
    arrowGroup.setAttribute('scale', `${scale} ${scale} ${scale}`);

    // 矢先（コーン）
    const cone = document.createElement('a-cone');
    cone.setAttribute('color', color);
    cone.setAttribute('height', '3');
    cone.setAttribute('radius-bottom', '1.5');
    cone.setAttribute('radius-top', '0');
    cone.setAttribute('position', '0 3 -3');
    cone.setAttribute('rotation', '-90 0 0');

    // 軸（シリンダー）
    const shaft = document.createElement('a-cylinder');
    shaft.setAttribute('color', color);
    shaft.setAttribute('height', '4');
    shaft.setAttribute('radius', '0.7');
    shaft.setAttribute('position', '0 3 1');
    shaft.setAttribute('rotation', '-90 0 0');

    arrowGroup.appendChild(cone);
    arrowGroup.appendChild(shaft);
    this.el.appendChild(arrowGroup);
  },
});

AFRAME.registerComponent('destination-marker', {
  schema: {
    model: { type: 'string', default: '' },
    name: { type: 'string', default: '' },
  },

  init: function () {
    const { model, name } = this.data;

    if (model) {
      // glTFモデルを読み込む
      const modelWrapper = document.createElement('a-entity');
      modelWrapper.setAttribute('gltf-model', model);
      modelWrapper.setAttribute('scale', '5 5 5');

      // モデル読み込み完了後にバウンディングボックスで接地調整
      modelWrapper.addEventListener('model-loaded', () => {
        const mesh = modelWrapper.getObject3D('mesh');
        if (mesh) {
          const box = new THREE.Box3().setFromObject(mesh);
          const offsetY = -box.min.y;
          modelWrapper.object3D.position.y += offsetY;

          // ラベルをモデル上部に配置
          if (name) {
            const height = (box.max.y - box.min.y) + offsetY;
            const text = document.createElement('a-text');
            text.setAttribute('value', name);
            text.setAttribute('align', 'center');
            text.setAttribute('position', `0 ${(height + 3) / 5} 0`);
            text.setAttribute('scale', '3 3 3');
            text.setAttribute('color', '#FFFFFF');
            text.setAttribute('side', 'double');
            modelWrapper.appendChild(text);
          }
        }
      });

      this.el.appendChild(modelWrapper);
    } else {
      // デフォルト: ピン型マーカー
      const pin = document.createElement('a-entity');
      pin.setAttribute('position', '0 5 0');

      // ピンの柱
      const pole = document.createElement('a-cylinder');
      pole.setAttribute('color', '#E53935');
      pole.setAttribute('height', '8');
      pole.setAttribute('radius', '0.5');
      pole.setAttribute('position', '0 0 0');

      // ピンの頭
      const head = document.createElement('a-sphere');
      head.setAttribute('color', '#E53935');
      head.setAttribute('radius', '2');
      head.setAttribute('position', '0 5 0');

      pin.appendChild(pole);
      pin.appendChild(head);
      this.el.appendChild(pin);

      // 上下アニメーション
      this.el.setAttribute('animation', {
        property: 'position',
        dir: 'alternate',
        dur: 2000,
        easing: 'easeInOutSine',
        loop: true,
        to: `${this.el.getAttribute('position').x || 0} 3 ${this.el.getAttribute('position').z || 0}`,
      });

      // 名前ラベル
      if (name) {
        const text = document.createElement('a-text');
        text.setAttribute('value', name);
        text.setAttribute('align', 'center');
        text.setAttribute('position', '0 15 0');
        text.setAttribute('scale', '15 15 15');
        text.setAttribute('color', '#FFFFFF');
        text.setAttribute('side', 'double');
        this.el.appendChild(text);
      }
    }
  },
});
