/* 관리하는 남자 — 개인용 자기관리 웹앱 (PWA)
   기록은 이 기기의 localStorage, 사진은 IndexedDB에만 저장합니다. 서버로 보내는 데이터는 없습니다. */
(() => {
'use strict';

/* ---------- 작은 도구들 ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const diff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const today = () => ymd(new Date());
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const fmtMD = (s) => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
const fmtMDdow = (s) => `${fmtMD(s)} (${DOW[parse(s).getDay()]})`;
const fmtShort = (s) => { const d = parse(s); return `${d.getMonth() + 1}.${d.getDate()}`; };
const f1 = (v) => (v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1));
const pct = (v) => (v == null ? '—' : Math.round(v * 100) + '%');

const I = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1012" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA1A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  gym: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA1A8" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/></svg>',
  pill: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA1A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 20.5a5 5 0 0 1-7-7l9-9a5 5 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/></svg>',
  cut: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA1A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>',
  cutSm: (c) => `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20"/></svg>`,
  scent: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9BA1A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="9" width="12" height="12" rx="3"/><path d="M10 9V6h4v3M9 3h6M12 3v3"/></svg>',
  cam: (c = 'currentColor', s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2.5h5L16 6"/></svg>`,
  lock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A5057" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  face: '<svg width="40" height="48" viewBox="0 0 40 48" fill="none" stroke="#6E747B" stroke-width="1.6" aria-hidden="true"><ellipse cx="20" cy="19" rx="11" ry="13"/><path d="M4 47c2-9 8-13 16-13s14 4 16 13"/></svg>',
  left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  bulb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C6F36A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  star: (on) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="${on ? '#C6F36A' : 'none'}" stroke="${on ? '#C6F36A' : 'currentColor'}" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>`,
  nav: {
    today: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>',
    history: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    balance: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><polygon points="12 3 20.6 9.2 17.3 19.3 6.7 19.3 3.4 9.2"/><polygon points="12 8 16 11 14.5 15.5 9.5 15.5 8 11"/></svg>',
    changes: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2.5h5L16 6"/></svg>',
    settings: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
  }
};

/* ---------- 데이터 ---------- */
const KEY = 'gn.v1';
const AREAS = { hygiene: '청결·위생', skin: '피부', hair: '헤어', body: '체형', mental: '멘탈' };
const AREA_KEYS = Object.keys(AREAS);
const WHEN = { morning: '아침', lunch: '점심', evening: '저녁', night: '자기 전', weekly: '주 1회' };
const MED_AREA = { hair: '헤어', body: '체형', other: '기타' };
const MED_PRESETS = { '탈모약': ['morning', 'hair'], '비만약': ['weekly', 'body'], '종합비타민': ['morning', 'other'], '비타민 D': ['morning', 'other'], '오메가3': ['evening', 'other'], '유산균': ['morning', 'other'] };
const AGES = ['20대 초반', '20대 후반', '30대', '40대', '50대 이상'];
const JOBS = ['사무직', '영업·외근', '현장·생산', '서비스', '교대근무', '학생·취준', '프리랜서'];
const FREQS = ['거의 안 함', '주 1–2회', '주 3–4회', '거의 매일'];
const SKINS = ['지성', '건성', '복합성', '잘 모름'];
const GOALS = ['피부', '헤어·두피', '체중·체형', '수면', '인상·그루밍'];
const FAMILIES = ['시트러스', '우디', '머스크', '아쿠아', '플로럴', '스파이시'];
const SCENES = ['출근', '데이트', '운동 후', '주말'];
const WORKOUTS = ['달리기', '근력', '복싱', '걷기', '기타', '쉼'];
const MOODS = ['지침', '별로', '보통', '좋음', '최고'];
const MILES = [0, 30, 60, 90];

const fresh = () => ({
  version: 1,
  profile: { onboarded: false, startDate: today(), age: null, job: null, leaveTime: '08:00', usualSleep: 6.5, exFreq: null, skin: null, goals: [] },
  settings: { sleepGoal: 7, weeklyExercise: 90, haircutWeeks: 4, checkTime: null },
  items: [
    { id: 'wash', label: '세안', area: 'hygiene' }, { id: 'brush', label: '양치', area: 'hygiene' },
    { id: 'sun', label: '선크림', area: 'skin' }, { id: 'brow', label: '눈썹 정리', area: 'hygiene' },
    { id: 'nose', label: '코털 정리', area: 'hygiene' }, { id: 'scalp', label: '탈모 케어', area: 'hair' }
  ],
  meds: [], perfumes: [], haircuts: [], days: {}, milestones: {}
});
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw), f = fresh();
      return { ...f, ...s, profile: { ...f.profile, ...s.profile }, settings: { ...f.settings, ...s.settings } };
    }
  } catch (e) { /* 저장소를 못 쓰면 새로 시작 */ }
  return fresh();
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('저장하지 못했어요. 저장 공간을 확인해 주세요'); }
}
const blankDay = () => ({ done: {}, minutes: null, sleep: null, bed: '', wake: '', mood: null, workout: { type: null, min: null, memo: '' }, meds: {}, perfume: false });
const dayRec = (d) => (S.days[d] ||= blankDay());
const hasRec = (r) => !!r && (Object.values(r.done || {}).some(Boolean) || r.minutes != null || r.sleep != null || r.mood != null
  || !!(r.workout && (r.workout.type || r.workout.min)) || Object.values(r.meds || {}).some(Boolean) || r.perfume);
const dPlus = (d) => diff(S.profile.startDate, d);
const medsFor = (d) => S.meds.filter((m) => m.when !== 'weekly' || Number(m.weekday) === parse(d).getDay());
const sortedCuts = () => [...new Set(S.haircuts)].sort();
const lastCut = (at) => sortedCuts().filter((c) => c <= at).pop() || null;

/* ---------- 사진 (IndexedDB) ---------- */
const photos = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('gn-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const run = (mode, fn) => open().then((db) => new Promise((res, rej) => {
    const t = db.transaction('photos', mode); const req = fn(t.objectStore('photos'));
    t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
  }));
  return {
    get: (k) => run('readonly', (s) => s.get(k)),
    put: (k, v) => run('readwrite', (s) => s.put(v, k)),
    del: (k) => run('readwrite', (s) => s.delete(k)),
    keys: () => run('readonly', (s) => s.getAllKeys()),
    clear: () => run('readwrite', (s) => s.clear())
  };
})();
const urls = {};
async function loadPhotos() {
  try {
    for (const k of Object.keys(urls)) { URL.revokeObjectURL(urls[k]); delete urls[k]; }
    for (const k of await photos.keys()) { const b = await photos.get(k); if (b) urls[k] = URL.createObjectURL(b); }
  } catch (e) { /* 사진 저장소를 못 쓰는 환경 */ }
}
async function shrink(file) {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const sc = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
  } finally { URL.revokeObjectURL(src); }
}

/* ---------- 집계 ---------- */
function stats(from, to) {
  let rec = 0, done = 0, total = 0, minS = 0, minN = 0, slS = 0, slN = 0, ex = 0, medT = 0, medD = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const r = S.days[d]; if (!hasRec(r)) continue; rec++;
    total += S.items.length; done += S.items.filter((i) => r.done[i.id]).length;
    if (r.minutes != null) { minS += r.minutes; minN++; }
    if (r.sleep != null) { slS += r.sleep; slN++; }
    ex += Number(r.workout && r.workout.min) || 0;
    const ms = medsFor(d); medT += ms.length; medD += ms.filter((m) => r.meds && r.meds[m.id]).length;
  }
  return { rec, rate: total ? done / total : null, avgMin: minN ? minS / minN : null, avgSleep: slN ? slS / slN : null, ex,
    medRate: medT ? medD / medT : null, cuts: sortedCuts().filter((c) => c >= from && c <= to).length };
}
function cutScore(at) {
  const last = lastCut(at); if (!last || !S.settings.haircutWeeks) return null;
  const cyc = S.settings.haircutWeeks * 7, since = diff(last, at);
  return since <= cyc ? 1 : clamp(1 - (since - cyc) / 14);
}
function areaScores(from, to) {
  const days = [];
  for (let d = from; d <= to; d = addDays(d, 1)) { const r = S.days[d]; if (hasRec(r)) days.push([d, r]); }
  if (!days.length) return null;
  const itemRates = (area) => S.items.filter((i) => i.area === area).map((i) => ({ label: i.label, rate: days.filter(([, r]) => r.done[i.id]).length / days.length }));
  const itemRate = (area) => { const rs = itemRates(area); return rs.length ? rs.reduce((a, b) => a + b.rate, 0) / rs.length : null; };
  const medRate = (area) => { let t = 0, n = 0; for (const [d, r] of days) { const ms = medsFor(d).filter((m) => m.area === area); t += ms.length; n += ms.filter((m) => r.meds && r.meds[m.id]).length; } return t ? n / t : null; };
  const sl = days.map(([, r]) => r.sleep).filter((v) => v != null);
  const avgSleep = sl.length ? sl.reduce((a, b) => a + b, 0) / sl.length : null;
  const sleepScore = avgSleep == null ? null : clamp((avgSleep - 4) / (S.settings.sleepGoal - 4));
  const span = diff(from, to) + 1;
  const ex = days.reduce((a, [, r]) => a + (Number(r.workout && r.workout.min) || 0), 0);
  const exGoal = Math.round(S.settings.weeklyExercise * span / 7);
  const exScore = clamp(ex / exGoal);
  const md = days.map(([, r]) => r.mood).filter((v) => v != null);
  const moodScore = md.length ? md.reduce((a, b) => a + b, 0) / md.length / 4 : null;
  const perfScore = S.perfumes.length ? days.filter(([, r]) => r.perfume).length / days.length : null;
  const cs = cutScore(to);
  const comb = (parts) => { let w = 0, s = 0; for (const [v, wt] of parts) { if (v == null) continue; w += wt; s += v * wt; } return w ? Math.round(s / w * 100) : null; };
  return {
    hygiene: comb([[itemRate('hygiene'), 1], [perfScore, 0.25]]),
    skin: comb([[itemRate('skin'), 1], [sleepScore, 0.35]]),
    hair: comb([[itemRate('hair'), 1], [medRate('hair'), 1], [cs, 0.5]]),
    body: comb([[exScore, 1], [medRate('body'), 0.6]]),
    mental: comb([[sleepScore, 1], [moodScore, 1]]),
    info: { days: days.length, itemRates, medRate, avgSleep, ex, exGoal, moodScore, cs }
  };
}

