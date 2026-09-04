package com.picpay.rh.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

// transforma qualquer erro em JSON { "mensagem": "..." }, que e o formato que o front espera,
// em vez de deixar o Spring devolver a pagina/stacktrace padrao
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FuncionarioNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> naoEncontrado(FuncionarioNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensagem", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> requisicaoInvalida(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("mensagem", ex.getMessage()));
    }

    // JSON mal formado, campo com tipo errado (ex: salario como texto) ou status fora do enum
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> corpoInvalido() {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensagem", "Dados invalidos no corpo da requisicao. Verifique os campos e tente novamente."));
    }

    // rota ou metodo que nao existe na API (ex: barra a mais no final, endpoint digitado errado)
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, String>> rotaNaoEncontrada() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("mensagem", "Rota nao encontrada. Verifique a URL e o metodo HTTP."));
    }

    // qualquer outro erro que nao caiu em nenhum caso acima
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> erroInesperado() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("mensagem", "Ocorreu um erro inesperado no servidor."));
    }

}
