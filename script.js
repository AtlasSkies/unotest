let chartList = [];
let radar2, radar2Ready = false;
let chartColor = "#92dfec";
let multiColorMode = false;

function hexToRGBA(hex, alpha) {
  if (!hex) hex = "#92dfec";
  if (hex.startsWith("rgb")) return hex.replace(")", `, ${alpha})`).replace("rgb", "rgba");
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function makeConicGradient(chart, axisColors, alpha = 0.65) {
  const r = chart.scales.r;
  const ctx = chart.ctx;
  const cx = r.xCenter, cy = r.yCenter;
  const N = chart.data.labels.length;
  const grad = ctx.createConicGradient(-Math.PI / 2, cx, cy);
  for (let i = 0; i <= N; i++) grad.addColorStop(i / N, hexToRGBA(axisColors[i % N], alpha));
  return grad;
}

function makeRadar(ctx, color, data) {
  return new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Power", "Speed", "Trick", "Recovery", "Defense"],
      datasets: [{
        data: data || [0, 0, 0, 0, 0],
        backgroundColor: hexToRGBA(color, 0.35),
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: "#fff",
        pointBorderColor: color,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          grid: { display: false },
          angleLines: { color: "#6db5c0", lineWidth: 1 },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { display: false },
          pointLabels: { color: "transparent" }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// DOM elements
const chartArea = document.getElementById("chartArea");
const addChartBtn = document.getElementById("addChartBtn");
const colorPicker = document.getElementById("colorPicker");
const powerInput = document.getElementById("powerInput");
const speedInput = document.getElementById("speedInput");
const trickInput = document.getElementById("trickInput");
const recoveryInput = document.getElementById("recoveryInput");
const defenseInput = document.getElementById("defenseInput");

window.addEventListener("load", () => {
  const ctx = document.getElementById("radarChart1").getContext("2d");
  const baseChart = makeRadar(ctx, chartColor, [0, 0, 0, 0, 0]);
  chartList.push(baseChart);
});

addChartBtn.addEventListener("click", () => {
  const newCanvas = document.createElement("canvas");
  newCanvas.classList.add("stacked-chart");
  chartArea.appendChild(newCanvas);
  const ctx = newCanvas.getContext("2d");
  const hue = Math.floor(Math.random() * 360);
  const randColor = `hsl(${hue}, 70%, 55%)`;
  const data = [
    +powerInput.value || 0,
    +speedInput.value || 0,
    +trickInput.value || 0,
    +recoveryInput.value || 0,
    +defenseInput.value || 0
  ];
  const newChart = makeRadar(ctx, randColor, data);
  chartList.push(newChart);
});

function updateCharts() {
  const vals = [
    +powerInput.value || 0,
    +speedInput.value || 0,
    +trickInput.value || 0,
    +recoveryInput.value || 0,
    +defenseInput.value || 0
  ];
  chartColor = colorPicker.value;
  chartList.forEach(c => {
    c.data.datasets[0].data = vals;
    c.data.datasets[0].borderColor = chartColor;
    c.data.datasets[0].backgroundColor = hexToRGBA(chartColor, 0.35);
    c.update();
  });
}

[powerInput, speedInput, trickInput, recoveryInput, defenseInput, colorPicker]
  .forEach(el => el.addEventListener("input", updateCharts));
