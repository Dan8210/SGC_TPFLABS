# SGP - Sistema de Gestão de Cotações

Um sistema web completo e moderno para gerenciamento de propostas comerciais, cadastro de produtos e fornecedores, com sistema inteligente de alertas e renovação automática.

## 🚀 Funcionalidades Implementadas

### ✅ Módulos Principais Completados

#### 1. **Dashboard Executivo**
- **Visão geral** com estatísticas em tempo real
- **Cards informativos**: Total de produtos, fornecedores, propostas e alertas
- **Gráficos interativos**: Status das propostas e volume mensal
- **Atividades recentes** com histórico de ações
- **Atualização automática** dos dados a cada 5 minutos

#### 2. **Gestão de Produtos**
- **Cadastro completo** com ID único gerado automaticamente
- **Campos**: Nome, descrição, categoria, unidade, especificações técnicas
- **Status ativo/inativo** para controle de disponibilidade
- **Busca e filtros** por categoria e status
- **Validação completa** de dados obrigatórios
- **CRUD completo**: Criar, visualizar, editar e excluir

#### 3. **Gestão de Fornecedores**
- **Cadastro empresarial completo** com dados fiscais
- **Campos**: Razão social, nome fantasia, CNPJ, contatos, endereço
- **Validação de CNPJ** em tempo real
- **Máscaras de entrada** para telefone e CNPJ
- **Prevenção de duplicatas** por CNPJ
- **Status ativo/inativo** para controle
- **CRUD completo** com interface intuitiva

#### 4. **Sistema de Propostas**
- **Criação de propostas** com numeração controlada
- **Vinculação** automática a produtos e fornecedores
- **Cálculo automático** de valores totais
- **Controle de validade** (6 meses padrão)
- **Status múltiplos**: Pendente, Aprovada, Rejeitada, Expirada, Renovação Solicitada
- **Filtros avançados** por data, status e valor
- **Informações detalhadas** do produto no formulário

#### 5. **Sistema de Alertas Inteligente**
- **Verificação automática** de propostas vencendo (2 meses antes)
- **Alertas de expiração** para propostas vencidas
- **Central de notificações** com contador visual
- **Categorização de alertas**: Vencendo, Vencido, Renovação Solicitada
- **Ações diretas**: Marcar como lido, visualizar proposta, renovar
- **Atualização em tempo real** a cada minuto

#### 6. **Dashboard de Cotações Pendentes**
- **Visualização dedicada** para propostas que precisam atenção
- **Seções organizadas**: Vencendo em 2 meses, Vencidas, Renovação Solicitada
- **Indicadores visuais** de urgência com cores diferenciadas
- **Contagem regressiva** para propostas vencendo
- **Ações rápidas** para renovação e visualização

#### 7. **Sistema de Relatórios e Analytics**
- **Gráficos interativos** com Chart.js
- **Volume de propostas** por mês
- **Distribuição por status** em formato donut
- **Top 10 fornecedores** por valor de propostas
- **Filtros de período**: 30, 90, 180, 365 dias ou personalizado
- **Exportação de dados** em CSV (Excel e PDF em desenvolvimento)

### 🎯 Funcionalidades de Destaque

#### **Controle de Validade Automático**
- Propostas criadas com **validade padrão de 6 meses**
- **Alertas automáticos** 2 meses antes do vencimento
- **Atualização automática** do status para "expirada"
- **Sistema de renovação** com um clique

#### **Interface Responsiva e Moderna**
- Design baseado em **Tailwind CSS**
- **Totalmente responsivo** para desktop, tablet e mobile
- **Ícones FontAwesome** para melhor usabilidade
- **Modais interativos** para todas as operações
- **Notificações toast** para feedback ao usuário

#### **Validações Robustas**
- **Validação de CNPJ** com algoritmo oficial
- **Validação de email** em tempo real
- **Prevenção de duplicatas** em produtos e fornecedores
- **Máscaras de entrada** para campos formatados
- **Sanitização de dados** contra XSS

#### **Sistema de Busca Avançado**
- **Busca textual** em tempo real com debounce
- **Filtros múltiplos** por categoria, status, data
- **Paginação** para grandes volumes de dados
- **Ordenação** por diferentes campos

## 🏗️ Arquitetura Técnica

### **Frontend Moderno**
- **HTML5 Semântico** com estrutura acessível
- **CSS3 + Tailwind CSS** para styling responsivo
- **JavaScript ES6+** com classes e módulos
- **Chart.js** para visualizações de dados
- **Arquitetura modular** com separação de responsabilidades

### **Estrutura de Dados**
Utiliza a **RESTful Table API** com os seguintes esquemas:

