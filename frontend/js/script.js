document.addEventListener('DOMContentLoaded', () => {
    // Funções globais ou inicializações
    updateNav(); // Atualiza a navegação com base no login

    // --- Página de Produtos (products.html) ---
    if (document.getElementById('products-grid')) {
        loadProducts(); // Carrega todos os produtos inicialmente
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => loadProducts(categoryFilter.value));
        }
    }

    // --- Formulário de Cadastro (register.html) ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // --- Formulário de Login (login.html) ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // --- Página do Carrinho (cart.html) ---
    if (document.getElementById('cart-items-container')) {
        loadCart();
    }

    // --- Página de Checkout (checkout.html) ---
    if (document.getElementById('checkout-form')) {
        checkSessionAndLoadCheckout(); // Verifica a sessão antes de carregar
    }
    const placeOrderForm = document.getElementById('checkout-form'); // Renomeando para evitar conflito
    if(placeOrderForm) {
        placeOrderForm.addEventListener('submit', handlePlaceOrder);
    }

});

function displayMessage(type, text, containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="message ${type}">${text}</div>`;
        setTimeout(() => container.innerHTML = '', 5000); // Limpa após 5s
    }
}

// Atualiza a barra de navegação (Login/Logout, nome do usuário)
function updateNav() {
    const navUser = document.getElementById('nav-user');
    const navAuth = document.getElementById('nav-auth');
    const userNameSpan = document.getElementById('user-name');

    // Checar se o usuário está logado (pode ser via localStorage ou um ping rápido ao backend)
    // Para este exemplo, vamos assumir que o backend/login.php define $_SESSION
    // e podemos ter um endpoint simples para checar a sessão.
    // Por ora, vamos simular com localStorage após o login bem-sucedido.

    const loggedInUser = localStorage.getItem('loggedInUser'); // Simples, melhore com session check

    if (loggedInUser) {
        if (navUser) navUser.style.display = 'inline';
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
    const messageContainer = document.getElementById('register-message'); // Específico para o form

    try {
        const response = await fetch('../backend/register.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            displayMessage('success', result.message, 'register-message');
            form.reset();
            setTimeout(() => { window.location.href = 'login.html'; }, 2000);
        } else {
            displayMessage('error', result.message || 'Erro no cadastro.', 'register-message');
        }
    } catch (error) {
        console.error('Erro no fetch do cadastro:', error);
        displayMessage('error', 'Ocorreu um erro na comunicação. Tente novamente.', 'register-message');
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const messageContainer = document.getElementById('login-message');

    try {
        const response = await fetch('../backend/login.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            displayMessage('success', result.message, 'login-message');
            // Armazenar info do usuário (simplificado, idealmente usar tokens/sessões mais robustas)
            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
            localStorage.setItem('isLoggedIn', 'true'); // Flag simples
            updateNav();
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            displayMessage('error', result.message || 'Erro no login.', 'login-message');
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('isLoggedIn');
        }
    } catch (error) {
        console.error('Erro no fetch do login:', error);
        displayMessage('error', 'Ocorreu um erro na comunicação. Tente novamente.', 'login-message');
    }
}

function handleLogout() {
    // Limpar dados de login do localStorage
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('isLoggedIn');
    // O backend/logout.php já destrói a sessão PHP.
    // Apenas redirecionar após limpar o localStorage.
    window.location.href = '../backend/logout.php'; // O PHP cuidará do redirecionamento final
}


async function loadProducts(category = 'todos') {
    const productsGrid = document.getElementById('products-grid');
    const loadingMessage = document.getElementById('loading-message');

    if (!productsGrid) return;
    if(loadingMessage) loadingMessage.style.display = 'block';
    productsGrid.innerHTML = ''; // Limpar produtos antigos

    try {
        const response = await fetch(`../backend/products.php?category=${encodeURIComponent(category)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (loadingMessage) loadingMessage.style.display = 'none';

        if (result.success && result.products.length > 0) {
            result.products.forEach(product => {
                const card = `
                    <div class="product-card" data-id="${product.id}">
                        <a href="${product.image_url || 'images/placeholder.png'}" data-fancybox="gallery" data-caption="${product.name}">
                            <img src="${product.image_url || 'images/placeholder.png'}" alt="${product.name}">
                        </a>
                        <h3>${product.name}</h3>
                        <p class="price">R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}</p>
                        <p class="description">${product.description || 'Sem descrição.'}</p>
                        <p><small>Categoria: ${product.category_name}</small></p>
                        <button onclick="addToCart(${product.id}, 1)">Adicionar ao Carrinho</button>
                    </div>
                `;
                productsGrid.innerHTML += card;
            });

            // --- NOVA LINHA ADICIONADA ---
            // Avisa a Fancybox para encontrar e ativar todos os novos links de imagem que acabamos de adicionar.
            Fancybox.bind("[data-fancybox='gallery']", {
                // Aqui você pode adicionar opções de customização se quiser no futuro
            });
            // --- FIM DA NOVA LINHA ---

        } else if (result.products.length === 0) {
            productsGrid.innerHTML = '<p>Nenhum produto encontrado para esta categoria.</p>';
        } else {
            productsGrid.innerHTML = `<p>Erro ao carregar produtos: ${result.message || 'Tente novamente mais tarde.'}</p>`;
        }
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        productsGrid.innerHTML = `<p>Ocorreu um erro ao carregar os produtos. Verifique sua conexão ou tente mais tarde. (${error.message})</p>`;
    }
}

