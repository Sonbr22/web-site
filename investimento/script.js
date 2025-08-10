document.addEventListener('DOMContentLoaded', async () => {
    const totalInvestmentInput = document.getElementById('total-investment');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultContainer = document.getElementById('result-container');
    const cryptoResultDiv = document.getElementById('crypto-result');
    const dolarResultDiv = document.getElementById('dolar-result');
    const dolarMainText = dolarResultDiv.querySelector('.dolar-main-text');
    const dolarDetailsDiv = dolarResultDiv.querySelector('.result-item-details');
    const dolarStocksResultDiv = document.getElementById('dolar-stocks-result');
    const dolarEtfResultDiv = document.getElementById('dolar-etf-result');
    const exchangeRateInfoDiv = dolarResultDiv.querySelector('.exchange-rate-info');
    const fixedIncomeResultDiv = document.getElementById('fixed-income-result');
    const brazilianStocksResultDiv = document.getElementById('brazilian-stocks-result');

    let brlToUsdRateGlobal = null;

    const formatCurrency = (value, currency = 'BRL', locale = 'pt-BR') => {
        return value.toLocaleString(locale, { style: 'currency', currency });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            const copyNotification = document.createElement('div');
            copyNotification.textContent = 'Copiado!';
            copyNotification.className = 'copy-notification';
            document.body.appendChild(copyNotification);
            setTimeout(() => {
                copyNotification.classList.add('show');
            }, 10);
            setTimeout(() => {
                copyNotification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(copyNotification);
                }, 300);
            }, 1500);
        }).catch(err => {
            console.error('Erro ao copiar o valor: ', err);
            alert('Não foi possível copiar o valor.');
        });
    };

    const createResultSpan = (value, currency = 'BRL', locale = 'pt-BR') => {
        const span = document.createElement('span');
        span.textContent = formatCurrency(value, currency, locale);
        span.classList.add('copyable-value');
        span.title = 'Clique para copiar o valor';
        span.addEventListener('click', () => {
            const numericValue = value.toFixed(2).toString();
            copyToClipboard(numericValue);
        });
        return span;
    };

    const fetchExchangeRate = async () => {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/brl.json');
            if (!response.ok) throw new Error('Erro ao buscar cotação.');

            const data = await response.json();
            brlToUsdRateGlobal = data.brl.usd;
        } catch (error) {
            console.error('Erro ao obter cotação do dólar:', error);
            brlToUsdRateGlobal = null;
        }
    };

    await fetchExchangeRate(); // carrega ao abrir
    setInterval(fetchExchangeRate, 10 * 60 * 1000); // atualiza a cada 10 min

    calculateBtn.addEventListener('click', () => {
        const totalValue = parseFloat(totalInvestmentInput.value.replace(',', '.'));

        if (isNaN(totalValue) || totalValue <= 0) {
            alert('Por favor, insira um valor de investimento válido.');
            return;
        }

        if (!brlToUsdRateGlobal) {
            alert('Aguardando a cotação do dólar. Tente novamente em alguns segundos.');
            return;
        }

        // Reset resultados
        cryptoResultDiv.textContent = 'Criptomoedas (10%): ';
        fixedIncomeResultDiv.textContent = 'Renda Fixa (18%): ';
        brazilianStocksResultDiv.textContent = 'Bolsa Brasileira (27%): ';
        dolarMainText.textContent = 'Dólar (45%): ';
        dolarStocksResultDiv.textContent = 'Bolsa Americana (60%): ';
        dolarEtfResultDiv.textContent = 'ETF Renda Fixa (40%): ';

        const cryptoAmount = totalValue * 0.10;
        const dolarAmountBRL = totalValue * 0.45;
        const fixedIncomeAmount = totalValue * 0.18;
        const brazilianStocksAmount = totalValue * 0.27;

        cryptoResultDiv.appendChild(createResultSpan(cryptoAmount));
        fixedIncomeResultDiv.appendChild(createResultSpan(fixedIncomeAmount));
        brazilianStocksResultDiv.appendChild(createResultSpan(brazilianStocksAmount));
        dolarMainText.appendChild(createResultSpan(dolarAmountBRL));

        const dolarAmountUSD = dolarAmountBRL * brlToUsdRateGlobal;
        const dolarStocksAmountUSD = dolarAmountUSD * 0.60;
        const dolarEtfAmountUSD = dolarAmountUSD * 0.40;

        dolarStocksResultDiv.appendChild(createResultSpan(dolarStocksAmountUSD, 'USD', 'en-US'));
        dolarEtfResultDiv.appendChild(createResultSpan(dolarEtfAmountUSD, 'USD', 'en-US'));

        exchangeRateInfoDiv.textContent = `Cotação usada: 1 BRL = ${brlToUsdRateGlobal.toFixed(4)} USD`;

        dolarResultDiv.classList.add('expandable');
        dolarResultDiv.classList.remove('expanded');
        dolarDetailsDiv.classList.add('hidden');
        resultContainer.classList.remove('hidden');
    });

    dolarResultDiv.querySelector('.result-item-main').addEventListener('click', (e) => {
        if (e.target.classList.contains('copyable-value')) return;

        if (dolarResultDiv.classList.contains('expandable')) {
            dolarDetailsDiv.classList.toggle('hidden');
            dolarResultDiv.classList.toggle('expanded');
        }
    });

    totalInvestmentInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            calculateBtn.click();
        }
    });
});
