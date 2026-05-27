// ===== MIS FINANZAS APP - VERSIÓN SIMPLIFICADA Y ARREGLADA =====

// CONFIGURACIÓN INICIAL
const CATS = {
  income:   { label:'Ingresos',   emoji:'💰', color:'#34c77b' },
  food:     { label:'Alimentos',  emoji:'🛒', color:'#3ecfb2' },
  medical:  { label:'Médico',     emoji:'💊', color:'#f05c5c' },
  rent:     { label:'Renta',      emoji:'🏠', color:'#5ba3f5' },
  bills:    { label:'Cuentas',    emoji:'📱', color:'#f5a623' },
  fun:      { label:'Recreación', emoji:'🎮', color:'#7c6ef7' },
  vacation: { label:'Vacaciones', emoji:'✈️', color:'#e87dd0' },
  other:    { label:'Otros',      emoji:'📦', color:'#6b7280' }
};

let currentUser = null;
let currentData = null;
let currentPeriod = 'month';
let filterCat = 'all';

// ===== FUNCIONES SEGURAS CON TRY-CATCH =====

async function hashPassword(pw) {
  try {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(pw + '::mf_2026'));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  } catch(e) {
    console.error('Error hashing:', e);
    return pw; // fallback inseguro
  }
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('mf_users') || '[]');
  } catch(e) {
    console.error('Error getUsers:', e);
    return [];
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem('mf_users', JSON.stringify(users));
  } catch(e) {
    console.error('Error saveUsers:', e);
  }
}

function getUserData(uid) {
  try {
    return JSON.parse(localStorage.getItem('mf_data_' + uid) || '{"transactions":[]}');
  } catch(e) {
    console.error('Error getUserData:', e);
    return {transactions:[]};
  }
}

function saveUserData(uid, data) {
  try {
    localStorage.setItem('mf_data_' + uid, JSON.stringify(data));
  } catch(e) {
    console.error('Error saveUserData:', e);
  }
}

// ===== FUNCIONES DE INTERFAZ =====

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.style.display = s.id === id ? 'flex' : 'none';
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if(t) {
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }
}

// ===== AUTH - PANEL SELECTOR =====

function renderUserGrid() {
  const users = getUsers();
  const grid = document.getElementById('users-grid');
  const select = document.getElementById('panel-select');
  const login = document.getElementById('panel-login');
  const register = document.getElementById('panel-register');
  
  if(select) select.style.display = 'block';
  if(login) login.style.display = 'none';
  if(register) register.style.display = 'none';
  
  if(!grid) return;
  
  grid.innerHTML = users.map((u,i) => `
    <div class="user-card" onclick="selectUser(${i})">
      <div class="user-avatar" style="background:#7c6ef730">${u.name.substring(0,2).toUpperCase()}</div>
      <div class="user-name">${u.name}</div>
      <div class="user-last">Toca para entrar</div>
    </div>
  `).join('') + `
    <div class="user-card user-card-add" onclick="showRegister()">
      <div class="add-icon">+</div>
      <div class="user-name" style="color:var(--text3)">Nueva</div>
      <div class="user-last">Crear</div>
    </div>
  `;
}

function selectUser(i) {
  const users = getUsers();
  const u = users[i];
  const select = document.getElementById('panel-select');
  const login = document.getElementById('panel-login');
  
  if(select) select.style.display = 'none';
  if(login) {
    login.style.display = 'block';
    login.dataset.idx = i;
    document.getElementById('login-uname').textContent = u.name;
    document.getElementById('login-pw').value = '';
    document.getElementById('login-err').textContent = '';
  }
}

function showRegister() {
  const select = document.getElementById('panel-select');
  const register = document.getElementById('panel-register');
  
  if(select) select.style.display = 'none';
  if(register) {
    register.style.display = 'block';
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-pw').value = '';
    document.getElementById('reg-pw2').value = '';
    document.getElementById('reg-err').textContent = '';
  }
}

function showUserSelect() {
  const select = document.getElementById('panel-select');
  const login = document.getElementById('panel-login');
  const register = document.getElementById('panel-register');
  
  if(select) select.style.display = 'block';
  if(login) login.style.display = 'none';
  if(register) register.style.display = 'none';
}

// ===== LOGIN =====

async function doLogin() {
  const idx = parseInt(document.getElementById('panel-login').dataset.idx);
  const users = getUsers();
  const u = users[idx];
  const pw = document.getElementById('login-pw').value;
  
  if(!pw) {
    document.getElementById('login-err').textContent = 'Ingresa contraseña';
    return;
  }
  
  const hash = await hashPassword(pw);
  if(hash !== u.pwHash) {
    document.getElementById('login-err').textContent = 'Contraseña incorrecta';
    return;
  }
  
  currentUser = u;
  currentData = getUserData(u.id);
  enterApp();
}

// ===== REGISTRO =====

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const pw = document.getElementById('reg-pw').value;
  const pw2 = document.getElementById('reg-pw2').value;
  const err = document.getElementById('reg-err');
  
  if(!name) { err.textContent = 'Ingresa nombre'; return; }
  if(pw.length < 6) { err.textContent = 'Mínimo 6 caracteres'; return; }
  if(pw !== pw2) { err.textContent = 'Contraseñas no coinciden'; return; }
  
  const users = getUsers();
  if(users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
    err.textContent = 'Nombre ya existe';
    return;
  }
  
  const pwHash = await hashPassword(pw);
  const newUser = {id: 'u'+Date.now(), name, pwHash};
  users.push(newUser);
  saveUsers(users);
  
  currentUser = newUser;
  currentData = {transactions:[]};
  saveUserData(newUser.id, currentData);
  
  enterApp();
}

