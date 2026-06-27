const SUBJECTS = [
  "Matematica",
  "Portugues",
  "Historia",
  "Geografia",
  "Fisica",
  "Quimica",
  "Biologia",
  "Ingles",
  "Educacao_Fisica",
];

const SUBJECT_LABELS = {
  Matematica: "Matemática",
  Portugues: "Português",
  Historia: "História",
  Geografia: "Geografia",
  Fisica: "Física",
  Quimica: "Química",
  Biologia: "Biologia",
  Ingles: "Inglês",
  Educacao_Fisica: "Educação Física",
};

const CSV_FILE = "Nota Alunos.csv";

let STUDENTS = [];

const PERFORMANCE_LEVELS = [
  { id: "excelente", label: "Excelente (≥ 9.0)", min: 9.0, max: 10, color: "#43a047" },
  { id: "bom", label: "Bom (7.0 – 8.9)", min: 7.0, max: 8.99, color: "#26a69a" },
  { id: "regular", label: "Regular (5.0 – 6.9)", min: 5.0, max: 6.99, color: "#ff8a65" },
  { id: "insuficiente", label: "Insuficiente (< 5.0)", min: 0, max: 4.99, color: "#e53935" },
];
