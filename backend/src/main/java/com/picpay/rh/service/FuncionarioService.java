package com.picpay.rh.service;

import com.picpay.rh.exception.FuncionarioNaoEncontradoException;
import com.picpay.rh.model.Funcionario;
import com.picpay.rh.model.StatusFuncionario;
import com.picpay.rh.storage.FuncionarioStorage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class FuncionarioService {

    private static final Pattern EMAIL_REGEX = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final FuncionarioStorage storage;

    public FuncionarioService(FuncionarioStorage storage) {
        this.storage = storage;
    }

    public Funcionario cadastrar(Funcionario funcionario) {
        if (vazio(funcionario.getNome()) || vazio(funcionario.getEmail()) || vazio(funcionario.getCargo())) {
            throw new IllegalArgumentException("Nome, email e cargo sao obrigatorios.");
        }
        validarEmail(funcionario.getEmail());
        validarTelefone(funcionario.getTelefone());
        validarSalario(funcionario.getSalario());

        if (funcionario.getStatus() == null) {
            funcionario.setStatus(StatusFuncionario.EM_ANALISE);
        }
        funcionario.setId(storage.gerarProximoId());
        storage.getFuncionarios().add(funcionario);
        return funcionario;
    }

    public List<Funcionario> listarTodos(String q, String status) {
        List<Funcionario> resultado = new ArrayList<>();
        for (Funcionario f : storage.getFuncionarios()) {
            boolean bateBusca = q == null || q.isBlank()
                    || f.getNome().toLowerCase().contains(q.toLowerCase())
                    || f.getCargo().toLowerCase().contains(q.toLowerCase());
            boolean bateStatus = status == null || status.isBlank()
                    || f.getStatus().name().equalsIgnoreCase(status);
            if (bateBusca && bateStatus) {
                resultado.add(f);
            }
        }
        return resultado;
    }

    public Funcionario buscarPorId(Long id) {
        for (Funcionario f : storage.getFuncionarios()) {
            if (f.getId().equals(id)) {
                return f;
            }
        }
        throw new FuncionarioNaoEncontradoException(id);
    }

    public Funcionario atualizarCompleto(Long id, Funcionario dados) {
        Funcionario existente = buscarPorId(id);
        if (vazio(dados.getNome()) || vazio(dados.getEmail()) || vazio(dados.getCargo())) {
            throw new IllegalArgumentException("Nome, email e cargo sao obrigatorios.");
        }
        validarEmail(dados.getEmail());
        validarTelefone(dados.getTelefone());
        validarSalario(dados.getSalario());

        existente.setNome(dados.getNome());
        existente.setEmail(dados.getEmail());
        existente.setTelefone(dados.getTelefone());
        existente.setCargo(dados.getCargo());
        existente.setDepartamento(dados.getDepartamento());
        existente.setSalario(dados.getSalario());
        existente.setCidade(dados.getCidade());
        // status nao e obrigatorio no PUT: se nao vier, mantem o que ja tinha
        if (dados.getStatus() != null) existente.setStatus(dados.getStatus());
        return existente;
    }

    public Funcionario atualizarParcial(Long id, Funcionario dados) {
        Funcionario existente = buscarPorId(id);

        if (dados.getNome() != null) {
            if (vazio(dados.getNome())) throw new IllegalArgumentException("Nome nao pode ficar em branco.");
            existente.setNome(dados.getNome());
        }
        if (dados.getEmail() != null) {
            if (vazio(dados.getEmail())) throw new IllegalArgumentException("Email nao pode ficar em branco.");
            validarEmail(dados.getEmail());
            existente.setEmail(dados.getEmail());
        }
        if (dados.getTelefone() != null) {
            validarTelefone(dados.getTelefone());
            existente.setTelefone(dados.getTelefone());
        }
        if (dados.getCargo() != null) {
            if (vazio(dados.getCargo())) throw new IllegalArgumentException("Cargo nao pode ficar em branco.");
            existente.setCargo(dados.getCargo());
        }
        if (dados.getDepartamento() != null) existente.setDepartamento(dados.getDepartamento());
        if (dados.getSalario() != null) {
            validarSalario(dados.getSalario());
            existente.setSalario(dados.getSalario());
        }
        if (dados.getCidade() != null) existente.setCidade(dados.getCidade());
        if (dados.getStatus() != null) existente.setStatus(dados.getStatus());
        return existente;
    }

    public void excluir(Long id) {
        Funcionario existente = buscarPorId(id);
        storage.getFuncionarios().remove(existente);
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private void validarEmail(String email) {
        if (!EMAIL_REGEX.matcher(email).matches()) {
            throw new IllegalArgumentException("Email invalido.");
        }
    }

    private void validarTelefone(String telefone) {
        if (vazio(telefone)) return;
        String digitos = telefone.replaceAll("\\D", "");
        if (digitos.length() < 8 || digitos.length() > 13) {
            throw new IllegalArgumentException("Telefone deve ter entre 8 e 13 digitos.");
        }
    }

    private void validarSalario(Double salario) {
        if (salario != null && salario < 0) {
            throw new IllegalArgumentException("Salario nao pode ser negativo.");
        }
    }

}
