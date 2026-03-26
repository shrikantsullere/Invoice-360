import React, { useState, useRef } from 'react';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown, Eye,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Download, Send, Printer,
    PackageCheck, Container, User, MapPin
} from 'lucide-react';
import './DeliveryChallan.css';
import deliveryChallanService from '../../../../api/deliveryChallanService';
import salesOrderService from '../../../../api/salesOrderService';
import customerService from '../../../../api/customerService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const DeliveryChallan = () => {
    const [deliveryChallans, setDeliveryChallans] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [allWarehouses, setAllWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [creationMode, setCreationMode] = useState('linked'); // 'direct' or 'linked'
    const [showOrderSelect, setShowOrderSelect] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Edit & Delete State
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', notes: '', terms: ''
    });
    const [challanMeta, setChallanMeta] = useState({
        challanNo: '', manualNo: '', date: new Date().toISOString().split('T')[0], carrier: '', vehicleNo: '', transportNote: '', remarks: ''
    });
    const [customerId, setCustomerId] = useState('');
    const [customerDetails, setCustomerDetails] = useState({
        address: '', email: '', phone: '', city: '', state: '', zipCode: ''
    });
    const [billingDetails, setBillingDetails] = useState({
        address: '', city: '', state: '', zipCode: ''
    });
    const [items, setItems] = useState([]);
    const [activeModalStep, setActiveModalStep] = useState(1);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

    // Initial Fetch
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
                setChallanMeta(prev => ({
                    ...prev,
                    transportNote: data.notes || '',
                    remarks: data.terms || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const response = await deliveryChallanService.getAll(companyId);
            if (response.data.success) {
                setDeliveryChallans(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching challans:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdowns = async () => {
        try {
            const companyId = GetCompanyId();
            const [custRes, prodRes, whRes, orderRes] = await Promise.all([
                customerService.getAll(companyId),
                productService.getAll(companyId),
                warehouseService.getAll(companyId),
                salesOrderService.getAll(companyId)
            ]);
            if (custRes.data.success) setCustomers(custRes.data.data);
            if (prodRes.data.success) setAllProducts(prodRes.data.data);
            if (whRes.data.success) setAllWarehouses(whRes.data.data);
            if (orderRes.data.success) {
                setActiveOrders(orderRes.data.data.filter(o => o.status !== 'COMPLETED'));
            }
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    };

    const salesProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'sales-order', label: 'Sales Order', icon: ShoppingCart, status: 'completed' },
        { id: 'delivery', label: 'Delivery', icon: Truck, status: 'active' },
        { id: 'invoice', label: 'Invoice', icon: Receipt, status: 'pending' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'pending' },
    ];

    const resetForm = () => {
        setSelectedOrder(null);
        setCustomerId('');
        setCustomerDetails({ address: '', email: '', phone: '', city: '', state: '', zipCode: '' });
        setBillingDetails({ address: '', city: '', state: '', zipCode: '' });
        setItems([]);
        const autoDC = `DC-${Math.floor(10000000 + Math.random() * 90000000)}`;
        setChallanMeta({
            challanNo: autoDC,
            manualNo: '',
            date: new Date().toISOString().split('T')[0],
            carrier: '',
            vehicleNo: '',
            transportNote: companyDetails.notes || '',
            remarks: companyDetails.terms || ''
        });
        setIsEditMode(false);
        setIsViewMode(false);
        setEditId(null);
        setActiveModalStep(1);
        setSelectedWarehouseId('');
    };

    const handleSelectOrder = (order) => {
        setSelectedOrder(order);
        setCustomerId(order.customerId);

        const c = order.customer || {};
        setCustomerDetails({
            address: c.shippingAddress || c.billingAddress || '',
            email: c.email || '',
            phone: c.phone || '',
            city: c.shippingCity || c.billingCity || '',
            state: c.shippingState || c.billingState || '',
            zipCode: c.shippingZipCode || c.billingZipCode || ''
        });
        setBillingDetails({
            address: c.billingAddress || '',
            city: c.billingCity || '',
            state: c.billingState || '',
            zipCode: c.billingZipCode || ''
        });
        const sourceItems = order.salesorderitem || order.items || [];
        const productItems = sourceItems
            .filter(item => item.productId) // ONLY physical products can be delivered
            .map(item => {
                // Find product to get unit
                const product = allProducts.find(p => p.id === item.productId);
                return {
                    id: Date.now() + Math.random(),
                    productId: item.productId, // Keep as ID from backend
                    warehouseId: item.warehouseId || '',
                    description: item.description || '',
                    ordered: item.quantity,
                    delivered: item.quantity,
                    unit: product?.unit || 'pcs'
                };
            });

        if (productItems.length === 0) {
            alert("This Sales Order contains no physical products to deliver.");
            return;
        }

        setItems(productItems);
        setShowOrderSelect(false);
        setActiveModalStep(2); // Proceed directly to Challan Details
    };

    const handleSelectWarehouse = (wId) => {
        setSelectedWarehouseId(wId);
        // Apply global warehouse to all items
        setItems(prev => prev.map(item => ({ ...item, warehouseId: wId })));
        setActiveModalStep(3); // Proceed to main form
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleView = async (challanId) => {
        try {
            const companyId = GetCompanyId();
            const response = await deliveryChallanService.getById(challanId, companyId);
            if (response.data.success) {
                const challan = response.data.data;
                resetForm();
                setIsViewMode(true);
                setEditId(challanId);

                setCustomerId(challan.customerId);
                setCustomerDetails({
                    address: challan.shippingAddress || '',
                    email: challan.shippingEmail || '',
                    phone: challan.shippingPhone || '',
                    city: challan.shippingCity || '',
                    state: challan.shippingState || '',
                    zipCode: challan.shippingZipCode || ''
                });

                if (challan.customer) {
                    setBillingDetails({
                        address: challan.customer.billingAddress || '',
                        city: challan.customer.billingCity || '',
                        state: challan.customer.billingState || '',
                        zipCode: challan.customer.billingZipCode || ''
                    });
                }

                setChallanMeta({
                    challanNo: challan.challanNumber,
                    manualNo: challan.manualReference || '',
                    date: new Date(challan.date).toISOString().split('T')[0],
                    carrier: challan.carrier || '',
                    vehicleNo: challan.vehicleNo || '',
                    transportNote: challan.transportNote || '',
                    remarks: challan.remarks || ''
                });

                if (challan.salesorder) {
                    setSelectedOrder(challan.salesorder);
                }

                setItems((challan.deliverychallanitem || challan.items || []).map(item => ({
                    id: item.id,
                    productId: item.productId,
                    warehouseId: item.warehouseId,
                    description: item.description || '',
                    ordered: item.quantity,
                    delivered: item.quantity,
                    unit: item.product?.unit || 'pcs'
                })));

                setActiveModalStep(2);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error('Error fetching challan for view:', error);
        }
    };

    const handleEdit = async (challanId) => {
        try {
            const companyId = GetCompanyId();
            const response = await deliveryChallanService.getById(challanId, companyId);
            if (response.data.success) {
                const challan = response.data.data;
                resetForm();
                setIsEditMode(true);
                setEditId(challanId);

                setCustomerId(challan.customerId);
                setCustomerDetails({
                    address: challan.shippingAddress || '',
                    email: challan.shippingEmail || '',
                    phone: challan.shippingPhone || '',
                    city: challan.shippingCity || '',
                    state: challan.shippingState || '',
                    zipCode: challan.shippingZipCode || ''
                });

                if (challan.customer) {
                    setBillingDetails({
                        address: challan.customer.billingAddress || '',
                        city: challan.customer.billingCity || '',
                        state: challan.customer.billingState || '',
                        zipCode: challan.customer.billingZipCode || ''
                    });
                }

                setChallanMeta({
                    challanNo: challan.challanNumber,
                    manualNo: challan.manualReference || '',
                    date: new Date(challan.date).toISOString().split('T')[0],
                    carrier: challan.carrier || '',
                    vehicleNo: challan.vehicleNo || '',
                    transportNote: challan.transportNote || '',
                    remarks: challan.remarks || ''
                });

                if (challan.salesorder) {
                    setSelectedOrder(challan.salesorder);
                }

                setItems((challan.deliverychallanitem || challan.items || []).map(item => ({
                    id: item.id,
                    productId: item.productId,
                    warehouseId: item.warehouseId,
                    description: item.description || '',
                    ordered: item.quantity,
                    delivered: item.quantity,
                    unit: item.product?.unit || 'pcs'
                })));

                setActiveModalStep(2);
                setShowAddModal(true);
            }
        } catch (error) {
            console.error('Error fetching challan for edit:', error);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', warehouseId: '', description: '', ordered: 0, delivered: 0, unit: 'pcs' }]);
    };

    const handleSave = async () => {
        try {
            if (!customerId) {
                alert("Please select a customer.");
                return;
            }

            for (const item of items) {
                if (!item.productId) {
                    alert("Please select a product for all items.");
                    return;
                }
                if (!item.warehouseId) {
                    alert("Please select a warehouse for all items.");
                    return;
                }
                if (parseFloat(item.delivered) <= 0) {
                    alert("Delivery quantity must be greater than 0.");
                    return;
                }
            }

            const companyId = GetCompanyId();
            const data = {
                challanNumber: challanMeta.challanNo,
                manualReference: challanMeta.manualNo,
                date: challanMeta.date,
                customerId: parseInt(customerId),
                companyId: companyId,
                salesOrderId: selectedOrder ? parseInt(selectedOrder.id) : null,
                vehicleNo: challanMeta.vehicleNo,
                carrier: challanMeta.carrier,
                transportNote: challanMeta.transportNote,
                remarks: challanMeta.remarks,
                shippingAddress: customerDetails.address,
                shippingCity: customerDetails.city,
                shippingState: customerDetails.state,
                shippingZipCode: customerDetails.zipCode,
                shippingPhone: customerDetails.phone,
                shippingEmail: customerDetails.email,
                items: items.map(item => ({
                    productId: parseInt(item.productId),
                    warehouseId: parseInt(item.warehouseId),
                    quantity: parseFloat(item.delivered),
                    description: item.description || (allProducts.find(p => p.id === parseInt(item.productId))?.name || '')
                }))
            };

            if (isEditMode) {
                const response = await deliveryChallanService.update(editId, data, companyId);
                if (response.data.success) {
                    fetchData();
                    setShowAddModal(false);
                    resetForm();
                }
            } else {
                const response = await deliveryChallanService.create(data);
                if (response.data.success) {
                    fetchData();
                    setShowAddModal(false);
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving challan:', error);
            alert(error.response?.data?.message || "Error saving delivery challan.");
        }
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            const response = await deliveryChallanService.delete(deleteId, companyId);
            if (response.data.success) {
                fetchData();
                setShowDeleteModal(false);
                setDeleteId(null);
            }
        } catch (error) {
            console.error('Error deleting challan:', error);
        }
    };

    return (
        <div className="delivery-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Delivery Challan</h1>
                    <p className="page-subtitle">Manage product deliveries and shipments</p>
                </div>
                <button className="btn-add" onClick={() => { resetForm(); setShowAddModal(true); setShowOrderSelect(true); }}>
                    <Plus size={18} className="mr-2" /> Create Challan
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
                    <table className="challan-table">
                        <thead>
                            <tr>
                                <th>CHALLAN ID</th>
                                <th>CUSTOMER</th>
                                <th>LINKED ORDER</th>
                                <th>DATE</th>
                                <th>STATUS</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryChallans.map(dc => (
                                <tr key={dc.id}>
                                    <td className="font-bold text-blue-600">{dc.challanNumber}</td>
                                    <td>{dc.customer?.name}</td>
                                    <td><span className="source-link">{dc.salesOrder?.orderNumber || 'Direct'}</span></td>
                                    <td>{new Date(dc.date).toLocaleDateString()}</td>
                                    <td><span className={`challan-status-pill ${(dc.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>{dc.status || 'Pending'}</span></td>
                                    <td className="text-right">
                                        <div className="delivery-action-buttons">
                                            <button className="challan-action-btn view" onClick={() => handleView(dc.id)} title="View"><Eye size={16} /></button>
                                            <button className="challan-action-btn edit" onClick={() => handleEdit(dc.id)} title="Edit"><Pencil size={16} /></button>
                                            <button className="challan-action-btn delete" onClick={() => handleDeleteClick(dc.id)} title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Enhanced Create Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content delivery-modal-premium">
                        <div className="modal-header-simple">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isViewMode ? 'View Delivery Challan' : isEditMode ? 'Edit Delivery Challan' : 'New Delivery Challan'}
                                </h2>
                                <span className="challan-status-badge-header">DELIVERY</span>
                            </div>
                            <button className="close-btn-simple" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body-scrollable">
                            {/* Modal Step Indicator */}
                            <div className="modal-step-stepper mb-8">
                                <div className={`m-step ${activeModalStep >= 1 ? 'active' : ''}`}>
                                    <div className="m-step-num">1</div>
                                    <span>Select Order</span>
                                </div>
                                <div className="m-step-line"></div>
                                <div className={`m-step ${activeModalStep >= 2 ? 'active' : ''}`}>
                                    <div className="m-step-num">2</div>
                                    <span>Challan Details</span>
                                </div>
                            </div>

                            {/* Step 1: Order Selection List (Conditional) */}
                            {activeModalStep === 1 && (
                                <div className="order-link-container-premium">
                                    <div className="section-header-flex mb-4">
                                        <h3 className="text-md font-extrabold text-slate-700 flex items-center gap-2">
                                            <ShoppingCart size={18} className="text-indigo-500" /> Pending Sales Orders
                                        </h3>
                                        <button className="btn-direct-entry" onClick={() => { setCreationMode('direct'); setActiveModalStep(2); }}>
                                            Direct Delivery (No Order) <ArrowRight size={14} className="ml-1" />
                                        </button>
                                    </div>
                                    <div className="order-grid-premium">
                                        {activeOrders.length > 0 ? (
                                            activeOrders.map(order => (
                                                <div key={order.id} className="order-link-card-premium" onClick={() => handleSelectOrder(order)}>
                                                    <div className="o-card-header-premium">
                                                        <div className="o-id-badge">
                                                            <FileText size={12} />
                                                            <span>{order.orderNumber}</span>
                                                        </div>
                                                        <div className="o-date-premium">
                                                            <Clock size={12} />
                                                            <span>{new Date(order.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                        </div>
                                                    </div>
                                                    <div className="o-card-body-premium">
                                                        <div className="o-customer-flex">
                                                            <div className="cust-avatar">{order.customer?.name?.charAt(0) || 'C'}</div>
                                                            <div className="cust-info">
                                                                <span className="cust-name">{order.customer?.name}</span>
                                                                <span className="cust-location">{order.customer?.billingCity || 'No Location'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="o-items-summary">
                                                            {order.SalesOrderItems?.length || 0} items to deliver
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-orders-state">
                                                <PackageCheck size={40} className="text-slate-200" />
                                                <p>No pending sales orders found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Main Form */}
                            {activeModalStep === 2 && (
                                <>
                                    <div className="form-section-grid">
                                        <div className="company-info-card">
                                            <div className="company-header-flex">
                                                <div className="logo-upload-box">
                                                    {companyDetails.logo ? (
                                                        <img src={companyDetails.logo} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} />
                                                    ) : (
                                                        <div className="logo-placeholder">
                                                            <Truck size={32} color="var(--primary)" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="company-details-inputs">
                                                    <input type="text" className="full-width-input font-bold text-lg"
                                                        disabled={isViewMode}
                                                        value={companyDetails.name} onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })} />
                                                    <input type="text" className="full-width-input text-gray-500"
                                                        disabled={isViewMode}
                                                        value={companyDetails.address} onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="meta-section">
                                            <div className="meta-row">
                                                <label>Challan No.</label>
                                                <div className="meta-value font-bold text-blue-600">{challanMeta.challanNo}</div>
                                            </div>
                                            <div className="meta-row">
                                                <label>Manual Ref</label>
                                                <input type="text" placeholder="e.g. DC-MAN-01"
                                                    disabled={isViewMode}
                                                    value={challanMeta.manualNo} onChange={(e) => setChallanMeta({ ...challanMeta, manualNo: e.target.value })}
                                                    className="meta-input" />
                                            </div>
                                            <div className="meta-row">
                                                <label>Date</label>
                                                <input type="date"
                                                    disabled={isViewMode}
                                                    value={challanMeta.date} onChange={(e) => setChallanMeta({ ...challanMeta, date: e.target.value })}
                                                    className="meta-input" />
                                            </div>
                                            <div className="meta-row">
                                                <label>Vehicle No</label>
                                                <input type="text"
                                                    disabled={isViewMode}
                                                    value={challanMeta.vehicleNo} onChange={(e) => setChallanMeta({ ...challanMeta, vehicleNo: e.target.value })}
                                                    className="meta-input font-mono" placeholder='MH-12-XX-9999' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="customer-selection-area mb-6">
                                        <label className="form-label-sm font-bold text-slate-700 mb-2 block">Customer Details</label>
                                        <select
                                            className="purchase-module-select-large"
                                            value={customerId}
                                            disabled={isViewMode || selectedOrder}
                                            onChange={(e) => {
                                                const cId = parseInt(e.target.value);
                                                setCustomerId(cId);
                                                const c = customers.find(cust => cust.id === cId);
                                                if (c) {
                                                    setCustomerDetails({
                                                        address: c.shippingAddress || c.billingAddress || '',
                                                        email: c.email || '',
                                                        phone: c.phone || '',
                                                        city: c.shippingCity || c.billingCity || '',
                                                        state: c.shippingState || c.billingState || '',
                                                        zipCode: c.shippingZipCode || c.billingZipCode || ''
                                                    });
                                                    setBillingDetails({
                                                        address: c.billingAddress || '',
                                                        city: c.billingCity || '',
                                                        state: c.billingState || '',
                                                        zipCode: c.billingZipCode || ''
                                                    });
                                                }
                                            }}>
                                            <option value="">Select Customer...</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="address-double-grid">
                                        <div className="address-col">
                                            <h3><MapPin size={16} color="var(--primary)" /> Billing Address</h3>
                                            <div className="readonly-address-box">
                                                <p className="font-bold text-slate-800">{customers.find(c => c.id === parseInt(customerId))?.name || 'Customer'}</p>
                                                <p>{billingDetails.address || 'Address not set'}</p>
                                                <p>{billingDetails.city}{billingDetails.state ? `, ${billingDetails.state}` : ''} {billingDetails.zipCode}</p>
                                            </div>
                                        </div>
                                        <div className="address-col">
                                            <h3><Truck size={16} color="var(--primary)" /> Delivery Destination</h3>
                                            <div className="customer-details-card">
                                                <input type="text" placeholder="Shipping Address" className="full-width-input mb-3"
                                                    disabled={isViewMode}
                                                    value={customerDetails.address} onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })} />
                                                <div className="grid grid-cols-3 gap-3 mb-3">
                                                    <input type="text" placeholder="City" className="full-width-input"
                                                        disabled={isViewMode}
                                                        value={customerDetails.city} onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })} />
                                                    <input type="text" placeholder="State" className="full-width-input"
                                                        disabled={isViewMode}
                                                        value={customerDetails.state} onChange={(e) => setCustomerDetails({ ...customerDetails, state: e.target.value })} />
                                                    <input type="text" placeholder="Zip" className="full-width-input"
                                                        disabled={isViewMode}
                                                        value={customerDetails.zipCode} onChange={(e) => setCustomerDetails({ ...customerDetails, zipCode: e.target.value })} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="tel" placeholder="Phone" className="full-width-input"
                                                        disabled={isViewMode}
                                                        value={customerDetails.phone} onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })} />
                                                    <input type="email" placeholder="Email" className="full-width-input"
                                                        disabled={isViewMode}
                                                        value={customerDetails.email} onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Section */}
                                    <div className="section-header-flex mt-8 mb-4">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <PackageCheck size={20} color="var(--primary)" /> Delivery Items
                                        </h3>
                                        {!isViewMode && (
                                            <button className="btn-add-row-mini" onClick={addItem}>
                                                <Plus size={14} /> Add Product
                                            </button>
                                        )}
                                    </div>

                                    <div className="items-section-new">
                                        <div className="table-responsive">
                                            <table className="new-items-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '35%' }}>PRODUCT</th>
                                                        <th style={{ width: '20%' }}>WH / LOCATION</th>
                                                        <th style={{ width: '15%', textAlign: 'center' }}>ORDERED</th>
                                                        <th style={{ width: '15%', textAlign: 'center' }}>DELIVERY QTY</th>
                                                        <th style={{ width: '15%' }}>UNIT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map(item => (
                                                        <React.Fragment key={item.id}>
                                                            <tr className="main-item-row hover:bg-slate-50">
                                                                <td>
                                                                    <select className="full-width-input font-bold"
                                                                        value={Number(item.productId) || ''}
                                                                        disabled={isViewMode} // Enabled even for linked orders as per user request
                                                                        onChange={(e) => {
                                                                            const pId = Number(e.target.value);
                                                                            const product = allProducts.find(p => p.id === pId);
                                                                            updateItem(item.id, 'productId', pId);
                                                                            if (product) {
                                                                                updateItem(item.id, 'unit', product.unit || 'pcs');
                                                                                if (!item.description) updateItem(item.id, 'description', product.name);
                                                                            }
                                                                        }}>
                                                                        <option value="">Select Product...</option>
                                                                        {allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <select className="full-width-input"
                                                                        disabled={isViewMode}
                                                                        value={Number(item.warehouseId) || ''}
                                                                        onChange={(e) => updateItem(item.id, 'warehouseId', Number(e.target.value))}>
                                                                        <option value="">Select Warehouse...</option>
                                                                        {allWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td className="text-center">
                                                                    <span className="badge-ordered-premium">{item.ordered}</span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <input type="number" value={item.delivered}
                                                                        onChange={(e) => updateItem(item.id, 'delivered', e.target.value)}
                                                                        className={`qty-input-premium ${parseFloat(item.delivered) > parseFloat(item.ordered) ? 'error' : 'success'}`}
                                                                        disabled={isViewMode} />
                                                                </td>
                                                                <td>
                                                                    <span className="text-sm font-extrabold text-slate-600">{item.unit || 'pcs'}</span>
                                                                </td>
                                                            </tr>
                                                            <tr className="description-row">
                                                                <td colSpan={5}>
                                                                    <input
                                                                        type="text"
                                                                        className="description-input-minimal"
                                                                        placeholder="Item description..."
                                                                        value={item.description || ''}
                                                                        disabled={isViewMode}
                                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Footer Sections */}
                                    <div className="form-footer-grid mt-6">
                                        <div className="notes-col">
                                            <label className="section-label-premium">Transport / Logistics Note</label>
                                            <textarea className="notes-area-premium h-32"
                                                disabled={isViewMode}
                                                value={challanMeta.transportNote}
                                                onChange={(e) => setChallanMeta({ ...challanMeta, transportNote: e.target.value })}
                                                placeholder="Driver contact, Courier name, Airway bill no..."></textarea>
                                        </div>
                                        <div className="notes-col">
                                            <label className="section-label-premium">Delivery Remarks</label>
                                            <textarea className="notes-area-premium h-32"
                                                disabled={isViewMode}
                                                value={challanMeta.remarks}
                                                onChange={(e) => setChallanMeta({ ...challanMeta, remarks: e.target.value })}
                                                placeholder="Add any specific instructions or remarks..."></textarea>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer-simple">
                            <button className="btn-plain" onClick={() => setShowAddModal(false)}>Cancel</button>
                            {!isViewMode && (
                                <button className="btn-primary-green" onClick={handleSave}>
                                    {isEditMode ? 'Update Delivery' : 'Confirm Delivery'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="delete-modal-content">
                        <div className="delete-modal-header">
                            <h2 className="text-lg font-bold text-red-600">Delete Challan?</h2>
                            <button className="close-btn-simple" onClick={() => setShowDeleteModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="delete-modal-body">
                            <p className="text-gray-600">
                                Are you sure you want to delete this Delivery Challan? This action cannot be undone.
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

export default DeliveryChallan;
