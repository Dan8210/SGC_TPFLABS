// Database operations using the RESTful Table API

class DatabaseManager {
    constructor() {
        this.baseUrl = 'tables';
    }

    // Generic CRUD operations
    
    async list(tableName, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = queryString ? `${this.baseUrl}/${tableName}?${queryString}` : `${this.baseUrl}/${tableName}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Database list error:', error);
            throw error;
        }
    }

    async get(tableName, id) {
        try {
            const response = await fetch(`${this.baseUrl}/${tableName}/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Database get error:', error);
            throw error;
        }
    }

    async create(tableName, data) {
        try {
            const response = await fetch(`${this.baseUrl}/${tableName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Database create error:', error);
            throw error;
        }
    }

    async update(tableName, id, data) {
        try {
            const response = await fetch(`${this.baseUrl}/${tableName}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    }

    async patch(tableName, id, data) {
        try {
            const response = await fetch(`${this.baseUrl}/${tableName}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Database patch error:', error);
            throw error;
        }
    }

    async delete(tableName, id) {
        try {
            const response = await fetch(`${this.baseUrl}/${tableName}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Database delete error:', error);
            throw error;
        }
    }

    // Specialized methods for each table

    // Produtos methods
    async listProdutos(params = {}) {
        return await this.list('produtos', params);
    }

    async getProduto(id) {
        return await this.get('produtos', id);
    }

    async createProduto(produto) {
        // Generate unique ID if not provided
        if (!produto.id) {
            produto.id = Utils.generateId();
        }
        return await this.create('produtos', produto);
    }

    async updateProduto(id, produto) {
        return await this.update('produtos', id, produto);
    }

    async deleteProduto(id) {
        return await this.delete('produtos', id);
    }

    async searchProdutos(searchTerm, filters = {}) {
        const params = { ...filters };
        if (searchTerm) {
            params.search = searchTerm;
        }
        return await this.listProdutos(params);
    }

    // Fornecedores methods
    async listFornecedores(params = {}) {
        return await this.list('fornecedores', params);
    }

    async getFornecedor(id) {
        return await this.get('fornecedores', id);
    }

    async createFornecedor(fornecedor) {
        // Generate unique ID if not provided
        if (!fornecedor.id) {
            fornecedor.id = Utils.generateId();
        }
        return await this.create('fornecedores', fornecedor);
    }

    async updateFornecedor(id, fornecedor) {
        return await this.update('fornecedores', id, fornecedor);
    }

    async deleteFornecedor(id) {
        return await this.delete('fornecedores', id);
    }

    async searchFornecedores(searchTerm, filters = {}) {
        const params = { ...filters };
        if (searchTerm) {
            params.search = searchTerm;
        }
        return await this.listFornecedores(params);
    }

    // Propostas methods
    async listPropostas(params = {}) {
        return await this.list('propostas', params);
    }

    async getProposta(id) {
        return await this.get('propostas', id);
    }

    async createProposta(proposta) {
        // Generate unique ID if not provided
        if (!proposta.id) {
            proposta.id = Utils.generateId();
        }
        
        // Set creation date if not provided
        if (!proposta.data_criacao) {
            proposta.data_criacao = new Date().toISOString();
        }
        
        // Calculate validity date (6 months from creation)
        if (!proposta.data_validade) {
            proposta.data_validade = Utils.addMonths(new Date(), 6).toISOString();
        }
        
        // Calculate total price
        if (proposta.quantidade && proposta.preco_unitario) {
            proposta.preco_total = proposta.quantidade * proposta.preco_unitario;
        }
        
        return await this.create('propostas', proposta);
    }

    async updateProposta(id, proposta) {
        // Recalculate total price if needed
        if (proposta.quantidade && proposta.preco_unitario) {
            proposta.preco_total = proposta.quantidade * proposta.preco_unitario;
        }
        
        return await this.update('propostas', id, proposta);
    }

    async deleteProposta(id) {
        return await this.delete('propostas', id);
    }

    async searchPropostas(searchTerm, filters = {}) {
        const params = { ...filters };
        if (searchTerm) {
            params.search = searchTerm;
        }
        return await this.listPropostas(params);
    }

    async getPropostasVencendo(days = 60) {
        try {
            const response = await this.listPropostas();
            const propostas = response.data || [];
            
            return propostas.filter(proposta => {
                const dataValidade = new Date(proposta.data_validade);
                return Utils.isWithinDays(dataValidade, days) && proposta.status !== 'expirada';
            });
        } catch (error) {
            console.error('Error getting propostas vencendo:', error);
            return [];
        }
    }

    async getPropostasVencidas() {
        try {
            const response = await this.listPropostas();
            const propostas = response.data || [];
            
            return propostas.filter(proposta => {
                const dataValidade = new Date(proposta.data_validade);
                return Utils.isExpired(dataValidade) && proposta.status !== 'expirada';
            });
        } catch (error) {
            console.error('Error getting propostas vencidas:', error);
            return [];
        }
    }

    // Alertas methods
    async listAlertas(params = {}) {
        return await this.list('alertas', params);
    }

    async getAlerta(id) {
        return await this.get('alertas', id);
    }

    async createAlerta(alerta) {
        // Generate unique ID if not provided
        if (!alerta.id) {
            alerta.id = Utils.generateId();
        }
        
        // Set alert date if not provided
        if (!alerta.data_alerta) {
            alerta.data_alerta = new Date().toISOString();
        }
        
        return await this.create('alertas', alerta);
    }

    async updateAlerta(id, alerta) {
        return await this.update('alertas', id, alerta);
    }

    async deleteAlerta(id) {
        return await this.delete('alertas', id);
    }

    async getAlertasAtivos() {
        try {
            const response = await this.listAlertas();
            const alertas = response.data || [];
            
            return alertas.filter(alerta => alerta.ativo && !alerta.lido);
        } catch (error) {
            console.error('Error getting alertas ativos:', error);
            return [];
        }
    }

    async marcarAlertaComoLido(id) {
        return await this.patch('alertas', id, { lido: true });
    }

    // Utility methods for reports and statistics
    async getEstatisticas() {
        try {
            const [produtos, fornecedores, propostas, alertas] = await Promise.all([
                this.listProdutos(),
                this.listFornecedores(),
                this.listPropostas(),
                this.getAlertasAtivos()
            ]);

            return {
                totalProdutos: produtos.data?.length || 0,
                totalFornecedores: fornecedores.data?.filter(f => f.ativo)?.length || 0,
                totalPropostas: propostas.data?.filter(p => p.status !== 'expirada')?.length || 0,
                totalAlertas: alertas.length || 0,
                produtos: produtos.data || [],
                fornecedores: fornecedores.data || [],
                propostas: propostas.data || [],
                alertas: alertas
            };
        } catch (error) {
            console.error('Error getting estatisticas:', error);
            return {
                totalProdutos: 0,
                totalFornecedores: 0,
                totalPropostas: 0,
                totalAlertas: 0,
                produtos: [],
                fornecedores: [],
                propostas: [],
                alertas: []
            };
        }
    }

    // Check and update expired proposals
    async updatePropostasExpiradas() {
        try {
            const response = await this.listPropostas();
            const propostas = response.data || [];
            
            const propostasExpiradas = propostas.filter(proposta => {
                const dataValidade = new Date(proposta.data_validade);
                return Utils.isExpired(dataValidade) && proposta.status !== 'expirada';
            });

            for (const proposta of propostasExpiradas) {
                await this.patch('propostas', proposta.id, { status: 'expirada' });
                
                // Create alert for expired proposal
                await this.createAlerta({
                    proposta_id: proposta.id,
                    tipo_alerta: 'vencido',
                    mensagem: `A proposta ${proposta.numero_proposta} expirou em ${Utils.formatDate(proposta.data_validade)}`,
                    lido: false,
                    ativo: true
                });
            }

            return propostasExpiradas.length;
        } catch (error) {
            console.error('Error updating propostas expiradas:', error);
            return 0;
        }
    }

    // Create alerts for proposals expiring soon
    async criarAlertasVencimento() {
        try {
            const response = await this.listPropostas();
            const propostas = response.data || [];
            
            const propostasVencendo = propostas.filter(proposta => {
                const dataValidade = new Date(proposta.data_validade);
                return Utils.isWithinDays(dataValidade, 60) && proposta.status === 'pendente';
            });

            let alertasCriados = 0;

            for (const proposta of propostasVencendo) {
                // Check if alert already exists for this proposal
                const alertasExistentes = await this.listAlertas();
                const alertaExiste = alertasExistentes.data?.some(alerta => 
                    alerta.proposta_id === proposta.id && 
                    alerta.tipo_alerta === 'vencimento_proximo' && 
                    alerta.ativo
                );

                if (!alertaExiste) {
                    await this.createAlerta({
                        proposta_id: proposta.id,
                        tipo_alerta: 'vencimento_proximo',
                        mensagem: `A proposta ${proposta.numero_proposta} vence em ${Utils.formatDate(proposta.data_validade)}. Solicite renovação.`,
                        lido: false,
                        ativo: true
                    });
                    alertasCriados++;
                }
            }

            return alertasCriados;
        } catch (error) {
            console.error('Error creating alerts vencimento:', error);
            return 0;
        }
    }
}

// Create global database instance
window.db = new DatabaseManager();