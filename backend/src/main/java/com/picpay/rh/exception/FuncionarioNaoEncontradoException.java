package com.picpay.rh.exception;

public class FuncionarioNaoEncontradoException extends RuntimeException {

    public FuncionarioNaoEncontradoException(Long id) {
        super("Funcionario com id " + id + " nao foi encontrado.");
    }

}
