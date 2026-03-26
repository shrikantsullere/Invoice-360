import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, X, Eye, Calendar, ArrowRight, Loader2, Save } from 'lucide-react';
import './StockTransfer.css';
import stockTransferService from '../../../../api/stockTransferService';
import warehouseService from '../../../../api/warehouseService';
import productService from '../../../../api/productService';
import GetCompanyId from '../../../../api/GetCompanyId';
import toast from 'react-hot-toast';

const StockTransfer = () => {
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [transferItems, setTransferItems] = useState([]);
    const [formData, setFormData] = useState({
        voucherNo: '',
        manualVoucherNo: '',
        date: new Date().toISOString().split('T')[0],
        toWarehouseId: '',
        narration: ''
    });

    useEffect(() => {
        fetchTransfers();
        fetchInitialData();
    }, []);

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const response = await stockTransferService.getStockTransfers(companyId);
            if (response.success) {
                setTransfers(response.data);
            }
        } catch (error) {
            console.error('Error fetching transfers:', error);
            toast.error('Failed to load transfers');
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
        const randomStr = Math.floor(100 + Math.random() * 900);
        return `VCH-${dateStr}-${randomStr}`;
    };

    const handleOpenAdd = () => {
        setFormData({
            voucherNo: generateVoucherNo(),
            manualVoucherNo: '',
            date: new Date().toISOString().split('T')[0],
            toWarehouseId: '',
            narration: ''
        });
        setTransferItems([]);
        setProductSearchTerm('');
        setShowAddModal(true);
    };

    const handleProductSearch = (value) => {
        setProductSearchTerm(value);
        if (value.trim() === '') {
            setSearchResults([]);
            return;
        }
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(value.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(value.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(value.toLowerCase()))
        ).slice(0, 5);
        setSearchResults(filtered);
    };

    const addProductToTransfer = (product) => {
        // Check if product already added
        if (transferItems.find(item => item.productId === product.id)) {
            toast.error('Product already added');
            return;
        }

        // Default source warehouse from product's stocks or first available
        const defaultSource = product.stock && product.stock.length > 0 ? product.stock[0].warehouseId : '';

        setTransferItems([...transferItems, {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            fromWarehouseId: defaultSource,
            quantity: 1,
            rate: product.purchasePrice || 0,
            amount: product.purchasePrice || 0,
            narration: ''
        }]);
        setProductSearchTerm('');
        setSearchResults([]);
    };

    const removeProductFromTransfer = (index) => {
        const newItems = [...transferItems];
        newItems.splice(index, 1);
        setTransferItems(newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...transferItems];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].rate || 0);
        }
        setTransferItems(newItems);
    };

    const calculateTotal = () => {
        return transferItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const handleView = async (transfer) => {
        try {
            const companyId = GetCompanyId();
            const response = await stockTransferService.getStockTransferById(transfer.id, companyId);
            if (response.success) {
                setSelectedTransfer(response.data);
                setShowViewModal(true);
            }
        } catch (error) {
            toast.error('Failed to load transfer details');
        }
    };

    const handleDeleteClick = (transfer) => {
        setSelectedTransfer(transfer);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            setSubmitting(true);
            const companyId = GetCompanyId();
            const response = await stockTransferService.deleteStockTransfer(selectedTransfer.id, companyId);
            if (response.success) {
                toast.success('Transfer deleted successfully');
                fetchTransfers();
                setShowDeleteModal(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete transfer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddSubmit = async () => {
        if (!formData.toWarehouseId) return toast.error('Please select destination warehouse');
        if (transferItems.length === 0) return toast.error('Please add at least one item');

        // Validation for each item
        for (const item of transferItems) {
            if (!item.fromWarehouseId) return toast.error(`Please select source warehouse for ${item.name}`);
            if (item.fromWarehouseId === formData.toWarehouseId) return toast.error(`Source and destination cannot be same for ${item.name}`);
            if (!item.quantity || item.quantity <= 0) return toast.error(`Please enter valid quantity for ${item.name}`);
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                items: transferItems
            };
            const response = await stockTransferService.createStockTransfer(payload);
            if (response.success) {
                toast.success('Stock transfer successful');
                fetchTransfers();
                setShowAddModal(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to transfer stock');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredTransfers = transfers.filter(t =>
        t.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.manualVoucherNo && t.manualVoucherNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="stock-transfer-page">
            <div className="page-header">
                <h1 className="page-title">Stock Transfer</h1>
                <button className="btn-add" style={{ backgroundColor: '#8ce043' }} onClick={handleOpenAdd}>
                    <Plus size={18} />
                    Add Stock Transfer
                </button>
            </div>

            <div className="transfer-card">
                <div className="controls-row">
                    <div className="entries-control">
                        <select
                            value={entriesPerPage}
                            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                            className="entries-select"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
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
                            <p>Loading transfers...</p>
                        </div>
                    ) : (
                        <table className="transfer-table">
                            <thead>
                                <tr>
                                    <th>VOUCHER NO</th>
                                    <th>DATE</th>
                                    <th>DESTINATION</th>
                                    <th>ITEMS</th>
                                    <th>TOTAL</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransfers.length > 0 ? (
                                    filteredTransfers.map((t) => (
                                        <tr key={t.id}>
                                            <td className="voucher-no">
                                                {t.voucherNo}
                                                {t.manualVoucherNo && <p className="manual-no">Ref: {t.manualVoucherNo}</p>}
                                            </td>
                                            <td>{new Date(t.date).toLocaleDateString()}</td>
                                            <td>{t.warehouse?.name}</td>
                                            <td>{t.stocktransferitem?.length} Items</td>
                                            <td>${parseFloat(t.totalAmount || 0).toFixed(2)}</td>
                                            <td>
                                                <div className="stock-action-buttons">
                                                    <button className="action-btn btn-view" data-tooltip="View" onClick={() => handleView(t)}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="action-btn btn-delete" data-tooltip="Delete" onClick={() => handleDeleteClick(t)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4">No transfers found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="pagination-row">
                    <p className="pagination-info">Showing 1 to {filteredTransfers.length} of {filteredTransfers.length} entries</p>
                    <div className="pagination-controls">
                        <button className="pagination-btn disabled">Previous</button>
                        <button className="pagination-btn active">1</button>
                        <button className="pagination-btn disabled">Next</button>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content stock-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">New Stock Transfer</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">System Voucher No</label>
                                    <input type="text" className="form-input disabled-input" value={formData.voucherNo} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Manual Voucher No</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Manual Voucher No"
                                        value={formData.manualVoucherNo}
                                        onChange={(e) => setFormData({ ...formData, manualVoucherNo: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Voucher Date <span className="text-red">*</span></label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Destination Warehouse <span className="text-red">*</span></label>
                                <select
                                    className="form-input"
                                    value={formData.toWarehouseId}
                                    onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
                                >
                                    <option value="">Select destination warehouse</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Select Item</label>
                                <div className="search-wrapper">
                                    <Search size={16} className="search-icon-inline" />
                                    <input
                                        type="text"
                                        className="form-input with-icon"
                                        placeholder="Search by name, SKU, or barcode"
                                        value={productSearchTerm}
                                        onChange={(e) => handleProductSearch(e.target.value)}
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="product-search-results">
                                            {searchResults.map(p => (
                                                <div
                                                    key={p.id}
                                                    className="search-result-item"
                                                    onClick={() => addProductToTransfer(p)}
                                                >
                                                    <span className="p-name">{p.name}</span>
                                                    <span className="p-sku">{p.sku || ''}</span>
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
                                            <th>SOURCE WH</th>
                                            <th>QTY</th>
                                            <th>RATE</th>
                                            <th>AMOUNT</th>
                                            <th>NARRATION</th>
                                            <th>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transferItems.length > 0 ? (
                                            transferItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="item-name-cell">{item.name}</td>
                                                    <td>
                                                        <select
                                                            className="table-input"
                                                            value={item.fromWarehouseId}
                                                            onChange={(e) => updateItem(index, 'fromWarehouseId', e.target.value)}
                                                        >
                                                            <option value="">Source</option>
                                                            {warehouses.map(w => (
                                                                <option key={w.id} value={w.id}>{w.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="table-input qty-input"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="table-input rate-input"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(index, 'rate', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="amount-cell">${parseFloat(item.amount).toFixed(2)}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            className="table-input narration-input"
                                                            placeholder="..."
                                                            value={item.narration}
                                                            onChange={(e) => updateItem(index, 'narration', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button className="row-delete-btn" onClick={() => removeProductFromTransfer(index)}>
                                                            <X size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="empty-row">
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                    No items added
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">Narration (Overall)</label>
                                <textarea
                                    className="form-input textarea"
                                    rows={3}
                                    placeholder="Enter narration here..."
                                    value={formData.narration}
                                    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="modal-summary">
                                <span className="total-label">Total:</span>
                                <span className="total-amount">${calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button
                                className="btn-submit"
                                style={{ backgroundColor: '#8ce043' }}
                                onClick={handleAddSubmit}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                                {submitting ? 'Processing...' : 'Save Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && (
                <div className="modal-overlay">
                    <div className="modal-content stock-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Stock Transfer Details</h2>
                            <button className="close-btn" onClick={() => setShowViewModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="view-header-info">
                                <div className="view-chip">
                                    <label>Voucher No</label>
                                    <p>{selectedTransfer?.voucherNo}</p>
                                </div>
                                <div className="view-chip">
                                    <label>Manual No</label>
                                    <p>{selectedTransfer?.manualVoucherNo || 'N/A'}</p>
                                </div>
                                <div className="view-chip">
                                    <label>Date</label>
                                    <p>{new Date(selectedTransfer?.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="transfer-destination-info">
                                <label>Destination Warehouse:</label>
                                <p><strong>{selectedTransfer?.warehouse?.name}</strong></p>
                            </div>

                            <div className="view-items-section">
                                <h3 className="section-subtitle">Transferred Items</h3>
                                <table className="view-items-table">
                                    <thead>
                                        <tr>
                                            <th>Item (SKU)</th>
                                            <th>From</th>
                                            <th>Qty</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTransfer?.stocktransferitem?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>
                                                    {item.product?.name}
                                                    {item.product?.sku && <span className="sku-tag">({item.product.sku})</span>}
                                                </td>
                                                <td>{item.warehouse?.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.rate?.toFixed(2)}</td>
                                                <td>${item.amount?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {selectedTransfer?.narration && (
                                <div className="view-narration-section">
                                    <label>Narration:</label>
                                    <p>{selectedTransfer.narration}</p>
                                </div>
                            )}

                            <div className="view-total-row">
                                <span>Total Amount:</span>
                                <strong>${parseFloat(selectedTransfer?.totalAmount || 0).toFixed(2)}</strong>
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
                            <h2 className="modal-title">Delete Transfer</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete transfer <strong>{selectedTransfer?.voucherNo}</strong>?</p>
                            <p className="text-sm text-red mt-2">Note: This will reverse the stock quantities in the respective warehouses.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button
                                className="btn-submit"
                                style={{ backgroundColor: '#ff4d4d' }}
                                onClick={confirmDelete}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="spinner" size={18} /> : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTransfer;
