
A gestora SST precisa poder resetar/criar senhas das empresas clientes. Já existe o componente `ResetPasswordDialog` (visto no contexto) que faz exatamente isso usando a edge function `create-user-with-password`. Preciso verificar se ele já está integrado no card das empresas no dashboard SST e se respeita o agrupamento por email (multi-company access).

Olhando o código existente:
- `ResetPasswordDialog.tsx` já existe e já implementa: busca o usuário pelo `company_id`, busca todas as empresas vinculadas via `user_companies`, gera senha temporária, reseta via edge function, mostra credenciais + lista de CNPJs vinculados ao email.
- A memória `mem://features/sst-client-password-reset` confirma que esse fluxo já existe (ícone de chave 🔑 nos cards).

Preciso checar se o dialog está sendo usado no `SSTDashboard.tsx` / nos cards de empresa. Se sim, talvez só precise validar/ajustar. Se não, integrar.

## Plano

### Objetivo
Garantir que a gestora SST consiga resetar/criar senhas das empresas clientes diretamente do dashboard, com agrupamento correto por email (uma senha = todas as empresas vinculadas ao mesmo email).

### Verificação
1. Confirmar se o ícone "Resetar Senha" (🔑) já aparece nos cards de empresa no `SSTDashboard`.
2. Confirmar que o `ResetPasswordDialog` está importado e funcionando.

### Implementação (caso necessário)
1. **Integrar no dashboard SST** — adicionar botão de chave (🔑) em cada card de empresa que abre o `ResetPasswordDialog`.
2. **Validar agrupamento por email** — o dialog atual já busca via `user_companies` e exibe todos os CNPJs vinculados; confirmar que o reset atualiza a senha do `auth.user` (única para todas as empresas).
3. **Feedback visual** — após reset bem-sucedido, mostrar:
   - Email de acesso
   - Senha temporária gerada (formato: `NomeEmpresa2026!`)
   - Lista de CNPJs/empresas vinculados ao mesmo email
   - Botão "Copiar tudo" para compartilhar com o cliente

### Comportamento esperado
- Email único → uma senha única → acesso a todas as empresas vinculadas via `CompanySwitcher`.
- Empresa marca `must_change_password = true` para forçar troca no primeiro acesso.
- Reset usa edge function existente `create-user-with-password` (já aceita atualização de usuário existente).

### Arquivos envolvidos
- `src/pages/SSTDashboard.tsx` — adicionar botão 🔑 no card (se ainda não existir)
- `src/components/sst/ResetPasswordDialog.tsx` — componente já pronto, validar integração
- Edge function `create-user-with-password` — já existente, sem alterações

### Considerações técnicas
- Como o agrupamento é feito por `auth.users.email`, resetar a senha do usuário automaticamente afeta todas as empresas vinculadas — comportamento desejado.
- Não criar novo usuário se já existir; apenas atualizar senha.
- RLS já permite que SST visualize/resete empresas atribuídas via `company_sst_assignments`.
