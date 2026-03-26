import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { CompanyContext } from '../../../../context/CompanyContext';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Download, Send, Printer,
    Eye, Copy, ArrowLeft, AlertTriangle
} from 'lucide-react';
import './Invoice.css';
import salesInvoiceService from '../../../../api/salesInvoiceService';
import salesOrderService from '../../../../api/salesOrderService';
import customerService from '../../../../api/customerService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import servicesService from '../../../../api/servicesService';
import companyService from '../../../../api/companyService';
import deliveryChallanService from '../../../../api/deliveryChallanService';
import GetCompanyId from '../../../../api/GetCompanyId';
import fullLogo from '../../../../assets/Images/image.png';

const Invoice = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const location = useLocation();
    // --- State Management ---
    const [invoices, setInvoices] = useState([]);
    const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');
    const [activeOrders, setActiveOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allWarehouses, setAllWarehouses] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // View Request State
    const [viewMode, setViewMode] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null); // Add this line

    const [creationMode, setCreationMode] = useState('direct');

    const handleEdit = async (invoice) => {
        try {
            const companyId = GetCompanyId();
            const response = await salesInvoiceService.getById(invoice.id, companyId);
            if (response.data.success) {
                const inv = response.data.data;
                setEditingId(inv.id);
                setCustomerId(inv.customerId);
                if (inv.customer) {
                    setCustomerDetails({
                        address: inv.customer.billingAddress || '',
                        email: inv.customer.email || '',
                        phone: inv.customer.phone || ''
                    });
                }
                setInvoiceMeta({
                    manualNo: inv.invoiceNumber,
                    date: new Date(inv.date).toISOString().split('T')[0],
                    dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
                    depositEnabled: inv.depositEnabled || false,
                    depositType: inv.depositType || 'FIXED',
                    depositValue: inv.depositValue || 0,
                    depositPercentage: inv.depositPercentage || 0,
                    depositAmount: inv.depositAmount || 0,
                    currency: inv.currency || companyDetails.currency || 'ZAR' // Use company currency if invoice one is missing
                });
                setNotes(inv.notes || '');
                setItems((inv.invoiceitem || inv.items || []).map(i => ({
                    id: i.id,
                    productId: i.productId,
                    serviceId: i.serviceId,
                    warehouseId: i.warehouseId,
                    description: i.description,
                    qty: i.quantity,
                    rate: i.rate,
                    tax: i.taxRate,
                    discount: i.discount,
                    total: i.amount
                })));
                setShowAddModal(true);
            }
        } catch (error) {
            console.error('Error fetching invoice for edit:', error);
        }
    };

    const handleUpdate = async () => {
        try {
            if (!editingId) return;

            const companyId = GetCompanyId();
            const data = {
                invoiceNumber: invoiceMeta.manualNo,
                date: invoiceMeta.date,
                dueDate: invoiceMeta.dueDate,
                depositEnabled: invoiceMeta.depositEnabled,
                depositType: invoiceMeta.depositType,
                depositValue: parseFloat(invoiceMeta.depositValue) || 0,
                depositPercentage: 0, // Backend calculates
                depositAmount: 0,     // Backend calculates
                customerId: parseInt(customerId),
                companyId: parseInt(companyId),
                notes: notes,
                items: items.map(item => ({
                    productId: item.productId ? parseInt(item.productId) : null,
                    serviceId: item.serviceId ? parseInt(item.serviceId) : null,
                    warehouseId: item.warehouseId ? parseInt(item.warehouseId) : null,
                    description: item.description,
                    quantity: parseFloat(item.qty),
                    rate: parseFloat(item.rate),
                    discount: parseFloat(item.discount) || 0,
                    taxRate: parseFloat(item.tax)
                }))
            };

            const response = await salesInvoiceService.update(editingId, data, companyId);
            if (response.data.success) {
                fetchData();
                resetForm();
                setEditingId(null);
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
        }
    };
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedChallan, setSelectedChallan] = useState(null);
    const [activeChallans, setActiveChallans] = useState([]);
    const [showSelectionModal, setShowSelectionModal] = useState(false);

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', logo: null, notes: '', terms: '', showQr: true
    });
    const [invoiceMeta, setInvoiceMeta] = useState({
        manualNo: '', date: new Date().toISOString().split('T')[0], dueDate: '',
        depositEnabled: false, depositType: 'FIXED', depositValue: 0, depositAmount: 0,
        currency: 'ZAR'
    });
    const [customerId, setCustomerId] = useState('');
    const [customerDetails, setCustomerDetails] = useState({ address: '', email: '', phone: '' });
    const [items, setItems] = useState([
        { id: Date.now(), productId: '', serviceId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }
    ]);

    // Initial Fetch
    useEffect(() => {
        fetchData();
        fetchDropdowns();
        fetchCompanyDetails();
    }, []);

    // Handle Deep Link from Navigation State
    useEffect(() => {
        if (location.state && location.state.targetInvoiceId) {
            const fetchTarget = async () => {
                try {
                    const response = await salesInvoiceService.getById(location.state.targetInvoiceId);
                    if (response.data.success) {
                        setSelectedInvoice(response.data.data);
                        setViewMode(true);
                    }
                } catch (error) {
                    console.error("Error loading target invoice", error);
                }
            };
            fetchTarget();
            // Clear state to prevent reopening on refresh if needed, 
            // but standard behavior is fine.
        }
    }, [location.state]);

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
                    terms: data.terms || '',
                    showQr: data.showQrCode !== undefined ? data.showQrCode : true,
                    template: data.invoiceTemplate || 'New York',
                    color: data.invoiceColor || '#004aad'
                });
                setNotes(data.notes || '');
                setTerms(data.terms || '');
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const response = await salesInvoiceService.getAll(companyId);

            if (response.data.success) {
                setInvoices(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const companyId = GetCompanyId();
            const [custRes, prodRes, whRes, servRes, orderRes, challanRes] = await Promise.all([
                customerService.getAll(companyId),
                productService.getAll(companyId),
                warehouseService.getAll(companyId),
                servicesService.getAll(companyId),
                salesOrderService.getAll(companyId),
                deliveryChallanService.getAll(companyId)
            ]);
            if (custRes.data.success) setCustomers(custRes.data.data);
            if (prodRes.data.success) setAllProducts(prodRes.data.data);
            if (whRes.data.success) setAllWarehouses(whRes.data.data);
            if (servRes.data.success) setAllServices(servRes.data.data);
            if (orderRes.data.success) {
                setActiveOrders(orderRes.data.data.filter(o => o.status !== 'COMPLETED'));
            }
            if (challanRes.data.success) {
                setActiveChallans(challanRes.data.data.filter(c => c.status !== 'COMPLETED'));
            }
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    // Footer
    const [bankDetails, setBankDetails] = useState({
        bankName: 'HDFC Bank',
        accNo: '50200012345678',
        holderName: 'Kiaan Technology',
        ifsc: 'HDFC0000456'
    });

    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('"Payment is due within 15 days.",\n"Late payments are subject to interest."');

    const resetForm = () => {
        setCustomerId('');
        setCustomerDetails({ address: '', email: '', phone: '' });
        setInvoiceMeta({
            manualNo: '', date: new Date().toISOString().split('T')[0], dueDate: '',
            depositEnabled: false, depositType: 'FIXED', depositValue: 0, depositAmount: 0,
            currency: companyDetails.currency || 'ZAR'
        });
        setItems([{ id: Date.now(), productId: '', serviceId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
        setNotes(companyDetails.notes || '');
        setTerms(companyDetails.terms || '');
        setCreationMode('direct');
        setSelectedOrder(null);
        setSelectedChallan(null);
        setShowSelectionModal(false);
        setShowAddModal(false);
    };

    const handleAddNew = async () => {
        resetForm();
        setShowSelectionModal(true);
        try {
            const companyId = GetCompanyId();
            if (companyId) {
                const res = await salesInvoiceService.getNextNumber(companyId);
                if (res.data.success) {
                    setNextInvoiceNumber(res.data.nextNumber);
                    // Also set manualNo as fallback if needed, or just let backend handle if empty
                    setInvoiceMeta(prev => ({ ...prev, manualNo: res.data.nextNumber }));
                }
            }
        } catch (error) {
            console.error('Error fetching next invoice number:', error);
        }
    };

    const salesProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'sales-order', label: 'Sales Order', icon: ShoppingCart, status: 'completed' },
        { id: 'delivery', label: 'Delivery', icon: Truck, status: 'completed' },
        { id: 'invoice', label: 'Invoice', icon: Receipt, status: 'active' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'pending' },
    ];

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', serviceId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (['qty', 'rate', 'tax', 'discount'].includes(field)) {
                    const qty = parseFloat(updatedItem.qty) || 0;
                    const rate = parseFloat(updatedItem.rate) || 0;
                    const tax = parseFloat(updatedItem.tax) || 0;
                    const discount = parseFloat(updatedItem.discount) || 0;

                    const subtotal = qty * rate;
                    const taxable = subtotal - discount;
                    const taxAmount = (taxable * tax) / 100;

                    updatedItem.total = taxable + taxAmount;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        return items.reduce((acc, item) => {
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            const discount = parseFloat(item.discount) || 0;
            const subtotal = qty * rate;

            acc.subTotal += subtotal;
            acc.discount += discount;
            acc.total += item.total;
            acc.tax += (item.total - (subtotal - discount));
            return acc;
        }, { subTotal: 0, tax: 0, discount: 0, total: 0 });
    };

    const totals = calculateTotals();

    // Helper to get status class
    const getStatusClass = (status) => {
        switch (status) {
            case 'Partially Paid': return 'partial';
            case 'Paid': return 'paid';
            case 'Sent': return 'sent';
            case 'Overdue': return 'overdue';
            default: return 'pending';
        }
    };

    // --- Actions Handlers ---

    const handleView = async (invoice) => {
        try {
            const companyId = GetCompanyId();
            const response = await salesInvoiceService.getById(invoice.id, companyId);
            if (response.data.success) {
                setSelectedInvoice(response.data.data);
                setViewMode(true);
            } else {
                // Fallback to invoice data if fetch fails
                setSelectedInvoice(invoice);
                setViewMode(true);
            }
        } catch (error) {
            console.error('Error fetching invoice details:', error);
            // Fallback to invoice data
            setSelectedInvoice(invoice);
            setViewMode(true);
        }
    };

    const handleSave = async () => {
        try {
            const companyId = GetCompanyId();
            const data = {
                invoiceNumber: invoiceMeta.manualNo || `INV-${Date.now()}`,
                date: invoiceMeta.date,
                dueDate: invoiceMeta.dueDate,
                depositEnabled: invoiceMeta.depositEnabled,
                depositType: invoiceMeta.depositType,
                depositValue: parseFloat(invoiceMeta.depositValue) || 0,
                depositPercentage: 0, // Backend calculates
                depositAmount: 0,     // Backend calculates
                customerId: parseInt(customerId),
                companyId: parseInt(companyId),
                salesOrderId: selectedOrder ? parseInt(selectedOrder.id) : null,
                deliveryChallanId: selectedChallan ? parseInt(selectedChallan.id) : null,
                notes: notes,
                items: items.map(item => ({
                    productId: item.productId ? parseInt(item.productId) : null,
                    serviceId: item.serviceId ? parseInt(item.serviceId) : null,
                    warehouseId: item.warehouseId ? parseInt(item.warehouseId) : null,
                    description: item.description || (item.productId ? allProducts.find(p => p.id === parseInt(item.productId))?.name : ''),
                    quantity: parseFloat(item.qty),
                    rate: parseFloat(item.rate),
                    discount: parseFloat(item.discount) || 0,
                    taxRate: parseFloat(item.tax)
                }))
            };

            const response = await salesInvoiceService.create(data);
            if (response.data.success) {
                fetchData();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
        }
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        setCustomerId(order.customerId);
        setCustomerDetails({
            address: order.customer?.billingAddress || '',
            email: order.customer?.email || '',
            phone: order.customer?.phone || ''
        });
        const sourceItems = order.salesorderitem || order.items || [];
        setItems(sourceItems.map(item => ({
            id: Date.now() + Math.random(),
            productId: item.productId || '',
            serviceId: item.serviceId || '',
            warehouseId: item.warehouseId || '',
            description: item.description,
            qty: item.quantity,
            rate: item.rate,
            tax: item.taxRate,
            discount: item.discount || 0,
            total: item.amount
        })));
        setCreationMode('salesorder');
        setShowSelectionModal(false);
    };

    const handleSelectChallan = (challan) => {
        setSelectedChallan(challan);
        setSelectedOrder(null);
        setCustomerId(challan.customerId);
        setCustomerDetails({
            address: challan.customer?.shippingAddress || challan.customer?.billingAddress || '',
            email: challan.customer?.email || '',
            phone: challan.customer?.phone || ''
        });

        // Match items with Sales Order to get rates/tax
        const soItems = challan.salesOrder?.salesorderitem || challan.salesOrder?.items || [];

        const sourceChallanItems = challan.deliverychallanitem || challan.items || [];
        setItems(sourceChallanItems.map(item => {
            const matchedSOItem = soItems.find(soi => soi.productId === item.productId);
            const rate = matchedSOItem?.rate || 0;
            const tax = matchedSOItem?.taxRate || 0;
            const disc = matchedSOItem?.discount || 0;
            const qty = item.quantity;

            const taxable = (rate * qty) - disc;
            const total = taxable + (taxable * tax / 100);

            return {
                id: Date.now() + Math.random(),
                productId: item.productId || '',
                serviceId: '',
                warehouseId: item.warehouseId || '',
                description: item.description || matchedSOItem?.description || '',
                qty: qty,
                rate: rate,
                tax: tax,
                discount: disc,
                total: total
            };
        }));
        setCreationMode('challan');
        setShowSelectionModal(false);
    };

    const handleDelete = (invoice) => {
        setInvoiceToDelete(invoice);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (invoiceToDelete) {
            try {
                const companyId = GetCompanyId();
                await salesInvoiceService.delete(invoiceToDelete.id, companyId);
                setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete.id));
                setShowDeleteModal(false);
                setInvoiceToDelete(null);
                if (viewMode) setViewMode(false);
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };



    const handlePrint = () => {
        window.print();
    };

    // --- RENDER FULL PAGE VIEW IF IN VIEW MODE ---
    if (viewMode && selectedInvoice) {
        return (
            <div className="invoice-full-page-view">
                <div className="view-page-header no-print">
                    <button className="btn-back" onClick={() => setViewMode(false)}>
                        <ArrowLeft size={18} /> Back to Invoices
                    </button>
                    <div className="view-actions">
                        <button className="btn-print" onClick={handlePrint}>
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                <div className="view-content-wrapper printable-area">
                    <div
                        className={`invoice-preview-container template-${(companyDetails.template || 'newyork').toLowerCase().replace(/\s+/g, '')}`}
                        id="invoice-print-content"
                        style={{ '--header-bg': companyDetails.color || '#004aad' }}
                    >
                        <div className="invoice-header-wrapper">
                            <div className="invoice-preview-header">
                                <div className="invoice-header-left">
                                    {companyDetails.logo || fullLogo ? (
                                        <img src={companyDetails.logo || fullLogo} alt="Company Logo" className="invoice-logo-large" />
                                    ) : (
                                        <h2 style={{ color: companyDetails.color, margin: 0, textTransform: 'uppercase' }}>{companyDetails.name}</h2>
                                    )}

                                    <div className="invoice-company-details">
                                        <strong>{companyDetails.name}</strong><br />
                                        {companyDetails.email}<br />
                                        {companyDetails.phone}<br />
                                        {companyDetails.address}
                                    </div>
                                </div>
                                <div className="invoice-header-right">
                                    <div className="invoice-title-large">INVOICE</div>
                                    <div className="invoice-meta-info">
                                        <div className="invoice-meta-row">
                                            <span className="invoice-label">Number:</span> #{selectedInvoice?.invoiceNumber || 'N/A'}
                                        </div>
                                        <div className="invoice-meta-row">
                                            <span className="invoice-label">Issue:</span> {selectedInvoice?.date ? new Date(selectedInvoice.date).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="invoice-meta-row">
                                            <span className="invoice-label">Due Date:</span> {selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    {companyDetails.showQr && (
                                        <div className="invoice-qr-box">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedInvoice?.invoiceNumber || 'Invoice'}`} alt="QR" className="invoice-qr-code" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="invoice-addresses">
                            <div className="invoice-bill-to">
                                <div className="invoice-section-header">Bill To:</div>
                                <div>{selectedInvoice?.customer?.billingName || selectedInvoice?.customer?.name || 'N/A'}</div>
                                <div>{selectedInvoice?.customer?.billingAddress}</div>
                                <div>
                                    {[selectedInvoice?.customer?.billingCity, selectedInvoice?.customer?.billingState, selectedInvoice?.customer?.billingZipCode].filter(Boolean).join(', ')}
                                </div>
                            </div>
                            <div className="invoice-ship-to" style={{ textAlign: 'right' }}>
                                <div className="invoice-section-header">Ship To:</div>
                                <div>{selectedInvoice?.customer?.shippingName || selectedInvoice?.customer?.name || 'N/A'}</div>
                                <div>{selectedInvoice?.customer?.shippingAddress || selectedInvoice?.customer?.billingAddress}</div>
                                <div>
                                    {[selectedInvoice?.customer?.shippingCity, selectedInvoice?.customer?.shippingState, selectedInvoice?.customer?.shippingZipCode].filter(Boolean).join(', ')}
                                </div>
                            </div>
                        </div>

                        <table className="invoice-table-preview">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Warehouse</th>
                                    <th>Quantity</th>
                                    <th>Rate</th>
                                    <th>Discount</th>
                                    <th>Tax (%)</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
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
                                        <td>{item.quantity}</td>
                                        <td>{formatCurrency(item.rate)}</td>
                                        <td>{formatCurrency(item.discount)}</td>
                                        <td>{item.taxRate}%</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="invoice-total-section">
                            <div className="invoice-totals">
                                <div className="invoice-total-row">
                                    <span>Sub Total</span>
                                    <span>{formatCurrency(Object.values(selectedInvoice?.invoiceitem || selectedInvoice?.items || []).reduce((acc, item) => acc + (item.quantity * item.rate), 0))}</span>
                                </div>
                                <div className="invoice-total-row">
                                    <span>Tax</span>
                                    <span>{formatCurrency(selectedInvoice?.taxAmount || 0)}</span>
                                </div>
                                <div className="invoice-final-total">
                                    <span>Total</span>
                                    <span>{formatCurrency(selectedInvoice?.totalAmount || 0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {companyDetails.notes && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <h3 className="invoice-section-header">Notes</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{companyDetails.notes}</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>
        );
    }

    // --- DEFAULT RENDER (LIST) ---
    return (
        <div className="invoice-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="page-subtitle">Manage billing and payments</p>
                </div>
                <button className="btn-add" onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> CREATE INVOICE
                </button>
            </div>

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
                <div className="table-container">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>INVOICE</th>
                                <th>CUSTOMER</th>
                                <th>ISSUE DATE</th>
                                <th>DUE DATE</th>
                                <th>AMOUNT DUE</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="font-bold text-blue-600 cursor-pointer" onClick={() => handleView(inv)}>{inv.invoiceNumber}</td>
                                    <td>{inv.customer?.name}</td>
                                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                    <td className="font-bold">{formatCurrency(inv.balanceAmount)}</td>
                                    <td><span className={`invoice-status-pill ${(inv.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{inv.status || 'Pending'}</span></td>
                                    <td className="text-right">
                                        <div className="invoice-action-buttons">
                                            <button className="invoice-action-btn view" onClick={() => handleView(inv)}><Eye size={16} /></button>
                                            <button className="invoice-action-btn edit" onClick={() => handleEdit(inv)}><Pencil size={16} /></button>
                                            <button className="invoice-action-btn delete" onClick={() => handleDelete(inv)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Create Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content invoice-form-modal">
                        <div className="modal-header-simple">
                            <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Invoice' : 'New Invoice'}</h2>
                            <button className="close-btn-simple" onClick={() => { setShowAddModal(false); resetForm(); setEditingId(null); }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body-scrollable">
                            {/* ... (Existing Create Modal Content) ... */}
                            {/* Top Section */}
                            <div className="form-section-grid">
                                <div className="company-section">
                                    <div className="logo-upload-box">
                                        {companyDetails.logo ? (
                                            <img src={companyDetails.logo} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: '50px', objectFit: 'contain' }} />
                                        ) : (
                                            <h1 className="company-logo-text">BOOK</h1>
                                        )}
                                    </div>
                                    <div className="company-inputs">
                                        <input type="text" className="full-width-input user-editable"
                                            value={companyDetails.name} onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })} />
                                        <input type="text" className="full-width-input user-editable"
                                            value={companyDetails.address} onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })} />
                                        <input type="text" className="full-width-input user-editable"
                                            value={companyDetails.email} onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })} />
                                        <input type="text" className="full-width-input user-editable"
                                            value={companyDetails.phone} onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="meta-section">
                                    <div className="meta-row">
                                        <label>Invoice No.</label>
                                        <input type="text"
                                            value={invoiceMeta.manualNo}
                                            onChange={(e) => setInvoiceMeta({ ...invoiceMeta, manualNo: e.target.value })}
                                            placeholder="Auto-Generated"
                                            className="meta-input" />
                                    </div>
                                    <div className="meta-row">
                                        <label>Date</label>
                                        <input type="date"
                                            value={invoiceMeta.date} onChange={(e) => setInvoiceMeta({ ...invoiceMeta, date: e.target.value })}
                                            className="meta-input" />
                                    </div>
                                    <div className="meta-row">
                                        <label>Currency</label>
                                        <select
                                            value={invoiceMeta.currency}
                                            onChange={(e) => setInvoiceMeta({ ...invoiceMeta, currency: e.target.value })}
                                            className="meta-input"
                                            style={{ padding: '0.25rem' }}
                                        >
                                            <option value="ZAR">ZAR (R)</option>
                                            <option value="NAD">NAD (N$)</option>
                                            <option value="BWP">BWP (P)</option>
                                            <option value="LSL">LSL (L)</option>
                                            <option value="SZL">SZL (E)</option>
                                            <option value="ZMW">ZMW (ZK)</option>
                                            <option value="ZiG">ZiG</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="MZN">MZN (MT)</option>
                                            <option value="MWK">MWK (MK)</option>
                                            <option value="AOA">AOA (Kz)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="INR">INR (₹)</option>
                                        </select>
                                    </div>
                                    <div className="meta-row">
                                        <label>Due Date</label>
                                        <input type="date"
                                            value={invoiceMeta.dueDate} onChange={(e) => setInvoiceMeta({ ...invoiceMeta, dueDate: e.target.value })}
                                            className="meta-input" />
                                    </div>
                                    <div className="status-indicator" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                        UNPAID
                                    </div>
                                </div>
                            </div>
                            <hr className="divider" />
                            {/* Customer Section */}
                            <div className="customer-section">
                                <div className="form-group mb-2">
                                    <label className="form-label-sm">Bill To</label>
                                    <select className="form-select-large" value={customerId} onChange={(e) => {
                                        const id = e.target.value;
                                        setCustomerId(id);
                                        const c = customers.find(cust => cust.id === parseInt(id));
                                        if (c) {
                                            setCustomerDetails({
                                                address: c.billingAddress || '',
                                                email: c.email || '',
                                                phone: c.phone || ''
                                            });
                                        }
                                    }}>
                                        <option value="">Select Customer...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="customer-details-grid">
                                    <input type="text" placeholder="Billing Address" className="detail-input"
                                        value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} />
                                    <input type="email" placeholder="Email Address" className="detail-input"
                                        value={customerDetails.email} onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })} />
                                    <input type="tel" placeholder="Phone Number" className="detail-input"
                                        value={customerDetails.phone} onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })} />
                                </div>
                            </div>
                            {/* Items Table */}
                            <div className="items-section-new">
                                <button className="btn-add-row" onClick={addItem}>
                                    <Plus size={14} /> Add Line Item
                                </button>
                                <div className="table-responsive">
                                    <table className="new-items-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '25%' }}>ITEM DETAIL</th>
                                                <th style={{ width: '15%' }}>WAREHOUSE</th>
                                                <th style={{ width: '10%' }}>QTY</th>
                                                <th style={{ width: '12%' }}>RATE</th>
                                                <th style={{ width: '10%' }}>TAX %</th>
                                                <th style={{ width: '10%' }}>DISC.</th>
                                                <th style={{ width: '12%' }}>AMOUNT</th>
                                                <th style={{ width: '6%' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <select className="full-width-input"
                                                            value={item.productId ? `p-${item.productId}` : item.serviceId ? `s-${item.serviceId}` : ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val.startsWith('p-')) {
                                                                    const pId = val.split('-')[1];
                                                                    const p = allProducts.find(x => x.id === parseInt(pId));
                                                                    if (p) {
                                                                        updateItem(item.id, 'productId', pId);
                                                                        updateItem(item.id, 'serviceId', '');
                                                                        updateItem(item.id, 'rate', p.sellPrice || 0);
                                                                        updateItem(item.id, 'tax', p.taxRate || 0);
                                                                        if (!item.description) updateItem(item.id, 'description', p.name);
                                                                    }
                                                                } else if (val.startsWith('s-')) {
                                                                    const sId = val.split('-')[1];
                                                                    const s = allServices.find(x => x.id === parseInt(sId));
                                                                    if (s) {
                                                                        updateItem(item.id, 'serviceId', sId);
                                                                        updateItem(item.id, 'productId', '');
                                                                        updateItem(item.id, 'rate', s.price || 0);
                                                                        if (!item.description) updateItem(item.id, 'description', s.name);
                                                                    }
                                                                }
                                                            }}>
                                                            <option value="">Select Product/Service...</option>
                                                            <optgroup label="Products">
                                                                {allProducts.map(p => <option key={`p-${p.id}`} value={`p-${p.id}`}>{p.name}</option>)}
                                                            </optgroup>
                                                            <optgroup label="Services">
                                                                {allServices.map(s => <option key={`s-${s.id}`} value={`s-${s.id}`}>{s.name}</option>)}
                                                            </optgroup>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select className="full-width-input" value={item.warehouseId} onChange={(e) => updateItem(item.id, 'warehouseId', e.target.value)}>
                                                            <option value="">Select Warehouse...</option>
                                                            {allWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input type="number" className="qty-input" value={item.qty}
                                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)} />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="rate-input" value={item.rate}
                                                            onChange={(e) => updateItem(item.id, 'rate', e.target.value)} />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="tax-input" value={item.tax}
                                                            onChange={(e) => updateItem(item.id, 'tax', e.target.value)} />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="discount-input" value={item.discount}
                                                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)} />
                                                    </td>
                                                    <td>
                                                        <input type="text" className="amount-input disabled" value={formatCurrency(item.total || 0)} disabled />
                                                    </td>
                                                    <td className="text-center">
                                                        <button className="btn-delete-row" onClick={() => removeItem(item.id)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Totals Section */}
                            <div className="totals-layout">
                                <div className="totals-spacer"></div>
                                <div className="totals-box">
                                    <div className="t-row">
                                        <span>Sub Total:</span>
                                        <span>{formatCurrency(totals.subTotal)}</span>
                                    </div>
                                    <div className="t-row">
                                        <span>Discount:</span>
                                        <span className="text-red-500">-{formatCurrency(totals.discount)}</span>
                                    </div>
                                    <div className="t-row">
                                        <span>Tax Total:</span>
                                        <span>{formatCurrency(totals.tax)}</span>
                                    </div>
                                    <div className="t-row total">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(totals.total)}</span>
                                    </div>
                                    <div className="t-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e5e7eb' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={invoiceMeta.depositEnabled}
                                                        onChange={(e) => setInvoiceMeta({ ...invoiceMeta, depositEnabled: e.target.checked })}
                                                    />
                                                    Enable Deposit
                                                </label>
                                            </div>

                                            {invoiceMeta.depositEnabled && (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                                    <select
                                                        value={invoiceMeta.depositType}
                                                        onChange={(e) => setInvoiceMeta({ ...invoiceMeta, depositType: e.target.value })}
                                                        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 5px', fontSize: '0.8rem' }}
                                                    >
                                                        <option value="PERCENTAGE">Percentage (%)</option>
                                                        <option value="FIXED">Fixed Amount</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        placeholder="Value"
                                                        className="text-right"
                                                        style={{ width: '100px', border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 5px' }}
                                                        value={invoiceMeta.depositValue || ''}
                                                        onChange={(e) => setInvoiceMeta({ ...invoiceMeta, depositValue: parseFloat(e.target.value) || 0 })}
                                                    />
                                                </div>
                                            )}

                                            {invoiceMeta.depositEnabled && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4b5563' }}>
                                                    <span>Deposit Amount:</span>
                                                    <span>
                                                        {formatCurrency(
                                                            invoiceMeta.depositType === 'PERCENTAGE'
                                                                ? (totals.total * (invoiceMeta.depositValue || 0)) / 100
                                                                : (invoiceMeta.depositValue || 0)
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#004aad', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                                                <span>Balance Due:</span>
                                                <span>
                                                    {formatCurrency(
                                                        totals.total - (
                                                            invoiceMeta.depositEnabled
                                                                ? (invoiceMeta.depositType === 'PERCENTAGE'
                                                                    ? (totals.total * (invoiceMeta.depositValue || 0)) / 100
                                                                    : (invoiceMeta.depositValue || 0))
                                                                : 0
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Footer Grid */}
                            <div className="form-footer-grid">
                                <div className="bank-terms-col">
                                    <label className="section-label">Bank Details</label>
                                    <div className="bank-details-box">
                                        <input type="text" className="bank-input" placeholder="Bank Name" value={bankDetails.bankName} onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })} />
                                        <input type="text" className="bank-input" placeholder="Account No" value={bankDetails.accNo} onChange={(e) => setBankDetails({ ...bankDetails, accNo: e.target.value })} />
                                        <input type="text" className="bank-input" placeholder="Account Holder" value={bankDetails.holderName} onChange={(e) => setBankDetails({ ...bankDetails, holderName: e.target.value })} />
                                        <input type="text" className="bank-input" placeholder="IFSC / Swift" value={bankDetails.ifsc} onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value })} />
                                    </div>
                                    <div className="mt-4">
                                        <label className="section-label">Attachments</label>
                                        <div className="attachments-row">
                                            <button className="btn-upload-small">
                                                <span className="icon">📷</span> Photos
                                            </button>
                                            <button className="btn-upload-small">
                                                <span className="icon">📎</span> Files
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="notes-col">
                                    <label className="section-label">Notes</label>
                                    <textarea className="notes-area" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className="terms-section mt-4">
                                <label className="section-label">Terms & Conditions</label>
                                <textarea className="terms-area" value={terms} onChange={(e) => setTerms(e.target.value)} />
                            </div>
                        </div>
                        <div className="modal-footer-simple">
                            <button className="btn-plain" onClick={() => { setShowAddModal(false); resetForm(); setEditingId(null); }}>Cancel</button>
                            <button className="btn-primary-green" onClick={editingId ? handleUpdate : handleSave}>
                                {editingId ? 'Update Invoice' : 'Generate Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Selection Modal */}
            {showSelectionModal && (
                <div className="modal-overlay">
                    <div className="modal-content selection-modal-small">
                        <div className="modal-header-simple">
                            <h2 className="text-xl font-bold">Select Invoice Source</h2>
                            <button className="close-btn-simple" onClick={() => setShowSelectionModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="selection-grid-p">
                            <button className="sel-btn-p" onClick={() => { setCreationMode('direct'); setShowSelectionModal(false); setShowAddModal(true); }}>
                                <div className="sel-icon-p"><FileText /></div>
                                <div className="sel-text-p">
                                    <strong>Direct Invoice</strong>
                                    <span>Create manually without link</span>
                                </div>
                            </button>
                            <button className="sel-btn-p" onClick={() => setCreationMode('select_so')}>
                                <div className="sel-icon-p"><ShoppingCart /></div>
                                <div className="sel-text-p">
                                    <strong>From Sales Order</strong>
                                    <span>Fetch data from existing order</span>
                                </div>
                            </button>
                            <button className="sel-btn-p" onClick={() => setCreationMode('select_dc')}>
                                <div className="sel-icon-p"><Truck /></div>
                                <div className="sel-text-p">
                                    <strong>From Delivery Challan</strong>
                                    <span>Fetch data from delivery note</span>
                                </div>
                            </button>
                        </div>

                        {creationMode === 'select_so' && (
                            <div className="source-list-container">
                                <h3 className="section-title-s">Pick a Sales Order</h3>
                                <div className="source-items-list">
                                    {activeOrders.map(order => (
                                        <div key={order.id} className="source-item-row" onClick={() => { handleSelectOrder(order); setShowAddModal(true); }}>
                                            <div className="source-info">
                                                <span className="source-id">{order.orderNumber}</span>
                                                <span className="source-cust">{order.customer?.name}</span>
                                            </div>
                                            <div className="source-meta">
                                                <span>{new Date(order.date).toLocaleDateString()}</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-back-sel" onClick={() => setCreationMode('direct')}>Back</button>
                            </div>
                        )}

                        {creationMode === 'select_dc' && (
                            <div className="source-list-container">
                                <h3 className="section-title-s">Pick a Delivery Challan</h3>
                                <div className="source-items-list">
                                    {activeChallans.map(dc => (
                                        <div key={dc.id} className="source-item-row" onClick={() => { handleSelectChallan(dc); setShowAddModal(true); }}>
                                            <div className="source-info">
                                                <span className="source-id">{dc.challanNumber}</span>
                                                <span className="source-cust">{dc.customer?.name}</span>
                                            </div>
                                            <div className="source-meta">
                                                <span>{new Date(dc.date).toLocaleDateString()}</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-back-sel" onClick={() => setCreationMode('direct')}>Back</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoice;