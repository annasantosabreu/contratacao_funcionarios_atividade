# Sistema de Contratação de Funcionários — PicPay

Desafio de Spring Boot + front-end, proposto pela rede de ensino. Front-end escolhido: HTML + CSS + JavaScript puro.

## Estrutura

```
backend/   -> Spring Boot (API REST em /funcionarios)
frontend/  -> index.html, css/style.css, js/
```

## Como rodar

Backend (pasta `backend`):

```
mvnw spring-boot:run
```

Sobe em `http://localhost:8081`.

Frontend: abrir `frontend/index.html` no navegador. Ele já busca os dados
direto na API acima.

## O que tem

- CRUD completo de funcionário: cadastrar (POST), listar e buscar por id
  (GET), editar (PUT), atualizar parcial (PATCH), excluir (DELETE)
- Busca por nome/cargo e filtro por status
- Painel com indicadores (total, em análise, aprovados, reprovados, contratados)
- Armazenamento em ArrayList em memória, sem banco
- Validação de dados no backend (nome/email/cargo obrigatórios, formato de
  email, telefone e salário) e no frontend (máscara de telefone, feedback
  de erro nos formulários)
