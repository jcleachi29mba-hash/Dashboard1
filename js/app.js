const COLORS = {
  teal: "#26a69a",
  blue: "#3f51b5",
  orange: "#ff8a65",
  purple: "#9575cd",
  green: "#43a047",
  red: "#e53935",
};

const state = {
  performanceLevel: null,
  subject: null,
  student: null,
  search: "",
};

let charts = {};

function getPerformanceLevel(media) {
  return PERFORMANCE_LEVELS.find((l) => media >= l.min && media <= l.max);
}

function filterStudents() {
  return STUDENTS.filter((s) => {
    if (state.search && !s.nome.toLowerCase().includes(state.search.toLowerCase())) {
      return false;
    }
    if (state.student && s.nome !== state.student) return false;
    if (state.performanceLevel) {
      const level = getPerformanceLevel(s.Media);
      if (!level || level.id !== state.performanceLevel) return false;
    }
    return true;
  });
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function subjectAverages(students) {
  return SUBJECTS.map((sub) => ({
    subject: sub,
    label: SUBJECT_LABELS[sub],
    average: avg(students.map((s) => s[sub])),
  })).sort((a, b) => b.average - a.average);
}

function countByLevel(students) {
  return PERFORMANCE_LEVELS.map((level) => ({
    ...level,
    count: students.filter((s) => {
      const l = getPerformanceLevel(s.Media);
      return l && l.id === level.id;
    }).length,
  }));
}

function updateKPIs(students) {
  const total = students.length;
  const classAvg = avg(students.map((s) => s.Media));
  const approved = students.filter((s) => s.Media >= 7).length;
  const approvalRate = total ? ((approved / total) * 100).toFixed(1) : 0;

  const sorted = [...STUDENTS].sort((a, b) => b.Media - a.Media);
  const topStudent = sorted[0];

  const bestSubject = subjectAverages(STUDENTS)[0];

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-average").textContent = classAvg.toFixed(1);
  document.getElementById("kpi-approved").textContent = approved;
  document.getElementById("kpi-rate").textContent = approvalRate + "%";
  document.getElementById("kpi-top-student").textContent = topStudent.nome.split(" ")[0] + " " + topStudent.nome.split(" ").slice(-1)[0];
  document.getElementById("kpi-top-score").textContent = topStudent.Media.toFixed(1);
  document.getElementById("kpi-best-subject").textContent = SUBJECT_LABELS[bestSubject.subject];
  document.getElementById("kpi-best-subject-score").textContent = bestSubject.average.toFixed(1);
}

function updateFilterBadge() {
  const badge = document.getElementById("active-filter");
  const parts = [];

  if (state.performanceLevel) {
    const level = PERFORMANCE_LEVELS.find((l) => l.id === state.performanceLevel);
    parts.push(level.label);
  }
  if (state.subject) parts.push(SUBJECT_LABELS[state.subject]);
  if (state.student) parts.push(state.student);
  if (state.search) parts.push(`Busca: "${state.search}"`);

  if (parts.length) {
    badge.textContent = "Filtros ativos: " + parts.join(" · ");
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function setFilter(key, value) {
  if (key === "performanceLevel" || key === "student") {
    if (state[key] === value) {
      state[key] = null;
    } else {
      state[key] = value;
    }
  }
  render();
}

function resetFilters() {
  state.performanceLevel = null;
  state.subject = null;
  state.student = null;
  state.search = "";
  document.getElementById("search-input").value = "";
  document.getElementById("subject-filter").value = "";
  document.getElementById("level-filter").value = "";
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  render();
}

function highlightBarColors(values, threshold, aboveColor, belowColor) {
  return values.map((v) => (v >= threshold ? aboveColor : belowColor));
}

function createDonutChart(students) {
  const levels = countByLevel(students);
  const ctx = document.getElementById("chart-donut");

  if (charts.donut) charts.donut.destroy();

  charts.donut = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: levels.map((l) => l.label),
      datasets: [{
        data: levels.map((l) => l.count),
        backgroundColor: levels.map((l) => l.color),
        borderWidth: 2,
        borderColor: "#fff",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} aluno(s)`,
          },
        },
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        const level = PERFORMANCE_LEVELS[elements[0].index];
        setFilter("performanceLevel", level.id);
        document.getElementById("level-filter").value = level.id;
      },
    },
  });
}

function createSubjectChart(students) {
  const data = subjectAverages(students);
  const ctx = document.getElementById("chart-subjects");
  const maxAvg = Math.max(...data.map((d) => d.average));

  if (charts.subjects) charts.subjects.destroy();

  charts.subjects = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map((d) => d.label),
      datasets: [{
        label: "Média da Disciplina",
        data: data.map((d) => d.average),
        backgroundColor: data.map((d) =>
          d.average === maxAvg ? COLORS.green : d.average >= 7 ? COLORS.teal : COLORS.orange
        ),
        borderColor: data.map((d) => (d.subject === state.subject ? COLORS.purple : "transparent")),
        borderWidth: data.map((d) => (d.subject === state.subject ? 3 : 0)),
        borderRadius: 4,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { min: 0, max: 10, grid: { color: "#f0f0f0" } },
        y: { grid: { display: false } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Média: ${ctx.raw.toFixed(1)}`,
          },
        },
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        const subject = data[elements[0].index].subject;
        if (state.subject === subject) {
          state.subject = null;
          document.getElementById("subject-filter").value = "";
        } else {
          state.subject = subject;
          document.getElementById("subject-filter").value = subject;
        }
        render();
      },
    },
  });
}

