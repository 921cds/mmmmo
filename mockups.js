/* Mockup templates.
   Each template renders an SVG string from the brand kit (logo, colors, font),
   so every mockup on the board updates the moment the brand changes. */
(function () {
  'use strict';

  const INK = '#161616';
  const STUDIO = '#E7E5E1';
  const SWATCH = { light: '#F2EEE6', white: '#FFFFFF', dark: INK };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
    return +Math.max(minSize, Math.min(maxSize, maxW / w)).toFixed(2);
  }
  const slug = name => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'brand';
  const fontStack = f => `'${f}', 'Pretendard', 'Noto Sans KR', system-ui, sans-serif`;

  /* ---------- shared drawing helpers ---------- */

  function logo(c, x, y, w, h, o = {}) {
    const s = c.logoScale;
    const W = w * s, H = h * s;
    const X = o.align === 'left' ? x : x + (w - W) / 2;
    const Y = y + (h - H) / 2;
    if (c.logoHref) {
      const par = o.align === 'left' ? 'xMinYMid meet' : 'xMidYMid meet';
      const f = c.logoMode === 'white' ? ` filter="url(#lw-${c.id})"` : c.logoMode === 'black' ? ` filter="url(#lb-${c.id})"` : '';
      return `<image href="${esc(c.logoHref)}" x="${X}" y="${Y}" width="${W}" height="${H}" preserveAspectRatio="${par}"${f}/>`;
    }
    // No logo yet: a plain wordmark from the brand name stands in.
    let color = c.fg;
    if (c.logoMode === 'white') color = '#FFFFFF';
    else if (c.logoMode === 'black') color = INK;
    else if (contrast(c.b.primary, c.bg) >= 3) color = c.b.primary;
    const size = fit(c.rawName, W, H * 0.62);
    const tx = o.align === 'left' ? X : X + W / 2;
    const anchor = o.align === 'left' ? 'start' : 'middle';
    return `<text x="${tx}" y="${Y + H / 2}" font-size="${size}" font-weight="800" letter-spacing="${(-size * 0.03).toFixed(2)}" text-anchor="${anchor}" dominant-baseline="central" fill="${color}">${c.name}</text>`;
  }

  const t = (x, y, size, body, attrs = '') => `<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${body}</text>`;

  /* ---------- templates ---------- */

  const templates = {
    'card-front': {
      name: '명함 · 앞면', group: '인쇄', w: 350, h: 200, r: 8, bg: 'primary',
      render: c => `<rect width="350" height="200" fill="${c.bg}"/>${logo(c, 95, 55, 160, 90)}`,
    },
    'card-back': {
      name: '명함 · 뒷면', group: '인쇄', w: 350, h: 200, r: 8, bg: 'white',
      render: c => `<rect width="350" height="200" fill="${c.bg}"/>
        ${logo(c, 28, 26, 96, 34, { align: 'left' })}
        ${t(28, 112, 15, '홍길동', `font-weight="700" fill="${c.fg}"`)}
        ${t(28, 128, 8.5, 'Brand Designer', `fill="${c.fg}" fill-opacity=".6"`)}
        <rect x="28" y="140" width="20" height="2" fill="${c.accent}"/>
        ${t(28, 162, 8, '010 1234 5678', `fill="${c.fg}" fill-opacity=".75"`)}
        ${t(28, 175, 8, `hello@${c.slug}.com`, `fill="${c.fg}" fill-opacity=".75"`)}
        ${t(322, 175, 8, `${c.slug}.com`, `text-anchor="end" fill="${c.fg}" fill-opacity=".75"`)}`,
    },
    letterhead: {
      name: '레터헤드', group: '인쇄', w: 420, h: 594, r: 3, bg: 'white',
      render: c => {
        const widths = [340, 328, 336, 296, 0, 340, 332, 318, 260, 0, 336, 210];
        const lines = widths.map((w, i) => w ? `<rect x="40" y="${168 + i * 16}" width="${w}" height="5" rx="2.5" fill="${c.fg}" fill-opacity=".08"/>` : '').join('');
        const d = new Date();
        return `<rect width="420" height="594" fill="${c.bg}"/>
          ${logo(c, 40, 40, 110, 40, { align: 'left' })}
          ${t(380, 56, 7.5, `${c.slug}.com`, `text-anchor="end" fill="${c.fg}" fill-opacity=".6"`)}
          ${t(380, 68, 7.5, `hello@${c.slug}.com`, `text-anchor="end" fill="${c.fg}" fill-opacity=".6"`)}
          <rect x="40" y="100" width="340" height="1.5" fill="${c.accent}"/>
          ${t(40, 140, 8, `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`, `fill="${c.fg}" fill-opacity=".6"`)}
          ${lines}
          ${t(40, 400, 9, `${c.name} 드림`, `font-weight="600" fill="${c.fg}"`)}
          <rect x="0" y="556" width="420" height="38" fill="${c.accent}"/>
          ${t(40, 579, 7.5, `${c.name} · 서울특별시 성동구 성수이로 00`, `fill="${c.onAccent}"`)}
          ${t(380, 579, 7.5, `${c.slug}.com`, `text-anchor="end" fill="${c.onAccent}"`)}`;
      },
    },
    poster: {
      name: '포스터', group: '인쇄', w: 420, h: 594, r: 3, bg: 'primary',
      render: c => `<rect width="420" height="594" fill="${c.bg}"/>
        <circle cx="300" cy="230" r="120" fill="${c.accent}"/>
        ${logo(c, 40, 40, 120, 48, { align: 'left' })}
        ${t(40, 440, fit(c.rawName, 340, 72), c.name, `font-weight="800" letter-spacing="-1.5" fill="${c.fg}"`)}
        ${t(40, 478, fit(c.rawTag, 340, 16), c.tag, `fill="${c.fg}" fill-opacity=".8"`)}
        <line x1="40" y1="530" x2="380" y2="530" stroke="${c.fg}" stroke-opacity=".25"/>
        ${t(40, 554, 9.5, `${new Date().getFullYear()} COLLECTION`, `font-weight="600" letter-spacing="1.5" fill="${c.fg}"`)}
        ${t(380, 554, 9.5, `${c.slug}.com`, `text-anchor="end" fill="${c.fg}" fill-opacity=".7"`)}`,
    },

    'app-icon': {
      name: '앱 아이콘', group: '디지털', w: 300, h: 300, r: 66, bg: 'primary',
      render: c => `<rect width="300" height="300" fill="${c.bg}"/>${logo(c, 70, 70, 160, 160)}`,
    },
    phone: {
      name: '모바일 스플래시', group: '디지털', w: 300, h: 600, r: 46, bg: 'primary',
      render: c => `<rect width="300" height="600" fill="#111111"/>
        <rect x="10" y="10" width="280" height="580" rx="37" fill="${c.bg}"/>
        <rect x="112" y="24" width="76" height="22" rx="11" fill="#111111"/>
        ${t(40, 40, 13, '9:41', `font-weight="600" fill="${c.fg}" font-family="Inter, sans-serif"`)}
        ${logo(c, 80, 205, 140, 110)}
        ${c.logoHref ? t(150, 362, fit(c.rawName, 220, 22), c.name, `text-anchor="middle" font-weight="700" fill="${c.fg}"`) : ''}
        ${t(150, c.logoHref ? 386 : 352, fit(c.rawTag, 220, 11), c.tag, `text-anchor="middle" fill="${c.fg}" fill-opacity=".7"`)}
        <rect x="105" y="568" width="90" height="5" rx="2.5" fill="${c.fg}" fill-opacity=".5"/>`,
    },
    web: {
      name: '웹사이트', group: '디지털', w: 640, h: 400, r: 10, bg: 'primary',
      render: c => `<rect width="640" height="400" fill="#FFFFFF"/>
        <rect width="640" height="34" fill="#F1F1F1"/>
        <circle cx="18" cy="17" r="4.5" fill="#D6D6D6"/><circle cx="32" cy="17" r="4.5" fill="#D6D6D6"/><circle cx="46" cy="17" r="4.5" fill="#D6D6D6"/>
        <rect x="200" y="9" width="240" height="16" rx="8" fill="#FFFFFF"/>
        ${t(320, 20.5, 8, `${c.slug}.com`, 'text-anchor="middle" fill="#8A8A8A" font-family="Inter, sans-serif"')}
        <rect y="34" width="640" height="366" fill="${c.bg}"/>
        ${logo(c, 32, 52, 90, 26, { align: 'left' })}
        ${t(468, 69, 9, '소개', `fill="${c.fg}" fill-opacity=".8"`)}
        ${t(512, 69, 9, '제품', `fill="${c.fg}" fill-opacity=".8"`)}
        ${t(556, 69, 9, '문의', `fill="${c.fg}" fill-opacity=".8"`)}
        ${t(32, 190, fit(c.rawName, 300, 46), c.name, `font-weight="800" letter-spacing="-1" fill="${c.fg}"`)}
        ${t(32, 222, fit(c.rawTag, 300, 13), c.tag, `fill="${c.fg}" fill-opacity=".75"`)}
        <rect x="32" y="250" width="108" height="34" rx="17" fill="${c.accent}"/>
        ${t(86, 271, 11, '시작하기', `text-anchor="middle" font-weight="600" fill="${c.onAccent}"`)}
        <rect x="370" y="104" width="238" height="256" rx="12" fill="${c.fg}" fill-opacity=".08"/>
        <circle cx="489" cy="200" r="56" fill="${c.accent}"/>
        <rect x="402" y="290" width="150" height="8" rx="4" fill="${c.fg}" fill-opacity=".2"/>
        <rect x="402" y="310" width="96" height="8" rx="4" fill="${c.fg}" fill-opacity=".12"/>`,
    },
    social: {
      name: 'SNS 게시물', group: '디지털', w: 400, h: 400, r: 4, bg: 'primary',
      render: c => `<rect width="400" height="400" fill="${c.bg}"/>
        <rect x="20" y="20" width="360" height="360" fill="none" stroke="${c.fg}" stroke-opacity=".2"/>
        ${logo(c, 120, 100, 160, 130)}
        ${t(200, 300, fit(c.rawTag, 300, 20), c.tag, `text-anchor="middle" font-weight="600" fill="${c.fg}"`)}
        ${t(200, 330, 11, `@${c.slug}`, `text-anchor="middle" fill="${c.fg}" fill-opacity=".6"`)}`,
    },

    tshirt: {
      name: '티셔츠', group: '굿즈 · 공간', w: 400, h: 440, r: 8, bg: 'white',
      render: c => `<rect width="400" height="440" fill="${STUDIO}"/>
        <path d="M150 52 L104 66 L48 104 L76 170 L110 156 L110 404 L290 404 L290 156 L324 170 L352 104 L296 66 L250 52 Q200 92 150 52 Z" fill="${c.bg}" stroke="#000" stroke-opacity=".1" stroke-linejoin="round"/>
        <path d="M150 52 Q200 104 250 52" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.5"/>
        <path d="M110 156 L104 112 M290 156 L296 112" stroke="#000" stroke-opacity=".06"/>
        ${logo(c, 160, 136, 80, 66)}`,
    },
    mug: {
      name: '머그컵', group: '굿즈 · 공간', w: 420, h: 320, r: 8, bg: 'white',
      render: c => `<rect width="420" height="320" fill="${STUDIO}"/>
        <ellipse cx="200" cy="272" rx="104" ry="10" fill="#000" fill-opacity=".08"/>
        <path d="M284 112 C344 112 344 220 284 220" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="26" stroke-linecap="round"/>
        <path d="M284 112 C344 112 344 220 284 220" fill="none" stroke="${c.bg}" stroke-width="22" stroke-linecap="round"/>
        <rect x="116" y="70" width="168" height="200" rx="14" fill="${c.bg}" stroke="#000" stroke-opacity=".1"/>
        <rect x="132" y="84" width="8" height="172" rx="4" fill="#FFFFFF" fill-opacity=".3"/>
        ${logo(c, 150, 120, 100, 100)}`,
    },
    tote: {
      name: '에코백', group: '굿즈 · 공간', w: 380, h: 460, r: 8, bg: 'light',
      render: c => `<rect width="380" height="460" fill="${STUDIO}"/>
        <path d="M136 162 C136 48 244 48 244 162" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="14"/>
        <path d="M136 162 C136 48 244 48 244 162" fill="none" stroke="${c.bg}" stroke-width="11"/>
        <path d="M76 160 L304 160 L320 420 L60 420 Z" fill="${c.bg}" stroke="#000" stroke-opacity=".1" stroke-linejoin="round"/>
        ${logo(c, 130, 236, 120, 110)}`,
    },
    signage: {
      name: '매장 사인', group: '굿즈 · 공간', w: 520, h: 380, r: 8, bg: 'primary',
      render: c => {
        let awning = '';
        for (let i = 0; i < 8; i++) {
          const x = 70 + i * 47.5, fill = i % 2 ? '#FFFFFF' : c.accent;
          awning += `<rect x="${x}" y="140" width="47.5" height="34" fill="${fill}"/><path d="M${x} 174 a23.75 12 0 0 0 47.5 0 Z" fill="${fill}"/>`;
        }
        return `<rect width="520" height="380" fill="#E9E6E1"/>
          <rect x="70" y="40" width="380" height="86" rx="4" fill="${c.bg}"/>
          ${logo(c, 150, 52, 220, 62)}
          ${awning}
          <rect x="70" y="140" width="380" height="3" fill="#000" fill-opacity=".08"/>
          <rect x="86" y="206" width="220" height="144" fill="#C9D3D8" stroke="#2B2B2B" stroke-width="6"/>
          <path d="M120 340 L200 214 M160 340 L240 214" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="6"/>
          <rect x="330" y="206" width="104" height="144" fill="#2B2B2B"/>
          <rect x="344" y="220" width="76" height="80" fill="#C9D3D8"/>
          <circle cx="420" cy="318" r="3" fill="#C9D3D8"/>
          <rect y="350" width="520" height="30" fill="#D3CFC8"/>`;
      },
    },
  };

  const groups = ['인쇄', '디지털', '굿즈 · 공간'];

  function context(item, brand, logoHref) {
    const p = item.props || {};
    const tpl = templates[item.template];
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
      rawName, rawTag, name: esc(rawName), tag: esc(rawTag), slug: slug(rawName),
    };
  }

  function render(item, brand, logoHref, size) {
    const tpl = templates[item.template] || templates['card-front'];
    const c = context({ ...item, template: templates[item.template] ? item.template : 'card-front' }, brand, logoHref);
    const wh = size ? `width="${size.w}" height="${size.h}"` : 'width="100%" height="100%"';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tpl.w} ${tpl.h}" ${wh} font-family="${esc(fontStack(brand.font))}">
      <defs>
        <clipPath id="cl-${c.id}"><rect width="${tpl.w}" height="${tpl.h}" rx="${tpl.r}"/></clipPath>
        <filter id="lw-${c.id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
        <filter id="lb-${c.id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.086  0 0 0 0 0.086  0 0 0 0 0.086  0 0 0 1 0"/></filter>
      </defs>
      <g clip-path="url(#cl-${c.id})">${tpl.render(c)}</g>
    </svg>`;
  }

  window.Mockups = { templates, groups, render, colorOf, isDark, onColor, slug, fontStack, SWATCH };
})();
