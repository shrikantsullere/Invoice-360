import React, { useState, useEffect } from 'react';
import { Download, Search, Settings } from 'lucide-react';
import './TaxReport.css';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';

const TaxReport = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        fetchTaxReport();
    }, [year]);

    const fetchTaxReport = async () => {
        try {
            const companyId = GetCompanyId();
            if (companyId) {
                const response = await axiosInstance.get(`/reports/tax?companyId=${companyId}&year=${year}`);
                if (response.data.success) {
                    setData(response.data.data);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const incomeTaxes = [
        { name: 'CGST', values: data?.income?.CGST || Array(12).fill(0) },
        { name: 'SGST', values: data?.income?.SGST || Array(12).fill(0) },
        { name: 'IGST', values: data?.income?.IGST || Array(12).fill(0) },
    ];

    const expenseTaxes = [
        { name: 'CGST', values: data?.expense?.CGST || Array(12).fill(0) },
        { name: 'SGST', values: data?.expense?.SGST || Array(12).fill(0) },
        { name: 'IGST', values: data?.expense?.IGST || Array(12).fill(0) },
    ];

    return (
        <div className="tax-report-page">
            {/* Header Section */}
            <div className="report-header">
                <div>
                    <h1 className="page-title">Tax Summary</h1>
                </div>
                <button className="btn-download-green">
                    <Download size={18} />
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar card">
                <div className="filter-right">
                    <select className="year-select" value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                    </select>
                    <button className="btn-icon-square green"><Search size={18} /></button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="info-cards-row">
                <div className="info-card card">
                    <label>Report :</label>
                    <h3>Tax Summary</h3>
                </div>
                <div className="info-card card">
                    <label>Duration :</label>
                    <h3>Jan-{year} to Dec-{year}</h3>
                </div>
            </div>

            {/* Income Section */}
            <div className="section-card card">
                <h3 className="section-title">Income</h3>
                <div className="table-responsive">
                    <table className="tax-table">
                        <thead>
                            <tr>
                                <th>TAX</th>
                                {months.map(m => <th key={m}>{m.toUpperCase().substr(0, 3)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {incomeTaxes.map((tax, idx) => (
                                <tr key={idx}>
                                    <td className="tax-name">{tax.name}</td>
                                    {tax.values.map((val, vIdx) => (
                                        <td key={vIdx}>
                                            {val === 0 ? '₹0.00' : `₹${val.toFixed(2)}`}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense Section */}
            <div className="section-card card mt-6">
                <h3 className="section-title">Expense</h3>
                <div className="table-responsive">
                    <table className="tax-table">
                        <thead>
                            <tr>
                                <th>TAX</th>
                                {months.map(m => <th key={m}>{m.toUpperCase().substr(0, 3)}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {expenseTaxes.map((tax, idx) => (
                                <tr key={idx}>
                                    <td className="tax-name">{tax.name}</td>
                                    {tax.values.map((val, vIdx) => (
                                        <td key={vIdx}>
                                            {val === 0 ? '₹0.00' : `₹${val.toFixed(2)}`}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TaxReport;