function createStudentsChart(students) {
  const metric = state.subject || "Media";
  const metricLabel = state.subject ? SUBJECT_LABELS[state.subject] : "Média Geral";
  const sorted = [...students].sort((a, b) => b[metric] - a[metric]).slice(0, 15);
  const ctx = document.getElementById("chart-students");

  if (charts.students) charts.students.destroy();

  charts.students = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map((s) => {
        const parts = s.nome.split(" ");
        return parts[0] + " " + parts[parts.length - 1];
      }),
      datasets: [{
        label: metricLabel,
        data: sorted.map((s) => s[metric]),
        backgroundColor: sorted.map((s) =>
          s[metric] >= 9 ? COLORS.green : s[metric] >= 7 ? COLORS.teal : COLORS.orange
        ),
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 10, grid: { color: "#f0f0f0" } },
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, font: { size: 10 } } },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => sorted[items[0].dataIndex].nome,
            label: (ctx) => ` Média: ${ctx.raw.toFixed(1)}`,
          },
        },
      },
      onClick: (_, elements) => {
        if (!elements.length) return;
        setFilter("student", sorted[elements[0].index].nome);
      },
    },
  });
}

function createRadarChart(students) {
  const ctx = document.getElementById("chart-radar");
  const avgs = subjectAverages(students);

  if (charts.radar) charts.radar.destroy();

  const datasets = [];

  if (state.student) {
    const s = students.find((st) => st.nome === state.student) || STUDENTS.find((st) => st.nome === state.student);
    if (s) {
      datasets.push({
        label: s.nome.split(" ").slice(0, 2).join(" "),
        data: SUBJECTS.map((sub) => s[sub]),
        borderColor: COLORS.teal,
        backgroundColor: "rgba(38, 166, 154, 0.15)",
        pointBackgroundColor: COLORS.teal,
        borderWidth: 2,
      });
    }
  }

  datasets.push({
    label: "Média da Turma",
    data: avgs.map((a) => a.average),
    borderColor: COLORS.blue,
    backgroundColor: "rgba(63, 81, 181, 0.08)",
    pointBackgroundColor: COLORS.blue,
    borderWidth: 2,
    borderDash: state.student ? [5, 5] : [],
  });

  charts.radar = new Chart(ctx, {
    type: "radar",
    data: {
      labels: SUBJECTS.map((s) => SUBJECT_LABELS[s]),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2 },
          grid: { color: "#e5e7eb" },
        },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

function renderTopList(students) {
  const list = document.getElementById("top-list");
  const metric = state.subject || "Media";
  const sorted = [...students].sort((a, b) => b[metric] - a[metric]).slice(0, 8);

  list.innerHTML = sorted
    .map((s, i) => {
      const rankClass = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "default";
      const score = s[metric];
      const scoreClass = score >= 9 ? "excellent" : "";
      const selected = state.student === s.nome ? "selected" : "";
      return `
        <li class="${selected}" data-student="${s.nome}">
          <span class="name">
            <span class="rank ${rankClass}">${i + 1}</span>
            ${s.nome}
          </span>
          <span class="score ${scoreClass}">${score.toFixed(1)}</span>
        </li>`;
    })
    .join("");

  list.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      setFilter("student", li.dataset.student);
    });
  });
}

function render() {
  const students = filterStudents();
  updateKPIs(students);
  updateFilterBadge();
  createDonutChart(students);
  createSubjectChart(students);
  createStudentsChart(students);
  createRadarChart(students);
  renderTopList(students);

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.level === state.performanceLevel);
  });
}

function initFilters() {
  const subjectSelect = document.getElementById("subject-filter");
  SUBJECTS.forEach((sub) => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = SUBJECT_LABELS[sub];
    subjectSelect.appendChild(opt);
  });

  subjectSelect.addEventListener("change", (e) => {
    state.subject = e.target.value || null;
    render();
  });

  document.getElementById("level-filter").addEventListener("change", (e) => {
    state.performanceLevel = e.target.value || null;
    render();
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setFilter("performanceLevel", btn.dataset.level);
      document.getElementById("level-filter").value = state.performanceLevel || "";
    });
  });

  document.getElementById("btn-reset").addEventListener("click", resetFilters);
}

document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  render();
});
