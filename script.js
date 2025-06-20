// main.js - Core logic for the POS system

(function() {
    // --- DOM Element References ---
    // Products Section
    const productSearchInput = document.getElementById('product-search');
    const productGrid = document.getElementById('product-grid');
    // Note: addProductBtn is not used in this specific file but is mentioned in the original settings.html
    // const addProductBtn = document.getElementById('add-product-btn'); // For navigating to product management

    // Current Sale Section
    const currentSaleItemsContainer = document.getElementById('cart-items-container'); // Corrected ID from 'current-sale-items-container'
    const emptySaleMessage = document.getElementById('empty-cart-message'); // Corrected ID from 'empty-sale-message'
    const subtotalSpan = document.getElementById('subtotal');
    const taxSpan = document.getElementById('tax');
    const taxRateDisplay = document.getElementById('tax-rate-display');
    const totalSpan = document.getElementById('total');
    const completeSaleButton = document.getElementById('complete-sale-btn'); // Corrected ID from 'process-sale'
    const clearSaleButton = document.getElementById('clear-sale-btn'); // Corrected ID from 'clear-cart'

    // Message box elements
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage ---
    let products = []; // Array of product objects (from localStorage)
    let currentSale = []; // Array of items currently in the cart
    let businessSettings = {}; // Business settings (from localStorage)
    let transactions = []; // Array of past transactions (from localStorage)

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
                // Hide the message box
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
                // Hide the message box
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
     * loadData - Loads products, business settings, and transactions from localStorage.
     * Also sets up default settings if none exist.
     */
    function loadData() {
        try {
            const savedProducts = localStorage.getItem('posProducts');
            const savedSettings = localStorage.getItem('posBusinessSettings');
            const savedTransactions = localStorage.getItem('posTransactions');

            products = savedProducts ? JSON.parse(savedProducts) : [];

            if (savedSettings) {
                businessSettings = JSON.parse(savedSettings);
                // Ensure invoiceCounter and quotationCounter exist for new pages if not already there
                if (typeof businessSettings.invoiceCounter === 'undefined') {
                    businessSettings.invoiceCounter = 1;
                }
                if (typeof businessSettings.quotationCounter === 'undefined') {
                    businessSettings.quotationCounter = 1;
                }
            } else {
                // Default settings if not found
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 15, // Default tax rate
                    currencySymbol: 'R', // Default currency to Rands
                    businessAddress: '',
                    businessPhone: '',
                    businessEmail: '',
                    businessRegNo: '',
                    taxNumber: '',
                    technicianName: '', // This will remain empty string as technician field is removed from sale object
                    bankName: '',
                    accountHolder: '',
                    accountNumber: '',
                    branchCode: '',
                    businessLogo: '',
                    invoiceCounter: 1, // Initialize invoice counter
                    quotationCounter: 1 // Initialize quotation counter
                };
            }
            // Save settings back to ensure counters are persisted if they were just initialized
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));


            transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

            // If no products exist, initialize some dummy data for demonstration
            if (products.length === 0) {
                products = [
                    { id: 'prod1', name: 'Laptop Pro', price: 15000.00, stock: 10, image: 'https://placehold.co/100x100/cccccc/000000?text=Laptop' },
                    { id: 'prod2', name: 'Wireless Mouse', price: 250.00, stock: 50, image: 'https://placehold.co/100x100/cccccc/000000?text=Mouse' },
                    { id: 'prod3', name: 'Mechanical Keyboard', price: 1200.00, stock: 20, image: 'https://placehold.co/100x100/cccccc/000000?text=Keyboard' },
                    { id: 'prod4', name: 'USB-C Hub', price: 400.00, stock: 35, image: 'https://placehold.co/100x100/cccccc/000000?text=Hub' },
                    { id: 'prod5', name: 'External SSD 1TB', price: 1800.00, stock: 15, image: 'https://placehold.co/100x100/cccccc/000000?text=SSD' }
                ];
                localStorage.setItem('posProducts', JSON.stringify(products));
            }

        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load application data. Some features may not work correctly.");
        }
    }

    /**
     * renderProducts - Displays products in the product grid, filtered by search input.
     */
    function renderProducts() {
        productGrid.innerHTML = '';
        const searchTerm = productSearchInput.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.id.toLowerCase().includes(searchTerm)
        );

        if (filteredProducts.length === 0) {
            // Display message if no products are found after filtering or initially
            const noProductsMessage = document.getElementById('no-products-available');
            if (noProductsMessage) {
                noProductsMessage.classList.remove('hidden');
                noProductsMessage.textContent = searchTerm ? `No products found matching "${searchTerm}".` : 'No products configured. Go to Settings to add some.';
            } else {
                 // Fallback if no-products-available element is not found
                productGrid.innerHTML = `<p class="text-gray-600 text-center col-span-full">No products found.</p>`;
            }
        } else {
            // Hide the 'no products' message if products are found
            const noProductsMessage = document.getElementById('no-products-available');
            if (noProductsMessage) {
                noProductsMessage.classList.add('hidden');
            }

            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col items-center text-center';
                productCard.dataset.productId = product.id; // Store product ID for easy access

                // Placeholder image if image is not a valid base64 or URL
                const imageUrl = product.image && product.image.startsWith('data:image') ? product.image : 'https://placehold.co/100x100/cccccc/000000?text=Product';

                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.name}" class="w-24 h-24 object-contain rounded-md mb-2 border border-gray-100">
                    <h3 class="font-semibold text-gray-800 text-lg mb-1">${product.name}</h3>
                    <p class="text-gray-700 text-base mb-1">${businessSettings.currencySymbol}${product.price.toFixed(2)}</p>
                    <p class="text-sm ${product.stock <= 5 ? 'text-red-500 font-medium' : 'text-gray-500'}">Stock: ${product.stock}</p>
                `;
                productCard.addEventListener('click', () => addProductToSale(product.id));
                productGrid.appendChild(productCard);
            });
        }
    }

    /**
     * addProductToSale - Adds a product to the current sale.
     * @param {string} productId - The ID of the product to add.
     */
    function addProductToSale(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) {
            showMessageBox('Product not found.');
            return;
        }

        if (product.stock <= 0) {
            showMessageBox(`"${product.name}" is out of stock.`);
            return;
        }

        const existingItem = currentSale.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            currentSale.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
        product.stock--; // Decrement stock for the available product
        localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock
        renderSaleItems();
        renderProducts(); // Re-render products to show updated stock
    }

    /**
     * updateSaleItemQuantity - Updates the quantity of an item in the current sale.
     * @param {string} productId - The ID of the product in the sale.
     * @param {number} change - The amount to change the quantity by (+1 or -1).
     */
    function updateSaleItemQuantity(productId, change) {
        const saleItem = currentSale.find(item => item.id === productId);
        const productInInventory = products.find(p => p.id === productId);

        if (!saleItem || !productInInventory) {
            console.error('Sale item or product not found.');
            return;
        }

        if (change > 0) { // Increase quantity
            if (productInInventory.stock <= 0) {
                showMessageBox(`Cannot add more "${saleItem.name}". Out of stock.`);
                return;
            }
            saleItem.quantity++;
            productInInventory.stock--;
        } else if (change < 0) { // Decrease quantity
            if (saleItem.quantity > 1) {
                saleItem.quantity--;
                productInInventory.stock++;
            } else {
                // If quantity becomes 0, remove item from sale
                removeSaleItem(productId);
                productInInventory.stock++; // Restore stock for the last item removed (since it's being fully removed from cart)
                return; // Exit as renderSaleItems will be called by removeSaleItem
            }
        }
        localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock
        renderSaleItems();
        renderProducts(); // Re-render products to show updated stock
    }

    /**
     * removeSaleItem - Removes an item completely from the current sale.
     * @param {string} productId - The ID of the product to remove.
     */
    async function removeSaleItem(productId) {
        const confirmed = await showMessageBox("Are you sure you want to remove this item from the current sale?", true);
        if (confirmed) {
            const index = currentSale.findIndex(item => item.id === productId);
            if (index > -1) {
                const itemRemoved = currentSale.splice(index, 1)[0];
                // Restore stock for the removed item
                const productInInventory = products.find(p => p.id === itemRemoved.id);
                if (productInInventory) {
                    productInInventory.stock += itemRemoved.quantity;
                    localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock
                    renderProducts(); // Re-render products to show updated stock
                }
                renderSaleItems();
                showMessageBox("Item removed from sale.");
            }
        }
    }

    /**
     * renderSaleItems - Displays items currently in the cart and updates totals.
     */
    function renderSaleItems() {
        currentSaleItemsContainer.innerHTML = '';
        if (currentSale.length === 0) {
            emptySaleMessage.classList.remove('hidden');
            completeSaleButton.disabled = true;
            clearSaleButton.disabled = true;
        } else {
            emptySaleMessage.classList.add('hidden');
            completeSaleButton.disabled = false;
            clearSaleButton.disabled = false;

            currentSale.forEach(item => {
                const saleItemDiv = document.createElement('div');
                saleItemDiv.className = 'flex items-center justify-between bg-white rounded-md p-3 mb-2 shadow-sm';
                const itemTotal = item.price * item.quantity;

                saleItemDiv.innerHTML = `
                    <div class="flex-grow">
                        <h3 class="font-medium text-gray-800">${item.name}</h3>
                        <p class="text-sm text-gray-600">${businessSettings.currencySymbol}${item.price.toFixed(2)} x ${item.quantity}</p>
                    </div>
                    <div class="flex items-center">
                        <button data-id="${item.id}" data-change="-1" class="qty-change-btn bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-l-md transition duration-300">-</button>
                        <span class="px-3 font-semibold">${item.quantity}</span>
                        <button data-id="${item.id}" data-change="+1" class="qty-change-btn bg-gray-200 hover:bg-gray-300 text-gray-800 p-1 rounded-r-md transition duration-300">+</button>
                        <span class="font-bold text-gray-900 ml-4 mr-3">${businessSettings.currencySymbol}${itemTotal.toFixed(2)}</span>
                        <button data-id="${item.id}" class="remove-sale-item-btn bg-red-400 hover:bg-red-500 text-white p-2 rounded-full text-sm leading-none flex items-center justify-center transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                currentSaleItemsContainer.appendChild(saleItemDiv);
            });

            // Add event listeners for quantity change buttons
            document.querySelectorAll('.qty-change-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id;
                    const change = parseInt(event.currentTarget.dataset.change);
                    updateSaleItemQuantity(productId, change);
                });
            });

            // Add event listeners for remove item buttons
            document.querySelectorAll('.remove-sale-item-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id;
                    removeSaleItem(productId);
                });
            });
        }
        calculateTotals();
    }

    /**
     * calculateTotals - Calculates and displays the subtotal, tax, and total for the current sale.
     */
    function calculateTotals() {
        const taxRate = businessSettings.taxRate / 100 || 0;
        taxRateDisplay.textContent = businessSettings.taxRate || 0;

        let subtotal = currentSale.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let tax = subtotal * taxRate;
        let total = subtotal + tax;

        subtotalSpan.textContent = `${businessSettings.currencySymbol}${subtotal.toFixed(2)}`;
        taxSpan.textContent = `${businessSettings.currencySymbol}${tax.toFixed(2)}`;
        totalSpan.textContent = `${businessSettings.currencySymbol}${total.toFixed(2)}`;
    }

    /**
     * completeSale - Processes the current sale, records it, and clears the cart.
     */
    async function completeSale() {
        if (currentSale.length === 0) {
            showMessageBox("Current sale is empty. Please add items.");
            return;
        }

        const confirmed = await showMessageBox("Confirm sale completion?", true);
        if (confirmed) {
            const sale = {
                id: `SALE-${Date.now()}`,
                date: new Date().toISOString(),
                items: JSON.parse(JSON.stringify(currentSale)), // Deep copy items
                subtotal: parseFloat(subtotalSpan.textContent.replace(businessSettings.currencySymbol, '')),
                tax: parseFloat(taxSpan.textContent.replace(businessSettings.currencySymbol, '')),
                total: parseFloat(totalSpan.textContent.replace(businessSettings.currencySymbol, '')),
                currency: businessSettings.currencySymbol,
                // Removed technician field as requested
                // technician: businessSettings.technicianName || 'N/A'
            };

            transactions.push(sale);
            localStorage.setItem('posTransactions', JSON.stringify(transactions));
            currentSale = []; // Clear the cart
            renderSaleItems();
            showMessageBox(`Sale ${sale.id} completed! Total: ${businessSettings.currencySymbol}${sale.total.toFixed(2)}`);
        }
    }

    /**
     * clearSale - Clears all items from the current sale and restores product stock.
     */
    async function clearSale() {
        if (currentSale.length === 0) {
            showMessageBox("Current sale is already empty.");
            return;
        }
        const confirmed = await showMessageBox("Are you sure you want to clear the current sale? This will restore stock.", true);
        if (confirmed) {
            currentSale.forEach(saleItem => {
                const product = products.find(p => p.id === saleItem.id);
                if (product) {
                    product.stock += saleItem.quantity; // Restore stock
                }
            });
            localStorage.setItem('posProducts', JSON.stringify(products)); // Save updated stock
            currentSale = [];
            renderSaleItems();
            renderProducts(); // Re-render product list to show restored stock
            showMessageBox("Current sale cleared and stock restored.");
        }
    }

    // --- Event Listeners ---
    productSearchInput.addEventListener('input', renderProducts);
    completeSaleButton.addEventListener('click', completeSale);
    clearSaleButton.addEventListener('click', clearSale);

    // Initial render
    loadData();
    renderProducts();
    renderSaleItems(); // Initialize sale area

    // Initialize the message box styles (important for all pages using it)
    messageBox.style.opacity = '0';
    messageBox.style.pointerEvents = 'none';
    messageBox.style.visibility = 'hidden';
    messageBox.classList.add('hidden'); // Ensure it starts hidden
})();
