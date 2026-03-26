import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Download, Send, Printer, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../Purchase.css';
import purchaseQuotationService from '../../../../services/purchaseQuotationService';
import vendorService from '../../../../services/vendorService';
import productService from '../../../../api/productService'; // Adjust path if needed
import warehouseService from '../../../../api/warehouseService'; // Adjust path if needed
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const PurchaseQuotation = () => {
    // --- State Management ---
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', logo: '', notes: '', terms: ''
    });
    const [quotationMeta, setQuotationMeta] = useState({
        quotationNumber: '', manualReference: '', date: new Date().toISOString().split('T')[0], expiryDate: ''
    });
    const [vendorId, setVendorId] = useState('');
    const [items, setItems] = useState([
        { id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }
    ]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('');
    const [files, setFiles] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
        fetchQuotations();
    }, []);

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
            } else if (vendorRes.data && Array.isArray(vendorRes.data)) { // Handle axios response styled if mixed
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

                // Set default terms and notes from company details
                if (data.terms) setTerms(data.terms);
                if (data.notes) setNotes(data.notes);
            }

        } catch (error) {
            console.error("Error fetching dropdowns", error);
            toast.error("Failed to load dropdown data");
        }
    };

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            const res = await purchaseQuotationService.getQuotations(companyId);
            if (res.success) {
                setQuotations(res.data);
            }
        } catch (error) {
            console.error("Error fetching quotations", error);
            toast.error("Failed to fetch quotations");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setVendorId('');
        setQuotationMeta({ quotationNumber: '', manualReference: '', date: new Date().toISOString().split('T')[0], expiryDate: '' });
        setItems([{ id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
        setNotes(companyDetails.notes || '');
        setTerms(companyDetails.terms || '');
        setIsViewMode(false);
        setShowAddModal(false);
    };

    const handleView = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseQuotationService.getQuotationById(id, companyId);
            if (res.success && res.data) {
                const quote = res.data;
                setEditingId(id);
                setVendorId(quote.vendorId);
                setQuotationMeta({
                    quotationNumber: quote.quotationNumber,
                    manualReference: quote.manualReference || '',
                    date: quote.date.split('T')[0],
                    expiryDate: quote.expiryDate ? quote.expiryDate.split('T')[0] : ''
                });
                setNotes(quote.notes || '');
                setTerms(quote.terms || '');

                const itemsData = quote.purchasequotationitem || quote.items;
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
            console.error("Error fetching quotation details", error);
            toast.error("Failed to fetch quotation details");
        }
    };

    const handleAddNew = () => {
        resetForm();
        setEditingId(null);
        setIsViewMode(false);
        setShowAddModal(true);
    };

    const handleEdit = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseQuotationService.getQuotationById(id, companyId);
            if (res.success && res.data) {
                const quoteToEdit = res.data;
                setEditingId(id);
                setIsViewMode(false);
                setVendorId(quoteToEdit.vendorId);
                setQuotationMeta({
                    quotationNumber: quoteToEdit.quotationNumber,
                    manualReference: quoteToEdit.manualReference || '',
                    date: quoteToEdit.date.split('T')[0],
                    expiryDate: quoteToEdit.expiryDate ? quoteToEdit.expiryDate.split('T')[0] : ''
                });
                setNotes(quoteToEdit.notes || '');
                setTerms(quoteToEdit.terms || '');

                const itemsData = quoteToEdit.purchasequotationitem || quoteToEdit.items;
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
            console.error("Error fetching quotation details", error);
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
            await purchaseQuotationService.deleteQuotation(deleteId, companyId);
            toast.success("Quotation deleted");
            fetchQuotations();
        } catch (error) {
            toast.error(error.message || "Failed to delete");
        } finally {
            setShowDeleteConfirm(false);
            setDeleteId(null);
        }
    };

    const handleCreateOrder = (quotation) => {
        navigate('/company/purchases/purchase-order', { // Adjusted path
            state: {
                sourceData: {
                    vendorId: quotation.vendorId,
                    quotationId: quotation.id,
                    items: quotation.purchasequotationitem || quotation.items,
                    notes: quotation.notes
                }
            }
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const totals = calculateTotals();

        if (!vendorId) {
            toast.error("Please select a vendor");
            return;
        }

        const companyId = GetCompanyId();
        const payload = {
            companyId,
            quotationNumber: quotationMeta.quotationNumber || `PQ-${Date.now()}`,
            manualReference: quotationMeta.manualReference,
            date: quotationMeta.date,
            expiryDate: quotationMeta.expiryDate,
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
            terms,
            attachments: '' // Placeholder for attachments string if implemented
        };

        try {
            if (editingId) {
                await purchaseQuotationService.updateQuotation(editingId, { ...payload, status: 'DRAFT' }); // Pass status if needed
                toast.success("Quotation updated");
            } else {
                await purchaseQuotationService.createQuotation(payload);
                toast.success("Quotation created");
            }
            setShowAddModal(false);
            fetchQuotations();
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
                        updatedItem.rate = prod.purchasePrice || 0; // Use purchase price
                        updatedItem.tax = 0; // Set default tax from product if available
                        updatedItem.description = prod.description || '';
                    }
                }

                if (['qty', 'rate', 'tax', 'discount'].includes(field) || field === 'productId') {
                    const qty = parseFloat(updatedItem.qty) || 0;
                    const rate = parseFloat(updatedItem.rate) || 0;
                    const tax = parseFloat(updatedItem.tax) || 0;
                    const discount = parseFloat(updatedItem.discount) || 0;

                    const subtotal = qty * rate;
                    const discountAmount = discount; // assuming fixed discount, not percentage. logic can vary.
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
            // acc.tax += taxAmount; 
            // Correct accumulation:
            acc.total += item.total;
            acc.tax += taxAmount;
            return acc;
        }, { subTotal: 0, tax: 0, discount: 0, total: 0 });
    };

    const totals = calculateTotals();

    const purchaseProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'active' },
        { id: 'purchase-order', label: 'Purchase Order', icon: ShoppingCart, status: 'pending' },
        { id: 'grn', label: 'Goods Receipt', icon: Truck, status: 'pending' },
        { id: 'bill', label: 'Bill', icon: Receipt, status: 'pending' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'pending' },
    ];

    return (
        <div className="purchase-module-page">
            <div className="purchase-module-header">
                <div>
                    <h1 className="purchase-module-title">Purchase Quotation</h1>
                    <p className="purchase-module-subtitle">Manage purchase quotations from vendors</p>
                </div>
                <button className="purchase-module-btn-add" onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> Create Quotation
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
                                <th>QUOTATION ID</th>
                                <th>VENDOR</th>
                                <th>DATE</th>
                                <th>VALID TILL</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
                            ) : quotations.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-4">No quotations found</td></tr>
                            ) : (
                                quotations.map(q => (
                                    <tr key={q.id}>
                                        <td className="font-bold text-blue-600">{q.quotationNumber}</td>
                                        <td>{q.vendor?.name || 'Unknown'}</td>
                                        <td>{new Date(q.date).toLocaleDateString()}</td>
                                        <td>{q.expiryDate ? new Date(q.expiryDate).toLocaleDateString() : '-'}</td>
                                        <td>${q.totalAmount?.toFixed(2)}</td>
                                        <td><span className={`purchase-module-status-pill ${q.status?.toLowerCase()}`}>{q.status}</span></td>
                                        <td>
                                            <div className="pq-action-buttons">
                                                <button className="purchase-module-action-btn view" onClick={() => handleView(q.id)} title="View"><Eye size={16} /></button>
                                                <button className="purchase-module-action-btn edit" onClick={() => handleEdit(q.id)}><Pencil size={16} /></button>
                                                <button className="purchase-module-action-btn delete" onClick={() => handleDelete(q.id)}><Trash2 size={16} /></button>
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
                                {isViewMode ? 'Quotation Details' : (editingId ? 'Edit Purchase Quotation' : 'New Quotation')}
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
                                        <label>Quotation No.</label>
                                        <input type="text" value={quotationMeta.quotationNumber} disabled={isViewMode}
                                            placeholder="QUO-2024-NEW"
                                            onChange={(e) => setQuotationMeta({ ...quotationMeta, quotationNumber: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                    <div className="purchase-module-meta-row">
                                        <label>Manual Ref</label>
                                        <input type="text" value={quotationMeta.manualReference} disabled={isViewMode}
                                            placeholder="e.g. REF-001"
                                            onChange={(e) => setQuotationMeta({ ...quotationMeta, manualReference: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                    <div className="purchase-module-meta-row">
                                        <label>Date</label>
                                        <input type="date" disabled={isViewMode}
                                            value={quotationMeta.date} onChange={(e) => setQuotationMeta({ ...quotationMeta, date: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                    <div className="purchase-module-meta-row">
                                        <label>Valid Till</label>
                                        <input type="date" disabled={isViewMode}
                                            value={quotationMeta.expiryDate} onChange={(e) => setQuotationMeta({ ...quotationMeta, expiryDate: e.target.value })}
                                            className="purchase-module-meta-input" />
                                    </div>
                                    <div className="purchase-module-quotation-badge">QUOTATION</div>
                                </div>
                            </div>

                            <div className="purchase-module-divider" />

                            <div className="purchase-module-vendor-section">
                                <label className="form-label-sm mb-2 block font-semibold text-gray-700">Quotation To</label>
                                <select className="purchase-module-select-large mb-3" value={vendorId} disabled={isViewMode} onChange={(e) => {
                                    setVendorId(e.target.value);
                                    const v = vendors.find(ver => ver.id === parseInt(e.target.value));
                                    if (v) {
                                        // Auto-fill logic
                                    }
                                }}>
                                    <option value="">Select Vendor...</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                                <div className="purchase-module-vendor-details-row">
                                    <input type="text" disabled className="purchase-module-input" placeholder="Billing Address" value={vendors.find(v => v.id === parseInt(vendorId))?.billingAddress || ''} />
                                    <input type="text" disabled className="purchase-module-input" placeholder="Email Address" value={vendors.find(v => v.id === parseInt(vendorId))?.email || ''} />
                                    <input type="text" disabled className="purchase-module-input" placeholder="Phone Number" value={vendors.find(v => v.id === parseInt(vendorId))?.phone || ''} />
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
                                                <th style={{ width: '15%' }}>RATE</th>
                                                <th style={{ width: '10%' }}>TAX %</th>
                                                <th style={{ width: '10%' }}>DISC.</th>
                                                <th style={{ width: '15%' }}>AMOUNT</th>
                                                <th style={{ width: '5%' }}></th>
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
                                                            <option value="">Select...</option>
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
                                                        <input type="text" className="purchase-module-amount-input disabled" value={item.total.toFixed(2)} disabled />
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
                                            <div className="purchase-module-bank-row"><strong>Holder:</strong> {vendors.find(v => v.id === parseInt(vendorId))?.accountName || 'N/A'}</div>
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Select a vendor to view bank details</p>
                                    )}
                                </div>
                                <div className="purchase-module-totals-box">
                                    <div className="purchase-module-t-row">
                                        <span>Sub Total:</span>
                                        <span>${totals.subTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="purchase-module-t-row">
                                        <span>Discount:</span>
                                        <span className="text-red-500">-${totals.discount.toFixed(2)}</span>
                                    </div>
                                    <div className="purchase-module-t-row">
                                        <span>Tax Total:</span>
                                        <span>${totals.tax.toFixed(2)}</span>
                                    </div>
                                    <div className="purchase-module-t-row total">
                                        <span>Grand Total:</span>
                                        <span>${totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="purchase-module-notes-terms-container">
                                <div className="purchase-module-notes-box">
                                    <label className="section-label mb-2 block text-sm font-semibold">Notes</label>
                                    <textarea className="purchase-module-textarea" placeholder="Enter notes..." value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isViewMode}></textarea>
                                </div>
                                <div className="purchase-module-terms-box">
                                    <label className="section-label mb-2 block text-sm font-semibold">Terms & Conditions</label>
                                    <textarea className="purchase-module-textarea" placeholder="Enter terms..." value={terms} onChange={(e) => setTerms(e.target.value)} disabled={isViewMode}></textarea>
                                </div>
                            </div>

                            {!isViewMode && (
                                <div className="purchase-module-attachments-section">
                                    <label className="section-label mb-2 block text-sm font-semibold">Attachments</label>
                                    <input
                                        type="file"
                                        multiple
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    <button className="purchase-module-attach-btn" onClick={() => fileInputRef.current.click()}>
                                        <FileText size={14} /> Attach Files
                                    </button>

                                    {files.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {files.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border rounded text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={14} className="text-gray-400" />
                                                        <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
                                                        <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                                                    </div>
                                                    <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="purchase-module-footer-simple">
                            {editingId && !isViewMode && quotations.find(q => q.id === editingId)?.status !== 'ACCEPTED' && (
                                <button className="purchase-module-btn-plain text-blue-600 border-blue-200 mr-auto hover:bg-blue-50"
                                    onClick={() => handleCreateOrder(quotations.find(q => q.id === editingId))}>
                                    Convert to Purchase Order
                                </button>
                            )}
                            <button className="purchase-module-btn-plain" onClick={() => setShowAddModal(false)}>
                                {isViewMode ? 'Close' : 'Cancel'}
                            </button>
                            {!isViewMode && (
                                <button className="purchase-module-btn-primary" onClick={handleSave}>
                                    {editingId ? 'Update Quotation' : 'Save Quotation'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="purchase-module-modal-overlay">
                    <div className="delete-confirmation-box">
                        <div className="delete-modal-header">
                            <h3 className="delete-modal-title">Delete Quotation?</h3>
                            <button className="delete-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <p>Are you sure you want to delete this quotation? This action cannot be undone.</p>
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

export default PurchaseQuotation;
