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
  await updateChartLinha(userId, currentDate);
}

// ===== 1. Donut Chart — Pago vs A Pagar =====
function updateChartRosca(gastos) {
  const totalPago = gastos.filter(g => g.pago).reduce((s, g) => s + Number(g.valor), 0);
  const totalPendente = gastos.filter(g => !g.pago).reduce((s, g) => s + Number(g.valor), 0);

  const ctx = document.getElementById('chart-rosca').getContext('2d');

  if (chartRosca) chartRosca.destroy();

  const hasData = totalPago > 0 || totalPendente > 0;

  chartRosca = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pago', 'A Pagar'],
      datasets: [{
        data: hasData ? [totalPago, totalPendente] : [1],
        backgroundColor: hasData
          ? ['#00d68f', '#ffaa00']
          : ['rgba(255,255,255,0.05)'],
        borderColor: hasData
          ? ['rgba(0,214,143,0.3)', 'rgba(255,170,0,0.3)']
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
            label: (ctx) => {
              const val = Number(ctx.raw);
              return ` ${ctx.label}: ${formatCurrency(val)}`;
            }
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

  // Fetch totals for each month
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
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatCurrency(ctx.raw)}`
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

// ===== 3. Line Chart — Evolução do Saldo =====
async function updateChartLinha(userId, currentDate) {
  const labels = [];
  const values = [];

  const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const mesRef = getMesRef(d);
    labels.push(`${MONTH_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`);

    const { data } = await supabaseClient
      .from('saldo')
      .select('valor_disponivel')
      .eq('usuario_id', userId)
      .eq('mes_ref', mesRef)
      .single();

    values.push(data ? Number(data.valor_disponivel) : 0);
  }

  const ctx = document.getElementById('chart-linha').getContext('2d');
  if (chartLinha) chartLinha.destroy();

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 280);
  gradient.addColorStop(0, 'rgba(0,214,143,0.3)');
  gradient.addColorStop(1, 'rgba(0,214,143,0)');

  chartLinha = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Saldo',
        data: values,
        borderColor: '#00d68f',
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00d68f',
        pointBorderColor: '#111128',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          ticks: {
            callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 })
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Saldo: ${formatCurrency(ctx.raw)}`
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
