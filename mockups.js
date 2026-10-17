/* Mockup templates.
   Each template is a list of editable elements (logo, text, shapes) drawn from
   the brand kit. Per-mockup edits live in item.props.ov (overrides by element id)
   and item.props.extra (elements the user added), so the brand can still change
   underneath without losing edits. */
(function () {
  'use strict';

  const INK = '#161616';
  const STUDIO = '#E7E5E1';
  const SWATCH = { light: '#F2EEE6', white: '#FFFFFF', dark: INK };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n = v => +(+v || 0).toFixed(2);

  function rgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(h)) return [0, 0, 0];
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  }
  function luminance(hex) {
    const [r, g, b] = rgb(hex).map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  const isDark = hex => contrast(hex, '#FFFFFF') > contrast(hex, INK);
  const onColor = hex => (isDark(hex) ? '#FFFFFF' : INK);

  function colorOf(key, brand) {
    if (key === 'primary') return brand.primary;
    if (key === 'secondary') return brand.secondary;
    return SWATCH[key] || key;
  }

  // Rough text width in em, good enough to keep type inside its box.
  function textWidth(s) {
    let w = 0;
    for (const ch of String(s)) {
      const c = ch.codePointAt(0);
      if (c > 0x2e80) w += 1;
      else if (ch === ' ') w += 0.3;
      else if (/[A-Z0-9]/.test(ch)) w += 0.68;
      else w += 0.56;
    }
    return w;
  }
  function fit(s, maxW, maxSize, minSize = 6) {
    const w = textWidth(s);
    if (!w) return maxSize;
    return n(Math.max(minSize, Math.min(maxSize, maxW / w)));
  }
  const slug = name => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'brand';
  const fontStack = f => `'${f}', 'Pretendard', 'Noto Sans KR', system-ui, sans-serif`;

  /* ---------- element constructors ---------- */

  const R = (id, label, x, y, w, h, fill, o = {}) => ({ id, label, kind: 'rect', x, y, w, h, fill, ...o });
  const O = (id, label, x, y, w, h, fill, o = {}) => ({ id, label, kind: 'ellipse', x, y, w, h, fill, ...o });
  const T = (id, label, o) => ({ id, label, kind: 'text', align: 'left', weight: 400, fill: 'fg', ...o });
  const L = (x, y, w, h, align = 'center') => ({ id: 'logo', label: '로고', kind: 'logo', x, y, w, h, align });
  // A shape keeps its original box so it can be moved/scaled with a transform.
  const S = (id, label, [x, y, w, h], fill, markup, o = {}) => ({ id, label, kind: 'shape', x, y, w, h, ox: x, oy: y, ow: w, oh: h, fill, markup, ...o });
  const BG = (w, h, fill, label = '배경') => R('bg', label, 0, 0, w, h, fill, { locked: true });

  /* ---------- templates ---------- */

  const year = new Date().getFullYear();

  const templates = {
    'card-front': {
      name: '명함 · 앞면', group: '인쇄', w: 350, h: 200, r: 8, bg: 'primary',
      els: () => [BG(350, 200, 'bg'), L(95, 55, 160, 90)],
    },
    'card-back': {
      name: '명함 · 뒷면', group: '인쇄', w: 350, h: 200, r: 8, bg: 'white',
      els: c => [
        BG(350, 200, 'bg'),
        L(28, 26, 96, 34, 'left'),
        T('name', '이름', { x: 28, y: 112, w: 200, size: 15, weight: 700, text: '홍길동' }),
        T('role', '직함', { x: 28, y: 128, w: 200, size: 8.5, opacity: 0.6, text: 'Brand Designer' }),
        R('bar', '포인트 라인', 28, 140, 20, 2, 'accent'),
        T('phone', '전화번호', { x: 28, y: 162, w: 150, size: 8, opacity: 0.75, text: '010 1234 5678' }),
        T('email', '이메일', { x: 28, y: 175, w: 150, size: 8, opacity: 0.75, text: `hello@${c.slug}.com` }),
        T('web', '웹사이트', { x: 172, y: 175, w: 150, size: 8, opacity: 0.75, align: 'right', text: `${c.slug}.com` }),
      ],
    },
    letterhead: {
      name: '레터헤드', group: '인쇄', w: 420, h: 594, r: 3, bg: 'white',
      els: c => {
        const widths = [340, 328, 336, 296, 0, 340, 332, 318, 260, 0, 336, 210];
        const d = new Date();
        return [
          BG(420, 594, 'bg', '종이'),
          L(40, 40, 110, 40, 'left'),
          T('web', '웹사이트', { x: 230, y: 56, w: 150, size: 7.5, opacity: 0.6, align: 'right', text: `${c.slug}.com` }),
          T('email', '이메일', { x: 230, y: 68, w: 150, size: 7.5, opacity: 0.6, align: 'right', text: `hello@${c.slug}.com` }),
          R('rule', '구분선', 40, 100, 340, 1.5, 'accent'),
          T('date', '날짜', { x: 40, y: 140, w: 120, size: 8, opacity: 0.6, text: `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}` }),
          S('body', '본문', [40, 168, 340, 181], 'fg', f => widths.map((w, i) => (w ? `<rect x="40" y="${168 + i * 16}" width="${w}" height="5" rx="2.5" fill="${f}"/>` : '')).join(''), { opacity: 0.08 }),
          T('sign', '서명', { x: 40, y: 400, w: 200, size: 9, weight: 600, text: `${c.rawName} 드림` }),
          R('footer', '하단 띠', 0, 556, 420, 38, 'accent'),
          T('address', '주소', { x: 40, y: 579, w: 260, size: 7.5, fill: 'onAccent', text: `${c.rawName} · 서울특별시 성동구 성수이로 00` }),
          T('web2', '하단 웹사이트', { x: 230, y: 579, w: 150, size: 7.5, fill: 'onAccent', align: 'right', text: `${c.slug}.com` }),
        ];
      },
    },
    poster: {
      name: '포스터', group: '인쇄', w: 420, h: 594, r: 3, bg: 'primary',
      els: c => [
        BG(420, 594, 'bg'),
        O('circle', '원', 180, 110, 240, 240, 'accent'),
        L(40, 40, 120, 48, 'left'),
        T('headline', '헤드라인', { x: 40, y: 440, w: 340, size: 72, fit: true, weight: 800, ls: -1.5, text: c.rawName }),
        T('tagline', '슬로건', { x: 40, y: 478, w: 340, size: 16, fit: true, opacity: 0.8, text: c.rawTag }),
        R('rule', '구분선', 40, 530, 340, 1, 'fg', { opacity: 0.25 }),
        T('label', '라벨', { x: 40, y: 554, w: 200, size: 9.5, weight: 600, ls: 1.5, text: `${year} COLLECTION` }),
        T('web', '웹사이트', { x: 180, y: 554, w: 200, size: 9.5, opacity: 0.7, align: 'right', text: `${c.slug}.com` }),
      ],
    },

    'app-icon': {
      name: '앱 아이콘', group: '디지털', w: 300, h: 300, r: 66, bg: 'primary',
      els: () => [BG(300, 300, 'bg'), L(70, 70, 160, 160)],
    },
    phone: {
      name: '모바일 스플래시', group: '디지털', w: 300, h: 600, r: 46, bg: 'primary',
      els: c => [
        BG(300, 600, '#111111', '기기 프레임'),
        R('screen', '화면', 10, 10, 280, 580, 'bg', { rx: 37, locked: true }),
        R('island', '다이내믹 아일랜드', 112, 24, 76, 22, '#111111', { rx: 11 }),
        T('time', '시계', { x: 40, y: 40, w: 60, size: 13, weight: 600, font: 'Inter, sans-serif', text: '9:41' }),
        L(80, 205, 140, 110),
        ...(c.logoHref ? [T('name', '브랜드명', { x: 40, y: 362, w: 220, size: 22, fit: true, weight: 700, align: 'center', text: c.rawName })] : []),
        T('tagline', '슬로건', { x: 40, y: c.logoHref ? 386 : 352, w: 220, size: 11, fit: true, align: 'center', opacity: 0.7, text: c.rawTag }),
        R('home', '홈 인디케이터', 105, 568, 90, 5, 'fg', { rx: 2.5, opacity: 0.5 }),
      ],
    },
    web: {
      name: '웹사이트', group: '디지털', w: 640, h: 400, r: 10, bg: 'primary',
      els: c => [
        BG(640, 400, '#FFFFFF', '창'),
        R('chrome', '브라우저 바', 0, 0, 640, 34, '#F1F1F1', { locked: true }),
        S('dots', '창 버튼', [13.5, 12.5, 37, 9], '#D6D6D6', f => [18, 32, 46].map(x => `<circle cx="${x}" cy="17" r="4.5" fill="${f}"/>`).join('')),
        R('url', '주소창', 200, 9, 240, 16, '#FFFFFF', { rx: 8 }),
        T('urlText', '주소', { x: 200, y: 20.5, w: 240, size: 8, align: 'center', fill: '#8A8A8A', font: 'Inter, sans-serif', text: `${c.slug}.com` }),
        R('hero', '히어로 배경', 0, 34, 640, 366, 'bg', { locked: true }),
        L(32, 52, 90, 26, 'left'),
        T('nav1', '메뉴 1', { x: 468, y: 69, w: 30, size: 9, opacity: 0.8, text: '소개' }),
        T('nav2', '메뉴 2', { x: 512, y: 69, w: 30, size: 9, opacity: 0.8, text: '제품' }),
        T('nav3', '메뉴 3', { x: 556, y: 69, w: 30, size: 9, opacity: 0.8, text: '문의' }),
        T('headline', '헤드라인', { x: 32, y: 190, w: 300, size: 46, fit: true, weight: 800, ls: -1, text: c.rawName }),
        T('sub', '서브 카피', { x: 32, y: 222, w: 300, size: 13, fit: true, opacity: 0.75, text: c.rawTag }),
        R('button', '버튼', 32, 250, 108, 34, 'accent', { rx: 17 }),
        T('buttonText', '버튼 문구', { x: 32, y: 271, w: 108, size: 11, weight: 600, align: 'center', fill: 'onAccent', text: '시작하기' }),
        R('card', '카드', 370, 104, 238, 256, 'fg', { rx: 12, opacity: 0.08 }),
        O('dot', '원', 433, 144, 112, 112, 'accent'),
        R('line1', '카드 라인 1', 402, 290, 150, 8, 'fg', { rx: 4, opacity: 0.2 }),
        R('line2', '카드 라인 2', 402, 310, 96, 8, 'fg', { rx: 4, opacity: 0.12 }),
      ],
    },
    social: {
      name: 'SNS 게시물', group: '디지털', w: 400, h: 400, r: 4, bg: 'primary',
      els: c => [
        BG(400, 400, 'bg'),
        R('frame', '테두리', 20, 20, 360, 360, 'fg', { outline: true, opacity: 0.2 }),
        L(120, 100, 160, 130),
        T('tagline', '슬로건', { x: 50, y: 300, w: 300, size: 20, fit: true, weight: 600, align: 'center', text: c.rawTag }),
        T('handle', '계정', { x: 100, y: 330, w: 200, size: 11, align: 'center', opacity: 0.6, text: `@${c.slug}` }),
      ],
    },

    tshirt: {
      name: '티셔츠', group: '굿즈 · 공간', w: 400, h: 440, r: 8, bg: 'white',
      els: () => [
        BG(400, 440, STUDIO),
        S('shirt', '티셔츠', [48, 52, 304, 352], 'bg', f => `
          <path d="M150 52 L104 66 L48 104 L76 170 L110 156 L110 404 L290 404 L290 156 L324 170 L352 104 L296 66 L250 52 Q200 92 150 52 Z" fill="${f}" stroke="#000" stroke-opacity=".1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
          <path d="M150 52 Q200 104 250 52" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
          <path d="M110 156 L104 112 M290 156 L296 112" stroke="#000" stroke-opacity=".06" vector-effect="non-scaling-stroke"/>`),
        L(160, 136, 80, 66),
      ],
    },
    mug: {
      name: '머그컵', group: '굿즈 · 공간', w: 420, h: 320, r: 8, bg: 'white',
      els: () => [
        BG(420, 320, STUDIO),
        O('shadow', '그림자', 96, 262, 208, 20, '#000000', { opacity: 0.08 }),
        S('mug', '머그', [116, 70, 232, 200], 'bg', f => `
          <path d="M284 112 C344 112 344 220 284 220" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="26" stroke-linecap="round"/>
          <path d="M284 112 C344 112 344 220 284 220" fill="none" stroke="${f}" stroke-width="22" stroke-linecap="round"/>
          <rect x="116" y="70" width="168" height="200" rx="14" fill="${f}" stroke="#000" stroke-opacity=".1" vector-effect="non-scaling-stroke"/>
          <rect x="132" y="84" width="8" height="172" rx="4" fill="#FFFFFF" fill-opacity=".3"/>`),
        L(150, 120, 100, 100),
      ],
    },
    tote: {
      name: '에코백', group: '굿즈 · 공간', w: 380, h: 460, r: 8, bg: 'light',
      els: () => [
        BG(380, 460, STUDIO),
        S('bag', '가방', [60, 48, 260, 372], 'bg', f => `
          <path d="M136 162 C136 48 244 48 244 162" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="14"/>
          <path d="M136 162 C136 48 244 48 244 162" fill="none" stroke="${f}" stroke-width="11"/>
          <path d="M76 160 L304 160 L320 420 L60 420 Z" fill="${f}" stroke="#000" stroke-opacity=".1" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`),
        L(130, 236, 120, 110),
      ],
    },
    signage: {
      name: '매장 사인', group: '굿즈 · 공간', w: 520, h: 380, r: 8, bg: 'primary',
      els: () => [
        BG(520, 380, '#E9E6E1', '벽'),
        R('board', '간판', 70, 40, 380, 86, 'bg', { rx: 4 }),
        L(150, 52, 220, 62),
        S('awning', '차양', [70, 140, 380, 46], 'accent', f => {
          let s = '';
          for (let i = 0; i < 8; i++) {
            const x = 70 + i * 47.5, fill = i % 2 ? '#FFFFFF' : f;
            s += `<rect x="${x}" y="140" width="47.5" height="34" fill="${fill}"/><path d="M${x} 174 a23.75 12 0 0 0 47.5 0 Z" fill="${fill}"/>`;
          }
          return s + '<rect x="70" y="140" width="380" height="3" fill="#000" fill-opacity=".08"/>';
        }),
        S('window', '창문', [83, 203, 226, 150], '#C9D3D8', f => `
          <rect x="86" y="206" width="220" height="144" fill="${f}" stroke="#2B2B2B" stroke-width="6"/>
          <path d="M120 340 L200 214 M160 340 L240 214" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="6"/>`),
        S('door', '문', [330, 206, 104, 144], '#2B2B2B', f => `
          <rect x="330" y="206" width="104" height="144" fill="${f}"/>
          <rect x="344" y="220" width="76" height="80" fill="#C9D3D8"/>
          <circle cx="420" cy="318" r="3" fill="#C9D3D8"/>`),
        R('ground', '바닥', 0, 350, 520, 30, '#D3CFC8', { locked: true }),
      ],
    },
  };

  const groups = ['인쇄', '디지털', '굿즈 · 공간'];

  /* ---------- context + elements ---------- */

  function context(item, brand, logoHref) {
    const p = item.props || {};
    const tpl = templates[item.template] || templates['card-front'];
    const bgKey = p.bg || tpl.bg;
    const bg = colorOf(bgKey, brand);
    const dark = isDark(bg);
    const accent = bgKey === 'primary' ? brand.secondary : brand.primary;
    let logoMode = p.logoMode || 'auto';
    if (logoMode === 'auto') logoMode = dark ? 'white' : 'original';
    const rawName = brand.name || 'Brand';
    const rawTag = brand.tagline || '';
    return {
      b: brand, id: String(item.id).replace(/[^a-z0-9]/gi, ''),
      bg, fg: dark ? '#FFFFFF' : INK, accent, onAccent: onColor(accent),
      logoHref, logoMode, logoScale: p.logoScale ?? 1,
      rawName, rawTag, name: esc(rawName), slug: slug(rawName),
    };
  }

  // Color tokens keep edits tied to the brand: 'primary' follows the brand color.
  function paint(v, c) {
    const map = { primary: c.b.primary, secondary: c.b.secondary, accent: c.accent, onAccent: c.onAccent, fg: c.fg, bg: c.bg };
    return map[v] || v || c.fg;
  }

  function elements(item, brand, logoHref) {
    const tpl = templates[item.template] || templates['card-front'];
    const c = context(item, brand, logoHref);
    const p = item.props || {};
    const ov = p.ov || {};
    const extra = p.extra || [];
    const customIds = new Set(extra.map(e => e.id));
    let list = tpl.els(c).concat(extra).map(e => ({ ...e, ...(ov[e.id] || {}), custom: customIds.has(e.id) }));
    // Custom stacking order; elements the order doesn't know keep their default place.
    if (p.order) {
      const idx = new Map(p.order.map((id, i) => [id, i]));
      list = list.map((e, i) => ({ e, k: idx.has(e.id) ? idx.get(e.id) : i + 0.5 }))
        .sort((a, b) => a.k - b.k).map(o => o.e);
    }
    return { c, tpl, list };
  }

  // Where the picture sits inside its frame: cover or contain, then crop zoom and offset.
  function imageContent(e) {
    const ar = e.ar || e.w / e.h;
    const cover = e.fitMode === 'cover';
    let cw, ch;
    if ((ar > e.w / e.h) === cover) { ch = e.h; cw = e.h * ar; } else { cw = e.w; ch = e.w / ar; }
    const z = e.cz || 1;
    cw *= z;
    ch *= z;
    return { x: e.x + (e.w - cw) / 2 + (e.cx || 0), y: e.y + (e.h - ch) / 2 + (e.cy || 0), w: cw, h: ch };
  }

  // Model box in template units. Text y is its baseline, so its box sits above it.
  function elBox(e) {
    if (e.kind === 'text') {
      const size = e.fit ? fit(e.text, e.w, e.size) : e.size;
      return { x: e.x, y: e.y - size * 0.85, w: e.w, h: size * 1.15, size };
    }
    return { x: e.x, y: e.y, w: e.w, h: e.h };
  }

  /* ---------- drawing ---------- */

  function logo(c, x, y, w, h, align) {
    const s = c.logoScale;
    const W = w * s, H = h * s;
    const X = align === 'left' ? x : x + (w - W) / 2;
    const Y = y + (h - H) / 2;
    if (c.logoHref) {
      const par = align === 'left' ? 'xMinYMid meet' : 'xMidYMid meet';
      const f = c.logoMode === 'white' ? ` filter="url(#lw-${c.id})"` : c.logoMode === 'black' ? ` filter="url(#lb-${c.id})"` : '';
      return `<image href="${esc(c.logoHref)}" x="${n(X)}" y="${n(Y)}" width="${n(W)}" height="${n(H)}" preserveAspectRatio="${par}"${f}/>`;
    }
    // No logo yet: a plain wordmark from the brand name stands in.
    let color = c.fg;
    if (c.logoMode === 'white') color = '#FFFFFF';
    else if (c.logoMode === 'black') color = INK;
    else if (contrast(c.b.primary, c.bg) >= 3) color = c.b.primary;
    const size = fit(c.rawName, W, H * 0.62);
    const tx = align === 'left' ? X : X + W / 2;
    return `<rect x="${n(X)}" y="${n(Y)}" width="${n(W)}" height="${n(H)}" fill="transparent"/><text x="${n(tx)}" y="${n(Y + H / 2)}" font-size="${size}" font-weight="800" letter-spacing="${n(-size * 0.03)}" text-anchor="${align === 'left' ? 'start' : 'middle'}" dominant-baseline="central" fill="${color}">${c.name}</text>`;
  }

  // Clipping mask for a picture: its own frame (rect, rounded, circle) or another element's shape.
  function maskShape(e, c, opts) {
    if (e.mask === 'element' && e.maskEl) {
      const m = opts.byId && opts.byId.get(e.maskEl);
      if (m && m.kind !== 'image') return draw(m, c, opts);
    }
    if (e.mask === 'circle') {
      return `<ellipse cx="${n(e.x + e.w / 2)}" cy="${n(e.y + e.h / 2)}" rx="${n(e.w / 2)}" ry="${n(e.h / 2)}" fill="#000"/>`;
    }
    const rx = e.mask === 'round' ? Math.min(e.w, e.h) * (e.radius ?? 0.15) : 0;
    return `<rect x="${n(e.x)}" y="${n(e.y)}" width="${n(e.w)}" height="${n(e.h)}" rx="${n(rx)}" fill="#000"/>`;
  }

  function draw(e, c, opts) {
    const fill = paint(e.fill, c);
    switch (e.kind) {
      case 'rect':
        return e.outline
          ? `<rect x="${n(e.x)}" y="${n(e.y)}" width="${n(e.w)}" height="${n(e.h)}" rx="${n(e.rx)}" fill="none" stroke="${fill}" stroke-width="${e.sw || 1}"/>`
          : `<rect x="${n(e.x)}" y="${n(e.y)}" width="${n(e.w)}" height="${n(e.h)}" rx="${n(e.rx)}" fill="${fill}"/>`;
      case 'ellipse':
        return `<ellipse cx="${n(e.x + e.w / 2)}" cy="${n(e.y + e.h / 2)}" rx="${n(e.w / 2)}" ry="${n(e.h / 2)}" fill="${fill}"/>`;
      case 'text': {
        const size = e.fit ? fit(e.text, e.w, e.size) : e.size;
        const tx = e.align === 'center' ? e.x + e.w / 2 : e.align === 'right' ? e.x + e.w : e.x;
        const anchor = { center: 'middle', right: 'end' }[e.align] || 'start';
        return `<text x="${n(tx)}" y="${n(e.y)}" font-size="${n(size)}" font-weight="${e.weight || 400}"${e.ls ? ` letter-spacing="${e.ls}"` : ''} text-anchor="${anchor}" fill="${fill}"${e.font ? ` font-family="${esc(e.font)}"` : ''}>${esc(e.text)}</text>`;
      }
      case 'logo':
        return logo(c, e.x, e.y, e.w, e.h, e.align);
      case 'image': {
        const href = opts.asset && opts.asset(e.src);
        const ct = imageContent(e);
        const pic = (extra = '') => (href
          ? `<image href="${esc(href)}" x="${n(ct.x)}" y="${n(ct.y)}" width="${n(ct.w)}" height="${n(ct.h)}" preserveAspectRatio="none"${extra}/>`
          : `<rect x="${n(ct.x)}" y="${n(ct.y)}" width="${n(ct.w)}" height="${n(ct.h)}" fill="#D9D9D9"${extra}/>`);
        const mid = `mk-${c.id}-${String(e.id).replace(/[^a-z0-9_-]/gi, '')}`;
        // While cropping, the whole picture shows faintly so you can see what is cut off.
        const ghost = opts.crop === e.id ? pic(' opacity="0.3"') : '';
        return `${ghost}<mask id="${mid}" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000" style="mask-type:alpha">${maskShape(e, c, opts)}</mask><g mask="url(#${mid})">${pic()}</g>`;
      }
      case 'shape': {
        const m = e.markup(fill);
        if (e.x === e.ox && e.y === e.oy && e.w === e.ow && e.h === e.oh) return m;
        return `<g transform="translate(${n(e.x)} ${n(e.y)}) scale(${n(e.w / e.ow)} ${n(e.h / e.oh)}) translate(${-e.ox} ${-e.oy})">${m}</g>`;
      }
      default:
        return '';
    }
  }

  // opts: { logo: href, asset: id => href, size: {w, h} }
  function render(item, brand, opts = {}) {
    const { c, tpl, list } = elements(item, brand, opts.logo || null);
    const o = { ...opts, byId: new Map(list.map(e => [e.id, e])) };
    const wh = opts.size ? `width="${opts.size.w}" height="${opts.size.h}"` : 'width="100%" height="100%"';
    const body = list.filter(e => !e.hidden).map(e => {
      const op = e.opacity != null && e.opacity !== 1 ? ` opacity="${e.opacity}"` : '';
      return `<g data-el="${esc(e.id)}"${op}>${draw(e, c, o)}</g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tpl.w} ${tpl.h}" ${wh} font-family="${esc(fontStack(brand.font))}">
      <defs>
        <clipPath id="cl-${c.id}"><rect width="${tpl.w}" height="${tpl.h}" rx="${tpl.r}"/></clipPath>
        <filter id="lw-${c.id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
        <filter id="lb-${c.id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.086  0 0 0 0 0.086  0 0 0 0 0.086  0 0 0 1 0"/></filter>
      </defs>
      <g clip-path="url(#cl-${c.id})">${body}</g>
    </svg>`;
  }

  window.Mockups = { templates, groups, render, elements, elBox, imageContent, paint, colorOf, isDark, onColor, slug, fontStack, SWATCH };
})();
