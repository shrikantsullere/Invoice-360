import React, { useState, useRef, useContext } from 'react';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Download, Send, Printer,
    FileSearch, Eye
} from 'lucide-react';
import { CompanyContext } from '../../../../context/CompanyContext';
import './SalesOrder.css';
import salesOrderService from '../../../../api/salesOrderService';
import salesQuotationService from '../../../../api/salesQuotationService';
import customerService from '../../../../api/customerService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import servicesService from '../../../../api/servicesService';
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const SalesOrder = () => {
    const { formatCurrency } = useContext(CompanyContext);
    // --- State Management ---
    const [salesOrders, setSalesOrders] = useState([]);
    const [activeQuotations, setActiveQuotations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allWarehouses, setAllWarehouses] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [creationMode, setCreationMode] = useState('direct'); // 'direct' or 'linked'
    const [showQuotationSelect, setShowQuotationSelect] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState(null);

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', notes: '', terms: ''
    });
    const [orderMeta, setOrderMeta] = useState({
        manualNo: '', date: new Date().toISOString().split('T')[0], deliveryDate: ''
    });
    const [customerId, setCustomerId] = useState('');
    const [customerDetails, setCustomerDetails] = useState({ address: '', email: '', phone: '' });
    const [items, setItems] = useState([
        { id: Date.now(), productId: '', serviceId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }
    ]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('');

    // Fetch Initial Data
    React.useEffect(() => {
        fetchData();
        fetchDropdowns();
        fetchCompanyDetails();
    }, []);

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
                    terms: data.terms || ''
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
            const response = await salesOrderService.getAll(companyId);
            if (response.data.success) {
                setSalesOrders(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sales orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const companyId = GetCompanyId();
            const [custRes, prodRes, whRes, servRes, quoRes] = await Promise.all([
                customerService.getAll(companyId),
                productService.getAll(companyId),
                warehouseService.getAll(companyId),
                servicesService.getAll(companyId),
                salesQuotationService.getAll(companyId)
            ]);
            if (custRes.data.success) setCustomers(custRes.data.data);
            if (prodRes.data.success) setAllProducts(prodRes.data.data);
            if (whRes.data.success) setAllWarehouses(whRes.data.data);
            if (servRes.data.success) setAllServices(servRes.data.data);
            if (quoRes.data.success) {
                // Only show quotations that are ACTIVE or SENT (not yet Order/Invoice)
                setActiveQuotations(quoRes.data.data.filter(q => q.status !== 'ACCEPTED'));
            }
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const salesProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'sales-order', label: 'Sales Order', icon: ShoppingCart, status: 'active' },
        { id: 'delivery', label: 'Delivery', icon: Truck, status: 'pending' },
        { id: 'invoice', label: 'Invoice', icon: Receipt, status: 'pending' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'pending' },
    ];

    const sampleQuotations = [
        {
            id: 'QUO-2024-001', customer: 'Acme Corp', date: '2024-01-10', items: [
                { id: 101, name: 'Web Dev Package', warehouse: 'Main', qty: 1, rate: 3000, tax: 18, discount: 0, total: 3540 },
                { id: 102, name: 'SEO Setup', warehouse: 'Service', qty: 1, rate: 1000, tax: 18, discount: 0, total: 1180 }
            ]
        }
    ];

    // --- Actions ---
    const resetForm = () => {
        setEditingId(null);
        setIsViewMode(false);
        setSelectedQuotation(null);
        setCustomerId('');
        setCustomerDetails({ address: '', email: '', phone: '' });
        setItems([{ id: Date.now(), productId: '', serviceId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
        setOrderMeta({ manualNo: '', date: new Date().toISOString().split('T')[0], deliveryDate: '' });
        setNotes(companyDetails.notes || '');
        setTerms(companyDetails.terms || '');
        setCreationMode('direct');
        setShowAddModal(false);
    };

    const handleAddNew = () => {
        resetForm();
        setIsViewMode(false);
        setShowAddModal(true);
    };

    const handleEdit = async (id) => {
        await populateOrder(id, false);
    };

    const handleView = async (id) => {
        await populateOrder(id, true);
    };

    const populateOrder = async (id, viewOnly) => {
        try {
            const companyId = GetCompanyId();
            const response = await salesOrderService.getById(id, companyId);
            if (response.data.success) {
                const orderToEdit = response.data.data;
                resetForm();
                setEditingId(id);
                setIsViewMode(viewOnly);
                setCustomerId(orderToEdit.customerId);
                setCustomerDetails({
                    address: orderToEdit.customer?.billingAddress || '',
                    email: orderToEdit.customer?.email || '',
                    phone: orderToEdit.customer?.phone || ''
                });
                setOrderMeta({
                    manualNo: orderToEdit.orderNumber,
                    date: orderToEdit.date.split('T')[0],
                    deliveryDate: orderToEdit.expectedDate ? orderToEdit.expectedDate.split('T')[0] : ''
                });
                setItems((orderToEdit.salesorderitem || orderToEdit.items || []).map(item => ({
                    id: item.id,
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
                setCreationMode(orderToEdit.quotationId ? 'linked' : 'direct');
                setNotes(orderToEdit.notes || '');
                setTerms(orderToEdit.terms || '');
                setShowAddModal(true);
            }
        } catch (error) {
            console.error('Error loading order:', error);
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            const response = await salesOrderService.delete(deleteId, companyId);
            if (response.data.success) {
                fetchData();
                setShowDeleteConfirm(false);
                setDeleteId(null);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const handleSave = async () => {
        try {
            const companyId = GetCompanyId();
            const data = {
                orderNumber: editingId ? salesOrders.find(o => o.id === editingId)?.orderNumber : `SO-${Date.now()}`,
                date: orderMeta.date,
                expectedDate: orderMeta.deliveryDate,
                customerId: parseInt(customerId),
                companyId: companyId,
                quotationId: selectedQuotation ? parseInt(selectedQuotation.id) : null,
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

            let response;
            if (editingId) {
                response = await salesOrderService.update(editingId, data, companyId);
            } else {
                response = await salesOrderService.create(data);
            }

            if (response.data.success) {
                fetchData();
                setShowAddModal(false);
            }
        } catch (error) {
            console.error('Error saving sales order:', error);
        }
    };


    const handleCreationModeToggle = (mode) => {
        setCreationMode(mode);
        if (mode === 'linked') {
            setShowQuotationSelect(true);
        } else {
            // Reset items but keep customer info if already filled manually? 
            // Ideally reset to clean slate for direct
            if (!editingId) resetForm();
            setCreationMode('direct');
        }
    };

    const handleSelectQuotation = (quo) => {
        setSelectedQuotation(quo);
        setCustomerId(quo.customerId);
        setCustomerDetails({
            address: quo.customer?.billingAddress || '',
            email: quo.customer?.email || '',
            phone: quo.customer?.phone || ''
        });
        const sourceItems = quo.salesquotationitem || quo.items || [];
        setItems(sourceItems.map(item => ({
            id: Date.now() + Math.random(),
            productId: item.productId || '',
            serviceId: item.serviceId || '',
            warehouseId: item.warehouseId || '',
            description: item.description,
            qty: item.quantity,
            rate: item.rate,
            tax: item.taxRate,
            total: item.amount
        })));
        setShowQuotationSelect(false);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', serviceId: '', description: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0 }]);
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
                    const discountAmount = discount;
                    const taxable = subtotal - discountAmount;
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

    return (
        <div className="quotation-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sales Order</h1>
                    <p className="page-subtitle">Track and confirm customer orders</p>
                </div>
                <button className="btn-add" onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> New Sales Order
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
                    <table className="quotation-table">
                        <thead>
                            <tr>
                                <th>ORDER ID</th>
                                <th>CUSTOMER</th>
                                <th>SOURCE</th>
                                <th>DATE</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="font-bold text-blue-600">{order.orderNumber}</td>
                                    <td>{order.customer?.name}</td>
                                    <td><span className="source-badge">{order.quotationId ? 'Quotation' : 'Direct'}</span></td>
                                    <td>{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="font-bold">{formatCurrency(order.totalAmount)}</td>
                                    <td><span className={`sales-order-status-pill ${(order.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{order.status || 'Pending'}</span></td>
                                    <td>
                                        <div className="sales-action-buttons">
                                            <button className="sales-order-action-btn view" onClick={() => handleView(order.id)} title="View"><Eye size={16} /></button>
                                            <button className="sales-order-action-btn edit" onClick={() => handleEdit(order.id)} title="Edit"><Pencil size={16} /></button>
                                            <button className="sales-order-action-btn delete" onClick={() => handleDelete(order.id)} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Create/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content quotation-form-modal">
                        <div className="modal-header-simple">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isViewMode ? 'View Sales Order' : editingId ? 'Edit Sales Order' : 'New Sales Order'}
                            </h2>
                            <button className="close-btn-simple" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body-scrollable">
                            {/* Mode Selection */}
                            <div className="creation-type-selector mb-6">
                                <button
                                    className={`mode-btn ${creationMode === 'direct' ? 'active' : ''}`}
                                    onClick={() => handleCreationModeToggle('direct')}
                                >
                                    Direct Order
                                </button>
                                <button
                                    className={`mode-btn ${creationMode === 'linked' ? 'active' : ''}`}
                                    onClick={() => handleCreationModeToggle('linked')}
                                >
                                    From Quotation
                                </button>
                            </div>

                            {/* Quotation Selection List (Conditional) */}
                            {creationMode === 'linked' && showQuotationSelect && !selectedQuotation && (
                                <div className="quotation-link-container">
                                    <h3 className="text-sm font-bold mb-3 text-gray-700">Select Quotation</h3>
                                    <div className="quote-grid">
                                        {activeQuotations.map(quo => (
                                            <div key={quo.id} className="quote-link-card" onClick={() => handleSelectQuotation(quo)}>
                                                <div className="q-card-header">
                                                    <span className="q-id text-blue-600 font-bold">{quo.quotationNumber}</span>
                                                    <span className="q-date text-gray-400 text-xs">{new Date(quo.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="q-card-body mt-2">
                                                    <span className="q-customer font-semibold">{quo.customer?.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Top Section: Company & Document Meta */}
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
                                    </div>
                                </div>
                                <div className="meta-section">
                                    <div className="meta-row">
                                        <label>Order No.</label>
                                        <input type="text" value={editingId ? salesOrders.find(o => o.id === editingId).orderNumber : "SO-2024-NEW"} disabled className="meta-input disabled" />
                                    </div>
                                    <div className="meta-row">
                                        <label>Manual Ref</label>
                                        <input type="text" placeholder="e.g. PO-REF-001"
                                            value={orderMeta.manualNo} onChange={(e) => setOrderMeta({ ...orderMeta, manualNo: e.target.value })}
                                            className="meta-input" />
                                    </div>
                                    <div className="meta-row">
                                        <label>Order Date</label>
                                        <input type="date"
                                            value={orderMeta.date} onChange={(e) => setOrderMeta({ ...orderMeta, date: e.target.value })}
                                            className="meta-input" />
                                    </div>
                                    <div className="meta-row">
                                        <label>Delivery Due</label>
                                        <input type="date"
                                            value={orderMeta.deliveryDate} onChange={(e) => setOrderMeta({ ...orderMeta, deliveryDate: e.target.value })}
                                            className="meta-input" />
                                    </div>
                                    <div className="status-indicator" style={{ color: '#3b82f6', borderColor: '#3b82f6' }}>
                                        SALES ORDER
                                    </div>
                                </div>
                            </div>

                            <hr className="divider" />

                            {/* Customer Section */}
                            <div className="customer-section">
                                <div className="form-group mb-2">
                                    <label className="form-label-sm">Bill To</label>
                                    <select
                                        className="form-select-large"
                                        value={customerId}
                                        onChange={(e) => {
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
                                        }}
                                        disabled={creationMode === 'linked'}
                                    >
                                        <option value="">Select Customer...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="customer-details-grid">
                                    <input type="text" placeholder="Billing Address" className="detail-input"
                                        disabled={isViewMode}
                                        value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} />
                                    <input type="email" placeholder="Email Address" className="detail-input"
                                        disabled={isViewMode}
                                        value={customerDetails.email} onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })} />
                                    <input type="tel" placeholder="Phone Number" className="detail-input"
                                        disabled={isViewMode}
                                        value={customerDetails.phone} onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })} />
                                </div>
                            </div>

                            {creationMode === 'linked' && selectedQuotation && (
                                <div className="linked-indicator mb-6">
                                    <FileSearch size={14} /> Linked to Quotation: <strong>{selectedQuotation.quotationNumber || selectedQuotation.id}</strong>
                                    <button className="change-link-btn" onClick={() => setShowQuotationSelect(true)}>Change</button>
                                </div>
                            )}

                            {/* Items Table */}
                            <div className="items-section-new">
                                {creationMode === 'direct' && (
                                    <button className="btn-add-row" onClick={addItem}>
                                        <Plus size={14} /> Add Line Item
                                    </button>
                                )}
                                <div className="table-responsive">
                                    <table className="new-items-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '25%' }}>ITEM NAME</th>
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
                                                            disabled={isViewMode || creationMode === 'linked'}
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
                                                        <input type="number" value={item.qty} disabled={creationMode === 'linked'}
                                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                                                            className="qty-input" />
                                                    </td>
                                                    <td>
                                                        <input type="number" value={item.rate} disabled={creationMode === 'linked'}
                                                            onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                                                            className="rate-input" />
                                                    </td>
                                                    <td>
                                                        <input type="number" value={item.tax} disabled={creationMode === 'linked'}
                                                            onChange={(e) => updateItem(item.id, 'tax', e.target.value)}
                                                            className="tax-input" />
                                                    </td>
                                                    <td>
                                                        <input type="number" value={item.discount} disabled={creationMode === 'linked'}
                                                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                                                            className="discount-input" />
                                                    </td>
                                                    <td>
                                                        <input type="text" value={formatCurrency(item.total || 0)} disabled className="amount-input disabled" />
                                                    </td>
                                                    <td className="text-center">
                                                        {creationMode === 'direct' && !isViewMode && (
                                                            <button className="btn-delete-row" onClick={() => removeItem(item.id)}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
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
                                </div>
                            </div>

                            {/* Footer Grid */}
                            <div className="form-footer-grid">
                                <div className="notes-col">
                                    <label className="section-label">Notes</label>
                                    <textarea className="notes-area h-32"
                                        disabled={isViewMode}
                                        value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                                </div>
                                <div className="terms-col">
                                    <label className="section-label">Terms & Conditions</label>
                                    <textarea className="terms-area h-32"
                                        disabled={isViewMode}
                                        value={terms} onChange={(e) => setTerms(e.target.value)}></textarea>
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer-simple">
                            <button className="btn-plain" onClick={() => setShowAddModal(false)}>Close</button>
                            {!isViewMode && (
                                <button className="btn-primary-green" onClick={handleSave}>
                                    {editingId ? 'Update Order' : 'Confirm Order'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal - User Design Match */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="delete-confirmation-box">
                        <div className="delete-modal-header">
                            <h3 className="delete-modal-title">Delete Order?</h3>
                            <button className="delete-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <p>Are you sure you want to delete this sales order? This action cannot be undone.</p>
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

export default SalesOrder;
