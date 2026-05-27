// ===== CONSTANTS =====
const CATS = {
  income:   { label:'Ingresos',   emoji:'💰', color:'#34c77b', bg:'#34c77b22' },
  food:     { label:'Alimentos',  emoji:'🛒', color:'#3ecfb2', bg:'#3ecfb222' },
  medical:  { label:'Médico',     emoji:'💊', color:'#f05c5c', bg:'#f05c5c22' },
  rent:     { label:'Renta',      emoji:'🏠', color:'#5ba3f5', bg:'#5ba3f522' },
  bills:    { label:'Cuentas',    emoji:'📱', color:'#f5a623', bg:'#f5a62322' },
  fun:      { label:'Recreación', emoji:'🎮', color:'#7c6ef7', bg:'#7c6ef722' },
  vacation: { label:'Vacaciones', emoji:'✈️', color:'#e87dd0', bg:'#e87dd022' },
  other:    { label:'Otros',      emoji:'📦', color:'#6b7280', bg:'#6b728022' }
};
const PALETTE = ['#7c6ef7','#34c77b','#f05c5c','#5ba3f5','#f5a623','#e87dd0','#3ecfb2','#ff7043'];

let donutChart = null, trendChart = null;
let currentUser = null, currentData = null;
let currentPeriod = 'month', filterCat = 'all';
let recognition = null, isRecording = false;
let selectedColorIdx = 0;

// ===== SECURITY =====
async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw + '::mf_2026'));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ===== STORAGE =====
const getUsers  = () => { try { return JSON.parse(localStorage.getItem('mf_users')||'[]'); } catch(e){ return []; }};
const saveUsers = u => localStorage.setItem('mf_users', JSON.stringify(u));
const getData   = id => { try { return JSON.parse(localStorage.getItem('mf_d_'+id)||'{"transactions":[]}'); } catch(e){ return {transactions:[]}; }};
const saveData  = (id, d) => localStorage.setItem('mf_d_'+id, JSON.stringify(d));

// ===== UTILS =====
const fmt   = n  => '€' + Math.abs(n).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const today = () => new Date().toISOString().split('T')[0];
const initials = name => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
const greeting = () => { const h=new Date().getHours(); return h<12?'Buenos días':h<18?'Buenas tardes':'Buenas noches'; };

function showToast(msg, dur=2400) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}
function getFiltered(txs) {
  const n = new Date();
  return txs.filter(t => {
    const d = new Date(t.date+'T12:00:00');
    return currentPeriod==='month'
      ? d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth()
      : d.getFullYear()===n.getFullYear();
  });
}
function periodLabel() {
  const n = new Date();
  return currentPeriod==='month'
    ? n.toLocaleDateString('es',{month:'long',year:'numeric'})
    : 'Año '+n.getFullYear();
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.id===id ? s.classList.remove('hidden') : s.classList.add('hidden');
  });
}

// ===== SPLASH =====
window.addEventListener('load', () => {
  setTimeout(() => { showScreen('screen-auth'); renderUserGrid(); setDefaultDate(); }, 1900);
});
function setDefaultDate() {
  const d = document.getElementById('qa-date');
  if(d) d.value = today();
}

// ===== AUTH =====
function renderUserGrid() {
  const users = getUsers();
  const grid = document.getElementById('users-grid');
  showAuthPanel('select');
  grid.innerHTML = users.map((u,i) => {
    const bg = PALETTE[u.ci % PALETTE.length];
    return `<div class="user-card" onclick="selectUser(${i})">
      <div class="user-avatar" style="background:${bg}25;color:${bg}">${initials(u.name)}</div>
      <div class="user-name">${escHTML(u.name)}</div>
      <div class="user-last">Toca para entrar</div>
    </div>`;
  }).join('') + `<div class="user-card user-card-add" onclick="showRegister()">
    <div class="add-icon">＋</div>
    <div class="user-name" style="color:var(--text3)">Nueva cuenta</div>
    <div class="user-last">Crear perfil</div>
  </div>`;
  buildColorPicker();
}

function escHTML(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function showAuthPanel(which) {
  document.getElementById('panel-select').style.display  = which==='select'  ? '' : 'none';
  document.getElementById('panel-login').style.display   = which==='login'   ? '' : 'none';
  document.getElementById('panel-register').style.display= which==='register'? '' : 'none';
}

function buildColorPicker() {
  const cp = document.getElementById('color-picker');
  if(!cp) return;
  cp.innerHTML = PALETTE.map((c,i)=>`<div class="color-dot${i===0?' sel':''}" style="background:${c}" onclick="selectColor(${i})"></div>`).join('');
}
function selectColor(i) {
  selectedColorIdx = i;
  document.querySelectorAll('.color-dot').forEach((d,idx) => d.classList.toggle('sel', idx===i));
}

function selectUser(i) {
  const u = getUsers()[i];
  showAuthPanel('login');
  document.getElementById('login-uname').textContent = escHTML(u.name);
  const bg = PALETTE[u.ci % PALETTE.length];
  const av = document.getElementById('login-av');
  av.textContent = initials(u.name);
  av.style.background = bg+'30'; av.style.color = bg;
  document.getElementById('login-pw').value = '';
  document.getElementById('login-err').textContent = '';
  document.getElementById('panel-login').dataset.idx = i;
  setTimeout(() => document.getElementById('login-pw').focus(), 300);
}

async function doLogin() {
  const i = parseInt(document.getElementById('panel-login').dataset.idx);
  const users = getUsers();
  const u = users[i];
  const pw = document.getElementById('login-pw').value;
  if(!pw) { document.getElementById('login-err').textContent='Ingresa tu contraseña'; return; }
  const hash = await hashPw(pw);
  if(hash !== u.pwHash) {
    document.getElementById('login-err').textContent='Contraseña incorrecta ✕';
    document.getElementById('login-pw').value='';
    return;
  }
  currentUser = u; currentData = getData(u.id);
  enterApp();
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const pw   = document.getElementById('reg-pw').value;
  const pw2  = document.getElementById('reg-pw2').value;
  const err  = document.getElementById('reg-err');
  if(!name)        { err.textContent='Ingresa tu nombre'; return; }
  if(pw.length<6)  { err.textContent='Mínimo 6 caracteres'; return; }
  if(pw!==pw2)     { err.textContent='Las contraseñas no coinciden'; return; }
  const users = getUsers();
  if(users.find(u=>u.name.toLowerCase()===name.toLowerCase())) { err.textContent='Nombre ya en uso'; return; }
  err.textContent='';
  const pwHash = await hashPw(pw);
  const nu = { id:'u'+Date.now(), name, pwHash, ci: selectedColorIdx };
  users.push(nu); saveUsers(users);
  currentUser = nu; currentData = { transactions:[] };
  saveData(nu.id, currentData);
  enterApp();
}

function checkPwStrength(pw) {
  const bar=document.getElementById('pw-strength-bar'), hint=document.getElementById('pw-hint');
  bar.className='pw-bar';
  if(!pw) { hint.textContent='Crea una contraseña segura'; return; }
  if(pw.length<6)  { bar.classList.add('w'); hint.textContent='Muy corta'; return; }
  if(/[A-Z]/.test(pw)&&/[0-9]/.test(pw)&&pw.length>=8) { bar.classList.add('s'); hint.textContent='Contraseña fuerte ✓'; }
  else { bar.classList.add('m'); hint.textContent='Aceptable (agrega mayúsculas y números)'; }
}

// ===== ENTER APP =====
function enterApp() {
  showScreen('screen-app');
  setDefaultDate();
  const bg = PALETTE[currentUser.ci % PALETTE.length];
  ['header-av','nav-profile-ico'].forEach(id => {
    const el=document.getElementById(id);
    if(!el) return;
    el.textContent=initials(currentUser.name);
    el.style.background=bg+'25'; el.style.color=bg;
  });
  document.getElementById('hdr-greeting').textContent = greeting();
  document.getElementById('hdr-name').textContent = currentUser.name;
  document.getElementById('profile-av-lg').textContent = initials(currentUser.name);
  document.getElementById('profile-av-lg').style.background = bg+'25';
  document.getElementById('profile-av-lg').style.color = bg;
  document.getElementById('profile-nm').textContent = currentUser.name;
  switchTab('home');
}

// ===== PERIOD =====
function cyclePeriod() {
  currentPeriod = currentPeriod==='month' ? 'year' : 'month';
  renderAll();
}

// ===== ADD TX =====
function addTx() {
  const desc = document.getElementById('qa-desc').value.trim();
  const amt  = parseFloat(document.getElementById('qa-amt').value);
  const cat  = document.getElementById('qa-cat').value;
  const date = document.getElementById('qa-date').value;
  if(!desc || !amt || amt<=0 || !date) { showToast('⚠️ Completa todos los campos'); return; }
  currentData.transactions.unshift({id:Date.now(), desc, amount:amt, cat, date});
  saveData(currentUser.id, currentData);
  document.getElementById('qa-desc').value='';
  document.getElementById('qa-amt').value='';
  showToast('✓ Agregado');
  renderAll();
}

function deleteTx(id) {
  if(!confirm('¿Eliminar este movimiento?')) return;
  currentData.transactions = currentData.transactions.filter(t=>t.id!==id);
  saveData(currentUser.id, currentData);
  renderAll();
  showToast('🗑 Eliminado');
}

// ===== RENDER =====
function renderAll() { renderHero(); renderCats(); renderRecent(); renderAllTx(); renderAnalytics(); renderProfile(); }

function renderHero() {
  const txs=getFiltered(currentData.transactions);
  const income=txs.filter(t=>t.cat==='income').reduce((s,t)=>s+t.amount,0);
  const exp   =txs.filter(t=>t.cat!=='income').reduce((s,t)=>s+t.amount,0);
  const bal   =income-exp;
  document.getElementById('hero-period-lbl').innerHTML =
    '📅 '+periodLabel()+' · <span onclick="cyclePeriod()">cambiar ›</span>';
  const bEl=document.getElementById('hero-balance');
  bEl.innerHTML=`<em>€</em><span class="${bal>=0?'pos':'neg'}">${Math.abs(bal).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
  document.getElementById('hero-income').textContent=fmt(income);
  document.getElementById('hero-exp').textContent=fmt(exp);
}

function renderCats() {
  const txs=getFiltered(currentData.transactions);
  const row=document.getElementById('cats-row');
  const keys=Object.keys(CATS).filter(k=>k!=='income');
  row.innerHTML=keys.map(k=>{
    const c=CATS[k];
    const amt=txs.filter(t=>t.cat===k).reduce((s,t)=>s+t.amount,0);
    if(!amt) return '';
    return `<div class="cat-chip" style="background:${c.bg};border-color:${c.color}35">
      <div class="cat-chip-ico">${c.emoji}</div>
      <div class="cat-chip-name" style="color:${c.color}99">${c.label}</div>
      <div class="cat-chip-amt" style="color:${c.color}">${fmt(amt)}</div>
    </div>`;
  }).join('');
}

function txHTML(t) {
  const c=CATS[t.cat]||CATS.other;
  const isInc=t.cat==='income';
  const d=new Date(t.date+'T12:00:00');
  const ds=d.toLocaleDateString('es',{day:'numeric',month:'short'});
  return `<div class="tx-item">
    <div class="tx-ico" style="background:${c.bg}">${c.emoji}</div>
    <div class="tx-info">
      <div class="tx-name">${escHTML(t.desc)}</div>
      <div class="tx-meta">${c.label} · ${ds}</div>
    </div>
    <span class="tx-amt ${isInc?'inc':''}">${isInc?'+':'-'}${fmt(t.amount)}</span>
    <span class="tx-del" onclick="deleteTx(${t.id})">✕</span>
  </div>`;
}

function renderRecent() {
  const txs=getFiltered(currentData.transactions).slice(0,6);
  const el=document.getElementById('recent-list');
  el.innerHTML=txs.length
    ? txs.map(txHTML).join('')
    : '<div class="empty"><div class="empty-ico">💸</div><div>Sin movimientos este período</div></div>';
}

function renderAllTx() {
  const base=getFiltered(currentData.transactions);
  const txs=base.filter(t=>filterCat==='all'||t.cat===filterCat);
  document.getElementById('all-list').innerHTML=txs.length
    ? txs.map(txHTML).join('')
    : '<div class="empty"><div class="empty-ico">💸</div><div>Sin movimientos</div></div>';
  const counts={};
  base.forEach(t=>{ counts[t.cat]=(counts[t.cat]||0)+1; });
  document.getElementById('filter-row').innerHTML =
    `<div class="fpill${filterCat==='all'?' active':''}" onclick="setFilter('all')">Todos (${base.length})</div>`
    +Object.keys(CATS).filter(k=>counts[k]).map(k=>
      `<div class="fpill${filterCat===k?' active':''}" onclick="setFilter('${k}')"
        style="${filterCat===k?'background:'+CATS[k].color+';border-color:'+CATS[k].color:''}">
        ${CATS[k].emoji} ${CATS[k].label}</div>`
    ).join('');
}

function setFilter(cat) { filterCat=cat; renderAllTx(); }

function renderAnalytics() {
  const txs=getFiltered(currentData.transactions);
  const income=txs.filter(t=>t.cat==='income').reduce((s,t)=>s+t.amount,0);
  const exp   =txs.filter(t=>t.cat!=='income').reduce((s,t)=>s+t.amount,0);
  const bal   =income-exp;
  document.getElementById('stat-grid').innerHTML=[
    {l:'Balance',   v:fmt(bal),   c:bal>=0?'var(--green)':'var(--red)'},
    {l:'Ingresos',  v:fmt(income),c:'var(--green)'},
    {l:'Gastos',    v:fmt(exp),   c:'var(--red)'},
    {l:'Movimientos',v:txs.length,c:'var(--accent)'}
  ].map(s=>`<div class="stat-card"><div class="stat-lbl">${s.l}</div><div class="stat-val" style="color:${s.c}">${s.v}</div></div>`).join('');

  // Donut
  const keys=Object.keys(CATS).filter(k=>k!=='income');
  const amts=keys.map(k=>txs.filter(t=>t.cat===k).reduce((s,t)=>s+t.amount,0));
  if(donutChart){ donutChart.destroy(); donutChart=null; }
  document.getElementById('donut-legend').innerHTML=keys.filter((_,i)=>amts[i]>0).map(k=>`<div class="leg-item"><div class="leg-dot" style="background:${CATS[k].color}"></div>${CATS[k].label}: ${fmt(amts[keys.indexOf(k)])}</div>`).join('');
  if(amts.some(a=>a>0)) {
    donutChart=new Chart(document.getElementById('donut-chart'),{
      type:'doughnut',
      data:{labels:keys.map(k=>CATS[k].label),datasets:[{data:amts,backgroundColor:keys.map(k=>CATS[k].color),borderWidth:2,borderColor:'#17171e'}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>' '+fmt(ctx.raw)}}},cutout:'60%'}
    });
  }

  // Trend
  if(trendChart){ trendChart.destroy(); trendChart=null; }
  const now=new Date(), months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const mE=months.map((_,i)=>currentData.transactions.filter(t=>{const d=new Date(t.date);return d.getFullYear()===now.getFullYear()&&d.getMonth()===i&&t.cat!=='income';}).reduce((s,t)=>s+t.amount,0));
  const mI=months.map((_,i)=>currentData.transactions.filter(t=>{const d=new Date(t.date);return d.getFullYear()===now.getFullYear()&&d.getMonth()===i&&t.cat==='income';}).reduce((s,t)=>s+t.amount,0));
  trendChart=new Chart(document.getElementById('trend-chart'),{
    type:'bar',
    data:{labels:months,datasets:[
      {label:'Gastos', data:mE,backgroundColor:'#f05c5c55',borderColor:'#f05c5c',borderWidth:1},
      {label:'Ingresos',data:mI,backgroundColor:'#34c77b55',borderColor:'#34c77b',borderWidth:1}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:'#9998b0',font:{size:10}},grid:{color:'#2a2a3855'},border:{color:'#2a2a38'}},
        y:{ticks:{color:'#9998b0',font:{size:10},callback:v=>'€'+Math.round(v)},grid:{color:'#2a2a3855'},border:{color:'#2a2a38'}}
      }}
  });
}

function renderProfile() {
  document.getElementById('profile-sub').textContent = currentData.transactions.length+' movimientos registrados';
}

// ===== TABS =====
const TABS=['home','transactions','analytics','profile'];
function switchTab(tab) {
  TABS.forEach(t=>{
    document.getElementById('tab-'+t).style.display=t===tab?'flex':'none';
    const n=document.getElementById('nav-'+t);
    if(n) n.classList.toggle('active',t===tab);
  });
  if(tab==='analytics') renderAnalytics();
  if(tab==='transactions') renderAllTx();
}

// ===== VOICE =====
function toggleVoice() {
  if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)){showToast('⚠️ Solo funciona en Chrome/Safari');return;}
  if(isRecording){recognition.stop();return;}
  const Rec=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new Rec(); recognition.lang='es-ES'; recognition.interimResults=false;
  recognition.onstart=()=>{isRecording=true;document.getElementById('voice-btn').classList.add('rec');document.getElementById('voice-hint').className='voice-hint act';document.getElementById('voice-hint').textContent='🔴 Escuchando...';};
  recognition.onresult=e=>parseVoice(e.results[0][0].transcript);
  recognition.onerror=recognition.onend=()=>{isRecording=false;document.getElementById('voice-btn').classList.remove('rec');document.getElementById('voice-hint').className='voice-hint';document.getElementById('voice-hint').textContent='Di: "Gasté 50 euros en supermercado"';};
  recognition.start();
}
function parseVoice(text) {
  document.getElementById('qa-desc').value=text;
  const num=text.match(/(\d+(?:[.,]\d{1,2})?)/);
  if(num) document.getElementById('qa-amt').value=parseFloat(num[1].replace(',','.')).toFixed(2);
  const lower=text.toLowerCase();
  const map={food:['super','mercado','comida','restaurante','aliment','lidl','aldi','rewe'],medical:['médico','doctor','farmacia','hospital','dentista'],rent:['renta','alquiler','piso','miete'],bills:['luz','agua','gas','internet','teléfono','netflix','spotify','suscripción'],fun:['cine','bar','fiesta','concierto','juego','entretenimiento'],vacation:['viaje','vacacion','hotel','vuelo','avión'],income:['cobré','salario','nómina','sueldo','ingreso']};
  for(const [cat,words] of Object.entries(map)) if(words.some(w=>lower.includes(w))){document.getElementById('qa-cat').value=cat;break;}
  document.getElementById('voice-hint').textContent='✓ "'+text+'"';
  setTimeout(()=>{document.getElementById('voice-hint').className='voice-hint';document.getElementById('voice-hint').textContent='Di: "Gasté 50 euros en supermercado"';},3500);
}

// ===== MODALS =====
function openModal(html) {
  document.getElementById('modal-content').innerHTML=html;
  document.getElementById('modal-bg').classList.add('open');
}
function closeModal(e) {
  if(!e||e.target===document.getElementById('modal-bg')) document.getElementById('modal-bg').classList.remove('open');
}

function showChangePw() {
  openModal(`<div class="modal-title">Cambiar contraseña</div>
    <div class="form-group"><label class="form-label">Contraseña actual</label><input class="form-input" type="password" id="m-old" placeholder="••••••••"></div>
    <div class="form-group"><label class="form-label">Nueva contraseña</label><input class="form-input" type="password" id="m-new" placeholder="Mínimo 6 caracteres"></div>
    <div class="form-group"><label class="form-label">Confirmar nueva</label><input class="form-input" type="password" id="m-new2" placeholder="Repite"><div class="err-msg" id="m-err"></div></div>
    <button class="btn btn-primary" onclick="doChangePw()">Actualizar</button>`);
}
async function doChangePw() {
  const old=document.getElementById('m-old').value, nw=document.getElementById('m-new').value, nw2=document.getElementById('m-new2').value;
  const err=document.getElementById('m-err');
  if(await hashPw(old)!==currentUser.pwHash){err.textContent='Contraseña actual incorrecta';return;}
  if(nw.length<6){err.textContent='Mínimo 6 caracteres';return;}
  if(nw!==nw2){err.textContent='No coinciden';return;}
  const h=await hashPw(nw);
  const users=getUsers(), idx=users.findIndex(u=>u.id===currentUser.id);
  users[idx].pwHash=h; currentUser.pwHash=h; saveUsers(users);
  closeModal(); showToast('🔐 Contraseña actualizada');
}

function exportCSV() {
  const txs=currentData.transactions;
  if(!txs.length){showToast('Sin datos para exportar');return;}
  const csv='\uFEFF'+'Fecha,Descripción,Categoría,Monto\n'+txs.map(t=>`${t.date},"${t.desc.replace(/"/g,'""')}",${CATS[t.cat]?.label||t.cat},${t.amount}`).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='mis-finanzas.csv'; a.click();
  showToast('📊 CSV descargado');
}

