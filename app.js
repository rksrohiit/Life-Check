// app.js — logic for Life-Check AI prototype

// helpers
const el = id => document.getElementById(id);
const now = ()=> new Date().toLocaleString();
function toast(msg, timeout=2500){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(()=> t.remove(), timeout);
}
function safeLog(...args){ try{ console.log(...args); } catch(e){} }

// Tabs wiring
document.querySelectorAll('.navitem').forEach(n=>{
  n.addEventListener('click', ()=>{
    switchTab(n.dataset.tab);
  });
});
function switchTab(tab){
  document.querySelectorAll('.content').forEach(s=>s.style.display='none');
  document.querySelectorAll('.navitem').forEach(n=>n.classList.remove('active'));
  const nav = document.querySelector(`[data-tab="${tab}"]`);
  if(nav) nav.classList.add('active');
  const section = document.getElementById(tab);
  if(section) section.style.display = 'block';
  if(window.innerWidth <= 700) {
    document.getElementById('mobileNav').style.display = 'flex';
    document.querySelectorAll('.mobile-btn').forEach(b=>b.classList.remove('active'));
    const mb = document.querySelector(`.mobile-btn[data-tab="${tab}"]`);
    if(mb) mb.classList.add('active');
  }
}
switchTab('dashboard');
if(window.innerWidth <= 700) document.getElementById('mobileNav').style.display = 'flex';

// Elements
const oneTouchBtn = el('oneTouch');
const syncBtn = el('syncBtn');
const historyList = el('historyList');
const ordersList = el('ordersList');
const modalBack = el('modalBack');
const modalTitle = el('modalTitle');
const modalWave = el('modalWave');
const modalValue = el('modalValue');
const modalConf = el('modalConf');
const liveWave = el('liveWave');
const liveValue = el('liveValue');
const liveStatus = el('liveStatus');
const liveConf = el('liveConf');
const saveMeasureBtn = el('saveMeasureBtn');
const cancelMeasureBtn = el('cancelMeasureBtn');

oneTouchBtn.addEventListener('click', async ()=> {
  try {
    await simulateFullCheck();
    toast('Full check complete.');
  } catch(e){
    safeLog('Full check error', e);
    toast('Full check interrupted.');
  }
});
syncBtn.addEventListener('click', ()=> {
  el('lastSync').textContent = now();
  toast('Data synced (simulated).');
});

// Measure buttons
document.querySelectorAll('[data-sensor]').forEach(b=>{
  b.addEventListener('click', ()=>{
    startMeasure(b.getAttribute('data-sensor')).catch(e=>safeLog(e));
  });
});

// Modal controls
if(cancelMeasureBtn) cancelMeasureBtn.addEventListener('click', ()=>{
  cancelMeasure();
  toast('Measurement cancelled.');
});
if(saveMeasureBtn) saveMeasureBtn.addEventListener('click', ()=>{
  if(typeof window.__currentMeasureResolve === 'function'){
    window.__currentMeasureResolve({ action: 'save' });
  }
});

// measurement logic
let measureInterval = null;
let currentSensor = null;

function startMeasure(sensor){
  return new Promise((resolve, reject)=>{
    try {
      currentSensor = sensor;
      if(modalTitle) modalTitle.textContent = `Measuring — ${sensor.toUpperCase()}`;
      if(modalBack) modalBack.style.display = 'flex';
      if(modalWave) modalWave.textContent = 'Recording...';
      if(modalValue) modalValue.textContent = '--';
      if(modalConf) modalConf.textContent = '--';
      if(liveStatus) liveStatus.textContent = 'Measuring...';
      let t=0;
      measureInterval = setInterval(()=>{
        t++;
        if(sensor==='heart'){
          const confVal = 60 + Math.round(Math.random()*30);
          if(modalValue) modalValue.textContent = `${confVal} BPM`;
          if(modalConf) modalConf.textContent = `${Math.floor(70 + Math.random()*25)}%`;
          if(liveWave) liveWave.textContent = '♥ ♥ ♥  (simulated waveform)';
          if(liveValue) liveValue.textContent = `${confVal} BPM`;
          if(liveConf) liveConf.textContent = modalConf.textContent;
        } else if(sensor==='bp'){
          const sys = 110 + Math.round(Math.random()*30);
          const dia = 70 + Math.round(Math.random()*15);
          if(modalValue) modalValue.textContent = `${sys} / ${dia} mmHg`;
          if(modalConf) modalConf.textContent = `${Math.floor(70 + Math.random()*20)}%`;
          if(liveWave) liveWave.textContent = '⎈ Pressure trace (simulated)';
          if(liveValue) liveValue.textContent = `${sys} / ${dia} mmHg`;
          if(liveConf) liveConf.textContent = modalConf.textContent;
        } else if(sensor==='spo2'){
          const spo2 = 94 + Math.round(Math.random()*4);
          if(modalValue) modalValue.textContent = `${spo2} %`;
          if(modalConf) modalConf.textContent = `${Math.floor(80 + Math.random()*15)}%`;
          if(liveWave) liveWave.textContent = '• • • PPG (simulated)';
          if(liveValue) liveValue.textContent = `${spo2} %`;
          if(liveConf) liveConf.textContent = modalConf.textContent;
        } else if(sensor==='temp'){
          const temp = (36 + Math.random()*1.6).toFixed(1);
          if(modalValue) modalValue.textContent = `${temp} °C`;
          if(modalConf) modalConf.textContent = `${Math.floor(85 + Math.random()*10)}%`;
          if(liveWave) liveWave.textContent = '🌡️ IR scan (simulated)';
          if(liveValue) liveValue.textContent = `${temp} °C`;
          if(liveConf) liveConf.textContent = modalConf.textContent;
        }
        if(t>10){
          if(typeof window.__currentMeasureResolve === 'function'){
            window.__currentMeasureResolve({ action: 'auto' });
          }
        }
      },700);

      window.__currentMeasureResolve = (result)=>{
        try {
          clearInterval(measureInterval);
          measureInterval = null;
          if(modalBack) modalBack.style.display = 'none';
          if(liveStatus) liveStatus.textContent = 'Idle';
          const r = performSave(sensor);
          window.__currentMeasureResolve = null;
          resolve({ saved: true, via: result.action, reading: r });
        } catch(e){
          window.__currentMeasureResolve = null;
          reject(e);
        }
      };
    } catch(err){
      reject(err);
    }
  });
}

function cancelMeasure(){
  try {
    if(measureInterval) clearInterval(measureInterval);
    measureInterval = null;
    if(modalBack) modalBack.style.display = 'none';
    if(liveStatus) liveStatus.textContent = 'Idle';
    if(typeof window.__currentMeasureResolve === 'function'){
      window.__currentMeasureResolve({ action: 'cancel' });
      window.__currentMeasureResolve = null;
    }
    currentSensor = null;
  } catch(e){ safeLog(e); }
}

function performSave(sensor){
  const reading = { ts: new Date().toISOString() };
  const valueText = (modalValue && modalValue.textContent) ? modalValue.textContent.trim() : '';
  const confText = (modalConf && modalConf.textContent) ? modalConf.textContent.trim() : '';
  const confNum = parseInt(confText.replace('%','').trim()) || 0;

  if(sensor === 'heart'){
    const bpmMatch = valueText.match(/(\d+)/);
    const bpm = bpmMatch ? parseInt(bpmMatch[1]) : null;
    reading.heart = { bpm: bpm, label: 'Normal', confidence: confNum };
    if(el('heartVal')) el('heartVal').textContent = reading.heart.label;
    if(el('heartNote')) el('heartNote').textContent = `Confidence — ${reading.heart.confidence}%`;
  } else if(sensor === 'bp'){
    const parts = valueText.split('/');
    let sys = null, dia = null;
    if(parts.length >= 2){
      sys = parseInt(parts[0].replace(/\D/g,'').trim()) || null;
      dia = parseInt(parts[1].replace(/\D/g,'').trim()) || null;
    }
    reading.bp = { sys: sys, dia: dia, pulse: 72 };
    if(sys && dia){
      if(el('bpVal')) el('bpVal').textContent = `${sys} / ${dia} mmHg`;
      if(el('bpNote')) el('bpNote').textContent = `Measured at ${new Date().toLocaleTimeString()}`;
    }
  } else if(sensor === 'spo2'){
    const spo2Num = parseInt(valueText.replace(/\D/g,'').trim()) || null;
    reading.spo2 = spo2Num;
    if(spo2Num){
      if(el('spo2Val')) el('spo2Val').textContent = `${spo2Num} %`;
      if(el('spo2Note')) el('spo2Note').textContent = `Measured at ${new Date().toLocaleTimeString()}`;
    }
  } else if(sensor === 'temp'){
    const tNum = parseFloat(valueText.replace(/[^\d\.]/g,'').trim()) || null;
    reading.temp = tNum;
    if(tNum){
      if(el('tempVal')) el('tempVal').textContent = `${tNum} °C`;
      if(el('tempNote')) el('tempNote').textContent = `Measured at ${new Date().toLocaleTimeString()}`;
    }
  }

  try {
    const hist = JSON.parse(localStorage.getItem('lc_history') || '[]');
    hist.unshift(reading);
    localStorage.setItem('lc_history', JSON.stringify(hist.slice(0,30)));
    updateHistory();
    if(el('lastSync')) el('lastSync').textContent = now();
    toast('Measurement saved.');
  } catch(e){ safeLog('save error', e); }

  currentSensor = null;
  return reading;
}

async function simulateFullCheck(){
  await startMeasure('heart');
  await startMeasure('bp');
  await startMeasure('spo2');
  await startMeasure('temp');
  return true;
}

