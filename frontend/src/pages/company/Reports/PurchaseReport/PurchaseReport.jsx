import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Download, Calendar,
    DollarSign, CheckCircle2, XCircle, AlertCircle,
    ShoppingBag
} from 'lucide-react';
import './PurchaseReport.css';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';

const PurchaseReport = () => {
    const navigate = useNavigate();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summaryStats, setSummaryStats] = useState({
        totalAmount: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        overdue: 0
    });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const companyId = GetCompanyId();
                if (!companyId) {
                    setLoading(false);
                    return;
                }

                const response = await axiosInstance.get('/reports/purchase', {
                    params: { companyId }
                });

                if (response.data.success) {
                    const bills = response.data.data;
                    const summary = response.data.summary || {
                        totalAmount: 0,
                        totalPaid: 0,
                        totalUnpaid: 0,
                        overdue: 0
                    };

                    setSummaryStats(summary);

                    // Flatten bills to items for table
                    const allItems = bills.flatMap(bill =>
                        bill.purchasebillitem.map(item => ({
                            id: item.id,
                            billId: bill.id,
                            billNumber: bill.billNumber,
                            vendorName: bill.vendor?.name || 'Unknown',
                            date: bill.date,
                            dueDate: bill.dueDate,
                            productName: item.product?.name || item.description || 'N/A',
                            category: item.product?.category?.name || 'Uncategorized',
                            quantity: item.quantity,
                            rate: item.rate,
                            amount: item.amount,
                            status: bill.status || 'Pending'
                        }))
                    );

                    setReportData(allItems);
                }
            } catch (error) {
                console.error("Error fetching purchase report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    // Summary Cards Configuration
    const summaryCards = [
        { id: 1, label: 'Total Purchase', value: `₹${summaryStats.totalAmount.toFixed(2)}`, color: 'blue', icon: ShoppingBag },
        { id: 2, label: 'Paid Amount', value: `₹${summaryStats.totalPaid.toFixed(2)}`, color: 'green', icon: CheckCircle2 },
        { id: 3, label: 'Unpaid Amount', value: `₹${summaryStats.totalUnpaid.toFixed(2)}`, color: 'orange', icon: AlertCircle },
        { id: 4, label: 'Overdue', value: `₹${summaryStats.overdue.toFixed(2)}`, color: 'red', icon: XCircle },
    ];

    // Helper for status styles
    const getStatusClass = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'PAID': return 'status-success';
            case 'UNPAID': return 'status-warning';
            case 'PARTIAL': return 'status-info';
            case 'OVERDUE': return 'status-danger';
            default: return 'status-neutral';
        }
    };

    return (
        <div className="purchase-report-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Purchase Report</h1>
                    <p className="page-subtitle">Detailed analysis of your procurement</p>
                </div>
                <div className="header-actions">
                    <div className="date-range-picker">
                        <Calendar size={16} />
                        <span>This Month</span>
                    </div>
                    <button className="btn-export">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                {summaryCards.map((card) => (
                    <div key={card.id} className={`summary-card card-${card.color}`}>
                        <div className="card-content">
                            <span className="card-label">{card.label}</span>
                            <h3 className="card-value">{card.value}</h3>
                        </div>
                        <div className={`card-icon icon-${card.color}`}>
                            <card.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            <div className="report-table-card">
                {/* Table Controls */}
                <div className="table-controls">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search report..." className="search-input" />
                    </div>
                    <div className="controls-right">
                        <button className="btn-outline"><Filter size={16} /> Filter</button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading purchase data...</div>
                    ) : reportData.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No purchase records found.</div>
                    ) : (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Bill #</th>
                                    <th>Date</th>
                                    <th>Vendor</th>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-right">Rate</th>
                                    <th className="text-right">Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="font-mono text-primary text-sm cursor-pointer hover:underline" onClick={() => navigate('/company/purchases/bill', { state: { targetBillId: row.billId } })}>
                                            {row.billNumber}
                                        </td>
                                        <td className="text-sm text-gray-600">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="font-medium">{row.vendorName}</td>
                                        <td className="text-blue-600">{row.productName}</td>
                                        <td><span className="category-badge">{row.category}</span></td>
                                        <td className="text-center">{row.quantity}</td>
                                        <td className="text-right text-gray-600">₹{Number(row.rate).toFixed(2)}</td>
                                        <td className="text-right font-bold">₹{Number(row.amount).toFixed(2)}</td>
                                        <td>
                                            <span className={`status-pill ${getStatusClass(row.status)}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Simple Pagination */}
                <div className="table-footer">
                    <span className="footer-text">Showing {reportData.length} records</span>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReport;
