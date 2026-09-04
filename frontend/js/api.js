// chamadas HTTP pra API do Spring Boot (POST, GET, PUT, PATCH, DELETE)

const API_BASE_URL = "http://localhost:8081/funcionarios";

// depois desse tempo sem resposta, desiste e mostra erro
const TEMPO_LIMITE_MS = 4000;

class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

async function requisitar(caminho, opcoes = {}) {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(caminho, {
      ...opcoes,
      signal: controlador.signal,
      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
    });

    if (resposta.status === 204) return null;

    let corpo = null;
    const texto = await resposta.text();
    if (texto) {
      try { corpo = JSON.parse(texto); } catch { corpo = texto; }
    }

    if (!resposta.ok) {
      const mensagem =
        (corpo && (corpo.mensagem || corpo.message)) ||
        "Não foi possível concluir a operação. Tente novamente.";
      throw new ErroApi(mensagem, resposta.status);
    }

    return corpo;
  } catch (erro) {
    if (erro.name === "AbortError") {
      throw new ErroApi("O servidor demorou para responder.", 0);
    }
    if (erro instanceof ErroApi) throw erro;
    // Falha de rede (API fora do ar, CORS não configurado, etc.)
    throw new ErroApi("Não foi possível conectar à API.", 0);
  } finally {
    clearTimeout(timeout);
  }
}

const ApiFuncionarios = {
  // POST /funcionarios
  cadastrar(dados) {
    return requisitar(API_BASE_URL, { method: "POST", body: JSON.stringify(dados) });
  },

  // GET /funcionarios?q=&status=
  listarTodos(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.q) params.set("q", filtros.q);
    if (filtros.status) params.set("status", filtros.status);
    const query = params.toString();
    return requisitar(`${API_BASE_URL}${query ? `?${query}` : ""}`, { method: "GET" });
  },

  // GET /funcionarios/{id}
  buscarPorId(id) {
    return requisitar(`${API_BASE_URL}/${id}`, { method: "GET" });
  },

  // PUT /funcionarios/{id}
  atualizarCompleto(id, dados) {
    return requisitar(`${API_BASE_URL}/${id}`, { method: "PUT", body: JSON.stringify(dados) });
  },

  // PATCH /funcionarios/{id}
  atualizarParcial(id, dados) {
    return requisitar(`${API_BASE_URL}/${id}`, { method: "PATCH", body: JSON.stringify(dados) });
  },

  // DELETE /funcionarios/{id}
  excluir(id) {
    return requisitar(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  },
};
