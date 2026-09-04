// lógica da tela: navegação, listagem/busca, cadastro, edição
// (manda PUT ou PATCH dependendo do que foi alterado), exclusão e indicadores

// rótulo, cor e ícone de cada status
const STATUS_INFO = {
  EM_ANALISE: { rotulo: "Em análise", cor: "var(--status-analise)", icone: iconeRelogio() },
  APROVADO: { rotulo: "Aprovado", cor: "var(--status-aprovado)", icone: iconeCheck() },
  REPROVADO: { rotulo: "Reprovado", cor: "var(--status-reprovado)", icone: iconeX() },
  CONTRATADO: { rotulo: "Contratado", cor: "var(--status-contratado)", icone: iconeEstrela() },
};

// Estado da aplicação
const estado = {
  filtros: { q: "", status: "" },
  funcionarioEmEdicao: null,
  funcionarioParaExcluir: null,
};

// Referências de elementos
const el = {
  sidebar: document.querySelector(".sidebar"),
  sidebarScrim: document.querySelector(".sidebar-scrim"),
  mobileMenuBtn: document.querySelector(".mobile-menu-btn"),
  navLinks: document.querySelectorAll(".nav-link"),
  views: document.querySelectorAll(".view"),
  topbarEyebrow: document.getElementById("topbar-eyebrow"),
  topbarTitle: document.getElementById("topbar-title"),
  topbarDesc: document.getElementById("topbar-desc"),

  buscaInput: document.getElementById("busca-input"),
  chipFiltros: document.querySelectorAll("[data-status-chip]"),
  btnLimparFiltros: document.getElementById("btn-limpar-filtros"),

  listCount: document.getElementById("list-count"),
  tableBody: document.getElementById("table-body"),
  listCards: document.getElementById("list-cards"),
  loadingState: document.getElementById("loading-state"),
  emptyState: document.getElementById("empty-state"),
  errorState: document.getElementById("error-state"),
  errorMessage: document.getElementById("error-message"),
  btnRetry: document.getElementById("btn-retry"),
  listCard: document.getElementById("list-card"),

  formCadastro: document.getElementById("form-cadastro"),
  formCadastroBanner: document.getElementById("form-cadastro-banner"),
  formCadastroBannerTexto: document.getElementById("form-cadastro-banner-texto"),
  btnCadastrarSubmit: document.getElementById("btn-cadastrar-submit"),
  btnCadastrarCancelar: document.getElementById("btn-cadastrar-cancelar"),

  modalEditar: document.getElementById("modal-editar"),
  formEditar: document.getElementById("form-editar"),
  formEditarBanner: document.getElementById("form-editar-banner"),
  formEditarBannerTexto: document.getElementById("form-editar-banner-texto"),
  btnEditarSalvar: document.getElementById("btn-editar-salvar"),

  modalExcluir: document.getElementById("modal-excluir"),
  excluirNomeFuncionario: document.getElementById("excluir-nome-funcionario"),
  btnConfirmarExclusao: document.getElementById("btn-confirmar-exclusao"),

  toastRegion: document.getElementById("toast-region"),

  indicadorTotal: document.getElementById("indicador-total"),
  indicadorAnalise: document.getElementById("indicador-analise"),
  indicadorAprovado: document.getElementById("indicador-aprovado"),
  indicadorReprovado: document.getElementById("indicador-reprovado"),
  indicadorContratado: document.getElementById("indicador-contratado"),
  distribuicao: document.getElementById("distribuicao"),

  btnNovoFuncionarioVazio: document.getElementById("btn-novo-funcionario-vazio"),
};

// Navegação entre telas
const TITULOS_VIEW = {
  painel: { eyebrow: "Contratação de funcionários", titulo: "Painel de indicadores", desc: "Visão geral do processo seletivo em andamento." },
  funcionarios: { eyebrow: "Contratação de funcionários", titulo: "Funcionários", desc: "Consulte, edite e gerencie os candidatos cadastrados." },
  cadastro: { eyebrow: "Contratação de funcionários", titulo: "Cadastrar funcionário", desc: "Preencha os dados para adicionar um novo candidato." },
};

function irParaView(nomeView) {
  el.views.forEach((v) => v.classList.toggle("active", v.dataset.view === nomeView));
  el.navLinks.forEach((n) => {
    const ativo = n.dataset.navTarget === nomeView;
    n.classList.toggle("active", ativo);
    n.setAttribute("aria-current", ativo ? "page" : "false");
  });

  const info = TITULOS_VIEW[nomeView];
  el.topbarEyebrow.textContent = info.eyebrow;
  el.topbarTitle.textContent = info.titulo;
  el.topbarDesc.textContent = info.desc;

  fecharMenuMobile();
  document.getElementById("main-content").focus({ preventScroll: true });

  if (nomeView === "painel") carregarIndicadores();
  if (nomeView === "funcionarios") carregarListagem();
  if (nomeView === "cadastro") resetarFormCadastro();
}

