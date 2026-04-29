// =============================================
// FinControl — Gráficos (Chart.js)
// =============================================

let chartRosca = null;
let chartBarras = null;
let chartLinha = null;

// ===== Chart.js Global Dark Mode Config =====
Chart.defaults.color = '#7a7a95';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

// ===== Update All Charts =====
async function updateAllCharts(gastos, userId, currentDate) {
  updateChartRosca(gastos);
  await updateChartBarras(userId, currentDate);
  await updateChartLinha(userId);
}

// ===== 1. Donut Chart — Gastos por Carteira =====
function updateChartRosca(gastos) {
  const ctx = document.getElementById('chart-rosca').getContext('2d');
  if (chartRosca) chartRosca.destroy();

  // Group expenses by carteira
  const byCarteira = {};
  let semCarteira = 0;

  gastos.forEach(g => {
    if (g.carteira_id) {
      const c = getCarteiraById(g.carteira_id);
      if (c) {
        if (!byCarteira[c.id]) {
          byCarteira[c.id] = { nome: c.nome, cor: c.cor, total: 0 };
        }
        byCarteira[c.id].total += Number(g.valor);
      } else {
        semCarteira += Number(g.valor);
      }
    } else {
      semCarteira += Number(g.valor);
    }
  });

  const entries = Object.values(byCarteira);
  if (semCarteira > 0) {
    entries.push({ nome: 'Sem carteira', cor: '#55556a', total: semCarteira });
  }

  const hasData = entries.length > 0;

  chartRosca = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: hasData ? entries.map(e => e.nome) : ['Sem dados'],
      datasets: [{
        data: hasData ? entries.map(e => e.total) : [1],
        backgroundColor: hasData
          ? entries.map(e => e.cor + 'AA')
          : ['rgba(255,255,255,0.05)'],
        borderColor: hasData
          ? entries.map(e => e.cor)
          : ['rgba(255,255,255,0.1)'],
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 }
        },
        tooltip: {
          enabled: hasData,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
          },
          backgroundColor: 'rgba(17,17,40,0.95)',
          titleColor: '#eaeaf0',
          bodyColor: '#eaeaf0',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        }
      }
    }
  });
}

// ===== 2. Bar Chart — Gastos últimos 6 meses =====
async function updateChartBarras(userId, currentDate) {
  const months = [];
  const labels = [];
  const values = [];

  const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const mesRef = getMesRef(d);
    months.push(mesRef);
    labels.push(`${MONTH_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`);
  }

  for (const mes of months) {
    const { data } = await supabaseClient
      .from('gastos')
      .select('valor')
      .eq('usuario_id', userId)
      .eq('mes_ref', mes);

    const total = (data || []).reduce((s, g) => s + Number(g.valor), 0);
    values.push(total);
  }

  const ctx = document.getElementById('chart-barras').getContext('2d');
  if (chartBarras) chartBarras.destroy();

  chartBarras = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total de Gastos',
        data: values,
        backgroundColor: 'rgba(124,92,255,0.4)',
        borderColor: '#7c5cff',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(124,92,255,0.6)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` ${formatCurrency(ctx.raw)}` },
          backgroundColor: 'rgba(17,17,40,0.95)',
          titleColor: '#eaeaf0',
          bodyColor: '#eaeaf0',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        }
      }
    }
  });
}

// ===== 3. Line Chart — Evolução do Saldo (soma das carteiras) =====
async function updateChartLinha(userId) {
  // For line chart, show carteiras current balances as a bar comparison
  const labels = carteirasData.map(c => c.nome);
  const values = carteirasData.map(c => Number(c.saldo));
  const colors = carteirasData.map(c => c.cor);

  const ctx = document.getElementById('chart-linha').getContext('2d');
  if (chartLinha) chartLinha.destroy();

  const hasData = carteirasData.length > 0;

  if (!hasData) {
    chartLinha = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sem carteiras'],
        datasets: [{ data: [0], backgroundColor: 'rgba(255,255,255,0.05)' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
    return;
  }

  chartLinha = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Saldo',
        data: values,
        backgroundColor: colors.map(c => c + '66'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ` Saldo: ${formatCurrency(ctx.raw)}` },
          backgroundColor: 'rgba(17,17,40,0.95)',
          titleColor: '#eaeaf0',
          bodyColor: '#eaeaf0',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        }
      }
    }
  });
}