#### **Tabela: produtos**
```javascript
{
  id: "ID único do produto",
  nome: "Nome do produto",
  descricao: "Descrição detalhada",
  categoria: "Categoria do produto",
  unidade: "Unidade de medida",
  especificacoes: "Especificações técnicas",
  ativo: "Status ativo/inativo"
}
```

#### **Tabela: fornecedores**
```javascript
{
  id: "ID único do fornecedor",
  razao_social: "Razão social da empresa",
  nome_fantasia: "Nome fantasia",
  cnpj: "CNPJ da empresa",
  email: "Email de contato",
  telefone: "Telefone de contato",
  endereco: "Endereço completo",
  contato_responsavel: "Nome do responsável",
  observacoes: "Observações adicionais",
  ativo: "Status ativo/inativo"
}
```

#### **Tabela: propostas**
```javascript
{
  id: "ID único da proposta",
  numero_proposta: "Número identificador",
  produto_id: "Referência ao produto",
  fornecedor_id: "Referência ao fornecedor",
  quantidade: "Quantidade solicitada",
  preco_unitario: "Preço por unidade",
  preco_total: "Valor total calculado",
  prazo_entrega: "Prazo em dias",
  data_criacao: "Data de criação",
  data_validade: "Data de expiração (6 meses)",
  status: "Status atual da proposta",
  observacoes: "Observações",
  anexos: "Lista de anexos"
}
```

#### **Tabela: alertas**
```javascript
{
  id: "ID único do alerta",
  proposta_id: "Referência à proposta",
  tipo_alerta: "Tipo: vencimento_proximo/vencido/renovacao_solicitada",
  data_alerta: "Data de criação do alerta",
  mensagem: "Mensagem do alerta",
  lido: "Status de leitura",
  ativo: "Status ativo/inativo"
}
```

### **Módulos JavaScript**

#### **utils.js** - Utilitários Gerais
- Formatação de dados (moeda, data, telefone, CNPJ)
- Validações (CNPJ, email)
- Funções de UI (toast, loading, confirmação)
- Manipulação de datas e cálculos

#### **database.js** - Gerenciador de Dados
- Interface com a RESTful Table API
- Operações CRUD para todas as tabelas
- Métodos específicos por entidade
- Cache e otimizações de consulta

#### **produtos.js** - Gestão de Produtos
- Interface completa para produtos
- Formulários modais responsivos
- Validações específicas
- Filtros e busca em tempo real

#### **fornecedores.js** - Gestão de Fornecedores
- Formulários empresariais completos
- Validação de CNPJ em tempo real
- Máscaras de entrada
- Prevenção de duplicatas

#### **propostas.js** - Sistema de Propostas
- Formulários vinculados a produtos/fornecedores
- Cálculos automáticos de valores
- Controle de status e validade
- Sistema de renovação

#### **alertas.js** - Sistema de Alertas
- Verificação automática periódica
- Central de notificações
- Categorização de alertas
- Ações diretas nos alertas

#### **relatorios.js** - Analytics e Relatórios
- Geração de gráficos interativos
- Filtros de período customizáveis
- Exportação de dados
- Estatísticas calculadas

#### **main.js** - Controlador Principal
- Inicialização da aplicação
- Sistema de abas
- Coordenação entre módulos
- Tarefas periódicas

## 📊 Fluxo de Funcionamento

### **1. Cadastro Inicial**
1. **Produtos** → Cadastre os produtos que serão cotados
2. **Fornecedores** → Registre empresas fornecedoras
3. **Propostas** → Crie propostas vinculando produtos a fornecedores

### **2. Gestão de Validade**
1. Sistema **monitora automaticamente** as datas de validade
2. **2 meses antes** do vencimento, cria alerta automático
3. No vencimento, **altera status** para "expirada"
4. Gestor pode **renovar propostas** com um clique

### **3. Acompanhamento**
1. **Dashboard** mostra visão geral do sistema
2. **Cotações Pendentes** lista propostas que precisam atenção
3. **Alertas** notificam sobre prazos e renovações
4. **Relatórios** fornecem analytics para tomada de decisão

## 🔧 Recursos Técnicos Avançados

### **Performance e Usabilidade**
- **Debounce** nas buscas para otimizar requisições
- **Loading states** em todas as operações assíncronas
- **Paginação** para grandes volumes de dados
- **Cache inteligente** de dados frequentemente acessados

### **Segurança**
- **Sanitização** de entradas contra XSS
- **Validação** tanto no frontend quanto na estrutura de dados
- **Prevenção de duplicatas** por chaves únicas

### **Responsividade**
- **Mobile-first** design approach
- **Breakpoints** otimizados para diferentes dispositivos
- **Touch-friendly** interfaces para dispositivos móveis