function updateHistory(){
  try {
    const hist = JSON.parse(localStorage.getItem('lc_history') || '[]');
    const list = historyList;
    list.innerHTML = '';
    if(!hist || hist.length === 0){
      list.innerHTML = '<div class="history-item">No readings yet</div>';
      return;
    }
    hist.slice(0,8).forEach(r=>{
      const d = document.createElement('div');
      d.className = 'history-item';
      const left = document.createElement('div');
      const title = (() => {
        if(r.bp) return `${r.bp.sys}/${r.bp.dia} mmHg`;
        if(r.spo2) return `SpO₂ ${r.spo2}%`;
        if(r.temp) return `Temp ${r.temp}°C`;
        if(r.heart) return `Heart ${r.heart.bpm || '--'} BPM`;
        return 'Reading';
      })();
      left.innerHTML = `<div style="font-weight:700">${title}</div>
                        <div class="small">${new Date(r.ts).toLocaleString()}</div>`;
      const right = document.createElement('div');
      right.innerHTML = `<button class="btn-small btn-secondary" onclick='viewReading("${r.ts}")'>View</button>`;
      d.appendChild(left); d.appendChild(right);
      list.appendChild(d);
    });
  } catch(e){ safeLog('history render error', e); }
}

function viewReading(ts){
  try {
    const hist = JSON.parse(localStorage.getItem('lc_history') || '[]');
    const r = hist.find(x => x.ts === ts);
    if(!r) { toast('Reading not found'); return; }
    let summary = `Reading at ${new Date(r.ts).toLocaleString()}\n\n`;
    if(r.bp) summary += `BP: ${r.bp.sys}/${r.bp.dia} mmHg\n`;
    if(r.spo2) summary += `SpO₂: ${r.spo2}%\n`;
    if(r.temp) summary += `Temp: ${r.temp} °C\n`;
    if(r.heart) summary += `Heart: ${r.heart.bpm} BPM (${r.heart.label})\n`;
    safeLog(summary);
    toast('Reading details logged to console (for demo).', 3000);
  } catch(e){ safeLog(e); toast('Could not show reading'); }
}

// doctor / pharmacy / orders
function startConsult(name){
  toast(`Connecting to ${name} (simulated)...`);
  setTimeout(()=> toast('Doctor connected (simulated).'), 900);
}
function orderFrom(pharm){
  if(!confirm(`Place order from ${pharm}?`)) return;
  const orders = JSON.parse(localStorage.getItem('lc_orders') || '[]');
  const id = 'ORD' + Math.floor(Math.random()*10000);
  const ord = { id, pharmacy: pharm, status: 'Preparing', ts: new Date().toISOString() };
  orders.unshift(ord);
  localStorage.setItem('lc_orders', JSON.stringify(orders));
  updateOrders();
  toast('Order placed — preparing.');
}
function updateOrders(){
  const orders = JSON.parse(localStorage.getItem('lc_orders') || '[]');
  const list = ordersList;
  list.innerHTML = '';
  if(!orders || orders.length === 0){
    list.innerHTML = `<div class="timeline-item"><div class="dot"></div><div><div style="font-weight:700">No orders yet</div><div class="small">Place an order from Pharmacy tab</div></div></div>`;
    return;
  }
  orders.forEach(o=>{
    const item = document.createElement('div'); item.className='timeline-item';
    item.innerHTML = `<div class="dot"></div><div><div style="font-weight:700">${o.pharmacy} • ${o.id}</div><div class="small">Status: ${o.status} • ${new Date(o.ts).toLocaleString()}</div></div>`;
    list.appendChild(item);
  });
}

function pairDevice(){ if(el('deviceStatus')) el('deviceStatus').textContent = 'Paired • Last seen ' + now(); toast('Device paired (simulated).'); }
function toggleConsent(){ const cur = el('consentText').textContent; el('consentText').textContent = (cur==='Not granted') ? 'Granted' : 'Not granted'; toast('Consent toggled.'); }
function viewProfile(name){ toast(`${name} profile (simulated).`); }

// init
updateHistory();
updateOrders();

// back buttons wiring
['backToDash','backDash2','backDash3','backDash4','backDash5'].forEach(id=>{
  const b = el(id);
  if(b) b.addEventListener('click', ()=> switchTab('dashboard'));
});
if(el('profileBtn')) el('profileBtn').addEventListener('click', ()=> switchTab('profile'));
if(el('openPharm')) el('openPharm').addEventListener('click', ()=> switchTab('pharmacy'));
if(el('consultBtn')) el('consultBtn').addEventListener('click', ()=> switchTab('doctors'));
if(el('exportBtn')) el('exportBtn').addEventListener('click', ()=> toast('Export PDF (simulated).'));

// responsive nav
window.addEventListener('resize', ()=> {
  if(window.innerWidth <= 700) document.getElementById('mobileNav').style.display = 'flex';
  else document.getElementById('mobileNav').style.display = 'none';
});
