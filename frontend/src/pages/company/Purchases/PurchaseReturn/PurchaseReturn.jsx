import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CompanyContext } from '../../../../context/CompanyContext';
import './PurchaseReturn.css';
import './PurchaseReturnView.css';
import purchaseReturnService from '../../../../services/purchaseReturnService';
import purchaseBillService from '../../../../services/purchaseBillService';
import goodsReceiptNoteService from '../../../../services/goodsReceiptNoteService';
import vendorService from '../../../../services/vendorService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import GetCompanyId from '../../../../api/GetCompanyId';

const PurchaseReturn = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Data State
    const [isLoading, setIsLoading] = useState(true);
    const [returns, setReturns] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [bills, setBills] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        returnNumber: '',
        manualVoucherNo: '',
        vendorId: '',
        purchaseBillId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Processed',
        returnType: 'Purchase Return',
        warehouseId: '',
        reason: '',
        narration: '',
        items: []
    });

    useEffect(() => {
        fetchInitialData();
        fetchReturns();
    }, []);

    const fetchInitialData = async () => {
        try {
            const companyId = GetCompanyId();
            const [vendorRes, productRes, warehouseRes, billRes] = await Promise.all([
                vendorService.getAllVendors(companyId),
                productService.getProducts(companyId),
                warehouseService.getWarehouses(companyId),
                purchaseBillService.getBills(companyId)
            ]);

            if (vendorRes.success) setVendors(vendorRes.data);
            if (productRes.success) setProducts(productRes.data);
            if (warehouseRes.success) setWarehouses(warehouseRes.data);
            if (billRes.success) setBills(billRes.data);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
        }
    };

    const fetchReturns = async () => {
        setIsLoading(true);
        try {
            const companyId = GetCompanyId();
            const res = await purchaseReturnService.getReturns(companyId);
            if (res.success) setReturns(res.data);
        } catch (error) {
            console.error("Error fetching returns:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = async (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'vendorId') {
            setFormData(prev => ({ ...prev, purchaseBillId: '', items: [] }));
        }

        if (name === 'purchaseBillId') {
            if (!value) {
                setFormData(prev => ({ ...prev, items: [] }));
                return;
            }

            try {
                // 1. Fetch the bill
                const companyId = GetCompanyId();
                const billRes = await purchaseBillService.getBillById(value, companyId);
                if (billRes.success) {
                    const bill = billRes.data;
                    const billItems = bill.purchasebillitem || bill.items || [];

                    let itemsToSet = [];
                    // 2. Try detailed lookup if GRN exists (Highest Accuracy)
                    if (bill.grnId) {
                        try {
                            const companyId = GetCompanyId();
                            const grnRes = await goodsReceiptNoteService.getGRNById(bill.grnId, companyId);
                            const grnItems = grnRes.data.goodsreceiptnoteitem || grnRes.data.items || [];
                            if (grnRes.success && grnItems.length > 0) {
                                itemsToSet = grnItems.map(gi => {
                                    const matchingBillItem = billItems.find(bi =>
                                        bi.productId === gi.productId || bi.description === gi.product?.name
                                    );
                                    return {
                                        id: Date.now() + Math.random(),
                                        productId: gi.productId.toString(),
                                        warehouseId: gi.warehouseId.toString(),
                                        quantity: gi.quantity,
                                        rate: matchingBillItem?.rate || 0,
                                        tax: matchingBillItem?.taxRate || 0,
                                        total: gi.quantity * (matchingBillItem?.rate || 0)
                                    };
                                });
                            }
                        } catch (grnErr) {
                            console.warn("GRN fetch failed.", grnErr);
                        }
                    }

                    // 3. Fallback: Lookup Purchase Order if no items yet (Medium Accuracy)
                    if (itemsToSet.length === 0 && bill.purchaseOrderId) {
                        try {
                            const companyId = GetCompanyId();
                            const { default: poService } = await import('../../../../services/purchaseOrderService');
                            const poRes = await poService.getOrderById(bill.purchaseOrderId, companyId);
                            const poItems = poRes.data.purchaseorderitem || poRes.data.items || [];
                            if (poRes.success && poItems.length > 0) {
                                itemsToSet = poItems.map(pi => {
                                    const matchingBillItem = billItems.find(bi =>
                                        (bi.productId && bi.productId === pi.productId) || (bi.description === pi.description)
                                    );
                                    return {
                                        id: Date.now() + Math.random(),
                                        productId: (pi.productId || '').toString(),
                                        warehouseId: (bill.warehouseId || (warehouses.length > 0 ? warehouses[0].id.toString() : '')).toString(),
                                        quantity: matchingBillItem?.quantity || pi.quantity,
                                        rate: matchingBillItem?.rate || pi.rate,
                                        tax: matchingBillItem?.taxRate || pi.taxRate || 0,
                                        total: matchingBillItem?.amount || pi.amount
                                    };
                                });
                            }
                        } catch (poErr) {
                            console.warn("PO fetch failed.", poErr);
                        }
                    }

                    // 4. Final Fallback: bill items only (Fuzzy match by description)
                    if (itemsToSet.length === 0) {
                        itemsToSet = billItems.map(i => {
                            const matchedProduct = products.find(p =>
                                (i.productId && p.id === parseInt(i.productId)) ||
                                (p.name.toLowerCase().trim() === i.description.toLowerCase().trim())
                            );

                            return {
                                id: Date.now() + Math.random(),
                                productId: matchedProduct ? matchedProduct.id.toString() : (i.productId || '').toString(),
                                warehouseId: (bill.warehouseId || (warehouses.length > 0 ? warehouses[0].id.toString() : '')).toString(),
                                quantity: i.quantity,
                                rate: i.rate,
                                tax: i.taxRate || 0,
                                total: i.amount
                            };
                        });
                    }

                    setFormData(prev => ({
                        ...prev,
                        vendorId: bill.vendorId.toString(),
                        items: itemsToSet,
                        warehouseId: (bill.warehouseId || itemsToSet[0]?.warehouseId || (warehouses.length > 0 ? warehouses[0].id.toString() : '')).toString()
                    }));
                }
            } catch (error) {
                console.error("Error auto-filling from bill:", error);
                toast.error("Failed to load bill details. Please check connection.");
            }
        }
    };

    const handleCreate = () => {
        setFormData({
            returnNumber: `PR-${Date.now().toString().slice(-6)}`,
            manualVoucherNo: '',
            vendorId: '',
            purchaseBillId: '',
            date: new Date().toISOString().split('T')[0],
            status: 'Processed',
            returnType: 'Purchase Return',
            warehouseId: '',
            reason: '',
            narration: '',
            items: [{ id: Date.now(), productId: '', warehouseId: '', quantity: 1, rate: 0, tax: 0, total: 0 }]
        });
        setIsEditMode(false);
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            returnNumber: item.returnNumber,
            manualVoucherNo: item.manualVoucherNo || '',
            vendorId: item.vendorId.toString(),
            purchaseBillId: item.purchaseBillId ? item.purchaseBillId.toString() : '',
            date: item.date.split('T')[0],
            status: item.status || 'Processed',
            returnType: item.returnType || 'Purchase Return',
            warehouseId: (item.warehouseId || (item.items && item.items[0]?.warehouseId) || '').toString(),
            reason: item.reason || '',
            narration: item.narration || '',
            items: item.items.map(i => ({
                id: i.id || Date.now() + Math.random(),
                productId: i.productId.toString(),
                warehouseId: i.warehouseId.toString(),
                quantity: i.quantity,
                rate: i.rate,
                tax: 0,
                total: i.amount
            }))
        });
        setIsEditMode(true);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.vendorId) {
            toast.error("Please select a vendor");
            return;
        }
        if (formData.items.length === 0 || formData.items.some(i => !i.productId || i.quantity <= 0)) {
            toast.error("Please add valid items and quantities");
            return;
        }

        const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

        const companyId = GetCompanyId();
        const payload = {
            companyId,
            returnNumber: formData.returnNumber || `PR-${Date.now()}`,
            manualVoucherNo: formData.manualVoucherNo,
            vendorId: parseInt(formData.vendorId),
            purchaseBillId: formData.purchaseBillId ? parseInt(formData.purchaseBillId) : null,
            date: formData.date,
            reason: formData.reason,
            narration: formData.narration,
            totalAmount: totalAmount,
            warehouseId: formData.warehouseId ? parseInt(formData.warehouseId) : null,
            items: formData.items.map(i => ({
                productId: parseInt(i.productId),
                warehouseId: parseInt(i.warehouseId || formData.warehouseId),
                quantity: parseFloat(i.quantity),
                rate: parseFloat(i.rate),
                amount: parseFloat(i.total)
            }))
        };

        try {
            if (isEditMode && editingId) {
                await purchaseReturnService.updateReturn(editingId, payload, companyId);
                toast.success("Purchase Return Updated");
            } else {
                await purchaseReturnService.createReturn(payload);
                toast.success("Purchase Return Created");
            }
            setShowModal(false);
            fetchReturns();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to process return");
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), productId: '', warehouseId: '', quantity: 1, rate: 0, tax: 0, total: 0 }]
        }));
    };

    const removeItem = (id) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(i => i.id !== id)
        }));
    };

    const updateItem = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === id) {
                    const newItem = { ...item, [field]: value };
                    if (field === 'productId') {
                        const prod = products.find(p => p.id === parseInt(value));
                        if (prod) newItem.rate = prod.purchasePrice || 0;
                    }
                    if (['quantity', 'rate', 'productId'].includes(field)) {
                        newItem.total = (parseFloat(newItem.quantity) || 0) * (parseFloat(newItem.rate) || 0);
                    }
                    return newItem;
                }
                return item;
            })
        }));
    };

    const handleView = async (item) => {
        try {
            // Fetch full details with relationships
            const companyId = GetCompanyId();
            const res = await purchaseReturnService.getReturnById(item.id, companyId);
            if (res.success && res.data) {
                setSelectedReturn(res.data);
            } else {
                // Fallback to the item from list
                setSelectedReturn(item);
            }
            setShowViewModal(true);
        } catch (error) {
            console.error('Error fetching return details:', error);
            // Fallback to the item from list
            setSelectedReturn(item);
            setShowViewModal(true);
        }
    };

    return (
        <div className="pretn-container">
            <div className="pretn-header">
                <div>
                    <h1 className="pretn-title">Purchase Returns</h1>
                    <p className="pretn-subtitle">Manage purchase returns and debit notes efficiently</p>
                </div>
                <button className="pretn-btn-add" onClick={handleCreate}>
                    <Plus size={18} className="mr-2" /> Record Return
                </button>
            </div>

            <div className="pretn-table-card">
                <div className="pretn-table-controls">
                    <div className="pretn-search-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search returns..."
                            className="pretn-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pretn-table-container">
                    <table className="pretn-table">
                        <thead>
                            <tr>
                                <th>RETURN #</th>
                                <th>REF BILL</th>
                                <th>VENDOR</th>
                                <th>DATE</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center p-8">Loading Returns...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan="7" className="text-center p-8">No purchase returns recorded yet.</td></tr>
                            ) : (
                                returns.filter(r =>
                                    r.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    r.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((item) => (
                                    <tr key={item.id}>
                                        <td className="pretn-id-text">
                                            <span className="cursor-pointer hover:underline" onClick={() => handleView(item)}>
                                                {item.returnNumber}
                                            </span>
                                        </td>
                                        <td>{item.purchasebill?.billNumber || item.purchaseBill?.billNumber || '-'}</td>
                                        <td>{item.vendor?.name}</td>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="pretn-amount-text">{formatCurrency(item.totalAmount || 0)}</td>
                                        <td>
                                            <span className={`pretn-status ${item.status?.toLowerCase() || 'pending'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="pretn-actions">
                                                <button className="pretn-btn-icon" title="View" onClick={() => handleView(item)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="pretn-btn-icon edit" title="Edit" onClick={() => handleEdit(item)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="pretn-btn-icon delete" title="Delete" onClick={() => { setSelectedReturn(item); setShowDeleteModal(true); }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="pretn-modal-overlay">
                    <div className="pretn-modal-card">
                        <div className="pretn-modal-header">
                            <h2 className="text-xl font-bold">{isEditMode ? 'Edit Purchase Return' : 'Add New Purchase Return'}</h2>
                            <button className="cursor-pointer" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>

                        <div className="pretn-modal-body">
                            <div className="pretn-grid pretn-grid-2">
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Reference ID (Auto)</label>
                                    <input type="text" className="pretn-input pretn-input-readonly" value={isEditMode ? formData.returnNumber : 'Assigned after save'} readOnly />
                                </div>
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Manual Voucher No</label>
                                    <input type="text" name="manualVoucherNo" className="pretn-input" value={formData.manualVoucherNo} placeholder="Enter Manual No" onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="pretn-grid pretn-grid-3">
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Vendor <span className="text-red-500">*</span></label>
                                    <select name="vendorId" className="pretn-input" value={formData.vendorId} onChange={handleInputChange}>
                                        <option value="">Select Vendor...</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Return No <span className="text-red-500">*</span></label>
                                    <input type="text" name="returnNumber" className="pretn-input" value={formData.returnNumber} onChange={handleInputChange} />
                                </div>
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Ref Bill (Optional)</label>
                                    <select name="purchaseBillId" className="pretn-input" value={formData.purchaseBillId} onChange={handleInputChange} disabled={!formData.vendorId}>
                                        <option value="">{formData.vendorId ? 'Select Bill...' : 'Select Vendor First'}</option>
                                        {bills.filter(b => b.vendorId === parseInt(formData.vendorId)).map(b => (
                                            <option key={b.id} value={b.id}>{b.billNumber}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pretn-grid pretn-grid-3">
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Date <span className="text-red-500">*</span></label>
                                    <input type="date" name="date" className="pretn-input" value={formData.date} onChange={handleInputChange} />
                                </div>
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Return Type</label>
                                    <select name="returnType" className="pretn-input" value={formData.returnType} onChange={handleInputChange}>
                                        <option value="Purchase Return">Purchase Return</option>
                                        <option value="Debit Note">Debit Note</option>
                                    </select>
                                </div>
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Main Warehouse <span className="text-red-500">*</span></label>
                                    <select name="warehouseId" className="pretn-input" value={formData.warehouseId} onChange={handleInputChange}>
                                        <option value="">Select Warehouse...</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pretn-items-container">
                                <label className="pretn-label mb-3 block text-gray-700">Returned Items Detail</label>
                                {formData.items.map(item => (
                                    <div key={item.id} className="pretn-item-row">
                                        <div style={{ flex: 3 }}>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Product</label>
                                            <select className="pretn-input" value={item.productId} onChange={(e) => updateItem(item.id, 'productId', e.target.value)}>
                                                <option value="">Select Product...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Warehouse</label>
                                            <select className="pretn-input" value={item.warehouseId} onChange={(e) => updateItem(item.id, 'warehouseId', e.target.value)}>
                                                <option value="">Warehouse...</option>
                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ width: '80px' }}>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Qty</label>
                                            <input type="number" className="pretn-input" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                                        </div>
                                        <div style={{ width: '100px' }}>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Price</label>
                                            <input type="number" className="pretn-input" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} />
                                        </div>
                                        <div style={{ width: '100px' }}>
                                            <label className="text-[10px] text-gray-400 font-bold uppercase">Total</label>
                                            <input type="number" className="pretn-input pretn-input-readonly" value={item.total} readOnly />
                                        </div>
                                        <button className="pretn-btn-remove" onClick={() => removeItem(item.id)}><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                <button className="pretn-btn-add-item" onClick={addItem}><Plus size={14} className="inline mr-1" /> Add product line</button>
                            </div>

                            <div className="pretn-grid pretn-grid-2 mt-6">
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Reason for Return</label>
                                    <input type="text" name="reason" className="pretn-input" placeholder="e.g., Damaged items" value={formData.reason} onChange={handleInputChange} />
                                </div>
                                <div className="pretn-form-group">
                                    <label className="pretn-label">Narration (Accounts)</label>
                                    <textarea name="narration" className="pretn-input" style={{ height: 'auto' }} rows="2" value={formData.narration} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        <div className="pretn-modal-footer">
                            <button className="pretn-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="pretn-btn-save" onClick={handleSave}>{isEditMode ? 'Update Record' : 'Record Return'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedReturn && (
                <div className="pretn-modal-overlay">
                    <div className="pretn-view-modal-container">
                        <div className="pretn-view-modal-header">
                            <h2 className="pretn-view-modal-title">Return Details #{selectedReturn.returnNumber || selectedReturn.id}</h2>
                            <button className="pretn-view-close-btn" onClick={() => setShowViewModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="pretn-view-modal-body">
                            {/* Info Grid */}
                            <div className="pretn-view-info-grid">
                                <div className="pretn-view-info-item">
                                    <label className="pretn-view-label">CUSTOMER</label>
                                    <p className="pretn-view-value">{selectedReturn.vendor?.name || 'N/A'}</p>
                                </div>
                                <div className="pretn-view-info-item">
                                    <label className="pretn-view-label">WAREHOUSE</label>
                                    <p className="pretn-view-value">
                                        {selectedReturn.warehouse?.name ||
                                            selectedReturn.items?.[0]?.warehouse?.name ||
                                            'Main Warehouse'}
                                    </p>
                                </div>
                                <div className="pretn-view-info-item">
                                    <label className="pretn-view-label">DATE</label>
                                    <p className="pretn-view-value">{new Date(selectedReturn.date).toLocaleDateString('en-GB')}</p>
                                </div>
                                <div className="pretn-view-info-item">
                                    <label className="pretn-view-label">RETURN TYPE</label>
                                    <p className="pretn-view-value">{selectedReturn.returnType || 'Purchase Return'}</p>
                                </div>
                                <div className="pretn-view-info-item">
                                    <label className="pretn-view-label">INVOICE REFERENCE</label>
                                    <p className="pretn-view-value">
                                        {selectedReturn.purchasebill?.billNumber ||
                                            selectedReturn.purchaseBill?.billNumber ||
                                            selectedReturn.returnNumber}
                                    </p>
                                </div>
                                <div className="pretn-view-info-item">
                                    <label className="pretn-view-label">MANUAL VOUCHER</label>
                                    <p className="pretn-view-value">{selectedReturn.manualVoucherNo || selectedReturn.returnNumber || selectedReturn.id}</p>
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="pretn-view-items-section">
                                <h3 className="pretn-view-section-title">Items Returned</h3>
                                <table className="pretn-view-items-table">
                                    <thead>
                                        <tr>
                                            <th>Item Name</th>
                                            <th className="text-right">Qty</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReturn.items && selectedReturn.items.length > 0 ? (
                                            selectedReturn.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.product?.name || item.productName || 'Unknown Product'}</td>
                                                    <td className="text-right">{item.quantity || 0}</td>
                                                    <td className="text-right">{formatCurrency(item.amount || 0)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="text-center py-4 text-gray-400">No items found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="pretn-view-total-row">
                                            <td colSpan="2" className="text-left"><strong>Total</strong></td>
                                            <td className="text-right"><strong>{formatCurrency(selectedReturn.totalAmount || 0)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Reason Section */}
                            {selectedReturn.reason && (
                                <div className="pretn-view-reason-section">
                                    <label className="pretn-view-label">REASON</label>
                                    <p className="pretn-view-reason-text">{selectedReturn.reason}</p>
                                </div>
                            )}
                        </div>

                        <div className="pretn-view-modal-footer">
                            <button className="pretn-view-btn-close" onClick={() => setShowViewModal(false)}>
                                Close
                            </button>
                            <button className="pretn-view-btn-print" onClick={() => window.print()}>
                                <span>🖨️</span> Print Return
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedReturn && (
                <div className="pretn-modal-overlay">
                    <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-2xl">
                        <div className="text-center">
                            <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Confirmation</h3>
                            <p className="text-gray-500">Are you sure you want to delete return <strong>{selectedReturn.returnNumber}</strong>? This will also revert stock items.</p>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition" onClick={() => setShowDeleteModal(false)}>No, Cancel</button>
                            <button className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                                onClick={async () => {
                                    try {
                                        const companyId = GetCompanyId();
                                        await purchaseReturnService.deleteReturn(selectedReturn.id, companyId);
                                        toast.success("Return deleted successfully");
                                        fetchReturns();
                                        setShowDeleteModal(false);
                                    } catch (e) { toast.error("Failed to delete"); }
                                }}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseReturn;
