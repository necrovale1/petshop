document.addEventListener('DOMContentLoaded', () => {
    // Funções globais ou inicializações
    updateNav(); // Atualiza a navegação com base no login

    // --- Página de Checkout ---
    if (document.getElementById('checkout-form')) {
        checkSessionAndLoadCheckout();
        setupPaymentMethodToggle(); // Cuida da troca entre Cartão/PIX
        setupInputMasks(); // Aplica máscaras nos inputs do cartão
        setupShippingCalculator(); // Lógica do cálculo de frete
        
        const placeOrderForm = document.getElementById('checkout-form');
        placeOrderForm.addEventListener('submit', handlePlaceOrder);

        const pixModal = document.getElementById('pix-modal');
        if (pixModal) {
            pixModal.querySelector('.close-modal-btn').addEventListener('click', () => pixModal.classList.remove('show'));
            document.getElementById('confirm-pix-payment-btn').addEventListener('click', () => {
                pixModal.classList.remove('show');
                submitOrder();
            });
        }
    }

    // --- Outras Páginas (sem alterações na lógica de inicialização) ---
    if (document.getElementById('products-grid')) loadProducts();
    if (document.querySelector('.products-preview-grid')) loadFeaturedProducts();
    if (document.getElementById('order-history-container')) loadOrderHistory();
    const registerForm = document.getElementById('register-form');
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (document.getElementById('cart-items-container')) loadCart();
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
});

let cartSubtotal = 0;
let shippingCost = 0;

// --- FUNÇÕES DE SIMULAÇÃO DO CHECKOUT ---

function setupShippingCalculator() {
    const btn = document.getElementById('calculate-shipping-btn');
    const zipInput = document.getElementById('zipcode');
    const resultsDiv = document.getElementById('shipping-results');

    if(!btn) return;

    btn.addEventListener('click', () => {
        const cep = zipInput.value.replace(/\D/g, ''); // Remove não-números
        if (cep.length !== 8) {
            resultsDiv.innerHTML = `<span style="color: var(--error-color);">CEP inválido. Digite 8 números.</span>`;
            return;
        }

        resultsDiv.innerHTML = 'Calculando...';
        setTimeout(() => {
            shippingCost = 25.50; // Valor fixo simulado
            resultsDiv.innerHTML = `<span>SEDEX - Entrega em 3 dias úteis: <strong>R$ ${shippingCost.toFixed(2).replace('.', ',')}</strong></span>`;
            updateTotals();
        }, 1500);
    });
}

function updateTotals() {
    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const shippingLineEl = document.getElementById('shipping-line');
    const totalEl = document.getElementById('summary-total');
    
    if(!subtotalEl || !shippingEl || !shippingLineEl || !totalEl) return;

    const total = cartSubtotal + shippingCost;
    
    subtotalEl.textContent = `R$ ${cartSubtotal.toFixed(2).replace('.', ',')}`;
    shippingEl.textContent = `R$ ${shippingCost.toFixed(2).replace('.', ',')}`;
    totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    if (shippingCost > 0) {
        shippingLineEl.style.display = 'flex';
    }
}

function setupInputMasks() {
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvcInput = document.getElementById('card-cvc');
    const logoContainer = document.getElementById('card-logo-container');
    
    if(!cardNumberInput) return; // Só executa se estiver na página de checkout

    const visaLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.64,7.82,16.71,16.18h-2.5L11.75,7.82H14.2l1.45,5.64.45,2.13h.1a3.56,3.56,0,0,1,.45-2.13L18.14,7.82Z"/><path d="M8.28,10.65a2.14,2.14,0,0,0-1.8-.92,2.56,2.56,0,0,0-2.67,2.8,2.5,2.5,0,0,0,2.67,2.83,2.06,2.06,0,0,0,1.81-.94l.2, .84h2.1V7.82H8.88Zm-1.6,3a1,1,0,0,1-1.08-1.15.93.93,0,0,1,1.08-1.15,1,1,0,0,1,1.08,1.15A1,1,0,0,1,6.68,13.65Z"/><path d="M22,7.82h-2.3L18.43,16.18H20.9l.4-1.82h2l.24,1.82H26L24.3,7.82Zm-.9,5.2h-1l.5-3.5Z"/></svg>`;

    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 16);
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
        logoContainer.innerHTML = value.startsWith('4') ? visaLogo : '';
    });

    cardExpiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    cardCvcInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    });
}

