import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Settings, Calendar, Share, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../../../services/productService';
import GetCompanyId from '../../../../api/GetCompanyId';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchProductDetails();
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const res = await productService.getProductById(id, companyId);
            if (res.success) {
                setProduct(res.data);
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="pd-loading">
                <Loader2 className="animate-spin" style={{ color: '#8ce043' }} size={32} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="pd-not-found">
                <h2 className="text-xl font-bold text-gray-700">Product not found</h2>
                <button onClick={() => navigate('/company/inventory/products')} className="mt-4 hover:underline" style={{ color: '#8ce043' }}>
                    Back to Inventory
                </button>
            </div>
        );
    }

    const totalStock = product.stock ? product.stock.reduce((sum, s) => sum + s.quantity, 0) : 0;
    const itemValue = totalStock * (product.initialCost || 0);

    return (
        <div className="pd-container">
            {/* Header */}
            <div className="pd-header">
                <div className="pd-title-section">
                    <button onClick={() => navigate('/company/inventory/products')} className="pd-back-btn">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1>Inventory Item Details</h1>
                    <div className="pd-date">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <div className="pd-action-group">
                    <button className="pd-icon-btn"><Printer size={18} /></button>
                    <button className="pd-icon-btn"><Share size={18} /></button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="pd-main-card">
                <div className="pd-grid">
                    {/* Image Column */}
                    <div className="pd-image-wrapper">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="pd-img" />
                        ) : (
                            <div className="pd-no-img">No Image Available</div>
                        )}
                    </div>

                    {/* Info Column */}
                    <div className="pd-info-column">
                        <h2 className="pd-product-name">{product.name}</h2>
                        <div className="pd-info-grid">
                            <div className="pd-info-item">
                                <span className="pd-info-label">HSN</span>
                                <span className="pd-info-value">{product.hsn || 'N/A'}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Barcode</span>
                                <span className="pd-info-value">{product.barcode || 'N/A'}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">SKU</span>
                                <span className="pd-info-value">{product.sku || 'N/A'}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Category</span>
                                <span className="pd-info-value">{product.category?.name || 'Uncategorized'}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Unit</span>
                                <span className="pd-info-value">{product.uom?.unitName || 'N/A'}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Warehouse(s)</span>
                                <span className="pd-info-value pd-text-blue">
                                    {product.stock?.length > 0
                                        ? product.stock.map(s => s.warehouse.name).join(', ')
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Current Stock</span>
                                <span className="pd-info-value">{totalStock} {product.uom?.unitName}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Initial Qty</span>
                                <span className="pd-info-value">
                                    {product.stock?.reduce((sum, s) => sum + (s.initialQty || 0), 0) || '0'} {product.uom?.unitName}
                                </span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Min Order Qty</span>
                                <span className="pd-info-value">
                                    {product.stock?.reduce((sum, s) => sum + (s.minOrderQty || 0), 0) || '0'} {product.uom?.unitName}
                                </span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">As of Date</span>
                                <span className="pd-info-value">{product.asOfDate ? new Date(product.asOfDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="pd-info-item">
                                <span className="pd-info-label">Status</span>
                                <div>
                                    <span className={`pd-status-chip ${totalStock > 0 ? 'pd-status-in' : 'pd-status-out'}`}>
                                        {totalStock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Value Column */}
                    <div className="pd-value-column">
                        <div className="pd-value-card">
                            <div className="pd-value-header">
                                <div className="pd-value-title">Item Value</div>
                                <div className="pd-value-amt">₹{itemValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                            </div>
                            <div className="pd-price-row">
                                <span className="pd-price-label">Sale Price:</span>
                                <div>
                                    <span className="pd-price-val">₹{(product.salePrice || 0).toLocaleString()}</span>
                                    <span className="pd-price-unit">/unit</span>
                                </div>
                            </div>
                            <div className="pd-price-row">
                                <span className="pd-price-label">Purchase Price:</span>
                                <div>
                                    <span className="pd-price-val">₹{(product.purchasePrice || 0).toLocaleString()}</span>
                                    <span className="pd-price-unit">/unit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Details Sections */}
            <div className="pd-section-card">
                <h3 className="pd-section-title">Additional Product Details</h3>
                <div className="pd-details-grid">
                    <div>
                        <h4 className="pd-sub-title">Pricing & Financials</h4>
                        <div className="pd-compact-list">
                            <span className="pd-list-label">Initial Cost:</span>
                            <span className="pd-list-value">₹{(product.initialCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>

                            <span className="pd-list-label">Discount:</span>
                            <span className="pd-list-value">{product.discount || 0}%</span>

                            <span className="pd-list-label">Tax Account:</span>
                            <span className="pd-list-value">{product.taxAccount || '-'}</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="pd-sub-title">Description & Narrative</h4>
                        <div className="pd-compact-list">
                            <span className="pd-list-label">Remarks:</span>
                            <span className="pd-list-value">{product.remarks || '-'}</span>

                            <span className="pd-list-label">Description:</span>
                            <span className="pd-list-value">{product.description || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouse Table */}
            <div className="pd-section-card">
                <h3 className="pd-section-title">Warehouse Inventory Breakdown</h3>
                <div className="pd-table-wrapper">
                    <table className="pd-table">
                        <thead>
                            <tr>
                                <th>WAREHOUSE NAME</th>
                                <th>LOCATION</th>
                                <th>STOCK QUANTITY</th>
                                <th>ADDRESS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.stock && product.stock.length > 0 ? (
                                product.stock.map(stock => (
                                    <tr key={stock.id}>
                                        <td className="pd-text-blue">{stock.warehouse.name}</td>
                                        <td>{stock.warehouse.location || stock.warehouse.city || '-'}</td>
                                        <td>{stock.quantity} {product.uom?.unitName}</td>
                                        <td>
                                            {[stock.warehouse.addressLine1, stock.warehouse.city, stock.warehouse.state]
                                                .filter(Boolean)
                                                .join(', ') || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4">No warehouse stock data</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="pd-section-card">
                <h3 className="pd-section-title">Product Transaction History</h3>

                {/* Advanced Filters */}
                <div className="pd-controls">
                    <div className="pd-control-item">
                        <label className="pd-control-label">From Date</label>
                        <input type="date" className="pd-input" />
                    </div>
                    <div className="pd-control-item">
                        <label className="pd-control-label">To Date</label>
                        <input type="date" className="pd-input" />
                    </div>
                    <div className="pd-control-item">
                        <label className="pd-control-label">VCH Number</label>
                        <input type="text" placeholder="e.g. INV-001" className="pd-input" />
                    </div>
                    <div className="pd-control-item">
                        <label className="pd-control-label">Voucher Type</label>
                        <select className="pd-input">
                            <option>All Types</option>
                            <option>Sale</option>
                            <option>Purchase</option>
                            <option>Adjustment</option>
                        </select>
                    </div>
                    <div className="pd-control-item">
                        <label className="pd-control-label">Warehouse</label>
                        <input type="text" placeholder="Search..." className="pd-input" />
                    </div>
                </div>

                <div className="pd-tabs">
                    {[
                        { name: 'All Transactions', key: 'all' },
                        { name: 'Purchase History', key: 'purchase' },
                        { name: 'Sales History', key: 'sales' },
                        { name: 'Return History', key: 'return' },
                        { name: 'Stock Transfer', key: 'stock' },
                        { name: 'Adjustments', key: 'adjustments' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`pd-tab ${activeTab === tab.key ? 'pd-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="pd-tab-content">
                    <div className="pd-table-wrapper">
                        <table className="pd-table">
                            <thead>
                                <tr>
                                    <th>DATE</th>
                                    <th>TYPE</th>
                                    <th>PARTICULARS</th>
                                    <th>VCH NO</th>
                                    <th>WAREHOUSE</th>
                                    <th>QTY (IN)</th>
                                    <th>QTY (OUT)</th>
                                    {activeTab === 'all' && <th>CLOSING</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const transactions = product.inventorytransaction || [];
                                    let filtered = [];
                                    if (activeTab === 'all') filtered = [...transactions].reverse(); // oldest first for closing calc
                                    else if (activeTab === 'purchase') filtered = transactions.filter(t => t.type === 'PURCHASE');
                                    else if (activeTab === 'sales') filtered = transactions.filter(t => t.type === 'SALE');
                                    else if (activeTab === 'stock') filtered = transactions.filter(t => t.type === 'TRANSFER');
                                    else if (activeTab === 'adjustments') filtered = transactions.filter(t => t.type === 'ADJUSTMENT');
                                    else if (activeTab === 'return') filtered = transactions.filter(t => t.type.includes('RETURN'));

                                    if (filtered.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={activeTab === 'all' ? 8 : 7} className="text-center py-8 text-gray-400">
                                                    No {activeTab} records found for this product
                                                </td>
                                            </tr>
                                        );
                                    }

                                    let runningBalance = 0;
                                    const rows = filtered.map((t, idx) => {
                                        const isIn = t.toWarehouseId && (t.type !== 'TRANSFER' || t.toWarehouseId);
                                        const isOut = t.fromWarehouseId && (t.type !== 'TRANSFER' || t.fromWarehouseId);

                                        let inwards = 0;
                                        let outwards = 0;

                                        if (t.type === 'TRANSFER') {
                                            // Handle transfer showing both if it's "All" but usually it's one row per warehouse change
                                            // For product level, a transfer doesn't change total quantity unless it's between companies? 
                                            // Here it's same company. So net is 0.
                                            inwards = t.quantity;
                                            outwards = t.quantity;
                                        } else if (t.toWarehouseId) {
                                            inwards = t.quantity;
                                        } else if (t.fromWarehouseId) {
                                            outwards = t.quantity;
                                        }

                                        if (activeTab === 'all') {
                                            // Special logic for TRANSFER in All: it shows net 0 impact on total.
                                            // But standard cards show the movement.
                                            if (t.type !== 'TRANSFER') {
                                                runningBalance += (inwards - outwards);
                                            }
                                            return (
                                                <tr key={t.id}>
                                                    <td>{new Date(t.date).toLocaleDateString()}</td>
                                                    <td>{t.type}</td>
                                                    <td style={{ maxWidth: '250px' }}>{t.reason?.match(/Voucher: (.*?)\.\s?(.*)/)?.[2] || t.reason || '-'}</td>
                                                    <td><span className="pd-vch-no">{t.reason?.match(/Voucher:\s*(.*?)(?:\.|$)/)?.[1] || '-'}</span></td>
                                                    <td>
                                                        {(() => {
                                                            const fromWH = t.warehouse_inventorytransaction_fromWarehouseIdTowarehouse?.name;
                                                            const toWH = t.warehouse_inventorytransaction_toWarehouseIdTowarehouse?.name;
                                                            if (t.type === 'TRANSFER') return `${fromWH || 'Unknown'} → ${toWH || 'Unknown'}`;
                                                            return toWH || fromWH || '-';
                                                        })()}
                                                    </td>
                                                    <td className="text-green-600">{inwards > 0 ? `+${inwards}` : '-'}</td>
                                                    <td className="text-red-600">{outwards > 0 ? `-${outwards}` : '-'}</td>
                                                    <td className="font-bold">{runningBalance}</td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr key={t.id}>
                                                <td>{new Date(t.date).toLocaleDateString()}</td>
                                                <td>{t.type}</td>
                                                <td style={{ maxWidth: '250px' }}>{t.reason?.match(/Voucher: (.*?)\.\s?(.*)/)?.[2] || t.reason || '-'}</td>
                                                <td><span className="pd-vch-no">{t.reason?.match(/Voucher:\s*(.*?)(?:\.|$)/)?.[1] || '-'}</span></td>
                                                <td>
                                                    {(() => {
                                                        const fromWH = t.warehouse_inventorytransaction_fromWarehouseIdTowarehouse?.name;
                                                        const toWH = t.warehouse_inventorytransaction_toWarehouseIdTowarehouse?.name;
                                                        if (t.type === 'TRANSFER') return `${fromWH || 'Unknown'} → ${toWH || 'Unknown'}`;
                                                        return toWH || fromWH || '-';
                                                    })()}
                                                </td>
                                                <td className="text-green-600">{inwards > 0 ? `+${inwards}` : '-'}</td>
                                                <td className="text-red-600">{outwards > 0 ? `-${outwards}` : '-'}</td>
                                            </tr>
                                        );
                                    });

                                    return activeTab === 'all' ? rows.reverse() : rows;
                                })()}
                            </tbody>
                        </table>
                    </div>
                    <div className="pd-footer-val">
                        Closing Inventory: {totalStock} {product.uom?.unitName} = ₹{itemValue.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;