/* ---------- 화면 상태 · 이동 ---------- */
const app = document.getElementById('app');
const V = {
  screen: 'today', date: today(), month: today().slice(0, 7), histSel: today(), balSel: null, mileSel: null,
  cmpPair: null, cmpMode: 'slider', cmpPos: 50, sugOff: {}, pDraft: { name: '', fam: [], scene: [] }, resetArm: false
};
const NAV = [['today', '오늘'], ['history', '기록'], ['balance', '밸런스'], ['changes', '변화'], ['settings', '설정']];
function go(screen) { if (location.hash !== '#' + screen) location.hash = screen; else route(); }
function route() {
  let sc = location.hash.slice(1) || 'today';
  if (!S.profile.onboarded && sc !== 'setup' && sc !== 'suggest') sc = 'setup';
  if (!SCREENS[sc]) sc = 'today';
  const changed = sc !== V.screen; V.screen = sc;
  render(changed);
}
function render(resetScroll) {
  const box = app.querySelector('.scroll');
  const top = box && !resetScroll ? box.scrollTop : 0;
  app.innerHTML = SCREENS[V.screen]();
  const box2 = app.querySelector('.scroll'); if (box2) box2.scrollTop = top;
}
const navHTML = (cur) => `<nav class="nav" aria-label="주요 메뉴">${NAV.map(([k, l]) =>
  `<a href="#${k}"${k === cur ? ' aria-current="page"' : ''}>${I.nav[k]}${l}</a>`).join('')}</nav>`;
let tT;
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('show'), 1600); }

const chips = (act, list, sel, extra = '') => list.map((v) => {
  const on = Array.isArray(sel) ? sel.includes(v) : sel === v;
  return `<button type="button" class="chip${on ? ' on' : ''}" data-a="${act}" data-v="${esc(v)}" ${extra} aria-pressed="${on}">${esc(v)}</button>`;
}).join('');
const checkBtn = (act, id, label, on, sub = '', tag = '', round = false) =>
  `<button type="button" class="check${on ? ' on' : ''}${round ? ' round' : ''}" data-a="${act}" data-id="${esc(id)}" aria-pressed="${on}">
    <span class="box">${on ? I.check : ''}</span>
    <span class="txt">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}</button>`;

/* ---------- 화면: 오늘 ---------- */
function nextMilestoneText(d) {
  const n = dPlus(d); const nx = MILES.find((m) => m > n);
  return n < 0 ? `시작까지 ${-n}일` : nx ? `D+${nx}까지 ${nx - n}일` : 'D+90 달성';
}
function prevMinutes(d) {
  const ks = Object.keys(S.days).filter((k) => k < d && S.days[k].minutes != null).sort();
  return ks.length ? S.days[ks[ks.length - 1]].minutes : null;
}
function scrToday() {
  const d = V.date, r = S.days[d] || blankDay(), isToday = d === today();
  const doneN = S.items.filter((i) => r.done[i.id]).length, tot = S.items.length;
  const pm = prevMinutes(d);
  const meds = medsFor(d), weekly = S.meds.filter((m) => m.when === 'weekly' && !meds.includes(m));
  const medDone = meds.filter((m) => r.meds[m.id]).length;
  const cutW = S.settings.haircutWeeks, last = lastCut(d);
  let cutHTML = '';
  if (cutW) {
    const visited = S.haircuts.includes(d);
    if (last) {
      const next = addDays(last, cutW * 7), left = diff(d, next), since = diff(last, d);
      cutHTML = `<div class="row" style="gap:16px">
          <span class="big ${left < 0 ? 'warn' : 'acc'}">${left >= 0 ? 'D-' + left : 'D+' + (-left)}</span>
          <span style="display:flex;flex-direction:column;gap:2px;font-size:13px"><span>다음 추천일 <b>${fmtMDdow(next)}</b></span>
          <span class="mute">마지막 방문 ${since === 0 ? '오늘' : `${fmtMD(last)} · ${since}일 지남`}</span></span></div>
        <div class="progress"><i style="width:${Math.round(clamp(since / (cutW * 7)) * 100)}%;${left < 0 ? 'background:var(--warn)' : ''}"></i></div>`;
    } else cutHTML = `<p class="small">마지막 미용실 방문일을 넣으면 다음 추천일을 알려 드려요.</p>`;
    cutHTML += `<button type="button" class="btn ghost" data-a="cutday">${visited ? '이 날 방문 기록됨 · 취소' : (isToday ? '오늘 미용실 다녀왔어요' : '이 날 미용실 다녀왔어요')}</button>`;
  }
  const mainP = S.perfumes.find((p) => p.main) || S.perfumes[0];
  return `<div class="scroll">
    <header class="head">
      <div style="display:flex;flex-direction:column;gap:2px">
        <div class="row" style="gap:2px;margin-left:-10px">
          <button type="button" class="icon-btn plain" data-a="dayshift" data-v="-1" aria-label="전날">${I.left}</button>
          <span class="sub">${fmtMDdow(d)}${isToday ? ' · 오늘' : ''}</span>
          <button type="button" class="icon-btn plain" data-a="dayshift" data-v="1" aria-label="다음날" ${isToday ? 'disabled style="opacity:.3"' : ''}>${I.right}</button>
        </div>
        <h1>${isToday ? '오늘의 관리' : '지난 기록 수정'}</h1>
        ${!isToday ? '<button type="button" class="link" data-a="totoday" style="padding:0;min-height:32px;color:var(--acc)">오늘로 돌아가기</button>' : (S.settings.checkTime ? `<span class="small">권장 체크 시간 ${esc(S.settings.checkTime)}</span>` : '')}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <span class="big acc">D${dPlus(d) >= 0 ? '+' : ''}${dPlus(d)}</span><span class="small">${nextMilestoneText(d)}</span>
      </div>
    </header>

    <section class="card">
      <div class="between"><h2>아침 루틴</h2><span class="num">${doneN}<span class="mute">/${tot}</span></span></div>
      <div class="progress"><i style="width:${tot ? Math.round(doneN / tot * 100) : 0}%"></i></div>
      ${tot ? `<div class="grid2">${S.items.map((i) => checkBtn('item', i.id, i.label, !!r.done[i.id])).join('')}</div>` : '<p class="empty">루틴 항목이 없어요. 설정에서 추가해 주세요.</p>'}
      <a class="btn dash" href="#settings">${I.plus} 항목 추가 · 편집</a>
    </section>

    <section class="card">
      <div class="between"><h2>루틴에 걸린 시간</h2><span class="small">${pm != null ? `직전 기록 ${pm}분` : '첫 기록이에요'}</span></div>
      <div class="wrap">${[5, 10, 15, 20, 30].map((m) => `<button type="button" class="chip${r.minutes === m ? ' on' : ''}" data-a="min" data-v="${m}" aria-pressed="${r.minutes === m}">${m}분</button>`).join('')}</div>
      <label class="row small">직접 입력 <input type="number" inputmode="numeric" min="0" max="240" data-c="min" value="${r.minutes ?? ''}" aria-label="소요 시간(분)"> 분</label>
    </section>

    <section class="card">
      <div class="between"><h2>${I.moon} 수면 · 컨디션</h2><span class="small">목표 ${f1(S.settings.sleepGoal)}시간</span></div>
      <div class="stepper">
        <button type="button" class="icon-btn" data-a="sleep" data-v="-0.5" aria-label="수면 30분 줄이기">−</button>
        <span><span class="big" style="font-size:40px">${r.sleep != null ? f1(r.sleep) : '—'}</span> <span class="mute">시간</span></span>
        <button type="button" class="icon-btn" data-a="sleep" data-v="0.5" aria-label="수면 30분 늘리기">+</button>
      </div>
      <details${r.bed || r.wake ? ' open' : ''}><summary class="small" style="min-height:32px;cursor:pointer">취침·기상 시각으로 계산</summary>
        <div class="row" style="padding-top:8px;flex-wrap:wrap">
          <label class="row small">취침 <input type="time" data-c="bed" value="${esc(r.bed)}"></label>
          <label class="row small">기상 <input type="time" data-c="wake" value="${esc(r.wake)}"></label>
        </div></details>
      <div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:12px">
        <span class="small">오늘 컨디션 · 멘탈 점수에 반영</span>
        <div class="grid5" role="group" aria-label="오늘 컨디션">${MOODS.map((m, i) => `<button type="button" class="chip${r.mood === i ? ' on' : ''}" style="padding:0" data-a="mood" data-v="${i}" aria-pressed="${r.mood === i}">${m}</button>`).join('')}</div>
      </div>
    </section>

    <section class="card">
      <div class="between"><h2>${I.gym} 운동</h2><span class="small">주간 목표 ${S.settings.weeklyExercise}분</span></div>
      <div class="wrap">${chips('wtype', WORKOUTS, r.workout.type)}</div>
      <div class="row">
        <label class="row small" style="flex:none">시간 <input type="number" inputmode="numeric" min="0" max="600" data-c="wmin" value="${r.workout.min ?? ''}" aria-label="운동 시간(분)"> 분</label>
        <input type="text" data-c="wmemo" value="${esc(r.workout.memo)}" placeholder="메모 (예: 5km 조깅)" aria-label="운동 메모" style="flex:1 1 auto">
      </div>
    </section>

    ${S.meds.length ? `<section class="card">
      <div class="between"><h2>${I.pill} 약 · 영양제</h2><span class="num">${medDone}<span class="mute">/${meds.length}</span></span></div>
      ${meds.length ? meds.map((m) => checkBtn('med', m.id, m.name, !!r.meds[m.id], m.when === 'weekly' ? '주 1회' : '매일', m.when === 'weekly' ? `${DOW[m.weekday]}요일` : WHEN[m.when], true)).join('') : '<p class="small">이 날 먹을 약이 없어요.</p>'}
      ${weekly.map((m) => `<p class="small">${esc(m.name)} · 주 1회 ${DOW[m.weekday]}요일</p>`).join('')}
    </section>` : ''}

    ${cutW ? `<section class="card"><div class="between"><h2>${I.cut} 헤어컷</h2><span class="small">${cutW}주 주기</span></div>${cutHTML}</section>` : ''}

    ${S.perfumes.length ? `<section class="card"><div class="between">
      <span style="display:flex;flex-direction:column;gap:2px"><h2>${I.scent} 향수</h2><span class="small">${esc(mainP.name)}</span></span>
      <button type="button" class="toggle${r.perfume ? ' on' : ''}" data-a="perfume" aria-pressed="${r.perfume}" aria-label="향수 뿌렸어요"><i></i></button></div></section>` : ''}

    <p class="small" style="text-align:center">누르는 대로 자동 저장돼요</p>
  </div>${navHTML('today')}`;
}

