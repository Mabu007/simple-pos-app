// special-order.js - Logic for the Special Order creation page

(function() {
    // --- DOM Element References ---
    // Document Type Radios
    const docTypeInvoiceRadio = document.getElementById('doc-type-invoice');
    const docTypeQuotationRadio = document.getElementById('doc-type-quotation');

    // Customer Details
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const customerEmailInput = document.getElementById('customer-email');
    const accountNumberField = document.getElementById('account-number-field'); // Container for Account Number
    const customerAccountNumberInput = document.getElementById('customer-account-number');
    const documentDateInput = document.getElementById('document-date');
    const documentDateLabel = document.getElementById('document-date-label');
    const dueExpiryDateInput = document.getElementById('due-expiry-date');
    const dueExpiryDateLabel = document.getElementById('due-expiry-date-label');

    // Order & Equipment Details
    const specialOrderIdInput = document.getElementById('special-order-id');
    const customerPoNumberInput = document.getElementById('customer-po-number');
    const batteryDheNumberInput = document.getElementById('battery-dhe-number');
    const equipmentMakeInput = document.getElementById('equipment-make');
    const equipmentModelInput = document.getElementById('equipment-model');
    const equipmentSerialNumberInput = document.getElementById('equipment-serial-number');
    const equipmentHoursMileageInput = document.getElementById('equipment-hours-mileage');
    const engineTypeInput = document.getElementById('engine-type');
    const workDoneDescriptionInput = document.getElementById('work-done-description');

    // Add Custom Item
    const customItemNameInput = document.getElementById('custom-item-name');
    const customItemPriceInput = document.getElementById('custom-item-price');
    const customItemQtyInput = document.getElementById('custom-item-qty');
    const addCustomItemButton = document.getElementById('add-custom-item');

    // Order Items Display
    const orderItemsContainer = document.getElementById('order-items-container');
    const emptyOrderMessage = document.getElementById('empty-order-message');

    // Order Summary
    const orderSubtotalSpan = document.getElementById('order-subtotal');
    const orderTaxSpan = document.getElementById('order-tax');
    const orderTaxRateDisplay = document.getElementById('order-tax-rate-display');
    const orderTotalSpan = document.getElementById('order-total');

    // Action Buttons
    const generatePdfButton = document.getElementById('generate-pdf');
    const clearOrderButton = document.getElementById('clear-order');

    // Message box elements (reused from main app)
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage ---
    let businessSettings = {}; // Loaded from localStorage
    let currentOrderItems = []; // Items currently added to the special order being built
    let documentType = 'invoice'; // Default to invoice

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
     * loadData - Loads business settings from localStorage.
     */
    function loadData() {
        try {
            const savedSettings = localStorage.getItem('posBusinessSettings');
            if (savedSettings) {
                businessSettings = JSON.parse(savedSettings);
                // Initialize invoiceCounter and quotationCounter if they don't exist
                if (typeof businessSettings.invoiceCounter === 'undefined') {
                    businessSettings.invoiceCounter = 1;
                }
                if (typeof businessSettings.quotationCounter === 'undefined') {
                    businessSettings.quotationCounter = 1;
                }
                // Ensure taxRate is explicitly set to 0 if not defined or set by user
                if (typeof businessSettings.taxRate === 'undefined') {
                    businessSettings.taxRate = 0;
                }
                localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings)); // Save updated counter if new
            } else {
                // Default settings if not found
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 0, // Default tax rate set to 0 as requested
                    currencySymbol: 'R', // Default currency to Rands
                    businessAddress: '',
                    businessPhone: '',
                    businessEmail: '',
                    businessRegNo: '',
                    taxNumber: '',
                    technicianName: 'Technician',
                    bankName: '',
                    accountHolder: '',
                    accountNumber: '',
                    branchCode: '',
                    businessLogo: '',
                    invoiceCounter: 1,
                    quotationCounter: 1
                };
                localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings));
            }
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load business settings. Some features may not work correctly.");
        }
    }

    /**
     * updateDocumentTypeDisplay - Adjusts UI elements based on selected document type.
     */
    function updateDocumentTypeDisplay() {
        if (docTypeInvoiceRadio.checked) {
            documentType = 'invoice';
            documentDateLabel.textContent = 'Invoice Date';
            dueExpiryDateLabel.textContent = 'Due Date';
            accountNumberField.classList.remove('hidden');
            // Set default due date to 7 days from invoice date
            const today = new Date();
            documentDateInput.value = today.toISOString().slice(0, 10);
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + 7);
            dueExpiryDateInput.value = dueDate.toISOString().slice(0, 10);
        } else {
            documentType = 'quotation';
            documentDateLabel.textContent = 'Quotation Date';
            dueExpiryDateLabel.textContent = 'Expiry Date';
            accountNumberField.classList.add('hidden');
            // Set default expiry date to 30 days from quotation date
            const today = new Date();
            documentDateInput.value = today.toISOString().slice(0, 10);
            const expiryDate = new Date(today);
            expiryDate.setDate(today.getDate() + 30);
            dueExpiryDateInput.value = expiryDate.toISOString().slice(0, 10);
        }
    }

    /**
     * renderOrderItems - Displays the items currently added to the special order.
     */
    function renderOrderItems() {
        orderItemsContainer.innerHTML = '';
        if (currentOrderItems.length === 0) {
            emptyOrderMessage.classList.remove('hidden');
            generatePdfButton.disabled = true;
        } else {
            emptyOrderMessage.classList.add('hidden');
            generatePdfButton.disabled = false;

            currentOrderItems.forEach((item, index) => {
                const orderItemDiv = document.createElement('div');
                orderItemDiv.className = 'flex items-center justify-between bg-white rounded-md p-3 mb-2 shadow-sm';
                const itemTotal = item.price * item.quantity;

                orderItemDiv.innerHTML = `
                    <div class="flex items-center flex-grow">
                        <div>
                            <h3 class="font-medium text-gray-800">${item.name}</h3>
                            <p class="text-sm text-gray-600">Qty: ${item.quantity} x ${businessSettings.currencySymbol}${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="font-bold text-gray-900 mr-3">${businessSettings.currencySymbol}${itemTotal.toFixed(2)}</span>
                        <button data-index="${index}" class="remove-order-item-btn bg-red-400 hover:bg-red-500 text-white p-2 rounded-full text-sm leading-none flex items-center justify-center transition duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                `;
                orderItemsContainer.appendChild(orderItemDiv);
            });

            document.querySelectorAll('.remove-order-item-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const indexToRemove = parseInt(event.currentTarget.dataset.index);
                    removeOrderItem(indexToRemove);
                });
            });
        }
        calculateOrderTotals();
    }

    /**
     * calculateOrderTotals - Computes and displays the subtotal, tax, and total for the current special order.
     */
    function calculateOrderTotals() {
        const taxRate = businessSettings.taxRate / 100;
        orderTaxRateDisplay.textContent = businessSettings.taxRate;

        let subtotal = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let tax = subtotal * taxRate;
        let total = subtotal + tax;

        orderSubtotalSpan.textContent = `${businessSettings.currencySymbol}${subtotal.toFixed(2)}`;
        orderTaxSpan.textContent = `${businessSettings.currencySymbol}${tax.toFixed(2)}`;
        orderTotalSpan.textContent = `${businessSettings.currencySymbol}${total.toFixed(2)}`;
    }

    /**
     * addCustomItemToOrder - Adds a custom item to the current special order.
     */
    function addCustomItemToOrder() {
        const name = customItemNameInput.value.trim();
        const price = parseFloat(customItemPriceInput.value);
        const quantity = parseInt(customItemQtyInput.value);

        if (!name || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
            showMessageBox("Please enter valid name, price (>0), and quantity (>0) for the custom item.");
            return;
        }

        currentOrderItems.push({
            id: `special-item-${Date.now()}`, // Unique ID for custom items
            name: name,
            price: price,
            quantity: quantity,
            type: 'custom' // Mark as custom item
        });

        renderOrderItems();
        showMessageBox(`Added ${quantity} x "${name}" to order.`);
        // Clear custom item form fields
        customItemNameInput.value = '';
        customItemPriceInput.value = '';
        customItemQtyInput.value = '1';
    }

    /**
     * removeOrderItem - Removes an item from the current special order.
     * @param {number} index - The index of the item to remove in the currentOrderItems array.
     */
    async function removeOrderItem(index) {
        const confirmed = await showMessageBox("Are you sure you want to remove this item from the order?", true);
        if (confirmed) {
            currentOrderItems.splice(index, 1);
            renderOrderItems();
            showMessageBox("Item removed from order.");
        }
    }

    /**
     * clearOrder - Resets the entire special order form and items.
     */
    async function clearOrder() {
        if (currentOrderItems.length === 0 && !customerNameInput.value && !specialOrderIdInput.value) {
            showMessageBox("Special order is already empty.");
            return;
        }

        const confirmed = await showMessageBox("Are you sure you want to clear the entire special order?", true);
        if (confirmed) {
            currentOrderItems = [];
            customerNameInput.value = '';
            customerAddressInput.value = '';
            customerEmailInput.value = '';
            customerAccountNumberInput.value = '';
            specialOrderIdInput.value = '';
            customerPoNumberInput.value = '';
            batteryDheNumberInput.value = '';
            equipmentMakeInput.value = '';
            equipmentModelInput.value = '';
            equipmentSerialNumberInput.value = '';
            equipmentHoursMileageInput.value = '';
            engineTypeInput.value = '';
            workDoneDescriptionInput.value = '';

            updateDocumentTypeDisplay(); // Reset dates to default based on current radio selection
            renderOrderItems();
            showMessageBox("Special order cleared.");
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
     * generateSpecialOrderPdf - Generates a PDF for the special order (Invoice or Quotation).
     */
    function generateSpecialOrderPdf() {
        if (currentOrderItems.length === 0) {
            showMessageBox("Please add items to the order before generating a PDF.");
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
        const currencySymbol = businessSettings.currencySymbol || 'R';
        const taxRate = businessSettings.taxRate || 0;
        // const technicianName = businessSettings.technicianName || 'N/A'; // Technician name removed from PDF output as not explicitly requested here

        // Bank Account Details from settings
        const bankName = businessSettings.bankName || '';
        const accountHolder = businessSettings.accountHolder || '';
        const businessAccountNumber = businessSettings.accountNumber || '';
        const branchCode = businessSettings.branchCode || '';

        let yPos = 20;
        const leftMargin = 10;
        const centerCol1 = 105; // Center point for first column
        const centerCol2 = 155; // Center point for second column
        const rightAlignX = 200; // X position for right-aligned text
        const colWidth = 90; // Approx width for split columns

        drawHeaderWithLogoAndInfo(doc, yPos, (updatedYPos) => {
            yPos = updatedYPos + 5; // Buffer after header

            // Document Title
            doc.setFontSize(26);
            const docTitle = documentType === 'invoice' ? 'INVOICE' : 'QUOTATION';
            doc.text(docTitle, 105, yPos, { align: 'center' });
            yPos += 15;

            // Customer Info Block (Left aligned) and Document Info (Right aligned)
            doc.setFontSize(12);
            doc.text('Customer Details:', leftMargin, yPos);
            doc.setFontSize(10);
            
            const docDate = documentDateInput.value ? new Date(documentDateInput.value).toLocaleDateString() : new Date().toLocaleDateString();
            const dueExpiryDate = dueExpiryDateInput.value ? new Date(dueExpiryDateInput.value).toLocaleDateString() : 'N/A';

            let docNumber;
            if (documentType === 'invoice') {
                docNumber = `${businessSettings.invoiceCounter.toString().padStart(5, '0')}`;
                businessSettings.invoiceCounter++;
            } else { // quotation
                docNumber = `${businessSettings.quotationCounter.toString().padStart(5, '0')}`;
                businessSettings.quotationCounter++;
            }
            localStorage.setItem('posBusinessSettings', JSON.stringify(businessSettings)); // Save updated counter


            // Document Info (Right aligned)
            doc.text(`Document No: ${docNumber}`, rightAlignX, yPos, { align: 'right' });
            yPos += 5;
            doc.text(`Name: ${customerNameInput.value.trim() || 'N/A'}`, leftMargin, yPos);
            doc.text(`${documentDateLabel.textContent}: ${docDate}`, rightAlignX, yPos, { align: 'right' });
            yPos += 5;
            doc.text(`Address: ${customerAddressInput.value.trim() || 'N/A'}`, leftMargin, yPos);
            doc.text(`${dueExpiryDateLabel.textContent}: ${dueExpiryDate}`, rightAlignX, yPos, { align: 'right' });
            yPos += 5;
            doc.text(`Email: ${customerEmailInput.value.trim() || 'N/A'}`, leftMargin, yPos);
            if (documentType === 'invoice' && customerAccountNumberInput.value.trim()) {
                yPos += 5;
                doc.text(`Account No: ${customerAccountNumberInput.value.trim()}`, leftMargin, yPos);
            }
            yPos += 10; // Extra spacing after customer details

            // Special Order & Equipment Details - Two Columns
            doc.setFontSize(12);
            doc.text('Order Details:', leftMargin, yPos);
            doc.setFontSize(10);
            yPos += 5;

            // Column 1 (Left Side)
            let col1X = leftMargin;
            let col2X = leftMargin + colWidth + 10; // 10 units space between columns

            doc.text(`Order ID: ${specialOrderIdInput.value.trim() || 'N/A'}`, col1X, yPos);
            doc.text(`Model: ${equipmentModelInput.value.trim() || 'N/A'}`, col2X, yPos);
            yPos += 5;
            doc.text(`Customer PO Number: ${customerPoNumberInput.value.trim() || 'N/A'}`, col1X, yPos);
            doc.text(`Serial No: ${equipmentSerialNumberInput.value.trim() || 'N/A'}`, col2X, yPos);
            yPos += 5;
            doc.text(`Battery DHE Number: ${batteryDheNumberInput.value.trim() || 'N/A'}`, col1X, yPos);
            doc.text(`Hours/Mileage: ${equipmentHoursMileageInput.value.trim() || 'N/A'}`, col2X, yPos);
            yPos += 5;
            doc.text(`Make: ${equipmentMakeInput.value.trim() || 'N/A'}`, col1X, yPos);
            doc.text(`Engine Type: ${engineTypeInput.value.trim() || 'N/A'}`, col2X, yPos);
            yPos += 10; // Extra spacing after equipment details

            // Work Done Description
            doc.setFontSize(12);
            doc.text('Work Done:', leftMargin, yPos);
            doc.setFontSize(10);
            yPos += 5;
            const workDescription = workDoneDescriptionInput.value.trim() || 'No specific work description provided.';
            const splitWorkDescription = doc.splitTextToSize(workDescription, 190); // Use full contentWidth for description
            doc.text(splitWorkDescription, leftMargin, yPos);
            yPos += (splitWorkDescription.length * 5) + 10; // 5 units per line, plus buffer

            // Parts/Items List Header
            doc.setFontSize(12);
            doc.text('Parts/Items:', leftMargin, yPos);
            yPos += 5;
            doc.line(leftMargin, yPos, rightAlignX, yPos); // Line across full width
            yPos += 5;

            // Columns for items: Qty, Description, Unit Price, Amount
            const qtyX = leftMargin + 5;
            const descriptionX = leftMargin + 25; // Adjusted for Qty
            const unitPriceX = rightAlignX - 60; // Aligned to the right of description
            const amountX = rightAlignX; // Aligned to the far right

            doc.text('Qty', qtyX, yPos);
            doc.text('Description', descriptionX, yPos);
            doc.text('Unit Price', unitPriceX, yPos, { align: 'right' });
            doc.text('Amount', amountX, yPos, { align: 'right' });
            yPos += 5;
            doc.line(leftMargin, yPos, rightAlignX, yPos);
            yPos += 5;

            // Parts/Items Loop
            doc.setFontSize(10);
            currentOrderItems.forEach(item => {
                const itemTotal = item.price * item.quantity;
                doc.text(item.quantity.toString(), qtyX, yPos);
                // Ensure description wraps if too long, using splitTextToSize on a per-item basis for PDF readability
                const splitItemName = doc.splitTextToSize(item.name, unitPriceX - descriptionX - 5); // Max width for description
                doc.text(splitItemName, descriptionX, yPos);
                doc.text(`${currencySymbol}${item.price.toFixed(2)}`, unitPriceX, yPos + (splitItemName.length > 1 ? (splitItemName.length - 1) * 5 : 0), { align: 'right' }); // Adjust Y if description wraps
                doc.text(`${currencySymbol}${itemTotal.toFixed(2)}`, amountX, yPos + (splitItemName.length > 1 ? (splitItemName.length - 1) * 5 : 0), { align: 'right' }); // Adjust Y if description wraps
                yPos += (splitItemName.length * 5) + 2; // Move yPos by number of lines of description + buffer
            });

            yPos += 5;
            doc.line(leftMargin, yPos, rightAlignX, yPos);
            yPos += 5;

            // Totals Summary (Right aligned)
            doc.setFontSize(12);
            const subtotalValue = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxValue = subtotalValue * (businessSettings.taxRate / 100);
            const totalValue = subtotalValue + taxValue;

            doc.text(`Subtotal: ${currencySymbol}${subtotalValue.toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
            yPos += 7;
            doc.text(`Tax (${taxRate}%): ${currencySymbol}${taxValue.toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
            yPos += 7;
            doc.setFontSize(14);
            const totalLabel = documentType === 'invoice' ? 'TOTAL DUE:' : 'TOTAL ESTIMATE:';
            doc.text(`${totalLabel} ${currencySymbol}${totalValue.toFixed(2)}`, rightAlignX, yPos, { align: 'right' });
            yPos += 15;

            // Bank Account Details (only display if relevant info is present)
            if (bankName && businessAccountNumber) {
                doc.setFontSize(9);
                doc.text('Bank Details:', leftMargin, yPos);
                yPos += 5;
                if (bankName) doc.text(`Bank: ${bankName}`, leftMargin, yPos);
                yPos += 5;
                if (accountHolder) doc.text(`Account Holder: ${accountHolder}`, leftMargin, yPos);
                yPos += 5;
                if (businessAccountNumber) doc.text(`Account No: ${businessAccountNumber}`, leftMargin, yPos);
                yPos += 5;
                if (branchCode) doc.text(`Branch Code: ${branchCode}`, leftMargin, yPos);
                yPos += 10;
            }

            // Footer
            doc.setFontSize(10);
            doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

            const filename = `${documentType}_${docNumber}.pdf`;
            doc.save(filename);
            showMessageBox(`${docTitle} "${filename}" downloaded!`);
        });
    }

    // --- Event Listeners ---
    docTypeInvoiceRadio.addEventListener('change', updateDocumentTypeDisplay);
    docTypeQuotationRadio.addEventListener('change', updateDocumentTypeDisplay);
    addCustomItemButton.addEventListener('click', addCustomItemToOrder);
    generatePdfButton.addEventListener('click', generateSpecialOrderPdf);
    clearOrderButton.addEventListener('click', clearOrder);

    // --- Initialization ---
    loadData();
    updateDocumentTypeDisplay(); // Set initial labels and dates based on default selection
    renderOrderItems();

    // Initialize the message box styles (important for all pages using it)
    messageBox.style.opacity = '0';
    messageBox.style.pointerEvents = 'none';
    messageBox.style.visibility = 'hidden';
    messageBox.classList.add('hidden'); // Ensure it starts hidden
})();
