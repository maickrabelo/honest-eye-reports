## Objetivo

Provisionar 5 contas reais de teste — uma para cada plano SMS — para você logar e conferir o que cada plano libera/bloqueia (PGR, IA, Ouvidoria, limites de empresas/funcionários).

## Como será feito

Vou rodar uma migration única que executa o mesmo fluxo do `hotmart-webhook` em modo manual (sem precisar disparar webhook real nem criar produto no Hotmart). Para cada plano:

1. Cria usuário no Auth com email previsível e senha fixa de teste.
2. Marca `must_change_password = false` (pra você não ser forçado a trocar a cada login de teste).
3. Atribui role correta (`sst` para Técnico/Gestora, `company` para Empresa).
4. Cria `sst_managers` (planos manager) ou `companies` + `company_feature_access` (planos company), aplicando todas as flags do plano: `pgr_module_enabled`, `pgr_enabled`, `ai_enabled=false`, `ouvidoria_enabled=false`, limites.
5. Cria registro em `subscriptions` marcado como `provider='hotmart-test'` e `status='active'` pra simular compra aprovada.

## Contas que serão criadas

| Plano | Email | Senha | O que esperar ao logar |
|---|---|---|---|
| Técnico SST SMS | `teste-tecnico-sms@soia.app.br` | `TesteSMS@2026` | Dashboard SST, PGR habilitado, IA bloqueada, Ouvidoria off, 1 empresa |
| Gestora SST SMS Basic | `teste-gestora-basic-sms@soia.app.br` | `TesteSMS@2026` | Dashboard SST, PGR habilitado, IA bloqueada, Ouvidoria off, até 5 empresas |
| Gestora SST SMS Pro | `teste-gestora-pro-sms@soia.app.br` | `TesteSMS@2026` | Dashboard SST, PGR habilitado, IA bloqueada, Ouvidoria off, até 15 empresas |
| Empresa SMS Starter | `teste-empresa-starter-sms@soia.app.br` | `TesteSMS@2026` | Dashboard empresa, PGR habilitado via plano, IA bloqueada, Ouvidoria off, até 50 funcionários |
| Empresa SMS Corporate | `teste-empresa-corporate-sms@soia.app.br` | `TesteSMS@2026` | Dashboard empresa, PGR habilitado, IA bloqueada, Ouvidoria off, até 200 funcionários |

Login em: https://soia.app.br/auth

## Limpeza depois

Quando você terminar de testar, é só me pedir "remover contas de teste SMS" que eu rodo uma migration que deleta os 5 usuários + entidades vinculadas em cascata.

## Confirmações que preciso

1. Os emails acima estão ok? (são apenas marcadores — não precisa ter caixa real, já que `must_change_password=false` e a senha é fixa).
2. Confirma a senha padrão `TesteSMS@2026` para todas as 5?

Se preferir outros emails/senha, é só me dizer antes de eu rodar.