el.navLinks.forEach((link) => {
  link.addEventListener("click", () => irParaView(link.dataset.navTarget));
});

function abrirMenuMobile() {
  el.sidebar.classList.add("open");
  el.sidebarScrim.style.display = "block";
}
function fecharMenuMobile() {
  el.sidebar.classList.remove("open");
  el.sidebarScrim.style.display = "none";
}
el.mobileMenuBtn?.addEventListener("click", abrirMenuMobile);
el.sidebarScrim?.addEventListener("click", fecharMenuMobile);

// Toasts (feedback de ações)
function mostrarToast(mensagem, tipo = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    ${tipo === "success" ? iconeCheckCirculo() : iconeAlerta()}
    <span>${escaparHtml(mensagem)}</span>
    <button type="button" aria-label="Fechar aviso">${iconeFechar()}</button>
  `;
  el.toastRegion.appendChild(toast);
  toast.querySelector("button").addEventListener("click", () => toast.remove());
  const duracao = tipo === "error" ? 7000 : 4500;
  setTimeout(() => toast.remove(), duracao);
}

// Listagem de funcionários (GET /funcionarios)
let carregamentoAtual = 0;

async function carregarListagem() {
  const idCarregamento = ++carregamentoAtual;
  mostrarEstadoLista("carregando");

  try {
    const funcionarios = await ApiFuncionarios.listarTodos(estado.filtros);
    if (idCarregamento !== carregamentoAtual) return; // resposta obsoleta (ex: filtro mudou)

    if (!funcionarios || funcionarios.length === 0) {
      mostrarEstadoLista("vazio");
      return;
    }
    renderizarListagem(funcionarios);
    mostrarEstadoLista("conteudo");
  } catch (erro) {
    if (idCarregamento !== carregamentoAtual) return;
    el.errorMessage.textContent =
      erro.message || "Não foi possível carregar os funcionários. Verifique sua conexão e tente novamente.";
    mostrarEstadoLista("erro");
  }
}

function mostrarEstadoLista(qual) {
  el.loadingState.classList.toggle("active", qual === "carregando");
  el.emptyState.classList.toggle("active", qual === "vazio");
  el.errorState.classList.toggle("active", qual === "erro");
  el.listCard.style.display = qual === "conteudo" ? "" : "none";
}

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
}

function formatarSalario(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function badgeStatus(status) {
  const info = STATUS_INFO[status] || { rotulo: status, icone: "" };
  return `<span class="status-badge status-${status}">${info.icone}${escaparHtml(info.rotulo)}</span>`;
}

function renderizarListagem(funcionarios) {
  el.listCount.innerHTML = `<strong>${funcionarios.length}</strong> ${funcionarios.length === 1 ? "funcionário encontrado" : "funcionários encontrados"}`;

  // Tabela (desktop/tablet)
  el.tableBody.innerHTML = funcionarios
    .map(
      (f) => `
    <tr>
      <td>
        <div class="name-cell">
          <span class="avatar">${escaparHtml(iniciais(f.nome))}</span>
          <span class="who"><strong>${escaparHtml(f.nome)}</strong><span>${escaparHtml(f.email || "")}</span></span>
        </div>
      </td>
      <td>${escaparHtml(f.cargo || "—")}</td>
      <td>${escaparHtml(f.departamento || "—")}</td>
      <td>${escaparHtml(f.cidade || "—")}</td>
      <td>${formatarSalario(f.salario)}</td>
      <td>${badgeStatus(f.status)}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn-icon" data-acao="editar" data-id="${f.id}" aria-label="Editar ${escaparHtml(f.nome)}" title="Editar">${iconeLapis()}</button>
          <button type="button" class="btn-icon danger" data-acao="excluir" data-id="${f.id}" aria-label="Excluir ${escaparHtml(f.nome)}" title="Excluir">${iconeLixeira()}</button>
        </div>
      </td>
    </tr>`
    )
    .join("");

  // Cards (mobile)
  el.listCards.innerHTML = funcionarios
    .map(
      (f) => `
    <div class="employee-card">
      <div class="top-row">
        <div class="name-cell">
          <span class="avatar">${escaparHtml(iniciais(f.nome))}</span>
          <span class="who"><strong>${escaparHtml(f.nome)}</strong><span>${escaparHtml(f.cargo || "—")}</span></span>
        </div>
        ${badgeStatus(f.status)}
      </div>
      <div class="meta-grid">
        <div>Departamento<br><strong>${escaparHtml(f.departamento || "—")}</strong></div>
        <div>Cidade<br><strong>${escaparHtml(f.cidade || "—")}</strong></div>
        <div>Salário<br><strong>${formatarSalario(f.salario)}</strong></div>
        <div>E-mail<br><strong>${escaparHtml(f.email || "—")}</strong></div>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-secondary btn-sm" data-acao="editar" data-id="${f.id}">${iconeLapis()} Editar</button>
        <button type="button" class="btn btn-icon danger" data-acao="excluir" data-id="${f.id}" aria-label="Excluir ${escaparHtml(f.nome)}">${iconeLixeira()}</button>
      </div>
    </div>`
    )
    .join("");

  cacheFuncionarios = funcionarios;
}

let cacheFuncionarios = [];

document.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-acao]");
  if (!botao) return;
  const id = Number(botao.dataset.id);

  if (botao.dataset.acao === "editar") abrirModalEditar(id, botao);
  if (botao.dataset.acao === "excluir") {
    const funcionario = cacheFuncionarios.find((f) => f.id === id);
    if (funcionario) abrirModalExcluir(funcionario);
  }
});

// Busca e filtros
let debounceBusca;
el.buscaInput?.addEventListener("input", (e) => {
  clearTimeout(debounceBusca);
  debounceBusca = setTimeout(() => {
    estado.filtros.q = e.target.value.trim();
    carregarListagem();
  }, 300);
});

el.chipFiltros.forEach((chip) => {
  chip.addEventListener("click", () => {
    const valor = chip.dataset.statusChip;
    estado.filtros.status = valor;
    el.chipFiltros.forEach((c) => c.classList.toggle("active", c === chip));
    carregarListagem();
  });
});

el.btnLimparFiltros?.addEventListener("click", () => {
  estado.filtros = { q: "", status: "" };
  el.buscaInput.value = "";
  el.chipFiltros.forEach((c) => c.classList.toggle("active", c.dataset.statusChip === ""));
  carregarListagem();
});

el.btnRetry?.addEventListener("click", carregarListagem);
el.btnNovoFuncionarioVazio?.addEventListener("click", () => irParaView("cadastro"));

// Validação de formulário (prevenção de erros)
function validarCampo(form, nomeCampo, regras) {
  const campoWrap = form.querySelector(`[data-field="${nomeCampo}"]`);
  const input = form.elements[nomeCampo];
  const erroEl = campoWrap.querySelector(".field-error");
  let mensagem = "";

  const valor = input.value.trim();
  if (regras.obrigatorio && !valor) {
    mensagem = regras.mensagemObrigatorio || "Este campo é obrigatório.";
  } else if (valor && regras.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    mensagem = "Informe um e-mail válido (ex: nome@empresa.com).";
  } else if (valor && regras.numeroPositivo && (isNaN(valor) || Number(valor) < 0)) {
    mensagem = "Informe um valor numérico válido, maior ou igual a zero.";
  } else if (valor && regras.telefone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(valor)) {
    mensagem = "Informe um telefone válido, com DDD (ex: (11) 91234-5678).";
  }

  campoWrap.classList.toggle("has-error", Boolean(mensagem));
  if (erroEl) erroEl.textContent = mensagem;
  return !mensagem;
}

function validarFormFuncionario(form) {
  const nomeOk = validarCampo(form, "nome", { obrigatorio: true, mensagemObrigatorio: "Informe o nome completo do candidato." });
  const emailOk = validarCampo(form, "email", { obrigatorio: true, email: true, mensagemObrigatorio: "Informe o e-mail do candidato." });
  const cargoOk = validarCampo(form, "cargo", { obrigatorio: true, mensagemObrigatorio: "Informe o cargo pretendido." });
  const salarioOk = validarCampo(form, "salario", { numeroPositivo: true });
  const telefoneOk = validarCampo(form, "telefone", { telefone: true });
  return nomeOk && emailOk && cargoOk && salarioOk && telefoneOk;
}

// máscara (11) 91234-5678 aplicada enquanto a pessoa digita
function mascararTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos.replace(/^(\d*)/, "($1");
  if (digitos.length <= 6) return digitos.replace(/^(\d{2})(\d*)/, "($1) $2");
  if (digitos.length <= 10) return digitos.replace(/^(\d{2})(\d{4})(\d*)/, "($1) $2-$3");
  return digitos.replace(/^(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
}

function aplicarMascaraTelefone(input) {
  input?.addEventListener("input", () => {
    input.value = mascararTelefone(input.value);
  });
}
aplicarMascaraTelefone(document.getElementById("cad-telefone"));
aplicarMascaraTelefone(document.getElementById("edit-telefone"));

function limparErrosForm(form) {
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
}

function extrairDadosForm(form) {
  const dados = Object.fromEntries(new FormData(form).entries());
  if (dados.salario === "") delete dados.salario;
  else if (dados.salario !== undefined) dados.salario = Number(dados.salario);
  if (dados.telefone) dados.telefone = dados.telefone.replace(/\D/g, "");
  Object.keys(dados).forEach((k) => {
    if (typeof dados[k] === "string") dados[k] = dados[k].trim();
    if (dados[k] === "") delete dados[k];
  });
  return dados;
}

// Cadastro (POST /funcionarios)
function resetarFormCadastro() {
  el.formCadastro.reset();
  limparErrosForm(el.formCadastro);
  el.formCadastroBanner.classList.remove("active");
}

el.formCadastro?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  el.formCadastroBanner.classList.remove("active");

  if (!validarFormFuncionario(el.formCadastro)) {
    el.formCadastro.querySelector(".has-error input, .has-error select")?.focus();
    return;
  }

  definirCarregandoBotao(el.btnCadastrarSubmit, true, "Cadastrando...");
  try {
    const dados = extrairDadosForm(el.formCadastro);
    if (!dados.status) dados.status = "EM_ANALISE";
    await ApiFuncionarios.cadastrar(dados);
    mostrarToast("Funcionário cadastrado com sucesso.", "success");
    resetarFormCadastro();
    irParaView("funcionarios");
  } catch (erro) {
    el.formCadastroBannerTexto.textContent =
      erro.message || "Não foi possível cadastrar o funcionário. Verifique os campos obrigatórios e tente novamente.";
    el.formCadastroBanner.classList.add("active");
  } finally {
    definirCarregandoBotao(el.btnCadastrarSubmit, false, "Cadastrar funcionário");
  }
});

el.btnCadastrarCancelar?.addEventListener("click", () => {
  resetarFormCadastro();
  irParaView("funcionarios");
});

// Editar funcionário — busca os dados atuais por id (GET /funcionarios/{id})
// antes de abrir o formulário, pra não editar em cima de dados desatualizados
const CAMPOS_EDITAVEIS = ["nome", "email", "telefone", "cargo", "departamento", "salario", "cidade", "status"];

async function abrirModalEditar(id, botaoOrigem) {
  if (botaoOrigem) botaoOrigem.disabled = true;
  try {
    const funcionario = await ApiFuncionarios.buscarPorId(id);
    estado.funcionarioEmEdicao = funcionario;

    const form = el.formEditar;
    form.reset();
    limparErrosForm(form);
    el.formEditarBanner.classList.remove("active");

    form.elements.id.value = funcionario.id;
    form.elements.nome.value = funcionario.nome || "";
    form.elements.email.value = funcionario.email || "";
    form.elements.telefone.value = mascararTelefone(funcionario.telefone || "");
    form.elements.cargo.value = funcionario.cargo || "";
    form.elements.departamento.value = funcionario.departamento || "";
    form.elements.salario.value = funcionario.salario ?? "";
    form.elements.cidade.value = funcionario.cidade || "";
    form.elements.status.value = funcionario.status || "EM_ANALISE";

    document.getElementById("editar-titulo-funcionario").textContent = funcionario.nome;
    abrirModal(el.modalEditar);
  } catch (erro) {
    mostrarToast(erro.message || "Não foi possível abrir os dados do funcionário.", "error");
  } finally {
    if (botaoOrigem) botaoOrigem.disabled = false;
  }
}

el.formEditar?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  el.formEditarBanner.classList.remove("active");

  if (!validarFormFuncionario(el.formEditar)) return;

  definirCarregandoBotao(el.btnEditarSalvar, true, "Salvando...");
  try {
    const dados = extrairDadosForm(el.formEditar);
    const original = estado.funcionarioEmEdicao;
    const alterados = CAMPOS_EDITAVEIS.filter(
      (campo) => String(dados[campo] ?? "") !== String(original[campo] ?? "")
    );

    if (alterados.length === 0) {
      fecharModal(el.modalEditar);
      return;
    }

    if (alterados.length === CAMPOS_EDITAVEIS.length) {
      // todos os campos mudaram: substitui o registro inteiro
      await ApiFuncionarios.atualizarCompleto(original.id, dados);
    } else {
      // só parte mudou: manda apenas o que foi alterado
      const parcial = {};
      alterados.forEach((campo) => (parcial[campo] = dados[campo]));
      await ApiFuncionarios.atualizarParcial(original.id, parcial);
    }

    mostrarToast("Alterações salvas com sucesso.", "success");
    fecharModal(el.modalEditar);
    carregarListagem();
  } catch (erro) {
    el.formEditarBannerTexto.textContent = erro.message || "Não foi possível salvar as alterações. Tente novamente.";
    el.formEditarBanner.classList.add("active");
  } finally {
    definirCarregandoBotao(el.btnEditarSalvar, false, "Salvar alterações");
  }
});

// Exclusão (DELETE /funcionarios/{id})
function abrirModalExcluir(funcionario) {
  estado.funcionarioParaExcluir = funcionario;
  el.excluirNomeFuncionario.textContent = funcionario.nome;
  abrirModal(el.modalExcluir);
}

el.btnConfirmarExclusao?.addEventListener("click", async () => {
  definirCarregandoBotao(el.btnConfirmarExclusao, true, "Excluindo...");
  try {
    await ApiFuncionarios.excluir(estado.funcionarioParaExcluir.id);
    mostrarToast("Funcionário excluído com sucesso.", "success");
    fecharModal(el.modalExcluir);
    carregarListagem();
  } catch (erro) {
    mostrarToast(erro.message || "Não foi possível excluir o funcionário.", "error");
  } finally {
    definirCarregandoBotao(el.btnConfirmarExclusao, false, "Excluir funcionário");
  }
});

// Painel de indicadores
async function carregarIndicadores() {
  try {
    const funcionarios = await ApiFuncionarios.listarTodos({});
    const contagem = { EM_ANALISE: 0, APROVADO: 0, REPROVADO: 0, CONTRATADO: 0 };
    funcionarios.forEach((f) => { if (contagem[f.status] !== undefined) contagem[f.status]++; });
    const total = funcionarios.length;

    el.indicadorTotal.textContent = total;
    el.indicadorAnalise.textContent = contagem.EM_ANALISE;
    el.indicadorAprovado.textContent = contagem.APROVADO;
    el.indicadorReprovado.textContent = contagem.REPROVADO;
    el.indicadorContratado.textContent = contagem.CONTRATADO;

    el.distribuicao.innerHTML = Object.entries(contagem)
      .map(([status, qtd]) => {
        const info = STATUS_INFO[status];
        const pct = total > 0 ? Math.round((qtd / total) * 100) : 0;
        return `
        <div class="distribution-row">
          <span class="distribution-label"><span class="status-dot" style="background:${info.cor}"></span>${info.rotulo}</span>
          <span class="distribution-track"><span class="distribution-fill" style="width:${pct}%; background:${info.cor}"></span></span>
          <span class="distribution-count">${qtd}</span>
        </div>`;
      })
      .join("");
  } catch (erro) {
    mostrarToast(erro.message || "Não foi possível carregar os indicadores.", "error");
  }
}

// Modais (fecha por X, clicando fora ou Esc)
let ultimoElementoFocado = null;

function abrirModal(modalOverlay) {
  ultimoElementoFocado = document.activeElement;
  modalOverlay.classList.add("active");
  const primeiroFocavel = modalOverlay.querySelector("input, select, textarea, button");
  primeiroFocavel?.focus();
}

function fecharModal(modalOverlay) {
  modalOverlay.classList.remove("active");
  ultimoElementoFocado?.focus();
}

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal(overlay);
  });
  overlay.querySelectorAll("[data-fechar-modal]").forEach((btn) => {
    btn.addEventListener("click", () => fecharModal(overlay));
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.active").forEach((m) => fecharModal(m));
  }
});

// Utilidades
function definirCarregandoBotao(botao, carregando, texto) {
  botao.disabled = carregando;
  botao.innerHTML = carregando ? `<span class="spinner" aria-hidden="true"></span> ${texto}` : texto;
}

function escaparHtml(valor) {
  const div = document.createElement("div");
  div.textContent = valor ?? "";
  return div.innerHTML;
}

function iconeRelogio() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`; }
function iconeCheck() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`; }
function iconeX() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>`; }
function iconeEstrela() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>`; }
function iconeLapis() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`; }
function iconeLixeira() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`; }
function iconeCheckCirculo() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`; }
function iconeAlerta() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>`; }
function iconeFechar() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`; }

// Inicialização
irParaView("funcionarios");