// ===== ENTER APP =====

function enterApp() {
  showScreen('screen-app');
  document.getElementById('hdr-name').textContent = currentUser.name;
  switchTab('home');
  renderAll();
}

// ===== TABS =====

function switchTab(tab) {
  ['home','transactions','analytics','profile'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if(el) el.style.display = t === tab ? 'block' : 'none';
    const nav = document.getElementById('nav-' + t);
    if(nav) nav.classList.toggle('active', t === tab);
  });
}

// ===== TRANSACCIONES =====

function addTx() {
  const desc = document.getElementById('qa-desc').value.trim();
  const amt = parseFloat(document.getElementById('qa-amt').value);
  const cat = document.getElementById('qa-cat').value;
  const date = document.getElementById('qa-date').value;
  
  if(!desc || !amt || amt <= 0 || !date) {
    showToast('⚠️ Completa campos');
    return;
  }
  
  currentData.transactions.unshift({id:Date.now(), desc, amount:amt, cat, date});
  saveUserData(currentUser.id, currentData);
  document.getElementById('qa-desc').value = '';
  document.getElementById('qa-amt').value = '';
  showToast('✓ Agregado');
  renderAll();
}

function deleteTx(id) {
  currentData.transactions = currentData.transactions.filter(t => t.id !== id);
  saveUserData(currentUser.id, currentData);
  renderAll();
  showToast('🗑 Eliminado');
}

// ===== RENDERIZAR =====

function renderAll() {
  renderHero();
  renderRecent();
  renderAllTx();
  renderProfile();
}

function getFiltered() {
  const now = new Date();
  return currentData.transactions.filter(t => {
    const d = new Date(t.date + 'T12:00:00');
    return currentPeriod === 'month'
      ? d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      : d.getFullYear() === now.getFullYear();
  });
}

function renderHero() {
  const txs = getFiltered();
  const income = txs.filter(t => t.cat === 'income').reduce((s,t) => s + t.amount, 0);
  const exp = txs.filter(t => t.cat !== 'income').reduce((s,t) => s + t.amount, 0);
  const bal = income - exp;
  
  const heroBalance = document.getElementById('hero-balance');
  if(heroBalance) {
    heroBalance.innerHTML = `<em>€</em>${Math.abs(bal).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  }
  
  const hi = document.getElementById('hero-income');
  const he = document.getElementById('hero-exp');
  if(hi) hi.textContent = '€' + income.toLocaleString('de-DE',{minimumFractionDigits:2});
  if(he) he.textContent = '€' + exp.toLocaleString('de-DE',{minimumFractionDigits:2});
}

function renderRecent() {
  const txs = getFiltered().slice(0,6);
  const el = document.getElementById('recent-list');
  if(!el) return;
  
  el.innerHTML = txs.length ? txs.map(t => {
    const c = CATS[t.cat] || CATS.other;
    const d = new Date(t.date + 'T12:00:00');
    const ds = d.toLocaleDateString('es',{day:'numeric',month:'short'});
    return `<div class="tx-item">
      <div class="tx-ico" style="background:${c.color}20">${c.emoji}</div>
      <div class="tx-info">
        <div class="tx-name">${t.desc}</div>
        <div class="tx-meta">${c.label} · ${ds}</div>
      </div>
      <span class="tx-amt">${t.cat === 'income' ? '+' : '-'}€${t.amount.toFixed(2)}</span>
      <span class="tx-del" onclick="deleteTx(${t.id})">✕</span>
    </div>`;
  }).join('') : '<div class="empty">Sin movimientos</div>';
}

function renderAllTx() {
  const base = getFiltered();
  const txs = base.filter(t => filterCat === 'all' || t.cat === filterCat);
  const el = document.getElementById('all-list');
  if(!el) return;
  
  el.innerHTML = txs.length ? txs.map(t => {
    const c = CATS[t.cat] || CATS.other;
    const d = new Date(t.date + 'T12:00:00');
    return `<div class="tx-item">
      <div class="tx-ico" style="background:${c.color}20">${c.emoji}</div>
      <div class="tx-info">
        <div class="tx-name">${t.desc}</div>
        <div class="tx-meta">${c.label}</div>
      </div>
      <span class="tx-amt">€${t.amount.toFixed(2)}</span>
      <span class="tx-del" onclick="deleteTx(${t.id})">✕</span>
    </div>`;
  }).join('') : '<div class="empty">Sin movimientos</div>';
}

function renderProfile() {
  const el = document.getElementById('profile-sub');
  if(el) el.textContent = currentData.transactions.length + ' movimientos';
}

// ===== LOGOUT =====

function logout() {
  currentUser = null;
  currentData = null;
  showScreen('screen-auth');
  renderUserGrid();
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  // Establecer fecha actual
  const dateInput = document.getElementById('qa-date');
  if(dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Mostrar pantalla auth
  showScreen('screen-auth');
  renderUserGrid();
  
  // Event listeners para login
  const loginPw = document.getElementById('login-pw');
  if(loginPw) {
    loginPw.addEventListener('keydown', e => {
      if(e.key === 'Enter') doLogin();
    });
  }
  
  // Navegar con tabs
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.id.replace('nav-', '');
      switchTab(tab);
    });
  });
  
  // Botón agregar transacción
  const btnAdd = document.querySelector('.btn-add-tx');
  if(btnAdd) {
    btnAdd.addEventListener('click', addTx);
  }
  
  console.log('✓ App iniciada correctamente');
});
