import React, { useState, useEffect } from 'react';
import { FaSackDollar, FaFilePdf, FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';
import './Accounts.css';

const CashFlowAccount = () => {
    // State
    const [cashFlowData, setCashFlowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Fetch Data from API
    useEffect(() => {
        const fetchCashFlowData = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get('/reports/cash-flow-transactions');
                if (response.data.success) {
                    const formattedData = response.data.data.map(item => ({
                        ...item,
                        date: new Date(item.date).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                        })
                    }));
                    setCashFlowData(formattedData);
                }
            } catch (error) {
                console.error('Error fetching cash flow data:', error);
                toast.error('Failed to load cash flow data');
            } finally {
                setLoading(false);
            }
        };

        fetchCashFlowData();
    }, []);

    // Filter Logic
    const filteredData = cashFlowData.filter(item => {
        const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.bank.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesMethod = true;
        if (paymentMethod !== 'All') {
            matchesMethod = item.method === paymentMethod;
        }

        return matchesSearch && matchesMethod;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="ac-container">
            <div className="ac-header">
                <div className="ac-title">
                    <FaSackDollar className="ac-title-icon" />
                    Cash Flow
                </div>
                <div className="ac-subtitle">View and manage your cashflow records easily</div>
            </div>

            <div className="ac-action-bar">
                <div className="d-flex" style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                     <div className="ac-search-box">
                        {/* <FaSearch className="ac-search-icon" /> */}
                        <input 
                            type="text" 
                            className="ac-search-input" 
                            placeholder="Search records..." 
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                        />
                    </div>
                    <select 
                        className="ac-search-input" 
                        style={{width: 'auto', minWidth: '200px'}}
                        value={paymentMethod}
                        onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="All">All Payment Methods</option>
                        <option value="Stripe">Stripe</option>
                        <option value="Cash">Cash</option>
                        <option value="Paypal">Paypal</option>
                    </select>
                </div>
               
                <button className="ac-btn-pdf" onClick={handleDownloadPDF}>
                    <FaFilePdf /> Download PDF
                </button>
            </div>

            <div className="ac-table-card">
                <div className="ac-table-container">
                    <table className="ac-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Bank</th>
                                <th>Description</th>
                                <th>Credit</th>
                                <th>Debit</th>
                                <th>Acc. Bal</th>
                                <th>Total Bal</th>
                                <th>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
                                        Loading cash flow data...
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? currentItems.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.date}</td>
                                    <td>{item.bank}</td>
                                    <td>{item.description}</td>
                                    <td className="text-green">{item.credit}</td>
                                    <td className="text-red">{item.debit}</td>
                                    <td>{item.accBal}</td>
                                    <td>{item.totalBal}</td>
                                    <td>
                                        <span className={`ac-badge ac-badge-${item.method.toLowerCase()}`}>
                                            {item.method}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredData.length > 0 && (
                    <div className="ac-pagination">
                        <div className="ac-pagination-info">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length}
                        </div>
                        <div className="ac-pagination-controls">
                            <button 
                                className="ac-page-btn" 
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                <FaChevronLeft />
                            </button>
                            {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                                <button 
                                    key={page} 
                                    className={`ac-page-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ))}
                            <button 
                                className="ac-page-btn" 
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashFlowAccount;
