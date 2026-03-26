import React, { useState, useEffect } from 'react';
import {
    Calendar, Download, Printer, Search, Filter,
    ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import './JournalEntries.css';

const JournalEntries = () => {
    const [month, setMonth] = useState(new Date().getMonth()); // 0-11
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEntries, setExpandedEntries] = useState({});

    useEffect(() => {
        fetchJournalEntries();
    }, [month, year]);

    const fetchJournalEntries = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (!companyId) return;

            const response = await axiosInstance.get(`/reports/journal?companyId=${companyId}&year=${year}&month=${month}`);
            if (response.data.success) {
                setEntries(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching Journal entries:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleEntry = (id) => {
        setExpandedEntries(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Filter Logic
    const filteredEntries = entries.filter(item =>
        item.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ledgers.some(l => l.amount.toString().includes(searchTerm))
    );

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    if (loading && entries.length === 0) return <div className="p-8 text-center">Loading Journal Entries...</div>;

    return (
        <div className="journal-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Journal Entries</h1>
                    <p className="page-subtitle">General Journal Register</p>
                </div>
                <div className="header-actions">
                    <div className="date-picker-wrapper flex items-center gap-2">
                        <Calendar size={16} />
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
                        >
                            {monthNames.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
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
                        placeholder="Search Voucher No or Amount..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <button className="btn-filter"><Filter size={16} /> All Types</button>
                </div>
            </div>

            {/* Entries List */}
            <div className="entries-list">
                {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                        <div key={entry.id} className="entry-card">
                            <div className="entry-header">
                                <div className="header-left">
                                    <div className="date-block">
                                        <span className="date-day">{new Date(entry.date).getDate()}</span>
                                        <span className="date-month">{new Date(entry.date).toLocaleString('default', { month: 'short' })}</span>
                                    </div>
                                    <div className="voucher-info">
                                        <span className="voucher-no">{entry.voucherNo}</span>
                                        <span className="voucher-type journal">Journal</span>
                                    </div>
                                </div>
                                <div className="header-right">
                                    <div className="total-block">
                                        <span className="label">Amount</span>
                                        <span className="value">
                                            {/* Display total Debit amount (usually equals Credit) */}
                                            ₹{(entry.ledgers.filter(l => l.nature === 'Debit').reduce((sum, l) => sum + l.amount, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="entry-body">
                                <table className="journal-table">
                                    <thead>
                                        <tr>
                                            <th>Particulars</th>
                                            <th className="text-right width-15">Debit (₹)</th>
                                            <th className="text-right width-15">Credit (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entry.ledgers.map((ledger, idx) => (
                                            <tr key={idx} className={ledger.nature === 'Credit' ? 'credit-row' : ''}>
                                                <td className="particulars-cell">
                                                    <span className="ledger-name">
                                                        {ledger.nature === 'Credit' ? 'To ' : ''}{ledger.name}
                                                    </span>
                                                    {ledger.nature === 'Debit' && <span className="dr-tag">Dr</span>}
                                                </td>
                                                <td className="text-right">
                                                    {ledger.nature === 'Debit' ? ledger.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                                </td>
                                                <td className="text-right">
                                                    {ledger.nature === 'Credit' ? ledger.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="narration-box">
                                    <span className="narration-label">Narration:</span> {entry.narration}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 text-gray-500">No journal entries found for {monthNames[month]} {year}.</div>
                )}
            </div>
        </div>
    );
};

export default JournalEntries;
