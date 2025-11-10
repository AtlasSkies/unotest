let radar1, radar2;
let radar2Ready = false;
let chartColor = '#92dfec';
let multiColorMode = false;

const CHART1_CENTER = { x: 247, y: 250 };

// Convert HEX to RGBA
function hexToRGBA(hex, alpha) {
  if (hex.startsWith('rgb')) return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* === FIXED CENTER === */
const fixedCenterPlugin = {
  id: 'fixedCenter',
  beforeLayout(chart) {
    const opt = chart.config.options.fixedCenter;
    if (!opt?.enabled) return;
    const r = chart.scales.r;
    if (opt.centerX && opt.centerY) {
      r.xCenter = opt.centerX;
      r.yCenter = opt.centerY;
    }
  }
};

/* === GRADIENT BACKGROUND FOR MULTICOLOR === */
function createGradient(ctx, cx, cy, radius, colors) {
  const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  const stops = colors.length;
  colors.forEach((c, i) => grad.addColorStop(i / (stops - 1), c));
  return grad;
}

/* === RADAR CREATOR === */
function makeRadar(ctx, showPoints = true, withBackground = false, fixedCenter = null) {
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
        pointRadius: showPoints ? 5 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          grid: { display: false },
          angleLines: { color: '#6db5c0', lineWidth: 1 },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { display: false },
          pointLabels: { color: 'transparent' }
        }
      },
      fixedCenter: { enabled: !!fixedCenter, centerX: fixedCenter?.x, centerY: fixedCenter?.y },
      plugins: { legend: { display: false } }
    },
    plugins: [fixedCenterPlugin]
  });
}

/* === DOM ELEMENTS === */
const viewBtn = document.getElementById('viewBtn');
const multiColorBtn = document.getElementById('multiColorBtn');
const axisColorPickers = document.getElementById('axisColorPickers');
const colorPicker = document.getElementById('colorPicker');
const powerInput = document.getElementById('powerInput');
const speedInput = document.getElementById('speedInput');
const trickInput = document.getElementById('trickInput');
const recoveryInput = document.getElementById('recoveryInput');
const defenseInput = document.getElementById('defenseInput');
const powerColor = document.getElementById('powerColor');
const speedColor = document.getElementById('speedColor');
const trickColor = document.getElementById('trickColor');
const recoveryColor = document.getElementById('recoveryColor');
const defenseColor = document.getElementById('defenseColor');

/* === INIT === */
window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1, true, false, CHART1_CENTER);
  updateCharts();
});

/* === UPDATE CHART COLORS === */
function getWedgeColors() {
  if (!multiColorMode) return Array(5).fill(hexToRGBA(chartColor, 0.65));
  return [
    hexToRGBA(powerColor.value, 0.65),
    hexToRGBA(speedColor.value, 0.65),
    hexToRGBA(trickColor.value, 0.65),
    hexToRGBA(recoveryColor.value, 0.65),
    hexToRGBA(defenseColor.value, 0.65)
  ];
}

function updateCharts() {
  const vals = [
    +powerInput.value || 0,
    +speedInput.value || 0,
    +trickInput.value || 0,
    +recoveryInput.value || 0,
    +defenseInput.value || 0
  ];
  const maxVal = Math.max(...vals, 10);
  radar1.options.scales.r.suggestedMax = maxVal;

  const colors = getWedgeColors();
  const ctx = radar1.ctx;
  const r = radar1.scales.r;
  const grad = createGradient(ctx, r.xCenter, r.yCenter, r.drawingArea, colors);

  radar1.data.datasets[0].data = vals;
  radar1.data.datasets[0].backgroundColor = grad;
  radar1.data.datasets[0].borderColor = multiColorMode ? '#00000080' : chartColor;
  radar1.update();
}

/* === LISTENERS === */
[colorPicker, powerInput, speedInput, trickInput, recoveryInput, defenseInput,
  powerColor, speedColor, trickColor, recoveryColor, defenseColor]
  .forEach(el => el.addEventListener('input', updateCharts));

multiColorBtn.addEventListener('click', () => {
  multiColorMode = !multiColorMode;
  multiColorBtn.textContent = multiColorMode ? 'Single-color' : 'Multi-color';
  axisColorPickers.classList.toggle('hidden', !multiColorMode);

  if (multiColorMode) {
    // sync all pickers to current ability color
    [powerColor, speedColor, trickColor, recoveryColor, defenseColor].forEach(p => p.value = colorPicker.value);
  }
  updateCharts();
});

/* === AUTO SYNC ABILITY COLOR === */
colorPicker.addEventListener('change', () => {
  if (multiColorMode) {
    [powerColor, speedColor, trickColor, recoveryColor, defenseColor].forEach(p => p.value = colorPicker.value);
  }
  updateCharts();
});
