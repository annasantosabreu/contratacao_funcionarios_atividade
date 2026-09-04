package com.picpay.rh.storage;

import com.picpay.rh.model.Funcionario;
import com.picpay.rh.model.StatusFuncionario;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

// armazenamento em memoria, sem banco de dados (pede o desafio)
@Component
public class FuncionarioStorage {

    private List<Funcionario> funcionarios = new ArrayList<>();
    private long proximoId = 1;

    public FuncionarioStorage() {
        funcionarios.add(new Funcionario(proximoId++, "Ana Souza", "ana.souza@email.com",
                "11912345678", "Analista de RH", "Recursos Humanos", 4500.0, "Sao Paulo",
                StatusFuncionario.CONTRATADO));
        funcionarios.add(new Funcionario(proximoId++, "Bruno Lima", "bruno.lima@email.com",
                "21998765432", "Desenvolvedor Backend", "Tecnologia", 7800.0, "Rio de Janeiro",
                StatusFuncionario.APROVADO));
        funcionarios.add(new Funcionario(proximoId++, "Carla Mendes", "carla.mendes@email.com",
                "31987654321", "Designer UX", "Produto", 6200.0, "Belo Horizonte",
                StatusFuncionario.EM_ANALISE));
        funcionarios.add(new Funcionario(proximoId++, "Diego Alves", "diego.alves@email.com",
                "41992223344", "Analista Financeiro", "Financeiro", 5300.0, "Curitiba",
                StatusFuncionario.REPROVADO));
    }

    public List<Funcionario> getFuncionarios() {
        return funcionarios;
    }

    public long gerarProximoId() {
        return proximoId++;
    }

}