/* ---------- 화면: 기록 ---------- */
function streak() {
  let d = today(); if (!hasRec(S.days[d])) d = addDays(d, -1);
  let n = 0; while (hasRec(S.days[d])) { n++; d = addDays(d, -1); }
  return n;
}
function scrHistory() {
  const [y, m] = V.month.split('-').map(Number);
  const first = `${V.month}-01`, nDays = new Date(y, m, 0).getDate(), last = `${V.month}-${pad(nDays)}`;
  const lead = parse(first).getDay(), st = stats(first, last), t = today();
  const lc = lastCut(t), nextCut = lc && S.settings.haircutWeeks ? addDays(lc, S.settings.haircutWeeks * 7) : null;
  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<span></span>';
  for (let dd = 1; dd <= nDays; dd++) {
    const d = `${V.month}-${pad(dd)}`, r = S.days[d], has = hasRec(r);
    const k = has && S.items.length ? S.items.filter((i) => r.done[i.id]).length / S.items.length : 0;
    let bg = '#1E2125', fg = '#6E747B';
    if (has) { if (k >= 1) { bg = '#C6F36A'; fg = '#0E1012'; } else if (k >= 0.6) { bg = '#7E9E3F'; fg = '#0E1012'; } else if (k > 0) { bg = '#3E4D24'; fg = '#F3F3EF'; } else { bg = '#262A2F'; fg = '#F3F3EF'; } }
    const cut = S.haircuts.includes(d), planned = d === nextCut;
    cells += `<button type="button" class="${d === V.histSel ? 'sel' : ''}${d === t ? ' today' : ''}" style="background:${bg};color:${fg}" data-a="hsel" data-v="${d}"
      aria-label="${m}월 ${dd}일${has ? ` 루틴 ${Math.round(k * 100)}%` : ' 기록 없음'}${cut ? ' 미용실 방문' : ''}${planned ? ' 미용실 추천일' : ''}">${dd}${cut || planned ? I.cutSm(cut ? fg : '#C6F36A') : ''}</button>`;
  }
  const s = V.histSel, r = S.days[s];
  let detail;
  if (hasRec(r)) {
    const ms = medsFor(s);
    detail = `<div class="grid2">
      <div class="tile"><span class="small">루틴</span><span class="num" style="font-size:18px">${S.items.filter((i) => r.done[i.id]).length}/${S.items.length}${r.minutes != null ? ` · ${r.minutes}분` : ''}</span></div>
      <div class="tile"><span class="small">수면 · 컨디션</span><span class="num" style="font-size:18px">${r.sleep != null ? f1(r.sleep) + '시간' : '—'}${r.mood != null ? ' · ' + MOODS[r.mood] : ''}</span></div>
      <div class="tile" style="grid-column:span 2"><span class="small">운동</span><span>${r.workout.type ? esc(r.workout.type) : '—'}${r.workout.min ? ` ${r.workout.min}분` : ''}${r.workout.memo ? ` · ${esc(r.workout.memo)}` : ''}</span></div>
      ${ms.length ? `<div class="tile" style="grid-column:span 2"><span class="small">약 · 영양제</span><span>${ms.filter((x) => r.meds[x.id]).length}/${ms.length}${ms.filter((x) => !r.meds[x.id]).length ? ' · 놓침: ' + ms.filter((x) => !r.meds[x.id]).map((x) => esc(x.name)).join(', ') : ' 모두 복용'}</span></div>` : ''}
      ${r.perfume || S.haircuts.includes(s) ? `<div class="tile" style="grid-column:span 2"><span>${[r.perfume ? '향수 사용' : '', S.haircuts.includes(s) ? '미용실 방문' : ''].filter(Boolean).join(' · ')}</span></div>` : ''}
    </div>`;
  } else detail = `<p class="small">${S.haircuts.includes(s) ? '미용실 방문 · ' : ''}이 날은 기록이 없어요.</p>`;
  return `<div class="scroll">
    <header class="head"><div style="display:flex;flex-direction:column;gap:2px"><span class="sub">시작일 ${fmtMD(S.profile.startDate)} · D+${dPlus(t)}</span><h1>기록</h1></div>
      <div class="row" style="gap:4px"><button type="button" class="icon-btn" data-a="month" data-v="-1" aria-label="이전 달">${I.left}</button>
      <button type="button" class="icon-btn" data-a="month" data-v="1" aria-label="다음 달">${I.right}</button></div></header>
    <section style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
      <div class="tile" style="background:var(--card);border:1px solid var(--line)"><span class="small">연속 기록</span><span class="v">${streak()}<span class="u"> 일</span></span></div>
      <div class="tile" style="background:var(--card);border:1px solid var(--line)"><span class="small">이달 달성률</span><span class="v acc">${pct(st.rate)}</span></div>
      <div class="tile" style="background:var(--card);border:1px solid var(--line)"><span class="small">평균 루틴</span><span class="v">${st.avgMin != null ? Math.round(st.avgMin) : '—'}<span class="u"> 분</span></span></div>
    </section>
    <section class="card">
      <div class="between"><h2>${y}년 ${m}월</h2><span class="small">진할수록 많이 체크</span></div>
      <div class="cal">${DOW.map((x) => `<span class="dow">${x}</span>`).join('')}${cells}</div>
      ${S.settings.haircutWeeks ? `<div class="row small">${I.cutSm('#9BA1A8')} 미용실 방문${nextCut ? ` · 다음 추천일 ${fmtShort(nextCut)}` : ''}</div>` : ''}
    </section>
    <section class="card">
      <div class="between"><h2>${fmtMDdow(s)}</h2><span class="small">D+${dPlus(s)}</span></div>
      ${detail}
      ${s <= t ? `<button type="button" class="btn ghost" data-a="editday" data-v="${s}">이 날 기록 ${hasRec(r) ? '수정' : '추가'}</button>` : ''}
    </section>
  </div>${navHTML('history')}`;
}

