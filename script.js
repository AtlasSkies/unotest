let radar1, radar2;
let radar2Ready = false;
let chartColor = '#92dfec';
let isMulticolor = false;

const CHART1_CENTER = { x: 247, y: 250 };

/* === Gradient Generator === */
function createAxisGradient(ctx, cx, cy, radius, colors) {
  const grad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  const n = colors.length;
  colors.forEach((c, i) => {
    grad.addColorStop(i / n, c);
    grad.addColorStop((i + 1) / n, c);
  });
  return grad;
}

function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* === CHART CREATION === */
function makeRadar(ctx) {
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Power', 'Speed', 'Trick', 'Recovery', 'Defense'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        borderWidth: 2,
        borderColor: chartColor,
        pointRadius: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartColor,
        backgroundColor: context => {
          const { chart } = context;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const cx = (chartArea.left + chartArea.right) / 2;
          const cy = (chartArea.top + chartArea.bottom) / 2;
          const radius = (chartArea.right - chartArea.left) / 2;

          if (isMulticolor) {
            const axisColors = getAxisColors();
            return createAxisGradient(ctx, cx, cy, radius, axisColors);
          } else {
            return hexToRGBA(chartColor, 0.65);
          }
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { display: false },
          grid: { color: '#ddd' },
          pointLabels: { color: '#333', font: { size: 14, style: 'italic' } }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

/* === DOM ELEMENTS === */
const powerInput = document.getElementById('powerInput');
const speedInput = document.getElementById('speedInput');
const trickInput = document.getElementById('trickInput');
const recoveryInput = document.getElementById('recoveryInput');
const defenseInput = document.getElementById('defenseInput');
const colorPicker = document.getElementById('colorPicker');
const multiBtn = document.getElementById('multiBtn');
const viewBtn = document.getElementById('viewBtn');

const axisColors = {
  powerColor: document.getElementById('powerColor'),
  speedColor: document.getElementById('speedColor'),
  trickColor: document.getElementById('trickColor'),
  recoveryColor: document.getElementById('recoveryColor'),
  defenseColor: document.getElementById('defenseColor')
};

/* === INIT === */
window.addEventListener('load', () => {
  const ctx1 = document.getElementById('radarChart1').getContext('2d');
  radar1 = makeRadar(ctx1);
});

/* === GET AXIS COLORS (default to ability color) === */
function getAxisColors() {
  return [
    axisColors.powerColor.value || colorPicker.value,
    axisColors.speedColor.value || colorPicker.value,
    axisColors.trickColor.value || colorPicker.value,
    axisColors.recoveryColor.value || colorPicker.value,
    axisColors.defenseColor.value || colorPicker.value
  ];
}

/* === UPDATE CHART === */
function updateChart() {
  const vals = [
    +powerInput.value || 0,
    +speedInput.value || 0,
    +trickInput.value || 0,
    +recoveryInput.value || 0,
    +defenseInput.value || 0
  ];

  chartColor = colorPicker.value;
  radar1.data.datasets[0].data = vals;
  radar1.data.datasets[0].borderColor = chartColor;
  radar1.update();
}

/* === MULTICOLOR TOGGLE === */
multiBtn.addEventListener('click', () => {
  isMulticolor = !isMulticolor;
  multiBtn.textContent = isMulticolor ? 'Single Color' : 'Multicolor';

  // Toggle visibility of axis color pickers
  Object.values(axisColors).forEach(el => {
    el.classList.toggle('hidden', !isMulticolor);
  });

  updateChart();
});

/* === EVENT LISTENERS === */
[powerInput, speedInput, trickInput, recoveryInput, defenseInput, colorPicker, ...Object.values(axisColors)]
  .forEach(el => {
    el.addEventListener('input', updateChart);
  });

viewBtn.addEventListener('click', () => {
  alert('Overlay chart still here, but omitted for brevity.');
});
