# Gnosis AI - Documentação da API Mobile

Esta documentação descreve os endpoints REST criados especificamente para integração com os aplicativos móveis nativos (iOS e Android) do Gnosis AI.

URL Base: `https://seu-dominio.com/api/v1/mobile` (e `/api` para rotas root).

## Autenticação

Para aplicativos mobile nativos, utilizamos JWT via cabeçalho HTTP (`Authorization: Bearer <token>`). O token é obtido nos endpoints de login e registro.

### 1. Login
- **Endpoint:** `POST /api/login` *(Atenção: rota root, não `/api/v1/mobile/auth/login`)*
- **Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha_segura"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI...",
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "role": "user"
  }
}
```
**Ação do App:** Armazene o `token` de forma segura (SecureStore/EncryptedSharedPreferences) e envie em todos os requests subsequentes.

### 2. Registro
- **Endpoint:** `POST /api/register` *(Atenção: rota root)*
- **Body:**
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "password": "senha_segura",
  "affiliateCode": "opcional",
  "coupon": "opcional"
}
```
- **Response (200 OK):** Retorna a mesma estrutura do `/api/login`, efetuando login automático.

### 3. Obter Dados do Perfil Atual (Auto-Login)
- **Endpoint:** `GET /api/v1/mobile/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "usuario@exemplo.com",
    "role": "user",
    "sessionId": "..."
  }
}
```

### 4. Logout
- **Endpoint:** `POST /api/v1/mobile/auth/logout`
- **Headers:** `Authorization: Bearer <token>`
- **Ação do App:** O app deve simplesmente deletar o token JWT local e redirecionar para a tela de Login. A chamada a este endpoint é opcional para registro em logs/blacklist se ativado no backend.


## Dashboard e Ferramentas

### 5. Listar Ferramentas
- **Endpoint:** `GET /api/v1/mobile/tools`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "tools": [
    {
      "id": 1,
      "name": "estudo_biblico",
      "displayName": "Estudo Bíblico Profundo",
      "description": "...",
      "inputPlaceholder": "...",
      "category": "Teologia",
      "icon": "Book",
      "isActive": true
    }
  ]
}
```


## Geração de Estudos (Core do App)

### 6. Gerar Resposta da IA (Chat)
- **Endpoint:** `POST /api/v1/mobile/tools/generate`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "toolId": 1,
  "input": "O que significa Gênesis 1:1?",
  "language": "pt", 
  "history": [] 
}
```
- **Response:**
```json
{
  "success": true,
  "content": "No princípio criou Deus...",
  "wordCount": 120,
  "creditCost": 50
}
```
*(Nota: O app deve usar este endpoint para cada interação de chat. O array de `history` deve conter os objetos `{role: "user" | "assistant", content: string}`).*

### 7. Salvar Novo Estudo (Ao finalizar a primeira resposta)
- **Endpoint:** `POST /api/v1/mobile/studies/save`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "toolId": 1,
  "toolName": "estudo_biblico",
  "input": "O que significa Gênesis 1:1?",
  "output": "No princípio criou Deus...",
  "creditCost": 50,
  "wordCount": 120
}
```
- **Response:**
```json
{
  "success": true,
  "id": 42 
}
```
*(Atenção: Salve o ID retornado. Ele será usado para carregar o histórico futuramente).*


## Histórico de Estudos (Meus Estudos)

### 8. Listar Estudos Recentes (Home)
- **Endpoint:** `GET /api/v1/mobile/studies/recent`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "studies": [
    {
      "id": 42,
      "toolName": "estudo_biblico",
      "createdAt": "2024-05-21T10:00:00Z"
    }
  ]
}
```

### 9. Listar Todos os Estudos (Paginação em breve)
- **Endpoint:** `GET /api/v1/mobile/studies`
- **Headers:** `Authorization: Bearer <token>`

### 10. Detalhes do Estudo e Histórico de Chat
- **Endpoint:** `GET /api/v1/mobile/studies/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "study": {
    "id": 42,
    "input": "Prompt Inicial",
    "output": "Resposta da IA",
    "toolName": "estudo_biblico"
  },
  "messages": [
    {
      "role": "user",
      "content": "Me dê mais detalhes",
      "createdAt": "..."
    },
    {
      "role": "assistant",
      "content": "Claro, aqui estão...",
      "createdAt": "..."
    }
  ]
}
```


## Finanças, Créditos e Planos

### 11. Saldo de Créditos
- **Endpoint:** `GET /api/v1/mobile/credits/balance`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "balance": {
    "total": 2000,
    "creditsInitial": 1000,
    "creditsDaily": 1000,
    "creditsBonus": 0,
    "isActive": true
  }
}
```

### 12. Plano Ativo
- **Endpoint:** `GET /api/v1/mobile/credits/active-plan`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "activePlan": {
    "planId": 2,
    "name": "premium",
    "status": "active",
    "endDate": "2024-06-21T10:00:00Z"
  }
}
```

### 13. Listar Planos Disponíveis
- **Endpoint:** `GET /api/v1/mobile/plans`
- **Response:** Retorna array com os planos para a tela de Upgrade.

## Avisos de Integração e UI/UX
- **Loading States:** Recomenda-se adicionar um estado de loading ("Escrevendo...") durante as chamadas do endpoint `tools/generate`, visto que o processamento do LLM pode demorar de 3 a 10 segundos.
- **Validação de Token:** Em caso de `401 Unauthorized`, o app deve efetuar logout local e redirecionar para a tela de login.
- **Micro-animações:** O app deve seguir a mesma estética premium do site. Para exibir o Saldo de Créditos, recomenda-se uma animação que mostre a contagem dos números.
