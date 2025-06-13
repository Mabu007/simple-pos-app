// script.js - Main POS application logic

// Use an immediately invoked function expression (IIFE) to encapsulate all JavaScript
// code, preventing global scope pollution and ensuring it runs only after the DOM is ready.
(function() {
    // --- DOM Element References ---
    // Get references to key HTML elements that will be manipulated by JavaScript.
    const productsContainer = document.getElementById('products-container');
    const cartContainer = document.getElementById('cart-container');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const subtotalSpan = document.getElementById('subtotal');
    const taxSpan = document.getElementById('tax');
    const taxRateDisplay = document.getElementById('tax-rate-display');
    const totalSpan = document.getElementById('total');
    const processPaymentButton = document.getElementById('process-payment');
    const clearAllButton = document.getElementById('clear-all');
    const headerBusinessLogo = document.getElementById('header-business-logo'); // New

    // Message box elements for custom alerts/confirmations
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage and Initialization ---
    // Initialize products and cart from localStorage. If not found, use defaults.
    let products = []; // Will be loaded from localStorage
    let cart = [];     // Will be loaded from localStorage
    let businessSettings = {}; // Will be loaded from localStorage
    let transactions = []; // New: To store processed sales

    // --- Helper Functions ---

    /**
     * showMessageBox - Displays a custom modal message box instead of native alert/confirm.
     * This provides a better user experience within an embedded web view (like Capacitor).
     * @param {string} message - The text message to display in the box.
     * @param {boolean} [isConfirm=false] - If true, adds a "Cancel" button and returns a Promise.
     * @returns {Promise<boolean>|void} If isConfirm is true, resolves with `true` (OK) or `false` (Cancel).
     * Otherwise, returns void.
     */
    function showMessageBox(message, isConfirm = false) {
        console.log("Showing message box:", message); // Debug log
        messageText.textContent = message; // Set the message text
        messageCancelButton.classList.add('hidden'); // Hide cancel button by default
        messageOkButton.textContent = 'OK'; // Default OK button text

        // Show the message box using opacity and visibility
        messageBox.style.opacity = '1';
        messageBox.style.pointerEvents = 'auto';
        messageBox.style.visibility = 'visible';


        if (isConfirm) {
            messageCancelButton.classList.remove('hidden'); // Show cancel button for confirmation
            return new Promise((resolve) => {
                // Define event handlers for OK and Cancel buttons
                const okHandler = () => {
                    console.log("Message box OK clicked."); // Debug log
                    // Hide the message box
                    messageBox.style.opacity = '0';
                    messageBox.style.pointerEvents = 'none';
                    messageBox.style.visibility = 'hidden';
                    // Clean up event listeners to prevent memory leaks
                    messageOkButton.removeEventListener('click', okHandler);
                    messageCancelButton.removeEventListener('click', cancelHandler);
                    resolve(true); // Resolve the promise with true (OK clicked)
                };
                const cancelHandler = () => {
                    console.log("Message box Cancel clicked."); // Debug log
                    // Hide the message box
                    messageBox.style.opacity = '0';
                    messageBox.style.pointerEvents = 'none';
                    messageBox.style.visibility = 'hidden';
                    // Clean up event listeners
                    messageOkButton.removeEventListener('click', okHandler);
                    messageCancelButton.removeEventListener('click', cancelHandler);
                    resolve(false); // Resolve the promise with false (Cancel clicked)
                };
                // Add event listeners
                messageOkButton.addEventListener('click', okHandler);
                messageCancelButton.addEventListener('click', cancelHandler);
            });
        } else {
            // For simple alerts, only OK button is needed
            const okHandler = () => {
                console.log("Message box OK clicked (alert)."); // Debug log
                // Hide the message box
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                messageOkButton.removeEventListener('click', okHandler); // Clean up listener
            };
            messageOkButton.addEventListener('click', okHandler);
        }
    }

    /**
     * saveData - Stores the current state of the cart, product inventory, settings,
     * and transactions in the browser's localStorage. This allows the app to retain data
     * even after closing the browser or going offline.
     */
    function saveData() {
        try {
            console.log("Saving data to localStorage..."); // Debug log
            // Convert JavaScript objects to JSON strings before saving
            localStorage.setItem('posCart', JSON.stringify(cart));
            localStorage.setItem('posProducts', JSON.stringify(products));
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));
            localStorage.setItem('posTransactions', JSON.stringify(transactions));
            console.log("Data saved successfully."); // Debug log
        } catch (e) {
            console.error("Error saving data to localStorage:", e);
            showMessageBox("Could not save data. Please check your browser storage settings.");
        }
    }

    /**
     * loadData - Retrieves previously saved data (cart, products, settings, transactions)
     * from localStorage. If no data is found, it initializes with default values.
     */
    function loadData() {
        try {
            console.log("Loading data from localStorage..."); // Debug log
            const savedCart = localStorage.getItem('posCart');
            const savedProducts = localStorage.getItem('posProducts');
            const savedSettings = localStorage.getItem('posBusinessSettings');
            const savedTransactions = localStorage.getItem('posTransactions');

            if (savedCart) cart = JSON.parse(savedCart);
            if (savedProducts) products = JSON.parse(savedProducts);
            if (savedSettings) businessSettings = JSON.parse(savedSettings);
            if (savedTransactions) transactions = JSON.parse(savedTransactions);

            // Default products if none saved
            if (!products || products.length === 0) {
                console.log("No products found, initializing defaults."); // Debug log
                // Using placeholder images that can be replaced by uploaded ones
                products = [
                    { id: 'prod-1', name: 'Laptop Pro', price: 1200.00, stock: 10, image: 'https://placehold.co/150x150/e0f2fe/000000?text=Laptop' },
                    { id: 'prod-2', name: 'Wireless Mouse', price: 25.50, stock: 50, image: 'https://placehold.co/150x150/ffe0b2/000000?text=Mouse' },
                    { id: 'prod-3', name: 'Mechanical Keyboard', price: 90.00, stock: 20, image: 'https://placehold.co/150x150/c8e6c9/000000?text=Keyboard' },
                    { id: 'prod-4', name: 'USB-C Hub', price: 35.00, stock: 30, image: 'https://placehold.co/150x150/b3e5fc/000000?text=USB+Hub' },
                    { id: 'prod-5', name: 'Monitor 27"', price: 300.00, stock: 8, image: 'https://placehold.co/150x150/f8bbd0/000000?text=Monitor' },
                    { id: 'prod-6', name: 'External SSD 1TB', price: 150.00, stock: 15, image: 'https://placehold.co/150x150/d1c4e9/000000?text=SSD' },
                    { id: 'prod-7', name: 'Webcam HD', price: 45.00, stock: 25, image: 'https://placehold.co/150x150/f0f4c3/000000?text=Webcam' },
                    { id: 'prod-8', name: 'Gaming Headset', price: 70.00, stock: 12, image: 'https://placehold.co/150x150/cfd8dc/000000?text=Headset' }
                ];
            }

            // Default settings if none saved
            if (!businessSettings || Object.keys(businessSettings).length === 0) {
                console.log("No business settings found, initializing defaults."); // Debug log
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 10, // Default 10%
                    currencySymbol: '$',
                    businessAddress: '',
                    businessPhone: '',
                    businessEmail: '',
                    businessRegNo: '',
                    taxNumber: '',
                    cashierName: 'Cashier',
                    businessLogo: '' // Default empty logo
                };
            }
            // Display business logo if available
            headerBusinessLogo.src = businessSettings.businessLogo || 'https://placehold.co/100x50/e0f2fe/000000?text=No+Logo';
            saveData(); // Save loaded/default data to ensure consistency
            console.log("Data loaded successfully."); // Debug log
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load saved data. Starting fresh with default settings.");
            // Reset to default products and clear cart if loading fails
            products = [
                { id: 'prod-1', name: 'Laptop Pro', price: 1200.00, stock: 10, image: 'https://placehold.co/150x150/e0f2fe/000000?text=Laptop' },
                { id: 'prod-2', name: 'Wireless Mouse', price: 25.50, stock: 50, image: 'https://placehold.co/150x150/ffe0b2/000000?text=Mouse' },
                { id: 'prod-3', name: 'Mechanical Keyboard', price: 90.00, stock: 20, image: 'https://placehold.co/150x150/c8e6c9/000000?text=Keyboard' },
                { id: 'prod-4', name: 'USB-C Hub', price: 35.00, stock: 30, image: 'https://placehold.co/150x150/b3e5fc/000000?text=USB+Hub' },
                { id: 'prod-5', name: 'Monitor 27"', price: 300.00, stock: 8, image: 'https://placehold.co/150x150/f8bbd0/000000?text=Monitor' },
                { id: 'prod-6', name: 'External SSD 1TB', price: 150.00, stock: 15, image: 'https://placehold.co/150x150/d1c4e9/000000?text=SSD' },
                { id: 'prod-7', name: 'Webcam HD', price: 45.00, stock: 25, image: 'https://placehold.co/150x150/f0f4c3/000000?text=Webcam' },
                { id: 'prod-8', name: 'Gaming Headset', price: 70.00, stock: 12, image: 'https://placehold.co/150x150/cfd8dc/000000?text=Headset' }
            ];
            cart = []; // Clear the cart on load error
            businessSettings = {
                businessName: 'My Small Business POS',
                taxRate: 10,
                currencySymbol: '$',
                businessAddress: '',
                businessPhone: '',
                businessEmail: '',
                businessRegNo: '',
                taxNumber: '',
                cashierName: 'Cashier',
                businessLogo: ''
            };
            transactions = [];
        }
    }

    /**
     * renderProducts - Generates and displays the product cards in the products container.
     * It updates the UI based on the current `products` array, including stock levels.
     */
    function renderProducts() {
        console.log("Rendering products..."); // Debug log
        productsContainer.innerHTML = ''; // Clear previous product cards
        // Display a message if no products are available
        if (!products || products.length === 0) {
            productsContainer.innerHTML = '<p class="text-gray-500 italic text-center col-span-full">No products available. Add some in settings!</p>';
            return;
        }

        // Iterate through the products array and create a card for each product
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-between transition duration-300 hover:shadow-lg hover:scale-105';
            // Determine image source: use Base64 if available, otherwise a placeholder URL
            const imageUrl = product.image && product.image.startsWith('data:image') ? product.image : 'https://placehold.co/150x150/cccccc/000000?text=No+Img';

            productCard.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" class="w-24 h-24 object-contain rounded-md mb-3 border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-800 text-center mb-1">${product.name}</h3>
                <p class="text-blue-600 font-bold mb-2">${businessSettings.currencySymbol}${product.price.toFixed(2)}</p>
                <p class="text-sm text-gray-600 mb-3">
                    Stock: <span class="${product.stock <= 5 && product.stock > 0 ? 'text-orange-500 font-semibold' : product.stock === 0 ? 'text-red-600 font-semibold' : ''}">
                        ${product.stock}
                    </span>
                </p>
                <button data-product-id="${product.id}"
                        class="add-to-cart-btn w-full py-2 px-3 rounded-md font-medium text-white
                        ${product.stock > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}"
                        ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
            `;
            productsContainer.appendChild(productCard);
        });

        // Attach event listeners to all "Add to Cart" buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                addProductToCart(productId);
            });
        });
        console.log("Products rendered."); // Debug log
    }

    /**
     * renderCart - Generates and displays the items currently in the cart.
     * It updates the UI, shows an "empty cart" message if applicable,
     * and enables/disables payment buttons based on cart content.
     */
    function renderCart() {
        console.log("Rendering cart..."); // Debug log
        cartContainer.innerHTML = ''; // Clear existing cart items
        if (cart.length === 0) {
            emptyCartMessage.classList.remove('hidden'); // Show empty cart message
            processPaymentButton.disabled = true; // Disable payment button
            clearAllButton.disabled = true; // Disable clear all button
            console.log("Cart is empty. Payment and Clear buttons disabled."); // Debug log
        } else {
            emptyCartMessage.classList.add('hidden'); // Hide empty cart message
            processPaymentButton.disabled = false; // Enable payment button
            clearAllButton.disabled = false; // Enable clear all button
            console.log("Cart has items. Payment and Clear buttons enabled."); // Debug log

            // Iterate through cart items and create a display element for each
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.className = 'flex items-center justify-between bg-white rounded-md p-3 mb-2 shadow-sm';
                 // Determine image source for cart items
                const imageUrl = item.image && item.image.startsWith('data:image') ? item.image : 'https://placehold.co/150x150/cccccc/000000?text=No+Img';
                cartItemDiv.innerHTML = `
                    <div class="flex items-center flex-grow">
                        <img src="${imageUrl}" alt="${item.name}" class="w-12 h-12 object-contain rounded-md mr-3 border border-gray-100">
                        <div>
                            <h3 class="font-medium text-gray-800">${item.name}</h3>
                            <p class="text-sm text-gray-600">Qty: ${item.quantity} x ${businessSettings.currencySymbol}${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold text-gray-900 mr-3">${businessSettings.currencySymbol}${(item.price * item.quantity).toFixed(2)}</span>
                        <button data-item-id="${item.id}"
                                class="remove-from-cart-btn bg-red-400 hover:bg-red-500 text-white p-2 rounded-full text-sm leading-none flex items-center justify-center transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                cartContainer.appendChild(cartItemDiv);
            });

            // Attach event listeners to all "Remove from Cart" buttons
            document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    // Find the closest button element to get its data-item-id
                    const itemId = event.target.closest('button').dataset.itemId;
                    removeProductFromCart(itemId);
                });
            });
        }
        calculateTotals(); // Recalculate and display totals
        saveData(); // Save changes to cart after rendering
        console.log("Cart rendered."); // Debug log
    }

    /**
     * calculateTotals - Computes the subtotal, tax, and total based on the current cart content,
     * then updates the corresponding display elements in the UI.
     */
    function calculateTotals() {
        console.log("Calculating totals..."); // Debug log
        const taxRate = businessSettings.taxRate / 100; // Convert percentage to decimal
        taxRateDisplay.textContent = businessSettings.taxRate; // Update displayed tax rate

        // Calculate subtotal by summing price * quantity for all items in the cart
        let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let tax = subtotal * taxRate;    // Calculate tax
        let total = subtotal + tax;      // Calculate total

        // Update the text content of the summary spans, formatted to 2 decimal places
        subtotalSpan.textContent = `${businessSettings.currencySymbol}${subtotal.toFixed(2)}`;
        taxSpan.textContent = `${businessSettings.currencySymbol}${tax.toFixed(2)}`;
        totalSpan.textContent = `${businessSettings.currencySymbol}${total.toFixed(2)}`;
        console.log(`Totals: Subtotal=${subtotal.toFixed(2)}, Tax=${tax.toFixed(2)}, Total=${total.toFixed(2)}`); // Debug log
    }

    /**
     * addProductToCart - Adds a product to the cart or increments its quantity if already present.
     * Also decrements the stock of the product in the main inventory.
     * @param {string} productId - The unique ID of the product to add.
     */
    function addProductToCart(productId) {
        console.log(`Adding product ${productId} to cart.`); // Debug log
        // Find the product in the main products array
        const product = products.find(p => p.id === productId);

        // Handle cases where product is not found or out of stock
        if (!product) {
            showMessageBox("Product not found.");
            console.warn(`Product with ID ${productId} not found.`); // Debug log
            return;
        }
        if (product.stock <= 0) {
            showMessageBox(`"${product.name}" is out of stock!`);
            console.warn(`Product "${product.name}" is out of stock.`); // Debug log
            return;
        }

        // Check if the product is already in the cart
        const cartItem = cart.find(item => item.id === productId);

        if (cartItem) {
            cartItem.quantity++; // Increment quantity if already in cart
            console.log(`Incremented quantity for ${product.name}. New quantity: ${cartItem.quantity}`); // Debug log
        } else {
            // Add new item to cart with quantity 1
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image, // Product image is now a Base64 string
                quantity: 1
            });
            console.log(`Added new product "${product.name}" to cart.`); // Debug log
        }
        product.stock--; // Decrement stock from the main products array
        console.log(`Decremented stock for ${product.name}. New stock: ${product.stock}`); // Debug log
        renderProducts(); // Re-render product list to reflect updated stock
        renderCart();     // Re-render cart to show the new item or quantity
    }

    /**
     * removeProductFromCart - Removes a product from the cart or decrements its quantity.
     * Also increments the stock of the product in the main inventory.
     * @param {string} itemId - The unique ID of the item to remove from the cart.
     */
    function removeProductFromCart(itemId) {
        console.log(`Removing product ${itemId} from cart.`); // Debug log
        // Find the index of the item in the cart array
        const cartItemIndex = cart.findIndex(item => item.id === itemId);

        if (cartItemIndex > -1) {
            const cartItem = cart[cartItemIndex];
            // Find the corresponding product in the main products array
            const product = products.find(p => p.id === itemId);

            if (product) {
                product.stock++; // Increment stock when removing from cart
                console.log(`Incremented stock for ${product.name}. New stock: ${product.stock}`); // Debug log
            }

            if (cartItem.quantity > 1) {
                cartItem.quantity--; // Decrement quantity if more than one
                console.log(`Decremented quantity for ${cartItem.name}. New quantity: ${cartItem.quantity}`); // Debug log
            } else {
                cart.splice(cartItemIndex, 1); // Remove item entirely if quantity is 1
                console.log(`Removed ${cartItem.name} entirely from cart.`); // Debug log
            }
            renderProducts(); // Re-render product list to reflect updated stock
            renderCart();     // Re-render cart to show changes
        } else {
            console.warn(`Attempted to remove item with ID ${itemId} but it was not found in cart.`); // Debug log
        }
    }

    /**
     * generateSalePdf - This function is now removed from here and will be
     * handled by transaction-history.js for both individual and consolidated reports.
     * This placeholder comment clarifies its removal from the main POS script.
     */

    /**
     * processPayment - Simulates a payment transaction.
     * It confirms with the user, clears the cart, and records the sale.
     * No longer generates a PDF immediately after payment.
     */
    async function processPayment() {
        console.log("Process Payment button clicked."); // Debug log
        if (cart.length === 0) {
            showMessageBox("Cart is empty. Please add items before processing payment.");
            console.log("Cart is empty, payment aborted."); // Debug log
            return;
        }

        const confirmed = await showMessageBox("Are you sure you want to process this payment?", true);
        if (confirmed) {
            console.log("Payment confirmed. Processing..."); // Debug log
            // Recalculate totals one last time to ensure accuracy before recording
            const taxRate = businessSettings.taxRate / 100;
            const currentSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const currentTax = currentSubtotal * taxRate;
            const currentTotal = currentSubtotal + currentTax;

            // Create a unique transaction ID
            const transactionId = `TXN-${Date.now()}`;

            // Create a transaction object
            const transaction = {
                id: transactionId,
                timestamp: new Date().toISOString(), // ISO string for easy storage and parsing
                items: JSON.parse(JSON.stringify(cart)), // Deep copy cart items to avoid reference issues
                subtotal: currentSubtotal,
                tax: currentTax,
                total: currentTotal
            };

            transactions.push(transaction); // Add to transaction history
            cart = []; // Clear the cart

            // Save all updated data
            saveData();

            // Re-render UI
            renderCart();
            renderProducts(); // Render products again to show updated stock
            showMessageBox(`Payment processed successfully! Total: ${businessSettings.currencySymbol}${currentTotal.toFixed(2)}. This sale is recorded in Transaction History.`); // Updated message
            console.log("Payment process completed."); // Debug log
        } else {
            console.log("Payment cancelled by user."); // Debug log
        }
    }

    /**
     * clearAllItems - Clears all items from the cart and restores their stock levels
     * in the main products inventory.
     */
    async function clearAllItems() {
        console.log("Clear All Items button clicked."); // Debug log
        if (cart.length === 0) {
            showMessageBox("Cart is already empty.");
            console.log("Cart is already empty, clear aborted."); // Debug log
            return;
        }
        // Ask for user confirmation before clearing the entire cart
        const confirmed = await showMessageBox("Are you sure you want to clear all items from the cart?", true);
        if (confirmed) {
            console.log("Clear All Items confirmed. Clearing..."); // Debug log
            // Before clearing the cart, restore the stock for each item that was in it.
            cart.forEach(cartItem => {
                const product = products.find(p => p.id === cartItem.id);
                if (product) {
                    product.stock += cartItem.quantity; // Add back the quantity that was in the cart
                    console.log(`Restored ${cartItem.quantity} stock for ${product.name}. New stock: ${product.stock}`); // Debug log
                }
            });
            cart = []; // Clear the cart array
            saveData(); // Save the empty cart and updated product stock to localStorage
            renderProducts(); // Update product display to show restored stock
            renderCart();     // Update cart display to be empty
            showMessageBox("Cart cleared.");
            console.log("Cart clear process completed."); // Debug log
        } else {
            console.log("Clear All Items cancelled by user."); // Debug log
        }
    }

    // --- Initialization of the header business logo ---
    function updateHeaderLogo() {
        const savedSettings = localStorage.getItem('posBusinessSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            headerBusinessLogo.src = settings.businessLogo || 'https://placehold.co/100x50/e0f2fe/000000?text=No+Logo';
        } else {
            headerBusinessLogo.src = 'https://placehold.co/100x50/e0f2fe/000000?text=No+Logo';
        }
    }
    // Call on load
    updateHeaderLogo();


    // --- Event Listeners ---
    // Attach event listeners to the main action buttons
    processPaymentButton.addEventListener('click', processPayment);
    clearAllButton.addEventListener('click', clearAllItems);
    console.log("Event listeners attached to Process Payment and Clear All buttons."); // Debug log

    // --- Initialization ---
    // This function runs when the script first loads.
    // It loads any saved data, then renders the UI accordingly.
    console.log("POS initialization started."); // Debug log
    loadData();         // Load cart, product, settings, and transaction data from localStorage
    renderProducts();   // Display products based on loaded/default data
    renderCart();       // Display cart based on loaded/default data (this also calls calculateTotals)
    console.log("POS initialization completed."); // Debug log
})(); // End of IIFE (Immediately Invoked Function Expression)
