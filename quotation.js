// quotation.js - Logic for the new quotation creation page

(function() {
    // --- DOM Element References ---
    // Customer Details
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const customerEmailInput = document.getElementById('customer-email');
    const quotationNumberInput = document.getElementById('quotation-number'); // New: Quotation Number Input (will be overridden for PDF)
    const quotationDateInput = document.getElementById('quotation-date');
    const expiryDateInput = document.getElementById('expiry-date');

    // Add Existing Product
    const existingProductSelect = document.getElementById('existing-product-select');
    const existingProductQtyInput = document.getElementById('existing-product-qty');
    const addExistingProductButton = document.getElementById('add-existing-product');

    // Add Custom Item
    const customItemNameInput = document.getElementById('custom-item-name');
    const customItemPriceInput = document.getElementById('custom-item-price');
    const customItemQtyInput = document.getElementById('custom-item-qty');
    const addCustomItemButton = document.getElementById('add-custom-item');

    // Quotation Items Display
    const quotationItemsContainer = document.getElementById('quotation-items-container');
    const emptyQuotationMessage = document.getElementById('empty-quotation-message');

    // Quotation Summary
    const quotationSubtotalSpan = document.getElementById('quotation-subtotal');
    const quotationTaxSpan = document.getElementById('quotation-tax');
    const quotationTaxRateDisplay = document.getElementById('quotation-tax-rate-display');
    const quotationTotalSpan = document.getElementById('quotation-total');

    // Action Buttons
    const generateQuotationPdfButton = document.getElementById('generate-quotation-pdf');
    const clearQuotationButton = document.getElementById('clear-quotation');

    // Message box elements (reused from main app)
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage ---
    let products = []; // Loaded from localStorage for selection
    let businessSettings = {}; // Loaded from localStorage
    let currentQuotationItems = []; // Items currently added to the quotation being built

    // --- Helper Functions (reused for consistency) ---

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
                // Initialize quotationCounter if it doesn't exist
                if (typeof businessSettings.quotationCounter === 'undefined') {
                    businessSettings.quotationCounter = 1;
                    // Save immediately to ensure persistence of the new counter
                    localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));
                }
            } else {
                // Default settings if not found
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 10,
                    currencySymbol: 'R',
                    businessAddress: '', // Default empty
                    businessPhone: '',   // Default empty
                    businessEmail: '',   // Default empty
                    businessRegNo: '', // Default empty
                    taxNumber: '',   // Default empty
                    technicianName: 'Technician', // Default value
                    bankName: '', // Default empty
                    accountHolder: '', // Default empty
                    accountNumber: '', // Default empty
                    branchCode: '', // Default empty
                    businessLogo: '' // Default empty logo
                };
                // Save default settings including the new counter
                localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));
            }
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load product data or business settings. Please check your browser storage.");
        }
    }

    /**
     * populateProductSelect - Fills the dropdown with available products.
     */
    function populateProductSelect() {
        existingProductSelect.innerHTML = '<option value="">-- Select a product --</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${businessSettings.currencySymbol}${product.price.toFixed(2)}) - Stock: ${product.stock}`;
            existingProductSelect.appendChild(option);
        });
    }

    /**
     * renderQuotationItems - Displays the items currently added to the quotation.
     */
    function renderQuotationItems() {
        quotationItemsContainer.innerHTML = '';
        if (currentQuotationItems.length === 0) {
            emptyQuotationMessage.classList.remove('hidden');
            generateQuotationPdfButton.disabled = true;
        } else {
            emptyQuotationMessage.classList.add('hidden');
            generateQuotationPdfButton.disabled = false;

            currentQuotationItems.forEach((item, index) => {
                const quotationItemDiv = document.createElement('div');
                quotationItemDiv.className = 'flex items-center justify-between bg-white rounded-md p-3 mb-2 shadow-sm';
                const itemTotal = item.price * item.quantity;
                const imageUrl = item.image && item.image.startsWith('data:image') ? item.image : 'https://placehold.co/50x50/cccccc/000000?text=Item';

                quotationItemDiv.innerHTML = `
                    <div class="flex items-center flex-grow">
                        <img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 object-contain rounded-md mr-3 border border-gray-100">
                        <div>
                            <h3 class="font-medium text-gray-800">${item.name}</h3>
                            <p class="text-sm text-gray-600">Qty: ${item.quantity} x ${businessSettings.currencySymbol}${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold text-gray-900 mr-3">${businessSettings.currencySymbol}${itemTotal.toFixed(2)}</span>
                        <button data-index="${index}" class="remove-quotation-item-btn bg-red-400 hover:bg-red-500 text-white p-2 rounded-full text-sm leading-none flex items-center justify-center transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                quotationItemsContainer.appendChild(quotationItemDiv);
            });

            document.querySelectorAll('.remove-quotation-item-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const indexToRemove = parseInt(event.currentTarget.dataset.index);
                    removeQuotationItem(indexToRemove);
                });
            });
        }
        calculateQuotationTotals();
    }

    /**
     * calculateQuotationTotals - Computes and displays the subtotal, tax, and total for the current quotation.
     */
    function calculateQuotationTotals() {
        const taxRate = businessSettings.taxRate / 100;
        quotationTaxRateDisplay.textContent = businessSettings.taxRate;

        let subtotal = currentQuotationItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let tax = subtotal * taxRate;
        let total = subtotal + tax;

        quotationSubtotalSpan.textContent = `${businessSettings.currencySymbol}${subtotal.toFixed(2)}`;
        quotationTaxSpan.textContent = `${businessSettings.currencySymbol}${tax.toFixed(2)}`;
        quotationTotalSpan.textContent = `${businessSettings.currencySymbol}${total.toFixed(2)}`;
    }

    /**
     * addExistingProductToQuotation - Adds a selected product from the inventory to the current quotation.
     */
    function addExistingProductToQuotation() {
        const productId = existingProductSelect.value;
        const quantity = parseInt(existingProductQtyInput.value);

        if (!productId) {
            showMessageBox("Please select a product.");
            return;
        }
        if (isNaN(quantity) || quantity <= 0) {
            showMessageBox("Please enter a valid quantity (must be greater than 0).");
            return;
        }

        const product = products.find(p => p.id === productId);

        if (!product) {
            showMessageBox("Selected product not found.");
            return;
        }
        // For quotations, we don't necessarily deduct from stock
        // if (product.stock < quantity) {
        //     showMessageBox(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
        //     return;
        // }

        const existingItemInQuotation = currentQuotationItems.find(item => item.id === productId && item.type === 'product');

        if (existingItemInQuotation) {
            existingItemInQuotation.quantity += quantity;
            // No stock deduction for quotations unless explicitly decided
            // product.stock -= quantity;
        } else {
            currentQuotationItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity,
                type: 'product' // Mark as product from inventory
            });
            // No stock deduction for quotations unless explicitly decided
            // product.stock -= quantity;
        }

        // It's important to save updated product stock back to localStorage if stock was modified
        // localStorage.setItem('posProducts', JSON.stringify(products));
        // populateProductSelect(); // Re-populate dropdown to show updated stock if stock was modified
        renderQuotationItems();
        showMessageBox(`Added ${quantity} x "${product.name}" to quotation.`);
    }

    /**
     * addCustomItemToQuotation - Adds a custom item (not from inventory) to the current quotation.
     */
    function addCustomItemToQuotation() {
        const name = customItemNameInput.value.trim();
        const price = parseFloat(customItemPriceInput.value);
        const quantity = parseInt(customItemQtyInput.value);

        if (!name || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
            showMessageBox("Please enter valid name, price (>0), and quantity (>0) for the custom item.");
            return;
        }

        currentQuotationItems.push({
            id: `custom-${Date.now()}`, // Unique ID for custom items
            name: name,
            price: price,
            quantity: quantity,
            type: 'custom', // Mark as custom item
            image: 'https://placehold.co/50x50/cccccc/000000?text=Custom' // Placeholder for custom items
        });

        renderQuotationItems();
        showMessageBox(`Added ${quantity} x "${name}" as custom item.`);
        // Clear custom item form fields
        customItemNameInput.value = '';
        customItemPriceInput.value = '';
        customItemQtyInput.value = '1';
    }

    /**
     * removeQuotationItem - Removes an item from the current quotation.
     * For quotations, no stock needs to be restored as it wasn't deducted.
     * @param {number} index - The index of the item to remove in the currentQuotationItems array.
     */
    async function removeQuotationItem(index) {
        const confirmed = await showMessageBox("Are you sure you want to remove this item from the quotation?", true);
        if (confirmed) {
            // const itemToRemove = currentQuotationItems[index]; // Not needed if no stock restore

            // If we decide to restore stock for products added to quote, this logic would go here:
            // if (itemToRemove.type === 'product') {
            //     const product = products.find(p => p.id === itemToRemove.id);
            //     if (product) {
            //         product.stock += itemToRemove.quantity;
            //         localStorage.setItem('posProducts', JSON.stringify(products));
            //         populateProductSelect();
            //     }
            // }

            currentQuotationItems.splice(index, 1);
            renderQuotationItems();
            showMessageBox("Item removed from quotation.");
        }
    }

    /**
     * clearQuotation - Resets the entire quotation form and items.
     */
    async function clearQuotation() {
        if (currentQuotationItems.length === 0 && !customerNameInput.value && !customerAddressInput.value && !customerEmailInput.value && !quotationNumberInput.value) {
            showMessageBox("Quotation is already empty.");
            return;
        }

        const confirmed = await showMessageBox("Are you sure you want to clear the entire quotation?", true);
        if (confirmed) {
            // No stock restoration needed for quotation items as they were not deducted
            currentQuotationItems = [];
            customerNameInput.value = '';
            customerAddressInput.value = '';
            customerEmailInput.value = '';
            quotationNumberInput.value = '';
            // Set quotation date to today
            quotationDateInput.value = new Date().toISOString().slice(0, 10);
            // Set expiry date to 30 days from today (common for quotes)
            const today = new Date();
            const expiryDate = new Date(today);
            expiryDate.setDate(today.getDate() + 30);
            expiryDateInput.value = expiryDate.toISOString().slice(0, 10);

            populateProductSelect();
            renderQuotationItems();
            showMessageBox("Quotation cleared.");
        }
    }

    /**
     * drawHeaderWithLogoAndInfo - Reusable function to draw logo and business info side-by-side.
     * @param {object} doc - jsPDF document instance.
     * @param {number} startY - Starting Y position for header.
     * @param {function} callback - Callback function to draw rest of the content after logo is loaded/skipped.
     */
    function drawHeaderWithLogoAndInfo(doc, startY, callback) {
        const businessName = businessSettings.businessName || 'Your Business';
        const businessAddress = businessSettings.businessAddress || 'N/A';
        const businessPhone = businessSettings.businessPhone || 'N/A';
        const businessEmail = businessSettings.businessEmail || 'N/A';
        const businessRegNo = businessSettings.businessRegNo || 'N/A';
        const taxNumber = businessSettings.taxNumber || 'N/A';
        const businessLogo = businessSettings.businessLogo || '';

        let currentY = startY;
        const leftMargin = 10;
        const rightSideX = 200; // X position for right-aligned text

        const drawInfo = (offsetY = 0) => {
            doc.setFontSize(14);
            doc.text(businessName, rightSideX, currentY + offsetY, { align: 'right' });
            doc.setFontSize(9);
            doc.text(businessAddress, rightSideX, currentY + offsetY + 5, { align: 'right' });
            doc.text(`Phone: ${businessPhone}`, rightSideX, currentY + offsetY + 10, { align: 'right' });
            doc.text(`Email: ${businessEmail}`, rightSideX, currentY + offsetY + 15, { align: 'right' });
            doc.text(`Reg. No: ${businessRegNo}`, rightSideX, currentY + offsetY + 20, { align: 'right' });
            doc.text(`Tax No: ${taxNumber}`, rightSideX, currentY + offsetY + 25, { align: 'right' });
        };

        if (businessLogo) {
            const img = new Image();
            img.src = businessLogo;
            img.onload = () => {
                const imgWidth = 40; // Desired width for logo
                const imgHeight = (img.height * imgWidth) / img.width;
                const logoX = leftMargin; // Logo aligned to left margin
                const logoY = currentY;

                // Ensure logo fits within column
                let displayImgWidth = imgWidth;
                let displayImgHeight = imgHeight;
                if (displayImgHeight > 40) { // Limit logo height to avoid pushing content too far
                    displayImgHeight = 40;
                    displayImgWidth = (img.width * displayImgHeight) / img.height;
                }

                doc.addImage(img, 'PNG', logoX, logoY, displayImgWidth, displayImgHeight);

                drawInfo(0); // Draw info at the initial Y
                currentY += Math.max(displayImgHeight, 35); // Adjust Y based on whichever is taller (logo height or info block height)
                callback(currentY); // Pass updated Y position
            };
            img.onerror = () => {
                console.warn("Failed to load business logo. Continuing without logo.");
                drawInfo(0); // Draw info block without logo
                currentY += 35; // Default height for info block
                callback(currentY);
            };
        } else {
            drawInfo(0); // Draw info block only
            currentY += 35; // Default height for info block
            callback(currentY);
        }
    }


    /**
     * generateQuotationPdf - Generates a PDF quotation based on current form data and items.
     */
    function generateQuotationPdf() {
        if (currentQuotationItems.length === 0) {
            showMessageBox("Please add items to the quotation before generating a PDF.");
            return;
        }

        // eslint-disable-next-line no-undef
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            console.error("jsPDF library not loaded.");
            showMessageBox("PDF generation failed: jsPDF library not found. Please ensure it's loaded.");
            return;
        }
        const doc = new jsPDF();

        const businessName = businessSettings.businessName || 'Your Business';
        const businessAddress = businessSettings.businessAddress || 'N/A';
        const businessPhone = businessSettings.businessPhone || 'N/A';
        const businessEmail = businessSettings.businessEmail || 'N/A';
        const businessRegNo = businessSettings.businessRegNo || 'N/A';
        const taxNumber = businessSettings.taxNumber || 'N/A';
        const currencySymbol = businessSettings.currencySymbol || 'R';
        const taxRate = businessSettings.taxRate || 0;
        // const technicianName = businessSettings.technicianName || 'N/A'; // Removed: Technician name

        // Bank Account Details for PDF
        const bankName = businessSettings.bankName || '';
        const accountHolder = businessSettings.accountHolder || '';
        const businessAccountNumber = businessSettings.accountNumber || '';
        const branchCode = businessSettings.branchCode || '';

        let yPos = 20;

        drawHeaderWithLogoAndInfo(doc, yPos, (updatedYPos) => {
            yPos = updatedYPos + 5; // Buffer after header

            // Quotation Title
            doc.setFontSize(26);
            doc.text('QUOTATION', 105, yPos, { align: 'center' });
            yPos += 15;

            // Quotation Details (Quotation No, Date, Expiry Date)
            doc.setFontSize(10);
            const quotationDate = quotationDateInput.value ? new Date(quotationDateInput.value).toLocaleDateString() : new Date().toLocaleDateString();
            const expiryDate = expiryDateInput.value ? new Date(expiryDateInput.value).toLocaleDateString() : new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString(); // Default 30 days expiry

            // Get and increment quotation counter
            let currentQuotationNumber = businessSettings.quotationCounter;
            const formattedQuotationNumber = `${currentQuotationNumber.toString().padStart(5, '0')}`; // e.g., QUO-00001
            businessSettings.quotationCounter++; // Increment for next quotation
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings)); // Save updated counter

            doc.text(`Quotation No: ${formattedQuotationNumber}`, 150, yPos, { align: 'left' });
            doc.text(`Quotation Date: ${quotationDate}`, 150, yPos + 5, { align: 'left' });
            doc.text(`Expiry Date: ${expiryDate}`, 150, yPos + 10, { align: 'left' });
            yPos += 15; // Adjusted yPos increment for these three lines


            // Quoted To
            doc.setFontSize(12);
            doc.text('Quoted To:', 10, yPos);
            doc.setFontSize(10);
            doc.text(customerNameInput.value.trim() || 'Valued Customer', 10, yPos + 5);
            if (customerAddressInput.value.trim()) doc.text(customerAddressInput.value.trim(), 10, yPos + 10);
            if (customerEmailInput.value.trim()) doc.text(customerEmailInput.value.trim(), 10, yPos + 15);
            yPos += (customerAddressInput.value.trim() && customerEmailInput.value.trim()) ? 25 : (customerAddressInput.value.trim() || customerEmailInput.value.trim()) ? 20 : 15;


            // Items Table Header
            doc.setFontSize(12);
            doc.text('Item', 10, yPos);
            doc.text('Qty', 90, yPos, { align: 'right' });
            doc.text('Unit Price', 120, yPos, { align: 'right' });
            doc.text('Amount', 200, yPos, { align: 'right' });
            yPos += 5;
            doc.line(10, yPos, 200, yPos);
            yPos += 5;

            // Items Loop
            doc.setFontSize(10);
            currentQuotationItems.forEach(item => {
                const itemTotal = item.price * item.quantity;
                doc.text(item.name, 10, yPos);
                doc.text(item.quantity.toString(), 90, yPos, { align: 'right' });
                doc.text(`${currencySymbol}${item.price.toFixed(2)}`, 120, yPos, { align: 'right' });
                doc.text(`${currencySymbol}${itemTotal.toFixed(2)}`, 200, yPos, { align: 'right' });
                yPos += 7;
            });

            yPos += 5;
            doc.line(10, yPos, 200, yPos);
            yPos += 5;

            // Summary
            doc.setFontSize(12);
            const subtotalValue = currentQuotationItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxValue = subtotalValue * (businessSettings.taxRate / 100);
            const totalValue = subtotalValue + taxValue;

            doc.text(`Subtotal:`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${subtotalValue.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 7;
            doc.text(`Tax (${taxRate}%):`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${taxValue.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 7;
            doc.setFontSize(14);
            doc.text(`TOTAL ESTIMATE:`, 150, yPos, { align: 'right' }); // Changed to TOTAL ESTIMATE
            doc.text(`${currencySymbol}${totalValue.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 15;

            // New: Bank Account Details on Quotation
            if (bankName && businessAccountNumber) { // Only display if both are present
                doc.setFontSize(9);
                doc.text('Bank Details:', 10, yPos);
                yPos += 5;
                if (bankName) doc.text(`Bank: ${bankName}`, 10, yPos);
                yPos += 5;
                if (accountHolder) doc.text(`Account Holder: ${accountHolder}`, 10, yPos);
                yPos += 5;
                if (businessAccountNumber) doc.text(`Account No: ${businessAccountNumber}`, 10, yPos);
                yPos += 5;
                if (branchCode) doc.text(`Branch Code: ${branchCode}`, 10, yPos);
                yPos += 10;
            }

            doc.setFontSize(10);
            doc.text('Thank you for your inquiry!', 105, yPos, { align: 'center' });

            const filename = `quotation_${formattedQuotationNumber}.pdf`;
            doc.save(filename);
            showMessageBox(`Quotation "${filename}" downloaded!`);
        });
    }

    // --- Event Listeners ---
    addExistingProductButton.addEventListener('click', addExistingProductToQuotation);
    addCustomItemButton.addEventListener('click', addCustomItemToQuotation);
    generateQuotationPdfButton.addEventListener('click', generateQuotationPdf);
    clearQuotationButton.addEventListener('click', clearQuotation);

    // --- Initialization ---
    loadData();
    populateProductSelect();
    renderQuotationItems();
    // Set default dates to today and 30 days from today for expiry
    const today = new Date();
    quotationDateInput.value = today.toISOString().slice(0, 10);
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + 30); // 30 days validity
    expiryDateInput.value = expiryDate.toISOString().slice(0, 10);

    // Initialize the message box styles (important for all pages using it)
    messageBox.style.opacity = '0';
    messageBox.style.pointerEvents = 'none';
    messageBox.style.visibility = 'hidden';
    messageBox.classList.add('hidden'); // Ensure it starts hidden
})();
// End of quotation.js