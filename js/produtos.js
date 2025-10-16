// Products management module for SGP

class ProdutosManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.filters = {};
        this.produtos = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProdutos();
    }

    bindEvents() {
        // New product button
        const novoProdutoBtn = document.getElementById('novoProdutoBtn');
        if (novoProdutoBtn) {
            novoProdutoBtn.addEventListener('click', () => this.showProdutoModal());
        }

        // Search input
        const searchInput = document.getElementById('searchProdutos');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.searchTerm = searchInput.value;
                this.loadProdutos();
            }, 300));
        }

        // Filter inputs
        const categoryFilter = document.getElementById('filterCategoria');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.categoria = categoryFilter.value;
                this.loadProdutos();
            });
        }

        const statusFilter = document.getElementById('filterStatusProduto');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.ativo = statusFilter.value;
                this.loadProdutos();
            });
        }
    }

    async loadProdutos() {
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                ...this.filters
            };

            const response = await db.searchProdutos(this.searchTerm, this.filters);
            this.produtos = response.data || [];
            
            this.renderProdutosTable();
            this.updateCategoryFilter();
            
        } catch (error) {
            console.error('Error loading produtos:', error);
            Utils.showToast('Erro ao carregar produtos', 'error');
        }
    }

    renderProdutosTable() {
        const tbody = document.getElementById('corpoTabelaProdutos');
        if (!tbody) return;

        if (this.produtos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-box text-4xl text-gray-300 mb-2"></i>
                            <p>Nenhum produto encontrado</p>
                            <button class="mt-2 text-blue-600 hover:text-blue-900" onclick="produtosManager.showProdutoModal()">
                                Cadastrar primeiro produto
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.produtos.map(produto => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    ${Utils.sanitizeHtml(produto.id)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${Utils.sanitizeHtml(produto.nome)}</div>
                    <div class="text-sm text-gray-500">${Utils.sanitizeHtml(produto.descricao || '').substring(0, 50)}...</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.sanitizeHtml(produto.categoria || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.sanitizeHtml(produto.unidade || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${Utils.createStatusBadge(produto.ativo)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="produtosManager.viewProduto('${produto.id}')" 
                            class="table-action-btn table-action-view">
                        <i class="fas fa-eye mr-1"></i>Ver
                    </button>
                    <button onclick="produtosManager.editProduto('${produto.id}')" 
                            class="table-action-btn table-action-edit">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    <button onclick="produtosManager.deleteProduto('${produto.id}')" 
                            class="table-action-btn table-action-delete">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateCategoryFilter() {
        const categoryFilter = document.getElementById('filterCategoria');
        if (!categoryFilter) return;

        // Get unique categories
        const categories = [...new Set(this.produtos
            .map(p => p.categoria)
            .filter(c => c && c.trim() !== '')
        )].sort();

        // Keep current selection
        const currentValue = categoryFilter.value;
        
        // Update options
        categoryFilter.innerHTML = `
            <option value="">Todas as categorias</option>
            ${categories.map(cat => `<option value="${cat}" ${cat === currentValue ? 'selected' : ''}>${cat}</option>`).join('')}
        `;
    }

    showProdutoModal(produto = null) {
        const isEdit = produto !== null;
        const modalTitle = isEdit ? 'Editar Produto' : 'Novo Produto';
        const submitText = isEdit ? 'Salvar Alterações' : 'Criar Produto';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'produtoModal';
        modal.innerHTML = `
            <div class="modal-content p-6 max-w-2xl w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900">${modalTitle}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="produtoForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">ID do Produto *</label>
                            <input type="text" id="produtoId" name="id" class="form-input" 
                                   value="${produto?.id || ''}" 
                                   ${isEdit ? 'readonly' : ''} 
                                   placeholder="Deixe vazio para gerar automaticamente">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Nome do Produto *</label>
                            <input type="text" id="produtoNome" name="nome" class="form-input" 
                                   value="${produto?.nome || ''}" required placeholder="Ex: Notebook Dell Inspiron">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <textarea id="produtoDescricao" name="descricao" class="form-textarea" rows="3" 
                                  placeholder="Descrição detalhada do produto...">${produto?.descricao || ''}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Categoria *</label>
                            <input type="text" id="produtoCategoria" name="categoria" class="form-input" 
                                   value="${produto?.categoria || ''}" required 
                                   placeholder="Ex: Eletrônicos, Material de Escritório"
                                   list="categoriasList">
                            <datalist id="categoriasList">
                                <!-- Will be populated dynamically -->
                            </datalist>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Unidade *</label>
                            <select id="produtoUnidade" name="unidade" class="form-select" required>
                                <option value="">Selecione a unidade</option>
                                <option value="UN" ${produto?.unidade === 'UN' ? 'selected' : ''}>Unidade</option>
                                <option value="KG" ${produto?.unidade === 'KG' ? 'selected' : ''}>Quilograma</option>
                                <option value="G" ${produto?.unidade === 'G' ? 'selected' : ''}>Grama</option>
                                <option value="L" ${produto?.unidade === 'L' ? 'selected' : ''}>Litro</option>
                                <option value="ML" ${produto?.unidade === 'ML' ? 'selected' : ''}>Mililitro</option>
                                <option value="M" ${produto?.unidade === 'M' ? 'selected' : ''}>Metro</option>
                                <option value="M2" ${produto?.unidade === 'M2' ? 'selected' : ''}>Metro Quadrado</option>
                                <option value="M3" ${produto?.unidade === 'M3' ? 'selected' : ''}>Metro Cúbico</option>
                                <option value="CX" ${produto?.unidade === 'CX' ? 'selected' : ''}>Caixa</option>
                                <option value="PC" ${produto?.unidade === 'PC' ? 'selected' : ''}>Pacote</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Especificações Técnicas</label>
                        <textarea id="produtoEspecificacoes" name="especificacoes" class="form-textarea" rows="4" 
                                  placeholder="Especificações técnicas detalhadas do produto...">${produto?.especificacoes || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" id="produtoAtivo" name="ativo" class="mr-2" 
                                   ${produto?.ativo !== false ? 'checked' : ''}>
                            <span class="text-sm font-medium text-gray-700">Produto ativo</span>
                        </label>
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
        
        // Populate categories datalist
        this.populateCategoriesDatalist();
        
        // Bind form submit
        document.getElementById('produtoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduto(isEdit);
        });

        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([readonly])');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    populateCategoriesDatalist() {
        const datalist = document.getElementById('categoriasList');
        if (!datalist) return;

        const categories = [...new Set(this.produtos
            .map(p => p.categoria)
            .filter(c => c && c.trim() !== '')
        )].sort();

        datalist.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
    }

    async saveProduto(isEdit) {
        const form = document.getElementById('produtoForm');
        const submitBtn = document.getElementById('submitBtn');
        const hideLoading = Utils.showLoading(submitBtn);

        try {
            const formData = new FormData(form);
            const produto = {
                id: formData.get('id').trim() || Utils.generateId(),
                nome: formData.get('nome').trim(),
                descricao: formData.get('descricao').trim(),
                categoria: formData.get('categoria').trim(),
                unidade: formData.get('unidade'),
                especificacoes: formData.get('especificacoes').trim(),
                ativo: formData.has('ativo')
            };

            // Validation
            if (!produto.nome) {
                throw new Error('Nome do produto é obrigatório');
            }
            if (!produto.categoria) {
                throw new Error('Categoria é obrigatória');
            }
            if (!produto.unidade) {
                throw new Error('Unidade é obrigatória');
            }

            let result;
            if (isEdit) {
                result = await db.updateProduto(produto.id, produto);
                Utils.showToast('Produto atualizado com sucesso!', 'success');
            } else {
                result = await db.createProduto(produto);
                Utils.showToast('Produto criado com sucesso!', 'success');
            }

            document.getElementById('produtoModal').remove();
            this.loadProdutos();

        } catch (error) {
            console.error('Error saving produto:', error);
            Utils.showToast(error.message || 'Erro ao salvar produto', 'error');
        } finally {
            hideLoading();
        }
    }

    async viewProduto(id) {
        try {
            const produto = await db.getProduto(id);
            if (!produto) {
                Utils.showToast('Produto não encontrado', 'error');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content p-6 max-w-2xl w-full mx-4">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-medium text-gray-900">Detalhes do Produto</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">ID do Produto</label>
                                <p class="mt-1 text-sm text-gray-900 font-mono">${produto.id}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Status</label>
                                <p class="mt-1">${Utils.createStatusBadge(produto.ativo)}</p>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome</label>
                            <p class="mt-1 text-sm text-gray-900">${produto.nome}</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Descrição</label>
                            <p class="mt-1 text-sm text-gray-900">${produto.descricao || 'Não informado'}</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Categoria</label>
                                <p class="mt-1 text-sm text-gray-900">${produto.categoria}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Unidade</label>
                                <p class="mt-1 text-sm text-gray-900">${produto.unidade}</p>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Especificações Técnicas</label>
                            <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${produto.especificacoes || 'Não informado'}</p>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                                <label class="block font-medium">Criado em</label>
                                <p>${Utils.formatDateTime(produto.created_at)}</p>
                            </div>
                            <div>
                                <label class="block font-medium">Atualizado em</label>
                                <p>${Utils.formatDateTime(produto.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">Fechar</button>
                        <button onclick="produtosManager.editProduto('${produto.id}'); this.closest('.modal-overlay').remove();" 
                                class="btn-primary">
                            <i class="fas fa-edit mr-2"></i>Editar
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('modalsContainer').appendChild(modal);

        } catch (error) {
            console.error('Error viewing produto:', error);
            Utils.showToast('Erro ao carregar detalhes do produto', 'error');
        }
    }

    async editProduto(id) {
        try {
            const produto = await db.getProduto(id);
            if (!produto) {
                Utils.showToast('Produto não encontrado', 'error');
                return;
            }
            this.showProdutoModal(produto);
        } catch (error) {
            console.error('Error loading produto for edit:', error);
            Utils.showToast('Erro ao carregar produto para edição', 'error');
        }
    }

    async deleteProduto(id) {
        try {
            const produto = await db.getProduto(id);
            if (!produto) {
                Utils.showToast('Produto não encontrado', 'error');
                return;
            }

            const confirmed = await Utils.confirmDialog(
                `Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`
            );

            if (confirmed) {
                await db.deleteProduto(id);
                Utils.showToast('Produto excluído com sucesso!', 'success');
                this.loadProdutos();
            }

        } catch (error) {
            console.error('Error deleting produto:', error);
            Utils.showToast('Erro ao excluir produto', 'error');
        }
    }

    // Get all produtos for use in other modules
    async getAllProdutos() {
        try {
            const response = await db.listProdutos({ limit: 1000 });
            return response.data || [];
        } catch (error) {
            console.error('Error getting all produtos:', error);
            return [];
        }
    }
}

// Initialize produtos manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.produtosManager = new ProdutosManager();
});