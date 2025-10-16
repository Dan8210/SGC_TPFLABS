// Main application controller for SGP - Sistema de Gestão de Propostas

class SGPApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.managers = {};
        this.initialized = false;
        
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            
            // Initialize tab system
            this.initTabSystem();
            
            // Initialize managers
            await this.initManagers();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup periodic tasks
            this.setupPeriodicTasks();
            
            // Update current date display
            this.updateDateDisplay();
            
            this.initialized = true;
            this.hideLoading();
            
            console.log('SGP Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing SGP App:', error);
            Utils.showToast('Erro ao inicializar aplicação', 'error');
            this.hideLoading();
        }
    }

    showLoading() {
        // Show a simple loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'appLoading';
        loadingDiv.className = 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4" style="width: 40px; height: 40px;"></div>
                <p class="text-lg text-gray-600">Carregando SGP...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('appLoading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    initTabSystem() {
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = button.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Initialize with dashboard tab
        this.switchTab('dashboard');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active', 'border-blue-500', 'text-blue-600');
            activeButton.classList.remove('border-transparent', 'text-gray-500');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        const activeContent = document.getElementById(tabName);
        if (activeContent) {
            activeContent.classList.remove('hidden');
        }

        this.currentTab = tabName;

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async initManagers() {
        // Wait for managers to be available
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            if (window.produtosManager && window.fornecedoresManager && 
                window.propostasManager && window.alertasManager && 
                window.relatoriosManager) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        // Store manager references
        this.managers = {
            produtos: window.produtosManager,
            fornecedores: window.fornecedoresManager,
            propostas: window.propostasManager,
            alertas: window.alertasManager,
            relatorios: window.relatoriosManager
        };
    }

    async loadInitialData() {
        try {
            // Load dashboard data
            await this.loadDashboardData();
            
            // Load cotações pendentes
            await this.loadCotacoesPendentes();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'cotacoes':
                await this.loadCotacoesPendentes();
                break;
            // Other tabs are handled by their respective managers
        }
    }

    async loadDashboardData() {
        try {
            // Get statistics from database
            const stats = await db.getEstatisticas();
            
            // Update stats cards
            this.updateStatsCards(stats);
            
            // Update recent activities
            this.updateRecentActivities(stats);
            
            // Update dashboard charts
            this.updateDashboardCharts(stats);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateStatsCards(stats) {
        // Total products
        const totalProdutosEl = document.getElementById('totalProdutos');
        if (totalProdutosEl) {
            totalProdutosEl.textContent = Utils.formatNumber(stats.totalProdutos);
        }

        // Total suppliers
        const totalFornecedoresEl = document.getElementById('totalFornecedores');
        if (totalFornecedoresEl) {
            totalFornecedoresEl.textContent = Utils.formatNumber(stats.totalFornecedores);
        }

        // Total proposals
        const totalPropostasEl = document.getElementById('totalPropostas');
        if (totalPropostasEl) {
            totalPropostasEl.textContent = Utils.formatNumber(stats.totalPropostas);
        }

        // Total alerts
        const totalAlertasEl = document.getElementById('totalAlertas');
        if (totalAlertasEl) {
            totalAlertasEl.textContent = Utils.formatNumber(stats.totalAlertas);
        }
    }

    updateRecentActivities(stats) {
        const activitiesContainer = document.getElementById('atividadesRecentes');
        if (!activitiesContainer) return;

        const activities = [];

        // Add recent proposals
        const recentPropostas = stats.propostas
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3);

        recentPropostas.forEach(proposta => {
            const produto = stats.produtos.find(p => p.id === proposta.produto_id);
            activities.push({
                type: 'proposta',
                icon: 'file-contract',
                color: 'text-blue-600',
                title: `Nova proposta: ${proposta.numero_proposta}`,
                description: `Produto: ${produto?.nome || 'N/A'} - ${Utils.formatCurrency(proposta.preco_total)}`,
                time: proposta.created_at
            });
        });

        // Add recent alerts
        const recentAlertas = stats.alertas
            .sort((a, b) => new Date(b.data_alerta) - new Date(a.data_alerta))
            .slice(0, 2);

        recentAlertas.forEach(alerta => {
            activities.push({
                type: 'alerta',
                icon: 'exclamation-triangle',
                color: 'text-orange-600',
                title: this.getAlertTypeLabel(alerta.tipo_alerta),
                description: alerta.mensagem.substring(0, 60) + '...',
                time: alerta.data_alerta
            });
        });

        // Sort all activities by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Render activities
        if (activities.length === 0) {
            activitiesContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
        } else {
            activitiesContainer.innerHTML = activities.slice(0, 5).map(activity => `
                <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div class="flex-shrink-0">
                        <i class="fas fa-${activity.icon} ${activity.color}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">${activity.title}</p>
                        <p class="text-sm text-gray-500">${activity.description}</p>
                        <p class="text-xs text-gray-400">${Utils.formatDateTime(activity.time)}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    updateDashboardCharts(stats) {
        // Update proposals status chart
        this.updateProposalsChart(stats.propostas);
        
        // Update monthly chart
        this.updateMonthlyChart(stats.propostas);
    }

    updateProposalsChart(propostas) {
        const ctx = document.getElementById('chartPropostas');
        if (!ctx) return;

        // Group by status
        const statusCounts = {};
        propostas.forEach(p => {
            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });

        const statusLabels = {
            'pendente': 'Pendente',
            'aprovada': 'Aprovada',
            'rejeitada': 'Rejeitada',
            'expirada': 'Expirada',
            'renovacao_solicitada': 'Renovação Solicitada'
        };

        if (this.dashboardCharts?.propostas) {
            this.dashboardCharts.propostas.destroy();
        }

        if (!this.dashboardCharts) this.dashboardCharts = {};

        this.dashboardCharts.propostas = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts).map(status => statusLabels[status] || status),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#FCD34D', '#10B981', '#EF4444', '#6B7280', '#3B82F6'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateMonthlyChart(propostas) {
        const ctx = document.getElementById('chartPropostasMes');
        if (!ctx) return;

        // Group by month (last 6 months)
        const now = new Date();
        const months = [];
        const counts = [];

        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            
            const monthPropostas = propostas.filter(p => {
                const pDate = new Date(p.data_criacao);
                return pDate >= month && pDate < nextMonth;
            });

            months.push(month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
            counts.push(monthPropostas.length);
        }

        if (this.dashboardCharts?.monthly) {
            this.dashboardCharts.monthly.destroy();
        }

        this.dashboardCharts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Propostas',
                    data: counts,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    async loadCotacoesPendentes() {
        try {
            // Get proposals expiring soon and expired
            const propostasVencendo = await db.getPropostasVencendo(60);
            const propostasVencidas = await db.getPropostasVencidas();
            const propostasRenovacao = (await db.listPropostas()).data?.filter(p => p.status === 'renovacao_solicitada') || [];

            // Load related data
            const [produtos, fornecedores] = await Promise.all([
                db.listProdutos({ limit: 1000 }),
                db.listFornecedores({ limit: 1000 })
            ]);

            const produtosMap = (produtos.data || []).reduce((map, p) => {
                map[p.id] = p;
                return map;
            }, {});

            const fornecedoresMap = (fornecedores.data || []).reduce((map, f) => {
                map[f.id] = f;
                return map;
            }, {});

            // Render sections
            this.renderCotacoesSection('cotacoesVencendo', propostasVencendo, produtosMap, fornecedoresMap, 'Vencendo');
            this.renderCotacoesSection('cotacoesVencidas', propostasVencidas, produtosMap, fornecedoresMap, 'Vencidas');
            this.renderCotacoesSection('cotacoesRenovacao', propostasRenovacao, produtosMap, fornecedoresMap, 'Renovação');

        } catch (error) {
            console.error('Error loading cotações pendentes:', error);
        }
    }

    renderCotacoesSection(containerId, propostas, produtosMap, fornecedoresMap, type) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (propostas.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <i class="fas fa-check-circle text-3xl mb-2"></i>
                    <p>Nenhuma proposta ${type.toLowerCase()}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = propostas.map(proposta => {
            const produto = produtosMap[proposta.produto_id];
            const fornecedor = fornecedoresMap[proposta.fornecedor_id];
            const dataValidade = new Date(proposta.data_validade);
            const diasRestantes = Math.ceil((dataValidade - new Date()) / (1000 * 60 * 60 * 24));

            return `
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow ${type === 'Vencidas' ? 'border-red-200 bg-red-50' : type === 'Vencendo' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <h4 class="font-medium text-gray-900">${Utils.sanitizeHtml(proposta.numero_proposta)}</h4>
                                ${Utils.createStatusBadge(proposta.status)}
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p class="text-gray-600">Produto: <span class="font-medium">${produto?.nome || 'N/A'}</span></p>
                                    <p class="text-gray-600">Fornecedor: <span class="font-medium">${fornecedor?.razao_social || 'N/A'}</span></p>
                                </div>
                                <div>
                                    <p class="text-gray-600">Valor: <span class="font-medium">${Utils.formatCurrency(proposta.preco_total)}</span></p>
                                    <p class="text-gray-600">Validade: <span class="font-medium">${Utils.formatDate(proposta.data_validade)}</span></p>
                                    ${type === 'Vencendo' && diasRestantes > 0 ? 
                                        `<p class="text-orange-600 text-xs font-medium"><i class="fas fa-clock mr-1"></i>${diasRestantes} dias restantes</p>` : 
                                        type === 'Vencidas' ? 
                                        `<p class="text-red-600 text-xs font-medium"><i class="fas fa-exclamation-circle mr-1"></i>Vencida há ${Math.abs(diasRestantes)} dias</p>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="sgpApp.viewPropostaFromCotacoes('${proposta.id}')" 
                                    class="text-sm text-blue-600 hover:text-blue-900 font-medium">
                                <i class="fas fa-eye mr-1"></i>Ver
                            </button>
                            ${proposta.status === 'pendente' || proposta.status === 'renovacao_solicitada' ? `
                                <button onclick="sgpApp.renewPropostaFromCotacoes('${proposta.id}')" 
                                        class="text-sm text-green-600 hover:text-green-900 font-medium">
                                    <i class="fas fa-sync-alt mr-1"></i>Renovar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Helper methods for cotações actions
    async viewPropostaFromCotacoes(propostaId) {
        // Switch to proposals tab and show proposal
        this.switchTab('propostas');
        setTimeout(() => {
            if (this.managers.propostas) {
                this.managers.propostas.viewProposta(propostaId);
            }
        }, 300);
    }

    async renewPropostaFromCotacoes(propostaId) {
        if (this.managers.propostas) {
            await this.managers.propostas.renewProposta(propostaId);
            // Reload cotações after renewal
            this.loadCotacoesPendentes();
        }
    }

    setupPeriodicTasks() {
        // Update dashboard every 5 minutes
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboardData();
            }
        }, 300000); // 5 minutes

        // Update date display every minute
        setInterval(() => {
            this.updateDateDisplay();
        }, 60000); // 1 minute

        // Update cotações every 10 minutes
        setInterval(() => {
            if (this.currentTab === 'cotacoes') {
                this.loadCotacoesPendentes();
            }
        }, 600000); // 10 minutes
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('dataAtual');
        if (dateElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('pt-BR', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    getAlertTypeLabel(tipo) {
        const labels = {
            'vencimento_proximo': 'Proposta Vencendo',
            'vencido': 'Proposta Vencida',
            'renovacao_solicitada': 'Renovação Solicitada'
        };
        return labels[tipo] || 'Alerta';
    }

    // Cleanup method
    destroy() {
        // Destroy dashboard charts
        if (this.dashboardCharts) {
            Object.values(this.dashboardCharts).forEach(chart => {
                if (chart) chart.destroy();
            });
        }

        // Destroy managers
        Object.values(this.managers).forEach(manager => {
            if (manager && manager.destroy) {
                manager.destroy();
            }
        });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a moment for all scripts to load
    setTimeout(() => {
        window.sgpApp = new SGPApp();
    }, 100);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.sgpApp) {
        sgpApp.destroy();
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    Utils.showToast('Ocorreu um erro inesperado', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    Utils.showToast('Erro de comunicação com o servidor', 'error');
});