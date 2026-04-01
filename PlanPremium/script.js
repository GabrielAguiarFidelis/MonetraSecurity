/* ======================
   ESTADO GLOBAL
====================== */
let ganhos = JSON.parse(localStorage.getItem("ganhos")) || [];
let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
let grafico = null;

/* ======================
   ELEMENTOS DASHBOARD
====================== */
const totalGanhos = document.getElementById("totalGanhos");
const totalGastos = document.getElementById("totalGastos");
const lucro = document.getElementById("lucro");
const filtroMes = document.getElementById("filtroMes");

/* ======================
   NAVEGAÇÃO
====================== */
function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ======================
   SALVAR
====================== */
function salvar() {
  localStorage.setItem("ganhos", JSON.stringify(ganhos));
  localStorage.setItem("gastos", JSON.stringify(gastos));
  atualizar();
}

/* ======================
   ADICIONAR GANHO
====================== */
function addGanho() {
  const valorInput = document.getElementById("ganhoValor");
  const dataInput = document.getElementById("ganhoData");
  const descInput = document.getElementById("ganhoDesc");

  const valor = Number(valorInput.value);
  const data = dataInput?.value || new Date().toISOString().split("T")[0];
  const descricao = descInput?.value || "Ganho";

  if (!valor || valor <= 0) {
    alert("Informe um valor válido");
    return;
  }

  ganhos.push({
    id: Date.now(),
    valor,
    data,
    descricao,
  });

  valorInput.value = "";
  if (descInput) descInput.value = "";
  salvar();
  Swal.fire({
    icon: "success",
    title: "Sucesso!",
    text: "Ganho adicionado.",
    timer: 2000,
    showConfirmButton: false,
  });
}

/* ======================
   ADICIONAR GASTO
====================== */
function addGasto() {
  const valorInput = document.getElementById("gastoValor");
  const dataInput = document.getElementById("gastoData");
  const descInput = document.getElementById("gastoDesc");

  const valor = Number(valorInput.value);
  const data = dataInput?.value || new Date().toISOString().split("T")[0];
  const descricao = descInput?.value || "Gasto";

  if (!valor || valor <= 0) {
    alert("Informe um valor válido");
    return;
  }

  gastos.push({
    id: Date.now(),
    valor,
    data,
    descricao,
  });

  valorInput.value = "";
  if (descInput) descInput.value = "";
  salvar();
  Swal.fire({
    icon: "success",
    title: "Sucesso!",
    text: "Gasto adicionado.",
    timer: 2000,
    showConfirmButton: false,
  });
}

/* ======================
   ATUALIZAR DASHBOARD
====================== */
function atualizar() {
  const mesSelecionado = filtroMes?.value;

  const ganhosFiltrados = filtrarPorMes(ganhos, mesSelecionado);
  const gastosFiltrados = filtrarPorMes(gastos, mesSelecionado);

  const totalG = ganhosFiltrados.reduce((s, g) => s + Number(g.valor), 0);
  const totalGa = gastosFiltrados.reduce((s, g) => s + Number(g.valor), 0);

  totalGanhos.innerText = totalG.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  totalGastos.innerText = totalGa.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  lucro.innerText = (totalG - totalGa).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  renderListas();
  atualizarGrafico(mesSelecionado);
}

/* ======================
   FILTRO DE MÊS
====================== */
function filtrarPorMes(lista, mes) {
  if (!mes) return lista;

  return lista.filter((item) => item.data.startsWith(mes));
}

function filtrarParaListas(lista, mes) {
  if (!mes) return lista;

  const [ano, mesNum] = mes.split("-");

  return lista.filter((item) => {
    const data = new Date(item.data);
    return (
      data.getFullYear() === Number(ano) &&
      data.getMonth() === Number(mesNum) - 1
    );
  });
}

function definirMesAtual() {
  if (!filtroMes) return;

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  filtroMes.value = `${ano}-${mes}`;
}

/* ======================
   LISTAS (AGRUPADAS POR DIA)
====================== */
function renderListas() {
  const mesSelecionado = filtroMes?.value;

  const ganhosFiltrados = filtrarParaListas(ganhos, mesSelecionado);
  const gastosFiltrados = filtrarParaListas(gastos, mesSelecionado);

  renderLista("listaGanhos", ganhosFiltrados, "ganho");
  renderLista("listaGastos", gastosFiltrados, "gasto");
}

function renderLista(idLista, dados, tipo) {
  const lista = document.getElementById(idLista);
  if (!lista) return;

  lista.innerHTML = "";

  const agrupado = dados.reduce((acc, item) => {
    acc[item.data] = acc[item.data] || [];
    acc[item.data].push(item);
    return acc;
  }, {});

  Object.keys(agrupado)
    .sort()
    .reverse()
    .forEach((data) => {
      lista.innerHTML += `
        <li class="data-separador">
          📅 ${formatarData(data)}
        </li>
      `;

      agrupado[data].forEach((item) => {
        lista.innerHTML += `
          <li>
            <span>${item.descricao}</span>
            <strong>R$ ${Number(item.valor).toFixed(2)}</strong>
            <button onclick="excluir('${tipo}', ${item.id})">🗑</button>
          </li>
        `;
      });
    });
}

/* ======================
   EXCLUIR
====================== */
function excluir(tipo, id) {
  if (tipo === "ganho") {
    ganhos = ganhos.filter((g) => g.id !== id);
  } else {
    gastos = gastos.filter((g) => g.id !== id);
  }
  salvar();
  Swal.fire({
    icon: "success",
    title: "Sucesso!",
    text: "Apagado com sucesso.",
    timer: 2000,
    showConfirmButton: false,
  });
}

/* ======================
   UTIL
====================== */
function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* ======================
    CÁLCULO MÉDIA DIÁRIA
====================== */
function calcularMediaDiaria(gastosMes) {
  if (gastosMes.length === 0) return 0;

  const total = gastosMes.reduce((s, g) => s + Number(g.valor), 0);

  const diasUnicos = new Set(gastosMes.map((g) => g.data)).size;

  return total / diasUnicos;
}

/* ======================
   EVENTOS
====================== */
if (filtroMes) {
  filtroMes.addEventListener("change", atualizar);
}

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", () => {
  definirMesAtual();
  atualizar();
  showPage("dashboard");
});

/* ======================
   GRÁFICO MENSAL
====================== */
function agruparPorDia(lista, mes) {
  const dados = {};

  lista
    .filter((item) => !mes || item.data.startsWith(mes))
    .forEach((item) => {
      const dia = item.data.split("-")[2];
      dados[dia] = (dados[dia] || 0) + Number(item.valor);
    });

  return dados;
}

function atualizarGrafico(mesSelecionado) {
  const ctx = document.getElementById("graficoMensal");
  if (!ctx) return;

  const ganhosDia = agruparPorDia(ganhos, mesSelecionado);
  const gastosDia = agruparPorDia(gastos, mesSelecionado);

  const dias = Array.from(
    new Set([...Object.keys(ganhosDia), ...Object.keys(gastosDia)]),
  ).sort((a, b) => a - b);

  const dadosGanhos = dias.map((d) => ganhosDia[d] || 0);
  const dadosGastos = dias.map((d) => gastosDia[d] || 0);

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dias.map((d) => `Dia ${d}`),
      datasets: [
        {
          label: "Ganhos",
          data: dadosGanhos,
          backgroundColor: "#2ecc71",
        },
        {
          label: "Gastos",
          data: dadosGastos,
          backgroundColor: "#e74c3c",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
    },
  });
}