function logout() {
  openModal(`<div class="modal-title">¿Cerrar sesión?</div>
    <p style="color:var(--text2);font-size:14px;margin-bottom:20px">Puedes volver cuando quieras.</p>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" style="flex:1" onclick="doLogout()">Salir</button>
    </div>`);
}
function doLogout() {
  currentUser=null;currentData=null;closeModal();
  showScreen('screen-auth');renderUserGrid();
}

function confirmDelete() {
  openModal(`<div class="modal-title" style="color:var(--red)">⚠️ Eliminar cuenta</div>
    <p style="color:var(--text2);font-size:14px;margin-bottom:14px">Elimina tu cuenta y todos tus datos de forma permanente.</p>
    <div class="form-group"><label class="form-label">Confirma tu contraseña</label><input class="form-input" type="password" id="del-pw" placeholder="••••••••"><div class="err-msg" id="del-err"></div></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn" style="flex:1;background:var(--red);color:#fff;border:none;border-radius:var(--radius-sm);height:52px;font-size:15px;font-weight:600;cursor:pointer" onclick="doDelete()">Eliminar</button>
    </div>`);
}
async function doDelete() {
  const pw=document.getElementById('del-pw').value;
  if(await hashPw(pw)!==currentUser.pwHash){document.getElementById('del-err').textContent='Contraseña incorrecta';return;}
  localStorage.removeItem('mf_d_'+currentUser.id);
  saveUsers(getUsers().filter(u=>u.id!==currentUser.id));
  currentUser=null;currentData=null;closeModal();
  showScreen('screen-auth');renderUserGrid();
  showToast('Cuenta eliminada');
}

// ===== SERVICE WORKER =====
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
