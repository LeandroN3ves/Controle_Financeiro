// =============================================
// FinControl — CRUD de Gastos
// =============================================

// ===== DOM =====
const gastosTbody = document.getElementById('gastos-tbody');
const modalOverlay = document.getElementById('modal-overlay');
const modalForm = document.getElementById('modal-form');
const modalTitle = document.getElementById('modal-title');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalGastoId = document.getElementById('modal-gasto-id');
const modalNome = document.getElementById('modal-nome');
const modalValor = document.getElementById('modal-valor');
const modalVencimento = document.getElementById('modal-vencimento');
const modalTipo = document.getElementById('modal-tipo');
const modalParcelasGroup = document.getElementById('modal-parcelas-group');
const modalParcelaAtual = document.getElementById('modal-parcela-atual');
const modalTotalParcelas = document.getElementById('modal-total-parcelas');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const modalCarteira = document.getElementById('modal-carteira');
const addGastoBtn = document.getElementById('add-gasto-btn');
const fabAddBtn = document.getElementById('fab-add-btn');
const confirmOverlay = document.getElementById('confirm-overlay');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

let deleteTargetId = null;

// ===== Toggle parcelas field =====
modalTipo.addEventListener('change', () => {
  if (modalTipo.value === 'parcelado') {
    modalParcelasGroup.classList.remove('hidden');
    modalParcelaAtual.setAttribute('required', '');
    modalTotalParcelas.setAttribute('required', '');
  } else {
    modalParcelasGroup.classList.add('hidden');
    modalParcelaAtual.removeAttribute('required');
    modalTotalParcelas.removeAttribute('required');
  }
});

// ===== Open Modal =====
function openModal(gasto = null) {
  modalForm.reset();
  modalGastoId.value = '';
  modalParcelasGroup.classList.add('hidden');
  modalParcelaAtual.removeAttribute('required');
  modalTotalParcelas.removeAttribute('required');

  if (gasto) {
    // Edit mode
    modalTitle.textContent = 'Editar Gasto';
    modalGastoId.value = gasto.id;
    modalNome.value = gasto.nome;
    modalValor.value = gasto.valor;
    modalVencimento.value = gasto.vencimento;
    modalTipo.value = gasto.tipo;
    if (gasto.tipo === 'parcelado') {
      modalParcelasGroup.classList.remove('hidden');
      modalParcelaAtual.value = gasto.parcela_atual;
      modalTotalParcelas.value = gasto.total_parcelas;
      modalParcelaAtual.setAttribute('required', '');
      modalTotalParcelas.setAttribute('required', '');
    }
    // Set carteira
    if (gasto.carteira_id) {
      modalCarteira.value = gasto.carteira_id;
    }
  } else {
    // New mode
    modalTitle.textContent = 'Novo Gasto';
    // Default vencimento to current month
    const today = new Date();
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    modalVencimento.value = `${y}-${m}-${d}`;
  }

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

// ===== Event Listeners for opening modal =====
addGastoBtn.addEventListener('click', () => openModal());
fabAddBtn.addEventListener('click', () => openModal());
modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ===== Submit (Create or Update) =====
modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalSubmitBtn.disabled = true;
  modalSubmitBtn.innerHTML = '<span class="loading-spinner"></span>';

  const gastoObj = {
    usuario_id: currentUser.id,
    nome: modalNome.value.trim(),
    valor: parseFloat(modalValor.value),
    vencimento: modalVencimento.value,
    tipo: modalTipo.value,
    parcela_atual: modalTipo.value === 'parcelado' ? parseInt(modalParcelaAtual.value) : null,
    total_parcelas: modalTipo.value === 'parcelado' ? parseInt(modalTotalParcelas.value) : null,
    pago: false,
    mes_ref: getMesRef(currentDate),
    carteira_id: modalCarteira.value || null
  };

  try {
    const editId = modalGastoId.value;

    if (editId) {
      // UPDATE
      delete gastoObj.usuario_id;
      delete gastoObj.pago;
      const { error } = await supabaseClient
        .from('gastos')
        .update(gastoObj)
        .eq('id', editId);
      if (error) throw error;
      showToast('Gasto atualizado!');
    } else {
      // INSERT
      const { error } = await supabaseClient
        .from('gastos')
        .insert(gastoObj);
      if (error) throw error;
      showToast('Gasto adicionado!');
    }

    closeModal();
    await loadDashboard();
  } catch (err) {
    console.error('Erro ao salvar gasto:', err);
    showToast('Erro ao salvar gasto', 'error');
  } finally {
    modalSubmitBtn.disabled = false;
    modalSubmitBtn.textContent = 'Salvar';
  }
});

