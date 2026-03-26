import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Download, Calendar,
    Receipt, FileText, PieChart, Printer,
    CreditCard, Banknote
} from 'lucide-react';
import './POSReport.css';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';

const POSReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summaryStats, setSummaryStats] = useState({
        totalSales: 0,
        totalCash: 0,
        totalCard: 0,
        totalUPI: 0,
        totalOther: 0
    });

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            if (companyId) {
                const response = await axiosInstance.get(`/reports/pos?companyId=${companyId}`);
                if (response.data.success) {
                    const sortedData = processReportData(response.data.data);
                    setReportData(sortedData);
                    setSummaryStats(response.data.summary);
                }
            }
        } catch (error) {
            console.error("Error fetching POS report:", error);
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (data) => {
        // Flatten nested items for tabular display
        let rows = [];
        data.forEach(invoice => {
            if (invoice.posinvoiceitem && invoice.posinvoiceitem.length > 0) {
                invoice.posinvoiceitem.forEach(item => {
                    rows.push({
                        id: item.id,
                        invoiceId: invoice.id,
                        invoiceNo: invoice.invoiceNumber,
                        date: invoice.createdAt,
                        productName: item.product?.name || item.description,
                        paymentType: invoice.paymentMode,
                        amount: item.amount,
                        tax: (item.amount * (item.taxRate || 0)) / 100, // Approximate per item tax if not stored
                        total: item.amount, // Item Amount is usually total line amount
                        time: new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                });
            } else {
                // Should not happen ideally, but handle empty items
                rows.push({
                    id: invoice.id,
                    invoiceId: invoice.id,
                    invoiceNo: invoice.invoiceNumber,
                    date: invoice.createdAt,
                    productName: 'N/A',
                    paymentType: invoice.paymentMode,
                    amount: invoice.subtotal,
                    tax: invoice.taxAmount,
                    total: invoice.totalAmount,
                    time: new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            }
        });
        return rows;
    };


    const summaryCards = [
        { id: 1, label: 'Total Sales', value: `₹${summaryStats.totalSales.toFixed(2)}`, color: 'blue', icon: Receipt },
        { id: 2, label: 'Cash Sales', value: `₹${summaryStats.totalCash.toFixed(2)}`, color: 'green', icon: Banknote },
        { id: 3, label: 'Card/Online', value: `₹${(summaryStats.totalCard + summaryStats.totalUPI + summaryStats.totalOther).toFixed(2)}`, color: 'purple', icon: CreditCard },
    ];

    return (
        <div className="pos-report-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">POS Report</h1>
                    <p className="page-subtitle">Point of Sale transactions and analysis</p>
                </div>
                <div className="header-actions">
                    <div className="date-range-picker">
                        <Calendar size={16} />
                        <span>All Time</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid-three">
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
                        <input type="text" placeholder="Search invoices..." className="search-input" />
                    </div>
                    <div className="controls-right">
                        <button className="btn-outline"><Filter size={16} /> Filter</button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading POS data...</div>
                    ) : reportData.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No POS transactions found.</div>
                    ) : (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Payment Type</th>
                                    <th className="text-right">Total</th>
                                    <th>Time</th>
                                {/* <th className="text-right">Action</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="font-mono text-primary">{row.invoiceNo}</td>
                                        <td className="text-sm text-gray-600">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="font-medium">{row.productName}</td>
                                        <td>
                                            <span className={`payment-badge ${row.paymentType?.toLowerCase()}`}>
                                                {row.paymentType}
                                            </span>
                                        </td>
                                        <td className=" font-bold">₹{Number(row.total).toFixed(2)}</td>
                                        <td className="text-gray-500">{row.time}</td>
                                    {/* <td className="text-right">
                                        <div className="pos-report-action-buttons">
                                            <button className="btn-icon-view" title="View Receipt">
                                                <Printer size={16} />
                                            </button>
                                        </div>
                                    </td> */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default POSReport;
