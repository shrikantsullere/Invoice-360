import React, { useState, useEffect } from 'react';
import {
    Calendar, Download, Printer, Search, Filter,
    ChevronDown, FileText, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import './DayBook.css';

const DayBook = () => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDayBook();
    }, [selectedDate]);

    const fetchDayBook = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (!companyId) return;

            const response = await axiosInstance.get(`/reports/daybook?companyId=${companyId}&date=${selectedDate}`);
            if (response.data.success) {
                setTransactions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching Day Book:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(item =>
        item.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ledger.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.voucherType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalDebit = filteredTransactions.reduce((acc, item) => acc + (item.debit || 0), 0);
    const totalCredit = filteredTransactions.reduce((acc, item) => acc + (item.credit || 0), 0);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading && transactions.length === 0) return <div className="p-8 text-center">Loading Day Book...</div>;

    return (
        <div className="daybook-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Day Book</h1>
                    <p className="page-subtitle">Daily transaction record - {formatDate(selectedDate)}</p>
                </div>
                <div className="header-actions">
                    <div className="date-picker-wrapper">
                        <Calendar size={16} />
                        {/* <span>{formatDate(selectedDate)}</span> */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium ml-2 cursor-pointer w-32"
                        />
                    </div>
                    <button className="btn-icon" title="Print"><Printer size={18} /></button>
                    <button className="btn-primary"><Download size={18} /> Export PDF</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-section">
                <div className="summary-card debit">
                    <div className="card-icon"><ArrowUpCircle size={24} /></div>
                    <div className="card-info">
                        <span className="info-label">Total Debit</span>
                        <h3 className="info-value">₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
                <div className="summary-card credit">
                    <div className="card-icon"><ArrowDownCircle size={24} /></div>
                    <div className="card-info">
                        <span className="info-label">Total Credit</span>
                        <h3 className="info-value">₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
                <div className="summary-card net">
                    <div className="card-icon"><FileText size={24} /></div>
                    <div className="card-info">
                        <span className="info-label">Net Movement</span>
                        <h3 className="info-value">₹{(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="table-controls-card">
                <div className="search-group">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Voucher No or Ledger..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button className="btn-filter"><Filter size={16} /> Filter Type</button>
                </div>
            </div>

            {/* Data Table */}
            <div className="table-card">
                <div className="table-responsive">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Voucher Type</th>
                                <th>Voucher No</th>
                                <th>Particulars (Ledger)</th>
                                <th>Description</th>
                                <th className="text-right">Debit Amount</th>
                                <th className="text-right">Credit Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((row) => (
                                    <tr key={row.id}>
                                        <td className="text-gray-500">{formatDate(row.date)}</td>
                                        <td>
                                            <span className={`voucher-badge ${row.voucherType.toLowerCase()}`}>
                                                {row.voucherType}
                                            </span>
                                        </td>
                                        <td className="font-mono">{row.voucherNo}</td>
                                        <td className="font-medium">{row.ledger}</td>
                                        <td className="text-gray-500 text-sm">{row.description}</td>
                                        <td className="text-right font-medium">{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : '-'}</td>
                                        <td className="text-right font-medium">{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center p-4 text-gray-500">No transactions found for this date.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="footer-row">
                                <td colSpan={5} className="text-right">Total</td>
                                <td className="text-right">₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="text-right">₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DayBook;
