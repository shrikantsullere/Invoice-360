import React, { useState, useEffect } from 'react';
import {
    Calendar, Download, Printer, Search, Filter,
    ArrowRightLeft
} from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import './TrialBalance.css';

const TrialBalance = () => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTrialBalance();
    }, [selectedDate]);

    const fetchTrialBalance = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (!companyId) return;

            const response = await axiosInstance.get(`/reports/trial-balance?companyId=${companyId}&date=${selectedDate}`);
            if (response.data.success) {
                setAccounts(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching Trial Balance:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = accounts.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalDebit = filteredAccounts.reduce((acc, item) => acc + (item.debit || 0), 0);
    const totalCredit = filteredAccounts.reduce((acc, item) => acc + (item.credit || 0), 0);

    // Check if balanced within a small margin of error for floating point
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading && accounts.length === 0) return <div className="p-8 text-center">Loading Trial Balance...</div>;

    return (
        <div className="trial-balance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Trial Balance</h1>
                    <p className="page-subtitle">As of {formatDate(selectedDate)}</p>
                </div>
                <div className="header-actions">
                    <div className="date-picker-wrapper">
                        <Calendar size={16} />
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

            {/* Controls */}
            <div className="controls-card">
                <div className="search-group">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search Account Name..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button className="btn-filter"><Filter size={16} /> Filter Group</button>
                </div>
            </div>

            {/* Main Table */}
            <div className="table-card">
                <div className="table-responsive">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Account Name</th>
                                <th>Account Type</th>
                                <th className="text-right">Debit (₹)</th>
                                <th className="text-right">Credit (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length > 0 ? (
                                filteredAccounts.map((row) => (
                                    <tr key={row.id}>
                                        <td className="font-medium text-slate-700">{row.name}</td>
                                        <td>
                                            <span className={`type-badge ${row.type.toLowerCase().replace(/\s/g, '-')}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="text-right">{row.debit > 0 ? `₹${row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                                        <td className="text-right">{row.credit > 0 ? `₹${row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-4 text-gray-500">No accounts found with balance.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="footer-row">
                                <td colSpan={2} className="text-right uppercase tracking-wider">Total</td>
                                <td className="text-right text-blue-700">₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="text-right text-blue-700">₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Balance Status */}
            <div className={`status-bar ${isBalanced ? 'balanced' : 'unbalanced'}`}>
                <div className="icon-wrapper">
                    <ArrowRightLeft size={20} />
                </div>
                {isBalanced ? (
                    <div className="status-info">
                        <strong>Trial Balance is matched</strong>
                        <span>Total Debits equal Total Credits.</span>
                    </div>
                ) : (
                    <div className="status-info">
                        <strong>Difference Detected</strong>
                        <span>Debits and Credits do not match. Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrialBalance;
