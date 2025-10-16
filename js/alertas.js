// Alerts management module for SGP

class AlertasManager {
    constructor() {
        this.alertas = [];
        this.checkInterval = 60000; // Check every minute
        this.intervalId = null;
        
        this.init();
    }

    async init() {
        await this.loadAlertas();
        this.startAlertChecking();
        this.bindEvents();
        this.updateBadge();
    }

    bindEvents() {
        // Alerts button
        const alertasBtn = document.getElementById('alertasBtn');
        if (alertasBtn) {
            alertasBtn.addEventListener('click', () => this.showAlertasModal());
        }
    }

    async loadAlertas() {
        try {
            this.alertas = await db.getAlertasAtivos();
            this.updateBadge();
        } catch (error) {
            console.error('Error loading alertas:', error);
        }
    }

    updateBadge() {
        const badge = document.getElementById('alertasBadge');
        if (!badge) return;

        const count = this.alertas.length;
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    startAlertChecking() {
        // Initial check
        this.checkForNewAlerts();
        
        // Set up interval
        this.intervalId = setInterval(() => {
            this.checkForNewAlerts();
        }, this.checkInterval);
    }

    stopAlertChecking() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async checkForNewAlerts() {
        try {
            // Update expired proposals
            await db.updatePropostasExpiradas();
            
            // Create alerts for proposals expiring soon
            await db.criarAlertasVencimento();
            
            // Reload alerts
            await this.loadAlertas();
            
        } catch (error) {
            console.error('Error checking for new alerts:', error);
        }
    }

    async showAlertasModal() {
        // Mark all alerts as read when opening modal
        await this.markAllAsRead();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'alertasModal';
        modal.innerHTML = `
            <div class="modal-content p-6 max-w-4xl w-full mx-4">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-lg font-medium text-gray-900">
                        <i class="fas fa-bell mr-2 text-yellow-500"></i>
                        Central de Alertas
                    </h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <!-- Alert Statistics -->
                    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-yellow-400 text-2xl"></i>
                            </div>
                            <div class="ml-3 flex-1">
                                <h4 class="text-lg font-medium text-gray-900">Status dos Alertas</h4>
                                <p class="text-sm text-gray-600" id="alertStatsText">Carregando estatísticas...</p>
                            </div>
                            <div class="ml-4">
                                <button onclick="alertasManager.refreshAlerts()" class="text-gray-400 hover:text-gray-600" title="Atualizar alertas">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filter Tabs -->
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex space-x-8">
                            <button onclick="alertasManager.filterAlerts('all')" 
                                    class="alert-tab-btn active whitespace-nowrap py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600">
                                Todos os Alertas
                            </button>
                            <button onclick="alertasManager.filterAlerts('vencimento_proximo')" 
                                    class="alert-tab-btn whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                Vencendo
                            </button>
                            <button onclick="alertasManager.filterAlerts('vencido')" 
                                    class="alert-tab-btn whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                Vencidos
                            </button>
                            <button onclick="alertasManager.filterAlerts('renovacao_solicitada')" 
                                    class="alert-tab-btn whitespace-nowrap py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                                Renovação
                            </button>
                        </nav>
                    </div>
                    
                    <!-- Alerts List -->
                    <div id="alertsList" class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        <!-- Alerts will be rendered here -->
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex justify-between items-center pt-4 border-t">
                        <div class="flex space-x-3">
                            <button onclick="alertasManager.markAllAsRead()" class="btn-secondary text-sm">
                                <i class="fas fa-check-double mr-2"></i>Marcar Todos como Lidos
                            </button>
                            <button onclick="alertasManager.clearReadAlerts()" class="btn-secondary text-sm">
                                <i class="fas fa-trash mr-2"></i>Limpar Lidos
                            </button>
                        </div>
                        <button onclick="this.closest('.modal-overlay').remove()" class="btn-primary">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
        
        // Load and render alerts
        await this.loadFullAlertas();
        this.renderAlertsList();
        this.updateAlertStats();
    }

    async loadFullAlertas() {
        try {
            const response = await db.listAlertas({ limit: 1000, sort: 'data_alerta' });
            this.allAlertas = response.data || [];
            this.filteredAlertas = this.allAlertas.filter(a => a.ativo);
        } catch (error) {
            console.error('Error loading full alertas:', error);
            this.allAlertas = [];
            this.filteredAlertas = [];
        }
    }

    filterAlerts(type) {
        // Update tab appearance
        document.querySelectorAll('.alert-tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });
        
        event.target.classList.add('active', 'border-blue-500', 'text-blue-600');
        event.target.classList.remove('border-transparent', 'text-gray-500');

        // Filter alerts
        if (type === 'all') {
            this.filteredAlertas = this.allAlertas.filter(a => a.ativo);
        } else {
            this.filteredAlertas = this.allAlertas.filter(a => a.ativo && a.tipo_alerta === type);
        }

        this.renderAlertsList();
    }

    renderAlertsList() {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        if (this.filteredAlertas.length === 0) {
            alertsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-bell-slash text-4xl text-gray-300 mb-3"></i>
                    <p class="text-lg font-medium">Nenhum alerta encontrado</p>
                    <p class="text-sm">Não há alertas para os critérios selecionados.</p>
                </div>
            `;
            return;
        }

        alertsList.innerHTML = this.filteredAlertas.map(alerta => {
            const isRead = alerta.lido;
            const typeIcon = this.getAlertIcon(alerta.tipo_alerta);
            const typeColor = this.getAlertColor(alerta.tipo_alerta);
            
            return `
                <div class="alert-item p-4 border rounded-lg hover:shadow-md transition-shadow ${isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-l-4 ' + typeColor}">
                    <div class="flex items-start">
                        <div class="flex-shrink-0 mr-3">
                            <i class="fas fa-${typeIcon} text-lg ${typeColor.replace('border-', 'text-')}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-900 ${isRead ? 'opacity-70' : ''}">
                                        ${this.getAlertTypeLabel(alerta.tipo_alerta)}
                                    </p>
                                    <p class="text-sm text-gray-600 ${isRead ? 'opacity-70' : ''} mt-1">
                                        ${Utils.sanitizeHtml(alerta.mensagem)}
                                    </p>
                                    <p class="text-xs text-gray-500 mt-2">
                                        <i class="fas fa-clock mr-1"></i>
                                        ${Utils.formatDateTime(alerta.data_alerta)}
                                    </p>
                                </div>
                                <div class="flex items-center space-x-2 ml-4">
                                    ${!isRead ? `
                                        <button onclick="alertasManager.markAsRead('${alerta.id}')" 
                                                class="text-xs text-blue-600 hover:text-blue-900" title="Marcar como lido">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    ` : ''}
                                    ${alerta.proposta_id ? `
                                        <button onclick="alertasManager.viewProposta('${alerta.proposta_id}')" 
                                                class="text-xs text-green-600 hover:text-green-900" title="Ver proposta">
                                            <i class="fas fa-external-link-alt"></i>
                                        </button>
                                    ` : ''}
                                    <button onclick="alertasManager.deleteAlert('${alerta.id}')" 
                                            class="text-xs text-red-600 hover:text-red-900" title="Remover alerta">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAlertStats() {
        const statsText = document.getElementById('alertStatsText');
        if (!statsText) return;

        const total = this.allAlertas.filter(a => a.ativo).length;
        const unread = this.allAlertas.filter(a => a.ativo && !a.lido).length;
        const vencendo = this.allAlertas.filter(a => a.ativo && a.tipo_alerta === 'vencimento_proximo').length;
        const vencidos = this.allAlertas.filter(a => a.ativo && a.tipo_alerta === 'vencido').length;
        const renovacao = this.allAlertas.filter(a => a.ativo && a.tipo_alerta === 'renovacao_solicitada').length;

        statsText.innerHTML = `
            <strong>${total}</strong> alertas ativos • 
            <strong>${unread}</strong> não lidos • 
            <strong>${vencendo}</strong> vencendo • 
            <strong>${vencidos}</strong> vencidos • 
            <strong>${renovacao}</strong> renovação solicitada
        `;
    }

    getAlertIcon(tipo) {
        const icons = {
            'vencimento_proximo': 'clock',
            'vencido': 'exclamation-circle',
            'renovacao_solicitada': 'sync-alt'
        };
        return icons[tipo] || 'bell';
    }

    getAlertColor(tipo) {
        const colors = {
            'vencimento_proximo': 'border-orange-400',
            'vencido': 'border-red-400',
            'renovacao_solicitada': 'border-blue-400'
        };
        return colors[tipo] || 'border-gray-400';
    }

    getAlertTypeLabel(tipo) {
        const labels = {
            'vencimento_proximo': 'Proposta Vencendo',
            'vencido': 'Proposta Vencida',
            'renovacao_solicitada': 'Renovação Solicitada'
        };
        return labels[tipo] || 'Alerta';
    }

    async markAsRead(alertaId) {
        try {
            await db.marcarAlertaComoLido(alertaId);
            
            // Update local data
            const alerta = this.allAlertas.find(a => a.id === alertaId);
            if (alerta) {
                alerta.lido = true;
            }
            
            this.renderAlertsList();
            this.updateAlertStats();
            await this.loadAlertas(); // Update badge
            
            Utils.showToast('Alerta marcado como lido', 'success');
            
        } catch (error) {
            console.error('Error marking alert as read:', error);
            Utils.showToast('Erro ao marcar alerta como lido', 'error');
        }
    }

    async markAllAsRead() {
        try {
            const unreadAlerts = this.allAlertas.filter(a => a.ativo && !a.lido);
            
            for (const alerta of unreadAlerts) {
                await db.marcarAlertaComoLido(alerta.id);
                alerta.lido = true;
            }
            
            this.renderAlertsList();
            this.updateAlertStats();
            await this.loadAlertas(); // Update badge
            
            Utils.showToast(`${unreadAlerts.length} alertas marcados como lidos`, 'success');
            
        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            Utils.showToast('Erro ao marcar alertas como lidos', 'error');
        }
    }

    async deleteAlert(alertaId) {
        try {
            const confirmed = await Utils.confirmDialog('Tem certeza que deseja remover este alerta?');
            if (!confirmed) return;

            await db.patch('alertas', alertaId, { ativo: false });
            
            // Remove from local data
            this.allAlertas = this.allAlertas.filter(a => a.id !== alertaId);
            this.filteredAlertas = this.filteredAlertas.filter(a => a.id !== alertaId);
            
            this.renderAlertsList();
            this.updateAlertStats();
            await this.loadAlertas(); // Update badge
            
            Utils.showToast('Alerta removido com sucesso', 'success');
            
        } catch (error) {
            console.error('Error deleting alert:', error);
            Utils.showToast('Erro ao remover alerta', 'error');
        }
    }

    async clearReadAlerts() {
        try {
            const readAlerts = this.allAlertas.filter(a => a.ativo && a.lido);
            
            if (readAlerts.length === 0) {
                Utils.showToast('Nenhum alerta lido para remover', 'info');
                return;
            }

            const confirmed = await Utils.confirmDialog(`Remover ${readAlerts.length} alertas lidos?`);
            if (!confirmed) return;

            for (const alerta of readAlerts) {
                await db.patch('alertas', alerta.id, { ativo: false });
            }
            
            // Update local data
            this.allAlertas = this.allAlertas.filter(a => !a.lido || !a.ativo);
            this.filteredAlertas = this.filteredAlertas.filter(a => !a.lido || !a.ativo);
            
            this.renderAlertsList();
            this.updateAlertStats();
            await this.loadAlertas(); // Update badge
            
            Utils.showToast(`${readAlerts.length} alertas removidos`, 'success');
            
        } catch (error) {
            console.error('Error clearing read alerts:', error);
            Utils.showToast('Erro ao remover alertas lidos', 'error');
        }
    }

    async refreshAlerts() {
        try {
            Utils.showToast('Atualizando alertas...', 'info');
            
            await this.checkForNewAlerts();
            await this.loadFullAlertas();
            
            this.renderAlertsList();
            this.updateAlertStats();
            
            Utils.showToast('Alertas atualizados!', 'success');
            
        } catch (error) {
            console.error('Error refreshing alerts:', error);
            Utils.showToast('Erro ao atualizar alertas', 'error');
        }
    }

    async viewProposta(propostaId) {
        try {
            // Close alerts modal
            const alertsModal = document.getElementById('alertasModal');
            if (alertsModal) {
                alertsModal.remove();
            }

            // Switch to proposals tab
            const propostasTab = document.querySelector('[data-tab="propostas"]');
            if (propostasTab) {
                propostasTab.click();
            }

            // Wait a moment for tab to switch, then show proposal
            setTimeout(() => {
                if (window.propostasManager) {
                    propostasManager.viewProposta(propostaId);
                }
            }, 300);
            
        } catch (error) {
            console.error('Error viewing proposta from alert:', error);
            Utils.showToast('Erro ao abrir proposta', 'error');
        }
    }

    // Create manual alert
    async createCustomAlert(message, type = 'info') {
        try {
            await db.createAlerta({
                proposta_id: null,
                tipo_alerta: type,
                mensagem: message,
                lido: false,
                ativo: true
            });
            
            await this.loadAlertas();
            Utils.showToast('Alerta criado com sucesso', 'success');
            
        } catch (error) {
            console.error('Error creating custom alert:', error);
            Utils.showToast('Erro ao criar alerta', 'error');
        }
    }

    // Get alert summary for dashboard
    async getAlertSummary() {
        try {
            const alertas = await db.getAlertasAtivos();
            
            return {
                total: alertas.length,
                vencimento_proximo: alertas.filter(a => a.tipo_alerta === 'vencimento_proximo').length,
                vencido: alertas.filter(a => a.tipo_alerta === 'vencido').length,
                renovacao_solicitada: alertas.filter(a => a.tipo_alerta === 'renovacao_solicitada').length,
                unread: alertas.filter(a => !a.lido).length
            };
        } catch (error) {
            console.error('Error getting alert summary:', error);
            return {
                total: 0,
                vencimento_proximo: 0,
                vencido: 0,
                renovacao_solicitada: 0,
                unread: 0
            };
        }
    }

    // Cleanup when page unloads
    destroy() {
        this.stopAlertChecking();
    }
}

// Initialize alerts manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.alertasManager = new AlertasManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.alertasManager) {
        alertasManager.destroy();
    }
});