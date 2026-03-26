import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, User, MapPin, Box, Calendar, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import './GoodsReceipt.css'; // New isolated CSS
import goodsReceiptNoteService from '../../../../services/goodsReceiptNoteService';
import purchaseOrderService from '../../../../services/purchaseOrderService';
import vendorService from '../../../../services/vendorService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const GoodsReceipt = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const sourceData = location.state?.sourceData;

    // --- State Management ---
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);

    // Modal & Wizard State
    const [showAddModal, setShowAddModal] = useState(false);
    const [step, setStep] = useState(1); // 1: Select Order, 2: Challan Details
    const [editingId, setEditingId] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Form Data
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [vendorId, setVendorId] = useState('');
    const [companyInfo, setCompanyInfo] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', logo: ''
    });

    // Challan Specifics
    const [grnMeta, setGrnMeta] = useState({
        grnNumber: '',
        manualRef: '', // e.g. DC-MAN-01
        date: new Date().toISOString().split('T')[0],
        vehicleNo: ''
    });

    // Addresses
    const [destAddress, setDestAddress] = useState({
        line1: '', line2: '', city: '', zip: '', phone: '', email: ''
    });

    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState({ logistics: '', remarks: '' });

    useEffect(() => {
        fetchInitialData();
        fetchGRNs();
        fetchCompanyInfo();
    }, []);

    // Handle Source Data (Auto-fill from Navigation)
    useEffect(() => {
        if (sourceData && !editingId) {
            // If coming from PO, we might already have order info
            // For now, let's treat it as if we selected the order in Step 1
            if (sourceData.purchaseOrderId) {
                // Try to resolve order
                handleSelectOrderById(sourceData.purchaseOrderId);
            }
        }
    }, [sourceData, pendingOrders]);

    const fetchCompanyInfo = async () => {
        const companyId = GetCompanyId();
        if (companyId) {
            try {
                const res = await companyService.getById(companyId);
                if (res.data) {
                    setCompanyInfo({
                        name: res.data.name || 'Kiaan Technology',
                        address: res.data.address || 'Indore, MP',
                        email: res.data.email || 'info@kiaantechnology.com',
                        phone: res.data.phone || '97521 00980',
                        logo: res.data.logo || '',
                        zip: res.data.zip || res.data.postalCode || ''
                    });
                    // Auto-fill dest address from company address parts if possible
                    setDestAddress(prev => ({
                        ...prev,
                        line1: res.data.address || '',
                        city: res.data.city || '',
                        zip: res.data.zip || res.data.postalCode || '',
                        email: res.data.email || ''
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch company info", err);
            }
        }
    };

    const fetchInitialData = async () => {
        try {
            const companyId = GetCompanyId();
            const [vendorRes, productRes, warehouseRes, orderRes] = await Promise.all([
                vendorService.getAllVendors(companyId),
                productService.getProducts(companyId),
                warehouseService.getWarehouses(companyId),
                purchaseOrderService.getOrders(companyId)
            ]);

            // Vendors
            if (vendorRes.success && Array.isArray(vendorRes.data)) setVendors(vendorRes.data);
            else if (Array.isArray(vendorRes)) setVendors(vendorRes);
            else if (vendorRes.data && Array.isArray(vendorRes.data)) setVendors(vendorRes.data);

            // Products
            if (productRes.success && Array.isArray(productRes.data)) setProducts(productRes.data);
            else if (Array.isArray(productRes)) setProducts(productRes);
            else if (productRes.data && Array.isArray(productRes.data)) setProducts(productRes.data);

            // Warehouses
            if (warehouseRes.success && Array.isArray(warehouseRes.data)) setWarehouses(warehouseRes.data);
            else if (Array.isArray(warehouseRes)) setWarehouses(warehouseRes);
            else if (warehouseRes.data && Array.isArray(warehouseRes.data)) setWarehouses(warehouseRes.data);

            // Orders - filter out those that already have GRNs
            if (orderRes.success) {
                setPendingOrders(orderRes.data.filter(o => o.status !== 'COMPLETED' && (!o.grns || o.grns.length === 0)));
            }
        } catch (error) {
            console.error("Error fetching dropdowns", error);
            toast.error("Failed to load dropdown data");
        }
    };

    const fetchGRNs = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            const res = await goodsReceiptNoteService.getGRNs(companyId);
            if (res.success) setGrns(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectOrderById = (orderId) => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (order) handleSelectOrder(order);
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        setVendorId(order.vendorId);

        // Map Items
        const sourceItems = order.purchaseorderitem || order.items || [];
        const grnItems = sourceItems.map(item => {
            // Ensure productId is valid by checking against loaded 'products'
            let validProductId = item.productId;
            if (products.length > 0) {
                const exists = products.find(p => p.id === item.productId);
                if (!exists) {
                    // Try finding by name if ID mismatch
                    const byName = products.find(p => p.name === item.productName || p.name === item.description); // Adjust based on PO item structure
                    if (byName) validProductId = byName.id;
                }
            }

            return {
                id: Date.now() + Math.random(),
                productId: validProductId || '',
                warehouseId: (warehouses.length > 0) ? warehouses[0].id : '', // Auto-select first warehouse
                orderedQty: item.quantity,
                receivedQty: item.quantity,
                unit: 'pcs',
                description: item.description
            };
        });
        setItems(grnItems);

        // Go to step 2
        setStep(2);

        // Ensure modal is open if triggered externally
        setShowAddModal(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setStep(1);
        setSelectedOrder(null);
        setVendorId('');
        setGrnMeta({ grnNumber: '', manualRef: '', date: new Date().toISOString().split('T')[0], vehicleNo: '' });
        setItems([]);
        setNotes({ logistics: '', remarks: '' });
        setIsViewMode(false);
        setShowAddModal(false);
    };

    const handleView = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await goodsReceiptNoteService.getGRNById(id, companyId);
            if (res.success && res.data) {
                const grn = res.data;
                setEditingId(grn.id);
                setIsViewMode(true);
                setVendorId(grn.vendorId);
                setGrnMeta({
                    grnNumber: grn.grnNumber,
                    manualRef: (grn.notes && grn.notes.match(/Manual Ref: (.*)/)) ? grn.notes.match(/Manual Ref: (.*)/)[1] : '',
                    date: grn.date.split('T')[0],
                    vehicleNo: (grn.notes && grn.notes.match(/Vehicle: (.*)/)) ? grn.notes.match(/Vehicle: (.*)/)[1] : ''
                });

                const noteText = grn.notes || '';
                setNotes({
                    logistics: (noteText.match(/Logistics: (.*)/)) ? noteText.match(/Logistics: (.*)/)[1] : '',
                    remarks: (noteText.match(/Remarks: (.*)/)) ? noteText.match(/Remarks: (.*)/)[1] : noteText
                });

                const itemsData = grn.goodsreceiptnoteitem || grn.items;
                if (itemsData) {
                    const mappedItems = itemsData.map(i => {
                        // Find ordered quantity from linked PO if possible
                        const poItem = grn.purchaseorder?.purchaseorderitem?.find(pi => pi.productId === i.productId);
                        return {
                            id: i.id || Date.now() + Math.random(),
                            productId: i.productId || '',
                            warehouseId: i.warehouseId || '',
                            orderedQty: poItem ? poItem.quantity : 0,
                            receivedQty: i.quantity,
                            unit: 'pcs',
                            description: i.description
                        };
                    });
                    setItems(mappedItems);
                }
                setStep(2);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error fetching GRN details", error);
            toast.error("Failed to fetch GRN details");
        }
    };

    const handleAddNew = () => {
        resetForm();
        setShowAddModal(true);
    };

    const handleEdit = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await goodsReceiptNoteService.getGRNById(id, companyId);
            if (res.success && res.data) {
                const grn = res.data;
                setEditingId(grn.id);
                setIsViewMode(false);

                // Populate Data
                setVendorId(grn.vendorId);
                setGrnMeta({
                    grnNumber: grn.grnNumber,
                    manualRef: (grn.notes && grn.notes.match(/Manual Ref: (.*)/)) ? grn.notes.match(/Manual Ref: (.*)/)[1] : '',
                    date: grn.date.split('T')[0],
                    vehicleNo: (grn.notes && grn.notes.match(/Vehicle: (.*)/)) ? grn.notes.match(/Vehicle: (.*)/)[1] : ''
                });

                // Extract Challan/Vehicle from notes if stored there as JSON or text
                const noteText = grn.notes || '';
                setNotes({
                    logistics: (noteText.match(/Logistics: (.*)/)) ? noteText.match(/Logistics: (.*)/)[1] : '',
                    remarks: (noteText.match(/Remarks: (.*)/)) ? noteText.match(/Remarks: (.*)/)[1] : noteText
                });

                const itemsData = grn.goodsreceiptnoteitem || grn.items;
                if (itemsData) {
                    const mappedItems = itemsData.map(i => {
                        // Find ordered quantity from linked PO if possible
                        const poItem = grn.purchaseorder?.purchaseorderitem?.find(pi => pi.productId === i.productId);
                        return {
                            id: i.id || Date.now() + Math.random(),
                            productId: i.productId || '',
                            warehouseId: i.warehouseId || '',
                            orderedQty: poItem ? poItem.quantity : 0,
                            receivedQty: i.quantity,
                            unit: 'pcs',
                            description: i.description
                        };
                    });
                    setItems(mappedItems);
                }

                // Skip link, go to step 2 directly
                setStep(2);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error fetching GRN details", error);
            toast.error("Failed to fetch GRN details for editing");
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            await goodsReceiptNoteService.deleteGRN(deleteId, companyId);
            toast.success("GRN deleted successfully");
            fetchGRNs();
        } catch (e) {
            toast.error("Failed to delete GRN");
        }
        setShowDeleteConfirm(false);
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSave = async () => {
        if (!vendorId) return toast.error("Vendor is required");
        if (items.some(i => !i.warehouseId || !i.productId)) return toast.error("Warehouse and Product required for all items");

        const companyId = GetCompanyId();
        const payload = {
            companyId,
            grnNumber: grnMeta.grnNumber || `GRN-${Date.now()}`, // Temporary fallback if auto-gen not in backend
            purchaseOrderId: selectedOrder ? selectedOrder.id : null,
            vendorId: parseInt(vendorId),
            date: grnMeta.date,
            items: items.map(item => ({
                productId: parseInt(item.productId),
                warehouseId: parseInt(item.warehouseId),
                quantity: parseFloat(item.receivedQty),
                description: item.description
            })),
            // Combine extra fields into notes for now if backend Schema doesn't support them explicitly
            notes: `Vehicle: ${grnMeta.vehicleNo}\nManual Ref: ${grnMeta.manualRef}\nLogistics: ${notes.logistics}\nRemarks: ${notes.remarks}`
        };

        try {
            if (editingId) {
                await goodsReceiptNoteService.updateGRN(editingId, payload);
                toast.success("GRN Updated");
            } else {
                await goodsReceiptNoteService.createGRN(payload);
                toast.success("GRN Created");
            }
            setShowAddModal(false);
            fetchGRNs();
        } catch (error) {
            toast.error("Failed to save GRN");
        }
    };

    // --- Render Helpers ---

    // Get vendor details for display
    const selectedVendor = vendors.find(v => v.id == vendorId);

    return (
        <div className="grn-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Goods Receipt</h1>
                    <p className="page-subtitle">Manage inbound deliveries and receipts</p>
                </div>
                <button className="btn-add" onClick={handleAddNew}>
                    <Plus size={18} className="mr-2" /> New Delivery Challan
                </button>
            </div>

            {/* List Table (Existing style kept for list view) */}
            <div className="table-card mt-6">
                <table className="grn-list-table">
                    <thead>
                        <tr>
                            <th>GRN ID</th>
                            <th>PO REF</th>
                            <th>VENDOR</th>
                            <th>DATE</th>
                            <th>STATUS</th>
                            <th className="text-right">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grns.map(g => (
                            <tr key={g.id}>
                                <td className="font-bold text-blue-600">{g.grnNumber}</td>
                                <td>{g.purchaseorder?.orderNumber || '-'}</td>
                                <td>{g.vendor?.name}</td>
                                <td>{new Date(g.date).toLocaleDateString()}</td>
                                <td><span className={`status-pill ${g.status?.toLowerCase()}`}>{g.status}</span></td>
                                <td className="">
                                    <div className="grn-action-buttons">
                                        <button className="btn-action-header view" onClick={() => handleView(g.id)} title="View"><Eye size={16} /></button>
                                        <button className="btn-action-header edit" onClick={() => handleEdit(g.id)} title="Edit"><Pencil size={16} /></button>
                                        <button className="btn-action-header delete" onClick={() => handleDelete(g.id)} title="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Main Modal */}
            {showAddModal && (
                <div className="grn-modal-overlay">
                    <div className="grn-modal-content">
                        {/* Header */}
                        <div className="grn-modal-header">
                            <h2 className="grn-modal-title">
                                {isViewMode ? 'Goods Receipt Details' : (editingId ? 'Edit Delivery Challan' : 'New Delivery Challan')}
                            </h2>
                            <button className="grn-close-btn" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Steps Indicator */}
                        <div className="grn-wizard-steps">
                            <div className="grn-step-connector"></div>
                            <div className={`grn-step ${step >= 1 ? 'completed' : ''}`}>
                                <div className="grn-step-circle">1</div>
                                <span className="grn-step-label">Select Order</span>
                            </div>
                            <div className={`grn-step ${step >= 2 ? 'active' : ''}`}>
                                <div className="grn-step-circle">2</div>
                                <span className="grn-step-label">Challan Details</span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="grn-modal-body">
                            {step === 1 && (
                                <div className="grn-step1-container">
                                    <div className="grn-step1-title-area">
                                        <h3 className="grn-section-headline">
                                            <ShoppingCart size={20} /> Pending Purchase Orders
                                        </h3>
                                    </div>

                                    <div className="grn-order-grid">
                                        {pendingOrders.map(order => (
                                            <div key={order.id} className="grn-order-card" onClick={() => handleSelectOrder(order)}>
                                                <div className="grn-order-header">
                                                    <div className="grn-order-badge">
                                                        <FileText size={10} />
                                                        {order.orderNumber}
                                                    </div>
                                                    <span className="grn-order-date">
                                                        <Clock size={10} className="inline mr-1" />
                                                        {new Date(order.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                <div className="grn-order-vendor-row">
                                                    <div className="grn-vendor-avatar">
                                                        {order.vendor?.name ? order.vendor.name.charAt(0).toUpperCase() : 'V'}
                                                    </div>
                                                    <div className="grn-vendor-details">
                                                        <h4>{order.vendor?.name || 'Unknown Vendor'}</h4>
                                                        <p>{order.vendor?.address || order.vendor?.city || 'No Address'}</p>
                                                    </div>
                                                </div>

                                                <div className="grn-order-footer">
                                                    {order.items?.length || 0} items to receive
                                                </div>
                                            </div>
                                        ))}

                                        {pendingOrders.length === 0 && (
                                            <div className="grn-empty-state">
                                                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-200" />
                                                <p className="font-medium text-gray-900">All Caught Up!</p>
                                                <p className="text-sm mt-1">No pending purchase orders found.</p>
                                                <button className="mt-4 text-blue-600 text-sm font-semibold hover:underline" onClick={() => setStep(2)}>
                                                    Create Direct Receipt &rarr;
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {pendingOrders.length > 0 && (
                                        <div className="text-center mt-8">
                                            <button className="text-sm text-gray-400 hover:text-gray-600 hover:underline" onClick={() => setStep(2)}>
                                                Skip and create direct delivery challan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="grn-step2-container">
                                    {/* Top Card: Company & Meta */}
                                    <div className="grn-card grn-grid-2">
                                        <div className="grn-company-card-content">
                                            {/* Row 1: Logo */}
                                            <div className="grn-company-logo-row">
                                                {companyInfo.logo ? (
                                                    <img src={companyInfo.logo} alt="Company Logo" className="grn-company-logo-img" />
                                                ) : (
                                                    <div className="text-gray-400 font-bold text-center">NO LOGO</div>
                                                )}
                                            </div>
                                            {/* Row 2: Details */}
                                            <div className="grn-company-details-row">
                                                <input type="text" value={companyInfo.name} className="grn-company-input-box" readOnly />
                                                <textarea
                                                    rows={4}
                                                    value={`${companyInfo.address}\nPostal Code: ${companyInfo.zip || 'N/A'}\nPhone: ${companyInfo.phone}\nEmail: ${companyInfo.email}`}
                                                    readOnly
                                                    className="grn-company-textarea-box"
                                                ></textarea>
                                            </div>
                                        </div>
                                        <div className="grn-meta-form">
                                            <div className="grn-input-row">
                                                <label>Challan No.</label>
                                                <input type="text" value={grnMeta.grnNumber || "Auto-generated"} disabled className="bg-gray-50" />
                                            </div>
                                            <div className="grn-input-row">
                                                <label>Manual Ref</label>
                                                <input type="text" placeholder="e.g. DC-MAN-01" disabled={isViewMode}
                                                    value={grnMeta.manualRef} onChange={e => setGrnMeta({ ...grnMeta, manualRef: e.target.value })} />
                                            </div>
                                            <div className="grn-input-row">
                                                <label>Date</label>
                                                <input type="date" disabled={isViewMode}
                                                    value={grnMeta.date} onChange={e => setGrnMeta({ ...grnMeta, date: e.target.value })} />
                                            </div>
                                            <div className="grn-input-row">
                                                <label>Vehicle No</label>
                                                <input type="text" placeholder="MH-12-XX-9999" disabled={isViewMode}
                                                    value={grnMeta.vehicleNo} onChange={e => setGrnMeta({ ...grnMeta, vehicleNo: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Card */}
                                    <div className="grn-card grn-grid-2">
                                        <div>
                                            <div className="grn-section-title"><User size={14} /> Vendor & Billing Info</div>
                                            <div className="grn-vendor-row-container">
                                                {selectedVendor ? (
                                                    <div className="grn-vendor-single-line">
                                                        <div><span className="grn-label-strong">Name:</span>{selectedVendor.name}</div>
                                                        <span className="grn-separator">|</span>
                                                        <div><span className="grn-label-strong">Address:</span>{selectedVendor.address || selectedVendor.billingAddress || 'N/A'}</div>
                                                        <span className="grn-separator">|</span>
                                                        <div><span className="grn-label-strong">Phone:</span>{selectedVendor.phone || 'N/A'}</div>
                                                        <span className="grn-separator">|</span>
                                                        <div><span className="grn-label-strong">Email:</span>{selectedVendor.email || 'N/A'}</div>
                                                    </div>
                                                ) : <div className="text-gray-400 italic">No vendor selected</div>}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="grn-section-title"><MapPin size={14} /> Delivery Destination</div>
                                            <div className="grn-address-box">
                                                <input type="text" placeholder="Address Line 1" className="grn-address-input" disabled={isViewMode}
                                                    value={destAddress.line1} onChange={e => setDestAddress({ ...destAddress, line1: e.target.value })} />
                                                <input type="text" placeholder="City / State" className="grn-address-input" disabled={isViewMode}
                                                    value={destAddress.city} onChange={e => setDestAddress({ ...destAddress, city: e.target.value })} />
                                                <input type="text" placeholder="Zip Code" className="grn-address-input" disabled={isViewMode}
                                                    value={destAddress.zip} onChange={e => setDestAddress({ ...destAddress, zip: e.target.value })} />
                                                <input type="text" placeholder="Contact Email/Phone" className="grn-address-input" disabled={isViewMode}
                                                    value={destAddress.email} onChange={e => setDestAddress({ ...destAddress, email: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Card */}
                                    <div className="grn-card">
                                        <div className="grn-section-title"><Box size={14} /> Delivery Items</div>
                                        <table className="grn-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '30%', fontSize: '12px' }}>PRODUCT</th>
                                                    <th style={{ width: '25%', fontSize: '12px' }}>WH / LOCATION</th>
                                                    <th style={{ width: '10%', fontSize: '12px' }} className="text-center">ORDERED</th>
                                                    <th style={{ width: '15%', fontSize: '12px' }} className="text-center">DELIVERY QTY</th>
                                                    <th style={{ width: '10%', fontSize: '12px' }}>UNIT</th>
                                                    <th style={{ width: '10%', fontSize: '12px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(item => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <select className="grn-table-select" disabled={isViewMode}
                                                                value={item.productId || ''} onChange={e => updateItem(item.id, 'productId', e.target.value)}>
                                                                <option value="">Select Product...</option>
                                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                            {/* <div className="text-xs text-gray-400 mt-1 pl-1">{item.description}</div> */}
                                                        </td>
                                                        <td>
                                                            <select className="grn-table-select" disabled={isViewMode}
                                                                value={item.warehouseId || ''} onChange={e => updateItem(item.id, 'warehouseId', e.target.value)}>
                                                                <option value="">Select Warehouse...</option>
                                                                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input type="text" className="grn-table-input readonly" value={item.orderedQty} disabled />
                                                        </td>
                                                        <td>
                                                            <input type="number" className="grn-table-input qty-highlight" disabled={isViewMode}
                                                                value={item.receivedQty} onChange={e => updateItem(item.id, 'receivedQty', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <span className="text-sm text-gray-600 pl-2">pcs</span>
                                                        </td>
                                                        <td className="text-center">
                                                            <button className="text-red-400 hover:text-red-600" onClick={() => {
                                                                setItems(items.filter(i => i.id !== item.id));
                                                            }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {items.length === 0 && (
                                                    <tr><td colSpan="6" className="text-center py-4 text-gray-400">No items added.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <button className="mt-3 text-sm font-semibold text-green-600 flex items-center hover:text-green-700"
                                            onClick={() => setItems([...items, { id: Date.now(), productId: '', warehouseId: '', orderedQty: 0, receivedQty: 1, unit: 'pcs' }])}>
                                            <Plus size={16} className="mr-1" /> Add Additional Item
                                        </button>
                                    </div>

                                    {/* Footer Notes */}
                                    <div className="grn-grid-2">
                                        <div className="grn-card">
                                            <div className="grn-section-title">
                                                <Truck size={18} className="text-green-600" />
                                                <span>TRANSPORT / LOGISTICS NOTE</span>
                                            </div>
                                            <textarea className="grn-textarea" placeholder="Driver contact, Courier name, Airway bill no..." disabled={isViewMode}
                                                value={notes.logistics} onChange={e => setNotes({ ...notes, logistics: e.target.value })}></textarea>
                                        </div>
                                        <div className="grn-card">
                                            <div className="grn-section-title">
                                                <FileText size={18} className="text-green-600" />
                                                <span>DELIVERY REMARKS</span>
                                            </div>
                                            <textarea className="grn-textarea" placeholder="Add any specific instructions or remarks..." disabled={isViewMode}
                                                value={notes.remarks} onChange={e => setNotes({ ...notes, remarks: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="grn-modal-footer">
                            <button className="grn-btn-cancel" onClick={() => setShowAddModal(false)}>
                                {isViewMode ? 'Close' : 'Cancel'}
                            </button>
                            {step === 2 && !isViewMode && (
                                <button className="grn-btn-primary" onClick={handleSave}>
                                    Confirm Delivery
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="grn-modal-overlay">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-2">Delete GRN?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button className="grn-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoodsReceipt;
