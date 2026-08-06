# Go/no-go de produção — 2026-08-06

Status atual: **NO-GO externo / código candidato validado localmente**.

## Implementado no repositório

- consentimento legal versionado e migration compatível com registros existentes;
- signup web/mobile e contas OAuth/legadas bloqueadas até aceite corrente;
- liveness/readiness, CSP com nonce, audit de dependências sem achados high e Sentry web/mobile;
- fixtures E2E isoladas, PostgreSQL descartável no CI, cobertura mínima e Axe;
- redesign público responsivo, ilustração autoral otimizada e remoção de prova social fictícia;
- trava de release mobile para API ausente, local ou sem HTTPS.

## Segunda auditoria concluída

- removido o loop de consentimento causado por JWT desatualizado após o aceite;
- contas pendentes, suspensas e banidas agora falham de forma segura também em tokens OAuth parciais, e o estado de autorização é relido no próximo request protegido;
- cadastro mobile exige perfil, identifica corretamente a origem do consentimento e mostra confirmação transparente das próximas etapas;
- signup web exige perfil no contrato da API, preserva headers de rate limit em conflitos e possui labels de senha acessíveis;
- observabilidade anonimiza usuário e remove destinatário/assunto dos logs de e-mail;
- smoke test passou a ser obrigatório no CI e o Expo Doctor foi fixado e executado no diretório correto.

## Pendências externas obrigatórias

- revisão jurídica dos Termos e da Política de Privacidade;
- credenciais de homologação e snapshot restaurável testado;
- secrets Vercel/EAS/Sentry/Google/Ably/WordPress/Resend/Upstash;
- execução das integrações sintéticas reais e builds EAS Android/iOS no mesmo commit;
- Lighthouse e validação manual WCAG (teclado, leitor de tela, zoom 200% e reflow 320 px);
- aprovação formal do go/no-go e plano de janela/rollback.

Produção não deve ser alterada até todos os itens externos terem evidência anexada ao release.

## Gates ainda não comprovados nesta máquina

- cobertura global está em 70,6% de linhas e 64,1% de branches; autorização (94,4%), autenticação mobile/refresh (95,2%), consentimento e rate limit (100%) têm gates isolados mínimos de 80%;
- a suíte autenticada atual valida contratos de sessão e pipeline, mas a jornada E2E completa (aprovação, vaga, convite, contrato, chat/anexo, moderação e avaliação) depende do PostgreSQL descartável do CI/homologação;
- falhas de e-mail são estruturadas e o convite administrativo informa o resultado, porém os demais fluxos transacionais ainda precisam expor retry ao usuário;
- o audit mobile não tem achados `high`, mas mantém 12 achados `moderate` transitivos na cadeia Expo/xcode/uuid; a correção automática proposta faz downgrade incompatível do Expo e não foi aplicada;
- testes nativos Android/iOS, push/deep links, Lighthouse e restauração real do snapshot exigem serviços externos.

Esses itens mantêm o status **NO-GO** mesmo com build, lint, tipos, audit, Expo Doctor e Axe locais aprovados.
