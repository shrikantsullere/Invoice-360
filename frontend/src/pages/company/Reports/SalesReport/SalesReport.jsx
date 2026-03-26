import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Download, Calendar,
    DollarSign, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import './SalesReport.css';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import { CompanyContext } from '../../../../context/CompanyContext';
import { useContext } from 'react';

const SalesReport = () => {
    const { formatCurrency } = useContext(CompanyContext);
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
                    console.error("Company ID not found");
                    setLoading(false);
                    return;
                }

                const response = await axiosInstance.get('/reports/sales', {
                    params: { companyId }
                });

                if (response.data.success) {
                    const invoices = response.data.data;
                    const summary = response.data.summary || {
                        totalAmount: 0,
                        totalPaid: 0,
                        totalUnpaid: 0,
                        overdue: 0
                    };

                    setSummaryStats(summary);

                    // Flatten invoices to items for the table
                    const allItems = invoices.flatMap(inv =>
                        inv.invoiceitem.map(item => {
                            const stockQty = item.product?.stock ? item.product.stock.reduce((acc, s) => acc + s.quantity, 0) : 0;
                            return {
                                id: item.id, // Item ID
                                invoiceNumber: inv.invoiceNumber,
                                sku: item.product?.sku || '-',
                                customerName: inv.customer?.name || 'Unknown',
                                customerNameArabic: inv.customer?.nameArabic || '',
                                productName: item.product?.name || item.description || 'Unknown',
                                category: item.product?.category?.name || 'Uncategorized',
                                soldQty: item.quantity,
                                soldAmount: item.amount,
                                instockQty: stockQty,
                                status: inv.status === 'PAID' ? 'Completed' : inv.status
                            };
                        })
                    );
                    setReportData(allItems);
                }
            } catch (error) {
                console.error("Error fetching sales report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    const summaryCards = [
        { id: 1, label: 'Total Amount', value: formatCurrency(summaryStats.totalAmount), color: 'blue', icon: DollarSign },
        { id: 2, label: 'Total Paid', value: formatCurrency(summaryStats.totalPaid), color: 'green', icon: CheckCircle2 },
        { id: 3, label: 'Total Unpaid', value: formatCurrency(summaryStats.totalUnpaid), color: 'red', icon: XCircle },
        { id: 4, label: 'Overdue', value: formatCurrency(summaryStats.overdue), color: 'orange', icon: AlertCircle },
    ];

    // Helper for status styles
    const getStatusClass = (status) => {
        switch (status) {
            case 'Completed': return 'status-success';
            case 'Pending': return 'status-warning';
            case 'Out of Stock': return 'status-danger';
            case 'PAID': return 'status-success';
            case 'UNPAID': return 'status-warning';
            case 'PARTIAL': return 'status-info';
            default: return 'status-neutral';
        }
    };

    return (
        <div className="sales-report-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sales Report</h1>
                    <p className="page-subtitle">Detailed analysis of your sales performance</p>
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
                        <div className="p-4 text-center">Loading...</div>
                    ) : reportData.length === 0 ? (
                        <div className="p-4 text-center">No sales data found.</div>
                    ) : (
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Inv #</th>
                                    <th>SKU</th>
                                    <th>Customer Name</th>
                                    <th>Product Name</th>
                                    <th>Category</th>
                                    <th className="text-center">Sold Qty</th>
                                    <th className="text-right">Sold Amount</th>
                                    <th className="text-center">Instock Qty</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row) => (
                                    <tr key={row.id}>
                                        <td className="font-mono text-sm">{row.invoiceNumber}</td>
                                        <td className="font-mono text-sm">{row.sku}</td>
                                        <td className="font-medium">{row.customerName}</td>
                                        <td className="text-blue-600">{row.productName}</td>
                                        <td><span className="category-badge">{row.category}</span></td>
                                        <td className="text-center">{row.soldQty}</td>
                                        <td className="text-right font-bold">{formatCurrency(row.soldAmount)}</td>
                                        <td className="text-center">
                                            <span className={`stock-badge ${row.instockQty > 10 ? 'high' : row.instockQty > 0 ? 'low' : 'out'}`}>
                                                {row.instockQty}
                                            </span>
                                        </td>
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
                    <span className="footer-text">Showing 1 to {reportData.length} of {reportData.length} entries</span>
                    <div className="pagination">
                        <button disabled>Previous</button>
                        <button className="active">1</button>
                        <button disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