async function addToCart(productId, quantity = 1) {
    // Verificar se o usuário está logado (usando o flag do localStorage como exemplo)
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        displayMessage('error', 'Você precisa estar logado para adicionar itens ao carrinho. <a href="login.html">Faça login</a>', 'global-message-container'); // Adicione um div no seu HTML principal
        // Alternativamente, redirecione: window.location.href = 'login.html';
        return;
    }

    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('quantity', quantity);

    try {
        const response = await fetch('../backend/cart_add.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            displayMessage('success', result.message || 'Produto adicionado!', 'global-message-container');
            // Opcional: atualizar contador do carrinho no header
        } else {
            if (result.redirect) {
                displayMessage('error', `${result.message} <a href="${result.redirect}">Faça login</a>`, 'global-message-container');
                // window.location.href = result.redirect;
            } else {
                displayMessage('error', result.message || 'Erro ao adicionar ao carrinho.', 'global-message-container');
            }
        }
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        displayMessage('error', 'Erro de comunicação ao adicionar ao carrinho.', 'global-message-container');
    }
}

async function loadCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsContainer || !cartSummary) return;

    try {
        const response = await fetch('../backend/cart_view.php');
        const result = await response.json();

        cartItemsContainer.innerHTML = ''; // Limpar antes de popular

        if (result.success) {
            if (result.cart_items && result.cart_items.length > 0) {
                if(emptyCartMessage) emptyCartMessage.style.display = 'none';
                if(checkoutBtn) checkoutBtn.style.display = 'inline-block';

                result.cart_items.forEach(item => {
                    const itemElement = `
                        <div class="cart-item" data-product-id="${item.product_id}">
                            <img src="${item.image_url || 'images/placeholder.png'}" alt="${item.name}">
                            <div class="cart-item-info">
                                <h4>${item.name}</h4>
                                <p>Preço: R$ ${parseFloat(item.price).toFixed(2).replace('.', ',')}</p>
                                <p>Quantidade: ${item.quantity}</p>
                                <p>Subtotal: R$ ${parseFloat(item.subtotal).toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div class="cart-item-actions">
                                <button onclick="removeFromCart(${item.product_id})">Remover</button>
                            </div>
                        </div>
                    `;
                    cartItemsContainer.innerHTML += itemElement;
                });
                cartSummary.innerHTML = `<h3>Total do Carrinho: R$ ${parseFloat(result.total).toFixed(2).replace('.', ',')}</h3>`;
            } else {
                cartItemsContainer.innerHTML = ''; // Garantir que está limpo
                if(emptyCartMessage) {
                    emptyCartMessage.textContent = result.message || 'Seu carrinho está vazio.';
                    emptyCartMessage.style.display = 'block';
                }
                cartSummary.innerHTML = '<h3>Total do Carrinho: R$ 0,00</h3>';
                if(checkoutBtn) checkoutBtn.style.display = 'none';
            }
        } else {
             if (result.redirect) {
                displayMessage('error', `${result.message} <a href="${result.redirect}">Faça login</a>`, 'global-message-container');
                setTimeout(() => { window.location.href = result.redirect; }, 3000);
            } else {
                cartItemsContainer.innerHTML = `<p class="message error">${result.message || 'Erro ao carregar o carrinho.'}</p>`;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        cartItemsContainer.innerHTML = '<p class="message error">Erro de comunicação ao carregar o carrinho.</p>';
    }
}

async function removeFromCart(productId) {
    if (!confirm('Tem certeza que deseja remover este item do carrinho?')) {
        return;
    }

    const formData = new FormData();
    formData.append('product_id', productId);

    try {
        const response = await fetch('../backend/cart_remove.php', {
            method: 'POST', // Ou 'GET' se você configurou o backend/cart_remove.php para aceitar GET
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            displayMessage('success', result.message || 'Item removido!', 'global-message-container');
            loadCart(); // Recarrega o carrinho para mostrar as mudanças
        } else {
            displayMessage('error', result.message || 'Erro ao remover item.', 'global-message-container');
        }
    } catch (error) {
        console.error('Erro ao remover do carrinho:', error);
        displayMessage('error', 'Erro de comunicação ao remover item.', 'global-message-container');
    }
}


async function checkSessionAndLoadCheckout() {
    const checkoutFormContainer = document.getElementById('checkout-form-container'); // Div que engloba o formulário
    const orderSummaryContainer = document.getElementById('order-summary-items');
    const summaryTotalElement = document.getElementById('summary-total');
    const globalMessageContainer = document.getElementById('global-message-container'); // Para mensagens de erro de sessão

    try {
        // 1. Verificar sessão no backend
        const sessionResponse = await fetch('../backend/checkout.php'); // Endpoint que verifica a sessão
        const sessionResult = await sessionResponse.json();

        if (!sessionResult.success) {
            if (globalMessageContainer) displayMessage('error', `${sessionResult.message} <a href="${sessionResult.redirect || 'login.html'}">Faça login</a>`, 'global-message-container');
            if (checkoutFormContainer) checkoutFormContainer.innerHTML = `<p>Você precisa estar logado para acessar esta página.</p>`;
            // Opcional: redirecionar após um tempo
            if (sessionResult.redirect) {
                 setTimeout(() => { window.location.href = sessionResult.redirect; }, 3000);
            }
            return; // Interrompe a execução se não estiver logado
        }

        // 2. Se logado, carregar o resumo do pedido (itens do carrinho)
        const cartResponse = await fetch('../backend/cart_view.php');
        const cartResult = await cartResponse.json();

        if (cartResult.success && cartResult.cart_items && cartResult.cart_items.length > 0) {
            if (orderSummaryContainer) orderSummaryContainer.innerHTML = ''; // Limpar
            cartResult.cart_items.forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<span>${item.name} (x${item.quantity})</span> <span>R$ ${parseFloat(item.subtotal).toFixed(2).replace('.', ',')}</span>`;
                if (orderSummaryContainer) orderSummaryContainer.appendChild(listItem);
            });
            if (summaryTotalElement) summaryTotalElement.textContent = `Total: R$ ${parseFloat(cartResult.total).toFixed(2).replace('.', ',')}`;

            // Habilitar o formulário de checkout se ele estava escondido/desabilitado
             if (checkoutFormContainer) checkoutFormContainer.style.display = 'block';

        } else {
            if (checkoutFormContainer) checkoutFormContainer.innerHTML = '<p>Seu carrinho está vazio. Adicione itens antes de finalizar a compra. <a href="products.html">Ver produtos</a></p>';
            if (orderSummaryContainer) orderSummaryContainer.innerHTML = '';
            if (summaryTotalElement) summaryTotalElement.textContent = 'Total: R$ 0,00';
        }

    } catch (error) {
        console.error('Erro ao carregar página de checkout:', error);
        if (globalMessageContainer) displayMessage('error', 'Erro ao carregar informações para o checkout. Tente novamente.', 'global-message-container');
        if (checkoutFormContainer) checkoutFormContainer.innerHTML = '<p>Ocorreu um erro. Por favor, tente recarregar a página.</p>';
    }
}

async function handlePlaceOrder(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form); // Coleta dados do formulário (endereço, etc.)
    const messageContainer = document.getElementById('checkout-message'); // Específico para o form de checkout

    // Adicionar validações de formulário de checkout aqui (endereço, etc.) antes de enviar
    // Ex: const address = formData.get('address'); if (!address) { displayMessage(...); return; }

    try {
        const response = await fetch('../backend/order.php', {
            method: 'POST',
            body: formData // Envia os dados do formulário de checkout (se houver)
        });
        const result = await response.json();

        if (result.success) {
            displayMessage('success', result.message, 'checkout-message');
            // Limpar formulário, localStorage de carrinho se necessário, redirecionar para uma página de "pedido concluído"
            form.reset(); // Limpa o formulário de checkout
            // Idealmente, redirecionar para uma página de confirmação do pedido.
            // Ex: window.location.href = `order_confirmation.html?order_id=${result.orderId}`;
            // Por agora, vamos apenas mostrar a mensagem e limpar o carrinho visualmente (o backend já limpou)
            if (document.getElementById('order-summary-items')) document.getElementById('order-summary-items').innerHTML = '';
            if (document.getElementById('summary-total')) document.getElementById('summary-total').textContent = 'Total: R$ 0,00';
            document.getElementById('checkout-form-inputs').style.display = 'none'; // Esconde os inputs do form
            // Você pode querer desabilitar o botão de "Finalizar Compra" aqui também.

        } else {
            if (result.redirect) { // Se a sessão expirou ou algo assim
                displayMessage('error', `${result.message} <a href="${result.redirect}">Faça login</a>`, 'checkout-message');
                 setTimeout(() => { window.location.href = result.redirect; }, 3000);
            } else {
                displayMessage('error', result.message || 'Erro ao finalizar o pedido.', 'checkout-message');
            }
        }
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        displayMessage('error', 'Ocorreu um erro de comunicação ao finalizar o pedido.', 'checkout-message');
    }
}

// Adicione um listener para o botão de logout se ele existir no header
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault(); // Previne o comportamento padrão do link se for um <a>
        handleLogout();
    });
}