### **Acessibilidade**
- **Estrutura semântica** HTML5
- **Navegação por teclado** suportada
- **Contraste adequado** de cores
- **Textos alternativos** para elementos visuais

## 🚀 Como Utilizar

### **1. Acesso ao Sistema**
- Abra o arquivo `index.html` no navegador
- O sistema carregará automaticamente
- Interface intuitiva com navegação por abas

### **2. Fluxo Recomendado**
```
Dashboard → Produtos → Fornecedores → Propostas → Cotações → Relatórios
```

### **3. Operações Principais**

#### **Criação de Proposta**
1. Acesse aba "Propostas"
2. Clique "Nova Proposta"
3. Preencha número da proposta
4. Selecione produto e fornecedor
5. Defina quantidade e preço
6. Sistema calcula automaticamente o total
7. Data de validade é definida automaticamente (6 meses)

#### **Renovação de Proposta**
1. Acesse "Cotações Pendentes" ou visualize proposta específica
2. Clique "Renovar" na proposta desejada
3. Status muda para "Renovação Solicitada"
4. Alerta é criado automaticamente

#### **Acompanhamento de Alertas**
1. Ícone de sino no cabeçalho mostra contador
2. Clique no sino para abrir central de alertas
3. Visualize alertas por categoria
4. Execute ações diretamente dos alertas

## 📈 Dados e Métricas

### **Dashboard Estatísticas**
- **Total de Produtos** cadastrados
- **Fornecedores Ativos** no sistema
- **Propostas Ativas** (não expiradas)
- **Alertas Pendentes** não lidos

### **Relatórios Disponíveis**
- **Volume Mensal** de propostas criadas
- **Distribuição por Status** em formato visual
- **Top Fornecedores** por valor de propostas
- **Exportação** de dados para análise externa

## 🔄 Sistema de Alertas

### **Tipos de Alertas**
1. **Vencimento Próximo** 🟡 - 2 meses antes da expiração
2. **Vencido** 🔴 - Propostas já expiradas
3. **Renovação Solicitada** 🔵 - Processo de renovação iniciado

### **Ações nos Alertas**
- ✅ **Marcar como lido**
- 👁️ **Visualizar proposta relacionada**
- 🔄 **Renovar proposta diretamente**
- 🗑️ **Remover alerta**

## 💾 Estrutura de Arquivos

```
📁 Projeto SGP/
├── 📄 index.html                 # Página principal
├── 📁 css/
│   └── 📄 style.css             # Estilos customizados
├── 📁 js/
│   ├── 📄 utils.js              # Funções utilitárias
│   ├── 📄 database.js           # Gerenciador de dados
│   ├── 📄 produtos.js           # Módulo de produtos
│   ├── 📄 fornecedores.js       # Módulo de fornecedores
│   ├── 📄 propostas.js          # Módulo de propostas
│   ├── 📄 alertas.js            # Sistema de alertas
│   ├── 📄 relatorios.js         # Relatórios e gráficos
│   └── 📄 main.js               # Controlador principal
└── 📄 README.md                 # Esta documentação
```

## 🎯 Próximos Passos Recomendados

### **Melhorias Futuras Sugeridas**
1. **Sistema de Usuários** com login e permissões
2. **Notificações por Email** para alertas importantes
3. **API de Integração** com sistemas ERP existentes
4. **Anexos de Arquivos** nas propostas
5. **Histórico de Alterações** com auditoria completa
6. **Relatórios Avançados** em PDF e Excel
7. **Dashboard Personalizado** por usuário
8. **Workflow de Aprovação** para propostas

### **Integrações Possíveis**
- **Sistemas ERP** via API REST
- **Plataformas de E-mail** para notificações
- **Serviços de Backup** na nuvem
- **Ferramentas de BI** para análises avançadas

## 🏆 Características de Destaque

### ✅ **Sistema Completo e Funcional**
- Todos os módulos implementados e testados
- Interface profissional e responsiva
- Fluxo de trabalho otimizado

### ✅ **Tecnologia Moderna**
- Código JavaScript ES6+ modular
- CSS responsivo com Tailwind
- Gráficos interativos com Chart.js

### ✅ **Experiência do Usuário**
- Interface intuitiva e amigável
- Feedback visual em todas as ações
- Navegação fluida entre módulos

### ✅ **Gestão Inteligente**
- Automação de alertas por vencimento
- Cálculos automáticos de valores
- Prevenção de erros com validações

---

## 📞 Suporte e Documentação

Este sistema foi desenvolvido para ser **auto-explicativo** e **intuitivo**. Todas as funcionalidades possuem **tooltips** e **mensagens de ajuda** integradas.

Para **deployment** em produção, utilize a aba **Publish** da plataforma para disponibilizar o sistema online com um clique.

**🚀 Sistema pronto para uso em produção!**