/* ---------- 화면: 밸런스 ---------- */
function radarSVG(cur, base) {
  const pt = (i, v) => { const a = (-90 + 72 * i) * Math.PI / 180, r = 110 * (v || 0) / 100; return [150 + r * Math.cos(a), 150 + r * Math.sin(a)]; };
  const poly = (vals) => vals.map((v, i) => pt(i, v).map((n) => n.toFixed(1)).join(',')).join(' ');
  const ring = (v) => poly([v, v, v, v, v]);
  const vals = AREA_KEYS.map((k) => cur[k]), bvals = base ? AREA_KEYS.map((k) => base[k]) : null;
  const sel = AREA_KEYS.indexOf(V.balSel), sp = pt(sel, vals[sel]);
  const lab = [[150, 22, 'middle'], [266, 110, 'start'], [229, 272, 'middle'], [71, 272, 'middle'], [34, 110, 'end']];
  return `<svg role="img" aria-label="영역별 점수: ${AREA_KEYS.map((k, i) => `${AREAS[k]} ${vals[i] ?? '기록 없음'}`).join(', ')}" viewBox="-40 0 380 300" style="width:100%;max-width:360px;height:auto">
    ${[100, 75, 50, 25].map((v) => `<polygon points="${ring(v)}" fill="none" stroke="#2C3036"/>`).join('')}
    ${[0, 1, 2, 3, 4].map((i) => { const [x, y] = pt(i, 100); return `<line x1="150" y1="150" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2C3036"/>`; }).join('')}
    ${bvals && V.showBase !== false ? `<polygon points="${poly(bvals)}" fill="#9BA1A8" fill-opacity=".12" stroke="#9BA1A8" stroke-width="1.5" stroke-dasharray="4 3"/>` : ''}
    <polygon points="${poly(vals)}" fill="#C6F36A" fill-opacity=".22" stroke="#C6F36A" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${sp[0].toFixed(1)}" cy="${sp[1].toFixed(1)}" r="6" fill="#C6F36A" stroke="#0E1012" stroke-width="2"/>
    ${AREA_KEYS.map((k, i) => `<text x="${lab[i][0]}" y="${lab[i][1]}" text-anchor="${lab[i][2]}" font-size="14" fill="#F3F3EF">${AREAS[k]} <tspan font-weight="700" fill="#C6F36A">${vals[i] ?? '—'}</tspan></text>`).join('')}
  </svg>`;
}
function areaTip(k, info) {
  const g = S.settings;
  const weakItem = (a) => { const rs = info.itemRates(a).sort((x, y) => x.rate - y.rate); return rs.length && rs[0].rate < 1 ? `‘${rs[0].label}’ 체크율이 ${Math.round(rs[0].rate * 100)}%로 가장 낮아요.` : ''; };
  if (k === 'hygiene') return weakItem('hygiene') || '청결·위생 항목을 잘 지키고 있어요.';
  if (k === 'skin') return weakItem('skin') || (info.avgSleep != null && info.avgSleep < g.sleepGoal ? `피부엔 수면도 반영돼요. 평균 ${f1(info.avgSleep)}시간 · 목표 ${f1(g.sleepGoal)}시간.` : '피부 루틴을 잘 지키고 있어요.');
  if (k === 'hair') { if (info.cs != null && info.cs < 1) return '헤어컷 주기가 지났어요. 미용실 방문을 기록해 주세요.'; const mr = info.medRate('hair'); if (mr != null && mr < 1) return `헤어 관련 복용률이 ${Math.round(mr * 100)}%예요.`; return weakItem('hair') || '헤어 관리를 잘 지키고 있어요.'; }
  if (k === 'body') return info.ex < info.exGoal ? `최근 운동 ${info.ex}분 · 목표 ${info.exGoal}분. ${info.exGoal - info.ex}분 더 하면 목표예요.` : `운동 목표(${info.exGoal}분)를 채웠어요.`;
  return info.avgSleep == null ? '수면 시간과 오늘 컨디션을 기록하면 멘탈 점수가 계산돼요.' : `평균 수면 ${f1(info.avgSleep)}시간 · 목표 ${f1(g.sleepGoal)}시간${info.moodScore != null ? ` · 평균 컨디션 ${MOODS[Math.round(info.moodScore * 4)]}` : ''}.`;
}
const AREA_INPUTS = {
  hygiene: () => `‘청결·위생’ 루틴 항목 체크${S.perfumes.length ? ', 향수 사용' : ''}`,
  skin: () => '‘피부’ 루틴 항목 체크, 수면 시간',
  hair: () => '‘헤어’ 루틴 항목 체크, 헤어 관련 약 복용, 헤어컷 주기 지키기',
  body: () => `주간 운동 시간(목표 ${S.settings.weeklyExercise}분 대비), 체형 관련 약 복용`,
  mental: () => `수면 시간(목표 ${f1(S.settings.sleepGoal)}시간 대비), 오늘 컨디션`
};
function scrBalance() {
  const t = today(), from = addDays(t, -6);
  const cur = areaScores(from, t);
  const bEnd = addDays(S.profile.startDate, 6);
  const base = dPlus(t) >= 7 ? areaScores(S.profile.startDate, bEnd) : null;
  if (!cur) return `<div class="scroll"><header class="head"><div><span class="sub">최근 7일 기준</span><h1>관리 밸런스</h1></div></header>
    <p class="empty">기록이 쌓이면 5대 영역 점수가 나타나요.<br>오늘 화면에서 체크부터 시작해 보세요.</p></div>${navHTML('balance')}`;
  const vals = AREA_KEYS.map((k) => cur[k]).filter((v) => v != null);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  const bvals = base ? AREA_KEYS.map((k) => base[k]).filter((v) => v != null) : [];
  const bavg = bvals.length ? Math.round(bvals.reduce((a, b) => a + b, 0) / bvals.length) : null;
  const min = Math.min(...vals);
  if (!V.balSel) V.balSel = AREA_KEYS.find((k) => cur[k] === min) || 'hygiene';
  const k = V.balSel;
  const mainP = S.perfumes.find((p) => p.main) || S.perfumes[0];
  const tr = S.days[t];
  return `<div class="scroll">
    <header class="head"><div style="display:flex;flex-direction:column;gap:2px"><span class="sub">최근 7일 기준 · 기록 ${cur.info.days}일</span><h1>관리 밸런스</h1></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px"><span class="big">${avg ?? '—'}</span>
      ${bavg != null && avg != null ? `<span class="small ${avg >= bavg ? 'acc' : 'warn'}">첫 주 대비 ${avg >= bavg ? '+' : ''}${avg - bavg}</span>` : '<span class="small">첫 주 비교는 D+7부터</span>'}</div></header>
    <section class="card" style="align-items:center;padding:12px 8px">
      ${radarSVG(cur, base)}
      <div class="row small" style="gap:14px"><span class="row" style="gap:6px"><i style="width:14px;height:3px;background:var(--acc);border-radius:2px"></i>최근 7일</span>
      ${base ? `<button type="button" class="chip sm" data-a="togglebase" aria-pressed="${V.showBase !== false}"><span style="display:inline-block;width:14px;border-top:2px dashed #9BA1A8;vertical-align:middle;margin-right:6px"></span>${V.showBase !== false ? '첫 주 겹쳐 보는 중' : '첫 주 겹쳐 보기'}</button>` : ''}</div>
    </section>
    <div style="display:flex;flex-direction:column;gap:6px">${AREA_KEYS.map((a) => {
      const v = cur[a], on = a === k;
      return `<button type="button" class="check${on ? ' on' : ''}" data-a="bsel" data-id="${a}" aria-pressed="${on}" style="display:grid;grid-template-columns:76px minmax(0,1fr) 36px;gap:10px">
        <span>${AREAS[a]}</span><span class="progress"><i style="width:${v ?? 0}%;${v === min ? 'background:var(--warn)' : ''}"></i></span><span class="num" style="text-align:right">${v ?? '—'}</span></button>`;
    }).join('')}</div>
    <section class="card">
      <div class="between"><h2 style="font-size:17px">${AREAS[k]}</h2><span class="small acc">${base && base[k] != null ? `첫 주 ${base[k]} → 지금 ${cur[k] ?? '—'}` : `지금 ${cur[k] ?? '—'}`}</span></div>
      <div style="display:flex;flex-direction:column;gap:4px"><span class="small">점수에 반영되는 기록</span><span style="font-size:14px;color:var(--soft)">${AREA_INPUTS[k]()}</span></div>
      <div class="row tile" style="align-items:flex-start;flex-direction:row">${I.bulb}<span style="font-size:14px">${esc(areaTip(k, cur.info))}</span></div>
    </section>
    <section class="card">
      <div class="between"><h2>${I.scent} 나의 향</h2><span class="small">청결·위생에 반영</span></div>
      ${S.perfumes.length ? S.perfumes.map((p) => `<div class="list-row" style="padding:10px 12px"><span class="grow" style="display:flex;flex-direction:column;gap:2px"><b style="font-weight:500">${esc(p.name)}</b><span class="small">${esc([...p.fam, ...p.scene].join(' · ') || '계열·상황 미입력')}</span></span>${p.main ? '<span class="tag" style="background:var(--acc);color:var(--acc-ink);border:0;font-weight:700">주력</span>' : ''}</div>`).join('')
      + `<button type="button" class="btn${tr && tr.perfume ? '' : ' ghost'}" style="min-height:44px;font-size:14px" data-a="perfumeToday">${tr && tr.perfume ? `오늘 ${esc(mainP.name)} 뿌렸어요 · 기록됨` : '오늘 향수 뿌렸어요'}</button>`
      : '<p class="small">쓰는 향수를 설정에서 등록할 수 있어요.</p><a class="btn ghost" href="#setup" style="min-height:44px">향수 등록하기</a>'}
    </section>
  </div>${navHTML('balance')}`;
}

/* ---------- 화면: 변화 (D+0/30/60/90) ---------- */
const mileDate = (n) => addDays(S.profile.startDate, n);
function scrChanges() {
  const t = today(), n = dPlus(t);
  if (V.mileSel == null) V.mileSel = MILES.filter((m) => m <= n).find((m) => !urls[m]) ?? MILES.filter((m) => m <= n).pop() ?? 0;
  const sel = V.mileSel, md = mileDate(sel), reached = sel <= n, ms = S.milestones[sel] || {};
  const thumbs = MILES.map((m) => {
    const has = !!urls[m], ok = m <= n;
    const isNext = !has && ok;
    return `<button type="button" class="${m === sel ? 'sel' : ''}" data-a="msel" data-v="${m}" aria-label="D+${m} ${has ? '사진 있음' : ok ? '촬영 가능' : '아직 잠김'}">
      <span class="thumb${has ? '' : isNext ? ' next' : ' lock'}">${has ? `<img src="${urls[m]}" alt="">` : isNext ? I.cam('#C6F36A', 24) : I.lock}</span>
      <span class="num" style="font-size:14px;${isNext ? 'color:var(--acc)' : ok ? '' : 'color:var(--mute)'}">D+${m}</span>
      <span class="small" style="font-size:11px">${m > n ? `${m - n}일 남음` : fmtShort(mileDate(m))}</span></button>`;
  }).join('');
  const segFrom = sel === 0 ? S.profile.startDate : mileDate(sel - 30);
  const segTo = sel === 0 ? (n < 30 ? t : mileDate(30)) : (reached ? md : t);
  const st = stats(segFrom, segTo <= t ? segTo : t);
  const photoCount = MILES.filter((m) => urls[m]).length;
  return `<div class="scroll">
    <header class="head"><div style="display:flex;flex-direction:column;gap:2px"><span class="sub">30일마다 남기는 기준 사진</span><h1>나의 변화</h1></div></header>
    <section class="mile" aria-label="마일스톤">${thumbs}</section>
    <section class="card">
      <div class="between"><h2>D+${sel} · ${fmtMD(md)}</h2>${urls[sel] ? '<span class="small acc">사진 저장됨</span>' : ''}</div>
      ${reached ? `
        ${urls[sel] ? `<img src="${urls[sel]}" alt="D+${sel} 사진" style="width:100%;border-radius:14px;aspect-ratio:3/4;object-fit:cover">` : ''}
        <label class="btn" style="position:relative">${I.cam('currentColor')}${urls[sel] ? '다시 찍기 · 바꾸기' : '사진 촬영 · 업로드'}
          <input type="file" accept="image/*" data-c="photo" data-v="${sel}" style="position:absolute;width:1px;height:1px;opacity:0"></label>
        ${urls[sel] ? `<button type="button" class="btn ghost" data-a="delphoto" data-v="${sel}" style="min-height:44px">사진 삭제</button>` : ''}
        <label class="field"><span class="small">메모 · 지금 느끼는 변화</span><textarea data-c="mmemo" data-v="${sel}" placeholder="예: 피부 톤이 밝아진 것 같다">${esc(ms.memo)}</textarea></label>`
      : `<p class="small">${fmtMD(md)}에 열려요 · ${sel - n}일 남음</p>`}
    </section>
    <section class="card">
      <div class="between"><h2>구간 요약</h2><span class="small">${fmtShort(segFrom)} → ${fmtShort(segTo <= t ? segTo : t)}${segTo > t || (sel === 0 && n < 30) ? ' (진행 중)' : ''}</span></div>
      ${st.rec ? `<div class="grid2">
        <div class="tile"><span class="small">루틴 달성률</span><span class="v acc">${pct(st.rate)}</span></div>
        <div class="tile"><span class="small">평균 루틴 시간</span><span class="v">${st.avgMin != null ? Math.round(st.avgMin) : '—'}<span class="u"> 분</span></span></div>
        <div class="tile"><span class="small">평균 수면</span><span class="v">${f1(st.avgSleep)}<span class="u"> 시간</span></span></div>
        <div class="tile"><span class="small">총 운동</span><span class="v">${st.ex}<span class="u"> 분</span></span></div>
        <div class="tile"><span class="small">헤어컷</span><span class="v">${st.cuts}<span class="u"> 회</span></span></div>
        <div class="tile"><span class="small">약 복용률</span><span class="v">${pct(st.medRate)}</span></div></div>` : '<p class="small">이 구간에는 아직 기록이 없어요.</p>'}
    </section>
    <section class="card"><h2>촬영 가이드</h2>
      <ul style="margin:0;padding-left:18px;font-size:14px;color:var(--soft);line-height:1.7"><li>D+0과 같은 장소·조명에서</li><li>정면, 무표정, 머리카락은 넘기고</li><li>휴대폰은 눈높이, 같은 거리에서</li></ul>
      <span class="small">사진은 이 기기에만 저장돼요</span></section>
    ${photoCount >= 2 ? '<a class="btn ghost" href="#compare">Before / After 비교 보기</a>' : '<p class="small" style="text-align:center">사진이 2장 이상 모이면 Before / After 비교를 볼 수 있어요</p>'}
  </div>${navHTML('changes')}`;
}

/* ---------- 화면: 비교 ---------- */
function scrCompare() {
  const have = MILES.filter((m) => urls[m]);
  const pairs = [];
  for (const m of have) if (m > 0 && urls[0]) pairs.push([0, m, `D+0 vs ${m}`]);
  for (let i = 1; i < have.length; i++) if (have[i - 1] !== 0) pairs.push([have[i - 1], have[i], `직전 대비 ${have[i - 1]}→${have[i]}`]);
  const pk = (p) => p ? `${p[0]}-${p[1]}` : '';
  if (pairs.length && !pairs.find((p) => pk(p) === pk(V.cmpPair))) V.cmpPair = pairs[pairs.length - 1];
  const head = `<header class="row" style="gap:4px;margin-left:-10px"><a class="icon-btn plain" href="#changes" aria-label="뒤로">${I.left}</a><h1 style="font-size:22px">Before / After</h1></header>`;
  if (!pairs.length) return `<div class="scroll">${head}<p class="empty">비교하려면 D+0 사진과 다른 시점 사진이 하나 더 필요해요.</p></div>${navHTML('changes')}`;
  const [a, b] = V.cmpPair, st = stats(mileDate(a), mileDate(b) <= today() ? mileDate(b) : today());
  const pos = V.cmpPos;
  const viewer = V.cmpMode === 'slider'
    ? `<div class="cmp" id="cmp"><img src="${urls[a]}" alt="D+${a} 사진"><div class="after" style="clip-path:inset(0 ${100 - pos}% 0 0)"><img src="${urls[b]}" alt="D+${b} 사진"></div>
        <span class="line" style="left:${pos}%"></span>
        <span class="lab" style="left:10px;background:var(--acc);color:var(--acc-ink)">AFTER · D+${b}</span>
        <span class="lab" style="right:10px;background:#0E1012">BEFORE · D+${a}</span></div>
       <input type="range" min="0" max="100" value="${pos}" data-c="cmp" aria-label="비포·애프터 슬라이더">`
    : `<div class="grid2">${[a, b].map((m, i) => `<div style="display:flex;flex-direction:column;gap:6px"><img src="${urls[m]}" alt="D+${m} 사진" style="width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px;${i ? 'outline:2px solid var(--acc)' : ''}">
        <span class="num" style="font-size:13px;${i ? 'color:var(--acc)' : ''}">${i ? 'AFTER' : 'BEFORE'} · D+${m}</span>
        ${S.milestones[m] && S.milestones[m].memo ? `<span class="small">“${esc(S.milestones[m].memo)}”</span>` : ''}</div>`).join('')}</div>`;
  const rows = [['루틴 달성률', pct(st.rate), st.rate], ['평균 루틴 시간', st.avgMin != null ? Math.round(st.avgMin) + ' 분' : '—', st.avgMin != null ? st.avgMin / 30 : 0],
    ['평균 수면', f1(st.avgSleep) + ' 시간', st.avgSleep ? st.avgSleep / 9 : 0], ['총 운동', st.ex + ' 분', st.ex / (S.settings.weeklyExercise * (b - a) / 7 || 1)],
    ['헤어컷', st.cuts + '회', st.cuts / 4], ['약 복용률', pct(st.medRate), st.medRate || 0]];
  return `<div class="scroll">${head}
    <div class="wrap">${pairs.map((p) => `<button type="button" class="chip sm${pk(p) === pk(V.cmpPair) ? ' on' : ''}" data-a="pair" data-v="${p[0]}-${p[1]}">${p[2]}</button>`).join('')}</div>
    <div class="seg" role="group" aria-label="보기 방식"><button type="button" class="${V.cmpMode === 'slider' ? 'on' : ''}" data-a="cmode" data-v="slider">슬라이더</button><button type="button" class="${V.cmpMode === 'side' ? 'on' : ''}" data-a="cmode" data-v="side">나란히</button></div>
    ${viewer}
    <section class="card"><div class="between"><h2 style="font-size:15px">이 변화를 만든 ${b - a}일</h2><span class="small">D+${a} → D+${b}</span></div>
      ${rows.map(([l, v, r]) => `<div style="display:grid;grid-template-columns:1fr auto;gap:4px;padding-top:8px;border-top:1px solid var(--line)"><span style="font-size:14px;color:var(--soft)">${l}</span><span class="num">${v}</span><span class="progress" style="grid-column:span 2"><i style="width:${Math.round(clamp(r) * 100)}%"></i></span></div>`).join('')}
    </section></div>${navHTML('changes')}`;
}

/* ---------- 화면: 처음 설정 · 프로필 ---------- */
function scrSetup() {
  const p = S.profile, g = S.settings, first = !p.onboarded, lc = lastCut(today());
  const filled = [p.age, p.job, p.exFreq, p.skin].filter(Boolean).length + (p.goals.length ? 1 : 0) + (S.meds.length ? 1 : 0) + (S.perfumes.length ? 1 : 0) + (lc ? 1 : 0);
  const pd = V.pDraft;
  return `<div class="scroll">
    <header style="display:flex;flex-direction:column;gap:6px">
      <div class="between"><span class="small acc" style="font-weight:700">선택 사항 · ${filled}/8 입력됨</span>
        ${first ? '<button type="button" class="link" data-a="skip">건너뛰기</button>' : '<a class="link" href="#settings">닫기</a>'}</div>
      <h1>${first ? '나를 알려주세요' : '프로필 · 맞춤 설정'}</h1>
      <p class="small" style="font-size:14px">입력할수록 제안이 정확해져요. 설정에서 언제든 바꿀 수 있어요.</p>
    </header>
    <section class="card"><h3>기본 정보</h3>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">연령대</span><div class="wrap">${chips('pf', AGES, p.age, 'data-k="age"')}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">직종 · 근무 형태</span><div class="wrap">${chips('pf', JOBS, p.job, 'data-k="job"')}</div></div>
      <label class="inline">평소 집 나서는 시간<input type="time" data-c="pf" data-k="leaveTime" value="${esc(p.leaveTime)}"></label>
    </section>
    <section class="card"><h3>생활 패턴</h3>
      <div class="between"><span style="font-weight:500">평소 수면 시간</span><div class="row">
        <button type="button" class="icon-btn" data-a="usleep" data-v="-0.5" aria-label="줄이기">−</button>
        <span class="num" style="font-size:22px;min-width:64px;text-align:center">${f1(p.usualSleep)}<span class="small"> 시간</span></span>
        <button type="button" class="icon-btn" data-a="usleep" data-v="0.5" aria-label="늘리기">+</button></div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">운동 빈도</span><div class="wrap">${chips('pf', FREQS, p.exFreq, 'data-k="exFreq"')}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">피부 타입</span><div class="wrap">${chips('pf', SKINS, p.skin, 'data-k="skin"')}</div></div>
    </section>
    <section class="card"><h3 class="row" style="gap:6px">${I.cut} 헤어 관리</h3>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">미용실 가는 주기</span>
        <div class="wrap">${[3, 4, 5, 6, 8].map((w) => `<button type="button" class="chip${g.haircutWeeks === w ? ' on' : ''}" data-a="cutw" data-v="${w}" aria-pressed="${g.haircutWeeks === w}">${w}주</button>`).join('')}</div></div>
      <label class="inline">마지막 미용실 방문<input type="date" data-c="lastcut" max="${today()}" value="${lc || ''}"></label>
    </section>
    <section class="card"><h3 class="row" style="gap:6px">${I.scent} 쓰는 향수</h3>
      ${S.perfumes.map((x) => `<div class="list-row"><span class="grow" style="display:flex;flex-direction:column;padding:6px 0"><b style="font-weight:500">${esc(x.name)}</b><span class="small">${esc([...x.fam, ...x.scene].join(' · ') || '—')}</span></span>
        <button type="button" class="icon-btn plain" data-a="pmain" data-id="${x.id}" aria-pressed="${!!x.main}" aria-label="${esc(x.name)} 주력으로">${I.star(x.main)}</button>
        <button type="button" class="icon-btn plain" data-a="pdel" data-id="${x.id}" aria-label="${esc(x.name)} 삭제">${I.trash}</button></div>`).join('')}
      <label class="field">향수 이름<input type="text" data-c="pname" value="${esc(pd.name)}" placeholder="예: 매일 쓰는 향수 이름"></label>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">향 계열</span><div class="wrap">${chips('pfam', FAMILIES, pd.fam)}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">주로 쓰는 때</span><div class="wrap">${chips('pscene', SCENES, pd.scene)}</div></div>
      <button type="button" class="btn dash" data-a="padd">${I.plus} 향수 추가</button>
    </section>
    <section class="card"><h3 class="row" style="gap:6px">${I.pill} 평소 먹는 약 · 영양제</h3>
      <div class="wrap">${chips('mpreset', Object.keys(MED_PRESETS), S.meds.map((m) => m.name))}</div>
      ${S.meds.map((m) => `<div class="list-row" style="flex-wrap:wrap;padding:8px 4px 8px 12px">
        <b class="grow" style="font-weight:500">${esc(m.name)}</b>
        <select data-c="mwhen" data-id="${m.id}" aria-label="${esc(m.name)} 복용 시간">${Object.entries(WHEN).map(([k, l]) => `<option value="${k}"${m.when === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        ${m.when === 'weekly' ? `<select data-c="mday" data-id="${m.id}" aria-label="요일">${DOW.map((d, i) => `<option value="${i}"${Number(m.weekday) === i ? ' selected' : ''}>${d}요일</option>`).join('')}</select>` : ''}
        <select data-c="marea" data-id="${m.id}" aria-label="${esc(m.name)} 반영 영역">${Object.entries(MED_AREA).map(([k, l]) => `<option value="${k}"${m.area === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <button type="button" class="icon-btn plain" data-a="mdel" data-id="${m.id}" aria-label="${esc(m.name)} 삭제">${I.trash}</button></div>`).join('')}
      <div class="row"><input type="text" id="mname" placeholder="직접 입력 (예: 아연)" style="flex:1 1 auto" aria-label="약·영양제 이름"><button type="button" class="chip" data-a="madd">추가</button></div>
      <p class="small">앱은 복용 체크만 해요. 복용량·시간 변경은 처방한 의사나 약사와 상의하세요.</p>
    </section>
    <section class="card"><h3>관리 목표 (여러 개 선택)</h3><div class="wrap">${chips('goal', GOALS, p.goals)}</div></section>
    <p class="small" style="text-align:center">모든 정보는 이 기기에만 저장돼요</p>
  </div>
  <div class="bar-bottom"><button type="button" class="btn" data-a="setupdone">${first ? '맞춤 제안 보기' : '저장하고 닫기'}</button></div>`;
}

/* ---------- 화면: 맞춤 제안 ---------- */
function suggestions() {
  const p = S.profile, out = [];
  const outdoor = ['영업·외근', '현장·생산'].includes(p.job);
  if (outdoor) out.push({ id: 'lunchsun', tag: '루틴 항목 추가', title: '점심 선크림 덧바르기', body: '체크리스트에 ‘점심 선크림’을 추가해요. 점심에 한 번 체크하면 돼요.', why: `${p.job} · 바깥에 있는 시간이 길어요`, item: { id: 'lunchsun', label: '점심 선크림', area: 'skin' } });
  if (p.skin === '지성') out.push({ id: 'oil', tag: '루틴 항목 추가', title: '유분 정리', body: '세안 후나 점심에 유분을 한 번 정리하는 항목을 추가해요.', why: '지성 피부', item: { id: 'oil', label: '유분 정리', area: 'skin' } });
  if (p.skin === '건성' || p.skin === '복합성') out.push({ id: 'moist', tag: '루틴 항목 추가', title: '보습제 바르기', body: '세안 후 보습 항목을 추가해요.', why: `${p.skin} 피부`, item: { id: 'moist', label: '보습', area: 'skin' } });
  const us = p.usualSleep, goal = us < 7 ? Math.min(7, us + 0.5) : us;
  out.push({ id: 'sleep', tag: '수면 목표', title: `목표 ${f1(goal)}시간`, body: us < 7 ? '한 번에 늘리기보다 30분씩 올려요. 익숙해지면 설정에서 7시간으로 올려 보세요.' : '지금 수면 시간을 유지하는 걸 목표로 해요.', why: `평소 수면 ${f1(us)}시간`, apply: () => { S.settings.sleepGoal = goal; } });
  const exMap = { '거의 안 함': 60, '주 1–2회': 90, '주 3–4회': 150, '거의 매일': 210 };
  if (p.exFreq) out.push({ id: 'ex', tag: '운동 목표', title: `주 ${exMap[p.exFreq]}분`, body: '지금보다 조금만 늘린 주간 목표예요. 걷기도 운동으로 기록할 수 있어요.', why: `현재 운동 ${p.exFreq}`, apply: () => { S.settings.weeklyExercise = exMap[p.exFreq]; } });
  if (p.leaveTime) {
    const [h, m] = p.leaveTime.split(':').map(Number), tm = (h * 60 + m - 40 + 1440) % 1440, ct = `${pad(Math.floor(tm / 60))}:${pad(tm % 60)}`;
    out.push({ id: 'check', tag: '아침 체크 시간', title: `${ct}에 체크`, body: '집 나서기 40분 전을 오늘 화면에 권장 체크 시간으로 보여 줘요.', why: `평소 ${p.leaveTime}에 집을 나섬`, apply: () => { S.settings.checkTime = ct; } });
  }
  if (S.meds.length) {
    const daily = S.meds.filter((x) => x.when !== 'weekly').length, wk = S.meds.length - daily;
    out.push({ id: 'meds', tag: '복용 체크', title: '오늘 화면에서 함께 체크', body: `매일 먹는 ${daily}개는 날마다, 주 1회 ${wk}개는 정한 요일에만 오늘 화면에 나타나요.`, why: `등록한 약·영양제 ${S.meds.length}개`, info: true });
  }
  const lc = lastCut(today());
  if (lc) out.push({ id: 'cut', tag: '헤어컷 주기', title: `다음 추천일 ${fmtMD(addDays(lc, S.settings.haircutWeeks * 7))}`, body: '오늘 화면에 남은 날짜를 보여 주고, 다녀온 날 한 번 누르면 주기가 다시 시작돼요.', why: `마지막 방문 ${fmtMD(lc)} · ${S.settings.haircutWeeks}주 주기`, info: true });
  return out;
}
function scrSuggest() {
  const list = suggestions(), on = list.filter((s) => !s.info && !V.sugOff[s.id]).length;
  const p = S.profile;
  return `<div class="scroll">
    <header style="display:flex;flex-direction:column;gap:8px">
      <div class="row" style="margin-left:-10px;gap:2px"><a class="icon-btn plain" href="#setup" aria-label="설정으로">${I.left}</a><span class="small">입력한 정보 기반</span></div>
      <h1>이렇게 시작해 볼까요?</h1>
      <div class="wrap">${[p.age, p.job, p.skin && p.skin + ' 피부', `평소 수면 ${f1(p.usualSleep)}시간`, S.meds.length && `약·영양제 ${S.meds.length}개`].filter(Boolean).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
    </header>
    ${list.map((s) => {
      const isOn = !s.info && !V.sugOff[s.id];
      return `<section class="card" style="${isOn ? 'border-color:var(--ok-line)' : ''}">
        <div class="between" style="align-items:flex-start"><div style="display:flex;flex-direction:column;gap:4px"><span class="small acc" style="font-weight:700">${s.tag}</span><h2 style="font-size:17px">${esc(s.title)}</h2></div>
        ${s.info ? '' : `<button type="button" class="toggle${isOn ? ' on' : ''}" data-a="sugt" data-id="${s.id}" aria-pressed="${isOn}" aria-label="${esc(s.title)} 적용"><i></i></button>`}</div>
        <p style="font-size:14px;color:var(--soft)">${esc(s.body)}</p><span class="small">이유 · ${esc(s.why)}</span></section>`;
    }).join('')}
  </div>
  <div class="bar-bottom"><button type="button" class="btn" data-a="sugapply">${on ? `${on}개 적용하고 시작하기` : '시작하기'}</button>
    <span class="small" style="text-align:center">다음 단계: 변화 탭에서 D+0 기준 사진 찍기</span></div>`;
}

/* ---------- 화면: 설정 ---------- */
function scrSettings() {
  const g = S.settings;
  return `<div class="scroll">
    <header class="head"><h1>설정</h1></header>
    <section class="card"><h2>프로필 · 맞춤 설정</h2>
      <p class="small">연령대, 직종, 수면, 피부, 헤어컷 주기, 향수, 약·영양제</p>
      <a class="btn ghost" href="#setup">프로필 수정</a><a class="btn ghost" href="#suggest">맞춤 제안 다시 보기</a></section>
    <section class="card"><h2>시작일 · 목표</h2>
      <label class="inline">시작일 (D+0)<input type="date" data-c="start" value="${S.profile.startDate}" max="${today()}"></label>
      <div class="between"><span style="font-weight:500">수면 목표</span><div class="row">
        <button type="button" class="icon-btn" data-a="sgoal" data-v="-0.5" aria-label="줄이기">−</button><span class="num" style="min-width:56px;text-align:center">${f1(g.sleepGoal)}시간</span>
        <button type="button" class="icon-btn" data-a="sgoal" data-v="0.5" aria-label="늘리기">+</button></div></div>
      <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:500">주간 운동 목표</span>
        <div class="wrap">${[60, 90, 150, 210, 300].map((v) => `<button type="button" class="chip${g.weeklyExercise === v ? ' on' : ''}" data-a="exgoal" data-v="${v}">${v}분</button>`).join('')}</div></div>
    </section>
    <section class="card"><h2>루틴 항목</h2><p class="small">항목마다 밸런스 영역을 고르면 그 영역 점수에 반영돼요.</p>
      ${S.items.map((i, idx) => `<div class="list-row">
        <input type="text" class="grow" data-c="ilabel" data-id="${i.id}" value="${esc(i.label)}" aria-label="항목 이름" style="border:0;background:transparent;padding:0">
        <select data-c="iarea" data-id="${i.id}" aria-label="${esc(i.label)} 영역">${AREA_KEYS.map((k) => `<option value="${k}"${i.area === k ? ' selected' : ''}>${AREAS[k]}</option>`).join('')}</select>
        <button type="button" class="icon-btn plain" data-a="iup" data-id="${i.id}" aria-label="${esc(i.label)} 위로" ${idx ? '' : 'disabled style="opacity:.3"'}>↑</button>
        <button type="button" class="icon-btn plain" data-a="idel" data-id="${i.id}" aria-label="${esc(i.label)} 삭제">${I.trash}</button></div>`).join('')}
      <div class="row"><input type="text" id="newitem" placeholder="새 항목 (예: 보습)" style="flex:1 1 auto" aria-label="새 항목 이름">
        <select id="newarea" aria-label="새 항목 영역">${AREA_KEYS.map((k) => `<option value="${k}">${AREAS[k]}</option>`).join('')}</select>
        <button type="button" class="chip" data-a="iadd">추가</button></div>
    </section>
    <section class="card"><h2>백업 · 복원</h2>
      <p class="small">기록과 사진은 이 아이폰에만 있어요. 앱을 지우거나 Safari 데이터를 지우면 함께 사라지니, 가끔 백업 파일을 저장해 두세요.</p>
      <button type="button" class="btn ghost" data-a="export">백업 파일 저장</button>
      <label class="btn ghost" style="position:relative">백업에서 복원<input type="file" accept="application/json,.json" data-c="import" style="position:absolute;width:1px;height:1px;opacity:0"></label>
    </section>
    <section class="card"><h2>초기화</h2>
      <button type="button" class="btn danger" data-a="reset">${V.resetArm ? '한 번 더 누르면 모든 기록과 사진이 지워져요' : '모든 기록 지우기'}</button></section>
    <p class="small" style="text-align:center">관리하는 남자 · 개인용 v1</p>
  </div>${navHTML('settings')}`;
}

const SCREENS = { today: scrToday, history: scrHistory, balance: scrBalance, changes: scrChanges, compare: scrCompare, setup: scrSetup, suggest: scrSuggest, settings: scrSettings };

/* ---------- 동작 ---------- */
const commit = (msg) => { save(); render(); if (msg) toast(msg); };
const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const A = {
  item: (el) => { const r = dayRec(V.date); r.done[el.dataset.id] = !r.done[el.dataset.id]; commit(); },
  min: (el) => { const r = dayRec(V.date), v = Number(el.dataset.v); r.minutes = r.minutes === v ? null : v; commit(); },
  sleep: (el) => { const r = dayRec(V.date); r.sleep = clamp((r.sleep ?? S.profile.usualSleep) + Number(el.dataset.v) * (r.sleep == null ? 0 : 1), 0, 16); r.bed = ''; r.wake = ''; commit(); },
  mood: (el) => { const r = dayRec(V.date), v = Number(el.dataset.v); r.mood = r.mood === v ? null : v; commit(); },
  wtype: (el) => { const r = dayRec(V.date); r.workout.type = r.workout.type === el.dataset.v ? null : el.dataset.v; if (r.workout.type === '쉼') r.workout.min = null; commit(); },
  med: (el) => { const r = dayRec(V.date); r.meds[el.dataset.id] = !r.meds[el.dataset.id]; commit(); },
  perfume: () => { const r = dayRec(V.date); r.perfume = !r.perfume; commit(); },
  perfumeToday: () => { const r = dayRec(today()); r.perfume = !r.perfume; commit(); },
  cutday: () => { const d = V.date; S.haircuts = S.haircuts.includes(d) ? S.haircuts.filter((x) => x !== d) : [...S.haircuts, d].sort(); commit(S.haircuts.includes(d) ? '미용실 방문을 기록했어요' : ''); },
  dayshift: (el) => { const n = addDays(V.date, Number(el.dataset.v)); if (n <= today()) { V.date = n; render(true); } },
  totoday: () => { V.date = today(); render(true); },
  month: (el) => { const [y, m] = V.month.split('-').map(Number); const d = new Date(y, m - 1 + Number(el.dataset.v), 1); V.month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); },
  hsel: (el) => { V.histSel = el.dataset.v; render(); },
  editday: (el) => { V.date = el.dataset.v; go('today'); },
  bsel: (el) => { V.balSel = el.dataset.id; render(); },
  togglebase: () => { V.showBase = V.showBase === false; render(); },
  msel: (el) => { V.mileSel = Number(el.dataset.v); render(); },
  delphoto: async (el) => { const k = Number(el.dataset.v); try { await photos.del(k); } catch (e) { /* 없음 */ } if (urls[k]) { URL.revokeObjectURL(urls[k]); delete urls[k]; } delete (S.milestones[k] || {}).photo; commit('사진을 지웠어요'); },
  pair: (el) => { V.cmpPair = el.dataset.v.split('-').map(Number); render(); },
  cmode: (el) => { V.cmpMode = el.dataset.v; render(); },
  pf: (el) => { const k = el.dataset.k; S.profile[k] = S.profile[k] === el.dataset.v ? null : el.dataset.v; commit(); },
  usleep: (el) => { S.profile.usualSleep = clamp(S.profile.usualSleep + Number(el.dataset.v), 3, 12); commit(); },
  cutw: (el) => { S.settings.haircutWeeks = Number(el.dataset.v); commit(); },
  goal: (el) => { S.profile.goals = toggleIn(S.profile.goals, el.dataset.v); commit(); },
  pfam: (el) => { V.pDraft.fam = toggleIn(V.pDraft.fam, el.dataset.v); render(); },
  pscene: (el) => { V.pDraft.scene = toggleIn(V.pDraft.scene, el.dataset.v); render(); },
  padd: () => {
    const nm = (app.querySelector('[data-c=pname]').value || '').trim();
    if (!nm) { toast('향수 이름을 입력해 주세요'); return; }
    S.perfumes.push({ id: uid(), name: nm, fam: V.pDraft.fam, scene: V.pDraft.scene, main: !S.perfumes.length });
    V.pDraft = { name: '', fam: [], scene: [] }; commit('향수를 추가했어요');
  },
  pmain: (el) => { S.perfumes.forEach((x) => { x.main = x.id === el.dataset.id; }); commit(); },
  pdel: (el) => { S.perfumes = S.perfumes.filter((x) => x.id !== el.dataset.id); if (S.perfumes.length && !S.perfumes.some((x) => x.main)) S.perfumes[0].main = true; commit(); },
  mpreset: (el) => {
    const nm = el.dataset.v, ex = S.meds.find((m) => m.name === nm);
    if (ex) S.meds = S.meds.filter((m) => m !== ex);
    else { const [when, area] = MED_PRESETS[nm]; S.meds.push({ id: uid(), name: nm, when, weekday: 4, area }); }
    commit();
  },
  madd: () => {
    const inp = document.getElementById('mname'), nm = (inp.value || '').trim(); if (!nm) return;
    const area = /탈모|두피|모발/.test(nm) ? 'hair' : /비만|다이어트|체중/.test(nm) ? 'body' : 'other';
    S.meds.push({ id: uid(), name: nm, when: 'morning', weekday: 4, area }); commit();
  },
  mdel: (el) => { S.meds = S.meds.filter((m) => m.id !== el.dataset.id); commit(); },
  skip: () => { S.profile.onboarded = true; save(); go('today'); },
  setupdone: () => { const first = !S.profile.onboarded; save(); go(first ? 'suggest' : 'settings'); },
  sugt: (el) => { V.sugOff[el.dataset.id] = !V.sugOff[el.dataset.id]; render(); },
  sugapply: () => {
    for (const s of suggestions()) {
      if (s.info || V.sugOff[s.id]) { if (s.item) S.items = S.items.filter((i) => i.id !== s.item.id); continue; }
      if (s.item && !S.items.some((i) => i.id === s.item.id)) S.items.push({ ...s.item });
      if (s.apply) s.apply();
    }
    S.profile.onboarded = true; save(); go('today'); toast('맞춤 설정을 적용했어요');
  },
  sgoal: (el) => { S.settings.sleepGoal = clamp(S.settings.sleepGoal + Number(el.dataset.v), 4.5, 10); commit(); },
  exgoal: (el) => { S.settings.weeklyExercise = Number(el.dataset.v); commit(); },
  iadd: () => {
    const nm = (document.getElementById('newitem').value || '').trim(); if (!nm) { toast('항목 이름을 입력해 주세요'); return; }
    S.items.push({ id: uid(), label: nm, area: document.getElementById('newarea').value }); commit('항목을 추가했어요');
  },
  idel: (el) => { S.items = S.items.filter((i) => i.id !== el.dataset.id); commit(); },
  iup: (el) => { const i = S.items.findIndex((x) => x.id === el.dataset.id); if (i > 0) { [S.items[i - 1], S.items[i]] = [S.items[i], S.items[i - 1]]; commit(); } },
  export: async () => {
    const ph = {};
    for (const k of Object.keys(urls)) { const b = await photos.get(Number(k)); if (b) ph[k] = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); }
    const blob = new Blob([JSON.stringify({ app: 'gwanri-namja', exportedAt: new Date().toISOString(), state: S, photos: ph })], { type: 'application/json' });
    const name = `관리하는남자-백업-${today()}.json`, file = new File([blob], name, { type: 'application/json' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('백업 파일을 만들었어요');
  },
  reset: async () => {
    if (!V.resetArm) { V.resetArm = true; render(); setTimeout(() => { V.resetArm = false; if (V.screen === 'settings') render(); }, 5000); return; }
    V.resetArm = false; S = fresh(); save(); try { await photos.clear(); } catch (e) { /* 없음 */ } await loadPhotos(); go('setup');
  }
};
const C = {
  min: (el) => { const r = dayRec(V.date), v = el.value === '' ? null : clamp(Math.round(Number(el.value)), 0, 600); r.minutes = v; commit(); },
  bed: (el) => { const r = dayRec(V.date); r.bed = el.value; calcSleep(r); commit(); },
  wake: (el) => { const r = dayRec(V.date); r.wake = el.value; calcSleep(r); commit(); },
  wmin: (el) => { const r = dayRec(V.date); r.workout.min = el.value === '' ? null : clamp(Math.round(Number(el.value)), 0, 600); if (r.workout.min && !r.workout.type) r.workout.type = '기타'; commit(); },
  wmemo: (el) => { const r = dayRec(V.date); r.workout.memo = el.value.slice(0, 120); save(); },
  pf: (el) => { S.profile[el.dataset.k] = el.value; save(); },
  pname: (el) => { V.pDraft.name = el.value; },
  lastcut: (el) => { const v = el.value; if (!v) return; if (!S.haircuts.includes(v)) S.haircuts = [...S.haircuts, v].sort(); commit(); },
  mwhen: (el) => { const m = S.meds.find((x) => x.id === el.dataset.id); m.when = el.value; commit(); },
  mday: (el) => { const m = S.meds.find((x) => x.id === el.dataset.id); m.weekday = Number(el.value); commit(); },
  marea: (el) => { const m = S.meds.find((x) => x.id === el.dataset.id); m.area = el.value; commit(); },
  start: (el) => { if (el.value) { S.profile.startDate = el.value; V.mileSel = null; commit('시작일을 바꿨어요'); } },
  ilabel: (el) => { const i = S.items.find((x) => x.id === el.dataset.id); const v = el.value.trim(); if (v) { i.label = v.slice(0, 20); save(); } },
  iarea: (el) => { const i = S.items.find((x) => x.id === el.dataset.id); i.area = el.value; commit(); },
  mmemo: (el) => { const k = el.dataset.v; S.milestones[k] = { ...(S.milestones[k] || {}), memo: el.value.slice(0, 300) }; save(); },
  photo: async (el) => {
    const f = el.files && el.files[0], k = Number(el.dataset.v); if (!f) return;
    toast('사진 저장 중…');
    try {
      const blob = await shrink(f); await photos.put(k, blob);
      if (urls[k]) URL.revokeObjectURL(urls[k]); urls[k] = URL.createObjectURL(blob);
      S.milestones[k] = { ...(S.milestones[k] || {}), photo: true, date: today() }; commit('사진을 저장했어요');
    } catch (e) { toast('사진을 저장하지 못했어요'); }
  },
  cmp: (el) => {
    V.cmpPos = Number(el.value);
    const box = document.getElementById('cmp'); if (!box) return;
    box.querySelector('.after').style.clipPath = `inset(0 ${100 - V.cmpPos}% 0 0)`; box.querySelector('.line').style.left = V.cmpPos + '%';
  },
  import: async (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || data.app !== 'gwanri-namja' || !data.state) throw new Error('형식');
      S = { ...fresh(), ...data.state }; save();
      await photos.clear();
      for (const [k, du] of Object.entries(data.photos || {})) { const b = await (await fetch(du)).blob(); await photos.put(Number(k), b); }
      await loadPhotos(); V.mileSel = null; go('today'); toast('백업에서 복원했어요');
    } catch (e) { toast('이 파일은 복원할 수 없어요'); }
  }
};
function calcSleep(r) {
  if (!r.bed || !r.wake) return;
  const [bh, bm] = r.bed.split(':').map(Number), [wh, wm] = r.wake.split(':').map(Number);
  const mins = ((wh * 60 + wm) - (bh * 60 + bm) + 1440) % 1440;
  r.sleep = Math.round(mins / 30) / 2;
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el); }
});
app.addEventListener('change', (e) => { const el = e.target.closest('[data-c]'); if (el && C[el.dataset.c] && el.dataset.c !== 'cmp') C[el.dataset.c](el); });
app.addEventListener('input', (e) => { const el = e.target.closest('[data-c]'); if (!el) return; if (el.dataset.c === 'cmp') C.cmp(el); if (el.dataset.c === 'pname') C.pname(el); });
window.addEventListener('hashchange', route);

// 날짜가 바뀐 뒤 앱을 다시 열면 오늘로 맞춥니다.
let lastDay = today();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && today() !== lastDay) { if (V.date === lastDay) V.date = today(); lastDay = today(); V.histSel = today(); render(); }
});

(async () => {
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* 지원 안 함 */ }
  await loadPhotos();
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
