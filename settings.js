// settings.js - Logic for the settings page

(function() {
    // --- DOM Element References ---
    // Business Info Elements
    const businessNameInput = document.getElementById('business-name');
    const taxRateInput = document.getElementById('tax-rate');
    const currencySymbolInput = document.getElementById('currency-symbol');
    const businessAddressInput = document.getElementById('business-address');
    const businessPhoneInput = document.getElementById('business-phone');
    const businessEmailInput = document.getElementById('business-email');
    const businessRegNoInput = document.getElementById('business-reg-no');
    const taxNumberInput = document.getElementById('tax-number');
    const cashierNameInput = document.getElementById('cashier-name');
    const businessLogoUpload = document.getElementById('business-logo-upload');
    const businessLogoPreview = document.getElementById('business-logo-preview');

    const saveBusinessInfoButton = document.getElementById('save-business-info');

    // Product Form Elements
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productStockInput = document.getElementById('product-stock');
    const productImageUpload = document.getElementById('product-image-upload');
    const productImagePreview = document.getElementById('product-image-preview');
    let currentBase64Image = ''; // To store the Base64 image data for the current product being added/edited

    const productFormTitle = document.getElementById('product-form-title');
    const addProductButton = document.getElementById('add-product');
    const cancelEditButton = document.getElementById('cancel-edit');
    const productListContainer = document.getElementById('product-list-container');
    const noProductsMessage = document.getElementById('no-products-message');

    // Message box elements (reused from main app)
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage ---
    let businessSettings = {};
    let products = [];

    // --- Helper Functions (reused from main app for consistency) ---

    /**
     * showMessageBox - Displays a custom modal message box instead of native alert/confirm.
     * @param {string} message - The text message to display.
     * @param {boolean} [isConfirm=false] - If true, adds a "Cancel" button and returns a Promise.
     * @returns {Promise<boolean>|void}
     */
    function showMessageBox(message, isConfirm = false) {
        messageText.textContent = message;
        messageCancelButton.classList.add('hidden');
        messageOkButton.textContent = 'OK';

        // Show the message box using opacity and visibility (consistent with main POS)
        // Explicitly remove 'hidden' class to ensure display
        messageBox.classList.remove('hidden');
        messageBox.style.opacity = '1';
        messageBox.style.pointerEvents = 'auto';
        messageBox.style.visibility = 'visible';

        return new Promise((resolve) => {
            const okHandler = () => {
                // Hide the message box
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                // Explicitly add 'hidden' class to ensure complete hiding
                messageBox.classList.add('hidden');
                messageOkButton.removeEventListener('click', okHandler);
                messageCancelButton.removeEventListener('click', cancelHandler);
                resolve(true);
            };
            const cancelHandler = () => {
                // Hide the message box
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                // Explicitly add 'hidden' class to ensure complete hiding
                messageBox.classList.add('hidden');
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
     * saveData - Stores current settings and products to localStorage.
     */
    function saveData() {
        try {
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));
            localStorage.setItem('posProducts', JSON.stringify(products));
        } catch (e) {
            console.error("Error saving data to localStorage:", e);
            showMessageBox("Could not save data. Please check your browser storage settings.");
        }
    }

    /**
     * loadData - Loads settings and products from localStorage.
     */
    function loadData() {
        try {
            const savedSettings = localStorage.getItem('posBusinessSettings');
            const savedProducts = localStorage.getItem('posProducts');

            if (savedSettings) {
                businessSettings = JSON.parse(savedSettings);
                businessNameInput.value = businessSettings.businessName || '';
                taxRateInput.value = businessSettings.taxRate || '';
                currencySymbolInput.value = businessSettings.currencySymbol || '';
                businessAddressInput.value = businessSettings.businessAddress || '';
                businessPhoneInput.value = businessSettings.businessPhone || '';
                businessEmailInput.value = businessSettings.businessEmail || '';
                businessRegNoInput.value = businessSettings.businessRegNo || '';
                taxNumberInput.value = businessSettings.taxNumber || '';
                cashierNameInput.value = businessSettings.cashierName || '';
                // Load and display logo
                businessLogoPreview.src = businessSettings.businessLogo || 'https://placehold.co/100x50/e0f2fe/000000?text=No+Logo';
            } else {
                // Default settings if none exist
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
                    businessLogo: '' // Default empty logo
                };
            }

            if (savedProducts) {
                products = JSON.parse(savedProducts);
            } else {
                // Default products if none exist (using placeholder image URLs)
                products = [
                    { id: 'prod-1', name: 'Laptop Pro', price: 1200.00, stock: 10, image: 'https://placehold.co/150x150/e0f2fe/000000?text=Laptop' },
                    { id: 'prod-2', name: 'Wireless Mouse', price: 25.50, stock: 50, image: 'https://placehold.co/150x150/ffe0b2/000000?text=Mouse' },
                    { id: 'prod-3', name: 'Mechanical Keyboard', price: 90.00, stock: 20, image: 'https://placehold.co/150x150/c8e6c9/000000?text=Keyboard' }
                ];
            }
            saveData(); // Ensure default values are saved if loaded for the first time
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load saved data. Using default settings.");
        }
    }

    /**
     * renderProductList - Displays the current list of products for management.
     */
    function renderProductList() {
        productListContainer.innerHTML = '';
        if (products.length === 0) {
            noProductsMessage.classList.remove('hidden');
        } else {
            noProductsMessage.classList.add('hidden');
            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'flex items-center justify-between bg-white rounded-md p-3 shadow-sm border border-gray-100';
                // Use a placeholder image if product.image is empty or not a valid data URL
                const imageUrl = product.image && product.image.startsWith('data:image') ? product.image : 'https://placehold.co/50x50/cccccc/000000?text=No+Img';
                productItem.innerHTML = `
                    <div class="flex items-center flex-grow">
                        <img src="${imageUrl}" alt="${product.name}" class="w-12 h-12 object-contain rounded-md mr-3 border border-gray-200">
                        <div>
                            <h4 class="font-medium text-gray-800">${product.name}</h4>
                            <p class="text-sm text-gray-600">Price: ${businessSettings.currencySymbol}${product.price.toFixed(2)} | Stock: ${product.stock}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button data-id="${product.id}" class="edit-product-btn bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-full text-sm transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button data-id="${product.id}" class="delete-product-btn bg-red-400 hover:bg-red-500 text-white p-2 rounded-full text-sm transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                productListContainer.appendChild(productItem);
            });

            // Attach event listeners for edit and delete buttons
            document.querySelectorAll('.edit-product-btn').forEach(button => {
                button.addEventListener('click', (event) => editProduct(event.currentTarget.dataset.id));
            });
            document.querySelectorAll('.delete-product-btn').forEach(button => {
                button.addEventListener('click', (event) => deleteProduct(event.currentTarget.dataset.id));
            });
        }
    }

    /**
     * resetProductForm - Clears the product form and sets it to 'Add New Product' mode.
     */
    function resetProductForm() {
        productIdInput.value = '';
        productNameInput.value = '';
        productPriceInput.value = '';
        productStockInput.value = '';
        productImageUpload.value = ''; // Clear file input
        productImagePreview.src = 'https://placehold.co/100x100/cccccc/000000?text=No+Image'; // Reset preview
        currentBase64Image = ''; // Clear stored image data

        productFormTitle.textContent = 'Add New Product';
        addProductButton.textContent = 'Add Product';
        addProductButton.classList.remove('bg-orange-500', 'hover:bg-orange-600');
        addProductButton.classList.add('bg-green-500', 'hover:bg-green-600');
        cancelEditButton.classList.add('hidden');
    }

    /**
     * addOrUpdateProduct - Handles adding a new product or updating an existing one.
     */
    async function addOrUpdateProduct() {
        const id = productIdInput.value;
        const name = productNameInput.value.trim();
        const price = parseFloat(productPriceInput.value);
        const stock = parseInt(productStockInput.value);
        // Use currentBase64Image which is set by the file input listener
        const image = currentBase64Image;

        if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
            showMessageBox("Please enter valid product name, price (must be > 0), and stock (must be >= 0).");
            return;
        }

        const confirmationMessage = id ? "Are you sure you want to update this product?" : "Are you sure you want to add this product?";
        const confirmed = await showMessageBox(confirmationMessage, true);

        if (confirmed) {
            if (id) {
                // Update existing product
                const productIndex = products.findIndex(p => p.id === id);
                if (productIndex > -1) {
                    products[productIndex] = { ...products[productIndex], name, price, stock, image };
                    showMessageBox("Product updated successfully!");
                }
            } else {
                // Add new product
                const newId = `prod-${Date.now()}`; // Simple unique ID
                products.push({ id: newId, name, price, stock, image });
                showMessageBox("Product added successfully!");
            }

            saveData();
            renderProductList();
            resetProductForm();
        } else {
            showMessageBox("Product operation cancelled.");
        }
    }

    /**
     * editProduct - Fills the form with product data for editing.
     * @param {string} id - The ID of the product to edit.
     */
    function editProduct(id) {
        const product = products.find(p => p.id === id);
        if (product) {
            productIdInput.value = product.id;
            productNameInput.value = product.name;
            productPriceInput.value = product.price;
            productStockInput.value = product.stock;
            // Set the currentBase64Image for editing, and update preview
            currentBase64Image = product.image || '';
            productImagePreview.src = product.image && product.image.startsWith('data:image') ? product.image : 'https://placehold.co/100x100/cccccc/000000?text=No+Image';
            productImageUpload.value = ''; // Clear file input value when editing (as it can't display a default file)


            productFormTitle.textContent = 'Edit Product';
            addProductButton.textContent = 'Update Product';
            addProductButton.classList.remove('bg-green-500', 'hover:bg-green-600');
            addProductButton.classList.add('bg-orange-500', 'hover:bg-orange-600');
            cancelEditButton.classList.remove('hidden');
        }
    }

    /**
     * deleteProduct - Deletes a product from the list.
     * @param {string} id - The ID of the product to delete.
     */
    async function deleteProduct(id) {
        const confirmed = await showMessageBox("Are you sure you want to delete this product?", true);
        if (confirmed) {
            products = products.filter(p => p.id !== id);
            saveData();
            renderProductList();
            showMessageBox("Product deleted.");
            resetProductForm(); // Reset form in case deleted product was being edited
        }
    }

    // --- Event Listeners ---
    saveBusinessInfoButton.addEventListener('click', async () => {
        const confirmed = await showMessageBox("Are you sure you want to save business information?", true);
        if (confirmed) {
            businessSettings.businessName = businessNameInput.value.trim();
            businessSettings.taxRate = parseFloat(taxRateInput.value);
            businessSettings.currencySymbol = currencySymbolInput.value.trim();
            businessSettings.businessAddress = businessAddressInput.value.trim();
            businessSettings.businessPhone = businessPhoneInput.value.trim();
            businessSettings.businessEmail = businessEmailInput.value.trim();
            businessSettings.businessRegNo = businessRegNoInput.value.trim();
            businessSettings.taxNumber = taxNumberInput.value.trim();
            businessSettings.cashierName = cashierNameInput.value.trim();
            // Save the current logo data
            businessSettings.businessLogo = businessLogoPreview.src.startsWith('data:image') ? businessLogoPreview.src : '';


            if (isNaN(businessSettings.taxRate) || businessSettings.taxRate < 0) {
                showMessageBox("Please enter a valid tax rate (a non-negative number).");
                return;
            }
            if (!businessSettings.currencySymbol) {
                showMessageBox("Please enter a currency symbol.");
                return;
            }

            saveData();
            showMessageBox("Business information saved!");
        } else {
            showMessageBox("Saving business information cancelled.");
        }
    });

    // Event listener for business logo file input change
    businessLogoUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                businessLogoPreview.src = e.target.result; // Update preview
            };
            reader.readAsDataURL(file); // Read file as Base64 data URL
        } else {
            businessLogoPreview.src = 'https://placehold.co/100x50/e0f2fe/000000?text=No+Logo'; // Reset preview
        }
    });

    // Event listener for product image file input change
    productImageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentBase64Image = e.target.result; // Store Base64 string
                productImagePreview.src = currentBase64Image; // Update preview
            };
            reader.readAsDataURL(file); // Read file as Base64 data URL
        } else {
            currentBase64Image = ''; // Clear if no file selected
            productImagePreview.src = 'https://placehold.co/100x100/cccccc/000000?text=No+Image'; // Reset preview
        }
    });

    addProductButton.addEventListener('click', addOrUpdateProduct);
    cancelEditButton.addEventListener('click', resetProductForm);

    // --- Initialization ---
    loadData();
    renderProductList();
    resetProductForm(); // Ensure form is clean on load
})();
