let charts = [];
let activeChart = null;
let multiColorMode = false;
let chartColor = '#92dfec';
let lastAbilityColor = chartColor;
let radar2 = null;
let radar2Ready = false;

/* === Helpers === */
function hexToRGBA(hex, alpha) {
  if (!hex) hex = '#92dfec';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeConicGradient(chart, colors, alpha = 0.65) {
  const ctx = chart.ctx;
  const r = chart.scales.r;
  const grad = ctx.createConicGradient(-Math.PI / 2, r.xCenter, r.yCenter);
  const N = colors.length;
  for (let i = 0; i <= N; i++) grad.addColorStop(i / N, hexToRGBA(colors[i % N], alpha));
  return grad;
}

function computeFill(chart, abilityHex, axisPickers) {
  if (!multiColorMode) return hexToRGBA(abilityHex, 0.65);
  const colors = axisPickers.map(p => p.value || abilityHex);
  return makeConicGradient(chart, colors);
}

/* === Chart Setup === */
function makeRadar(ctx) {
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: hexToRGBA(chartColor, 0.65),
        borderColor: chartColor,
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartColor,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { display: false },
          grid: { display: false },
          angleLines: { color: '#6db5c0', lineWidth: 1 },
          pointLabels: { color: 'transparent' }
        }
      },
      plugins: { legend: { display: false } }
    },
    plugins: [{
      id: 'labelsPlugin',
      afterDraw(chart) {
        const ctx = chart.ctx;
        const r = chart.scales.r;
        const labels = chart.data.labels;
        const vals = chart.data.datasets[0].data;
        const cx = r.xCenter, cy = r.yCenter;
        const base = -Math.PI / 2;
        const baseRadius = r.drawingArea * 1.1;
        const offset = 20;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'italic 18px Candara';
        ctx.strokeStyle = chartColor;
        ctx.lineWidth = 4;
        ctx.fillStyle = 'white';
        labels.forEach((label, i) => {
          const angle = base + (i * 2 * Math.PI / labels.length);
          const x = cx + baseRadius * Math.cos(angle);
          const y = cy + baseRadius * Math.sin(angle);
          ctx.strokeText(label, x, y);
          ctx.fillText(label, x, y);

          const vx = cx + (baseRadius + offset) * Math.cos(angle);
          const vy = cy + (baseRadius + offset) * Math.sin(angle);
          ctx.fillStyle = 'black';
          ctx.font = '15px Candara';
          ctx.fillText(`(${vals[i] || 0})`, vx, vy);
        });
        ctx.restore();
      }
    }]
  });
}

/* === DOM === */
const inputs = [
  powerInput, speedInput, trickInput, recoveryInput, defenseInput
] = ['powerInput','speedInput','trickInput','recoveryInput','defenseInput'].map(id => document.getElementById(id));

const colorPicker = document.getElementById('colorPicker');
const multiColorBtn = document.getElementById('multiColorBtn');
const axisColorsDiv = document.getElementById('axisColors');
const axisColorPickers = [
  document.getElementById('powerColor'),
  document.getElementById('speedColor'),
  document.getElementById('trickColor'),
  document.getElementById('recoveryColor'),
  document.getElementById('defenseColor')
];

const addChartBtn = document.getElementById('addChartBtn');
const chartSelectDiv = document.getElementById('chartSelectButtons');
const chartArea = document.getElementById('chartArea');
const viewBtn = document.getElementById('viewBtn');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');
const overlayImg = document.getElementById('overlayImg');
const uploadedImg = document.getElementById('uploadedImg');
const overlayName = document.getElementById('overlayName');
const overlayAbility = document.getElementById('overlayAbility');
const overlayLevel = document.getElementById('overlayLevel');

/* === Chart Control === */
function addChart() {
  const canvas = document.createElement('canvas');
  chartArea.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const chart = makeRadar(ctx);
  charts.push(chart);
  setActiveChart(chart);

  const btn = document.createElement('button');
  btn.textContent = `Chart ${charts.length}`;
  btn.addEventListener('click', () => setActiveChart(chart));
  chartSelectDiv.appendChild(btn);
}

function setActiveChart(chart) {
  activeChart = chart;
  charts.forEach(c => c.canvas.style.zIndex = c === chart ? 2 : 1);
  updateCharts();
}

/* === Updates === */
function updateCharts() {
  if (!activeChart) return;
  const vals = inputs.map(i => +i.value || 0);
  const maxVal = Math.max(10, ...charts.flatMap(c => c.data.datasets[0].data));
  charts.forEach(c => c.options.scales.r.suggestedMax = maxVal);

  const fill = computeFill(activeChart, colorPicker.value, axisColorPickers);
  activeChart.data.datasets[0].data = vals;
  activeChart.data.datasets[0].borderColor = colorPicker.value;
  activeChart.data.datasets[0].backgroundColor = fill;
  charts.forEach(c => c.update());
}

/* === Listeners === */
inputs.forEach(i => i.addEventListener('input', updateCharts));

colorPicker.addEventListener('input', () => {
  const newAbility = colorPicker.value;
  axisColorPickers.forEach(p => {
    if (p.value.toLowerCase() === lastAbilityColor.toLowerCase()) p.value = newAbility;
  });
  lastAbilityColor = newAbility;
  updateCharts();
});

multiColorBtn.addEventListener('click', () => {
  multiColorMode = !multiColorMode;
  axisColorsDiv.style.display = multiColorMode ? 'flex' : 'none';
  multiColorBtn.textContent = multiColorMode ? 'Single-color' : 'Multi-color';
  updateCharts();
});

axisColorPickers.forEach(p => p.addEventListener('input', updateCharts));

addChartBtn.addEventListener('click', addChart);

/* === Overlay View === */
viewBtn.addEventListener('click', () => {
  overlay.classList.remove('hidden');
  overlayImg.src = uploadedImg.src;
  overlayName.textContent = nameInput.value || '-';
  overlayAbility.textContent = abilityInput.value || '-';
  overlayLevel.textContent = levelInput.value || '-';

  const ctx = document.getElementById('overlayChartCanvas').getContext('2d');
  if (!radar2Ready) {
    radar2 = makeRadar(ctx);
    radar2Ready = true;
  }
  radar2.data.datasets = charts.map(c => ({ ...c.data.datasets[0] }));
  radar2.update();
});

closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

/* === Init === */
addChart(); // start with one chart
