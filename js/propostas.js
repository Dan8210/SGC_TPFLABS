// Proposals management module for SGP

class PropostasManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.filters = {};
        this.propostas = [];
        this.produtos = [];
        this.fornecedores = [];
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadDependencies();
        this.loadPropostas();
    }

    async loadDependencies() {
        try {
            // Load products and suppliers for dropdowns
            if (window.produtosManager) {
                this.produtos = await produtosManager.getAllProdutos();
            }
            if (window.fornecedoresManager) {
                this.fornecedores = await fornecedoresManager.getAllFornecedores();
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    }

    bindEvents() {
        // New proposal button
        const novaPropostaBtn = document.getElementById('novaPropostaBtn');
        if (novaPropostaBtn) {
            novaPropostaBtn.addEventListener('click', () => this.showPropostaModal());
        }

        // Search input
        const searchInput = document.getElementById('searchPropostas');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.searchTerm = searchInput.value;
                this.loadPropostas();
            }, 300));
        }

        // Filter inputs
        const statusFilter = document.getElementById('filterStatusProposta');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.loadPropostas();
            });
        }

        const dataInicioFilter = document.getElementById('filterDataInicio');
        if (dataInicioFilter) {
            dataInicioFilter.addEventListener('change', () => {
                this.filters.data_inicio = dataInicioFilter.value;
                this.loadPropostas();
            });
        }

        const dataFimFilter = document.getElementById('filterDataFim');
        if (dataFimFilter) {
            dataFimFilter.addEventListener('change', () => {
                this.filters.data_fim = dataFimFilter.value;
                this.loadPropostas();
            });
        }
    }

    async loadPropostas() {
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                ...this.filters
            };

            const response = await db.searchPropostas(this.searchTerm, this.filters);
            this.propostas = response.data || [];
            
            // Update expired proposals
            await this.updateExpiredProposals();
            
            this.renderPropostasTable();
            
        } catch (error) {
            console.error('Error loading propostas:', error);
            Utils.showToast('Erro ao carregar propostas', 'error');
        }
    }

    async updateExpiredProposals() {
        try {
            let updated = false;
            
            for (const proposta of this.propostas) {
                const dataValidade = new Date(proposta.data_validade);
                if (Utils.isExpired(dataValidade) && proposta.status !== 'expirada') {
                    await db.patch('propostas', proposta.id, { status: 'expirada' });
                    proposta.status = 'expirada';
                    updated = true;
                }
            }
            
            if (updated) {
                // Refresh data if any proposal was updated
                const response = await db.searchPropostas(this.searchTerm, this.filters);
                this.propostas = response.data || [];
            }
            
        } catch (error) {
            console.error('Error updating expired proposals:', error);
        }
    }

    renderPropostasTable() {
        const tbody = document.getElementById('corpoTabelaPropostas');
        if (!tbody) return;

        if (this.propostas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-file-contract text-4xl text-gray-300 mb-2"></i>
                            <p>Nenhuma proposta encontrada</p>
                            <button class="mt-2 text-blue-600 hover:text-blue-900" onclick="propostasManager.showPropostaModal()">
                                Criar primeira proposta
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.propostas.map(proposta => {
            const produto = this.produtos.find(p => p.id === proposta.produto_id);
            const fornecedor = this.fornecedores.find(f => f.id === proposta.fornecedor_id);
            const dataValidade = new Date(proposta.data_validade);
            const isExpiringSoon = Utils.isWithinDays(dataValidade, 60) && proposta.status !== 'expirada';
            
            return `
                <tr class="hover:bg-gray-50 ${isExpiringSoon ? 'bg-yellow-50' : ''}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${Utils.sanitizeHtml(proposta.numero_proposta)}</div>
                        <div class="text-sm text-gray-500">ID: ${Utils.sanitizeHtml(proposta.id.substring(0, 8))}...</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${produto?.nome || 'Produto não encontrado'}</div>
                        <div class="text-sm text-gray-500">Qtd: ${Utils.formatNumber(proposta.quantidade)} ${produto?.unidade || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${fornecedor?.razao_social || 'Fornecedor não encontrado'}</div>
                        <div class="text-sm text-gray-500">${fornecedor?.nome_fantasia || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${Utils.formatCurrency(proposta.preco_total)}</div>
                        <div class="text-sm text-gray-500">Unit: ${Utils.formatCurrency(proposta.preco_unitario)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${Utils.formatDate(proposta.data_validade)}</div>
                        ${isExpiringSoon ? '<div class="text-xs text-orange-600"><i class="fas fa-exclamation-triangle mr-1"></i>Vencendo</div>' : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${Utils.createStatusBadge(proposta.status)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="propostasManager.viewProposta('${proposta.id}')" 
                                class="table-action-btn table-action-view">
                            <i class="fas fa-eye mr-1"></i>Ver
                        </button>
                        <button onclick="propostasManager.editProposta('${proposta.id}')" 
                                class="table-action-btn table-action-edit">
                            <i class="fas fa-edit mr-1"></i>Editar
                        </button>
                        ${proposta.status === 'pendente' ? `
                            <button onclick="propostasManager.renewProposta('${proposta.id}')" 
                                    class="table-action-btn text-orange-600 hover:text-orange-900">
                                <i class="fas fa-sync-alt mr-1"></i>Renovar
                            </button>
                        ` : ''}
                        <button onclick="propostasManager.deleteProposta('${proposta.id}')" 
                                class="table-action-btn table-action-delete">
                            <i class="fas fa-trash mr-1"></i>Excluir
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    showPropostaModal(proposta = null) {
        const isEdit = proposta !== null;
        const modalTitle = isEdit ? 'Editar Proposta' : 'Nova Proposta';
        const submitText = isEdit ? 'Salvar Alterações' : 'Criar Proposta';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'propostaModal';
        modal.innerHTML = `
            <div class="modal-content p-6 max-w-4xl w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900">${modalTitle}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="propostaForm" class="space-y-6">
                    <!-- Identificação -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Identificação da Proposta</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Número da Proposta *</label>
                                <input type="text" id="numeroProposta" name="numero_proposta" class="form-input" 
                                       value="${proposta?.numero_proposta || ''}" required 
                                       placeholder="Ex: PROP-2024-001">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="statusProposta" name="status" class="form-select">
                                    <option value="pendente" ${proposta?.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                                    <option value="aprovada" ${proposta?.status === 'aprovada' ? 'selected' : ''}>Aprovada</option>
                                    <option value="rejeitada" ${proposta?.status === 'rejeitada' ? 'selected' : ''}>Rejeitada</option>
                                    <option value="renovacao_solicitada" ${proposta?.status === 'renovacao_solicitada' ? 'selected' : ''}>Renovação Solicitada</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Produto e Fornecedor -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Produto e Fornecedor</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Produto *</label>
                                <select id="produtoId" name="produto_id" class="form-select" required onchange="propostasManager.updateProductInfo()">
                                    <option value="">Selecione um produto</option>
                                    ${this.produtos.map(produto => `
                                        <option value="${produto.id}" ${proposta?.produto_id === produto.id ? 'selected' : ''}>
                                            ${produto.nome} (${produto.categoria})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fornecedor *</label>
                                <select id="fornecedorId" name="fornecedor_id" class="form-select" required>
                                    <option value="">Selecione um fornecedor</option>
                                    ${this.fornecedores.map(fornecedor => `
                                        <option value="${fornecedor.id}" ${proposta?.fornecedor_id === fornecedor.id ? 'selected' : ''}>
                                            ${fornecedor.razao_social}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div id="productInfo" class="mt-4 p-3 bg-gray-50 rounded-md hidden">
                            <h5 class="font-medium text-gray-900 mb-2">Informações do Produto</h5>
                            <div id="productDetails"></div>
                        </div>
                    </div>
                    
                    <!-- Valores e Quantidades -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Valores e Quantidades</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="form-group">
                                <label class="form-label">Quantidade *</label>
                                <input type="number" id="quantidade" name="quantidade" class="form-input" 
                                       value="${proposta?.quantidade || ''}" required min="1" step="1"
                                       placeholder="0" onchange="propostasManager.calculateTotal()">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Preço Unitário (R$) *</label>
                                <input type="number" id="precoUnitario" name="preco_unitario" class="form-input" 
                                       value="${proposta?.preco_unitario || ''}" required min="0" step="0.01"
                                       placeholder="0,00" onchange="propostasManager.calculateTotal()">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Preço Total (R$)</label>
                                <input type="number" id="precoTotal" name="preco_total" class="form-input" 
                                       value="${proposta?.preco_total || ''}" readonly 
                                       style="background-color: #f9fafb;">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Prazos -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Prazos</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="form-group">
                                <label class="form-label">Prazo de Entrega (dias)</label>
                                <input type="number" id="prazoEntrega" name="prazo_entrega" class="form-input" 
                                       value="${proposta?.prazo_entrega || ''}" min="1" step="1"
                                       placeholder="Ex: 30">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Data de Criação</label>
                                <input type="date" id="dataCriacao" name="data_criacao" class="form-input" 
                                       value="${proposta?.data_criacao ? new Date(proposta.data_criacao).toISOString().split('T')[0] : Utils.getCurrentDate()}"
                                       ${isEdit ? 'readonly' : ''}>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Data de Validade *</label>
                                <input type="date" id="dataValidade" name="data_validade" class="form-input" 
                                       value="${proposta?.data_validade ? new Date(proposta.data_validade).toISOString().split('T')[0] : ''}" 
                                       required>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Observações -->
                    <div class="form-group">
                        <label class="form-label">Observações</label>
                        <textarea id="observacoes" name="observacoes" class="form-textarea" rows="4" 
                                  placeholder="Observações adicionais sobre a proposta...">${proposta?.observacoes || ''}</textarea>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onclick="this.closest('.modal-overlay').remove()" 
                                class="btn-secondary">Cancelar</button>
                        <button type="submit" id="submitBtn" class="btn-primary">${submitText}</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
        
        // Set default validity date if creating new proposal (6 months from creation)
        if (!isEdit) {
            const dataCriacao = document.getElementById('dataCriacao').value;
            if (dataCriacao) {
                const dataValidade = Utils.addMonths(new Date(dataCriacao), 6);
                document.getElementById('dataValidade').value = dataValidade.toISOString().split('T')[0];
            }
        }
        
        // Calculate total if editing
        if (isEdit) {
            this.calculateTotal();
        }
        
        // Update product info if product is selected
        this.updateProductInfo();
        
        // Bind form submit
        document.getElementById('propostaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProposta(isEdit);
        });

        // Focus on first input
        setTimeout(() => {
            document.getElementById('numeroProposta').focus();
        }, 100);
    }

    updateProductInfo() {
        const produtoSelect = document.getElementById('produtoId');
        const productInfo = document.getElementById('productInfo');
        const productDetails = document.getElementById('productDetails');

        if (!produtoSelect || !productInfo || !productDetails) return;

        const selectedProductId = produtoSelect.value;
        if (!selectedProductId) {
            productInfo.classList.add('hidden');
            return;
        }

        const produto = this.produtos.find(p => p.id === selectedProductId);
        if (!produto) {
            productInfo.classList.add('hidden');
            return;
        }

        productDetails.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="font-medium">Categoria:</span> ${produto.categoria}
                </div>
                <div>
                    <span class="font-medium">Unidade:</span> ${produto.unidade}
                </div>
                <div class="md:col-span-2">
                    <span class="font-medium">Descrição:</span> ${produto.descricao || 'Não informado'}
                </div>
            </div>
        `;

        productInfo.classList.remove('hidden');
    }

    calculateTotal() {
        const quantidadeInput = document.getElementById('quantidade');
        const precoUnitarioInput = document.getElementById('precoUnitario');
        const precoTotalInput = document.getElementById('precoTotal');

        if (!quantidadeInput || !precoUnitarioInput || !precoTotalInput) return;

        const quantidade = parseFloat(quantidadeInput.value) || 0;
        const precoUnitario = parseFloat(precoUnitarioInput.value) || 0;
        const precoTotal = quantidade * precoUnitario;

        precoTotalInput.value = precoTotal.toFixed(2);
    }

    async saveProposta(isEdit) {
        const form = document.getElementById('propostaForm');
        const submitBtn = document.getElementById('submitBtn');
        const hideLoading = Utils.showLoading(submitBtn);

        try {
            const formData = new FormData(form);
            const proposta = {
                numero_proposta: formData.get('numero_proposta').trim(),
                produto_id: formData.get('produto_id'),
                fornecedor_id: formData.get('fornecedor_id'),
                quantidade: parseFloat(formData.get('quantidade')) || 0,
                preco_unitario: parseFloat(formData.get('preco_unitario')) || 0,
                preco_total: parseFloat(formData.get('preco_total')) || 0,
                prazo_entrega: parseInt(formData.get('prazo_entrega')) || null,
                data_criacao: new Date(formData.get('data_criacao')).toISOString(),
                data_validade: new Date(formData.get('data_validade')).toISOString(),
                status: formData.get('status'),
                observacoes: formData.get('observacoes').trim(),
                anexos: []
            };

            // Validation
            if (!proposta.numero_proposta) {
                throw new Error('Número da proposta é obrigatório');
            }
            if (!proposta.produto_id) {
                throw new Error('Produto é obrigatório');
            }
            if (!proposta.fornecedor_id) {
                throw new Error('Fornecedor é obrigatório');
            }
            if (!proposta.quantidade || proposta.quantidade <= 0) {
                throw new Error('Quantidade deve ser maior que zero');
            }
            if (!proposta.preco_unitario || proposta.preco_unitario <= 0) {
                throw new Error('Preço unitário deve ser maior que zero');
            }

            // Check for duplicate proposal number (only for new proposals)
            if (!isEdit) {
                const existingProposta = await this.findByNumero(proposta.numero_proposta);
                if (existingProposta) {
                    throw new Error('Número de proposta já existe');
                }
            }

            let result;
            if (isEdit) {
                const currentProposta = await db.getProposta(document.getElementById('propostaForm').dataset.originalId);
                result = await db.updateProposta(currentProposta.id, proposta);
                Utils.showToast('Proposta atualizada com sucesso!', 'success');
            } else {
                result = await db.createProposta(proposta);
                Utils.showToast('Proposta criada com sucesso!', 'success');
            }

            document.getElementById('propostaModal').remove();
            this.loadPropostas();

        } catch (error) {
            console.error('Error saving proposta:', error);
            Utils.showToast(error.message || 'Erro ao salvar proposta', 'error');
        } finally {
            hideLoading();
        }
    }

    async findByNumero(numeroProposta) {
        try {
            const response = await db.listPropostas();
            const propostas = response.data || [];
            return propostas.find(p => p.numero_proposta === numeroProposta);
        } catch (error) {
            console.error('Error finding proposta by number:', error);
            return null;
        }
    }

    async viewProposta(id) {
        try {
            const proposta = await db.getProposta(id);
            if (!proposta) {
                Utils.showToast('Proposta não encontrada', 'error');
                return;
            }

            const produto = this.produtos.find(p => p.id === proposta.produto_id);
            const fornecedor = this.fornecedores.find(f => f.id === proposta.fornecedor_id);

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content p-6 max-w-4xl w-full mx-4">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-medium text-gray-900">Detalhes da Proposta</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-6">
                        <!-- Header with key info -->
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Número da Proposta</label>
                                    <p class="text-lg font-semibold text-blue-900">${proposta.numero_proposta}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Status</label>
                                    <p class="mt-1">${Utils.createStatusBadge(proposta.status)}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Valor Total</label>
                                    <p class="text-lg font-semibold text-green-700">${Utils.formatCurrency(proposta.preco_total)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Product and Supplier -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Produto e Fornecedor</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Produto</label>
                                    <div class="mt-2 p-3 bg-gray-50 rounded">
                                        <p class="font-medium">${produto?.nome || 'Produto não encontrado'}</p>
                                        <p class="text-sm text-gray-600">${produto?.categoria || ''}</p>
                                        <p class="text-sm text-gray-600">Unidade: ${produto?.unidade || ''}</p>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Fornecedor</label>
                                    <div class="mt-2 p-3 bg-gray-50 rounded">
                                        <p class="font-medium">${fornecedor?.razao_social || 'Fornecedor não encontrado'}</p>
                                        <p class="text-sm text-gray-600">${fornecedor?.nome_fantasia || ''}</p>
                                        <p class="text-sm text-gray-600">${Utils.formatCNPJ(fornecedor?.cnpj || '')}</p>
                                        <p class="text-sm text-gray-600">${Utils.formatPhone(fornecedor?.telefone || '')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Values and Quantities -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Valores e Quantidades</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Quantidade</label>
                                    <p class="mt-1 text-sm text-gray-900">${Utils.formatNumber(proposta.quantidade)} ${produto?.unidade || ''}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Preço Unitário</label>
                                    <p class="mt-1 text-sm text-gray-900">${Utils.formatCurrency(proposta.preco_unitario)}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Preço Total</label>
                                    <p class="mt-1 text-lg font-semibold text-green-700">${Utils.formatCurrency(proposta.preco_total)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Dates and Delivery -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Prazos</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Data de Criação</label>
                                    <p class="mt-1 text-sm text-gray-900">${Utils.formatDate(proposta.data_criacao)}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Data de Validade</label>
                                    <p class="mt-1 text-sm text-gray-900">${Utils.formatDate(proposta.data_validade)}</p>
                                    ${Utils.isWithinDays(new Date(proposta.data_validade), 60) && proposta.status !== 'expirada' ? 
                                        '<p class="text-xs text-orange-600"><i class="fas fa-exclamation-triangle mr-1"></i>Vencendo em breve</p>' : ''}
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Prazo de Entrega</label>
                                    <p class="mt-1 text-sm text-gray-900">${proposta.prazo_entrega ? proposta.prazo_entrega + ' dias' : 'Não informado'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Observations -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Observações</h4>
                            <p class="text-sm text-gray-900 whitespace-pre-wrap">${proposta.observacoes || 'Nenhuma observação registrada'}</p>
                        </div>
                        
                        <!-- Metadata -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                                <label class="block font-medium">Criado em</label>
                                <p>${Utils.formatDateTime(proposta.created_at)}</p>
                            </div>
                            <div>
                                <label class="block font-medium">Atualizado em</label>
                                <p>${Utils.formatDateTime(proposta.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">Fechar</button>
                        <button onclick="propostasManager.editProposta('${proposta.id}'); this.closest('.modal-overlay').remove();" 
                                class="btn-primary">
                            <i class="fas fa-edit mr-2"></i>Editar
                        </button>
                        ${proposta.status === 'pendente' ? `
                            <button onclick="propostasManager.renewProposta('${proposta.id}'); this.closest('.modal-overlay').remove();" 
                                    class="btn-warning">
                                <i class="fas fa-sync-alt mr-2"></i>Solicitar Renovação
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            document.getElementById('modalsContainer').appendChild(modal);

        } catch (error) {
            console.error('Error viewing proposta:', error);
            Utils.showToast('Erro ao carregar detalhes da proposta', 'error');
        }
    }

    async editProposta(id) {
        try {
            const proposta = await db.getProposta(id);
            if (!proposta) {
                Utils.showToast('Proposta não encontrada', 'error');
                return;
            }
            this.showPropostaModal(proposta);
            
            // Store original ID for update
            setTimeout(() => {
                document.getElementById('propostaForm').dataset.originalId = proposta.id;
            }, 100);
            
        } catch (error) {
            console.error('Error loading proposta for edit:', error);
            Utils.showToast('Erro ao carregar proposta para edição', 'error');
        }
    }

    async renewProposta(id) {
        try {
            const proposta = await db.getProposta(id);
            if (!proposta) {
                Utils.showToast('Proposta não encontrada', 'error');
                return;
            }

            const confirmed = await Utils.confirmDialog(
                `Solicitar renovação da proposta "${proposta.numero_proposta}"? O status será alterado para "Renovação Solicitada".`
            );

            if (confirmed) {
                await db.patch('propostas', id, { 
                    status: 'renovacao_solicitada' 
                });
                
                // Create alert
                await db.createAlerta({
                    proposta_id: id,
                    tipo_alerta: 'renovacao_solicitada',
                    mensagem: `Renovação solicitada para a proposta ${proposta.numero_proposta}`,
                    lido: false,
                    ativo: true
                });
                
                Utils.showToast('Renovação solicitada com sucesso!', 'success');
                this.loadPropostas();
            }

        } catch (error) {
            console.error('Error renewing proposta:', error);
            Utils.showToast('Erro ao solicitar renovação', 'error');
        }
    }

    async deleteProposta(id) {
        try {
            const proposta = await db.getProposta(id);
            if (!proposta) {
                Utils.showToast('Proposta não encontrada', 'error');
                return;
            }

            const confirmed = await Utils.confirmDialog(
                `Tem certeza que deseja excluir a proposta "${proposta.numero_proposta}"? Esta ação não pode ser desfeita.`
            );

            if (confirmed) {
                await db.deleteProposta(id);
                Utils.showToast('Proposta excluída com sucesso!', 'success');
                this.loadPropostas();
            }

        } catch (error) {
            console.error('Error deleting proposta:', error);
            Utils.showToast('Erro ao excluir proposta', 'error');
        }
    }

    // Get all propostas for use in other modules
    async getAllPropostas() {
        try {
            const response = await db.listPropostas({ limit: 1000 });
            return response.data || [];
        } catch (error) {
            console.error('Error getting all propostas:', error);
            return [];
        }
    }
}

// Initialize propostas manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for dependencies to load
    setTimeout(() => {
        window.propostasManager = new PropostasManager();
    }, 500);
});