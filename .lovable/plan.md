
# White-Label para Gestores SST - ✅ IMPLEMENTADO

## Resumo
Plataforma transformada em white-label para gestores SST. A logo SOIA é substituída pela logo do gestor em todas as telas relevantes. Páginas de entrada personalizadas acessíveis via `/sst/:slug`.

## O que foi implementado

1. ✅ **Banco de dados**: Coluna `slug` (text, unique) na tabela `sst_managers`
2. ✅ **WhiteLabelContext**: Contexto React que detecta branding SST via URL ou usuário logado
3. ✅ **Navbar**: Substituição automática da logo SOIA pela logo SST
4. ✅ **Footer**: Substituição automática da logo SOIA pela logo SST
5. ✅ **Página de entrada SST**: Rota `/sst/:sstSlug` com landing page personalizada
6. ✅ **Admin - Gestão SST**: Slug gerado automaticamente + campo editável + exibição na tabela
7. ✅ **Branding automático**: Empresas vinculadas a SST veem a logo do gestor ao fazer login
