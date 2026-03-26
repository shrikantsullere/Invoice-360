import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Pencil, Trash2, Plus, Download, Printer, FileText, Receipt, History, Truck, ShoppingCart } from 'lucide-react';
import { CompanyContext } from '../../../context/CompanyContext';
import './VendorDetail.css';
import vendorService from '../../../services/vendorService';

const VendorDetail = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [vendor, setVendor] = useState(null);
    const [statement, setStatement] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'invoices', 'quotations', 'orders', 'deliveries'

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vendRes, statementRes] = await Promise.all([
                vendorService.getVendorById(id),
                vendorService.getVendorStatement(id)
            ]);

            if (vendRes.success) {
                setVendor(vendRes.data);
            }
            if (statementRes.success) {
                setStatement(statementRes.data.statement);
            }
        } catch (error) {
            console.error("Error fetching vendor details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewBill = (billId) => {
        navigate('/company/purchases/bill', { state: { targetBillId: billId } });
    };

    if (loading) return <div className="p-8 text-center">Loading vendor details...</div>;
    if (!vendor) return <div className="p-8 text-center text-red-500">Vendor not found.</div>;

    const stats = {
        totalBills: vendor.purchasebill?.reduce((acc, bill) => acc + (parseFloat(bill.totalAmount) || 0), 0) || 0,
        paidAmount: vendor.payment?.reduce((acc, pay) => acc + (parseFloat(pay.amount) || 0), 0) || 0,
        balance: vendor.ledger?.currentBalance || 0,
        billCount: vendor.purchasebill?.length || 0,
        overdue: vendor.purchasebill?.filter(b => b.balanceAmount > 0 && new Date(b.dueDate) < new Date()).reduce((acc, b) => acc + (parseFloat(b.balanceAmount) || 0), 0) || 0
    };
    stats.averageBill = stats.billCount > 0 ? stats.totalBills / stats.billCount : 0;

    return (
        <div className="VendorDetail-vendor-detail-page">
            <div className="VendorDetail-detail-header">
                <div className="VendorDetail-header-left">
                    <div className="text-sm text-gray-500 mb-1">Dashboard &gt; Vendor &gt; {vendor.name}</div>
                    <h1 className="VendorDetail-page-title">Manage Vendor Detail</h1>
                </div>
                <div className="VendorDetail-header-actions">
                    <button className="VendorDetail-btn-action VendorDetail-bg-green" onClick={() => navigate('/company/purchases/bill', { state: { sourceData: { vendorId: vendor.id } } })}>
                        Create Bill
                    </button>
                    <button className="VendorDetail-btn-action VendorDetail-bg-green" onClick={() => navigate('/company/purchases/order', { state: { sourceData: { vendorId: vendor.id } } })}>
                        Create Order
                    </button>
                    <button className="VendorDetail-btn-action VendorDetail-bg-green" onClick={() => setActiveTab('ledger')}>
                        Statement
                    </button>
                    <button className="VendorDetail-btn-icon VendorDetail-bg-cyan">
                        <Pencil size={18} />
                    </button>
                    <button className="VendorDetail-btn-icon VendorDetail-bg-red">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="VendorDetail-info-cards-grid">
                <div className="VendorDetail-info-card">
                    <h3 className="VendorDetail-card-title">Vendor Info</h3>
                    <div className="VendorDetail-card-content">
                        <p className="VendorDetail-primary-text">{vendor.name}</p>
                        <p className="VendorDetail-secondary-text">{vendor.email}</p>
                        <p className="VendorDetail-secondary-text">{vendor.phone}</p>
                        <p className="VendorDetail-secondary-text">{vendor.gstNumber && `GST: ${vendor.gstNumber}`}</p>
                    </div>
                </div>
                <div className="VendorDetail-info-card">
                    <h3 className="VendorDetail-card-title">Billing Info</h3>
                    <div className="VendorDetail-card-content">
                        <p className="VendorDetail-primary-text">{vendor.billingName || vendor.name}</p>
                        <p className="VendorDetail-secondary-text VendorDetail-address-text">
                            {vendor.billingAddress}<br />
                            {vendor.billingCity}, {vendor.billingState} {vendor.billingZipCode}<br />
                            {vendor.billingCountry}
                        </p>
                        <p className="VendorDetail-secondary-text">{vendor.billingPhone}</p>
                    </div>
                </div>
                <div className="VendorDetail-info-card">
                    <h3 className="VendorDetail-card-title">Shipping Info</h3>
                    <div className="VendorDetail-card-content">
                        <p className="VendorDetail-primary-text">{vendor.shippingName || vendor.billingName || vendor.name}</p>
                        <p className="VendorDetail-secondary-text VendorDetail-address-text">
                            {vendor.shippingAddress || vendor.billingAddress}<br />
                            {vendor.shippingCity || vendor.billingCity}, {vendor.shippingState || vendor.billingState} {vendor.shippingZipCode || vendor.billingZipCode}<br />
                            {vendor.shippingCountry || vendor.billingCountry}
                        </p>
                        <p className="VendorDetail-secondary-text">{vendor.shippingPhone || vendor.billingPhone}</p>
                    </div>
                </div>
            </div>

            {/* Company Info Wide Card */}
            <div className="VendorDetail-company-info-card">
                <h3 className="VendorDetail-card-title">Company Info</h3>
                <div className="VendorDetail-info-row">
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Vendor Id</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold">#VEND{vendor.id.toString().padStart(5, '0')}</span>
                    </div>
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Date of Creation</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold">{new Date(vendor.createdAt || vendor.creationDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Balance</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold" style={{ color: stats.balance > 0 ? '#ef4444' : '#10b981' }}>
                            {formatCurrency(Math.abs(stats.balance))} {stats.balance > 0 ? '(Cr)' : '(Dr)'}
                        </span>
                    </div>
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Overdue</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold VendorDetail-text-red">
                            {formatCurrency(stats.overdue)}
                        </span>
                    </div>
                </div>
                <div className="VendorDetail-info-row mt-6">
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Total Sum of Bills</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold">{formatCurrency(stats.totalBills)}</span>
                    </div>
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Quantity of Bill</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold">{stats.billCount}</span>
                    </div>
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Average Purchase</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold">{formatCurrency(stats.averageBill)}</span>
                    </div>
                    <div className="VendorDetail-info-item">
                        <span className="VendorDetail-item-label">Paid Amount</span>
                        <span className="VendorDetail-item-value VendorDetail-text-bold">{formatCurrency(stats.paidAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="VendorDetail-tabs-container mt-8">
                <div className="VendorDetail-tabs-header">
                    <button
                        className={`VendorDetail-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ledger')}
                    >
                        <History size={18} /> Transactions History (Ledger)
                    </button>
                    <button
                        className={`VendorDetail-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                        onClick={() => setActiveTab('invoices')}
                    >
                        <FileText size={18} /> Bill
                    </button>
                    <button
                        className={`VendorDetail-tab-btn ${activeTab === 'deliveries' ? 'active' : ''}`}
                        onClick={() => setActiveTab('deliveries')}
                    >
                        <Truck size={18} /> Deliveries
                    </button>
                    <button
                        className={`VendorDetail-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <ShoppingCart size={18} /> Orders
                    </button>
                    <button
                        className={`VendorDetail-tab-btn ${activeTab === 'quotations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quotations')}
                    >
                        <FileText size={18} /> Quotations
                    </button>
                </div>

                <div className="VendorDetail-tab-content mt-4">
                    {activeTab === 'ledger' && (
                        <section className="VendorDetail-detail-section">
                            <div className="VendorDetail-section-header-flex">
                                <h2 className="VendorDetail-section-title">Vendor Ledger / Statement</h2>
                                <button className="VendorDetail-btn-outline-small" onClick={() => window.print()}>
                                    <Printer size={14} /> Print Statement
                                </button>
                            </div>
                            <div className="VendorDetail-table-responsive">
                                <table className="VendorDetail-detail-table statement-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Voucher Type</th>
                                            <th>Voucher No.</th>
                                            <th>Particulars</th>
                                            <th className="text-right">Debit (Dr)</th>
                                            <th className="text-right">Credit (Cr)</th>
                                            <th className="text-right">Running Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="VendorDetail-opening-balance-row">
                                            <td colSpan="4" className="font-semibold italic">Opening Balance</td>
                                            <td className="text-right">-</td>
                                            <td className="text-right">-</td>
                                            <td className="text-right font-bold">{formatCurrency(vendor.ledger?.openingBalance || 0)}</td>
                                        </tr>
                                        {statement.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.date).toLocaleDateString()}</td>
                                                <td><span className={`VendorDetail-voucher-tag ${tx.voucherType.toLowerCase().replace('_', '-')}`}>{tx.voucherType}</span></td>
                                                <td><span className="font-mono text-blue-600">{tx.voucherNumber}</span></td>
                                                <td className="max-w-xs truncate" title={tx.narration}>{tx.narration}</td>
                                                <td className="text-right text-red-600">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                                <td className="text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                                <td className="text-right font-bold">{formatCurrency(tx.balance)}</td>
                                            </tr>
                                        ))}
                                        {statement.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center py-8 text-gray-400">No transaction history found for this vendor.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'invoices' && (
                        <section className="VendorDetail-detail-section">
                            <h2 className="VendorDetail-section-title">Bill List</h2>
                            <div className="VendorDetail-table-responsive">
                                <table className="VendorDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>BILL #</th>
                                            <th>ISSUE DATE</th>
                                            <th>DUE DATE</th>
                                            <th>TOTAL AMOUNT</th>
                                            <th>PAID</th>
                                            <th>BALANCE</th>
                                            <th>STATUS</th>
                                            <th className="text-right">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendor.purchasebill?.map(bill => (
                                            <tr key={bill.id}>
                                                <td>
                                                    <span
                                                        className="VendorDetail-id-badge cursor-pointer hover:opacity-80"
                                                        onClick={() => handleViewBill(bill.id)}
                                                    >
                                                        {bill.billNumber}
                                                    </span>
                                                </td>
                                                <td>{new Date(bill.date).toLocaleDateString()}</td>
                                                <td className="text-red-500">{bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '-'}</td>
                                                <td className="font-semibold">{formatCurrency(parseFloat(bill.totalAmount) || 0)}</td>
                                                <td className="text-green-600">{formatCurrency((parseFloat(bill.totalAmount) || 0) - (parseFloat(bill.balanceAmount) || 0))}</td>
                                                <td className="text-red-600 font-bold">{formatCurrency(parseFloat(bill.balanceAmount) || 0)}</td>
                                                <td>
                                                    <span className={`VendorDetail-status-pill ${bill.status.toLowerCase()}`}>
                                                        {bill.status}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="VendorDetail-table-actions justify-end">
                                                        <button
                                                            className="VendorDetail-table-icon-btn VendorDetail-bg-orange"
                                                            title="View Detail"
                                                            onClick={() => handleViewBill(bill.id)}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button className="VendorDetail-table-icon-btn VendorDetail-bg-cyan" title="Edit"><Pencil size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!vendor.purchasebill || vendor.purchasebill.length === 0) && (
                                            <tr>
                                                <td colSpan="8" className="text-center py-8 text-gray-400">No bills found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'deliveries' && (
                        <section className="VendorDetail-detail-section">
                            <h2 className="VendorDetail-section-title">Goods Receipt Notes (GRN)</h2>
                            <div className="VendorDetail-table-responsive">
                                <table className="VendorDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>GRN #</th>
                                            <th>DATE</th>
                                            <th>ORDER REF</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendor.goodsreceiptnote?.map(grn => (
                                            <tr key={grn.id}>
                                                <td><span className="VendorDetail-id-badge">{grn.grnNumber}</span></td>
                                                <td>{new Date(grn.date).toLocaleDateString()}</td>
                                                <td>{grn.purchaseOrderId ? `#ORD-${grn.purchaseOrderId}` : 'Direct'}</td>
                                                <td><span className={`VendorDetail-status-pill received`}>{grn.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!vendor.goodsreceiptnote || vendor.goodsreceiptnote.length === 0) && (
                                            <tr><td colSpan="4" className="text-center py-8">No GRNs found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'orders' && (
                        <section className="VendorDetail-detail-section">
                            <h2 className="VendorDetail-section-title">Purchase Orders</h2>
                            <div className="VendorDetail-table-responsive">
                                <table className="VendorDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>ORDER #</th>
                                            <th>DATE</th>
                                            <th>TOTAL</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendor.purchaseorder?.map(order => (
                                            <tr key={order.id}>
                                                <td><span className="VendorDetail-id-badge">{order.orderNumber}</span></td>
                                                <td>{new Date(order.date).toLocaleDateString()}</td>
                                                <td>{formatCurrency(parseFloat(order.totalAmount) || 0)}</td>
                                                <td><span className={`VendorDetail-status-pill ${order.status.toLowerCase()}`}>{order.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!vendor.purchaseorder || vendor.purchaseorder.length === 0) && (
                                            <tr><td colSpan="4" className="text-center py-8">No purchase orders found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'quotations' && (
                        <section className="VendorDetail-detail-section">
                            <h2 className="VendorDetail-section-title">Purchase Quotations</h2>
                            <div className="VendorDetail-table-responsive">
                                <table className="VendorDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>QUOTATION #</th>
                                            <th>DATE</th>
                                            <th>TOTAL</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendor.purchasequotation?.map(quotation => (
                                            <tr key={quotation.id}>
                                                <td><span className="VendorDetail-id-badge">{quotation.quotationNumber}</span></td>
                                                <td>{new Date(quotation.date).toLocaleDateString()}</td>
                                                <td>{formatCurrency(parseFloat(quotation.totalAmount) || 0)}</td>
                                                <td><span className={`VendorDetail-status-pill ${quotation.status.toLowerCase()}`}>{quotation.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!vendor.purchasequotation || vendor.purchasequotation.length === 0) && (
                                            <tr><td colSpan="4" className="text-center py-8">No quotations found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorDetail;