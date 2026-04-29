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
  updateChartSobra(gastos);
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

// ===== 3. Doughnut Chart — Sobra (Saldo Total - Gastos) =====
function updateChartSobra(gastos) {
  const ctx = document.getElementById('chart-linha').getContext('2d');
  if (chartLinha) chartLinha.destroy();

  const saldoTotal = carteirasData.reduce((s, c) => s + Number(c.saldo), 0);
  const totalGastos = gastos.reduce((s, g) => s + Number(g.valor), 0);
  const sobra = saldoTotal - totalGastos;

  const isPositive = sobra >= 0;
  const sobraAbs = Math.abs(sobra);

  // If no data
  if (saldoTotal === 0 && totalGastos === 0) {
    chartLinha = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sem dados'],
        datasets: [{ data: [1], backgroundColor: ['rgba(255,255,255,0.05)'], borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: true, cutout: '70%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
    return;
  }

  const labels = isPositive
    ? ['Sobra', 'Comprometido']
    : ['Gastos excedentes', 'Saldo disponível'];

  const data = isPositive
    ? [sobra, totalGastos]
    : [sobraAbs, Math.max(saldoTotal, 0)];

  const bgColors = isPositive
    ? ['rgba(0,214,143,0.7)', 'rgba(124,92,255,0.3)']
    : ['rgba(255,77,106,0.7)', 'rgba(124,92,255,0.3)'];

  const borderColors = isPositive
    ? ['#00d68f', 'rgba(124,92,255,0.5)']
    : ['#ff4d6a', 'rgba(124,92,255,0.5)'];

  // Center text plugin
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx: c, width, height } = chart;
      c.save();
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const centerX = width / 2;
      const centerY = height / 2 - 10;

      // Label
      c.font = '500 12px Inter, sans-serif';
      c.fillStyle = '#7a7a95';
      c.fillText(isPositive ? 'Sobra' : 'Excesso', centerX, centerY - 10);

      // Value
      c.font = 'bold 18px Inter, sans-serif';
      c.fillStyle = isPositive ? '#00d68f' : '#ff4d6a';
      c.fillText((isPositive ? '' : '-') + formatCurrency(sobraAbs), centerX, centerY + 14);

      c.restore();
    }
  };

  chartLinha = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 }
        },
        tooltip: {
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
    },
    plugins: [centerTextPlugin]
  });
}

