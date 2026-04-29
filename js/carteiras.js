// =============================================
// FinControl — CRUD de Carteiras
// =============================================

let carteirasData = [];

// ===== DOM =====
const walletsGrid = document.getElementById('wallets-grid');
const addCarteiraBtn = document.getElementById('add-carteira-btn');
const carteiraModalOverlay = document.getElementById('carteira-modal-overlay');
const carteiraModalForm = document.getElementById('carteira-modal-form');
const carteiraModalTitle = document.getElementById('carteira-modal-title');
const carteiraModalClose = document.getElementById('carteira-modal-close');
const carteiraModalId = document.getElementById('carteira-modal-id');
const carteiraModalNome = document.getElementById('carteira-modal-nome');
const carteiraModalSaldo = document.getElementById('carteira-modal-saldo');
const carteiraModalCor = document.getElementById('carteira-modal-cor');
const carteiraModalSubmit = document.getElementById('carteira-modal-submit');
const colorPicker = document.getElementById('color-picker');
const cardSaldoTotal = document.getElementById('card-saldo-total');

// ===== Color Picker Logic =====
colorPicker.addEventListener('click', (e) => {
  const btn = e.target.closest('.color-option');
  if (!btn) return;
  colorPicker.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  carteiraModalCor.value = btn.dataset.color;
});

// ===== Open/Close Modal =====
function openCarteiraModal(carteira = null) {
  carteiraModalForm.reset();
  carteiraModalId.value = '';
  carteiraModalCor.value = '#7c5cff';

  // Reset color picker selection
  colorPicker.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));

  if (carteira) {
    carteiraModalTitle.textContent = 'Editar Carteira';
    carteiraModalId.value = carteira.id;
    carteiraModalNome.value = carteira.nome;
    carteiraModalSaldo.value = carteira.saldo;
    carteiraModalCor.value = carteira.cor;
    // Select the matching color
    const match = colorPicker.querySelector(`[data-color="${carteira.cor}"]`);
    if (match) match.classList.add('selected');
  } else {
    carteiraModalTitle.textContent = 'Nova Carteira';
    // Select first color by default
    const first = colorPicker.querySelector('.color-option');
    if (first) first.classList.add('selected');
  }

  carteiraModalOverlay.classList.add('active');
}

function closeCarteiraModal() {
  carteiraModalOverlay.classList.remove('active');
}

addCarteiraBtn.addEventListener('click', () => openCarteiraModal());
carteiraModalClose.addEventListener('click', closeCarteiraModal);
carteiraModalOverlay.addEventListener('click', (e) => {
  if (e.target === carteiraModalOverlay) closeCarteiraModal();
});

// ===== Submit (Create or Update) =====
carteiraModalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  carteiraModalSubmit.disabled = true;
  carteiraModalSubmit.innerHTML = '<span class="loading-spinner"></span>';

  const obj = {
    usuario_id: currentUser.id,
    nome: carteiraModalNome.value.trim(),
    saldo: parseFloat(carteiraModalSaldo.value),
    cor: carteiraModalCor.value
  };

  try {
    const editId = carteiraModalId.value;

    if (editId) {
      delete obj.usuario_id;
      const { error } = await supabaseClient
        .from('carteiras')
        .update(obj)
        .eq('id', editId);
      if (error) throw error;
      showToast('Carteira atualizada!');
    } else {
      const { error } = await supabaseClient
        .from('carteiras')
        .insert(obj);
      if (error) throw error;
      showToast('Carteira criada!');
    }

    closeCarteiraModal();
    await loadCarteiras();
    await loadDashboard();
  } catch (err) {
    console.error('Erro ao salvar carteira:', err);
    showToast('Erro ao salvar carteira', 'error');
  } finally {
    carteiraModalSubmit.disabled = false;
    carteiraModalSubmit.textContent = 'Salvar';
  }
});

// ===== Delete Carteira =====
async function deleteCarteira(id) {
  deleteTargetId = id;
  document.getElementById('confirm-text').textContent = 'Tem certeza que deseja excluir esta carteira?';
  document.getElementById('confirm-yes').textContent = 'Excluir';
  confirmOverlay.classList.add('active');

  // Override confirm action temporarily
  const handler = async () => {
    try {
      const { error } = await supabaseClient
        .from('carteiras')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showToast('Carteira excluída!');
      confirmOverlay.classList.remove('active');
      await loadCarteiras();
      await loadDashboard();
    } catch (err) {
      console.error('Erro ao excluir carteira:', err);
      showToast('Erro ao excluir carteira', 'error');
    }
    confirmYes.removeEventListener('click', handler);
  };

  // Remove previous listeners and add new one
  const newConfirmYes = confirmYes.cloneNode(true);
  confirmYes.parentNode.replaceChild(newConfirmYes, confirmYes);
  // Re-assign global reference
  window.confirmYesEl = newConfirmYes;
  newConfirmYes.addEventListener('click', handler);

  const cancelHandler = () => {
    confirmOverlay.classList.remove('active');
    newConfirmYes.removeEventListener('click', handler);
  };
  document.getElementById('confirm-no').addEventListener('click', cancelHandler, { once: true });
}

// ===== Load Carteiras =====
async function loadCarteiras() {
  const { data, error } = await supabaseClient
    .from('carteiras')
    .select('*')
    .eq('usuario_id', currentUser.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar carteiras:', error);
    return;
  }

  carteirasData = data || [];
  renderCarteiras();
  updateSaldoTotal();
  populateCarteiraSelect();
}

// ===== Render Carteiras =====
function renderCarteiras() {
  if (carteirasData.length === 0) {
    walletsGrid.innerHTML = `
      <div class="empty-state" style="padding:30px;width:100%;">
        <span>💳</span>
        <p>Nenhuma carteira cadastrada</p>
      </div>`;
    return;
  }

  walletsGrid.innerHTML = carteirasData.map(c => `
    <div class="wallet-card">
      <div class="wallet-color-dot" style="background:${c.cor};box-shadow:0 0 8px ${c.cor}40;"></div>
      <div class="wallet-info">
        <div class="wallet-name">${escapeHtml(c.nome)}</div>
        <div class="wallet-balance" style="color:${c.cor}">${formatCurrency(c.saldo)}</div>
      </div>
      <div class="wallet-actions">
        <button class="btn btn-sm btn-edit btn-icon" onclick="openCarteiraModal(carteirasData.find(w=>w.id==='${c.id}'))" title="Editar">✎</button>
        <button class="btn btn-sm btn-danger btn-icon" onclick="deleteCarteira('${c.id}')" title="Excluir">✕</button>
      </div>
    </div>
  `).join('');
}

// ===== Update Saldo Total =====
function updateSaldoTotal() {
  const total = carteirasData.reduce((sum, c) => sum + Number(c.saldo), 0);
  cardSaldoTotal.textContent = formatCurrency(total);
}

// ===== Populate Carteira Select in Gasto Modal =====
function populateCarteiraSelect() {
  const select = document.getElementById('modal-carteira');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">Nenhuma</option>';
  carteirasData.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nome;
    opt.style.color = c.cor;
    select.appendChild(opt);
  });
  select.value = currentVal;
}

// ===== Get Carteira by ID =====
function getCarteiraById(id) {
  return carteirasData.find(c => c.id === id) || null;
}
