// script.js - Main logic for the POS system

(function() {
    // --- DOM Element References ---
    const productDisplay = document.getElementById('product-display');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const noProductsAvailable = document.getElementById('no-products-available');

    const cartSubtotalSpan = document.getElementById('cart-subtotal');
    const cartTaxSpan = document.getElementById('cart-tax');
    const cartTaxRateDisplay = document.getElementById('cart-tax-rate-display');
    const cartTotalSpan = document.getElementById('cart-total');

    const processSaleButton = document.getElementById('process-sale');
    const clearCartButton = document.getElementById('clear-cart');

    // Message box elements
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage ---
    let products = []; // Loaded from localStorage
    let businessSettings = {}; // Loaded from localStorage
    let cart = []; // Items currently in the cart

    // --- Helper Functions ---

    /**
     * showMessageBox - Displays a custom modal message box instead of native alert/confirm.
     * @param {string} message - The text message to display.
     * @param {boolean} [isConfirm=false] - If true, adds a "Cancel" button and returns a Promise.
     * @returns {Promise<boolean>|void}
     */
    function showMessageBox(message, isConfirm = false) {
        messageText.textContent = message;
        messageText.classList.add('whitespace-pre-wrap'); // Add for better multi-line display
        messageCancelButton.classList.add('hidden');
        messageOkButton.textContent = 'OK';

        messageBox.classList.remove('hidden'); // Ensure it's not hidden by class
        messageBox.style.opacity = '1';
        messageBox.style.pointerEvents = 'auto';
        messageBox.style.visibility = 'visible';

        return new Promise((resolve) => {
            const okHandler = () => {
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                messageBox.classList.add('hidden'); // Ensure it's hidden by class
                messageText.classList.remove('whitespace-pre-wrap'); // Clean up style
                messageOkButton.removeEventListener('click', okHandler);
                messageCancelButton.removeEventListener('click', cancelHandler);
                resolve(true);
            };
            const cancelHandler = () => {
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                messageBox.classList.add('hidden'); // Ensure it's hidden by class
                messageText.classList.remove('whitespace-pre-wrap'); // Clean up style
                messageOkButton.removeEventListener('click', okHandler);
                messageCancelButton.removeEventListener('click', cancelHandler);
                resolve(false);
            };
            messageOkButton.addEventListener('click', okHandler);
            if (isConfirm) {
                messageCancelButton.classList.remove('hidden');
                messageCancelButton.addEventListener('click', cancelHandler);
            }
        });
    }

    /**
     * loadData - Loads products and business settings from localStorage.
     */
    function loadData() {
        try {
            const savedProducts = localStorage.getItem('posProducts');
            const savedSettings = localStorage.getItem('posBusinessSettings');

            if (savedProducts) {
                products = JSON.parse(savedProducts);
            } else {
                products = []; // No products configured
            }

            if (savedSettings) {
                businessSettings = JSON.parse(savedSettings);
            } else {
                // Default settings if not found
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 10,
                    currencySymbol: '$',
                    businessAddress: '',
                    businessPhone: '',
                    businessEmail: '',
                    businessRegNo: '',
                    taxNumber: '',
                    technicianName: 'Technician', // Default value, changed from cashierName
                    businessLogo: ''
                };
            }
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load product data or business settings. Please check your browser storage.");
        }
    }

    /**
     * renderProducts - Displays product cards in the product display area.
     */
    function renderProducts() {
        productDisplay.innerHTML = '';
        if (products.length === 0) {
            noProductsAvailable.classList.remove('hidden');
        } else {
            noProductsAvailable.classList.add('hidden');
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center transition duration-300 hover:shadow-md hover:scale-105';
                const imageUrl = product.image && product.image.startsWith('data:image') ? product.image : 'https://placehold.co/100x100/e0f2fe/000000?text=Product';

                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" class="w-20 h-20 object-contain rounded-md mb-2 border border-gray-200">
                    <h3 class="font-semibold text-gray-800 text-lg mb-1">${product.name}</h3>
                    <p class="text-gray-600 text-sm">Stock: ${product.stock}</p>
                    <p class="font-bold text-blue-600 text-xl mt-2">${businessSettings.currencySymbol}${product.price.toFixed(2)}</p>
                    <button data-id="${product.id}" class="add-to-cart-btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mt-3 shadow transition duration-300 w-full ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${product.stock === 0 ? 'disabled' : ''}>
                        Add to Cart
                    </button>
                `;
                productDisplay.appendChild(productCard);
            });

            document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id;
                    addToCart(productId);
                });
            });
        }
    }

    /**
     * addToCart - Adds a product to the shopping cart.
     * @param {string} productId - The ID of the product to add.
     */
    function addToCart(productId) {
        const product = products.find(p => p.id === productId);

        if (!product) {
            showMessageBox("Product not found.");
            return;
        }

        if (product.stock <= 0) {
            showMessageBox(`"${product.name}" is out of stock.`);
            return;
        }

        // Check if item already exists in cart
        const existingCartItem = cart.find(item => item.id === productId);

        if (existingCartItem) {
            existingCartItem.quantity++;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            });
        }

        product.stock--; // Decrease stock
        localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock
        renderProducts(); // Re-render products to update stock display
        renderCart();
        showMessageBox(`Added ${product.name} to cart.`);
    }

    /**
     * removeFromCart - Removes a product from the shopping cart.
     * @param {string} productId - The ID of the product to remove.
     */
    function removeFromCart(productId) {
        const cartItemIndex = cart.findIndex(item => item.id === productId);

        if (cartItemIndex > -1) {
            const cartItem = cart[cartItemIndex];
            cartItem.quantity--;

            // Find the original product to restore stock
            const product = products.find(p => p.id === productId);
            if (product) {
                product.stock++; // Increase stock
                localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock
                renderProducts(); // Re-render products to update stock display
            }

            if (cartItem.quantity <= 0) {
                cart.splice(cartItemIndex, 1); // Remove item if quantity is 0 or less
            }
            renderCart();
            showMessageBox(`Removed 1x ${cartItem.name} from cart.`);
        }
    }

    /**
     * renderCart - Displays items in the shopping cart.
     */
    function renderCart() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            emptyCartMessage.classList.remove('hidden');
            processSaleButton.disabled = true;
            processSaleButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            emptyCartMessage.classList.add('hidden');
            processSaleButton.disabled = false;
            processSaleButton.classList.remove('opacity-50', 'cursor-not-allowed');

            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'flex items-center justify-between bg-white rounded-md p-3 mb-2 shadow-sm';
                const itemTotal = item.price * item.quantity;
                const imageUrl = item.image && item.image.startsWith('data:image') ? item.image : 'https://placehold.co/50x50/cccccc/000000?text=Item';

                cartItemDiv.innerHTML = `
                    <div class="flex items-center flex-grow">
                        <img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 object-contain rounded-md mr-3 border border-gray-100">
                        <div>
                            <h3 class="font-medium text-gray-800">${item.name}</h3>
                            <p class="text-sm text-gray-600">Qty: ${item.quantity} x ${businessSettings.currencySymbol}${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold text-gray-900 mr-3">${businessSettings.currencySymbol}${itemTotal.toFixed(2)}</span>
                        <button data-id="${item.id}" class="remove-from-cart-btn bg-red-400 hover:bg-red-500 text-white p-2 rounded-full text-sm leading-none flex items-center justify-center transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });

            document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id;
                    removeFromCart(productId);
                });
            });
        }
        calculateCartTotals();
    }

    /**
     * calculateCartTotals - Computes and displays the subtotal, tax, and total for the cart.
     */
    function calculateCartTotals() {
        const taxRate = businessSettings.taxRate / 100;
        cartTaxRateDisplay.textContent = businessSettings.taxRate;

        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let tax = subtotal * taxRate;
        let total = subtotal + tax;

        cartSubtotalSpan.textContent = `${businessSettings.currencySymbol}${subtotal.toFixed(2)}`;
        cartTaxSpan.textContent = `${businessSettings.currencySymbol}${tax.toFixed(2)}`;
        cartTotalSpan.textContent = `${businessSettings.currencySymbol}${total.toFixed(2)}`;
    }

    /**
     * processSale - Finalizes the sale, saves to transaction history, and clears the cart.
     */
    async function processSale() {
        if (cart.length === 0) {
            showMessageBox("Your cart is empty. Please add products to process a sale.");
            return;
        }

        const confirmed = await showMessageBox("Confirm sale? This will be added to transaction history.", true);
        if (confirmed) {
            const transaction = {
                id: `TXN-${Date.now()}`, // Unique transaction ID
                timestamp: new Date().toISOString(),
                items: [...cart], // Copy of cart items
                subtotal: parseFloat(cartSubtotalSpan.textContent.replace(businessSettings.currencySymbol, '')),
                tax: parseFloat(cartTaxSpan.textContent.replace(businessSettings.currencySymbol, '')),
                total: parseFloat(cartTotalSpan.textContent.replace(businessSettings.currencySymbol, '')),
                technician: businessSettings.technicianName || 'Technician' // Using technicianName
            };

            // Load existing transactions, add new one, and save
            let transactions = [];
            try {
                const savedTransactions = localStorage.getItem('posTransactions');
                if (savedTransactions) {
                    transactions = JSON.parse(savedTransactions);
                }
            } catch (e) {
                console.error("Error loading transactions:", e);
            }

            transactions.push(transaction);
            localStorage.setItem('posTransactions', JSON.stringify(transactions));

            cart = []; // Clear the cart
            renderCart();
            showMessageBox("Sale processed successfully!");
        } else {
            showMessageBox("Sale cancelled.");
        }
    }

    /**
     * clearCart - Clears all items from the shopping cart.
     */
    async function clearCart() {
        if (cart.length === 0) {
            showMessageBox("Cart is already empty.");
            return;
        }
        const confirmed = await showMessageBox("Are you sure you want to clear the entire cart?", true);
        if (confirmed) {
            // Restore stock for all items in the cart
            cart.forEach(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                if (product) {
                    product.stock += cartItem.quantity;
                }
            });
            localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock

            cart = [];
            renderProducts(); // Re-render products to reflect restored stock
            renderCart();
            showMessageBox("Cart cleared.");
        }
    }

    // --- Event Listeners ---
    processSaleButton.addEventListener('click', processSale);
    clearCartButton.addEventListener('click', clearCart);

    // --- Initialization ---
    loadData();
    renderProducts();
    renderCart(); // Initial render of the empty cart
})