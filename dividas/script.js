document.addEventListener('DOMContentLoaded', () => {
    const debtModal = document.getElementById('debt-modal');
    const paymentModal = document.getElementById('payment-modal');
    const addDebtBtn = document.getElementById('add-debt-btn');
    const cancelDebtBtn = document.getElementById('cancel-debt-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const debtForm = document.getElementById('debt-form');
    const paymentForm = document.getElementById('payment-form');
    const debtList = document.getElementById('debt-list');
    const emptyState = document.getElementById('empty-state');
    const filterContainer = document.querySelector('.filter-container');

    let debts = JSON.parse(localStorage.getItem('debts')) || [];
    let currentFilter = 'all';

    const saveDebts = () => {
        localStorage.setItem('debts', JSON.stringify(debts));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
    };

    const renderDebts = () => {
        debtList.innerHTML = '';
        const filteredDebts = debts.filter(debt => {
            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            const isPaid = totalPaid >= debt.totalAmount;
            if (currentFilter === 'paid') return isPaid;
            if (currentFilter === 'open') return !isPaid;
            return true;
        });

        if (filteredDebts.length === 0) {
            emptyState.style.display = 'block';
            debtList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            debtList.style.display = 'flex';
        }

        filteredDebts.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).forEach(debt => {
            const li = document.createElement('li');
            li.classList.add('debt-item');
            li.dataset.id = debt.id;

            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = debt.totalAmount - totalPaid;
            const progress = (totalPaid / debt.totalAmount) * 100;

            const now = new Date();
            now.setHours(0,0,0,0);
            const dueDate = debt.dueDate ? new Date(debt.dueDate + 'T00:00:00') : null;
            
            if (remaining > 0) {
                if (dueDate && dueDate < now) {
                    li.classList.add('overdue');
                } else if (dueDate) {
                    const daysDiff = (dueDate - now) / (1000 * 60 * 60 * 24);
                    if (daysDiff <= 7) {
                        li.classList.add('nearing-due');
                    }
                }
            } else {
                li.classList.add('paid');
            }

            li.innerHTML = `
                <div class="debt-header">
                    <h3>${debt.description}</h3>
                    <div class="debt-actions">
                        <button class="add-payment-btn" title="Adicionar Pagamento">💰</button>
                        <button class="edit-btn" title="Editar Dívida">✏️</button>
                        <button class="delete-btn" title="Excluir Dívida">🗑️</button>
                    </div>
                </div>
                <div class="debt-body">
                    <div class="info-row">
                        <strong>Valor Total:</strong>
                        <span>${formatCurrency(debt.totalAmount)}</span>
                    </div>
                    <div class="info-row">
                        <strong>Pago:</strong>
                        <span>${formatCurrency(totalPaid)}</span>
                    </div>
                    <div class="info-row">
                        <strong>Vencimento:</strong>
                        <span>${formatDate(debt.dueDate)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                    </div>
                    <div class="debt-balance">
                        <strong>Restante:</strong>
                        <span class="remaining">${formatCurrency(remaining > 0 ? remaining : 0)}</span>
                    </div>
                </div>
            `;
            debtList.appendChild(li);
        });
    };

    const openDebtModal = (debt = null) => {
        debtForm.reset();
        const modalTitle = document.getElementById('modal-title');
        if (debt) {
            modalTitle.textContent = 'Editar Dívida';
            document.getElementById('debt-id').value = debt.id;
            document.getElementById('description').value = debt.description;
            document.getElementById('total-amount').value = debt.totalAmount;
            document.getElementById('start-date').value = debt.startDate;
            document.getElementById('due-date').value = debt.dueDate || '';
            document.getElementById('notes').value = debt.notes || '';
        } else {
            modalTitle.textContent = 'Adicionar Nova Dívida';
            document.getElementById('debt-id').value = '';
            document.getElementById('start-date').valueAsDate = new Date();
        }
        debtModal.showModal();
    };
    
    const openPaymentModal = (debtId) => {
        paymentForm.reset();
        const debt = debts.find(d => d.id === debtId);
        if (!debt) return;
        
        const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = debt.totalAmount - totalPaid;
        
        document.getElementById('payment-debt-id').value = debtId;
        document.getElementById('payment-modal-title').textContent = `Pagamento para "${debt.description}"`;
        document.getElementById('payment-amount').value = remaining > 0 ? remaining.toFixed(2) : '';
        document.getElementById('payment-amount').max = remaining > 0 ? remaining.toFixed(2) : 0;
        document.getElementById('payment-date').valueAsDate = new Date();
        paymentModal.showModal();
    };

    // Event Listeners
    addDebtBtn.addEventListener('click', () => openDebtModal());
    cancelDebtBtn.addEventListener('click', () => debtModal.close());
    cancelPaymentBtn.addEventListener('click', () => paymentModal.close());

    debtForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('debt-id').value;
        const newDebt = {
            id: id || Date.now().toString(),
            description: document.getElementById('description').value,
            totalAmount: parseFloat(document.getElementById('total-amount').value),
            startDate: document.getElementById('start-date').value,
            dueDate: document.getElementById('due-date').value,
            notes: document.getElementById('notes').value,
            payments: id ? debts.find(d => d.id === id).payments : [],
        };

        if (id) {
            debts = debts.map(debt => debt.id === id ? newDebt : debt);
        } else {
            debts.push(newDebt);
        }
        saveDebts();
        renderDebts();
        debtModal.close();
    });
    
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const debtId = document.getElementById('payment-debt-id').value;
        const debt = debts.find(d => d.id === debtId);
        if(!debt) return;
        
        const newPayment = {
            amount: parseFloat(document.getElementById('payment-amount').value),
            date: document.getElementById('payment-date').value,
        };
        
        debt.payments.push(newPayment);
        saveDebts();
        renderDebts();
        paymentModal.close();
    });

    debtList.addEventListener('click', (e) => {
        const target = e.target;
        const li = target.closest('.debt-item');
        if (!li) return;
        const id = li.dataset.id;
        
        if (target.classList.contains('edit-btn')) {
            const debt = debts.find(d => d.id === id);
            openDebtModal(debt);
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Tem certeza que deseja excluir esta dívida?')) {
                debts = debts.filter(d => d.id !== id);
                saveDebts();
                renderDebts();
            }
        } else if (target.classList.contains('add-payment-btn')) {
            openPaymentModal(id);
        }
    });
    
    filterContainer.addEventListener('click', (e) => {
        if(e.target.tagName === 'BUTTON') {
            document.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderDebts();
        }
    });

    renderDebts();
});

