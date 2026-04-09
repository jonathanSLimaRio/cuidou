# Plano de Implementação: Fix do Infinite Redirect no Admin Login

## 🐛 O Problema
Ao acessar a nova rota `/admin/login`, o navegador entra em um loop infinito de redirecionamentos (`ERR_TOO_MANY_REDIRECTS`).
Isso ocorre porque o arquivo `src/proxy.ts` considera TODO o prefixo `/admin` (incluindo `/admin/login`) como uma rota protegida (através do array `protectedPagePrefixes`). 

Quando um usuário não autenticado tenta acessar `/admin/login`, a middleware barra o acesso, executa a nossa lógica nova e redireciona ele para `/admin/login`. A segunda requisição também é barrada, sendo redirecionada novamente para `/admin/login`, gerando o loop.

## 🛠️ A Solução (Planejamento)

1. **Liberar a Rota `/admin/login` no Proxy**
   - No `src/proxy.ts`, logo acima (ou junto) da exceção que já existe para `/admin/invite/accept`, vamos adicionar uma validação liberando a rota `/admin/login` e suas sub-rotas.
   - Isso permite que requisições para a página de login cheguem ao servidor e ela seja renderizada sem que a middleware (proxy) force o usuário não logado a relogar antes de chegar na página de login.

2. **Revisar o fallback `isProtectedPage`**
   - Garantiremos que, se não estiver logado e for acessar o painel restrito (como `/admin/families`), ele vai corretamente para a recém-criada tela de `/admin/login`, sem loop.

## 🤖 Agentes Requeridos (Fase 2 - Implementação)

Em cumprimento ao [Protocolo de Orquestração](workflow:orchestrate), a correção e validação contarão com no mínimo 3 agentes especializados em paralelo após sua aprovação:
1. `backend-specialist`: Alterará a regex e lógicas de liberação de middleware no `src/proxy.ts` (Next 16).
2. `security-auditor`: Validará se expor o `/admin/login` de maneira crua na edge session resultou em algum vazamento de layout protegido.
3. `test-engineer/debugger`: Revisará o log do Next.js via browser para atestar que o loop infinito acabou e os Status Code 307 sumiram.

## ✅ Checklist de Verificação
- [ ] O Log de Acesso ao `/admin/login` retorna 200 OK sem redirects.
- [ ] Acessar `/admin/families` não logado redireciona para `/admin/login?next=/admin/families`.
- [ ] Acessar `/dashboard` não logado redireciona para `/login?next=/dashboard`.
