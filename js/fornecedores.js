// Suppliers management module for SGP

class FornecedoresManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.searchTerm = '';
        this.filters = {};
        this.fornecedores = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFornecedores();
    }

    bindEvents() {
        // New supplier button
        const novoFornecedorBtn = document.getElementById('novoFornecedorBtn');
        if (novoFornecedorBtn) {
            novoFornecedorBtn.addEventListener('click', () => this.showFornecedorModal());
        }

        // Search input
        const searchInput = document.getElementById('searchFornecedores');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.searchTerm = searchInput.value;
                this.loadFornecedores();
            }, 300));
        }

        // Filter input
        const statusFilter = document.getElementById('filterStatusFornecedor');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.ativo = statusFilter.value;
                this.loadFornecedores();
            });
        }
    }

    async loadFornecedores() {
        try {
            const params = {
                page: this.currentPage,
                limit: this.pageSize,
                search: this.searchTerm,
                ...this.filters
            };

            const response = await db.searchFornecedores(this.searchTerm, this.filters);
            this.fornecedores = response.data || [];
            
            this.renderFornecedoresTable();
            
        } catch (error) {
            console.error('Error loading fornecedores:', error);
            Utils.showToast('Erro ao carregar fornecedores', 'error');
        }
    }

    renderFornecedoresTable() {
        const tbody = document.getElementById('corpoTabelaFornecedores');
        if (!tbody) return;

        if (this.fornecedores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-truck text-4xl text-gray-300 mb-2"></i>
                            <p>Nenhum fornecedor encontrado</p>
                            <button class="mt-2 text-blue-600 hover:text-blue-900" onclick="fornecedoresManager.showFornecedorModal()">
                                Cadastrar primeiro fornecedor
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.fornecedores.map(fornecedor => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${Utils.sanitizeHtml(fornecedor.razao_social)}</div>
                    <div class="text-sm text-gray-500">${Utils.formatCNPJ(fornecedor.cnpj)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.sanitizeHtml(fornecedor.nome_fantasia || '')}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    ${Utils.formatCNPJ(fornecedor.cnpj)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${Utils.formatPhone(fornecedor.telefone)}</div>
                    <div class="text-sm text-gray-500">${Utils.sanitizeHtml(fornecedor.email || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${Utils.createStatusBadge(fornecedor.ativo)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="fornecedoresManager.viewFornecedor('${fornecedor.id}')" 
                            class="table-action-btn table-action-view">
                        <i class="fas fa-eye mr-1"></i>Ver
                    </button>
                    <button onclick="fornecedoresManager.editFornecedor('${fornecedor.id}')" 
                            class="table-action-btn table-action-edit">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    <button onclick="fornecedoresManager.deleteFornecedor('${fornecedor.id}')" 
                            class="table-action-btn table-action-delete">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showFornecedorModal(fornecedor = null) {
        const isEdit = fornecedor !== null;
        const modalTitle = isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor';
        const submitText = isEdit ? 'Salvar Alterações' : 'Criar Fornecedor';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'fornecedorModal';
        modal.innerHTML = `
            <div class="modal-content p-6 max-w-4xl w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900">${modalTitle}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="fornecedorForm" class="space-y-6">
                    <!-- Dados da Empresa -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Dados da Empresa</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Razão Social *</label>
                                <input type="text" id="razaoSocial" name="razao_social" class="form-input" 
                                       value="${fornecedor?.razao_social || ''}" required 
                                       placeholder="Razão social da empresa">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Nome Fantasia</label>
                                <input type="text" id="nomeFantasia" name="nome_fantasia" class="form-input" 
                                       value="${fornecedor?.nome_fantasia || ''}" 
                                       placeholder="Nome fantasia (opcional)">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">CNPJ *</label>
                            <input type="text" id="cnpj" name="cnpj" class="form-input" 
                                   value="${fornecedor?.cnpj || ''}" required 
                                   placeholder="00.000.000/0000-00" maxlength="18">
                        </div>
                    </div>
                    
                    <!-- Dados de Contato -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Dados de Contato</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Email *</label>
                                <input type="email" id="email" name="email" class="form-input" 
                                       value="${fornecedor?.email || ''}" required 
                                       placeholder="contato@empresa.com">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Telefone *</label>
                                <input type="text" id="telefone" name="telefone" class="form-input" 
                                       value="${fornecedor?.telefone || ''}" required 
                                       placeholder="(00) 00000-0000" maxlength="15">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Contato Responsável</label>
                            <input type="text" id="contatoResponsavel" name="contato_responsavel" class="form-input" 
                                   value="${fornecedor?.contato_responsavel || ''}" 
                                   placeholder="Nome do responsável pelo contato">
                        </div>
                    </div>
                    
                    <!-- Endereço -->
                    <div class="border-b pb-6">
                        <h4 class="text-md font-medium text-gray-900 mb-4">Endereço</h4>
                        <div class="form-group">
                            <label class="form-label">Endereço Completo</label>
                            <textarea id="endereco" name="endereco" class="form-textarea" rows="3" 
                                      placeholder="Rua, número, bairro, cidade, estado, CEP">${fornecedor?.endereco || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Observações -->
                    <div class="border-b pb-6">
                        <div class="form-group">
                            <label class="form-label">Observações</label>
                            <textarea id="observacoes" name="observacoes" class="form-textarea" rows="4" 
                                      placeholder="Observações adicionais sobre o fornecedor...">${fornecedor?.observacoes || ''}</textarea>
                        </div>
                    </div>
                    
                    <!-- Status -->
                    <div class="form-group">
                        <label class="flex items-center">
                            <input type="checkbox" id="fornecedorAtivo" name="ativo" class="mr-2" 
                                   ${fornecedor?.ativo !== false ? 'checked' : ''}>
                            <span class="text-sm font-medium text-gray-700">Fornecedor ativo</span>
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
        
        // Add input masks and validation
        this.setupFormValidation();
        
        // Bind form submit
        document.getElementById('fornecedorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFornecedor(isEdit);
        });

        // Focus on first input
        setTimeout(() => {
            document.getElementById('razaoSocial').focus();
        }, 100);
    }

    setupFormValidation() {
        const cnpjInput = document.getElementById('cnpj');
        const telefoneInput = document.getElementById('telefone');
        const emailInput = document.getElementById('email');

        // CNPJ mask
        cnpjInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
            e.target.value = value;
        });

        // Phone mask
        telefoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 10) {
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                value = value.replace(/(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = value;
        });

        // Real-time CNPJ validation
        cnpjInput.addEventListener('blur', (e) => {
            const cnpj = e.target.value.replace(/\D/g, '');
            if (cnpj && !Utils.validateCNPJ(cnpj)) {
                e.target.setCustomValidity('CNPJ inválido');
                e.target.reportValidity();
            } else {
                e.target.setCustomValidity('');
            }
        });

        // Email validation
        emailInput.addEventListener('blur', (e) => {
            const email = e.target.value;
            if (email && !Utils.validateEmail(email)) {
                e.target.setCustomValidity('Email inválido');
                e.target.reportValidity();
            } else {
                e.target.setCustomValidity('');
            }
        });
    }

    async saveFornecedor(isEdit) {
        const form = document.getElementById('fornecedorForm');
        const submitBtn = document.getElementById('submitBtn');
        const hideLoading = Utils.showLoading(submitBtn);

        try {
            const formData = new FormData(form);
            const fornecedor = {
                razao_social: formData.get('razao_social').trim(),
                nome_fantasia: formData.get('nome_fantasia').trim(),
                cnpj: formData.get('cnpj').replace(/\D/g, ''),
                email: formData.get('email').trim().toLowerCase(),
                telefone: formData.get('telefone').replace(/\D/g, ''),
                endereco: formData.get('endereco').trim(),
                contato_responsavel: formData.get('contato_responsavel').trim(),
                observacoes: formData.get('observacoes').trim(),
                ativo: formData.has('ativo')
            };

            // Validation
            if (!fornecedor.razao_social) {
                throw new Error('Razão social é obrigatória');
            }
            if (!fornecedor.cnpj) {
                throw new Error('CNPJ é obrigatório');
            }
            if (!Utils.validateCNPJ(fornecedor.cnpj)) {
                throw new Error('CNPJ inválido');
            }
            if (!fornecedor.email) {
                throw new Error('Email é obrigatório');
            }
            if (!Utils.validateEmail(fornecedor.email)) {
                throw new Error('Email inválido');
            }
            if (!fornecedor.telefone) {
                throw new Error('Telefone é obrigatório');
            }

            // Check for duplicate CNPJ (only for new suppliers or when CNPJ changed)
            if (!isEdit) {
                const existingSupplier = await this.findByCNPJ(fornecedor.cnpj);
                if (existingSupplier) {
                    throw new Error('CNPJ já cadastrado para outro fornecedor');
                }
            }

            let result;
            if (isEdit) {
                const currentFornecedor = await db.getFornecedor(document.getElementById('cnpj').dataset.originalId || Utils.generateId());
                result = await db.updateFornecedor(currentFornecedor.id, fornecedor);
                Utils.showToast('Fornecedor atualizado com sucesso!', 'success');
            } else {
                fornecedor.id = Utils.generateId();
                result = await db.createFornecedor(fornecedor);
                Utils.showToast('Fornecedor criado com sucesso!', 'success');
            }

            document.getElementById('fornecedorModal').remove();
            this.loadFornecedores();

        } catch (error) {
            console.error('Error saving fornecedor:', error);
            Utils.showToast(error.message || 'Erro ao salvar fornecedor', 'error');
        } finally {
            hideLoading();
        }
    }

    async findByCNPJ(cnpj) {
        try {
            const response = await db.listFornecedores();
            const fornecedores = response.data || [];
            return fornecedores.find(f => f.cnpj === cnpj);
        } catch (error) {
            console.error('Error finding fornecedor by CNPJ:', error);
            return null;
        }
    }

    async viewFornecedor(id) {
        try {
            const fornecedor = await db.getFornecedor(id);
            if (!fornecedor) {
                Utils.showToast('Fornecedor não encontrado', 'error');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content p-6 max-w-4xl w-full mx-4">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-medium text-gray-900">Detalhes do Fornecedor</h3>
                        <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-6">
                        <!-- Dados da Empresa -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Dados da Empresa</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Razão Social</label>
                                    <p class="mt-1 text-sm text-gray-900">${fornecedor.razao_social}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                                    <p class="mt-1 text-sm text-gray-900">${fornecedor.nome_fantasia || 'Não informado'}</p>
                                </div>
                            </div>
                            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">CNPJ</label>
                                    <p class="mt-1 text-sm text-gray-900 font-mono">${Utils.formatCNPJ(fornecedor.cnpj)}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Status</label>
                                    <p class="mt-1">${Utils.createStatusBadge(fornecedor.ativo)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Dados de Contato -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Dados de Contato</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Email</label>
                                    <p class="mt-1 text-sm text-gray-900">${fornecedor.email}</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Telefone</label>
                                    <p class="mt-1 text-sm text-gray-900">${Utils.formatPhone(fornecedor.telefone)}</p>
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="block text-sm font-medium text-gray-700">Contato Responsável</label>
                                <p class="mt-1 text-sm text-gray-900">${fornecedor.contato_responsavel || 'Não informado'}</p>
                            </div>
                        </div>
                        
                        <!-- Endereço -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Endereço</h4>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Endereço Completo</label>
                                <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">${fornecedor.endereco || 'Não informado'}</p>
                            </div>
                        </div>
                        
                        <!-- Observações -->
                        <div class="border-b pb-6">
                            <h4 class="text-md font-medium text-gray-900 mb-4">Observações</h4>
                            <p class="text-sm text-gray-900 whitespace-pre-wrap">${fornecedor.observacoes || 'Nenhuma observação registrada'}</p>
                        </div>
                        
                        <!-- Metadados -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                                <label class="block font-medium">Cadastrado em</label>
                                <p>${Utils.formatDateTime(fornecedor.created_at)}</p>
                            </div>
                            <div>
                                <label class="block font-medium">Atualizado em</label>
                                <p>${Utils.formatDateTime(fornecedor.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">Fechar</button>
                        <button onclick="fornecedoresManager.editFornecedor('${fornecedor.id}'); this.closest('.modal-overlay').remove();" 
                                class="btn-primary">
                            <i class="fas fa-edit mr-2"></i>Editar
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('modalsContainer').appendChild(modal);

        } catch (error) {
            console.error('Error viewing fornecedor:', error);
            Utils.showToast('Erro ao carregar detalhes do fornecedor', 'error');
        }
    }

    async editFornecedor(id) {
        try {
            const fornecedor = await db.getFornecedor(id);
            if (!fornecedor) {
                Utils.showToast('Fornecedor não encontrado', 'error');
                return;
            }
            this.showFornecedorModal(fornecedor);
            
            // Store original ID for update
            setTimeout(() => {
                document.getElementById('cnpj').dataset.originalId = fornecedor.id;
            }, 100);
            
        } catch (error) {
            console.error('Error loading fornecedor for edit:', error);
            Utils.showToast('Erro ao carregar fornecedor para edição', 'error');
        }
    }

    async deleteFornecedor(id) {
        try {
            const fornecedor = await db.getFornecedor(id);
            if (!fornecedor) {
                Utils.showToast('Fornecedor não encontrado', 'error');
                return;
            }

            const confirmed = await Utils.confirmDialog(
                `Tem certeza que deseja excluir o fornecedor "${fornecedor.razao_social}"? Esta ação não pode ser desfeita.`
            );

            if (confirmed) {
                await db.deleteFornecedor(id);
                Utils.showToast('Fornecedor excluído com sucesso!', 'success');
                this.loadFornecedores();
            }

        } catch (error) {
            console.error('Error deleting fornecedor:', error);
            Utils.showToast('Erro ao excluir fornecedor', 'error');
        }
    }

    // Get all fornecedores for use in other modules
    async getAllFornecedores() {
        try {
            const response = await db.listFornecedores({ limit: 1000 });
            return response.data?.filter(f => f.ativo) || [];
        } catch (error) {
            console.error('Error getting all fornecedores:', error);
            return [];
        }
    }
}

// Initialize fornecedores manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.fornecedoresManager = new FornecedoresManager();
});