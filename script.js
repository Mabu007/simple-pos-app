// main.js - Core logic for the POS system

(function() {
    // --- DOM Element References ---
    // Products Section
    const productSearchInput = document.getElementById('product-search');
    const productGrid = document.getElementById('product-grid');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfoSpan = document.getElementById('page-info');
    const noProductsAvailableMessage = document.getElementById('no-products-available');

    // Current Sale Section
    const currentSaleItemsContainer = document.getElementById('cart-items-container');
    const emptySaleMessage = document.getElementById('empty-cart-message');
    const subtotalSpan = document.getElementById('subtotal');
    const taxSpan = document.getElementById('tax');
    const taxRateDisplay = document.getElementById('tax-rate-display');
    const totalSpan = document.getElementById('total');
    const completeSaleButton = document.getElementById('complete-sale-btn');
    const clearSaleButton = document.getElementById('clear-sale-btn');

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

    // --- Pagination Variables ---
    const productsPerPage = 4; // Number of products to display per page
    let currentPage = 1;
    let filteredProducts = []; // To store products after search filtering

    // --- Helper Functions ---

    /**
     * showMessageBox - Displays a custom modal message box instead of native alert/confirm.
     * @param {string} message - The text message to display.
     * @param {boolean} [isConfirm=false] - If true, adds a "Cancel" button and returns a Promise.
     * @returns {Promise<boolean>|void}
     */
    function showMessageBox(message, isConfirm = false) {
        messageText.textContent = message;
        messageText.classList.add('whitespace-pre-wrap');
        messageCancelButton.classList.add('hidden');
        messageOkButton.textContent = 'OK';

        messageBox.classList.remove('hidden');
        messageBox.style.opacity = '1';
        messageBox.style.pointerEvents = 'auto';
        messageBox.style.visibility = 'visible';

        return new Promise((resolve) => {
            const okHandler = () => {
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                messageBox.classList.add('hidden');
                messageText.classList.remove('whitespace-pre-wrap');
                messageOkButton.removeEventListener('click', okHandler);
                messageCancelButton.removeEventListener('click', cancelHandler);
                resolve(true);
            };
            const cancelHandler = () => {
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                messageBox.classList.add('hidden');
                messageText.classList.remove('whitespace-pre-wrap');
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
                // Ensure invoiceCounter, quotationCounter, and saleCounter exist
                if (typeof businessSettings.invoiceCounter === 'undefined') {
                    businessSettings.invoiceCounter = 1;
                }
                if (typeof businessSettings.quotationCounter === 'undefined') {
                    businessSettings.quotationCounter = 1;
                }
                if (typeof businessSettings.saleCounter === 'undefined') { // Initialize saleCounter
                    businessSettings.saleCounter = 1;
                }
            } else {
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 15,
                    currencySymbol: 'R',
                    businessAddress: '123 Main Street, Anytown, 12345', // Illustrative default
                    businessPhone: '+1 (555) 123-4567',   // Illustrative default
                    businessEmail: 'info@mysmallbusiness.com',   // Illustrative default
                    businessRegNo: 'REG12345', // Illustrative default
                    taxNumber: 'TAX98765',   // Illustrative default
                    bankName: 'Sample Bank',
                    accountHolder: 'My Business Inc.',
                    accountNumber: '123456789',
                    branchCode: '987654',
                    businessLogo: '',
                    invoiceCounter: 1,
                    quotationCounter: 1,
                    saleCounter: 1 // Initialize sale counter here as well
                };
            }
            // Always save settings back to ensure any newly initialized properties are persisted
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));


            transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

            if (products.length === 0) {
                // Initial dummy data, removed image property
                products = [
                    { id: 'prod1', name: 'Laptop Pro', price: 15000.00, stock: 10 },
                    { id: 'prod2', name: 'Wireless Mouse', price: 250.00, stock: 50 },
                    { id: 'prod3', name: 'Mechanical Keyboard', price: 1200.00, stock: 20 },
                    { id: 'prod4', name: 'USB-C Hub', price: 400.00, stock: 35 },
                    { id: 'prod5', name: 'External SSD 1TB', price: 1800.00, stock: 15 },
                    { id: 'prod6', name: 'Gaming Monitor', price: 7500.00, stock: 8 },
                    { id: 'prod7', name: 'Webcam 1080p', price: 600.00, stock: 25 },
                    { id: 'prod8', name: 'Noise Cancelling Headphones', price: 2000.00, stock: 12 },
                    { id: 'prod9', name: 'Portable Speaker', price: 900.00, stock: 30 },
                    { id: 'prod10', name: 'Smartwatch', price: 3000.00, stock: 7 },
                    { id: 'prod11', name: 'Smartphone', price: 10000.00, stock: 5 },
                    { id: 'prod12', name: 'Tablet', price: 6000.00, stock: 10 }
                ];
                localStorage.setItem('posProducts', JSON.stringify(products));
            }

        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load application data. Some features may not work correctly.");
        }
    }

    /**
     * renderProducts - Displays products in a list format with pagination and search filtering.
     */
    function renderProducts() {
        productGrid.innerHTML = ''; // Clear existing products
        const searchTerm = productSearchInput.value.toLowerCase();
        
        filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.id.toLowerCase().includes(searchTerm)
        );

        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

        // Ensure current page is valid after filtering
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        } else if (totalPages === 0) {
            currentPage = 0; // No pages if no products
        } else if (currentPage === 0 && totalPages > 0) {
            currentPage = 1; // If somehow on page 0 but there are products, go to page 1
        }
        
        // Hide/show "No products available" message
        if (filteredProducts.length === 0) {
            noProductsAvailableMessage.classList.remove('hidden');
            noProductsAvailableMessage.textContent = searchTerm ? `No products found matching "${searchTerm}".` : 'No products configured. Go to Settings to add some.';
            pageInfoSpan.textContent = 'Page 0 of 0';
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
        } else {
            noProductsAvailableMessage.classList.add('hidden');
            
            const startIndex = (currentPage - 1) * productsPerPage;
            const endIndex = startIndex + productsPerPage;
            const productsToDisplay = filteredProducts.slice(startIndex, endIndex);

            productsToDisplay.forEach(product => {
                const productCard = document.createElement('div');
                // Updated class for smaller, minimal list item styling
                productCard.className = 'bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center text-sm';
                productCard.dataset.productId = product.id; // Store product ID

                productCard.innerHTML = `
                    <div class="flex-grow text-left">
                        <h3 class="font-medium text-gray-800">${product.name}</h3>
                        <p class="text-gray-600">${businessSettings.currencySymbol}${product.price.toFixed(2)}</p>
                    </div>
                    <p class="font-semibold ${product.stock <= 5 && product.stock > 0 ? 'text-orange-500' : product.stock === 0 ? 'text-red-500' : 'text-gray-700'}">Stock: ${product.stock}</p>
                `;
                productCard.addEventListener('click', () => addProductToSale(product.id));
                productGrid.appendChild(productCard);
            });

            // Update pagination info and button states
            pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
        }
    }

    /**
     * nextPage - Moves to the next page of products.
     */
    function nextPage() {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
        }
    }

    /**
     * prevPage - Moves to the previous page of products.
     */
    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
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
        product.stock--;
        localStorage.setItem('posProducts', JSON.stringify(products));
        renderSaleItems();
        renderProducts();
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

        if (change > 0) {
            if (productInInventory.stock <= 0) {
                showMessageBox(`Cannot add more "${saleItem.name}". Out of stock.`);
                return;
            }
            saleItem.quantity++;
            productInInventory.stock--;
        } else if (change < 0) {
            if (saleItem.quantity > 1) {
                saleItem.quantity--;
                productInInventory.stock++;
            } else {
                removeSaleItem(productId);
                productInInventory.stock++;
                return;
            }
        }
        localStorage.setItem('posProducts', JSON.stringify(products));
        renderSaleItems();
        renderProducts();
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
                const productInInventory = products.find(p => p.id === itemRemoved.id);
                if (productInInventory) {
                    productInInventory.stock += itemRemoved.quantity;
                    localStorage.setItem('posProducts', JSON.stringify(products));
                    renderProducts();
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

            document.querySelectorAll('.qty-change-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const productId = event.currentTarget.dataset.id;
                    const change = parseInt(event.currentTarget.dataset.change);
                    updateSaleItemQuantity(productId, change);
                });
            });

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
            // Generate sequential sale ID
            const saleId = `SALE-${String(businessSettings.saleCounter).padStart(5, '0')}`;
            businessSettings.saleCounter++; // Increment for next sale
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings)); // Save updated counter

            const sale = {
                id: saleId,
                date: new Date().toISOString(),
                timestamp: Date.now(),
                items: JSON.parse(JSON.stringify(currentSale)),
                subtotal: parseFloat(subtotalSpan.textContent.replace(businessSettings.currencySymbol, '')),
                tax: parseFloat(taxSpan.textContent.replace(businessSettings.currencySymbol, '')),
                total: parseFloat(totalSpan.textContent.replace(businessSettings.currencySymbol, '')),
                currency: businessSettings.currencySymbol,
            };

            transactions.push(sale);
            localStorage.setItem('posTransactions', JSON.stringify(transactions));
            currentSale = [];
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
                    product.stock += saleItem.quantity;
                }
            });
            localStorage.setItem('posProducts', JSON.stringify(products));
            currentSale = [];
            renderSaleItems();
            renderProducts();
            showMessageBox("Current sale cleared and stock restored.");
        }
    }

    // --- Event Listeners ---
    productSearchInput.addEventListener('input', () => {
        currentPage = 1;
        renderProducts();
    });
    completeSaleButton.addEventListener('click', completeSale);
    clearSaleButton.addEventListener('click', clearSale);
    prevPageBtn.addEventListener('click', prevPage);
    nextPageBtn.addEventListener('click', nextPage);


    // Initial render
    loadData();
    renderProducts();
    renderSaleItems();

    // Initialize the message box styles (important for all pages using it)
    messageBox.style.opacity = '0';
    messageBox.style.pointerEvents = 'none';
    messageBox.style.visibility = 'hidden';
    messageBox.classList.add('hidden');
})();
