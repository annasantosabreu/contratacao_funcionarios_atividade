package com.picpay.rh.controller;

import com.picpay.rh.model.Funcionario;
import com.picpay.rh.service.FuncionarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/funcionarios")
@CrossOrigin(origins = "*") 
public class FuncionarioController {

    private final FuncionarioService service;

    public FuncionarioController(FuncionarioService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Funcionario> cadastrar(@RequestBody Funcionario funcionario) {
        Funcionario criado = service.cadastrar(funcionario);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @GetMapping
    public List<Funcionario> listarTodos(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        return service.listarTodos(q, status);
    }

    @GetMapping("/{id}")
    public Funcionario buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @PutMapping("/{id}")
    public Funcionario atualizarCompleto(@PathVariable Long id, @RequestBody Funcionario funcionario) {
        return service.atualizarCompleto(id, funcionario);
    }

    @PatchMapping("/{id}")
    public Funcionario atualizarParcial(@PathVariable Long id, @RequestBody Funcionario funcionario) {
        return service.atualizarParcial(id, funcionario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

}
