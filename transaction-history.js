// transaction-history.js - Logic for the transaction history page

(function() {
    // --- DOM Element References ---
    const transactionsListContainer = document.getElementById('transactions-list-container');
    const noTransactionsMessage = document.getElementById('no-transactions-message');
    const exportAllSalesPdfButton = document.getElementById('export-all-sales-pdf');


    // Message box elements (reused from main app)
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');
    const messageOkButton = document.getElementById('message-ok-button');
    const messageCancelButton = document.getElementById('message-cancel-button');

    // --- Data Storage ---
    let transactions = [];
    let businessSettings = {};

    // --- Helper Functions (reused for consistency) ---

    /**
     * showMessageBox - Displays a custom modal message box instead of native alert/confirm.
     * @param {string} message - The text message to display.
     * @param {boolean} [isConfirm=false] - If true, adds a "Cancel" button and returns a Promise.
     * @param {boolean} [showTextInput=false] - If true, adds a text input field to the message box.
     * @returns {Promise<boolean|string>} For confirm, resolves with `true` (OK) or `false` (Cancel).
     * For text input, resolves with the input string (OK) or `null` (Cancel).
     */
    function showMessageBox(message, isConfirm = false, showTextInput = false) {
        messageText.textContent = message;
        // Apply pre-wrap for better multi-line display in details
        messageText.classList.add('whitespace-pre-wrap');
        messageCancelButton.classList.add('hidden');
        messageOkButton.textContent = 'OK';

        let textInput = null;
        if (showTextInput) {
            textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.placeholder = 'Enter customer name (optional)';
            textInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 mt-4';
            messageText.parentNode.insertBefore(textInput, messageText.nextSibling); // Insert after message text
        }

        // Show the message box using opacity and visibility
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
                if (textInput) textInput.remove(); // Clean up text input
                messageText.classList.remove('whitespace-pre-wrap'); // Clean up style
                messageOkButton.removeEventListener('click', okHandler);
                messageCancelButton.removeEventListener('click', cancelHandler);
                resolve(showTextInput ? textInput.value : true);
            };
            const cancelHandler = () => {
                // Hide the message box
                messageBox.style.opacity = '0';
                messageBox.style.pointerEvents = 'none';
                messageBox.style.visibility = 'hidden';
                messageBox.classList.add('hidden'); // Ensure it's hidden by class
                if (textInput) textInput.remove(); // Clean up text input
                messageText.classList.remove('whitespace-pre-wrap'); // Clean up style
                messageOkButton.removeEventListener('click', okHandler);
                messageCancelButton.removeEventListener('click', cancelHandler);
                resolve(false);
            };

            messageOkButton.addEventListener('click', okHandler);
            if (isConfirm || showTextInput) {
                messageCancelButton.classList.remove('hidden');
                messageCancelButton.addEventListener('click', cancelHandler);
            }
        });
    }

    /**
     * loadData - Loads transactions and settings from localStorage.
     */
    function loadData() {
        try {
            console.log("Loading transactions and settings from localStorage..."); // Debug log
            const savedTransactions = localStorage.getItem('posTransactions');
            const savedSettings = localStorage.getItem('posBusinessSettings');

            if (savedTransactions) {
                transactions = JSON.parse(savedTransactions);
                console.log("Transactions loaded:", transactions.length); // Debug log
            } else {
                console.log("No transactions found in localStorage."); // Debug log
            }
            if (savedSettings) {
                businessSettings = JSON.parse(savedSettings);
                console.log("Business settings loaded:", businessSettings); // Debug log
            } else {
                // Default settings if not found
                console.log("No business settings found, initializing defaults."); // Debug log
                businessSettings = {
                    businessName: 'My Small Business POS',
                    taxRate: 10,
                    currencySymbol: '$',
                    businessAddress: '', // Default empty
                    businessPhone: '',   // Default empty
                    businessEmail: '',   // Default empty
                    businessRegNo: '', // Default empty
                    taxNumber: '',   // Default empty
                    cashierName: 'Cashier', // Default value
                    businessLogo: '' // Default empty logo
                };
            }
        } catch (e) {
            console.error("Error loading data from localStorage:", e);
            showMessageBox("Could not load transaction history.");
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
        const logoColumnWidth = 50; // Max width for logo
        const infoColumnWidth = 100; // Max width for info block

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
     * generateSalePdf - Generates a PDF receipt for a given transaction.
     * @param {object} transaction - The transaction object containing sale details.
     */
    function generateSalePdf(transaction) {
        console.log("Generating individual receipt PDF for transaction:", transaction.id); // Debug log
        // eslint-disable-next-line no-undef
        const { jsPDF } = window.jspdf; // Get jsPDF from the global window object
        const doc = new jsPDF(); // Create a new jsPDF document

        const businessName = businessSettings.businessName || 'Your Business';
        const currencySymbol = businessSettings.currencySymbol || '$';
        const taxRate = businessSettings.taxRate || 0;
        const cashierName = businessSettings.cashierName || 'N/A';

        let yPos = 20; // Starting Y position for text

        drawHeaderWithLogoAndInfo(doc, yPos, (updatedYPos) => {
            yPos = updatedYPos + 5; // Add a small buffer after the header block

            // Receipt Title
            doc.setFontSize(18);
            doc.text('SALES RECEIPT', 105, yPos, { align: 'center' });
            yPos += 10;

            // Transaction Details
            doc.setFontSize(10);
            doc.text(`Transaction ID: ${transaction.id}`, 10, yPos);
            doc.text(`Date: ${new Date(transaction.timestamp).toLocaleString()}`, 10, yPos + 5);
            doc.text(`Cashier: ${cashierName}`, 10, yPos + 10);
            yPos += 20;

            // Items Table Header
            doc.setFontSize(12);
            doc.text('Item', 10, yPos);
            doc.text('Qty', 90, yPos, { align: 'right' });
            doc.text('Price', 120, yPos, { align: 'right' });
            doc.text('Total', 200, yPos, { align: 'right' });
            yPos += 5;
            doc.line(10, yPos, 200, yPos); // Line under header
            yPos += 5;

            // Items Loop
            doc.setFontSize(10);
            transaction.items.forEach(item => {
                doc.text(item.name, 10, yPos);
                doc.text(item.quantity.toString(), 90, yPos, { align: 'right' });
                doc.text(`${currencySymbol}${item.price.toFixed(2)}`, 120, yPos, { align: 'right' });
                doc.text(`${currencySymbol}${(item.price * item.quantity).toFixed(2)}`, 200, yPos, { align: 'right' });
                yPos += 7;
            });

            yPos += 5;
            doc.line(10, yPos, 200, yPos); // Line above summary
            yPos += 5;

            // Summary
            doc.setFontSize(12);
            doc.text(`Subtotal:`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${transaction.subtotal.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 7;
            doc.text(`Tax (${taxRate}%):`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${transaction.tax.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 7;
            doc.setFontSize(14);
            doc.text(`Total:`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${transaction.total.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 15;

            // Footer Message
            doc.setFontSize(10);
            doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

            // Save the PDF
            const filename = `receipt_${transaction.id}.pdf`;
            doc.save(filename);
            showMessageBox(`Receipt "${filename}" downloaded!`);
            console.log(`PDF "${filename}" generated.`); // Debug log
        });
    }

    /**
     * generateAllSalesPdf - Generates a consolidated PDF report of all sales.
     */
    function generateAllSalesPdf() {
        console.log("Attempting to generate All Sales PDF."); // Debug log
        if (transactions.length === 0) {
            showMessageBox("No sales data available to generate a report.");
            console.log("Aborted: No transactions found."); // Debug log
            return;
        }
        console.log("Transactions found:", transactions.length); // Debug log

        // eslint-disable-next-line no-undef
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            console.error("jsPDF library not loaded."); // Debug log
            showMessageBox("PDF generation failed: jsPDF library not found. Please ensure it's loaded.");
            return;
        }
        const doc = new jsPDF();
        console.log("jsPDF document created."); // Debug log

        const businessName = businessSettings.businessName || 'Your Business';
        const currencySymbol = businessSettings.currencySymbol || '$';
        const taxRate = businessSettings.taxRate || 0;
        const cashierName = businessSettings.cashierName || 'N/A';


        let yPos = 20;
        let pageNumber = 1;

        const drawPageContent = () => {
            // Draw header on each new page
            drawHeaderWithLogoAndInfo(doc, 20, (updatedYPos) => {
                yPos = updatedYPos + 5; // Buffer after header

                doc.setFontSize(18);
                doc.text('CONSOLIDATED SALES REPORT', 105, yPos, { align: 'center' });
                yPos += 10;
                doc.setFontSize(10);
                doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: 'center' });
                yPos += 15;

                doc.setFontSize(12);
                doc.text('Transaction ID', 10, yPos);
                doc.text('Date', 70, yPos);
                doc.text('Total', 200, yPos, { align: 'right' });
                yPos += 5;
                doc.line(10, yPos, 200, yPos);
                yPos += 5;
                console.log(`Added header for page ${pageNumber}.`); // Debug log

                let totalRevenue = 0;
                let totalTaxCollected = 0;
                let transactionsPerPage = 0;
                const maxTransactionsPerPage = 30; // Estimate, adjust based on content density

                transactions.forEach((transaction, index) => {
                    // Check if new page is needed before drawing the next transaction
                    // Assuming content takes about 7 units of yPos per transaction
                    if (yPos + 7 > (doc.internal.pageSize.height - 30) && index !== 0) { // Check if space is left before summary
                        doc.addPage();
                        yPos = 20; // Reset Y position for new page
                        pageNumber++;
                        transactionsPerPage = 0;
                        drawPageContent(); // Recursively call to draw new page header and content
                        return; // Skip current iteration to allow new page header to draw
                    }

                    doc.setFontSize(10);
                    const displayDate = new Date(transaction.timestamp).toLocaleDateString();
                    doc.text(transaction.id, 10, yPos);
                    doc.text(displayDate, 70, yPos);
                    doc.text(`${currencySymbol}${transaction.total.toFixed(2)}`, 200, yPos, { align: 'right' });
                    yPos += 7;
                    transactionsPerPage++;

                    totalRevenue += transaction.total;
                    totalTaxCollected += transaction.tax;
                    console.log(`Added transaction ${transaction.id} to PDF. Current Y: ${yPos}`); // Debug log
                });

                // Summary at the end
                if (yPos + 40 > doc.internal.pageSize.height) { // If not enough space for summary, add new page
                    doc.addPage();
                    yPos = 20;
                    pageNumber++;
                    console.log("Added new page for summary."); // Debug log
                    drawHeaderWithLogoAndInfo(doc, yPos, (updatedYPos) => { yPos = updatedYPos + 5; }); // Redraw header for summary page
                }

                doc.line(10, yPos, 200, yPos);
                yPos += 10;
                doc.setFontSize(14);
                doc.text(`Total Revenue: ${currencySymbol}${totalRevenue.toFixed(2)}`, 10, yPos);
                yPos += 7;
                doc.text(`Total Tax Collected: ${currencySymbol}${totalTaxCollected.toFixed(2)}`, 10, yPos);
                yPos += 15;

                doc.setFontSize(10);
                doc.text(`End of Report - Page ${pageNumber}`, 105, yPos, { align: 'center' });


                const filename = `Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
                doc.save(filename);
                showMessageBox(`Consolidated Sales Report "${filename}" downloaded!`);
                console.log(`Consolidated Sales Report "${filename}" downloaded successfully.`); // Debug log
            });
        };

        drawPageContent(); // Initial call to start the PDF generation flow
    }


    /**
     * generateInvoicePdf - Generates a PDF invoice for a given transaction.
     * This function is specifically for generating invoices from existing transaction history,
     * not the 'Create Invoice' page.
     * @param {object} transaction - The transaction object containing sale details.
     * @param {string} customerName - The name of the customer for the invoice.
     */
    function generateInvoicePdf(transaction, customerName = 'Valued Customer') {
        console.log("Generating invoice PDF for transaction:", transaction.id); // Debug log
        // eslint-disable-next-line no-undef
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            console.error("jsPDF library not loaded for invoice."); // Debug log
            showMessageBox("Invoice generation failed: jsPDF library not found. Please ensure it's loaded.");
            return;
        }
        const doc = new jsPDF();

        const businessName = businessSettings.businessName || 'Your Business';
        const businessAddress = businessSettings.businessAddress || 'N/A';
        const businessPhone = businessSettings.businessPhone || 'N/A';
        const businessEmail = businessSettings.businessEmail || 'N/A';
        const businessRegNo = businessSettings.businessRegNo || 'N/A';
        const taxNumber = businessSettings.taxNumber || 'N/A';
        const currencySymbol = businessSettings.currencySymbol || '$';
        const taxRate = businessSettings.taxRate || 0;
        const cashierName = businessSettings.cashierName || 'N/A'; // For invoice generated from transaction, usually not displayed on invoice itself
        const businessLogo = businessSettings.businessLogo || '';

        let yPos = 20;

        drawHeaderWithLogoAndInfo(doc, yPos, (updatedYPos) => {
            yPos = updatedYPos + 5; // Buffer after header

            // Invoice Title
            doc.setFontSize(26);
            doc.text('INVOICE', 105, yPos, { align: 'center' });
            yPos += 15;

            // Invoice Details (using transaction data)
            doc.setFontSize(10);
            const invoiceNumber = `INV-${transaction.id}`;
            const invoiceDate = new Date(transaction.timestamp).toLocaleDateString();
            const dueDate = new Date(new Date(transaction.timestamp).setDate(new Date(transaction.timestamp).getDate() + 7)).toLocaleDateString(); // 7 days from sale date

            doc.text(`Invoice #: ${invoiceNumber}`, 150, yPos, { align: 'left' });
            doc.text(`Invoice Date: ${invoiceDate}`, 150, yPos + 5, { align: 'left' });
            doc.text(`Due Date: ${dueDate}`, 150, yPos + 10, { align: 'left' });
            yPos += 15;

            // Bill To
            doc.setFontSize(12);
            doc.text('Bill To:', 10, yPos);
            doc.setFontSize(10);
            doc.text(customerName, 10, yPos + 5);
            // In a real app, you'd pull customer address/email from a customer record associated with the transaction
            yPos += 15;

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
            transaction.items.forEach(item => {
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
            doc.text(`Subtotal:`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${transaction.subtotal.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 7;
            doc.text(`Tax (${taxRate}%):`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${transaction.tax.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 7;
            doc.setFontSize(14);
            doc.text(`TOTAL DUE:`, 150, yPos, { align: 'right' });
            doc.text(`${currencySymbol}${transaction.total.toFixed(2)}`, 200, yPos, { align: 'right' });
            yPos += 15;

            // Notes/Payment Terms
            doc.setFontSize(10);
            doc.text('Payment Terms: Due upon receipt.', 10, yPos);
            yPos += 10;
            doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

            const filename = `invoice_${invoiceNumber}.pdf`;
            doc.save(filename);
            showMessageBox(`Invoice "${filename}" downloaded!`);
            console.log(`Invoice "${filename}" generated.`); // Debug log
        });
    }

    /**
     * deleteTransaction - Deletes a transaction from localStorage.
     * @param {string} transactionId - The ID of the transaction to delete.
     */
    async function deleteTransaction(transactionId) {
        console.log(`Attempting to delete transaction: ${transactionId}`); // Debug log
        const confirmed = await showMessageBox("Are you sure you want to delete this transaction? This action cannot be undone.", true);
        if (confirmed) {
            console.log(`Deletion confirmed for transaction: ${transactionId}`); // Debug log
            // Filter out the transaction to be deleted
            const initialLength = transactions.length;
            transactions = transactions.filter(t => t.id !== transactionId);

            if (transactions.length < initialLength) {
                // Only save and re-render if a transaction was actually removed
                localStorage.setItem('posTransactions', JSON.stringify(transactions));
                renderTransactions();
                showMessageBox("Transaction deleted successfully.");
                console.log(`Transaction ${transactionId} deleted.`); // Debug log
            } else {
                showMessageBox("Transaction not found or could not be deleted.");
                console.warn(`Transaction ${transactionId} not found for deletion.`); // Debug log
            }
        } else {
            showMessageBox("Transaction deletion cancelled.");
            console.log(`Deletion cancelled for transaction: ${transactionId}`); // Debug log
        }
    }


    /**
     * renderTransactions - Displays the list of recorded transactions.
     */
    function renderTransactions() {
        console.log("Rendering transactions list."); // Debug log
        transactionsListContainer.innerHTML = '';
        if (transactions.length === 0) {
            noTransactionsMessage.classList.remove('hidden');
            console.log("No transactions to display."); // Debug log
        } else {
            noTransactionsMessage.classList.add('hidden');
            // Sort transactions by timestamp in descending order (most recent first)
            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            console.log(`Displaying ${sortedTransactions.length} sorted transactions.`); // Debug log

            sortedTransactions.forEach(transaction => {
                const transactionItem = document.createElement('div');
                transactionItem.className = 'bg-white rounded-lg shadow-md p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center';
                transactionItem.innerHTML = `
                    <div class="mb-3 md:mb-0">
                        <h3 class="font-semibold text-gray-800 text-lg">Transaction ID: ${transaction.id}</h3>
                        <p class="text-gray-600 text-sm">${new Date(transaction.timestamp).toLocaleString()}</p>
                        <p class="font-bold text-blue-600 text-xl">${businessSettings.currencySymbol}${transaction.total.toFixed(2)}</p>
                    </div>
                    <div class="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                        <button data-id="${transaction.id}" class="view-details-btn bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-sm shadow transition duration-300">
                            View Details
                        </button>
                        <button data-id="${transaction.id}" class="export-receipt-btn bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm shadow transition duration-300">
                            Export Receipt
                        </button>
                        <button data-id="${transaction.id}" class="delete-transaction-btn bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-sm shadow transition duration-300">
                            Delete
                        </button>
                    </div>
                `;
                transactionsListContainer.appendChild(transactionItem);
                console.log(`Added transaction item for ID: ${transaction.id}`); // Debug log
            });

            // Attach event listeners
            document.querySelectorAll('.export-receipt-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    console.log(`Export Receipt button clicked for ID: ${transactionId}`); // Debug log
                    const transactionToExport = transactions.find(t => t.id === transactionId);
                    if (transactionToExport) {
                        generateSalePdf(transactionToExport);
                    } else {
                        showMessageBox("Transaction not found for PDF export.");
                    }
                });
            });

            // Removed generate-invoice-btn listener as per request
            // document.querySelectorAll('.generate-invoice-btn').forEach(button => { /* ... */ });

            document.querySelectorAll('.view-details-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    console.log(`View Details button clicked for ID: ${transactionId}`); // Debug log
                    const transactionDetails = transactions.find(t => t.id === transactionId);
                    if (transactionDetails) {
                        let detailsMessage = `Transaction ID: ${transactionDetails.id}\nDate: ${new Date(transactionDetails.timestamp).toLocaleString()}\n`;
                        if (businessSettings.cashierName) {
                            detailsMessage += `Cashier: ${businessSettings.cashierName}\n`;
                        }
                        detailsMessage += `\nItems:\n`;
                        transactionDetails.items.forEach(item => {
                            detailsMessage += `- ${item.name} (x${item.quantity}) - ${businessSettings.currencySymbol}${(item.price * item.quantity).toFixed(2)}\n`;
                        });
                        detailsMessage += `\nSubtotal: ${businessSettings.currencySymbol}${transactionDetails.subtotal.toFixed(2)}`;
                        detailsMessage += `\nTax (${businessSettings.taxRate}%): ${businessSettings.currencySymbol}${transactionDetails.tax.toFixed(2)}`;
                        detailsMessage += `\nTotal: ${businessSettings.currencySymbol}${transactionDetails.total.toFixed(2)}`;
                        showMessageBox(detailsMessage);
                    } else {
                        showMessageBox("Transaction details not found.");
                    }
                });
            });

            document.querySelectorAll('.delete-transaction-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const transactionId = event.currentTarget.dataset.id;
                    console.log(`Delete button clicked for ID: ${transactionId}`); // Debug log
                    deleteTransaction(transactionId);
                });
            });
        }
    }

    // --- Event Listeners ---
    console.log("Attaching event listener to Export All Sales button."); // Debug log
    exportAllSalesPdfButton.addEventListener('click', generateAllSalesPdf);


    // --- Initialization ---
    console.log("Transaction History page initialization started."); // Debug log
    loadData();
    renderTransactions();

    // Initialize the message box styles
    messageBox.style.opacity = '0';
    messageBox.style.pointerEvents = 'none';
    messageBox.style.visibility = 'hidden';
    messageBox.classList.add('hidden'); // Ensure it starts hidden
    console.log("Transaction History page initialization completed."); // Debug log
})();
