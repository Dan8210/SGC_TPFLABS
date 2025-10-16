// Utility functions for SGP - Sistema de Gestão de Propostas

// Generate unique ID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format date to Brazilian format
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
}

// Format datetime to Brazilian format
function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
}

// Format currency to Brazilian Real
function formatCurrency(value) {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Parse currency string to number
function parseCurrency(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Format CNPJ
function formatCNPJ(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Validate CNPJ
function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    let sum = 0;
    let pos = 5;
    
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj.charAt(i)) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(cnpj.charAt(12))) return false;
    
    sum = 0;
    pos = 6;
    
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj.charAt(i)) * pos--;
        if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result === parseInt(cnpj.charAt(13));
}

// Format phone number
function formatPhone(phone) {
    if (!phone) return '';
    phone = phone.replace(/\D/g, '');
    
    if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                <i class="fas fa-${getToastIcon(type)} text-lg"></i>
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <button class="text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Get toast icon based on type
function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// Show loading spinner
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<div class="loading-spinner mx-auto"></div>';
    element.disabled = true;
    
    return () => {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Calculate days between dates
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
}

// Check if date is within X days
function isWithinDays(date, days) {
    const targetDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
}

// Check if date is expired
function isExpired(date) {
    const targetDate = new Date(date);
    const today = new Date();
    return targetDate < today;
}

// Create status badge HTML
function createStatusBadge(status) {
    const statusMap = {
        'pendente': { class: 'status-pendente', text: 'Pendente' },
        'aprovada': { class: 'status-aprovada', text: 'Aprovada' },
        'rejeitada': { class: 'status-rejeitada', text: 'Rejeitada' },
        'expirada': { class: 'status-expirada', text: 'Expirada' },
        'renovacao_solicitada': { class: 'status-renovacao_solicitada', text: 'Renovação Solicitada' },
        'ativo': { class: 'status-ativo', text: 'Ativo' },
        'inativo': { class: 'status-inativo', text: 'Inativo' },
        'true': { class: 'status-ativo', text: 'Ativo' },
        'false': { class: 'status-inativo', text: 'Inativo' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-pendente', text: status };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Add months to date
function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

// Format number with thousand separators
function formatNumber(num) {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('pt-BR').format(num);
}

// Sanitize HTML to prevent XSS
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado para a área de transferência!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copiado para a área de transferência!', 'success');
    }
}

// Export data to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('Nenhum dado para exportar', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => `"${value}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
}

// Confirm dialog
function confirmDialog(message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content p-6 max-w-md">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Confirmação</h3>
                <p class="text-sm text-gray-500 mb-6">${message}</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancelBtn" class="btn-secondary">Cancelar</button>
                    <button id="confirmBtn" class="btn-danger">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('#cancelBtn').onclick = () => {
            modal.remove();
            resolve(false);
        };
        
        modal.querySelector('#confirmBtn').onclick = () => {
            modal.remove();
            resolve(true);
        };
        
        // Close on overlay click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}

// Initialize tooltips (if using a tooltip library)
function initTooltips() {
    // Implementation depends on chosen tooltip library
    // For now, we'll use native browser tooltips via title attribute
}

// Search/filter function for arrays
function filterData(data, searchTerm, fields) {
    if (!searchTerm) return data;
    
    searchTerm = searchTerm.toLowerCase();
    return data.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(searchTerm);
        });
    });
}

// Sort data by field
function sortData(data, field, direction = 'asc') {
    return data.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];
        
        // Handle different data types
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Initialize the utils module
window.Utils = {
    generateId,
    formatDate,
    formatDateTime,
    formatCurrency,
    parseCurrency,
    formatCNPJ,
    validateCNPJ,
    formatPhone,
    showToast,
    showLoading,
    debounce,
    daysBetween,
    isWithinDays,
    isExpired,
    createStatusBadge,
    validateEmail,
    getCurrentDate,
    addMonths,
    formatNumber,
    sanitizeHtml,
    copyToClipboard,
    exportToCSV,
    confirmDialog,
    initTooltips,
    filterData,
    sortData
};