function setupPaymentMethodToggle() {
    const cardRadio = document.getElementById('payment_card');
    const pixRadio = document.getElementById('payment_pix');
    const cardInfo = document.getElementById('credit-card-info');
    
    if(!cardRadio) return; // Só executa se estiver na página

    cardRadio.addEventListener('change', () => {
        if(cardRadio.checked) cardInfo.style.display = 'block';
    });
    pixRadio.addEventListener('change', () => {
        if(pixRadio.checked) cardInfo.style.display = 'none';
    });
}


// --- LÓGICA DE ORDEM E PAGAMENTO ---
async function handlePlaceOrder(event) {
    event.preventDefault();
    
    if (shippingCost <= 0) {
        displayMessage('error', 'Por favor, calcule o frete antes de continuar.', 'checkout-message');
        return;
    }

    const form = event.target;
    const paymentMethod = form.querySelector('input[name="payment_method"]:checked').value;

    if (paymentMethod === 'credit_card') {
        const cardName = form.querySelector('#card-name').value;
        if (!cardName) {
            displayMessage('error', 'Por favor, preencha o nome no cartão.', 'checkout-message');
            return;
        }
        submitOrder();
    } else if (paymentMethod === 'pix') {
        const pixModal = document.getElementById('pix-modal');
        const loader = document.getElementById('pix-loader');
        const qrCodeArea = document.getElementById('pix-qr-code-area');
        
        loader.style.display = 'block';
        qrCodeArea.style.display = 'none';
        pixModal.classList.add('show');

        setTimeout(() => {
            loader.style.display = 'none';
            qrCodeArea.style.display = 'block';
        }, 2000);
    }
}

async function submitOrder() {
    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    const placeOrderBtn = document.getElementById('place-order-btn');

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processando...';

    try {
        const response = await fetch('../backend/order.php', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            // AQUI ESTÁ A MUDANÇA: Mostra o modal de sucesso
            const successModal = document.getElementById('success-modal');
            if (successModal) {
                successModal.classList.add('show');
            }
            
            // Redireciona para o histórico após 5 segundos
            setTimeout(() => {
                window.location.href = 'history.html';
            }, 5000);

        } else {
            displayMessage('error', result.message || 'Erro ao finalizar o pedido.', 'global-message-container');
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Efetuar Pagamento';
        }
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        displayMessage('error', 'Ocorreu um erro de comunicação.', 'global-message-container');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Efetuar Pagamento';
    }
}


// --- FUNÇÕES GERAIS E DE PÁGINAS ---

