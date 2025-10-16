// Reports and analytics module for SGP

class RelatoriosManager {
    constructor() {
        this.charts = {};
        this.currentPeriod = 30; // Default to last 30 days
        this.customDateRange = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
    }

    bindEvents() {
        // Period selector
        const periodoSelect = document.getElementById('periodoRelatorio');
        if (periodoSelect) {
            periodoSelect.addEventListener('change', () => {
                this.currentPeriod = parseInt(periodoSelect.value);
                this.customDateRange = null;
                this.loadReportData();
            });
        }

        // Custom date range
        const dataInicioInput = document.getElementById('dataInicioRelatorio');
        const dataFimInput = document.getElementById('dataFimRelatorio');
        
        if (dataInicioInput && dataFimInput) {
            const updateCustomRange = () => {
                if (dataInicioInput.value && dataFimInput.value) {
                    this.customDateRange = {
                        inicio: new Date(dataInicioInput.value),
                        fim: new Date(dataFimInput.value)
                    };
                    this.loadReportData();
                }
            };

            dataInicioInput.addEventListener('change', updateCustomRange);
            dataFimInput.addEventListener('change', updateCustomRange);
        }

        // Generate report button
        const gerarBtn = document.getElementById('gerarRelatorioBtn');
        if (gerarBtn) {
            gerarBtn.addEventListener('click', () => this.loadReportData());
        }

        // Export buttons
        const exportExcelBtn = document.getElementById('exportarExcelBtn');
        const exportPdfBtn = document.getElementById('exportarPdfBtn');
        const exportCsvBtn = document.getElementById('exportarCsvBtn');

        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportToPdf());
        }
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportToCsv());
        }
    }

    async loadInitialData() {
        // Set default dates
        const hoje = new Date();
        const dataFim = document.getElementById('dataFimRelatorio');
        const dataInicio = document.getElementById('dataInicioRelatorio');
        
        if (dataFim) {
            dataFim.value = hoje.toISOString().split('T')[0];
        }
        
        if (dataInicio) {
            const inicioDefault = new Date(hoje);
            inicioDefault.setDate(hoje.getDate() - 30);
            dataInicio.value = inicioDefault.toISOString().split('T')[0];
        }

        await this.loadReportData();
    }

    async loadReportData() {
        try {
            const dateRange = this.getDateRange();
            
            // Load data from database
            const [propostas, produtos, fornecedores] = await Promise.all([
                db.listPropostas({ limit: 1000 }),
                db.listProdutos({ limit: 1000 }),
                db.listFornecedores({ limit: 1000 })
            ]);

            // Filter data by date range
            const filteredPropostas = this.filterByDateRange(propostas.data || [], dateRange);
            
            // Generate charts
            this.generateVolumeChart(filteredPropostas);
            this.generateStatusChart(filteredPropostas);
            this.generateTopSuppliersChart(filteredPropostas, fornecedores.data || []);
            
        } catch (error) {
            console.error('Error loading report data:', error);
            Utils.showToast('Erro ao carregar dados do relatório', 'error');
        }
    }

    getDateRange() {
        if (this.customDateRange) {
            return this.customDateRange;
        }

        const fim = new Date();
        const inicio = new Date();
        inicio.setDate(fim.getDate() - this.currentPeriod);
        
        return { inicio, fim };
    }

    filterByDateRange(propostas, dateRange) {
        return propostas.filter(proposta => {
            const dataCriacao = new Date(proposta.data_criacao);
            return dataCriacao >= dateRange.inicio && dataCriacao <= dateRange.fim;
        });
    }

    generateVolumeChart(propostas) {
        const ctx = document.getElementById('chartVolumePropostas');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.volume) {
            this.charts.volume.destroy();
        }

        // Group proposals by month
        const monthlyData = this.groupByMonth(propostas);
        
        this.charts.volume = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [
                    {
                        label: 'Número de Propostas',
                        data: monthlyData.counts,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Valor Total (R$ mil)',
                        data: monthlyData.values.map(v => v / 1000),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Volume de Propostas por Mês'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Número de Propostas'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Valor (R$ mil)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    generateStatusChart(propostas) {
        const ctx = document.getElementById('chartValorStatus');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.status) {
            this.charts.status.destroy();
        }

        // Group by status
        const statusData = this.groupByStatus(propostas);
        
        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: statusData.labels,
                datasets: [{
                    data: statusData.values,
                    backgroundColor: [
                        '#FCD34D', // pendente - yellow
                        '#10B981', // aprovada - green
                        '#EF4444', // rejeitada - red
                        '#6B7280', // expirada - gray
                        '#3B82F6'  // renovacao_solicitada - blue
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Valor Total por Status (R$)'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = Utils.formatCurrency(context.parsed);
                                const percentage = ((context.parsed / statusData.total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateTopSuppliersChart(propostas, fornecedores) {
        const ctx = document.getElementById('chartTopFornecedores');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.suppliers) {
            this.charts.suppliers.destroy();
        }

        // Get top 10 suppliers by proposal value
        const supplierData = this.getTopSuppliers(propostas, fornecedores, 10);
        
        this.charts.suppliers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: supplierData.labels,
                datasets: [
                    {
                        label: 'Valor Total (R$)',
                        data: supplierData.values,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1
                    },
                    {
                        label: 'Número de Propostas',
                        data: supplierData.counts,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 10 Fornecedores por Valor'
                    },
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Valor: ${Utils.formatCurrency(context.parsed.x)}`;
                                } else {
                                    return `Propostas: ${context.parsed.x}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        display: true,
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Valor (R$)'
                        }
                    },
                    x1: {
                        type: 'linear',
                        display: true,
                        position: 'top',
                        title: {
                            display: true,
                            text: 'Número de Propostas'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }

    groupByMonth(propostas) {
        const months = {};
        
        propostas.forEach(proposta => {
            const date = new Date(proposta.data_criacao);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!months[monthKey]) {
                months[monthKey] = {
                    count: 0,
                    value: 0
                };
            }
            
            months[monthKey].count++;
            months[monthKey].value += proposta.preco_total || 0;
        });

        // Sort by month and prepare data
        const sortedMonths = Object.keys(months).sort();
        
        return {
            labels: sortedMonths.map(month => {
                const [year, monthNum] = month.split('-');
                const date = new Date(year, monthNum - 1);
                return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            }),
            counts: sortedMonths.map(month => months[month].count),
            values: sortedMonths.map(month => months[month].value)
        };
    }

    groupByStatus(propostas) {
        const statusMap = {
            'pendente': 'Pendente',
            'aprovada': 'Aprovada',
            'rejeitada': 'Rejeitada',
            'expirada': 'Expirada',
            'renovacao_solicitada': 'Renovação Solicitada'
        };

        const statusGroups = {};
        let total = 0;

        propostas.forEach(proposta => {
            const status = proposta.status;
            if (!statusGroups[status]) {
                statusGroups[status] = 0;
            }
            statusGroups[status] += proposta.preco_total || 0;
            total += proposta.preco_total || 0;
        });

        return {
            labels: Object.keys(statusGroups).map(status => statusMap[status] || status),
            values: Object.values(statusGroups),
            total
        };
    }

    getTopSuppliers(propostas, fornecedores, limit = 10) {
        const supplierStats = {};

        // Calculate stats for each supplier
        propostas.forEach(proposta => {
            const supplierId = proposta.fornecedor_id;
            if (!supplierStats[supplierId]) {
                supplierStats[supplierId] = {
                    count: 0,
                    value: 0
                };
            }
            supplierStats[supplierId].count++;
            supplierStats[supplierId].value += proposta.preco_total || 0;
        });

        // Sort by value and get top suppliers
        const topSuppliers = Object.entries(supplierStats)
            .sort(([,a], [,b]) => b.value - a.value)
            .slice(0, limit);

        return {
            labels: topSuppliers.map(([supplierId]) => {
                const supplier = fornecedores.find(f => f.id === supplierId);
                return supplier ? supplier.razao_social.substring(0, 20) + '...' : 'Desconhecido';
            }),
            values: topSuppliers.map(([,stats]) => stats.value),
            counts: topSuppliers.map(([,stats]) => stats.count)
        };
    }

    async exportToCsv() {
        try {
            const dateRange = this.getDateRange();
            const response = await db.listPropostas({ limit: 1000 });
            const propostas = this.filterByDateRange(response.data || [], dateRange);
            
            if (propostas.length === 0) {
                Utils.showToast('Nenhum dado para exportar', 'warning');
                return;
            }

            // Prepare data for export
            const exportData = await this.prepareExportData(propostas);
            
            // Generate filename
            const filename = `relatorio_propostas_${Utils.getCurrentDate()}`;
            
            Utils.exportToCSV(exportData, filename);
            
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            Utils.showToast('Erro ao exportar dados', 'error');
        }
    }

    async exportToExcel() {
        Utils.showToast('Funcionalidade de exportação Excel em desenvolvimento', 'info');
        // TODO: Implement Excel export using a library like SheetJS
    }

    async exportToPdf() {
        Utils.showToast('Funcionalidade de exportação PDF em desenvolvimento', 'info');
        // TODO: Implement PDF export using a library like jsPDF
    }

    async prepareExportData(propostas) {
        try {
            // Load related data
            const [produtosResponse, fornecedoresResponse] = await Promise.all([
                db.listProdutos({ limit: 1000 }),
                db.listFornecedores({ limit: 1000 })
            ]);

            const produtos = produtosResponse.data || [];
            const fornecedores = fornecedoresResponse.data || [];

            return propostas.map(proposta => {
                const produto = produtos.find(p => p.id === proposta.produto_id);
                const fornecedor = fornecedores.find(f => f.id === proposta.fornecedor_id);

                return {
                    'Número Proposta': proposta.numero_proposta,
                    'Status': proposta.status,
                    'Produto': produto?.nome || 'N/A',
                    'Categoria': produto?.categoria || 'N/A',
                    'Fornecedor': fornecedor?.razao_social || 'N/A',
                    'CNPJ': Utils.formatCNPJ(fornecedor?.cnpj || ''),
                    'Quantidade': proposta.quantidade,
                    'Unidade': produto?.unidade || 'N/A',
                    'Preço Unitário': Utils.formatCurrency(proposta.preco_unitario),
                    'Preço Total': Utils.formatCurrency(proposta.preco_total),
                    'Prazo Entrega': proposta.prazo_entrega ? proposta.prazo_entrega + ' dias' : 'N/A',
                    'Data Criação': Utils.formatDate(proposta.data_criacao),
                    'Data Validade': Utils.formatDate(proposta.data_validade),
                    'Observações': proposta.observacoes || ''
                };
            });

        } catch (error) {
            console.error('Error preparing export data:', error);
            return [];
        }
    }

    // Generate summary statistics
    async getStatistics() {
        try {
            const dateRange = this.getDateRange();
            const response = await db.listPropostas({ limit: 1000 });
            const propostas = this.filterByDateRange(response.data || [], dateRange);

            const stats = {
                totalPropostas: propostas.length,
                valorTotal: propostas.reduce((sum, p) => sum + (p.preco_total || 0), 0),
                valorMedio: propostas.length > 0 ? propostas.reduce((sum, p) => sum + (p.preco_total || 0), 0) / propostas.length : 0,
                statusDistribution: {},
                topProduct: null,
                topSupplier: null
            };

            // Status distribution
            propostas.forEach(p => {
                stats.statusDistribution[p.status] = (stats.statusDistribution[p.status] || 0) + 1;
            });

            return stats;

        } catch (error) {
            console.error('Error getting statistics:', error);
            return null;
        }
    }

    // Destroy charts when leaving page
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Initialize reports manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for tab system to be ready
    setTimeout(() => {
        window.relatoriosManager = new RelatoriosManager();
    }, 1000);
});