// ===== Toggle Paid =====
async function togglePago(id, currentStatus) {
  try {
    const { error } = await supabaseClient
      .from('gastos')
      .update({ pago: !currentStatus })
      .eq('id', id);
    if (error) throw error;
    showToast(!currentStatus ? 'Marcado como pago!' : 'Marcado como pendente');
    await loadDashboard();
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    showToast('Erro ao atualizar status', 'error');
  }
}

// ===== Delete =====
function confirmDelete(id) {
  deleteTargetId = id;
  confirmOverlay.classList.add('active');
}

confirmNo.addEventListener('click', () => {
  confirmOverlay.classList.remove('active');
  deleteTargetId = null;
});

confirmOverlay.addEventListener('click', (e) => {
  if (e.target === confirmOverlay) {
    confirmOverlay.classList.remove('active');
    deleteTargetId = null;
  }
});

confirmYes.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    const { error } = await supabaseClient
      .from('gastos')
      .delete()
      .eq('id', deleteTargetId);
    if (error) throw error;
    showToast('Gasto excluído!');
    confirmOverlay.classList.remove('active');
    deleteTargetId = null;
    await loadDashboard();
  } catch (err) {
    console.error('Erro ao excluir gasto:', err);
    showToast('Erro ao excluir gasto', 'error');
  }
});

// ===== Render Table =====
function renderGastosTable(gastos) {
  if (!gastos || gastos.length === 0) {
    gastosTbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <span>📭</span>
            <p>Nenhum gasto registrado neste mês</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  gastosTbody.innerHTML = gastos.map(g => {
    const vencDate = new Date(g.vencimento + 'T00:00:00');
    const isVencido = !g.pago && vencDate < today;
    const rowClass = isVencido ? 'vencido' : '';

    const parcelas = g.tipo === 'parcelado'
      ? `${g.parcela_atual}/${g.total_parcelas}`
      : '—';

    const statusBadge = g.pago
      ? '<span class="badge badge-pago">✅ Pago</span>'
      : '<span class="badge badge-pendente">🟡 Pendente</span>';

    const vencFormatted = vencDate.toLocaleDateString('pt-BR');

    // Carteira badge
    const carteira = g.carteira_id ? getCarteiraById(g.carteira_id) : null;
    const carteiraBadge = carteira
      ? `<span class="wallet-badge"><span class="wallet-badge-dot" style="background:${carteira.cor}"></span>${escapeHtml(carteira.nome)}</span>`
      : '<span style="color:var(--text-muted)">—</span>';

    return `
      <tr class="${rowClass}">
        <td><strong>${escapeHtml(g.nome)}</strong></td>
        <td>${formatCurrency(g.valor)}</td>
        <td>${carteiraBadge}</td>
        <td>${vencFormatted}</td>
        <td>${g.tipo === 'fixo' ? 'Fixo' : 'Parcelado'}</td>
        <td>${parcelas}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-sm btn-success btn-icon" onclick="togglePago('${g.id}', ${g.pago})" title="${g.pago ? 'Marcar pendente' : 'Marcar pago'}">
              ${g.pago ? '↩' : '✓'}
            </button>
            <button class="btn btn-sm btn-edit btn-icon" onclick="editGasto('${g.id}')" title="Editar">✎</button>
            <button class="btn btn-sm btn-danger btn-icon" onclick="confirmDelete('${g.id}')" title="Excluir">✕</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ===== Edit Gasto =====
function editGasto(id) {
  const gasto = gastosData.find(g => g.id === id);
  if (gasto) openModal(gasto);
}

// ===== Escape HTML =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