function createProductCardHTML(product) {
    // CORREÇÃO APLICADA AQUI: Removido o "../" do início do caminho da imagem
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image-container">
                <a href="${product.image_url || 'images/placeholder.png'}" data-fancybox="gallery" data-caption="${product.name}">
                    <img src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}">
                </a>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category_name}</span>
                <h3>${product.name}</h3>
                <p class="description">${product.description || 'Sem descrição disponível.'}</p>
                <div class="product-footer">
                    <p class="price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                    <button class="add-to-cart-btn" onclick="addToCart(${product.id}, 1)">
                        <span class="icon">🛒</span> Adicionar
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadOrderHistory() {
    const container = document.getElementById('order-history-container');
    if (!container) return;

    try {
        const response = await fetch('../backend/order_history.php');
        const result = await response.json();

        if (result.success) {
            if (result.orders.length > 0) {
                container.innerHTML = '';
                result.orders.forEach(order => {
                    const orderDate = new Date(order.order_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    let itemsHtml = '<ul class="order-items-list">';
                    order.items.forEach(item => {
                        // CORREÇÃO APLICADA AQUI: Removido o "../"
                        itemsHtml += `
                            <li>
                                <img src="${item.image_url || 'images/placeholder.png'}" alt="${item.product_name}" class="item-thumbnail">
                                <span>${item.product_name} (x${item.quantity})</span>
                                <span>R$ ${parseFloat(item.price_at_purchase).toFixed(2).replace('.', ',')}</span>
                            </li>`;
                    });
                    itemsHtml += '</ul>';
                    container.innerHTML += `
                        <div class="order-block">
                            <div class="order-header">
                                <h3>Pedido #${order.id}</h3>
                                <span>Data: ${orderDate}</span>
                                <span>Status: <strong>${order.status}</strong></span>
                                <span>Total: <strong>R$ ${parseFloat(order.total_amount).toFixed(2).replace('.', ',')}</strong></span>
                            </div>
                            <div class="order-body">${itemsHtml}</div>
                        </div>`;
                });
            } else {
                container.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
            }
        } else {
            if (result.redirect) setTimeout(() => { window.location.href = result.redirect; }, 3000);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

function displayMessage(type, text, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="message ${type}">${text}</div>`;
        setTimeout(() => { container.innerHTML = '' }, 5000);
    }
}

function updateNav() {
    const navUser = document.getElementById('nav-user');
    const navAuth = document.getElementById('nav-auth');
    const userNameSpan = document.getElementById('user-name');
    const loggedInUser = localStorage.getItem('loggedInUser'); 

    if (loggedInUser) {
        // AQUI ESTÁ A MUDANÇA
        if (navUser) navUser.style.display = 'inline-flex'; 
        if (navAuth) navAuth.style.display = 'none';
        if (userNameSpan) userNameSpan.textContent = JSON.parse(loggedInUser).name;
    } else {
        if (navUser) navUser.style.display = 'none';
        if (navAuth) navAuth.style.display = 'inline';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const messageContainer = document.getElementById('register-message');
    try {
        const response = await fetch('../backend/register.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            displayMessage('success', result.message, 'register-message');
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
            displayMessage('error', result.message || 'Erro no cadastro.', 'register-message');
        }
    } catch (error) {
        displayMessage('error', 'Ocorreu um erro na comunicação.', 'register-message');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const messageContainer = document.getElementById('login-message');
    try {
        const response = await fetch('../backend/login.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true');
            updateNav();
            window.location.href = 'index.html';
        } else {
            displayMessage('error', result.message || 'Erro no login.', 'login-message');
        }
    } catch (error) {
        displayMessage('error', 'Ocorreu um erro na comunicação.', 'login-message');
    }
}

function handleLogout(event) {
    if(event) event.preventDefault();
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '../backend/logout.php';
}

async function loadFeaturedProducts() {
    const featuredGrid = document.querySelector('.products-preview-grid');
    if (!featuredGrid) return;
    try {
        const response = await fetch(`backend/products.php`);
        const result = await response.json();
        if (result.success && result.products.length > 0) {
            featuredGrid.innerHTML = '';
            result.products.slice(0, 4).forEach(product => {
                featuredGrid.innerHTML += createProductCardHTML(product);
            });
            if(typeof Fancybox !== 'undefined') Fancybox.bind("[data-fancybox='gallery']");
        }
    } catch (error) { console.error('Erro ao buscar produtos em destaque:', error); }
}

async function loadProducts(category = 'todos') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    productsGrid.innerHTML = '<p>Carregando produtos...</p>';
    try {
        const response = await fetch(`../backend/products.php?category=${encodeURIComponent(category)}`);
        const result = await response.json();
        if (result.success && result.products.length > 0) {
            productsGrid.innerHTML = '';
            result.products.forEach(product => {
                productsGrid.innerHTML += createProductCardHTML(product);
            });
            if(typeof Fancybox !== 'undefined') Fancybox.bind("[data-fancybox='gallery']");
        } else {
            productsGrid.innerHTML = '<p>Nenhum produto encontrado para esta categoria.</p>';
        }
    } catch (error) { console.error('Erro ao buscar produtos:', error); }
}

async function addToCart(productId, quantity = 1) {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        displayMessage('error', 'Você precisa estar logado para adicionar itens ao carrinho. <a href="login.html">Faça login</a>', 'global-message-container');
        return;
    }
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('quantity', quantity);
    try {
        const response = await fetch('../backend/cart_add.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            displayMessage('success', result.message || 'Produto adicionado!', 'global-message-container');
        } else {
            displayMessage('error', result.message, 'global-message-container');
        }
    } catch (error) { console.error('Erro ao adicionar ao carrinho:', error); }
}

async function loadCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummaryContainer = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartLayout = document.querySelector('.cart-layout');

    if (!cartItemsContainer) return;

    try {
        const response = await fetch('../backend/cart_view.php');
        const result = await response.json();
        if (result.success && result.cart_items && result.cart_items.length > 0) {
            if (emptyCartMessage) emptyCartMessage.style.display = 'none';
            if (cartLayout) cartLayout.style.display = 'grid';
            cartItemsContainer.innerHTML = '';
            result.cart_items.forEach(item => {
                // CORREÇÃO APLICADA AQUI: Removido o "../"
                cartItemsContainer.innerHTML += `
                    <div class="cart-item" data-product-id="${item.product_id}">
                        <img src="${item.image_url || 'images/placeholder.png'}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>Preço Unitário: R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</p>
                            <p>Subtotal: R$ ${parseFloat(item.subtotal).toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-selector">
                                <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="0" onchange="updateCartQuantity(${item.product_id}, this.value)">
                                <button class="quantity-btn" onclick="updateCartQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                            </div>
                            <button class="remove-btn" onclick="updateCartQuantity(${item.product_id}, 0)">Remover</button>
                        </div>
                    </div>`;
            });
            cartSubtotal = parseFloat(result.total);
            if (cartSummaryContainer) cartSummaryContainer.innerHTML = `<h3>Total: R$ ${cartSubtotal.toFixed(2).replace('.', ',')}</h3>`;
        } else {
            if (emptyCartMessage) {
                emptyCartMessage.innerHTML = `<p>${result.message || 'Seu carrinho está vazio.'}</p><a href="products.html" class="cta-button" style="margin-top:20px;">Ver Produtos</a>`;
                emptyCartMessage.style.display = 'block';
            }
            if (cartLayout) cartLayout.style.display = 'none';
        }
    } catch (error) { console.error('Erro ao carregar carrinho:', error); }
}

async function updateCartQuantity(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 0) return;
    if (quantity === 0 && !confirm('Deseja remover este item do carrinho?')) {
        loadCart();
        return;
    }
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('quantity', quantity);
    try {
        const response = await fetch('../backend/cart_update.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) loadCart();
        else displayMessage('error', result.message || 'Erro ao atualizar.', 'global-message-container');
    } catch (error) { console.error('Erro ao atualizar quantidade:', error); }
}

async function checkSessionAndLoadCheckout() {
    try {
        const sessionResponse = await fetch('../backend/checkout.php');
        const sessionResult = await sessionResponse.json();
        if (!sessionResult.success) {
            document.getElementById('checkout-form-container').innerHTML = `<p>Você precisa estar logado para finalizar a compra. <a href="login.html">Faça login</a>.</p>`;
            return;
        }

        const cartResponse = await fetch('../backend/cart_view.php');
        const cartResult = await cartResponse.json();
        if (cartResult.success && cartResult.cart_items && cartResult.cart_items.length > 0) {
            const summaryContainer = document.getElementById('order-summary-items');
            summaryContainer.innerHTML = '';
            cartResult.cart_items.forEach(item => {
                summaryContainer.innerHTML += `<li><span>${item.name} (x${item.quantity})</span> <span>R$ ${parseFloat(item.subtotal).toFixed(2).replace('.', ',')}</span></li>`;
            });
            cartSubtotal = parseFloat(cartResult.total);
            updateTotals();
        } else {
            document.getElementById('checkout-form-container').innerHTML = '<div style="text-align: center;"><p>Seu carrinho está vazio.</p><a href="products.html" class="cta-button">Ver produtos</a></div>';
        }
    } catch (error) { console.error('Erro ao carregar checkout:', error); }
}