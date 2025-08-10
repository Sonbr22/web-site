document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('form-modal');
    const addNewBtn = document.getElementById('add-new-btn');
    const closeBtn = document.querySelector('.close-btn');
    const form = document.getElementById('subscription-form');
    const subscriptionList = document.getElementById('subscription-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('empty-state');
    const toast = document.getElementById('toast');
    const totalOpenEl = document.getElementById('total-open');
    const totalOverdueEl = document.getElementById('total-overdue');
    const totalPaidEl = document.getElementById('total-paid');

    let items = JSON.parse(localStorage.getItem('subscriptions')) || [];
    let currentFilter = 'all';

    // ---- Modal Logic ----
    addNewBtn.onclick = () => {
        form.reset();
        document.getElementById('item-id').value = '';
        form.querySelector('h2').textContent = 'Nova Assinatura';
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // ---- Data Logic ----
    const saveItems = () => {
        localStorage.setItem('subscriptions', JSON.stringify(items));
        renderItems();
    };

    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // ---- Form Submission ----
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            id: document.getElementById('item-id').value || Date.now(),
            name: document.getElementById('name').value,
            value: parseFloat(document.getElementById('value').value),
            dueDate: document.getElementById('due-date').value,
            paymentMethod: document.getElementById('payment-method').value,
            notes: document.getElementById('notes').value,
            status: 'open', // 'open', 'paid'
            delayHistory: [],
        };

        const existingIndex = items.findIndex(item => item.id == newItem.id);
        if (existingIndex > -1) {
            // Preserve status unless it's a new item
            newItem.status = items[existingIndex].status;
            newItem.delayHistory = items[existingIndex].delayHistory;
            items[existingIndex] = newItem;
            showToast('Assinatura atualizada com sucesso!');
        } else {
            items.push(newItem);
            showToast('Assinatura salva com sucesso!');
        }

        saveItems();
        form.reset();
        modal.style.display = 'none';
    });

    // ---- Item Actions ----
    subscriptionList.addEventListener('click', (e) => {
        const target = e.target;
        const itemEl = target.closest('.subscription-item');
        if (!itemEl) return;
        const itemId = itemEl.dataset.id;

        if (target.classList.contains('btn-delete')) {
            if (confirm('Tem certeza que deseja deletar esta assinatura?')) {
                items = items.filter(item => item.id != itemId);
                saveItems();
                showToast('Assinatura deletada.');
            }
        } else if (target.classList.contains('btn-paid')) {
            updateStatus(itemId, 'paid');
        } else if (target.classList.contains('btn-edit')) {
            const item = items.find(i => i.id == itemId);
            if(item) {
                form.querySelector('h2').textContent = 'Editar Assinatura';
                document.getElementById('item-id').value = item.id;
                document.getElementById('name').value = item.name;
                document.getElementById('value').value = item.value;
                document.getElementById('due-date').value = item.dueDate;
                document.getElementById('payment-method').value = item.paymentMethod;
                document.getElementById('notes').value = item.notes;
                modal.style.display = 'block';
            }
        } else if (target.classList.contains('btn-undo')) {
            updateStatus(itemId, 'open');
        }
    });
    
    const updateStatus = (id, newStatus) => {
        const item = items.find(i => i.id == id);
        if (item) {
            item.status = newStatus;
            saveItems();
            if (newStatus === 'paid') {
                showToast(`Status atualizado para: Pago`);
            } else if (newStatus === 'open') {
                showToast(`Status revertido para: Em Aberto`);
            }
        }
    };

    // ---- Filtering ----
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderItems();
        });
    });

    // ---- Rendering ----
    const renderItems = () => {
        checkForOverdue();
        subscriptionList.innerHTML = '';
        updateSummary();
        
        const filteredItems = items.filter(item => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'paid') return item.status === 'paid';
            if (currentFilter === 'overdue') return item.isOverdue && item.status !== 'paid';
            if (currentFilter === 'open') return item.status === 'open' && !item.isOverdue;
            return false;
        }).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (filteredItems.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        filteredItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.classList.add('subscription-item');
            itemEl.dataset.id = item.id;

            // Add status classes
            if (item.status === 'paid') {
                itemEl.classList.add('paid');
            } else if (item.isOverdue) {
                itemEl.classList.add('overdue');
                if (item.delayHistory.length > 1) {
                    itemEl.classList.add('repeatedly-overdue');
                }
            }

            const formattedValue = item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const [year, month, day] = item.dueDate.split('-');
            const formattedDate = `${day}/${month}/${year}`;

            let statusBadge = '';
            if (item.status === 'paid') {
                statusBadge = '<span class="status-badge">Pago</span>';
            }

            let actionButtons = '';
            if (item.status === 'paid') {
                actionButtons = `
                    <button class="action-btn btn-undo"><i class="fas fa-undo"></i> Desfazer</button>
                    <button class="action-btn btn-edit"><i class="fas fa-pencil-alt"></i> Editar</button>
                    <button class="action-btn btn-delete"><i class="fas fa-trash"></i> Deletar</button>
                `;
            } else {
                 actionButtons = `
                    <button class="action-btn btn-paid"><i class="fas fa-check"></i> Pago</button>
                    <button class="action-btn btn-edit"><i class="fas fa-pencil-alt"></i> Editar</button>
                    <button class="action-btn btn-delete"><i class="fas fa-trash"></i> Deletar</button>
                `;
            }

            itemEl.innerHTML = `
                <div class="item-header">
                    <h3>${item.name}</h3>
                    <span class="item-value">${formattedValue}</span>
                </div>
                <div class="item-details">
                    <p><strong>Vencimento:</strong> ${formattedDate} ${statusBadge}</p>
                    <p><strong>Pagamento:</strong> ${item.paymentMethod || 'N/A'}</p>
                    ${item.notes ? `<p><strong>Obs:</strong> ${item.notes}</p>` : ''}
                </div>
                <div class="item-actions">
                    ${actionButtons}
                </div>
            `;
            subscriptionList.appendChild(itemEl);
        });
    };
    
    const checkForOverdue = () => {
        const today = new Date();
        today.setHours(0,0,0,0); // Normalize to start of day

        let shouldSave = false;
        items.forEach(item => {
            const dueDate = new Date(item.dueDate + 'T00:00:00'); // Ensure local timezone
            dueDate.setHours(0,0,0,0);
            
            const isNowOverdue = dueDate < today && item.status !== 'paid';

            if(isNowOverdue && !item.isOverdue) { // Became overdue just now
                item.isOverdue = true;
                const todayStr = today.toISOString().split('T')[0];
                if (!item.delayHistory.includes(todayStr)) {
                    item.delayHistory.push(todayStr);
                    shouldSave = true;
                    showToast(`Alerta: '${item.name}' está atrasado!`);
                    if (item.delayHistory.length > 1) {
                            showToast(`Alerta: '${item.name}' atrasou novamente!`);
                    }
                }
            } else {
                 item.isOverdue = isNowOverdue;
            }
        });

        if(shouldSave) {
            localStorage.setItem('subscriptions', JSON.stringify(items));
        }
    };
    
    const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const updateSummary = () => {
        const totalOpen = items.filter(i => i.status === 'open' && !i.isOverdue).reduce((sum, i) => sum + i.value, 0);
        const totalOverdue = items.filter(i => i.isOverdue && i.status !== 'paid').reduce((sum, i) => sum + i.value, 0);
        const totalPaid = items.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.value, 0);

        totalOpenEl.textContent = formatCurrency(totalOpen);
        totalOverdueEl.textContent = formatCurrency(totalOverdue);
        totalPaidEl.textContent = formatCurrency(totalPaid);
    };

    // Initial Render
    renderItems();
});