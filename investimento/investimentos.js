document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONFIG ---
    let usdToBrlRate = null;
    let calculatedValues = {};
    const allocation = { crypto: 0.10, dollar: 0.45, fixedIncome: 0.18, brStocks: 0.27 };
    const dollarAllocation = { usStocks: 0.60, usEtf: 0.40 };

    // --- DOM ELEMENTS ---
    const pages = { calculator: document.getElementById('calculator-page'), wallet: document.getElementById('wallet-page') };
    const navButtons = { calc: document.getElementById('nav-calc'), wallet: document.getElementById('nav-wallet') };
    const totalInvestmentInput = document.getElementById('total-investment');
    const resultsDiv = document.getElementById('results');
    const dollarCard = document.getElementById('dollar-card');
    const dollarDetailsDiv = document.getElementById('dollar-details');
    const saveButton = document.getElementById('save-btn');
    const resetButton = document.getElementById('reset-btn');
    const currentInputs = document.querySelectorAll('#wallet-page .input-item input');

    // --- EDIT FORM ELEMENTS ---
    const editBtn = document.getElementById('edit-initial-btn');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');
    const editInputs = {
        crypto: document.getElementById('edit-crypto'),
        fixedIncome: document.getElementById('edit-fixed-income'),
        brStocks: document.getElementById('edit-br-stocks'),
        usStocks: document.getElementById('edit-us-stocks'),
        usEtf: document.getElementById('edit-us-etf')
    };

    // --- DATA HANDLING ---
    const getWalletData = () => {
        const data = localStorage.getItem('investmentWallet');
        return data ? JSON.parse(data) : {
            initial: { crypto: 0, fixedIncome: 0, brStocks: 0, usStocks: 0, usEtf: 0 },
            current: { crypto: 0, fixedIncome: 0, brStocks: 0, usStocks: 0, usEtf: 0 }
        };
    };
    const saveWalletData = (data) => localStorage.setItem('investmentWallet', JSON.stringify(data));

    // --- FORMATTING ---
    const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    // --- FETCH DOLLAR RATE ---
    const fetchDollarRate = async () => {
        try {
            const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            usdToBrlRate = parseFloat(data.USDBRL.bid);
            document.getElementById('usd-rate-calc').textContent = `R$ ${usdToBrlRate.toFixed(4).replace('.', ',')}`;
        } catch {
            document.getElementById('usd-rate-calc').textContent = "Erro ao carregar";
        }
    };

    // --- CALCULATOR UI ---
    const updateCalculatorUI = () => {
        const total = parseFloat(totalInvestmentInput.value) || 0;
        if(total <= 0) return resultsDiv.classList.add('hidden');
        resultsDiv.classList.remove('hidden');

        calculatedValues = {
            crypto: total * allocation.crypto,
            dollar: total * allocation.dollar,
            fixedIncome: total * allocation.fixedIncome,
            brStocks: total * allocation.brStocks
        };
        calculatedValues.usStocks = calculatedValues.dollar * dollarAllocation.usStocks;
        calculatedValues.usEtf = calculatedValues.dollar * dollarAllocation.usEtf;

        document.getElementById('crypto-result').textContent = formatCurrency(calculatedValues.crypto);
        document.getElementById('dollar-result').textContent = formatCurrency(calculatedValues.dollar);
        document.getElementById('fixed-income-result').textContent = formatCurrency(calculatedValues.fixedIncome);
        document.getElementById('br-stocks-result').textContent = formatCurrency(calculatedValues.brStocks);

        if(usdToBrlRate){
            const dollarValue = (calculatedValues.dollar/usdToBrlRate).toFixed(2).replace('.', ',');
            const usStocksValue = (calculatedValues.usStocks/usdToBrlRate).toFixed(2).replace('.', ',');
            const usEtfValue = (calculatedValues.usEtf/usdToBrlRate).toFixed(2).replace('.', ',');
            document.getElementById('dollar-result').textContent += ` (US$ ${dollarValue})`;
            document.getElementById('us-stocks-result').innerHTML = `${formatCurrency(calculatedValues.usStocks)} <span class="dollar-value">(US$ ${usStocksValue})</span>`;
            document.getElementById('us-etf-result').innerHTML = `${formatCurrency(calculatedValues.usEtf)} <span class="dollar-value">(US$ ${usEtfValue})</span>`;
        }
    };

    // --- WALLET UI ---
    const updateWalletUI = () => {
        const data = getWalletData();
        const { initial, current } = data;
        const initialTotal = Object.values(initial).reduce((sum,val)=>sum+val,0);
        const currentTotal = Object.values(current).reduce((sum,val)=>sum+val,0);

        // Initial
        document.getElementById('initial-total').textContent = formatCurrency(initialTotal);
        document.getElementById('initial-crypto').textContent = formatCurrency(initial.crypto);
        document.getElementById('initial-fixed-income').textContent = formatCurrency(initial.fixedIncome);
        document.getElementById('initial-br-stocks').textContent = formatCurrency(initial.brStocks);
        document.getElementById('initial-dollar-combined').textContent = formatCurrency(initial.usStocks+initial.usEtf);

        // Current
        document.getElementById('current-total').textContent = formatCurrency(currentTotal);
        document.getElementById('current-crypto').value = current.crypto || '';
        document.getElementById('current-fixed-income').value = current.fixedIncome || '';
        document.getElementById('current-br-stocks').value = current.brStocks || '';
        document.getElementById('current-dollar-combined').value = (current.usStocks+current.usEtf)||'';

        // P/L
        updatePL(initial,current,initialTotal,currentTotal);
    };

    const updatePL = (initial,current,initialTotal,currentTotal) => {
        const pl = {};
        for(const key in initial) pl[key]=current[key]-initial[key];
        const totalPlValue = currentTotal-initialTotal;
        const formatPl = (value,initialValue)=>{
            const percent = initialValue>0?`(${(value/initialValue*100).toFixed(2)}%)`:'';
            const className = value>0?'profit':value<0?'loss':'';
            return `<span class="${className}">${formatCurrency(value)} ${percent}</span>`;
        };
        document.getElementById('total-pl').innerHTML=formatPl(totalPlValue,initialTotal);
        document.getElementById('pl-crypto').innerHTML=formatPl(pl.crypto,initial.crypto);
        document.getElementById('pl-fixed-income').innerHTML=formatPl(pl.fixedIncome,initial.fixedIncome);
        document.getElementById('pl-br-stocks').innerHTML=formatPl(pl.brStocks,initial.brStocks);
        const plDollarCombined = (pl.usStocks||0)+(pl.usEtf||0);
        const initialDollarCombined = (initial.usStocks||0)+(initial.usEtf||0);
        document.getElementById('pl-dollar-combined').innerHTML=formatPl(plDollarCombined,initialDollarCombined);
    };

    // --- PAGE NAVIGATION ---
    const switchPage = (pageName)=>{
        Object.values(pages).forEach(p=>p.classList.remove('active'));
        Object.values(navButtons).forEach(b=>b.classList.remove('active'));
        pages[pageName].classList.add('active');
        if(pageName==='calculator') navButtons.calc.classList.add('active');
        if(pageName==='wallet'){ navButtons.wallet.classList.add('active'); updateWalletUI(); }
    };
    navButtons.calc.addEventListener('click',()=>switchPage('calculator'));
    navButtons.wallet.addEventListener('click',()=>switchPage('wallet'));
    totalInvestmentInput.addEventListener('input',updateCalculatorUI);
    dollarCard.addEventListener('click',()=>dollarDetailsDiv.classList.toggle('hidden'));

    // --- SAVE CALCULATOR ---
    saveButton.addEventListener('click',()=>{
        const total = parseFloat(totalInvestmentInput.value)||0;
        if(total<=0){ alert('Insira um valor válido'); return; }
        const data = getWalletData();
        data.initial.crypto+=calculatedValues.crypto;
        data.initial.fixedIncome+=calculatedValues.fixedIncome;
        data.initial.brStocks+=calculatedValues.brStocks;
        data.initial.usStocks+=calculatedValues.usStocks;
        data.initial.usEtf+=calculatedValues.usEtf;
        saveWalletData(data);
        alert('Valores adicionados à carteira!');
        totalInvestmentInput.value=''; resultsDiv.classList.add('hidden'); updateWalletUI();
    });

    // --- CURRENT INPUTS ---
    currentInputs.forEach(input=>{
        input.addEventListener('change',(e)=>{
            const category=e.target.dataset.category;
            const value=parseFloat(e.target.value)||0;
            const data=getWalletData();
            if(category==='dollarCombined'){
                const initialUsTotal = data.initial.usStocks+data.initial.usEtf;
                let ratio=0.6;
                if(initialUsTotal>0) ratio=data.initial.usStocks/initialUsTotal;
                data.current.usStocks=value*ratio;
                data.current.usEtf=value*(1-ratio);
            }else{ data.current[category]=value; }
            saveWalletData(data); updateWalletUI();
        });
    });

    // --- RESET ---
    resetButton.addEventListener('click',()=>{
        if(confirm('Tem certeza que deseja resetar a carteira?')){
            localStorage.removeItem('investmentWallet'); updateWalletUI();
        }
    });

    // --- EDIT INLINE FORM ---
    editBtn.addEventListener('click',()=>{
        const data = getWalletData();
        for(const key in editInputs) editInputs[key].value = data.initial[key]||0;
        editForm.classList.remove('hidden');
    });

    cancelEditBtn.addEventListener('click',()=> editForm.classList.add('hidden'));
    saveEditBtn.addEventListener('click',()=>{
        const data = getWalletData();
        for(const key in editInputs) data.initial[key] = parseFloat(editInputs[key].value)||0;
        saveWalletData(data);
        editForm.classList.add('hidden');
        updateWalletUI();
    });

    // --- INIT ---
    const init = ()=>{
        fetchDollarRate().then(()=>{ if(totalInvestmentInput.value) updateCalculatorUI(); });
        updateWalletUI(); switchPage('calculator');
    };
    init();
});
