// =============================================
// FinControl — Dashboard Logic
// =============================================

let currentUser = null;
let currentDate = new Date();
let gastosData = [];

// ===== DOM =====
const pageLoader = document.getElementById('page-loader');
const userGreeting = document.getElementById('user-greeting');
const logoutBtn = document.getElementById('logout-btn');
const monthDisplay = document.getElementById('month-display');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const cardTotalGastos = document.getElementById('card-total-gastos');
const cardTotalPago = document.getElementById('card-total-pago');
const cardFaltaPagar = document.getElementById('card-falta-pagar');

// ===== Helpers =====
function getMesRef(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatMonthDisplay(date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

// ===== Toast =====
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== Protect Route =====
async function protectRoute() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    currentUser = session.user;

    // Get profile name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nome')
      .eq('id', currentUser.id)
      .single();

    const nome = profile?.nome || currentUser.user_metadata?.nome || 'Usuário';
    userGreeting.textContent = `Olá, ${nome}`;
    return session;
  } catch (e) {
    console.error('Erro de autenticação:', e);
    window.location.href = 'index.html';
    return null;
  }
}

// ===== Logout =====
logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
});

// ===== Month Navigation =====
prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  loadDashboard();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  loadDashboard();
});

// ===== Load Dashboard Data =====
async function loadDashboard() {
  const mesRef = getMesRef(currentDate);
  monthDisplay.textContent = formatMonthDisplay(currentDate);

  // Load gastos
  const { data: gastos, error: gastosErr } = await supabaseClient
    .from('gastos')
    .select('*')
    .eq('usuario_id', currentUser.id)
    .eq('mes_ref', mesRef)
    .order('vencimento', { ascending: true });

  if (gastosErr) {
    console.error('Erro ao carregar gastos:', gastosErr);
    showToast('Erro ao carregar gastos', 'error');
    return;
  }

  gastosData = gastos || [];

  // Update UI
  updateCards();
  renderGastosTable(gastosData);

  // Update charts (defined in graficos.js)
  if (typeof updateAllCharts === 'function') {
    updateAllCharts(gastosData, currentUser.id, currentDate);
  }
}

// ===== Update Cards =====
function updateCards() {
  const totalGastos = gastosData.reduce((sum, g) => sum + Number(g.valor), 0);
  const totalPago = gastosData.filter(g => g.pago).reduce((sum, g) => sum + Number(g.valor), 0);
  const faltaPagar = totalGastos - totalPago;

  cardTotalGastos.textContent = formatCurrency(totalGastos);
  cardTotalPago.textContent = formatCurrency(totalPago);
  cardFaltaPagar.textContent = formatCurrency(faltaPagar);
}

// ===== Init =====
(async function init() {
  const session = await protectRoute();
  if (session) {
    await loadCarteiras();
    await loadDashboard();
  }
  pageLoader.classList.add('hidden');
})();
