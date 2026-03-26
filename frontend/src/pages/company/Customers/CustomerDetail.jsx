import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Pencil, Trash2, Plus, Download, Printer, FileText, Receipt, History, Truck, ShoppingCart } from 'lucide-react';
import { CompanyContext } from '../../../context/CompanyContext';
import './CustomerDetail.css';
import customerService from '../../../services/customerService';

const CustomerDetail = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [statement, setStatement] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('statement'); // 'statement', 'invoices', 'quotations', 'orders', 'deliveries'

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [custRes, statementRes] = await Promise.all([
                customerService.getCustomerById(id),
                customerService.getStatement(id)
            ]);

            if (custRes.success) {
                setCustomer(custRes.data);
            }
            if (statementRes.success) {
                setStatement(statementRes.data.statement);
            }
        } catch (error) {
            console.error("Error fetching customer details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (invoiceId) => {
        navigate('/company/sales/invoice', { state: { targetInvoiceId: invoiceId } });
    };

    if (loading) return <div className="p-8 text-center">Loading customer details...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found.</div>;

    const stats = {
        totalSales: customer.invoice?.reduce((acc, inv) => acc + inv.totalAmount, 0) || 0,
        paidAmount: customer.invoice?.reduce((acc, inv) => acc + inv.paidAmount, 0) || 0,
        balance: customer.ledger?.currentBalance || 0,
        invoiceCount: customer.invoice?.length || 0,
        overdue: customer.invoice?.filter(i => i.balanceAmount > 0 && new Date(i.dueDate) < new Date()).reduce((acc, i) => acc + i.balanceAmount, 0) || 0
    };
    stats.averageSales = stats.invoiceCount > 0 ? stats.totalSales / stats.invoiceCount : 0;

    return (
        <div className="CustomerDetail-customer-detail-page">
            <div className="CustomerDetail-detail-header">
                <div className="CustomerDetail-header-left">
                    <div className="text-sm text-gray-500 mb-1">Dashboard &gt; Customer &gt; {customer.name}</div>
                    <h1 className="CustomerDetail-page-title">Manage Customer Detail</h1>
                </div>
                <div className="CustomerDetail-header-actions">
                    <button className="CustomerDetail-btn-action CustomerDetail-bg-green" onClick={() => navigate('/company/sales/invoice')}>
                        Create Invoice
                    </button>
                    <button className="CustomerDetail-btn-action CustomerDetail-bg-green" onClick={() => navigate('/company/sales/quotation')}>
                        Create Quotation
                    </button>
                    <button className="CustomerDetail-btn-action CustomerDetail-bg-green" onClick={() => setActiveTab('statement')}>
                        Statement
                    </button>
                    <button className="CustomerDetail-btn-icon CustomerDetail-bg-cyan">
                        <Pencil size={18} />
                    </button>
                    <button className="CustomerDetail-btn-icon CustomerDetail-bg-red">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="CustomerDetail-info-cards-grid">
                <div className="CustomerDetail-info-card">
                    <h3 className="CustomerDetail-card-title">Customer Info</h3>
                    <div className="CustomerDetail-card-content">
                        <div className="flex items-center gap-4 mb-3">
                            {customer.profileImage && (
                                <img
                                    src={customer.profileImage}
                                    alt={customer.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                                />
                            )}
                            <div>
                                <p className="CustomerDetail-primary-text">{customer.name}</p>
                                <p className="CustomerDetail-secondary-text">{customer.email}</p>
                            </div>
                        </div>
                        <p className="CustomerDetail-secondary-text">{customer.phone}</p>
                        <p className="CustomerDetail-secondary-text">{customer.gstNumber && `GST: ${customer.gstNumber}`}</p>
                        {customer.anyFile && (
                            <div className="mt-3">
                                <a
                                    href={customer.anyFile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    <FileText size={16} /> View Attachment
                                </a>
                            </div>
                        )}
                    </div>
                </div>
                <div className="CustomerDetail-info-card">
                    <h3 className="CustomerDetail-card-title">Billing Info</h3>
                    <div className="CustomerDetail-card-content">
                        <p className="CustomerDetail-primary-text">{customer.billingName || customer.name}</p>
                        <p className="CustomerDetail-secondary-text CustomerDetail-address-text">
                            {customer.billingAddress}<br />
                            {customer.billingCity}, {customer.billingState} {customer.billingZipCode}<br />
                            {customer.billingCountry}
                        </p>
                        <p className="CustomerDetail-secondary-text">{customer.billingPhone}</p>
                    </div>
                </div>
                <div className="CustomerDetail-info-card">
                    <h3 className="CustomerDetail-card-title">Shipping Info</h3>
                    <div className="CustomerDetail-card-content">
                        <p className="CustomerDetail-primary-text">{customer.shippingName || customer.billingName || customer.name}</p>
                        <p className="CustomerDetail-secondary-text CustomerDetail-address-text">
                            {customer.shippingAddress || customer.billingAddress}<br />
                            {customer.shippingCity || customer.billingCity}, {customer.shippingState || customer.billingState} {customer.shippingZipCode || customer.billingZipCode}<br />
                            {customer.shippingCountry || customer.billingCountry}
                        </p>
                        <p className="CustomerDetail-secondary-text">{customer.shippingPhone || customer.billingPhone}</p>
                    </div>
                </div>
            </div>

            {/* Company Info Wide Card */}
            <div className="CustomerDetail-company-info-card">
                <h3 className="CustomerDetail-card-title">Company Info</h3>
                <div className="CustomerDetail-info-row">
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Customer Id</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold">#CUST{customer.id.toString().padStart(5, '0')}</span>
                    </div>
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Date of Creation</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold">{new Date(customer.createdAt || customer.creationDate || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Balance</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold" style={{ color: stats.balance > 0 ? '#10b981' : '#ef4444' }}>
                            {formatCurrency(Math.abs(stats.balance))}
                        </span>
                    </div>
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Overdue</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold CustomerDetail-text-red">
                            {formatCurrency(stats.overdue)}
                        </span>
                    </div>
                </div>
                <div className="CustomerDetail-info-row mt-6">
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Total Sum of Invoices</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold">{formatCurrency(stats.totalSales)}</span>
                    </div>
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Quantity of Invoice</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold">{stats.invoiceCount}</span>
                    </div>
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Average Sales</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold">{formatCurrency(stats.averageSales)}</span>
                    </div>
                    <div className="CustomerDetail-info-item">
                        <span className="CustomerDetail-item-label">Paid Amount</span>
                        <span className="CustomerDetail-item-value CustomerDetail-text-bold">{formatCurrency(stats.paidAmount)}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="CustomerDetail-tabs-container mt-8">
                <div className="tabs-header">
                    <button
                        className={`tab-btn ${activeTab === 'statement' ? 'active' : ''}`}
                        onClick={() => setActiveTab('statement')}
                    >
                        <History size={18} /> Transactions History (Ledger)
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                        onClick={() => setActiveTab('invoices')}
                    >
                        <FileText size={18} /> Invoices
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'deliveries' ? 'active' : ''}`}
                        onClick={() => setActiveTab('deliveries')}
                    >
                        <Truck size={18} /> Deliveries
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <ShoppingCart size={18} /> Orders
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'quotations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('quotations')}
                    >
                        <FileText size={18} /> Quotations
                    </button>
                </div>

                <div className="tab-content mt-4">
                    {activeTab === 'statement' && (
                        <section className="CustomerDetail-detail-section">
                            <div className="section-header-flex">
                                <h2 className="CustomerDetail-section-title">Customer Ledger / Statement</h2>
                                <button className="btn-outline-small" onClick={() => window.print()}>
                                    <Printer size={14} /> Print Statement
                                </button>
                            </div>
                            <div className="CustomerDetail-table-responsive">
                                <table className="CustomerDetail-detail-table statement-table">
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
                                        <tr>
                                            <td colSpan="6" className="font-semibold px-4 py-2 bg-gray-50 text-gray-600 italic">Opening Balance</td>
                                            <td className="text-right font-bold px-4 py-2 bg-gray-50">{formatCurrency(customer.ledger?.openingBalance || 0)}</td>
                                        </tr>
                                        {statement.map(tx => (
                                            <tr key={tx.id}>
                                                <td>{new Date(tx.date).toLocaleDateString()}</td>
                                                <td><span className={`voucher-badge ${tx.voucherType.toLowerCase()}`}>{tx.voucherType}</span></td>
                                                <td><span className="font-mono text-blue-600">{tx.voucherNumber}</span></td>
                                                <td className="max-w-xs truncate" title={tx.narration}>{tx.narration}</td>
                                                <td className="text-right text-red-600">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                                <td className="text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                                <td className="text-right font-bold">{formatCurrency(tx.balance)}</td>
                                            </tr>
                                        ))}
                                        {statement.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center py-8 text-gray-400">No transaction history found for this customer.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'invoices' && (
                        <section className="CustomerDetail-detail-section">
                            <h2 className="CustomerDetail-section-title">Invoice List</h2>
                            <div className="CustomerDetail-table-responsive">
                                <table className="CustomerDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>INVOICE #</th>
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
                                        {customer.invoice?.map(inv => (
                                            <tr key={inv.id}>
                                                <td>
                                                    <span
                                                        className="CustomerDetail-id-badge cursor-pointer hover:opacity-80"
                                                        onClick={() => handleViewInvoice(inv.id)}
                                                    >
                                                        {inv.invoiceNumber}
                                                    </span>
                                                </td>
                                                <td>{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="text-red-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                                                <td className="font-semibold">{formatCurrency(inv.totalAmount)}</td>
                                                <td className="text-green-600">{formatCurrency(inv.paidAmount)}</td>
                                                <td className="text-red-600 font-bold">{formatCurrency(inv.balanceAmount)}</td>
                                                <td>
                                                    <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="CustomerDetail-table-actions justify-end">
                                                        <button
                                                            className="CustomerDetail-table-icon-btn CustomerDetail-bg-orange"
                                                            title="View Detail"
                                                            onClick={() => handleViewInvoice(inv.id)}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button className="CustomerDetail-table-icon-btn CustomerDetail-bg-cyan" title="Edit"><Pencil size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!customer.invoice || customer.invoice.length === 0) && (
                                            <tr>
                                                <td colSpan="8" className="text-center py-8 text-gray-400">No invoices found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                    {activeTab === 'deliveries' && (
                        <section className="CustomerDetail-detail-section">
                            <h2 className="CustomerDetail-section-title">Delivery Challans</h2>
                            <div className="CustomerDetail-table-responsive">
                                <table className="CustomerDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>CHALLAN #</th>
                                            <th>DATE</th>
                                            <th>ORDER REF</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customer.deliverychallan?.map(dc => (
                                            <tr key={dc.id}>
                                                <td><span className="CustomerDetail-id-badge">{dc.challanNumber}</span></td>
                                                <td>{new Date(dc.date).toLocaleDateString()}</td>
                                                <td>{dc.salesOrderId || 'Direct'}</td>
                                                <td><span className={`status-pill ${dc.status.toLowerCase()}`}>{dc.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!customer.deliverychallan || customer.deliverychallan.length === 0) && (
                                            <tr><td colSpan="4" className="text-center py-8">No delivery challans.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'orders' && (
                        <section className="CustomerDetail-detail-section">
                            <h2 className="CustomerDetail-section-title">Sales Orders</h2>
                            <div className="CustomerDetail-table-responsive">
                                <table className="CustomerDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>ORDER #</th>
                                            <th>DATE</th>
                                            <th>TOTAL</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customer.salesorder?.map(so => (
                                            <tr key={so.id}>
                                                <td><span className="CustomerDetail-id-badge">{so.orderNumber}</span></td>
                                                <td>{new Date(so.date).toLocaleDateString()}</td>
                                                <td>{formatCurrency(so.totalAmount)}</td>
                                                <td><span className={`status-pill ${so.status.toLowerCase()}`}>{so.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!customer.salesorder || customer.salesorder.length === 0) && (
                                            <tr><td colSpan="4" className="text-center py-8">No sales orders.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeTab === 'quotations' && (
                        <section className="CustomerDetail-detail-section">
                            <h2 className="CustomerDetail-section-title">Quotations</h2>
                            <div className="CustomerDetail-table-responsive">
                                <table className="CustomerDetail-detail-table">
                                    <thead>
                                        <tr>
                                            <th>QUOTATION #</th>
                                            <th>DATE</th>
                                            <th>TOTAL</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customer.salesquotation?.map(q => (
                                            <tr key={q.id}>
                                                <td><span className="CustomerDetail-id-badge">{q.quotationNumber}</span></td>
                                                <td>{new Date(q.date).toLocaleDateString()}</td>
                                                <td>{formatCurrency(q.totalAmount)}</td>
                                                <td><span className={`status-pill ${q.status.toLowerCase()}`}>{q.status}</span></td>
                                            </tr>
                                        ))}
                                        {(!customer.salesquotation || customer.salesquotation.length === 0) && (
                                            <tr><td colSpan="4" className="text-center py-8">No quotations.</td></tr>
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

export default CustomerDetail;
