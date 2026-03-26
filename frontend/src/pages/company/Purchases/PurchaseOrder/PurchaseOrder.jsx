import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Printer, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CompanyContext } from '../../../../context/CompanyContext';
import '../Purchase.css';
import purchaseOrderService from '../../../../services/purchaseOrderService';
import vendorService from '../../../../services/vendorService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import companyService from '../../../../api/companyService';
import purchaseQuotationService from '../../../../services/purchaseQuotationService';
import GetCompanyId from '../../../../api/GetCompanyId';

const PurchaseOrder = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const location = useLocation();
    const navigate = useNavigate();
    const sourceData = location.state?.sourceData; // content from Quotation if applicable

    // --- State Management ---
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [quotations, setQuotations] = useState([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', logo: '', notes: '', terms: ''
    });
    const [orderMeta, setOrderMeta] = useState({
        orderNumber: '', date: new Date().toISOString().split('T')[0], deliveryDate: ''
    });
    const [vendorId, setVendorId] = useState('');
    const [items, setItems] = useState([
        { id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }
    ]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState(''); // Added terms state

    // Toggle State
    const [orderType, setOrderType] = useState('direct'); // 'direct' | 'quotation'
    const [selectedQuotationId, setSelectedQuotationId] = useState('');

    useEffect(() => {
        fetchInitialData();
        fetchOrders();
    }, []);

    // Handle Source Data (Auto-fill from Quotation)
    useEffect(() => {
        if (sourceData && !editingId && vendors.length > 0) {
            setVendorId(sourceData.vendorId); // ensuring vendorId is passed
            setNotes(sourceData.notes || '');
            if (sourceData.items) {
                const mappedItems = sourceData.items.map(i => ({
                    id: Date.now() + Math.random(),
                    productId: i.productId || '',
                    warehouseId: i.warehouseId || '',
                    qty: i.quantity,
                    rate: i.rate,
                    discount: i.discount,
                    tax: i.taxRate,
                    total: i.amount,
                    description: i.description
                }));
                setItems(mappedItems);
            }
            setShowAddModal(true);
        }
    }, [sourceData, editingId, vendors]);

    const fetchInitialData = async () => {
        try {
            const companyId = GetCompanyId();

            const promises = [
                vendorService.getAllVendors(companyId),
                productService.getProducts(companyId),
                warehouseService.getWarehouses(companyId)
            ];
            if (companyId) {
                promises.push(companyService.getById(companyId));
            }

            const results = await Promise.all(promises);
            const vendorRes = results[0];
            const productRes = results[1];
            const warehouseRes = results[2];
            const companyRes = results[3];

            // Handle Vendors
            if (vendorRes.success && Array.isArray(vendorRes.data)) {
                setVendors(vendorRes.data);
            } else if (Array.isArray(vendorRes)) {
                setVendors(vendorRes);
            } else if (vendorRes.data && Array.isArray(vendorRes.data)) {
                setVendors(vendorRes.data);
            }

            // Handle Products
            if (productRes.success && Array.isArray(productRes.data)) {
                setProducts(productRes.data);
            } else if (Array.isArray(productRes)) {
                setProducts(productRes);
            } else if (productRes.data && Array.isArray(productRes.data)) {
                setProducts(productRes.data);
            }

            // Handle Warehouses
            if (warehouseRes.success && Array.isArray(warehouseRes.data)) {
                setWarehouses(warehouseRes.data);
            } else if (Array.isArray(warehouseRes)) {
                setWarehouses(warehouseRes);
            } else if (warehouseRes.data && Array.isArray(warehouseRes.data)) {
                setWarehouses(warehouseRes.data);
            }

            // Handle Company Details
            if (companyRes && (companyRes.data || companyRes.success)) {
                const data = companyRes.data?.data || companyRes.data || companyRes;
                setCompanyDetails({
                    name: data.companyName || data.name || 'Kiaan Technology',
                    address: data.address || 'Indore, MP',
                    email: data.companyEmail || data.email || 'info@kiaantechnology.com',
                    phone: data.phone || '97521 00980',
                    logo: data.logo || null,
                    notes: data.notes || '',
                    terms: data.terms || ''
                });

                if (data.terms) setTerms(data.terms);
                // Only set notes if not already populated from source data
                if (data.notes && !sourceData) setNotes(data.notes);
            }

        } catch (error) {
            console.error("Error fetching dropdowns", error);
            // toast.error("Failed to load dropdown data");
        }
    };

    const fetchQuotations = async () => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseQuotationService.getQuotations(companyId);
            if (res.success || Array.isArray(res)) {
                const allQuotes = res.data || res;
                // Only show quotations that are still pending/sent
                setQuotations(allQuotes.filter(q => q.status !== 'ACCEPTED' && q.status !== 'CONVERTED'));
            }
        } catch (error) {
            console.error("Error fetching quotations", error);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            const res = await purchaseOrderService.getOrders(companyId);
            if (res.success) {
                setOrders(res.data);
            }
        } catch (error) {
            console.error("Error fetching orders", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setVendorId('');
        // Auto-generate PO Number: PO-8digitRandom
        const autoPO = `PO-${Math.floor(10000000 + Math.random() * 90000000)}`;
        setOrderMeta({ orderNumber: autoPO, date: new Date().toISOString().split('T')[0], deliveryDate: '' });
        setItems([{ id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
        setNotes(companyDetails.notes || '');
        setTerms(companyDetails.terms || '');
        setOrderType('direct');
        setSelectedQuotationId('');
        setIsViewMode(false);
        setShowAddModal(false);
    };

    const handleView = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseOrderService.getOrderById(id, companyId);
            if (res.success && res.data) {
                const order = res.data;
                setEditingId(id);
                setVendorId(order.vendorId);
                setOrderMeta({
                    orderNumber: order.orderNumber,
                    date: order.date.split('T')[0],
                    deliveryDate: order.expectedDate ? order.expectedDate.split('T')[0] : ''
                });
                setNotes(order.notes || '');
                const itemsData = order.purchaseorderitem || order.items;
                if (itemsData) {
                    const mappedItems = itemsData.map(i => ({
                        id: i.id || Date.now() + Math.random(),
                        productId: i.productId || '',
                        warehouseId: i.warehouseId || '',
                        qty: i.quantity,
                        rate: i.rate,
                        discount: i.discount,
                        tax: i.taxRate,
                        total: i.amount,
                        description: i.description
                    }));
                    setItems(mappedItems);
                }
                setIsViewMode(true);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error fetching order details", error);
            toast.error("Failed to fetch order details");
        }
    };

    const handleAddNew = () => {
        resetForm();
        setEditingId(null);
        setIsViewMode(false);
        fetchInitialData();
        setShowAddModal(true);
    };

    const handleOrderTypeChange = (type) => {
        setOrderType(type);
        if (type === 'quotation') {
            fetchQuotations();
        } else {
            setSelectedQuotationId('');
        }
    };

    const handleQuotationSelect = (qId) => {
        setSelectedQuotationId(qId);
        if (!qId) return;

        const quote = quotations.find(q => q.id === parseInt(qId));
        if (quote) {
            setVendorId(quote.vendorId);
            setNotes(quote.notes || '');
            if (quote.terms) setTerms(quote.terms);

            const sourceItems = quote.purchasequotationitem || quote.items || [];
            const mappedItems = sourceItems.map(i => ({
                id: Date.now() + Math.random(),
                productId: i.productId,
                warehouseId: i.warehouseId || '',
                qty: i.quantity,
                rate: i.rate,
                discount: i.discount,
                tax: i.taxRate,
                total: i.amount,
                description: i.description
            }));
            setItems(mappedItems);
        }
    };

    const handleEdit = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseOrderService.getOrderById(id, companyId);
            if (res.success && res.data) {
                const orderToEdit = res.data;
                setEditingId(id);
                setIsViewMode(false);
                setVendorId(orderToEdit.vendorId);
                setOrderMeta({
                    orderNumber: orderToEdit.orderNumber,
                    date: orderToEdit.date.split('T')[0],
                    deliveryDate: orderToEdit.expectedDate ? orderToEdit.expectedDate.split('T')[0] : ''
                });
                setNotes(orderToEdit.notes || '');

                const itemsData = orderToEdit.purchaseorderitem || orderToEdit.items;
                if (itemsData) {
                    const mappedItems = itemsData.map(i => ({
                        id: i.id || Date.now() + Math.random(),
                        productId: i.productId || '',
                        warehouseId: i.warehouseId || '',
                        qty: i.quantity,
                        rate: i.rate,
                        discount: i.discount,
                        tax: i.taxRate,
                        total: i.amount,
                        description: i.description
                    }));
                    setItems(mappedItems);
                }
                setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error fetching order details", error);
            toast.error("Failed to fetch details for editing");
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            await purchaseOrderService.deleteOrder(deleteId, companyId);
            toast.success("Order deleted");
            fetchOrders();
        } catch (error) {
            toast.error(error.message || "Failed to delete");
        } finally {
            setShowDeleteConfirm(false);
            setDeleteId(null);
        }
    };

    const handleCreateGRN = (order) => {
        navigate('/company/purchases/goods-receipt', {
            state: {
                sourceData: {
                    vendorId: order.vendorId,
                    purchaseOrderId: order.id,
                    items: order.purchaseorderitem || order.items,
                    notes: order.notes
                }
            }
        });
    };

    const handleCreateBill = (order) => {
        navigate('/company/purchases/bill', {
            state: {
                sourceData: {
                    sourceType: 'po',
                    vendorId: order.vendorId,
                    purchaseOrderId: order.id,
                    items: order.purchaseorderitem || order.items || [],
                    notes: order.notes,
                    terms: order.terms,
                    totalAmount: order.totalAmount
                }
            }
        });
    };

    const handleSave = async () => {
        const totals = calculateTotals();

        if (!vendorId) {
            toast.error("Please select a vendor");
            return;
        }

        if (!orderMeta.orderNumber) {
            toast.error("Purchase Order Number is required (PO No.)");
            return;
        }

        const companyId = GetCompanyId();
        const payload = {
            companyId,
            orderNumber: orderMeta.orderNumber,
            date: orderMeta.date,
            expectedDate: orderMeta.deliveryDate,
            vendorId: parseInt(vendorId),
            items: items.map(item => ({
                productId: parseInt(item.productId),
                warehouseId: item.warehouseId ? parseInt(item.warehouseId) : null,
                description: item.description,
                quantity: parseFloat(item.qty),
                rate: parseFloat(item.rate),
                discount: parseFloat(item.discount),
                taxRate: parseFloat(item.tax)
            })),
            notes,
            quotationId: selectedQuotationId || sourceData?.quotationId // Link if from quotation
        };

        try {
            if (editingId) {
                await purchaseOrderService.updateOrder(editingId, { ...payload, status: 'OPEN' });
                toast.success("Order updated");
            } else {
                await purchaseOrderService.createOrder(payload);
                toast.success("Order created");
            }
            setShowAddModal(false);
            fetchOrders();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to save");
        }
    };

    // --- Calculation Helpers ---
    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                let updatedItem = { ...item, [field]: value };

                if (field === 'productId') {
                    const prod = products.find(p => p.id === parseInt(value));
                    if (prod) {
                        updatedItem.rate = prod.purchasePrice || 0;
                        updatedItem.tax = 0;
                        updatedItem.description = prod.description || '';
                    }
                }

                if (['qty', 'rate', 'tax', 'discount'].includes(field) || field === 'productId') {
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
            const tax = parseFloat(item.tax) || 0;
            const taxable = subtotal - discount;
            const taxAmount = (taxable * tax) / 100;

            acc.subTotal += subtotal;
            acc.discount += discount;
            acc.total += item.total;
            acc.tax += taxAmount;
            return acc;
        }, { subTotal: 0, tax: 0, discount: 0, total: 0 });
    };

    const totals = calculateTotals();

    const purchaseProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'purchase-order', label: 'Purchase Order', icon: ShoppingCart, status: 'active' },
        { id: 'grn', label: 'Goods Receipt', icon: Truck, status: 'pending' },
        { id: 'bill', label: 'Bill', icon: Receipt, status: 'pending' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'pending' },
    ];

    return (
        <div className="purchase-module-page">
            <div className="purchase-module-header">
                <div>
                    <h1 className="purchase-module-title">Purchase Order</h1>
                    <p className="purchase-module-subtitle">Manage purchase orders to vendors</p>
                </div>
                <button className="purchase-module-btn-add" onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> Create Order
                </button>
            </div>

            <div className="purchase-module-tracker-card">
                <div className="purchase-module-tracker-wrapper">
                    {purchaseProcess.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className={`purchase-module-tracker-step ${step.status}`}>
                                <div className="purchase-module-step-icon">
                                    <step.icon size={20} />
                                    {step.status === 'completed' && <CheckCircle2 className="purchase-module-status-badge" size={14} />}
                                    {step.status === 'active' && <Clock className="purchase-module-status-badge" size={14} />}
                                </div>
                                <span className="purchase-module-step-label">{step.label}</span>
                            </div>
                            {index < purchaseProcess.length - 1 && (
                                <div className={`purchase-module-tracker-divider ${purchaseProcess[index + 1].status !== 'pending' ? 'active' : ''}`}>
                                    <ArrowRight size={16} />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="purchase-module-table-card mt-6">
                <div className="table-container">
                    <table className="purchase-module-table">
                        <thead>
                            <tr>
                                <th>ORDER ID</th>
                                <th>QUO REF</th>
                                <th>VENDOR</th>
                                <th>DATE</th>
                                <th>DELIVERY DATE</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" className="text-center p-4">Loading...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="9" className="text-center p-4">No orders found</td></tr>
                            ) : (
                                orders.map(o => (
                                    <tr key={o.id}>
                                        <td className="font-bold text-blue-600">{o.orderNumber || `PO-${o.id}`}</td>
                                        <td>{o.purchasequotation?.quotationNumber || '-'}</td>
                                        <td>{o.vendor?.name || 'Unknown'}</td>
                                        <td>{new Date(o.date).toLocaleDateString()}</td>
                                        <td>{o.expectedDate ? new Date(o.expectedDate).toLocaleDateString() : '-'}</td>
                                        <td>{formatCurrency(o.totalAmount || 0)}</td>
                                        <td><span className={`purchase-module-status-pill ${o.status?.toLowerCase()}`}>{o.status}</span></td>
                                        <td className="">
                                            <div className="po-action-buttons">
                                                <button className="purchase-module-action-btn view" onClick={() => handleView(o.id)} title="View"><Eye size={16} /></button>
                                                <button className="purchase-module-action-btn edit" onClick={() => handleEdit(o.id)} title="Edit"><Pencil size={16} /></button>
                                                <button className="purchase-module-action-btn delete" onClick={() => handleDelete(o.id)} title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Create/Edit Modal */}
            {showAddModal && (
                <div className="purchase-module-modal-overlay">
                    <div className="purchase-module-form-modal">
                        <div className="purchase-module-header-simple">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isViewMode ? 'Purchase Order Details' : (editingId ? 'Edit Purchase Order' : 'New Purchase Order')}
                            </h2>
                            <div className="flex items-center gap-3">
                                {isViewMode && (
                                    <button className="purchase-module-btn-print" onClick={() => window.print()}>
                                        <Printer size={16} /> Print
                                    </button>
                                )}
                                <button className="purchase-module-close-btn" onClick={() => setShowAddModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="purchase-module-body-scrollable">

                            {/* Order Type Toggle - ONLY when creating new, not editing */}
                            {!editingId && (
                                <div className="purchase-toggle-wrapper">
                                    <div className="purchase-toggle-container">
                                        <button
                                            className={`purchase-toggle-btn ${orderType === 'direct' ? 'active' : ''}`}
                                            onClick={() => handleOrderTypeChange('direct')}
                                        >
                                            Direct Order
                                        </button>
                                        <button
                                            className={`purchase-toggle-btn ${orderType === 'quotation' ? 'active' : ''}`}
                                            onClick={() => handleOrderTypeChange('quotation')}
                                        >
                                            From Quotation
                                        </button>
                                    </div>

                                    {orderType === 'quotation' && (
                                        <div style={{ width: '100%' }}>
                                            <select
                                                className="purchase-module-select-large"
                                                style={{ width: '100%' }}
                                                value={selectedQuotationId}
                                                onChange={(e) => handleQuotationSelect(e.target.value)}
                                            >
                                                <option value="">Select Quotation...</option>
                                                {quotations.filter(q => {
                                                    // Filter out quotations that are already linked to an existing order (unless we are editing that specific order, which shouldn't happen in add mode)
                                                    const isUsed = orders.some(o => o.quotationId === q.id || o.quotationId === q._id);
                                                    return !isUsed;
                                                }).map(q => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.quotationNumber} - {q.vendor?.name} - {formatCurrency(q.totalAmount || 0)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="purchase-module-section-grid">
                                <div className="purchase-module-company-section">
                                    <div className="purchase-module-logo-upload-box">
                                        {companyDetails.logo ? (
                                            <img
                                                src={companyDetails.logo.startsWith('http') ? companyDetails.logo : `https://invoice-360-demo-production.up.railway.app/${companyDetails.logo.replace(/\\/g, '/')}`}
                                                alt="Logo"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            <h1 className="purchase-module-logo-text">LOGO</h1>
                                        )}
                                    </div>
                                    <input type="text" className="purchase-module-input" placeholder="Company Name" disabled={isViewMode}
                                        value={companyDetails.name} onChange={e => setCompanyDetails({ ...companyDetails, name: e.target.value })} />
                                    <input type="text" className="purchase-module-input" placeholder="Company Address" disabled={isViewMode}
                                        value={companyDetails.address} onChange={e => setCompanyDetails({ ...companyDetails, address: e.target.value })} />
                                    <input type="text" className="purchase-module-input" placeholder="Company Email" disabled={isViewMode}
                                        value={companyDetails.email} onChange={e => setCompanyDetails({ ...companyDetails, email: e.target.value })} />
                                </div>
                                <div className="purchase-module-meta-section">
                                    <div className="purchase-module-meta-row">
                                        <label>PO No.</label>
                                        <input type="text" value={orderMeta.orderNumber} disabled={isViewMode}
                                            placeholder="Auto-generated"
                                            onChange={(e) => setOrderMeta({ ...orderMeta, orderNumber: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                    <div className="purchase-module-meta-row">
                                        <label>Date</label>
                                        <input type="date" disabled={isViewMode}
                                            value={orderMeta.date} onChange={(e) => setOrderMeta({ ...orderMeta, date: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                    <div className="purchase-module-meta-row">
                                        <label>Delivery Date</label>
                                        <input type="date" disabled={isViewMode}
                                            value={orderMeta.deliveryDate} onChange={(e) => setOrderMeta({ ...orderMeta, deliveryDate: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                </div>
                            </div>

                            <hr className="purchase-module-divider" />

                            <div className="purchase-module-vendor-section">
                                <div className="form-group mb-2">
                                    <label className="form-label-sm">Select Vendor</label>
                                    <select className="purchase-module-select-large" value={vendorId} onChange={(e) => setVendorId(e.target.value)} disabled={!!sourceData || isViewMode}>
                                        <option value="">Select Vendor...</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="purchase-module-items-section">
                                {!isViewMode && (
                                    <button className="purchase-module-btn-add-row" onClick={addItem}>
                                        <Plus size={14} /> Add Line Item
                                    </button>
                                )}
                                <div className="table-responsive">
                                    <table className="purchase-module-items-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '25%' }}>ITEM DETAIL</th>
                                                <th style={{ width: '15%' }}>WAREHOUSE</th>
                                                <th style={{ width: '10%' }}>QTY</th>
                                                <th style={{ width: '12%' }}>RATE</th>
                                                <th style={{ width: '10%' }}>TAX %</th>
                                                <th style={{ width: '8%' }}>DISC.</th>
                                                <th style={{ width: '12%' }}>AMOUNT</th>
                                                <th style={{ width: '8%' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map(item => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <select
                                                            className="purchase-module-select-sm"
                                                            value={item.productId || ''}
                                                            onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                                                            disabled={isViewMode}
                                                        >
                                                            <option value="">Select Product...</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="purchase-module-select-sm"
                                                            value={item.warehouseId || ''}
                                                            onChange={(e) => updateItem(item.id, 'warehouseId', e.target.value)}
                                                            disabled={isViewMode}
                                                        >
                                                            <option value="">Select Warehouse...</option>
                                                            {warehouses.map(w => (
                                                                <option key={w.id} value={w.id}>{w.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input type="number" className="purchase-module-qty-input" value={item.qty}
                                                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)} disabled={isViewMode} />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="purchase-module-rate-input" value={item.rate}
                                                            onChange={(e) => updateItem(item.id, 'rate', e.target.value)} disabled={isViewMode} />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="purchase-module-tax-input" value={item.tax}
                                                            onChange={(e) => updateItem(item.id, 'tax', e.target.value)} disabled={isViewMode} />
                                                    </td>
                                                    <td>
                                                        <input type="number" className="purchase-module-discount-input" value={item.discount}
                                                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)} disabled={isViewMode} />
                                                    </td>
                                                    <td>
                                                        <input type="text" className="purchase-module-amount-input disabled" value={formatCurrency(item.total || 0)} disabled />
                                                    </td>
                                                    <td className="text-center">
                                                        {!isViewMode && (
                                                            <button className="purchase-module-btn-delete-row" onClick={() => removeItem(item.id)}>
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

                            <div className="purchase-module-footer-grid">
                                <div className="purchase-module-bank-details-box">
                                    <h4 className="text-sm font-bold mb-3 text-gray-700">Bank Details</h4>
                                    {vendorId ? (
                                        <>
                                            <div className="purchase-module-bank-row"><strong>Bank:</strong> {vendors.find(v => v.id === parseInt(vendorId))?.bankNameBranch || 'N/A'}</div>
                                            <div className="purchase-module-bank-row"><strong>Account No:</strong> {vendors.find(v => v.id === parseInt(vendorId))?.bankAccountNumber || 'N/A'}</div>
                                            <div className="purchase-module-bank-row"><strong>IFSC:</strong> {vendors.find(v => v.id === parseInt(vendorId))?.bankIFSC || 'N/A'}</div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Select a vendor to view bank details</p>
                                    )}
                                </div>
                                <div className="purchase-module-totals-box">
                                    <div className="purchase-module-t-row">
                                        <span>Sub Total:</span>
                                        <span>{formatCurrency(totals.subTotal)}</span>
                                    </div>
                                    <div className="purchase-module-t-row">
                                        <span>Discount:</span>
                                        <span className="text-red-500">-{formatCurrency(totals.discount)}</span>
                                    </div>
                                    <div className="purchase-module-t-row">
                                        <span>Tax Total:</span>
                                        <span>{formatCurrency(totals.tax)}</span>
                                    </div>
                                    <div className="purchase-module-t-row total">
                                        <span>Grand Total:</span>
                                        <span>{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="purchase-module-notes-terms-container">
                                <div className="purchase-module-notes-box">
                                    <label className="section-label mb-2 block text-sm font-semibold">Notes</label>
                                    <textarea className="purchase-module-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isViewMode}></textarea>
                                </div>
                                <div className="purchase-module-terms-box">
                                    <label className="section-label mb-2 block text-sm font-semibold">Terms & Conditions</label>
                                    <textarea className="purchase-module-textarea" placeholder="Enter terms..." value={terms} onChange={(e) => setTerms(e.target.value)} disabled={isViewMode}></textarea>
                                </div>
                            </div>

                        </div>

                        <div className="purchase-module-footer-simple">
                            {editingId && !isViewMode && (
                                <>
                                    <button className="purchase-module-btn-plain text-blue-600 border-blue-200 mr-2 hover:bg-blue-50"
                                        onClick={() => handleCreateGRN(orders.find(o => o.id === editingId))}>
                                        Convert to GRN
                                    </button>
                                    <button className="purchase-module-btn-plain text-blue-600 border-blue-200 mr-auto hover:bg-blue-50"
                                        onClick={() => handleCreateBill(orders.find(o => o.id === editingId))}>
                                        Convert to Bill
                                    </button>
                                </>
                            )}
                            <button className="purchase-module-btn-plain" onClick={() => setShowAddModal(false)}>
                                {isViewMode ? 'Close' : 'Cancel'}
                            </button>
                            {!isViewMode && (
                                <button className="purchase-module-btn-primary" onClick={handleSave}>
                                    {editingId ? 'Update Order' : 'Save Order'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="purchase-module-modal-overlay">
                    <div className="delete-confirmation-box" style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                        <div className="delete-modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 className="delete-modal-title" style={{ fontWeight: 'bold' }}>Delete Order?</h3>
                            <button className="delete-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-modal-body" style={{ marginBottom: '24px' }}>
                            <p>Are you sure you want to delete this order? This action cannot be undone.</p>
                        </div>
                        <div className="delete-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="purchase-module-btn-plain" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="purchase-module-btn-delete-row" style={{ width: 'auto', padding: '8px 16px', borderRadius: '4px', background: '#ef4444', color: 'white' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrder;
