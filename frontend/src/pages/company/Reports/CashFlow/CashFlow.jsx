import React, { useState, useEffect } from 'react';
import { Download, Search, Settings, Home, ChevronRight } from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import './CashFlow.css';

const CashFlow = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('Monthly'); // 'Monthly' or 'Quarterly'
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState({
        revenue: Array(12).fill(0),
        invoice: Array(12).fill(0),
        payment: Array(12).fill(0),
        bill: Array(12).fill(0)
    });

    useEffect(() => {
        fetchCashFlow();
    }, [year]);

    const fetchCashFlow = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (companyId) {
                const response = await axiosInstance.get(`/reports/cash-flow?companyId=${companyId}&year=${year}`);
                if (response.data.success) {
                    setReportData(response.data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching cash flow:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to aggregate Quarterly
    const getData = (type) => {
        const monthlyData = reportData[type] || Array(12).fill(0);
        if (viewMode === 'Monthly') return monthlyData;

        // Aggregate to 4 quarters
        return [
            monthlyData[0] + monthlyData[1] + monthlyData[2],
            monthlyData[3] + monthlyData[4] + monthlyData[5],
            monthlyData[6] + monthlyData[7] + monthlyData[8],
            monthlyData[9] + monthlyData[10] + monthlyData[11]
        ];
    };

    const columns = viewMode === 'Monthly'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Q1', 'Q2', 'Q3', 'Q4'];

    // Calculated Derived Data
    const revenueData = getData('revenue');
    const invoiceData = getData('invoice');
    const paymentData = getData('payment');
    const billData = getData('bill');

    const totalIncomeData = revenueData.map((v, i) => v + invoiceData[i]);
    const totalExpenseData = paymentData.map((v, i) => v + billData[i]);
    const netProfitData = totalIncomeData.map((v, i) => v - totalExpenseData[i]);

    const formatCurrency = (val) => `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    if (loading) return <div className="p-8 text-center">Loading Cash Flow...</div>;

    return (
        <div className="cashflow-page">
            {/* Header Section */}
            <div className="report-header">
                <div>
                    <h1 className="page-title">Cash Flow</h1>
                </div>
                <button className="btn-download-green">
                    <Download size={18} />
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar card">
                <div className="filter-left">
                    <div className="toggle-group">
                        <button
                            className={`toggle-btn ${viewMode === 'Monthly' ? 'active' : ''}`}
                            onClick={() => setViewMode('Monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'Quarterly' ? 'active' : ''}`}
                            onClick={() => setViewMode('Quarterly')}
                        >
                            Quarterly
                        </button>
                    </div>
                </div>
                <div className="filter-right">
                    <div className="year-selector">
                        <label>Year</label>
                        <select className="year-select" value={year} onChange={(e) => setYear(e.target.value)}>
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="info-cards-row">
                <div className="info-card card">
                    <label>Report :</label>
                    <h3>{viewMode} Cashflow</h3>
                </div>
                <div className="info-card card">
                    <label>Duration :</label>
                    <h3>Jan-{year} to Dec-{year}</h3>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="report-content card">

                {/* Income Section */}
                <div className="section-block">
                    <h3 className="section-heading">Income</h3>
                    <div className="table-responsive">
                        <table className="cashflow-table">
                            <thead>
                                <tr>
                                    <th className="col-category">CATEGORY</th>
                                    {columns.map(m => <th key={m}>{m.toUpperCase()}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="row-group">
                                    <td className="detail-label">Revenue</td>
                                    {revenueData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                                <tr className="row-group">
                                    <td className="detail-label">Invoice</td>
                                    {invoiceData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                                <tr className="row-subtotal-header">
                                    <td colSpan={columns.length + 1}>Total Income = Revenue + Invoice</td>
                                </tr>
                                <tr className="row-total">
                                    <td className="detail-label">Total Income</td>
                                    {totalIncomeData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expense Section */}
                <div className="section-block">
                    <h3 className="section-heading">Expense</h3>
                    <div className="table-responsive">
                        <table className="cashflow-table">
                            <thead>
                                <tr>
                                    <th className="col-category">CATEGORY</th>
                                    {columns.map(m => <th key={m}>{m.toUpperCase()}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="row-group">
                                    <td className="detail-label">Payment</td>
                                    {paymentData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                                <tr className="row-group">
                                    <td className="detail-label">Bill</td>
                                    {billData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                                <tr className="row-subtotal-header">
                                    <td colSpan={columns.length + 1}>Total Expense = Payment + Bill</td>
                                </tr>
                                <tr className="row-total">
                                    <td className="detail-label">Total Expenses</td>
                                    {totalExpenseData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Net Profit Section */}
                <div className="section-block last">
                    <div className="table-responsive">
                        <table className="cashflow-table">
                            <tbody className="profit-body">
                                <tr className="row-subtotal-header profit">
                                    <td colSpan={columns.length + 1}>NET PROFIT = TOTAL INCOME - TOTAL EXPENSE</td>
                                </tr>
                                <tr className="row-total profit-total">
                                    <td className="detail-label">Net Profit</td>
                                    {netProfitData.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CashFlow;
