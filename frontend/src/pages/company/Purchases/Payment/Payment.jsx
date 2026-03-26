import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Printer, Eye
} from 'lucide-react';
import { CompanyContext } from '../../../../context/CompanyContext';
import toast from 'react-hot-toast';
import '../Purchase.css';
import './PaymentReceiptView.css';
import './PaymentActionButtons.css';
import purchasePaymentService from '../../../../services/purchasePaymentService';
import purchaseBillService from '../../../../services/purchaseBillService';
import vendorService from '../../../../services/vendorService';
import ledgerService from '../../../../api/ledgerService';
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const Payment = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const location = useLocation();
    const navigate = useNavigate();
    const sourceData = location.state?.sourceData; // content from Bill

    // --- State Management ---
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [bills, setBills] = useState([]);
    const [accounts, setAccounts] = useState([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // View Mode State
    const [isViewMode, setIsViewMode] = useState(false);
    const [viewPayment, setViewPayment] = useState(null);

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980'
    });
    const [paymentMeta, setPaymentMeta] = useState({
        manualNo: '', date: new Date().toISOString().split('T')[0], mode: 'Bank Transfer'
    });
    const [vendorId, setVendorId] = useState('');
    const [billId, setBillId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [amount, setAmount] = useState(0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchInitialData();
        fetchPayments();
    }, []);

    // Handle Source Data (Auto-fill)
    useEffect(() => {
        if (sourceData && !editingId && bills.length > 0) {
            const bill = bills.find(b => b.id === parseInt(sourceData.billId));
            if (bill) {
                setVendorId(bill.vendorId);
                setBillId(bill.id);
                setAmount(bill.balanceAmount || 0);
            } else {
                setVendorId(sourceData.vendorId);
                setBillId(sourceData.billId);
                setAmount(sourceData.amount || 0);
            }
            setShowAddModal(true);
        }
    }, [sourceData, editingId, bills]);

    const handleBillSelect = (bId) => {
        if (!bId) {
            resetForm();
            return;
        }
        const bill = bills.find(b => b.id === parseInt(bId));
        if (bill) {
            setVendorId(bill.vendorId);
            setBillId(bill.id);
            setAmount(bill.balanceAmount);
            setNotes(`Payment for Bill #${bill.billNumber}${companyDetails.notes ? '\n\n' + companyDetails.notes : ''}`);

            // Auto-select vendor account
            const selectedVendor = vendors.find(v => v.id === bill.vendorId);
            if (selectedVendor?.ledger) {
                setAccountId(selectedVendor.ledger.id);
            }
        }
    };

    // Auto-select account when vendorId changes manually (if not from bill)
    useEffect(() => {
        if (vendorId) {
            const selectedVendor = vendors.find(v => v.id === parseInt(vendorId));
            if (selectedVendor?.ledger) {
                setAccountId(selectedVendor.ledger.id);
            }
        }
    }, [vendorId, vendors]);

    const fetchInitialData = async () => {
        try {
            const companyId = GetCompanyId();
            const [vendorRes, billRes, ledgerRes, companyRes] = await Promise.all([
                vendorService.getAllVendors(companyId),
                purchaseBillService.getBills(companyId),
                ledgerService.getAll(companyId),
                companyId ? companyService.getById(companyId) : Promise.resolve(null)
            ]);

            setVendors(vendorRes.data || vendorRes || []);

            if (billRes.success) {
                setBills(billRes.data.filter(b => b.balanceAmount > 0));
            }

            if (ledgerRes.data) {
                setAccounts(ledgerRes.data.data || ledgerRes.data || []);
            }

            if (companyRes && companyRes.data) {
                const data = companyRes.data.data || companyRes.data;
                setCompanyDetails({
                    name: data.name || 'Kiaan Technology',
                    address: data.address || 'Indore, MP',
                    email: data.email || 'info@kiaantechnology.com',
                    phone: data.phone || '97521 00980',
                    logo: data.logo || null,
                    notes: data.notes || '',
                    terms: data.terms || ''
                });
                // Set notes from company if it's a new payment
                if (!editingId && !sourceData) {
                    setNotes(data.notes || '');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load dropdowns");
        }
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            const res = await purchasePaymentService.getPayments(companyId);
            setPayments(res.data || res || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const resetForm = () => {
        setEditingId(null);
        setVendorId('');
        setBillId('');
        setAccountId('');
        setAmount(0);
        setPaymentMeta({ manualNo: '', date: new Date().toISOString().split('T')[0], mode: 'Bank Transfer' });
        setNotes(companyDetails.notes || '');
        setShowAddModal(false);
    };

    const handleAddNew = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleEdit = (id) => {
        const payToEdit = payments.find(p => p.id === id);
        if (payToEdit) {
            setEditingId(id);
            setVendorId(payToEdit.vendorId);
            setBillId(payToEdit.purchaseBillId);
            setAmount(payToEdit.amount);
            setPaymentMeta({
                ...paymentMeta,
                date: payToEdit.date.split('T')[0],
                mode: payToEdit.paymentMode,
                manualNo: payToEdit.paymentNumber
            });
            setShowAddModal(true);
        }
    };

    const handleView = async (payment) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchasePaymentService.getPaymentById(payment.id, companyId);
            if (res && res.data) {
                setViewPayment(res.data);
                setIsViewMode(true);
            } else {
                setViewPayment(payment);
                setIsViewMode(true);
            }
        } catch (error) {
            console.error('Error fetching payment details:', error);
            setViewPayment(payment);
            setIsViewMode(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            await purchasePaymentService.deletePayment(deleteId, companyId);
            toast.success("Payment deleted");
            fetchPayments();
        } catch (error) {
            console.error(error);
            // toast.error("Delete failed");
        }
        setShowDeleteConfirm(false);
        setDeleteId(null);
    };

    const handleSave = async () => {
        if (!vendorId) {
            toast.error("Please select a vendor");
            return;
        }
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const companyId = GetCompanyId();
        const payload = {
            paymentNumber: paymentMeta.manualNo || `PAY-${Date.now()}`,
            vendorId: parseInt(vendorId),
            purchaseBillId: billId ? parseInt(billId) : null,
            date: paymentMeta.date,
            amount: parseFloat(amount),
            paymentMode: paymentMeta.mode,
            companyId: companyId,
            notes: notes
        };

        try {
            if (editingId) {
                await purchasePaymentService.updatePayment(editingId, payload, companyId);
                toast.success("Payment updated successfully");
                setEditingId(null);
                setShowAddModal(false);
                fetchPayments();
            } else {
                await purchasePaymentService.createPayment(payload);
                toast.success("Payment recorded successfully");
                setShowAddModal(false);
                fetchPayments();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to record payment");
        }
    };

    const purchaseProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'purchase-order', label: 'Purchase Order', icon: ShoppingCart, status: 'completed' },
        { id: 'grn', label: 'Goods Receipt', icon: Truck, status: 'completed' },
        { id: 'bill', label: 'Bill', icon: Receipt, status: 'completed' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'active' },
    ];

    return (
        <div className="purchase-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payment</h1>
                    <p className="page-subtitle">Record payments for purchase bills</p>
                </div>
                <button className="btn-add" onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> Record Payment
                </button>
            </div>

            <div className="process-tracker-card">
                <div className="tracker-wrapper">
                    {purchaseProcess.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className={`tracker-step ${step.status}`}>
                                <div className="step-icon-wrapper">
                                    <step.icon size={20} />
                                    {step.status === 'completed' && <CheckCircle2 className="status-badge" size={14} />}
                                    {step.status === 'active' && <Clock className="status-badge" size={14} />}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                            {index < purchaseProcess.length - 1 && (
                                <div className={`tracker-divider ${purchaseProcess[index + 1].status !== 'pending' ? 'active' : ''}`}>
                                    <ArrowRight size={16} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="pp-table-card">
                <div className="pp-table-container">
                    <table className="pp-table">
                        <thead>
                            <tr>
                                <th>PAYMENT ID</th>
                                <th>VENDOR</th>
                                <th>BILL REF</th>
                                <th>DATE</th>
                                <th>MODE</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center p-4">Loading...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan="8" className="text-center p-4">No payments found</td></tr>
                            ) : (
                                payments.map(p => (
                                    <tr key={p.id}>
                                        <td className="pp-id-text">#{p.paymentNumber}</td>
                                        <td className="pp-vendor-text">{p.vendor?.name}</td>
                                        <td>{p.purchasebill?.billNumber || '-'}</td>
                                        <td>{new Date(p.date).toLocaleDateString()}</td>
                                        <td><span className="pp-mode-badge">{p.paymentMode}</span></td>
                                        <td className="pp-amount-text">{formatCurrency(p.amount)}</td>
                                        <td><span className="pp-status-pill completed">Completed</span></td>
                                        <td className="text-right">
                                            <div className="pp-action-buttons">
                                                <button className="pp-btn-icon view" title="View" onClick={() => handleView(p)}><Eye size={16} /></button>
                                                <button className="pp-btn-icon edit" title="Edit" onClick={() => handleEdit(p.id)}><Pencil size={16} /></button>
                                                <button className="pp-btn-icon delete" title="Delete" onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div className="pp-modal-overlay">
                    <div className="pp-modal-container">
                        {/* Header */}
                        <div className="pp-modal-header">
                            <div className="pp-modal-title-area">
                                <h2>Record Payment</h2>
                                <p>Log payment against an invoice</p>
                            </div>
                            <button className="pp-close-x" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="pp-modal-body">
                            {/* Source Selection Area */}
                            {!editingId && (
                                <div className="pp-selection-area">
                                    <label className="pp-selection-label">Select Unpaid Bill</label>
                                    <select
                                        className="pp-select font-medium"
                                        value={billId}
                                        onChange={(e) => handleBillSelect(e.target.value)}
                                    >
                                        <option value="">Search or Select Bill...</option>
                                        {bills.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.billNumber} • {b.vendor?.name} (Balance: {formatCurrency(b.balanceAmount)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Vendor Card */}
                            {vendorId && (
                                <div className="pp-vendor-card">
                                    <div className="pp-avatar">
                                        {vendors.find(v => v.id === parseInt(vendorId))?.profileImage ? (
                                            <img
                                                src={vendors.find(v => v.id === parseInt(vendorId)).profileImage.startsWith('http') ? vendors.find(v => v.id === parseInt(vendorId)).profileImage : `https://invoice-360-demo-production.up.railway.app/${vendors.find(v => v.id === parseInt(vendorId)).profileImage.replace(/\\/g, '/')}`}
                                                alt="Vendor"
                                            />
                                        ) : (
                                            <div className="text-2xl font-bold text-gray-300">
                                                {vendors.find(v => v.id === parseInt(vendorId))?.name?.charAt(0) || 'V'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pp-vendor-info">
                                        <h3>
                                            {vendors.find(v => v.id === parseInt(vendorId))?.name || 'Unknown Vendor'}
                                        </h3>
                                        <div className="pp-vendor-meta">
                                            <span>{vendors.find(v => v.id === parseInt(vendorId))?.billingAddress || 'No address provided'}</span>
                                            <span>{vendors.find(v => v.id === parseInt(vendorId))?.email} • {vendors.find(v => v.id === parseInt(vendorId))?.phone}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form Grid */}
                            <div className="pp-form-grid">
                                <div className="pp-form-group">
                                    <label className="pp-label">Vendor Name</label>
                                    <select
                                        className="pp-select font-medium"
                                        value={vendorId}
                                        onChange={(e) => setVendorId(e.target.value)}
                                        disabled={!!billId}
                                    >
                                        <option value="">Select Vendor...</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pp-form-group">
                                    <label className="pp-label">Payment Date</label>
                                    <input
                                        type="date"
                                        value={paymentMeta.date}
                                        onChange={(e) => setPaymentMeta({ ...paymentMeta, date: e.target.value })}
                                        className="pp-input font-medium"
                                    />
                                </div>

                                <div className="pp-form-group">
                                    <label className="pp-label">Payment Mode</label>
                                    <select
                                        className="pp-select font-medium"
                                        value={paymentMeta.mode}
                                        onChange={(e) => setPaymentMeta({ ...paymentMeta, mode: e.target.value })}
                                    >
                                        <option>Bank Transfer</option>
                                        <option>UPI</option>
                                        <option>Online</option>
                                        <option>Cash</option>
                                        <option>Credit Card</option>
                                    </select>
                                </div>

                                <div className="pp-form-group">
                                    <label className="pp-label">Deposit To (Account)</label>
                                    <select
                                        className="pp-select font-medium"
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                    >
                                        <option value="">Select Account...</option>
                                        {accounts
                                            .filter(acc => {
                                                const selectedVendor = vendors.find(v => v.id === parseInt(vendorId));
                                                return selectedVendor && selectedVendor.ledger && acc.id === selectedVendor.ledger.id;
                                            })
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="pp-form-group">
                                    <label className="pp-label">Reference ID / Check No.</label>
                                    <input
                                        type="text"
                                        value={paymentMeta.manualNo}
                                        placeholder="e.g. TRN-12345678"
                                        onChange={(e) => setPaymentMeta({ ...paymentMeta, manualNo: e.target.value })}
                                        className="pp-input font-medium"
                                    />
                                </div>

                                <div className="pp-form-group">
                                    <label className="pp-label">Amount Paid</label>
                                    <input
                                        type="number"
                                        className="pp-input font-bold text-lg"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>

                                <div className="pp-form-group full-width">
                                    <label className="pp-label">Notes</label>
                                    <textarea
                                        className="pp-textarea"
                                        placeholder="Add internal notes or remarks..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pp-modal-footer">
                            <button className="pp-btn pp-btn-print">
                                <Printer size={18} />
                                Print Receipt
                            </button>
                            <button className="pp-btn pp-btn-cancel" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button className="pp-btn pp-btn-save" onClick={handleSave}>
                                Save Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Receipt View Modal */}
            {isViewMode && viewPayment && (
                <div className="pp-view-modal-overlay">
                    <div className="pp-view-modal-container">
                        <div className="pp-view-modal-header no-print">
                            <h1 className="pp-view-modal-title">Payment Receipt</h1>
                            <div className="pp-view-modal-actions">
                                <button className="pp-view-btn-print" onClick={handlePrint}>
                                    <Printer size={16} /> Print
                                </button>
                                <button className="pp-view-close-btn" onClick={() => setIsViewMode(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="pp-view-modal-body">
                            <div className="pp-receipt-view-container" id="payment-print-area">
                                {/* Receipt Header */}
                                <div className="pp-receipt-header">
                                    <div className="pp-receipt-company-section">
                                        {companyDetails.logo && (
                                            <div className="pp-receipt-logo">
                                                <img src={companyDetails.logo} alt="Logo" />
                                            </div>
                                        )}
                                        <div className="pp-receipt-company-details">
                                            <h2 className="pp-receipt-company-name">{companyDetails.name || 'Kiaan Technology'}</h2>
                                            <p className="pp-receipt-company-text">{companyDetails.email || 'info@kiaantechnology.com'}</p>
                                            <p className="pp-receipt-company-text">{companyDetails.phone || '97521 00980'}</p>
                                            <p className="pp-receipt-company-text">{companyDetails.address || 'Indore, MP'}</p>
                                        </div>
                                    </div>
                                    <div className="pp-receipt-meta-section">
                                        <h1 className="pp-receipt-title">BILL</h1>
                                        <div className="pp-receipt-meta-details">
                                            <p><span className="pp-receipt-meta-label">Number:</span> #{viewPayment.paymentNumber}</p>
                                            <p><span className="pp-receipt-meta-label">Issue:</span> {new Date(viewPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            <p><span className="pp-receipt-meta-label">Due Date:</span> {new Date(viewPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                        <div className="pp-receipt-qr-code">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${viewPayment.paymentNumber || 'Payment'}`} alt="QR Code" />
                                        </div>
                                    </div>
                                </div>

                                {/* Bill To / Ship To Section */}
                                <div className="pp-receipt-addresses">
                                    <div className="pp-receipt-bill-to">
                                        <h3 className="pp-receipt-section-title">BILL TO:</h3>
                                        <p className="pp-receipt-vendor-name">{viewPayment.vendor?.name || 'Ram'}</p>
                                        <p className="pp-receipt-vendor-address">{viewPayment.vendor?.city || 'Indore'}</p>
                                        <p className="pp-receipt-vendor-city">
                                            {viewPayment.vendor?.city || 'Indore'}, {viewPayment.vendor?.state || 'Madhya Pradesh'}, {viewPayment.vendor?.zipCode || '451445'}
                                        </p>
                                    </div>
                                    <div className="pp-receipt-ship-to">
                                        <h3 className="pp-receipt-section-title">SHIP TO:</h3>
                                        <p className="pp-receipt-vendor-name">{viewPayment.vendor?.name || 'Ram'}</p>
                                        <p className="pp-receipt-vendor-address">{viewPayment.vendor?.city || 'Indore'}</p>
                                        <p className="pp-receipt-vendor-city">
                                            {viewPayment.vendor?.city || 'Indore'}, {viewPayment.vendor?.state || 'Madhya Pradesh'}, {viewPayment.vendor?.zipCode || '451445'}
                                        </p>
                                    </div>
                                </div>

                                {/* Totals Section - Moved before Payment Info */}
                                <div className="pp-receipt-totals-section">
                                    <div className="pp-receipt-total-row">
                                        <span className="pp-receipt-total-label">Sub Total</span>
                                        <span className="pp-receipt-total-value">{formatCurrency(viewPayment.amount || 1000)}</span>
                                    </div>
                                    <div className="pp-receipt-total-row">
                                        <span className="pp-receipt-total-label">Tax</span>
                                        <span className="pp-receipt-total-value">{formatCurrency((viewPayment.amount || 1000) * 0.1)}</span>
                                    </div>
                                    <div className="pp-receipt-total-row pp-receipt-total-final">
                                        <span className="pp-receipt-total-label">Total</span>
                                        <span className="pp-receipt-total-value">{formatCurrency((viewPayment.amount || 1000) * 1.1)}</span>
                                    </div>
                                    <div className="pp-receipt-total-row pp-receipt-paid-amount">
                                        <span className="pp-receipt-total-label">Paid Amount</span>
                                        <span className="pp-receipt-total-value">{formatCurrency((viewPayment.amount || 1000) * 1.1)}</span>
                                    </div>
                                    <div className="pp-receipt-total-row pp-receipt-balance-due">
                                        <span className="pp-receipt-total-label">Balance Due</span>
                                        <span className="pp-receipt-total-value">{formatCurrency(0)}</span>
                                    </div>
                                </div>

                                {/* Payment Information */}
                                <div className="pp-receipt-payment-info">
                                    <h3 className="pp-receipt-section-title">PAYMENT INFORMATION</h3>
                                    <div className="pp-receipt-info-grid">
                                        <div className="pp-receipt-info-row">
                                            <span className="pp-receipt-info-label">Payment Method:</span>
                                            <span className="pp-receipt-info-value">{viewPayment.paymentMode || 'BANK'}</span>
                                        </div>
                                        <div className="pp-receipt-info-row">
                                            <span className="pp-receipt-info-label">Payment Date:</span>
                                            <span className="pp-receipt-info-value">{new Date(viewPayment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="pp-receipt-info-row">
                                            <span className="pp-receipt-info-label">Reference Number:</span>
                                            <span className="pp-receipt-info-value">{viewPayment.id || '102'}</span>
                                        </div>
                                        <div className="pp-receipt-info-row">
                                            <span className="pp-receipt-info-label">Amount Received:</span>
                                            <span className="pp-receipt-info-value">{formatCurrency((viewPayment.amount || 1000) * 1.1)}</span>
                                        </div>
                                        <div className="pp-receipt-info-row pp-receipt-status-row">
                                            <span className="pp-receipt-info-label">Invoice Status:</span>
                                            <span className="pp-receipt-status-badge">PAID</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="pp-receipt-notes-section">
                                    <h3 className="pp-receipt-section-title">NOTES</h3>
                                    <p className="pp-receipt-notes-text">
                                        {viewPayment.notes || 'The software generates results based on user input and should be reviewed by a qualified professional before making financial or legal decisions. Access is role-based, and users must keep their login credentials secure. The software provider is not liable for data loss, incorrect entries, or any business decisions made using the system.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="delete-confirmation-box">
                        <div className="delete-modal-header">
                            <h3 className="delete-modal-title">Delete Payment?</h3>
                            <button className="delete-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <p>Are you sure you want to delete this payment record? This action cannot be undone.</p>
                        </div>
                        <div className="delete-modal-footer">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payment;
