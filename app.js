const CHAVE_STORAGE = "ads_estoque_dados_v1";

const ESTOQUE_PADRAO = [
  { id: 1, nome: "Mouse Sem Fio", categoria: "Periféricos", quantidade: 14, preco: 79.9 },
  { id: 2, nome: "Cabo HDMI 2.0", categoria: "Cabos", quantidade: 4, preco: 34.5 },
  { id: 3, nome: "SSD NVMe 500GB", categoria: "Armazenamento", quantidade: 8, preco: 249.0 }
];

let produtos = [];

const formProduto = document.getElementById("form-produto");
const tabelaEstoque = document.getElementById("tabela-estoque");
const inputBusca = document.getElementById("busca");
const btnResetar = document.getElementById("btn-resetar");

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function salvarNoStorage() {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(produtos));
}

async function carregarEstoqueInicial() {
  const salvo = localStorage.getItem(CHAVE_STORAGE);
  if (salvo) {
    produtos = JSON.parse(salvo);
    renderizar();
    return;
  }

  try {
    const resposta = await fetch("./estoque.json");
    if (!resposta.ok) throw new Error("Falha ao ler estoque.json");
    produtos = await resposta.json();
  } catch {
    // Fallback caso abra o index.html direto via file:// sem servidor local
    produtos = [...ESTOQUE_PADRAO];
  }

  salvarNoStorage();
  renderizar();
}

function atualizarResumo() {
  document.getElementById("total-itens").textContent = produtos.length;

  const unidades = produtos.reduce((acc, item) => acc + item.quantidade, 0);
  document.getElementById("total-unidades").textContent = unidades;

  const baixo = produtos.filter((item) => item.quantidade <= 5).length;
  document.getElementById("estoque-baixo").textContent = baixo;
}

function renderizar() {
  const termo = inputBusca.value.trim().toLowerCase();

  const filtrados = produtos.filter(
    (item) =>
      item.nome.toLowerCase().includes(termo) ||
      item.categoria.toLowerCase().includes(termo)
  );

  tabelaEstoque.innerHTML = "";

  if (filtrados.length === 0) {
    tabelaEstoque.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:#64748b;">
          Nenhum produto encontrado.
        </td>
      </tr>
    `;
  } else {
    filtrados.forEach((item) => {
      const subtotal = item.quantidade * item.preco;
      const alertaBaixo =
        item.quantidade <= 5 ? `<span class="tag-baixo">Baixo</span>` : "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${item.nome}</strong>${alertaBaixo}</td>
        <td>${item.categoria}</td>
        <td>${item.quantidade}</td>
        <td>${formatarMoeda(item.preco)}</td>
        <td>${formatarMoeda(subtotal)}</td>
        <td>
          <div class="acoes-linha">
            <button class="btn btn-mini" onclick="alterarQtd(${item.id}, 1)">+1</button>
            <button class="btn btn-mini" onclick="alterarQtd(${item.id}, -1)">-1</button>
            <button class="btn btn-remover" onclick="removerProduto(${item.id})">Excluir</button>
          </div>
        </td>
      `;
      tabelaEstoque.appendChild(tr);
    });
  }

  atualizarResumo();
}

function alterarQtd(id, delta) {
  const item = produtos.find((p) => p.id === id);
  if (!item) return;

  const novaQtd = item.quantidade + delta;
  if (novaQtd < 0) return;

  item.quantidade = novaQtd;
  salvarNoStorage();
  renderizar();
}

function removerProduto(id) {
  produtos = produtos.filter((p) => p.id !== id);
  salvarNoStorage();
  renderizar();
}

formProduto.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const quantidade = parseInt(document.getElementById("quantidade").value, 10);
  const preco = parseFloat(document.getElementById("preco").value);

  if (!nome || !categoria || Number.isNaN(quantidade) || Number.isNaN(preco)) {
    return;
  }

  const novoId =
    produtos.length > 0 ? Math.max(...produtos.map((p) => p.id)) + 1 : 1;

  produtos.push({
    id: novoId,
    nome,
    categoria,
    quantidade,
    preco
  });

  salvarNoStorage();
  renderizar();
  formProduto.reset();
  document.getElementById("quantidade").value = 1;
});

btnResetar.addEventListener("click", () => {
  localStorage.removeItem(CHAVE_STORAGE);
  produtos = [];
  carregarEstoqueInicial();
});

inputBusca.addEventListener("input", renderizar);

// Disponibiliza funções usadas nos botões da tabela
window.alterarQtd = alterarQtd;
window.removerProduto = removerProduto;

carregarEstoqueInicial();