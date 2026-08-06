# Release de homologação e rollback

## Antes da migration

1. Confirme que banco e URL pertencem exclusivamente à homologação.
2. Crie um snapshot no provedor e teste sua restauração em uma instância descartável.
3. Use `sslmode=verify-full` e registre o identificador do snapshot em `STAGING_SNAPSHOT_ID`.
4. Configure `RELEASE_ENV=staging`, `STAGING_CONFIRMATION=cuidou-staging` e execute `npm run release:staging`.

O comando bloqueia alvos com aparência de produção, aplica `prisma migrate deploy` e só conclui quando `/api/health/ready` retorna `200` e `status: ok`.

## Rollback

Migrations Prisma aplicadas não são revertidas por SQL destrutivo automático. Se uma migration falhar ou a verificação funcional degradar:

1. bloqueie novos writes da homologação;
2. restaure o snapshot para uma nova instância;
3. valide contagens, consentimentos e `/api/health/ready`;
4. altere a conexão da homologação para a instância restaurada;
5. mantenha a instância com falha para análise.

Nunca execute esse fluxo contra produção sem go/no-go formal e janela aprovada.
