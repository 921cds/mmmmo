/* Brand Mockup Board — infinite canvas with notes, images and brand mockups. */
(function () {
  'use strict';

  const M = window.Mockups;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));

  const KEY = 'brand-mockup-board/v1';
  const VIEW_KEY = KEY + ':view';
  const CLIP = 'brand-mockup-board/items:';

  const FONTS = ['Pretendard', 'Inter', 'Noto Sans KR', 'Noto Serif KR', 'Space Grotesk', 'Montserrat', 'DM Serif Display'];
  const FONT_SIZES = [10, 12, 14, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 200];
  const NOTE_FILLS = [['#FFF1B8', '노랑'], ['#FFFFFF', '흰색'], ['#E5EEFF', '파랑'], ['#E3F4E8', '초록'], ['#FDE7EC', '분홍'], ['#EFEFEF', '회색'], ['transparent', '채우기 없음']];
  const CANVAS_BGS = [['#F5F5F5', '라이트'], ['#FFFFFF', '화이트'], ['#E6E6E6', '그레이'], ['#1E1E1E', '다크']];
  const MOCKUP_BGS = [['primary', 'Primary'], ['secondary', 'Secondary'], ['light', '라이트'], ['white', '화이트'], ['dark', '다크']];
  const DEFAULT_BRAND = { name: 'Lumen', tagline: 'Light for everyday life', logo: null, primary: '#2747E8', secondary: '#F2C14E', font: 'Pretendard' };

  const svg = d => `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    move: svg('<path d="M5 3.8 15.2 8l-4.4 1.6-1.7 4.6z"/>'),
    hand: svg('<path d="M7.5 10.5V5a1.2 1.2 0 0 1 2.4 0v4.5M9.9 9V3.8a1.2 1.2 0 0 1 2.4 0V9M12.3 9V5.2a1.2 1.2 0 0 1 2.4 0V12a5 5 0 0 1-5 5h-.6a4.6 4.6 0 0 1-3.6-1.8L3.4 12.3a1.2 1.2 0 0 1 1.8-1.6l2.3 2"/>'),
    note: svg('<path d="M4 4h12v7.5L11.5 16H4z"/><path d="M11.5 16v-4.5H16"/>'),
    image: svg('<rect x="3.5" y="4.5" width="13" height="11" rx="1.5"/><circle cx="12.8" cy="8.2" r="1.2"/><path d="m3.8 13.6 3.6-3.6 3.2 3.2 1.8-1.8 3.4 3.3"/>'),
    mockup: svg('<rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1"/><rect x="11" y="3.5" width="5.5" height="5.5" rx="1"/><rect x="3.5" y="11" width="5.5" height="5.5" rx="1"/><rect x="11" y="11" width="5.5" height="5.5" rx="1"/>'),
    frame: svg('<path d="M7 3.5v13M13 3.5v13M3.5 7h13M3.5 13h13"/>'),
    dots: svg('<circle cx="5" cy="10" r=".6" fill="currentColor"/><circle cx="10" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/>'),
    plus: svg('<path d="M10 5v10M5 10h10"/>'),
    minus: svg('<path d="M5 10h10"/>'),
    upload: svg('<path d="M10 13V4M6.5 7.5 10 4l3.5 3.5M4 13.5V16h12v-2.5"/>'),
    download: svg('<path d="M10 4v9M6.5 9.5 10 13l3.5-3.5M4 13.5V16h12v-2.5"/>'),
    trash: svg('<path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6"/>'),
    copy: svg('<rect x="7" y="7" width="9" height="9" rx="1.5"/><path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7"/>'),
    front: svg('<rect x="7.5" y="7.5" width="8.5" height="8.5" rx="1" fill="currentColor" fill-opacity=".18"/><path d="M4 12.5V4h8.5"/>'),
    back: svg('<rect x="4" y="4" width="8.5" height="8.5" rx="1" fill="currentColor" fill-opacity=".18"/><path d="M16 7.5V16H7.5"/>'),
    logo: svg('<circle cx="10" cy="10" r="6.5"/><path d="M7.5 10h5M10 7.5v5"/>'),
    ratio: svg('<rect x="3.5" y="5.5" width="13" height="9" rx="1.5"/><path d="M6.5 8.5v3M13.5 8.5v3"/>'),
    tleft: svg('<path d="M4 5.5h12M4 10h8M4 14.5h10"/>'),
    tcenter: svg('<path d="M4 5.5h12M6 10h8M5 14.5h10"/>'),
    tright: svg('<path d="M4 5.5h12M8 10h8M6 14.5h10"/>'),
    'a-left': svg('<path d="M4 3v14M7 6h8v3H7zM7 11h5v3H7z"/>'),
    'a-hcenter': svg('<path d="M10 3v14M5 6h10v3H5zM7 11h6v3H7z"/>'),
    'a-right': svg('<path d="M16 3v14M5 6h8v3H5zM8 11h5v3H8z"/>'),
    'a-top': svg('<path d="M3 4h14M6 7h3v8H6zM11 7h3v5h-3z"/>'),
    'a-vcenter': svg('<path d="M3 10h14M6 5h3v10H6zM11 7h3v6h-3z"/>'),
    'a-bottom': svg('<path d="M3 16h14M6 5h3v8H6zM11 8h3v5h-3z"/>'),
  };

  /* ---------- state ---------- */

  const viewport = $('#viewport'), world = $('#world'), overlay = $('#overlay'), marqueeEl = $('#marquee');
  const propsEl = $('#props'), layersEl = $('#layers');

  function freshBoard() {
    return { title: '브랜드 목업 보드', canvasBg: '#F5F5F5', brand: { ...DEFAULT_BRAND }, items: [], assets: {} };
  }
  function normalize(o) {
    if (!o || !Array.isArray(o.items)) return null;
    return {
      title: o.title || '브랜드 목업 보드',
      canvasBg: o.canvasBg || '#F5F5F5',
      brand: { ...DEFAULT_BRAND, ...(o.brand || {}) },
      items: o.items.filter(i => i && i.id && ['note', 'image', 'mockup'].includes(i.type)),
      assets: o.assets || {},
    };
  }
  function loadBoard() {
    try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch { return null; }
  }
  function loadView() {
    try {
      const v = JSON.parse(localStorage.getItem(VIEW_KEY));
      return v && isFinite(v.zoom) ? v : null;
    } catch { return null; }
  }

  let state = loadBoard();
  const firstRun = !state;
  if (!state) state = freshBoard();
  const savedView = loadView();
  state.view = savedView || { x: 0, y: 0, zoom: 1 };

  let selection = new Set();
  let tool = 'move';
  let editingId = null;
  let spaceDown = false;
  let drag = null;
  const els = new Map();
  const assetURLs = new Map();
  const history = { past: [], future: [] };
  let lastSnap = null;

  const byId = id => state.items.find(i => i.id === id);
  const selectedItems = () => state.items.filter(i => selection.has(i.id));
  const isLocked = it => it.type !== 'note';
  const isTyping = el => !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  /* ---------- assets ---------- */

  function dataURLToBlob(d) {
    const i = d.indexOf(',');
    const head = d.slice(0, i), body = d.slice(i + 1);
    const mime = (head.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
    if (head.includes(';base64')) {
      const bin = atob(body);
      const arr = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
      return new Blob([arr], { type: mime });
    }
    return new Blob([decodeURIComponent(body)], { type: mime });
  }
  function addAsset(dataURL) {
    const id = 'a_' + uid();
    state.assets[id] = dataURL;
    return id;
  }
  // Blob URLs keep the DOM light; the data URLs stay in state for saving and export.
  function assetURL(id) {
    if (!id || !state.assets[id]) return null;
    if (!assetURLs.has(id)) {
      try { assetURLs.set(id, URL.createObjectURL(dataURLToBlob(state.assets[id]))); } catch { return state.assets[id]; }
    }
    return assetURLs.get(id);
  }
  const readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const loadImage = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

  async function importImage(file, maxDim) {
    const src = await readFile(file);
    const img = await loadImage(src);
    const w = img.naturalWidth || 400, h = img.naturalHeight || 400;
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return { src, w, h };
    const s = Math.min(1, maxDim / Math.max(w, h));
    if (s === 1 && file.size < 1.5e6) return { src, w, h };
    const cw = Math.round(w * s), ch = Math.round(h * s);
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    return { src: cv.toDataURL(type, 0.88), w: cw, h: ch };
  }

  /* ---------- history + persistence ---------- */

  const snap = () => JSON.stringify({ items: state.items, brand: state.brand, title: state.title, canvasBg: state.canvasBg });

  function commit() {
    const s = snap();
    if (s === lastSnap) return;
    if (lastSnap !== null) {
      history.past.push(lastSnap);
      if (history.past.length > 80) history.past.shift();
    }
    history.future.length = 0;
    lastSnap = s;
    scheduleSave();
    renderLayers();
  }
  function undo() {
    if (!history.past.length) return;
    history.future.push(lastSnap);
    lastSnap = history.past.pop();
    restore(lastSnap);
  }
  function redo() {
    if (!history.future.length) return;
    history.past.push(lastSnap);
    lastSnap = history.future.pop();
    restore(lastSnap);
  }
  function restore(s) {
    Object.assign(state, JSON.parse(s));
    renderBrandPanel();
    applyCanvasBg();
    renderAll();
    scheduleSave();
  }

  function serialize() {
    const used = new Set([state.brand.logo, ...state.items.map(i => i.src)].filter(Boolean));
    const assets = {};
    used.forEach(id => { if (state.assets[id]) assets[id] = state.assets[id]; });
    return { app: 'brand-mockup-board', version: 1, title: state.title, canvasBg: state.canvasBg, brand: state.brand, items: state.items, assets };
  }
  let saveTimer = null, viewTimer = null, warnedQuota = false;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }
  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(serialize()));
    } catch {
      if (!warnedQuota) toast('브라우저 저장 공간이 부족해요. 메뉴에서 보드 파일로 저장하세요.');
      warnedQuota = true;
    }
  }
  function saveView() {
    clearTimeout(viewTimer);
    viewTimer = setTimeout(() => {
      try { localStorage.setItem(VIEW_KEY, JSON.stringify(state.view)); } catch { /* not critical */ }
    }, 300);
  }
  window.addEventListener('pagehide', () => { if (saveTimer) saveNow(); });

  /* ---------- view ---------- */

  function applyView() {
    const { x, y, zoom } = state.view;
    world.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    world.style.setProperty('--z', zoom);
    let g = 24 * zoom;
    while (g < 12) g *= 2;
    viewport.style.backgroundSize = `${g}px ${g}px`;
    viewport.style.backgroundPosition = `${x}px ${y}px`;
    $('#zoom-value').textContent = Math.round(zoom * 100) + '%';
    renderOverlay();
    saveView();
  }
  function toWorld(cx, cy) {
    const r = viewport.getBoundingClientRect();
    return { x: (cx - r.left - state.view.x) / state.view.zoom, y: (cy - r.top - state.view.y) / state.view.zoom };
  }
  function zoomAt(cx, cy, z) {
    const r = viewport.getBoundingClientRect();
    const v = state.view;
    z = clamp(z, 0.05, 8);
    const sx = cx - r.left, sy = cy - r.top;
    const wx = (sx - v.x) / v.zoom, wy = (sy - v.y) / v.zoom;
    v.zoom = z;
    v.x = sx - wx * z;
    v.y = sy - wy * z;
    applyView();
  }
  function visibleArea() {
    const r = viewport.getBoundingClientRect();
    const left = $('#left').getBoundingClientRect().right + 24;
    const rightPanel = $('#right');
    const right = rightPanel.offsetParent ? r.width - rightPanel.getBoundingClientRect().left + 24 : 24;
    return { left, top: 40, w: Math.max(100, r.width - left - right), h: Math.max(100, r.height - 40 - 88) };
  }
  function zoomCenter(factor) {
    const a = visibleArea();
    zoomAt(a.left + a.w / 2, a.top + a.h / 2, state.view.zoom * factor);
  }
  function viewCenterWorld() {
    const a = visibleArea();
    return toWorld(a.left + a.w / 2, a.top + a.h / 2);
  }
  function fitTo(b, maxZoom = 1) {
    if (!b) return;
    const a = visibleArea();
    const z = clamp(Math.min(a.w / b.w, a.h / b.h, maxZoom), 0.05, 8);
    state.view.zoom = z;
    state.view.x = a.left + (a.w - b.w * z) / 2 - b.x * z;
    state.view.y = a.top + (a.h - b.h * z) / 2 - b.y * z;
    applyView();
  }
  const withLabel = b => b && ({ x: b.x, y: b.y - 24, w: b.w, h: b.h + 24 });
  function fitAll() {
    if (!state.items.length) { state.view = { x: 0, y: 0, zoom: 1 }; applyView(); return; }
    fitTo(withLabel(union(state.items.map(boxOf))));
  }
  function fitSelection() {
    const sel = selectedItems();
    if (sel.length) fitTo(withLabel(union(sel.map(boxOf))), 2);
  }

  /* ---------- geometry ---------- */

  function boxOf(it) {
    let h = it.h;
    if (it.type === 'note') {
      const el = els.get(it.id);
      if (el && el.offsetHeight) h = el.offsetHeight;
    }
    return { x: it.x, y: it.y, w: it.w, h };
  }
  function union(boxes) {
    if (!boxes.length) return null;
    const x1 = Math.min(...boxes.map(b => b.x)), y1 = Math.min(...boxes.map(b => b.y));
    const x2 = Math.max(...boxes.map(b => b.x + b.w)), y2 = Math.max(...boxes.map(b => b.y + b.h));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  /* ---------- rendering ---------- */

  function createEl(it) {
    const el = document.createElement('div');
    el.className = 'item item-' + it.type;
    el.dataset.id = it.id;
    if (it.type === 'note') {
      const t = document.createElement('div');
      t.className = 'note-text';
      t.spellcheck = false;
      t.addEventListener('input', renderOverlay);
      t.addEventListener('blur', () => { if (editingId === it.id) endEdit(); });
      t.addEventListener('paste', e => {
        e.preventDefault();
        e.stopPropagation();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
      });
      el.appendChild(t);
    } else if (it.type === 'image') {
      const img = document.createElement('img');
      img.draggable = false;
      img.alt = '';
      el.appendChild(img);
    } else {
      el.innerHTML = '<div class="item-label"></div><div class="mockup-body"></div>';
    }
    world.appendChild(el);
    els.set(it.id, el);
    return el;
  }

  function positionEl(el, it) {
    el.style.transform = `translate(${it.x}px, ${it.y}px)`;
    el.style.width = it.w + 'px';
    if (it.type === 'note') el.style.minHeight = it.h + 'px';
    else el.style.height = it.h + 'px';
  }

  function renderItem(it) {
    const el = els.get(it.id) || createEl(it);
    positionEl(el, it);
    if (it.type === 'note') {
      const s = el.style;
      const none = it.fill === 'transparent';
      el.classList.toggle('no-fill', none);
      s.background = none ? 'transparent' : it.fill;
      s.color = it.color;
      s.fontSize = it.fontSize + 'px';
      s.fontWeight = it.weight;
      s.textAlign = it.align;
      s.fontFamily = it.font === 'brand' ? M.fontStack(state.brand.font) : '';
      s.padding = none ? '4px' : Math.round(clamp(it.fontSize * 0.75, 12, 40)) + 'px';
      const t = el.firstChild;
      if (editingId !== it.id && t.textContent !== it.text) t.textContent = it.text;
    } else if (it.type === 'image') {
      const img = el.firstChild;
      const u = assetURL(it.src);
      if (u && img.getAttribute('src') !== u) img.src = u;
    } else {
      const tpl = M.templates[it.template] || M.templates['card-front'];
      const logo = assetURL(state.brand.logo);
      const b = state.brand;
      const key = JSON.stringify([it.template, it.props, b.name, b.tagline, b.primary, b.secondary, b.font, logo]);
      const body = el.lastChild;
      if (el._key !== key) {
        el._key = key;
        body.innerHTML = M.render(it, b, logo);
        el.firstChild.textContent = tpl.name;
      }
      body.style.borderRadius = (tpl.r * it.w / tpl.w) + 'px';
    }
    return el;
  }

  function renderAll() {
    const ids = new Set(state.items.map(i => i.id));
    for (const [id, el] of els) {
      if (!ids.has(id)) { el.remove(); els.delete(id); }
    }
    state.items.forEach((it, i) => { renderItem(it).style.zIndex = i; });
    selection = new Set([...selection].filter(id => ids.has(id)));
    refreshSelection();
  }

  let brandFrame = 0;
  function rerenderBrandDependent() {
    cancelAnimationFrame(brandFrame);
    brandFrame = requestAnimationFrame(() => {
      state.items.forEach(it => { if (it.type === 'mockup' || it.font === 'brand') renderItem(it); });
      renderOverlay();
      if (selectedItems().some(i => i.type === 'mockup' || i.type === 'note')) renderProps();
      if (!$('#mockup-menu').hidden) buildMockupMenu();
    });
  }

  function refreshSelection() {
    for (const [id, el] of els) el.classList.toggle('selected', selection.has(id));
    renderOverlay();
    renderProps();
    renderLayers();
  }

  function renderOverlay() {
    const sel = selectedItems();
    if (!sel.length) { overlay.innerHTML = ''; return; }
    const { x: vx, y: vy, zoom: z } = state.view;
    const S = b => ({ x: b.x * z + vx, y: b.y * z + vy, w: b.w * z, h: b.h * z });
    const rect = (s, cls) => `<div class="${cls}" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px"></div>`;
    const boxes = sel.map(boxOf);
    const u = union(boxes), su = S(u);
    let html = sel.length > 1 ? boxes.map(b => rect(S(b), 'sel-item')).join('') : '';
    html += rect(su, 'sel-box');
    const moving = drag && drag.mode === 'move' && drag.moved;
    if (sel.length === 1 && !editingId && !moving) {
      for (const c of ['nw', 'ne', 'sw', 'se']) {
        const hx = c[1] === 'w' ? su.x : su.x + su.w;
        const hy = c[0] === 'n' ? su.y : su.y + su.h;
        html += `<div class="handle h-${c}" data-handle="${c}" style="left:${hx}px;top:${hy}px"></div>`;
      }
    }
    html += `<div class="size-badge" style="left:${su.x + su.w / 2}px;top:${su.y + su.h + 8}px">${Math.round(u.w)} × ${Math.round(u.h)}</div>`;
    overlay.innerHTML = html;
  }

  function applyCanvasBg() {
    viewport.style.backgroundColor = state.canvasBg;
    document.body.classList.toggle('dark-canvas', M.isDark(state.canvasBg));
  }

  /* ---------- item creation ---------- */

  function addNote(x, y, text = '') {
    const it = { id: uid(), type: 'note', x: Math.round(x), y: Math.round(y), w: 240, h: 120, text, fontSize: 16, fill: '#FFF1B8', color: '#1E1E1E', weight: 400, align: 'left', font: 'ui' };
    state.items.push(it);
    return it;
  }

  function addMockup(key, at) {
    const tpl = M.templates[key];
    const c = at || viewCenterWorld();
    const it = { id: uid(), type: 'mockup', template: key, x: Math.round(c.x - tpl.w / 2), y: Math.round(c.y - tpl.h / 2), w: tpl.w, h: tpl.h, props: {} };
    state.items.push(it);
    selection = new Set([it.id]);
    renderAll();
    commit();
    return it;
  }

  async function addImages(files, at) {
    const list = Array.from(files || []).filter(f => f.type.startsWith('image/'));
    if (!list.length) return;
    const ids = [];
    let off = 0;
    for (const f of list) {
      try {
        const { src, w, h } = await importImage(f, 2000);
        const s = Math.min(1, 480 / Math.max(w, h));
        const W = Math.round(w * s), H = Math.round(h * s);
        const it = { id: uid(), type: 'image', x: Math.round(at.x - W / 2 + off), y: Math.round(at.y - H / 2 + off), w: W, h: H, nw: w, nh: h, src: addAsset(src), name: f.name.replace(/\.[^.]+$/, '') || '이미지' };
        state.items.push(it);
        ids.push(it.id);
        off += 24;
      } catch {
        toast(`${f.name} 파일을 불러오지 못했어요`);
      }
    }
    if (!ids.length) return;
    selection = new Set(ids);
    setTool('move');
    renderAll();
    commit();
  }

  function generateAll() {
    const GAP = 64, ROW_GAP = 96;
    const existing = state.items.length ? union(state.items.map(boxOf)) : null;
    const x0 = existing ? Math.round(existing.x + existing.w + 200) : 0;
    const y0 = existing ? Math.round(existing.y) : 0;
    const added = [];
    let y = y0;
    for (const g of M.groups) {
      let x = x0, rowH = 0;
      for (const [k, tpl] of Object.entries(M.templates)) {
        if (tpl.group !== g) continue;
        const it = { id: uid(), type: 'mockup', template: k, x, y, w: tpl.w, h: tpl.h, props: {} };
        state.items.push(it);
        added.push(it);
        x += tpl.w + GAP;
        rowH = Math.max(rowH, tpl.h);
      }
      y += rowH + ROW_GAP;
    }
    selection.clear();
    renderAll();
    fitTo(withLabel(union(added.map(boxOf))));
    return added;
  }

  function seed() {
    generateAll();
    const n = addNote(-360, 0,
      '브랜드 목업 보드\n\n1. 왼쪽 패널에 로고 파일을 끌어다 놓으세요.\n2. 브랜드 이름, 컬러, 폰트를 바꾸면 모든 목업에 바로 반영돼요.\n3. 이미지는 캔버스에 드롭하고, 빈 곳을 더블클릭하면 노트가 생겨요.');
    n.w = 280;
    n.h = 200;
    renderAll();
    fitAll();
  }

  /* ---------- editing ---------- */

  function startEdit(id) {
    const it = byId(id);
    if (!it || it.type !== 'note' || editingId === id) return;
    if (editingId) endEdit();
    editingId = id;
    selection = new Set([id]);
    const el = els.get(id);
    const t = el.firstChild;
    t.contentEditable = 'plaintext-only';
    if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
    el.classList.add('editing');
    t.focus();
    const range = document.createRange();
    range.selectNodeContents(t);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(range);
    refreshSelection();
  }

  function endEdit() {
    if (!editingId) return;
    const id = editingId;
    editingId = null;
    const it = byId(id), el = els.get(id);
    if (el) {
      const t = el.firstChild;
      if (it) it.text = t.innerText.replace(/\n$/, '');
      t.removeAttribute('contenteditable');
      el.classList.remove('editing');
    }
    window.getSelection().removeAllRanges();
    if (it && !it.text.trim()) {
      state.items = state.items.filter(i => i.id !== id);
      selection.delete(id);
    }
    renderAll();
    commit();
  }

  /* ---------- commands ---------- */

  function deleteSelected() {
    if (!selection.size) return;
    state.items = state.items.filter(i => !selection.has(i.id));
    selection.clear();
    renderAll();
    commit();
  }
  function duplicate() {
    const sel = selectedItems();
    if (!sel.length) return;
    const copies = sel.map(it => ({ ...clone(it), id: uid(), x: it.x + 24, y: it.y + 24 }));
    state.items.push(...copies);
    selection = new Set(copies.map(c => c.id));
    renderAll();
    commit();
  }
  function bringToFront() {
    const sel = selectedItems();
    state.items = state.items.filter(i => !selection.has(i.id)).concat(sel);
  }
  function sendToBack() {
    const sel = selectedItems();
    state.items = sel.concat(state.items.filter(i => !selection.has(i.id)));
  }
  function alignItems(mode) {
    const sel = selectedItems();
    if (sel.length < 2) return;
    const boxes = sel.map(boxOf), u = union(boxes);
    sel.forEach((it, i) => {
      const b = boxes[i];
      if (mode === 'left') it.x = u.x;
      if (mode === 'hcenter') it.x = Math.round(u.x + (u.w - b.w) / 2);
      if (mode === 'right') it.x = u.x + u.w - b.w;
      if (mode === 'top') it.y = u.y;
      if (mode === 'vcenter') it.y = Math.round(u.y + (u.h - b.h) / 2);
      if (mode === 'bottom') it.y = u.y + u.h - b.h;
    });
  }
  function nudge(dx, dy) {
    const sel = selectedItems();
    if (!sel.length) return;
    sel.forEach(it => { it.x += dx; it.y += dy; renderItem(it); });
    renderOverlay();
    updatePropsValues();
    commit();
  }
  function stepFont(dir) {
    const notes = selectedItems().filter(i => i.type === 'note');
    if (!notes.length) return;
    notes.forEach(n => {
      const cur = n.fontSize;
      n.fontSize = dir > 0
        ? (FONT_SIZES.find(s => s > cur) ?? cur + 40)
        : ([...FONT_SIZES].reverse().find(s => s < cur) ?? Math.max(4, cur - 2));
      renderItem(n);
    });
    syncFontSize(notes[0].fontSize);
    renderOverlay();
    commit();
  }

  async function exportPNG(it) {
    const tpl = M.templates[it.template];
    const scale = 3;
    const size = { w: tpl.w * scale, h: tpl.h * scale };
    const markup = M.render(it, state.brand, state.assets[state.brand.logo] || null, size);
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const img = await loadImage(url);
      const cv = document.createElement('canvas');
      cv.width = size.w; cv.height = size.h;
      cv.getContext('2d').drawImage(img, 0, 0, size.w, size.h);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      download(blob, `${M.slug(state.brand.name)}-${it.template}.png`);
      toast('PNG로 내보냈어요');
    } catch {
      toast('내보내기에 실패했어요');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function replaceBoard(next) {
    state = { ...next, view: state.view };
    selection.clear();
    editingId = null;
    history.past.length = 0;
    history.future.length = 0;
    lastSnap = snap();
    renderBrandPanel();
    applyCanvasBg();
    renderAll();
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- tools + menus ---------- */

  function setTool(t) {
    tool = t;
    $$('.tool[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
    viewport.classList.remove('tool-move', 'tool-hand', 'tool-note');
    viewport.classList.add('tool-' + t);
  }

  function buildMockupMenu() {
    const logo = assetURL(state.brand.logo);
    $('#mockup-menu').innerHTML = M.groups.map(g => `
      <div class="menu-title">${g}</div>
      <div class="menu-grid">${Object.entries(M.templates).filter(([, t]) => t.group === g).map(([k, t]) => `
        <button class="mock-card" data-template="${k}">
          <div class="mock-thumb">${M.render({ id: 'pv' + k, template: k, props: {} }, state.brand, logo)}</div>
          <span>${t.name}</span>
        </button>`).join('')}
      </div>`).join('');
  }
  function toggleMockupMenu(force) {
    const m = $('#mockup-menu');
    const open = force ?? m.hidden;
    if (open) { buildMockupMenu(); $('#file-menu').hidden = true; }
    m.hidden = !open;
    $('#tool-mockup').classList.toggle('open', open);
  }
  function closeMenus() {
    toggleMockupMenu(false);
    $('#file-menu').hidden = true;
  }

  /* ---------- left panel ---------- */

  function renderBrandPanel() {
    const b = state.brand;
    $('#board-title').value = state.title;
    $('#brand-name').value = b.name;
    $('#brand-tagline').value = b.tagline;
    for (const k of ['primary', 'secondary']) {
      $(`#brand-${k}`).value = b[k];
      $(`#brand-${k}-hex`).value = b[k].toUpperCase();
      $(`#brand-${k}`).parentElement.style.background = b[k];
    }
    $('#brand-font').value = b.font;
    const u = assetURL(b.logo);
    const prev = $('#logo-preview');
    prev.hidden = !u;
    if (u) prev.src = u; else prev.removeAttribute('src');
    $('#logo-drop').classList.toggle('has-logo', !!u);
    $('#logo-remove').hidden = !u;
  }

  function updateBrand(patch) {
    Object.assign(state.brand, patch);
    rerenderBrandDependent();
  }

  async function setLogoFromFile(f) {
    if (!f || !f.type.startsWith('image/')) { toast('이미지 파일만 로고로 쓸 수 있어요'); return; }
    try {
      const { src } = await importImage(f, 1200);
      state.brand.logo = addAsset(src);
      renderBrandPanel();
      rerenderBrandDependent();
      commit();
      toast('로고를 모든 목업에 적용했어요');
    } catch {
      toast('로고를 불러오지 못했어요');
    }
  }

  function itemName(it) {
    if (it.type === 'note') return (it.text || '').split('\n')[0].slice(0, 40) || '노트';
    if (it.type === 'image') return it.name || '이미지';
    return (M.templates[it.template] || {}).name || '목업';
  }
  const typeIcon = it => (it.type === 'note' ? 'note' : it.type === 'image' ? 'image' : 'frame');

  function renderLayers() {
    $('#layer-count').textContent = state.items.length || '';
    layersEl.innerHTML = state.items.length
      ? [...state.items].reverse().map(it => `<li class="layer${selection.has(it.id) ? ' selected' : ''}" data-id="${it.id}">${ICON[typeIcon(it)]}<span>${esc(itemName(it))}</span></li>`).join('')
      : '<li class="layer empty">캔버스가 비어 있어요</li>';
  }

  /* ---------- right panel ---------- */

  const sec = (title, body) => `<section class="section">${title ? `<div class="section-head"><span class="section-title">${title}</span></div>` : ''}${body}</section>`;
  const num = (label, field, value) => `<label class="num"><span>${label}</span><input type="number" data-field="${field}" value="${value}"></label>`;
  const btn = (action, value, icon, title, active = false) => `<button class="icon-btn${active ? ' active' : ''}" data-action="${action}" data-value="${value}" title="${title}">${ICON[icon]}</button>`;
  const swatch = (action, value, color, title, active) => `<button class="swatch${value === 'transparent' ? ' none' : ''}${active ? ' active' : ''}" style="--c:${color}" data-action="${action}" data-value="${value}" title="${title}"></button>`;

  function boardProps() {
    const keys = [
      ['이동 / 손 도구', 'V / H'], ['드래그로 화면 이동', 'Space'], ['노트 / 이미지 / 목업', 'N / I / M'],
      ['노트 추가', '더블클릭'], ['확대 · 축소', '⌘ + 스크롤'], ['전체 보기 / 100%', '⇧1 / ⇧0'],
      ['글자 크기', '⌘⇧ < >'], ['복제 / 삭제', '⌘D / ⌫'], ['실행 취소', '⌘Z'], ['맨 앞 / 맨 뒤', '] / ['],
    ];
    return sec('캔버스', `<div class="swatches">${CANVAS_BGS.map(([c, l]) => swatch('canvas-bg', c, c, l, state.canvasBg === c)).join('')}</div>`)
      + sec('단축키', `<div class="kbd-list">${keys.map(([a, k]) => `<span>${a}</span><kbd>${k}</kbd>`).join('')}</div>`);
  }

  function noteProps(notes) {
    const n = notes[0];
    const same = k => notes.every(x => x[k] === n[k]);
    const fs = same('fontSize') ? n.fontSize : '';
    const b = state.brand;
    const textColors = [['#1E1E1E', '검정'], ['#757575', '회색'], ['#FFFFFF', '흰색'], [b.primary, 'Primary'], [b.secondary, 'Secondary']];
    const known = textColors.some(([c]) => c === n.color);
    return sec('텍스트', `
      <div class="row">
        <select class="field" data-field="font">
          <option value="ui"${n.font !== 'brand' ? ' selected' : ''}>기본 서체</option>
          <option value="brand"${n.font === 'brand' ? ' selected' : ''}>브랜드 서체 · ${esc(b.font)}</option>
        </select>
      </div>
      <div class="row">
        <select class="field" data-field="weight">
          ${[[400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extrabold']].map(([w, l]) => `<option value="${w}"${same('weight') && n.weight === w ? ' selected' : ''}>${l}</option>`).join('')}
        </select>
        <div class="fs-control" title="글자 크기">
          ${btn('fs-step', -1, 'minus', '작게  ⌘⇧<')}
          <input type="number" data-field="fontSize" data-live list="fs-list" min="4" max="800" value="${fs}" placeholder="혼합">
          ${btn('fs-step', 1, 'plus', '크게  ⌘⇧>')}
        </div>
      </div>
      <div class="range-row"><span class="label">크기</span><input type="range" class="range" data-field="fontSize" min="8" max="200" value="${fs || 16}"><span class="value" data-fs-value>${fs ? fs + 'px' : '혼합'}</span></div>
      <div class="seg">${['left', 'center', 'right'].map(a => `<button class="seg-btn${same('align') && n.align === a ? ' active' : ''}" data-action="align" data-value="${a}" title="${{ left: '왼쪽', center: '가운데', right: '오른쪽' }[a]} 정렬">${ICON['t' + a]}</button>`).join('')}</div>
    `)
      + sec('채우기', `<div class="swatches">${NOTE_FILLS.map(([c, l]) => swatch('fill', c, c, l, same('fill') && n.fill === c)).join('')}</div>`)
      + sec('텍스트 색', `<div class="swatches">${textColors.map(([c, l]) => swatch('color', c, c, l, same('color') && n.color === c)).join('')}
          <label class="swatch custom${!known ? ' active' : ''}" style="--c:${n.color}" title="직접 선택">${ICON.plus}<input type="color" data-field="color" value="${/^#[0-9a-f]{6}$/i.test(n.color) ? n.color : '#1e1e1e'}"></label></div>`);
  }

  function mockupProps(it) {
    const tpl = M.templates[it.template];
    const p = it.props || {};
    const bg = p.bg || tpl.bg;
    const known = MOCKUP_BGS.some(([k]) => k === bg);
    const mode = p.logoMode || 'auto';
    const scale = Math.round((p.logoScale ?? 1) * 100);
    const options = M.groups.map(g => `<optgroup label="${g}">${Object.entries(M.templates).filter(([, t]) => t.group === g).map(([k, t]) => `<option value="${k}"${k === it.template ? ' selected' : ''}>${t.name}</option>`).join('')}</optgroup>`).join('');
    return sec('목업', `<select class="field" data-field="template">${options}</select>`)
      + sec('바탕 색', `<div class="swatches">${MOCKUP_BGS.map(([k, l]) => swatch('bg', k, M.colorOf(k, state.brand), l, bg === k)).join('')}
          <label class="swatch custom${!known ? ' active' : ''}" style="--c:${known ? '#fff' : bg}" title="직접 선택">${ICON.plus}<input type="color" data-field="bgCustom" value="${known ? M.colorOf(bg, state.brand) : bg}"></label></div>`)
      + sec('로고', `
        <div class="seg">${[['auto', '자동'], ['original', '원본'], ['white', '흰색'], ['black', '검정']].map(([k, l]) => `<button class="seg-btn${mode === k ? ' active' : ''}" data-action="logoMode" data-value="${k}">${l}</button>`).join('')}</div>
        <div class="range-row" style="margin-top:10px"><span class="label">크기</span><input type="range" class="range" data-field="logoScale" min="40" max="180" value="${scale}"><span class="value" data-scale-value>${scale}%</span></div>`)
      + sec('내보내기', `<button class="btn" data-action="export-png">${ICON.download}PNG로 내보내기 · 3x</button>`);
  }

  function imageProps() {
    return sec('이미지', `<button class="btn" data-action="use-as-logo">${ICON.logo}브랜드 로고로 사용</button><button class="btn" data-action="natural">${ICON.ratio}원본 비율로 되돌리기</button>`);
  }

  function renderProps() {
    const sel = selectedItems();
    if (!sel.length) { propsEl.innerHTML = boardProps(); return; }
    const one = sel.length === 1 ? sel[0] : null;
    const notes = sel.filter(i => i.type === 'note');
    const typeName = { note: '노트', image: '이미지', mockup: '목업' };
    let h = `<div class="sel-head">${one ? typeName[one.type] : `${sel.length}개 선택됨`}</div><div class="sel-sub">${one ? esc(itemName(one)) : '여러 레이어'}</div>`;
    if (one) {
      const b = boxOf(one);
      h += sec('위치와 크기', `<div class="grid2">${num('X', 'x', one.x)}${num('Y', 'y', one.y)}${num('W', 'w', Math.round(b.w))}${num('H', 'h', Math.round(b.h))}</div>`);
    } else {
      h += sec('정렬', `<div class="btn-row">${[['left', '왼쪽'], ['hcenter', '가로 가운데'], ['right', '오른쪽'], ['top', '위'], ['vcenter', '세로 가운데'], ['bottom', '아래']].map(([k, l]) => btn('align-items', k, 'a-' + k, l + ' 정렬')).join('')}</div>`);
    }
    if (notes.length) h += noteProps(notes);
    if (one && one.type === 'mockup') h += mockupProps(one);
    if (one && one.type === 'image') h += imageProps();
    h += sec('', `<div class="btn-row">${btn('front', '', 'front', '맨 앞으로  ]')}${btn('back', '', 'back', '맨 뒤로  [')}${btn('duplicate', '', 'copy', '복제  ⌘D')}<span class="spacer"></span>${btn('delete', '', 'trash', '삭제  ⌫')}</div>`);
    propsEl.innerHTML = h;
  }

  function updatePropsValues() {
    const sel = selectedItems();
    if (sel.length !== 1) return;
    const b = boxOf(sel[0]);
    const vals = { x: b.x, y: b.y, w: Math.round(b.w), h: Math.round(b.h) };
    for (const k in vals) {
      const input = propsEl.querySelector(`input[data-field="${k}"]`);
      if (input && document.activeElement !== input) input.value = vals[k];
    }
  }
  function syncFontSize(n) {
    propsEl.querySelectorAll('[data-field="fontSize"]').forEach(i => { if (document.activeElement !== i) i.value = n; });
    const v = propsEl.querySelector('[data-fs-value]');
    if (v) v.textContent = n + 'px';
  }

  function applyField(field, raw, final) {
    const sel = selectedItems();
    const one = sel[0];
    const notes = sel.filter(i => i.type === 'note');
    if (!one && field !== 'canvasBg') return;
    switch (field) {
      case 'x': case 'y': {
        if (!final) return;
        const v = Math.round(+raw);
        if (!isFinite(v)) return;
        one[field] = v;
        break;
      }
      case 'w': case 'h': {
        if (!final) return;
        const v = Math.max(8, Math.round(+raw));
        if (!isFinite(v)) return;
        if (isLocked(one)) {
          const r = one.w / one.h;
          if (field === 'w') { one.w = v; one.h = Math.round(v / r); } else { one.h = v; one.w = Math.round(v * r); }
        } else one[field] = v;
        break;
      }
      case 'fontSize': {
        const v = Math.round(+raw);
        if (!v) return;
        const n = clamp(v, 4, 800);
        notes.forEach(x => { x.fontSize = n; });
        syncFontSize(n);
        break;
      }
      case 'weight': notes.forEach(x => { x.weight = +raw; }); break;
      case 'font': notes.forEach(x => { x.font = raw; }); break;
      case 'color': notes.forEach(x => { x.color = raw; }); break;
      case 'template': {
        const t0 = M.templates[one.template], t1 = M.templates[raw];
        const s = one.w / t0.w;
        one.template = raw;
        one.w = Math.round(t1.w * s);
        one.h = Math.round(t1.h * s);
        break;
      }
      case 'bgCustom': one.props = { ...one.props, bg: raw }; break;
      case 'logoScale': {
        one.props = { ...one.props, logoScale: +raw / 100 };
        const v = propsEl.querySelector('[data-scale-value]');
        if (v) v.textContent = raw + '%';
        break;
      }
      default: return;
    }
    sel.forEach(renderItem);
    renderOverlay();
    updatePropsValues();
    if (final) {
      commit();
      if (['template', 'bgCustom', 'color', 'w', 'h'].includes(field)) renderProps();
    }
  }

  function doAction(action, v) {
    const sel = selectedItems();
    const one = sel[0];
    const notes = sel.filter(i => i.type === 'note');
    switch (action) {
      case 'fill': notes.forEach(n => { n.fill = v; }); break;
      case 'color': notes.forEach(n => { n.color = v; }); break;
      case 'align': notes.forEach(n => { n.align = v; }); break;
      case 'fs-step': stepFont(+v); return;
      case 'bg': one.props = { ...one.props, bg: v }; break;
      case 'logoMode': one.props = { ...one.props, logoMode: v }; break;
      case 'export-png': exportPNG(one); return;
      case 'use-as-logo':
        state.brand.logo = one.src;
        renderBrandPanel();
        rerenderBrandDependent();
        toast('이 이미지를 브랜드 로고로 적용했어요');
        break;
      case 'natural': if (one.nw && one.nh) one.h = Math.round(one.w * one.nh / one.nw); break;
      case 'front': bringToFront(); break;
      case 'back': sendToBack(); break;
      case 'duplicate': duplicate(); return;
      case 'delete': deleteSelected(); return;
      case 'align-items': alignItems(v); break;
      case 'canvas-bg': state.canvasBg = v; applyCanvasBg(); break;
      default: return;
    }
    renderAll();
    commit();
  }

  propsEl.addEventListener('input', e => {
    const f = e.target.dataset.field;
    if (!f) return;
    const live = e.target.type === 'range' || e.target.type === 'color' || 'live' in e.target.dataset;
    if (live) applyField(f, e.target.value, false);
  });
  propsEl.addEventListener('change', e => {
    const f = e.target.dataset.field;
    if (f) applyField(f, e.target.value, true);
  });
  propsEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur();
  });
  propsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (b) doAction(b.dataset.action, b.dataset.value);
  });

  /* ---------- pointer interaction ---------- */

  viewport.addEventListener('pointerdown', e => {
    if (e.button === 2) return;
    closeMenus();
    const itemEl = e.target.closest('.item');
    if (editingId) {
      if (itemEl && itemEl.dataset.id === editingId) return;
      endEdit();
    }
    if (document.activeElement && isTyping(document.activeElement)) document.activeElement.blur();

    if (e.button === 1 || tool === 'hand' || spaceDown) {
      drag = { mode: 'pan', lx: e.clientX, ly: e.clientY };
      viewport.classList.add('panning');
      viewport.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    const p = toWorld(e.clientX, e.clientY);
    const handle = e.target.closest('[data-handle]');
    if (handle) {
      const it = selectedItems()[0];
      if (!it) return;
      drag = { mode: 'resize', corner: handle.dataset.handle, start: p, box: boxOf(it), id: it.id };
      viewport.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'note') {
      const it = addNote(p.x, p.y);
      setTool('move');
      selection = new Set([it.id]);
      renderAll();
      requestAnimationFrame(() => startEdit(it.id));
      e.preventDefault();
      return;
    }

    if (itemEl) {
      const id = itemEl.dataset.id;
      let clickId = null;
      if (e.shiftKey) {
        if (selection.has(id)) selection.delete(id); else selection.add(id);
      } else if (!selection.has(id)) {
        selection = new Set([id]);
      } else if (selection.size > 1) {
        clickId = id;
      }
      drag = { mode: 'move', start: p, origin: new Map(selectedItems().map(i => [i.id, { x: i.x, y: i.y }])), moved: false, clickId };
    } else {
      if (!e.shiftKey) selection.clear();
      drag = { mode: 'marquee', start: p, base: new Set(selection), sx: e.clientX, sy: e.clientY };
    }
    viewport.setPointerCapture(e.pointerId);
    refreshSelection();
  });

  viewport.addEventListener('pointermove', e => {
    if (!drag) return;
    if (drag.mode === 'pan') {
      state.view.x += e.clientX - drag.lx;
      state.view.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      applyView();
      return;
    }
    const p = toWorld(e.clientX, e.clientY);
    const dx = p.x - drag.start.x, dy = p.y - drag.start.y;

    if (drag.mode === 'move') {
      if (!drag.moved && Math.hypot(dx, dy) * state.view.zoom < 3) return;
      drag.moved = true;
      viewport.classList.add('dragging');
      for (const [id, o] of drag.origin) {
        const it = byId(id);
        it.x = Math.round(o.x + dx);
        it.y = Math.round(o.y + dy);
        positionEl(els.get(id), it);
      }
      renderOverlay();
      updatePropsValues();
    } else if (drag.mode === 'resize') {
      const it = byId(drag.id), b = drag.box, c = drag.corner;
      let w = b.w + (c[1] === 'w' ? -dx : dx);
      let h = b.h + (c[0] === 'n' ? -dy : dy);
      if (isLocked(it) || e.shiftKey) {
        const s = Math.max(w / b.w, h / b.h);
        w = b.w * s;
        h = b.h * s;
      }
      const r = b.w / b.h;
      w = Math.max(24, w);
      h = Math.max(24, h);
      if (isLocked(it) || e.shiftKey) { if (w / h > r) h = w / r; else w = h * r; }
      it.w = Math.round(w);
      it.h = Math.round(h);
      it.x = Math.round(c[1] === 'w' ? b.x + b.w - w : b.x);
      it.y = Math.round(c[0] === 'n' ? b.y + b.h - h : b.y);
      renderItem(it);
      renderOverlay();
      updatePropsValues();
    } else if (drag.mode === 'marquee') {
      const r = viewport.getBoundingClientRect();
      const x1 = Math.min(drag.sx, e.clientX) - r.left, y1 = Math.min(drag.sy, e.clientY) - r.top;
      Object.assign(marqueeEl.style, { display: 'block', left: x1 + 'px', top: y1 + 'px', width: Math.abs(e.clientX - drag.sx) + 'px', height: Math.abs(e.clientY - drag.sy) + 'px' });
      const wx1 = Math.min(drag.start.x, p.x), wy1 = Math.min(drag.start.y, p.y);
      const wx2 = Math.max(drag.start.x, p.x), wy2 = Math.max(drag.start.y, p.y);
      const hits = state.items.filter(it => {
        const b = boxOf(it);
        return b.x < wx2 && b.x + b.w > wx1 && b.y < wy2 && b.y + b.h > wy1;
      }).map(i => i.id);
      selection = new Set([...drag.base, ...hits]);
      for (const [id, el] of els) el.classList.toggle('selected', selection.has(id));
      renderOverlay();
    }
  });

  function endDrag() {
    if (!drag) return;
    const d = drag;
    drag = null;
    viewport.classList.remove('dragging', 'panning');
    if (d.mode === 'move') {
      if (d.moved) commit();
      else if (d.clickId) selection = new Set([d.clickId]);
      refreshSelection();
    } else if (d.mode === 'resize') {
      commit();
      refreshSelection();
    } else if (d.mode === 'marquee') {
      marqueeEl.style.display = 'none';
      refreshSelection();
    }
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  viewport.addEventListener('dblclick', e => {
    if (tool !== 'move' || e.target.closest('[data-handle]')) return;
    const itemEl = e.target.closest('.item');
    if (itemEl) {
      const it = byId(itemEl.dataset.id);
      if (it && it.type === 'note') startEdit(it.id);
      return;
    }
    const p = toWorld(e.clientX, e.clientY);
    const it = addNote(p.x - 20, p.y - 20);
    selection = new Set([it.id]);
    renderAll();
    startEdit(it.id);
  });

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const d = clamp(e.deltaY, -30, 30);
      zoomAt(e.clientX, e.clientY, state.view.zoom * Math.exp(-d * 0.01));
    } else {
      const k = e.deltaMode === 1 ? 16 : 1;
      state.view.x -= (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * k;
      state.view.y -= (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * k;
      applyView();
    }
  }, { passive: false });
  // Keep pinch-zoom on the canvas instead of zooming the whole page.
  document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());

  /* ---------- drag & drop, clipboard ---------- */

  const hasFiles = e => Array.from(e.dataTransfer?.types || []).includes('Files');
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => e.preventDefault());
  viewport.addEventListener('dragover', e => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    viewport.classList.add('drop-over');
  });
  viewport.addEventListener('dragleave', e => {
    if (!viewport.contains(e.relatedTarget)) viewport.classList.remove('drop-over');
  });
  viewport.addEventListener('drop', e => {
    e.preventDefault();
    viewport.classList.remove('drop-over');
    addImages(e.dataTransfer.files, toWorld(e.clientX, e.clientY));
  });

  function copySelection(e) {
    if (isTyping(document.activeElement) || editingId || !selection.size) return false;
    e.preventDefault();
    const sel = selectedItems();
    const assets = {};
    sel.forEach(it => { if (it.src) assets[it.src] = state.assets[it.src]; });
    e.clipboardData.setData('text/plain', CLIP + JSON.stringify({ items: sel, assets }));
    return true;
  }
  document.addEventListener('copy', copySelection);
  document.addEventListener('cut', e => { if (copySelection(e)) deleteSelected(); });
  document.addEventListener('paste', e => {
    if (isTyping(document.activeElement) || editingId) return;
    const files = Array.from(e.clipboardData.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length) { e.preventDefault(); addImages(files, viewCenterWorld()); return; }
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    if (text.startsWith(CLIP)) {
      try {
        const data = JSON.parse(text.slice(CLIP.length));
        Object.entries(data.assets || {}).forEach(([id, d]) => { if (d && !state.assets[id]) state.assets[id] = d; });
        const copies = data.items.map(it => ({ ...it, id: uid(), x: it.x + 24, y: it.y + 24 }));
        state.items.push(...copies);
        selection = new Set(copies.map(c => c.id));
        renderAll();
        commit();
      } catch { /* ignore malformed clipboard */ }
      return;
    }
    const c = viewCenterWorld();
    const it = addNote(c.x - 120, c.y - 40, text.trim());
    selection = new Set([it.id]);
    renderAll();
    commit();
  });

  /* ---------- keyboard ---------- */

  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (isTyping(e.target)) {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    const k = e.key.toLowerCase();

    if (e.code === 'Space') {
      e.preventDefault();
      if (!spaceDown) { spaceDown = true; viewport.classList.add('space'); }
      return;
    }
    if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicate(); return; }
    if (mod && k === 'a') { e.preventDefault(); selection = new Set(state.items.map(i => i.id)); refreshSelection(); return; }
    if (mod && e.shiftKey && (e.code === 'Period' || e.code === 'Comma')) { e.preventDefault(); stepFont(e.code === 'Period' ? 1 : -1); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomCenter(1.25); return; }
    if (mod && k === '-') { e.preventDefault(); zoomCenter(0.8); return; }
    if (mod && k === '0') { e.preventDefault(); zoomCenter(1 / state.view.zoom); return; }
    if (e.shiftKey && e.code === 'Digit1') { fitAll(); return; }
    if (e.shiftKey && e.code === 'Digit2') { fitSelection(); return; }
    if (e.shiftKey && e.code === 'Digit0') { zoomCenter(1 / state.view.zoom); return; }
    if (mod) return;

    switch (e.key) {
      case 'Delete': case 'Backspace': e.preventDefault(); deleteSelected(); return;
      case 'Escape':
        if (!$('#mockup-menu').hidden || !$('#file-menu').hidden) closeMenus();
        else if (tool !== 'move') setTool('move');
        else { selection.clear(); refreshSelection(); }
        return;
      case 'Enter': {
        const sel = selectedItems();
        if (sel.length === 1 && sel[0].type === 'note') { e.preventDefault(); startEdit(sel[0].id); }
        return;
      }
      case 'ArrowLeft': case 'ArrowRight': case 'ArrowUp': case 'ArrowDown': {
        if (!selection.size) return;
        e.preventDefault();
        const s = e.shiftKey ? 10 : 1;
        nudge(e.key === 'ArrowLeft' ? -s : e.key === 'ArrowRight' ? s : 0, e.key === 'ArrowUp' ? -s : e.key === 'ArrowDown' ? s : 0);
        return;
      }
      case ']': bringToFront(); renderAll(); commit(); return;
      case '[': sendToBack(); renderAll(); commit(); return;
    }
    if (k === 'v') setTool('move');
    else if (k === 'h') setTool('hand');
    else if (k === 'n') setTool('note');
    else if (k === 'i') $('#file-image').click();
    else if (k === 'm') toggleMockupMenu();
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'Space') { spaceDown = false; viewport.classList.remove('space'); }
  });
  window.addEventListener('blur', () => { spaceDown = false; viewport.classList.remove('space'); });

  /* ---------- chrome wiring ---------- */

  $$('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', ICON[el.dataset.icon] || ''));

  $$('.tool[data-tool]').forEach(b => b.addEventListener('click', () => { closeMenus(); setTool(b.dataset.tool); }));
  $('#tool-image').addEventListener('click', () => { closeMenus(); $('#file-image').click(); });
  $('#tool-mockup').addEventListener('click', e => { e.stopPropagation(); toggleMockupMenu(); });
  $('#mockup-menu').addEventListener('click', e => {
    const card = e.target.closest('[data-template]');
    if (!card) return;
    toggleMockupMenu(false);
    setTool('move');
    addMockup(card.dataset.template);
  });

  $('#file-image').addEventListener('change', e => { addImages(e.target.files, viewCenterWorld()); e.target.value = ''; });
  $('#file-logo').addEventListener('change', e => { setLogoFromFile(e.target.files[0]); e.target.value = ''; });
  $('#file-board').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const next = normalize(JSON.parse(await f.text()));
      if (!next) throw new Error('invalid');
      replaceBoard(next);
      fitAll();
      saveNow();
      toast(`'${next.title}' 보드를 열었어요`);
    } catch {
      toast('보드 파일 형식이 올바르지 않아요');
    }
  });

  $('#menu-btn').addEventListener('click', e => {
    e.stopPropagation();
    const m = $('#file-menu');
    toggleMockupMenu(false);
    m.hidden = !m.hidden;
  });
  $('#file-menu').addEventListener('click', e => {
    const b = e.target.closest('[data-cmd]');
    if (!b) return;
    $('#file-menu').hidden = true;
    const cmd = b.dataset.cmd;
    if (cmd === 'new') {
      if (!confirm('현재 보드를 지우고 새 보드를 시작할까요?\n필요하면 먼저 보드 파일로 저장하세요.')) return;
      replaceBoard(freshBoard());
      seed();
      lastSnap = snap();
      saveNow();
    } else if (cmd === 'save') {
      download(new Blob([JSON.stringify(serialize())], { type: 'application/json' }), `${state.title || 'board'}.json`);
    } else if (cmd === 'open') {
      $('#file-board').click();
    } else if (cmd === 'image') {
      $('#file-image').click();
    } else if (cmd === 'fit') {
      fitAll();
    }
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('#mockup-menu, #tool-mockup')) toggleMockupMenu(false);
    if (!e.target.closest('#file-menu, #menu-btn')) $('#file-menu').hidden = true;
  }, true);

  $$('[data-zoom]').forEach(b => b.addEventListener('click', () => {
    const z = b.dataset.zoom;
    if (z === 'in') zoomCenter(1.25);
    else if (z === 'out') zoomCenter(0.8);
    else fitAll();
  }));

  $$('.tab[data-tab]').forEach(b => b.addEventListener('click', () => {
    $$('.tab[data-tab]').forEach(x => x.classList.toggle('active', x === b));
    $$('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  }));

  layersEl.addEventListener('click', e => {
    const li = e.target.closest('[data-id]');
    if (!li) return;
    const id = li.dataset.id;
    if (e.shiftKey || e.metaKey) { if (selection.has(id)) selection.delete(id); else selection.add(id); }
    else selection = new Set([id]);
    refreshSelection();
  });
  layersEl.addEventListener('dblclick', e => { if (e.target.closest('[data-id]')) fitSelection(); });

  // brand kit
  const title = $('#board-title');
  title.addEventListener('change', () => { state.title = title.value.trim() || '브랜드 목업 보드'; title.value = state.title; commit(); });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') title.blur(); });

  for (const k of ['name', 'tagline']) {
    const input = $(`#brand-${k}`);
    input.addEventListener('input', () => updateBrand({ [k]: input.value }));
    input.addEventListener('change', commit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  }
  const normHex = v => {
    let h = String(v).trim().replace('#', '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(c => c + c).join('');
    return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toLowerCase() : null;
  };
  for (const k of ['primary', 'secondary']) {
    const pick = $(`#brand-${k}`), hex = $(`#brand-${k}-hex`);
    pick.addEventListener('input', () => {
      hex.value = pick.value.toUpperCase();
      pick.parentElement.style.background = pick.value;
      updateBrand({ [k]: pick.value });
    });
    pick.addEventListener('change', commit);
    hex.addEventListener('change', () => {
      const v = normHex(hex.value);
      if (v) { updateBrand({ [k]: v }); commit(); }
      renderBrandPanel();
    });
    hex.addEventListener('keydown', e => { if (e.key === 'Enter') hex.blur(); });
  }
  const fontSel = $('#brand-font');
  fontSel.innerHTML = FONTS.map(f => `<option value="${f}">${f}</option>`).join('');
  fontSel.addEventListener('change', () => { updateBrand({ font: fontSel.value }); commit(); });

  const drop = $('#logo-drop');
  drop.addEventListener('click', () => $('#file-logo').click());
  drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file-logo').click(); } });
  drop.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.remove('over');
    setLogoFromFile(Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/')));
  });
  $('#logo-remove').addEventListener('click', () => {
    state.brand.logo = null;
    renderBrandPanel();
    rerenderBrandDependent();
    commit();
  });

  $('#generate-all').addEventListener('click', () => {
    const added = generateAll();
    commit();
    toast(`목업 ${added.length}개를 만들었어요`);
  });

  window.addEventListener('resize', renderOverlay);

  /* ---------- boot ---------- */

  renderBrandPanel();
  applyCanvasBg();
  setTool('move');
  if (firstRun) seed();
  else renderAll();
  if (firstRun || !savedView) fitAll();
  else applyView();
  lastSnap = snap();
  if (firstRun) saveNow();
})();
