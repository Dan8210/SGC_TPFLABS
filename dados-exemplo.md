# Dados de Exemplo para Teste do Sistema

Para facilitar o teste do **SGP - Sistema de Gestão de Propostas**, aqui estão alguns dados de exemplo que podem ser utilizados:

## 📦 Produtos de Exemplo

### Produto 1 - Eletrônicos
- **Nome**: Notebook Dell Inspiron 15 3000
- **Descrição**: Notebook para uso corporativo com processador Intel Core i5
- **Categoria**: Eletrônicos
- **Unidade**: UN (Unidade)
- **Especificações**: Intel Core i5, 8GB RAM, SSD 256GB, Tela 15.6"

### Produto 2 - Material de Escritório
- **Nome**: Papel A4 Sulfite 75g
- **Descrição**: Papel branco para impressão e cópias
- **Categoria**: Material de Escritório
- **Unidade**: CX (Caixa)
- **Especificações**: Formato A4, 75g/m², 500 folhas por resma

### Produto 3 - Mobiliário
- **Nome**: Mesa de Escritório Executive
- **Descrição**: Mesa executiva com gavetas laterais
- **Categoria**: Mobiliário
- **Unidade**: UN (Unidade)
- **Especificações**: Madeira MDF, 1,20m x 0,60m, 3 gavetas

### Produto 4 - Material de Limpeza
- **Nome**: Detergente Neutro Concentrado
- **Descrição**: Produto de limpeza multiuso
- **Categoria**: Material de Limpeza
- **Unidade**: L (Litro)
- **Especificações**: pH neutro, biodegradável, concentrado 1:10

## 🏢 Fornecedores de Exemplo

### Fornecedor 1 - Tecnologia
- **Razão Social**: Tech Solutions Informática Ltda
- **Nome Fantasia**: TechSol
- **CNPJ**: 12.345.678/0001-90
- **Email**: contato@techsol.com.br
- **Telefone**: (11) 91234-5678
- **Contato Responsável**: João Silva
- **Endereço**: Rua das Flores, 123, São Paulo, SP, CEP 01234-567

### Fornecedor 2 - Material de Escritório
- **Razão Social**: Papelaria Central do Brasil S.A.
- **Nome Fantasia**: Central Papelaria
- **CNPJ**: 98.765.432/0001-10
- **Email**: vendas@centralpapelaria.com.br
- **Telefone**: (11) 99876-5432
- **Contato Responsável**: Maria Santos
- **Endereço**: Av. Paulista, 500, São Paulo, SP, CEP 01310-100

### Fornecedor 3 - Mobiliário
- **Razão Social**: Móveis & Design Corporativo Ltda
- **Nome Fantasia**: M&D Corporativo
- **CNPJ**: 11.222.333/0001-44
- **Email**: orcamentos@mdcorporativo.com.br
- **Telefone**: (11) 92222-3333
- **Contato Responsável**: Carlos Oliveira
- **Endereço**: Rua Industrial, 789, São Paulo, SP, CEP 04567-890

### Fornecedor 4 - Material de Limpeza
- **Razão Social**: Limpeza Total Produtos Químicos Ltda
- **Nome Fantasia**: Limpeza Total
- **CNPJ**: 55.666.777/0001-88
- **Email**: vendas@limpezatotal.com.br
- **Telefone**: (11) 95555-6666
- **Contato Responsável**: Ana Costa
- **Endereço**: Rua da Química, 456, São Paulo, SP, CEP 08901-234

## 📋 Propostas de Exemplo

### Proposta 1
- **Número**: PROP-2024-001
- **Produto**: Notebook Dell Inspiron 15 3000
- **Fornecedor**: Tech Solutions Informática Ltda
- **Quantidade**: 50
- **Preço Unitário**: R$ 2.500,00
- **Prazo de Entrega**: 30 dias
- **Status**: Pendente

### Proposta 2
- **Número**: PROP-2024-002
- **Produto**: Papel A4 Sulfite 75g
- **Fornecedor**: Papelaria Central do Brasil S.A.
- **Quantidade**: 200
- **Preço Unitário**: R$ 25,00
- **Prazo de Entrega**: 7 dias
- **Status**: Aprovada

### Proposta 3
- **Número**: PROP-2024-003
- **Produto**: Mesa de Escritório Executive
- **Fornecedor**: Móveis & Design Corporativo Ltda
- **Quantidade**: 25
- **Preço Unitário**: R$ 800,00
- **Prazo de Entrega**: 45 dias
- **Status**: Pendente

### Proposta 4
- **Número**: PROP-2024-004
- **Produto**: Detergente Neutro Concentrado
- **Fornecedor**: Limpeza Total Produtos Químicos Ltda
- **Quantidade**: 100
- **Preço Unitário**: R$ 15,50
- **Prazo de Entrega**: 15 dias
- **Status**: Renovação Solicitada

## 🧪 Cenários de Teste

### Teste 1: Fluxo Completo
1. Cadastre os produtos acima
2. Cadastre os fornecedores
3. Crie as propostas vinculando produtos e fornecedores
4. Observe as estatísticas no dashboard
5. Verifique os gráficos e relatórios

### Teste 2: Sistema de Alertas
1. Crie uma proposta com data de validade próxima (ex: 1 mês)
2. Aguarde ou simule o sistema de alertas
3. Verifique a central de notificações
4. Teste a renovação de propostas

### Teste 3: Busca e Filtros
1. Com dados cadastrados, teste as buscas em cada módulo
2. Use filtros por categoria, status, data
3. Verifique a performance das buscas

### Teste 4: Responsividade
1. Acesse o sistema em diferentes dispositivos
2. Teste todas as funcionalidades no mobile
3. Verifique modais e formulários

## 💡 Dicas para Testes

### Validações para Testar
- **CNPJ Inválido**: 12.345.678/0001-00 (deve dar erro)
- **CNPJ Válido**: Use um gerador online de CNPJ válido
- **Email Inválido**: teste@email (deve dar erro)
- **Campos Obrigatórios**: Tente salvar sem preencher

### Funcionalidades Avançadas
- **Exportação**: Teste a exportação CSV nos relatórios
- **Renovação**: Use propostas próximas ao vencimento
- **Gráficos**: Verifique se os dados aparecem corretamente
- **Alertas**: Teste marcar como lido e ações diretas

### Performance
- **Volume de Dados**: Cadastre muitos registros para testar performance
- **Busca**: Digite rapidamente para testar o debounce
- **Navegação**: Alterne entre abas rapidamente

## 🎯 Objetivos dos Testes

1. **Funcionalidade**: Todos os CRUDs funcionando
2. **Validação**: Dados incorretos sendo rejeitados
3. **Usabilidade**: Interface intuitiva e responsiva
4. **Alertas**: Sistema automático funcionando
5. **Relatórios**: Gráficos e dados corretos
6. **Performance**: Sistema rápido e estável

---

**Importante**: Estes são dados fictícios para teste. Em produção, use dados reais da sua empresa.