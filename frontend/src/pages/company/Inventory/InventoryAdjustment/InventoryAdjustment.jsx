import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, Eye, Loader2, Save } from 'lucide-react';
import './InventoryAdjustment.css';
import adjustmentService from '../../../../api/adjustmentService';
import warehouseService from '../../../../api/warehouseService';
import productService from '../../../../api/productService';
import GetCompanyId from '../../../../api/GetCompanyId';
import toast from 'react-hot-toast';

const InventoryAdjustment = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = useState(null);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [adjustmentItems, setAdjustmentItems] = useState([]);
    const [formData, setFormData] = useState({
        voucherNo: '',
        manualVoucherNo: '',
        date: new Date().toISOString().split('T')[0],
        type: 'ADD_STOCK',
        warehouseId: '',
        note: ''
    });

    useEffect(() => {
        fetchAdjustments();
        fetchInitialData();
    }, []);

    const fetchAdjustments = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const response = await adjustmentService.getAdjustments(companyId);
            if (response.success) setAdjustments(response.data);
        } catch (error) {
            toast.error('Failed to load adjustments');
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const companyId = GetCompanyId();
            const [whRes, prodRes] = await Promise.all([
                warehouseService.getWarehouses(companyId),
                productService.getProducts(companyId)
            ]);
            if (whRes.success) setWarehouses(whRes.data);
            if (prodRes.success) setProducts(prodRes.data);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const generateVoucherNo = () => {
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
        const randomStr = Math.floor(1000 + Math.random() * 9000);
        return `ADJ-${dateStr}-${randomStr}`;
    };

    const handleOpenAdd = () => {
        setFormData({
            voucherNo: generateVoucherNo(),
            manualVoucherNo: '',
            date: new Date().toISOString().split('T')[0],
            type: 'ADD_STOCK',
            warehouseId: '',
            note: ''
        });
        setAdjustmentItems([]);
        setProductSearchTerm('');
        setShowAddModal(true);
    };

    const handleProductSearch = (value) => {
        setProductSearchTerm(value);
        if (value.trim() === '') return setSearchResults([]);
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(value.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(value.toLowerCase()))
        ).slice(0, 5);
        setSearchResults(filtered);
    };

    const addItem = (product) => {
        if (adjustmentItems.find(i => i.productId === product.id)) return toast.error('Item already added');
        setAdjustmentItems([...adjustmentItems, {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            rate: product.purchasePrice || 0,
            amount: product.purchasePrice || 0,
            narration: ''
        }]);
        setProductSearchTerm('');
        setSearchResults([]);
    };

    const removeItem = (idx) => {
        const newItems = [...adjustmentItems];
        newItems.splice(idx, 1);
        setAdjustmentItems(newItems);
    };

    const updateItem = (idx, field, value) => {
        const newItems = [...adjustmentItems];
        newItems[idx][field] = value;
        if (field === 'quantity' || field === 'rate') {
            newItems[idx].amount = (parseFloat(newItems[idx].quantity) || 0) * (parseFloat(newItems[idx].rate) || 0);
        }
        setAdjustmentItems(newItems);
    };

    const calculateTotal = () => adjustmentItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const handleSubmit = async () => {
        if (!formData.warehouseId) return toast.error('Please select warehouse');
        if (adjustmentItems.length === 0) return toast.error('Please add at least one item');

        try {
            setSubmitting(true);
            const payload = { ...formData, items: adjustmentItems, totalValue: calculateTotal() };
            const response = await adjustmentService.createAdjustment(payload);
            if (response.success) {
                toast.success('Adjustment saved');
                fetchAdjustments();
                setShowAddModal(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save adjustment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = async (adj) => {
        try {
            const companyId = GetCompanyId();
            const response = await adjustmentService.getAdjustmentById(adj.id, companyId);
            if (response.success) {
                setSelectedAdjustment(response.data);
                setShowViewModal(true);
            }
        } catch (error) {
            toast.error('Failed to load details');
        }
    };

    const handleDeleteClick = (adj) => {
        setSelectedAdjustment(adj);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            setSubmitting(true);
            const companyId = GetCompanyId();
            const response = await adjustmentService.deleteAdjustment(selectedAdjustment.id, companyId);
            if (response.success) {
                toast.success('Adjustment deleted');
                fetchAdjustments();
                setShowDeleteModal(false);
            }
        } catch (error) {
            toast.error('Failed to delete adjustment');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAdjustments = adjustments.filter(a =>
        a.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.manualVoucherNo && a.manualVoucherNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="adjustment-page">
            <div className="page-header">
                <h1 className="page-title">Inventory Adjustment</h1>
                <button className="btn-add" style={{ backgroundColor: '#8ce043' }} onClick={handleOpenAdd}>
                    <Plus size={18} /> Add Inventory Adjustment
                </button>
            </div>

            <div className="adjustment-card">
                <div className="controls-row">
                    <div className="entries-control">
                        <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))} className="entries-select">
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="entries-text">entries per page</span>
                    </div>
                    <div className="search-control">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-container">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="spinner" size={40} />
                            <p>Loading adjustments...</p>
                        </div>
                    ) : (
                        <table className="adjustment-table">
                            <thead>
                                <tr>
                                    <th>VOUCHER NO</th>
                                    <th>MANUAL NO</th>
                                    <th>DATE</th>
                                    <th>TYPE</th>
                                    <th>WAREHOUSE</th>
                                    <th>ITEMS</th>
                                    <th>TOTAL</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAdjustments.map((a) => (
                                    <tr key={a.id}>
                                        <td className="voucher-no">{a.voucherNo}</td>
                                        <td>{a.manualVoucherNo || '-'}</td>
                                        <td>{new Date(a.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`type-badge ${a.type.toLowerCase().replace('_', '-')}`}>
                                                {a.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{a.warehouse?.name}</td>
                                        <td>{a.items?.length} Items</td>
                                        <td>${parseFloat(a.totalValue || 0).toFixed(2)}</td>
                                        <td>
                                            <div className="adjustment-action-buttons">
                                                <button className="action-btn btn-view" onClick={() => handleView(a)}><Eye size={16} /></button>
                                                <button className="action-btn btn-delete" onClick={() => handleDeleteClick(a)}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content inventory-adjustment-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">New Inventory Adjustment</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">System Voucher No</label>
                                    <input type="text" className="form-input disabled-input" value={formData.voucherNo} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Manual Voucher No</label>
                                    <input type="text" className="form-input" placeholder="Manual No" value={formData.manualVoucherNo} onChange={e => setFormData({ ...formData, manualVoucherNo: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Voucher Date</label>
                                    <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group mt-4">
                                <label className="form-label">Adjustment Type <span className="text-red">*</span></label>
                                <div className="radio-group-horizontal">
                                    {['ADD_STOCK', 'REMOVE_STOCK', 'ADJUST_VALUE'].map(type => (
                                        <label key={type} className="radio-label">
                                            <input type="radio" name="adjType" value={type} checked={formData.type === type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                                            {type.replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group full-width mt-4">
                                <label className="form-label">Select Warehouse <span className="text-red">*</span></label>
                                <select className="form-input" value={formData.warehouseId} onChange={e => setFormData({ ...formData, warehouseId: e.target.value })}>
                                    <option value="">Select Target Warehouse</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>

                            <div className="form-group full-width mt-4">
                                <label className="form-label">Select Item</label>
                                <div className="search-wrapper">
                                    <Search size={16} className="search-icon-inline" />
                                    <input type="text" className="form-input with-icon" placeholder="Search product..." value={productSearchTerm} onChange={e => handleProductSearch(e.target.value)} />
                                    {searchResults.length > 0 && (
                                        <div className="product-search-results">
                                            {searchResults.map(p => (
                                                <div key={p.id} className="search-result-item" onClick={() => addItem(p)}>
                                                    <span>{p.name}</span>
                                                    <span className="p-sku">{p.sku}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="items-table-container">
                                <table className="items-input-table">
                                    <thead>
                                        <tr>
                                            <th>ITEM</th>
                                            <th>QUANTITY</th>
                                            <th>RATE</th>
                                            <th>AMOUNT</th>
                                            <th>NARRATION</th>
                                            <th>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adjustmentItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.name}</td>
                                                <td><input type="number" className="table-input" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                                                <td><input type="number" className="table-input" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} /></td>
                                                <td className="font-bold">${parseFloat(item.amount).toFixed(2)}</td>
                                                <td><input type="text" className="table-input" value={item.narration} onChange={e => updateItem(idx, 'narration', e.target.value)} /></td>
                                                <td><button className="row-delete-btn" onClick={() => removeItem(idx)}><Trash2 size={14} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="footer-flex-row">
                                <div className="form-group flex-1">
                                    <label className="form-label">Additional Note</label>
                                    <textarea className="form-input textarea" rows={3} placeholder="Enter note..." value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
                                </div>
                                <div className="total-display-card">
                                    <label>Total Value</label>
                                    <div className="total-amount-display">${calculateTotal().toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                                Save Adjustment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && (
                <div className="modal-overlay">
                    <div className="modal-content inventory-adjustment-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Adjustment Details</h2>
                            <button className="close-btn" onClick={() => setShowViewModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="view-grid">
                                <div className="view-item">
                                    <label>Voucher No</label>
                                    <p>{selectedAdjustment?.voucherNo}</p>
                                </div>
                                <div className="view-item">
                                    <label>Date</label>
                                    <p>{new Date(selectedAdjustment?.date).toLocaleDateString()}</p>
                                </div>
                                <div className="view-item">
                                    <label>Type</label>
                                    <p>{selectedAdjustment?.type.replace('_', ' ')}</p>
                                </div>
                                <div className="view-item">
                                    <label>Warehouse</label>
                                    <p>{selectedAdjustment?.warehouse?.name}</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <h3 className="section-subtitle">Adjusted Items</h3>
                                <table className="view-items-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedAdjustment?.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product?.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.rate?.toFixed(2)}</td>
                                                <td>${item.amount?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title text-red-600">Delete Adjustment</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{selectedAdjustment?.voucherNo}</strong>?</p>
                            <p className="text-red-500 text-sm mt-2">Warning: This will reverse the stock quantities!</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-submit bg-red-500" onClick={confirmDelete} disabled={submitting}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAdjustment;