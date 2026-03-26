import React, { useState } from 'react';
import {
    Search, Plus, Eye, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Download, Send, Printer,
    Wallet
} from 'lucide-react';
import './Payment.css';
import salesReceiptService from '../../../../api/salesReceiptService';
import salesInvoiceService from '../../../../api/salesInvoiceService';
import customerService from '../../../../api/customerService';
import ledgerService from '../../../../api/ledgerService';
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const Payment = () => {
    // --- State Management ---
    const [receipts, setReceipts] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [allLedgers, setAllLedgers] = useState([]); // Store all fetched ledgers
    const [ledgers, setLedgers] = useState([]); // Filtered ledgers for dropdown

    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showInvoiceSelect, setShowInvoiceSelect] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Edit & Delete State
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Form State
    const [customerId, setCustomerId] = useState('');
    const [customerLedgerId, setCustomerLedgerId] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMode, setPaymentMode] = useState('BANK');
    const [amountReceived, setAmountReceived] = useState(0);
    const [reference, setReference] = useState('');
    const [bankLedgerId, setBankLedgerId] = useState('');
    const [notes, setNotes] = useState('');

    // Initial Fetch
    React.useEffect(() => {
        fetchData();
        fetchDropdowns();
        fetchCompanyDetails();
    }, []);

    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', logo: null, notes: '', showQr: true
    });

    const fetchCompanyDetails = async () => {
        try {
            const companyId = GetCompanyId();
            if (companyId) {
                const res = await companyService.getById(companyId);
                const data = res.data;
                setCompanyDetails({
                    name: data.name || 'Kiaan Technology',
                    address: data.address || 'Indore, MP',
                    email: data.email || 'info@kiaantechnology.com',
                    phone: data.phone || '97521 00980',
                    logo: data.logo || null,
                    notes: data.notes || '',
                    showQr: data.showQrCode !== undefined ? data.showQrCode : true
                });
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const response = await salesReceiptService.getAll(companyId);
            if (response.data.success) {
                setReceipts(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const companyId = GetCompanyId();
            const [invRes, ledgerRes] = await Promise.all([
                salesInvoiceService.getAll(companyId),
                ledgerService.getAll(companyId)
            ]);
            if (invRes.data.success) {
                setInvoices(invRes.data.data.filter(inv => inv.balanceAmount > 0));
            }
            if (ledgerRes.data.success) {
                setAllLedgers(ledgerRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    // Filter ledgers when customerId or allLedgers change
    React.useEffect(() => {
        if (allLedgers.length > 0) {
            let filtered;
            if (customerLedgerId) {
                // User Request: Only show the account of the customer whose payment is being created
                filtered = allLedgers.filter(l => l.id === parseInt(customerLedgerId));
            } else {
                // Default: Show Bank/Cash if no customer selected
                filtered = allLedgers.filter(l =>
                    l.group?.name === 'Bank Accounts' ||
                    l.group?.name === 'Cash-in-hand' ||
                    l.subGroup?.name === 'Bank' ||
                    l.subGroup?.name === 'Cash'
                );
            }
            setLedgers(filtered);

            // Auto-select if only one option is available (e.g. Customer Ledger)
            if (filtered.length === 1) {
                setBankLedgerId(filtered[0].id);
            }
        }
    }, [customerLedgerId, allLedgers]);

    const salesProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'sales-order', label: 'Sales Order', icon: ShoppingCart, status: 'completed' },
        { id: 'delivery', label: 'Delivery', icon: Truck, status: 'completed' },
        { id: 'invoice', label: 'Invoice', icon: Receipt, status: 'completed' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'active' },
    ];

    const handleSelectInvoice = (inv) => {
        setSelectedInvoice(inv);
        setCustomerId(inv.customerId);
        setCustomerLedgerId(inv.customer?.ledgerId);
        setCustomerName(inv.customer?.name || '');
        setAmountReceived(inv.balanceAmount);
        setShowInvoiceSelect(false);
    };

    const resetForm = () => {
        setIsEditMode(false);
        setIsViewMode(false);
        setEditId(null);
        setSelectedInvoice(null);
        setCustomerId('');
        setCustomerLedgerId(null);
        setCustomerName('');
        setAmountReceived(0);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMode('BANK');
        setReference('');
        setBankLedgerId('');
        setNotes(companyDetails.notes || '');
        setShowInvoiceSelect(false);
        // We do NOT reset allLedgers here, it persists
    };

    const handleSave = async () => {
        try {
            const companyId = GetCompanyId();
            const data = {
                receiptNumber: `REC-${Date.now()}`,
                date: paymentDate,
                customerId: parseInt(customerId),
                invoiceId: parseInt(selectedInvoice.id),
                cashBankAccountId: parseInt(bankLedgerId),
                amount: parseFloat(amountReceived),
                paymentMode: paymentMode,
                referenceNumber: reference,
                notes: notes,
                companyId: parseInt(companyId)
            };

            const response = await salesReceiptService.create(data);
            if (response.data.success) {
                fetchData();
                setShowAddModal(false);
            }
        } catch (error) {
            console.error('Error saving receipt:', error);
        }
    };

    const handleOpenModal = () => {
        resetForm();
        setIsViewMode(false);
        setShowInvoiceSelect(true); // Default to showing invoice select for new payment
        setShowAddModal(true);
    };

    const handleEdit = async (paymentId) => {
        await populatePayment(paymentId, false);
    };

    const handleView = async (paymentId) => {
        await populatePayment(paymentId, true);
    };

    const populatePayment = async (paymentId, viewOnly) => {
        try {
            const companyId = GetCompanyId();
            const response = await salesReceiptService.getById(paymentId, companyId);
            if (response.data.success) {
                const rec = response.data.data;
                resetForm();
                setIsEditMode(!viewOnly);
                setIsViewMode(viewOnly);
                setEditId(paymentId);

                // Fetch invoice with items if invoice exists
                let invoiceWithItems = rec.invoice;
                if (rec.invoice?.id) {
                    try {
                        const invoiceResponse = await salesInvoiceService.getById(rec.invoice.id, companyId);
                        if (invoiceResponse.data.success) {
                            invoiceWithItems = invoiceResponse.data.data;
                        }
                    } catch (err) {
                        console.error('Error fetching invoice details:', err);
                    }
                }

                setSelectedInvoice(invoiceWithItems);
                setCustomerId(rec.customerId);
                setCustomerLedgerId(rec.customer?.ledgerId);
                setCustomerName(rec.customer?.name || '');
                setAmountReceived(rec.amount);
                setPaymentDate(rec.date.split('T')[0]);
                setPaymentMode(rec.paymentMode || 'Bank');
                setReference(rec.referenceNumber || '');
                setBankLedgerId(rec.cashBankAccountId || ''); // Ensure backend returns this or we need to check receipt schema
                setNotes(rec.notes || '');
                setShowInvoiceSelect(false);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error('Error fetching payment details:', error);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            await salesReceiptService.delete(deleteId, companyId);
            fetchData();
            setShowDeleteModal(false);
            setDeleteId(null);
        } catch (error) {
            console.error('Error deleting receipt:', error);
        }
    };

    const handlePrint = () => {
        // Add print class to body to trigger print styles
        document.body.classList.add('printing');

        // Trigger print dialog
        window.print();

        // Remove print class after printing
        setTimeout(() => {
            document.body.classList.remove('printing');
        }, 1000);
    };

    return (
        <div className="payment-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Received Payments</h1>
                    <p className="page-subtitle">Record and track customer payments</p>
                </div>
                <div className="header-actions">
                    <button className="btn-add" onClick={handleOpenModal}>
                        <Plus size={18} className="mr-2" /> Record Payment
                    </button>
                </div>
            </div>

            {/* Sales Process Tracker */}
            <div className="process-tracker-card">
                <div className="tracker-wrapper">
                    {salesProcess.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className={`tracker-step ${step.status}`}>
                                <div className="step-icon-wrapper">
                                    <step.icon size={20} />
                                    {step.status === 'completed' && <CheckCircle2 className="status-badge" size={14} />}
                                    {step.status === 'active' && <Clock className="status-badge" size={14} />}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                            {index < salesProcess.length - 1 && (
                                <div className={`tracker-divider ${salesProcess[index + 1].status !== 'pending' ? 'active' : ''}`}>
                                    <ArrowRight size={16} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="table-card mt-6">
                <div className="table-controls">
                    <div className="search-control">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search payments..." className="search-input" />
                    </div>
                </div>

                <div className="table-container">
                    <table className="payment-table">
                        <thead>
                            <tr>
                                <th>PAYMENT ID</th>
                                <th>INVOICE</th>
                                <th>CUSTOMER</th>
                                <th>DATE</th>
                                <th>MODE</th>
                                <th>AMOUNT</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.map(rec => (
                                <tr key={rec.id}>
                                    <td className="font-bold text-blue-600">{rec.receiptNumber}</td>
                                    <td><span className="source-link">{rec.invoice?.invoiceNumber}</span></td>
                                    <td>{rec.customer?.name}</td>
                                    <td>{new Date(rec.date).toLocaleDateString()}</td>
                                    <td>{rec.paymentMode}</td>
                                    <td className="font-bold text-green-600">${rec.amount.toFixed(2)}</td>
                                    <td className="text-right">
                                        <div className="payment-action-buttons">
                                            <button className="payment-action-btn view" onClick={() => handleView(rec.id)} title="View"><Eye size={16} /></button>
                                            <button className="payment-action-btn delete" onClick={() => handleDeleteClick(rec.id)} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Payment Modal */}
            {showAddModal && (
                <div className={`modal-overlay ${isViewMode ? 'view-mode-overlay' : ''}`}>
                    <div className={`modal-content payment-modal ${isViewMode ? 'view-mode-modal' : ''}`}>
                        {!isViewMode && (
                            <div className="modal-header">
                                <div>
                                    <h2 className="modal-title">{isEditMode ? 'Edit Payment' : 'Record Payment'}</h2>
                                    <p className="modal-subtitle">{isEditMode ? 'Update payment details' : 'Log payment against an invoice'}</p>
                                </div>
                                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {isViewMode && (
                            <div className="view-mode-header no-print">
                                <div>
                                    <h2 className="modal-title">View Payment</h2>
                                    <p className="modal-subtitle">Payment receipt and invoice details</p>
                                </div>
                                <div className="view-mode-actions">
                                    <button className="btn-secondary" onClick={handlePrint}>
                                        <Printer size={16} /> Print Receipt
                                    </button>
                                    <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={`modal-body ${isViewMode ? 'view-mode-body' : ''}`}>
                            {isViewMode ? (
                                // --- VIEW MODE: INVOICE TEMPLATE ---
                                <div className="invoice-view-template" id="invoice-print-content">
                                    {/* Header */}
                                    <div className="invoice-header-section">
                                        <div className="invoice-company-info">
                                            {companyDetails.logo ? (
                                                <img src={companyDetails.logo} alt="Company Logo" className="invoice-logo" />
                                            ) : (
                                                <div className="invoice-logo-placeholder">KT</div>
                                            )}
                                            <h2 className="invoice-company-name">{companyDetails.name}</h2>
                                            <div className="invoice-company-details">
                                                <p>{companyDetails.email}</p>
                                                <p>{companyDetails.phone}</p>
                                                <p>{companyDetails.address}</p>
                                            </div>
                                        </div>
                                        <div className="invoice-meta-section">
                                            <h1 className="invoice-title">PAYMENT</h1>
                                            <div className="invoice-meta-details">
                                                <p><span className="invoice-meta-label">Number:</span> #{selectedInvoice?.invoiceNumber || 'N/A'}</p>
                                                <p><span className="invoice-meta-label">Issue:</span> {selectedInvoice?.date ? new Date(selectedInvoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</p>
                                                <p><span className="invoice-meta-label">Due Date:</span> {selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</p>
                                            </div>
                                            {companyDetails.showQr && (
                                                <div className="invoice-qr-code">
                                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedInvoice?.invoiceNumber || 'Invoice'}`} alt="QR Code" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bill To & Ship To */}
                                    <div className="invoice-addresses-section">
                                        <div className="invoice-bill-to-section">
                                            <h3 className="invoice-section-title">Bill To:</h3>
                                            <p className="invoice-customer-name">{selectedInvoice?.customer?.billingName || selectedInvoice?.customer?.name || customerName || '<Customer Name>'}</p>
                                            <p className="invoice-customer-address">{selectedInvoice?.customer?.billingAddress || '<Address>'}</p>
                                            <p className="invoice-customer-city">
                                                {(() => {
                                                    const city = selectedInvoice?.customer?.billingCity || '';
                                                    const state = selectedInvoice?.customer?.billingState || '';
                                                    const zip = selectedInvoice?.customer?.billingZipCode || '';
                                                    if (city || state || zip) {
                                                        const parts = [city, state, zip].filter(Boolean);
                                                        return parts.length > 0 ? parts.join(', ') : '<City>, <State> <Zip>';
                                                    }
                                                    return '<City>, <State> <Zip>';
                                                })()}
                                            </p>
                                        </div>
                                        <div className="invoice-ship-to-section">
                                            <h3 className="invoice-section-title">Ship To:</h3>
                                            <p className="invoice-customer-name">{selectedInvoice?.customer?.shippingName || selectedInvoice?.customer?.billingName || selectedInvoice?.customer?.name || customerName || '<Customer Name>'}</p>
                                            <p className="invoice-customer-address">{selectedInvoice?.customer?.shippingAddress || selectedInvoice?.customer?.billingAddress || '<Address>'}</p>
                                            <p className="invoice-customer-city">
                                                {(() => {
                                                    // Try shipping address first
                                                    let city = selectedInvoice?.customer?.shippingCity || '';
                                                    let state = selectedInvoice?.customer?.shippingState || '';
                                                    let zip = selectedInvoice?.customer?.shippingZipCode || '';

                                                    // Fallback to billing if shipping not available
                                                    if (!city && !state && !zip) {
                                                        city = selectedInvoice?.customer?.billingCity || '';
                                                        state = selectedInvoice?.customer?.billingState || '';
                                                        zip = selectedInvoice?.customer?.billingZipCode || '';
                                                    }

                                                    if (city || state || zip) {
                                                        const parts = [city, state, zip].filter(Boolean);
                                                        return parts.length > 0 ? parts.join(', ') : '<City>, <State> <Zip>';
                                                    }
                                                    return '<City>, <State> <Zip>';
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    {(selectedInvoice?.invoiceitem || selectedInvoice?.items)?.length > 0 && (
                                        <div className="invoice-items-section">
                                            <table className="invoice-items-table">
                                                <thead>
                                                    <tr>
                                                        <th>Item</th>
                                                        <th>Warehouse</th>
                                                        <th>Quantity</th>
                                                        <th>Rate</th>
                                                        <th>Discount</th>
                                                        <th>Tax (%)</th>
                                                        <th>Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {((selectedInvoice?.invoiceitem || selectedInvoice?.items) || []).map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                <div className="font-bold">{item.product?.name || item.service?.name || 'Item'}</div>
                                                                <div className="text-xs text-slate-500">{item.description}</div>
                                                            </td>
                                                            <td>{item.warehouse?.name || 'N/A'}</td>
                                                            <td>{item.quantity || 0}</td>
                                                            <td>${(item.rate || 0).toFixed(2)}</td>
                                                            <td>${(item.discount || 0).toFixed(2)}</td>
                                                            <td>Tax {(item.taxRate || 0)}%</td>
                                                            <td>${(item.amount || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Totals */}
                                    <div className="invoice-totals-section">
                                        <div className="invoice-total-row">
                                            <span className="invoice-total-label">Sub Total</span>
                                            <span className="invoice-total-value">${Object.values(selectedInvoice?.invoiceitem || selectedInvoice?.items || []).reduce((acc, item) => acc + (item.quantity * item.rate), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="invoice-total-row">
                                            <span className="invoice-total-label">Tax</span>
                                            <span className="invoice-total-value">${(selectedInvoice?.taxAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="invoice-total-row invoice-total-final">
                                            <span className="invoice-total-label">Total</span>
                                            <span className="invoice-total-value">${(selectedInvoice?.totalAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="invoice-total-row">
                                            <span className="invoice-total-label">Paid Amount</span>
                                            <span className="invoice-total-value" style={{ color: '#10b981' }}>${(selectedInvoice?.paidAmount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="invoice-total-row" style={{ borderTop: '1px dashed #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                            <span className="invoice-total-label">Balance Due</span>
                                            <span className="invoice-total-value" style={{ color: '#ef4444', fontWeight: '700' }}>${(selectedInvoice?.balanceAmount || 0).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Payment Information */}
                                    <div className="invoice-payment-info-section">
                                        <h3 className="invoice-section-title">Payment Information</h3>
                                        <div className="invoice-payment-details">
                                            <div className="payment-detail-row">
                                                <span className="payment-detail-label">Payment Method:</span>
                                                <span className="payment-detail-value">{paymentMode || 'N/A'}</span>
                                            </div>
                                            <div className="payment-detail-row">
                                                <span className="payment-detail-label">Payment Date:</span>
                                                <span className="payment-detail-value">{new Date(paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            {reference && (
                                                <div className="payment-detail-row">
                                                    <span className="payment-detail-label">Reference Number:</span>
                                                    <span className="payment-detail-value">{reference}</span>
                                                </div>
                                            )}
                                            <div className="payment-detail-row">
                                                <span className="payment-detail-label">Amount Received:</span>
                                                <span className="payment-detail-value" style={{ color: '#10b981', fontWeight: '700' }}>${parseFloat(amountReceived || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="payment-detail-row">
                                                <span className="payment-detail-label">Invoice Status:</span>
                                                <span className={`payment-status-badge ${selectedInvoice?.status?.toLowerCase() || 'unpaid'}`}>
                                                    {selectedInvoice?.status || 'UNPAID'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    {companyDetails.notes && (
                                        <div className="invoice-notes-section">
                                            <h3 className="invoice-section-title">Notes</h3>
                                            <p className="invoice-notes-text">{companyDetails.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // --- EDIT / CREATE MODE ---
                                <>
                                    {/* Invoice Selection List */}
                                    {showInvoiceSelect && !selectedInvoice && (
                                        <div className="invoice-link-container">
                                            <h3 className="text-sm font-bold mb-3 text-gray-700">Select Unpaid Invoice</h3>
                                            <div className="invoice-grid">
                                                {invoices.map(inv => (
                                                    <div key={inv.id} className="invoice-link-card" onClick={() => handleSelectInvoice(inv)}>
                                                        <div className="i-card-header">
                                                            <span className="i-id">{inv.invoiceNumber}</span>
                                                            <span className="i-date">{new Date(inv.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="i-card-body">
                                                            <span className="i-customer">{inv.customer?.name}</span>
                                                            <div className="i-amount">
                                                                <span>Due: </span>
                                                                <span className="font-bold text-red-500">${inv.balanceAmount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-container">
                                        {/* Company Info - Read Only (Dynamic) */}
                                        <div className="company-info-readonly">
                                            {companyDetails.logo ? (
                                                <img src={companyDetails.logo} alt="Logo" className="company-logo-fixed" />
                                            ) : (
                                                <div className="logo-placeholder-fixed">KT</div>
                                            )}
                                            <div className="brand-details">
                                                <h4 className="company-name">{companyDetails.name}</h4>
                                                <p className="company-address">{companyDetails.address}</p>
                                                <div className="company-contact">
                                                    <span>{companyDetails.email}</span>
                                                    <span className="contact-separator">•</span>
                                                    <span>{companyDetails.phone}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedInvoice && (
                                            <div className="linked-indicator mb-6">
                                                <Wallet size={16} /> Receiving Payment for <strong>{selectedInvoice.invoiceNumber}</strong>
                                                {!isViewMode && <button className="change-link-btn" onClick={() => setShowInvoiceSelect(true)}>Change Invoice</button>}
                                            </div>
                                        )}

                                        <div className="form-grid-2">
                                            <div className="form-group">
                                                <label className="form-label">Customer Name</label>
                                                <input
                                                    type="text"
                                                    className="form-input bg-gray-50"
                                                    value={customerName}
                                                    disabled
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Payment Date</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    disabled={isViewMode}
                                                    value={paymentDate}
                                                    onChange={(e) => setPaymentDate(e.target.value)}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Payment Mode</label>
                                                <select
                                                    className="form-input"
                                                    disabled={isViewMode}
                                                    value={paymentMode}
                                                    onChange={(e) => setPaymentMode(e.target.value)}
                                                >
                                                    <option value="CASH">Cash</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="CARD">Card</option>
                                                    <option value="CHEQUE">Cheque</option>
                                                    <option value="BANK">Bank Transfer</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Deposit To (Account)</label>
                                                <select
                                                    className="form-input"
                                                    disabled={isViewMode}
                                                    value={bankLedgerId}
                                                    onChange={(e) => setBankLedgerId(e.target.value)}
                                                >
                                                    <option value="">Select Account...</option>
                                                    {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Reference ID / Check No.</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    disabled={isViewMode}
                                                    placeholder="e.g. TRN-12345678"
                                                    value={reference}
                                                    onChange={(e) => setReference(e.target.value)}
                                                />
                                            </div>

                                            <div className="amount-section form-group bg-green-50 rounded-lg border border-green-100">
                                                <div className="form-group mb-0">
                                                    <label className="form-label text-green-800 font-bold">Amount Received ($)</label>
                                                    <div className="input-with-symbol text-lg">
                                                        <input
                                                            type="number"
                                                            className="form-input text-2xl font-bold text-green-700 h-12"
                                                            disabled={isViewMode}
                                                            value={amountReceived}
                                                            onChange={(e) => setAmountReceived(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea className="form-textarea h-20"
                                                disabled={isViewMode}
                                                placeholder="Internal notes..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>

                        {!isViewMode && (
                            <div className="modal-footer">
                                <div className="footer-left">
                                    <button className="btn-secondary">
                                        <Printer size={16} /> Print Receipt
                                    </button>
                                </div>
                                <div className="footer-right">
                                    <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button className="btn-submit" style={{ backgroundColor: '#8ce043' }} disabled={!selectedInvoice} onClick={handleSave}>
                                        {isEditMode ? 'Update Payment' : 'Save Payment'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="delete-modal-content">
                        <div className="delete-modal-header">
                            <h2 className="text-lg font-bold text-red-600">Delete Payment?</h2>
                            <button className="close-btn-simple" onClick={() => setShowDeleteModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <p className="text-gray-600">
                                Are you sure you want to delete this Payment Record? This will revert the Invoice balance.
                            </p>
                        </div>
                        <div className="delete-modal-footer">
                            <button className="btn-plain" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
