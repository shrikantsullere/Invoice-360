import React, { useState, useEffect } from 'react';
import { Download, Calendar, Search, Filter, Printer } from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import './VatReport.css';

const VatReport = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [vatData, setVatData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVatReport();
    }, [year]);

    const fetchVatReport = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (!companyId) return;

            const response = await axiosInstance.get(`/reports/vat?companyId=${companyId}&year=${year}`);
            if (response.data.success) {
                setVatData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching VAT report:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredData = vatData.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalTaxable = filteredData.reduce((acc, item) => acc + item.taxableAmount, 0);
    const totalVat = filteredData.reduce((acc, item) => acc + item.vatAmount, 0);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading && vatData.length === 0) return <div className="p-8 text-center">Loading VAT Report...</div>;

    return (
        <div className="vat-report-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">VAT Report</h1>
                    <p className="page-subtitle">Value Added Tax detailed statement</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline">
                        <Printer size={16} /> Print
                    </button>
                    <button className="btn-primary">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-card">
                <div className="filter-group">
                    <div className="date-range-picker">
                        <Calendar size={16} />
                        <select
                            className="bg-transparent border-none outline-none text-sm font-medium ml-2 cursor-pointer"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="search-group">
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* <button className="btn-filter">
                        <Filter size={16} /> Filter
                    </button> */}
                </div>
            </div>

            {/* Summary Row */}
            <div className="summary-row">
                <div className="summary-card">
                    <span className="summary-label">Total Taxable Amount</span>
                    <h3 className="summary-value">₹{totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="summary-card highlight">
                    <span className="summary-label">Total VAT Amount</span>
                    <h3 className="summary-value">₹{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* Main Table */}
            <div className="table-card">
                <div className="table-responsive">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th className="text-right">Taxable Amount</th>
                                <th className="text-center">VAT Rate (%)</th>
                                <th className="text-right">VAT Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            <span className={`type-badge ${row.type.toLowerCase()}`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="desc-cell">
                                                <span className="desc-text">{row.description}</span>
                                                <span className="desc-date">{formatDate(row.date)}</span>
                                            </div>
                                        </td>
                                        <td className="text-right font-medium">₹{row.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="text-center">{row.vatRate}%</td>
                                        <td className="text-right font-bold">₹{row.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-4 text-gray-500">No records found for this period.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="footer-row">
                                <td colSpan={2} className="text-right">Grand Total</td>
                                <td className="text-right">₹{totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td></td>
                                <td className="text-right">₹{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VatReport;
