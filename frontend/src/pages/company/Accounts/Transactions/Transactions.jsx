import React, { useState, useEffect, useContext } from 'react';
import { Search, Eye, X } from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import { CompanyContext } from '../../../../context/CompanyContext';
import './Transactions.css';

const Transactions = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (!companyId) return;

            const response = await axiosInstance.get(`/reports/transactions?companyId=${companyId}`);
            if (response.data.success) {
                setTransactions(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatVoucherType = (type) => {
        if (!type) return '-';
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    // Filter Logic
    const filteredTransactions = transactions.filter(item =>
        (item.voucherNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.fromTo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.voucherType?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredTransactions.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredTransactions.length / entriesPerPage);

    const changePage = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleView = (txn) => {
        setSelectedTransaction(txn);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTransaction(null);
    };

    return (
        <div className="transactions-page">
            <div className="page-header">
                <h1 className="page-title">All Transactions</h1>
            </div>

            <div className="transactions-card">
                <div className="controls-row">
                    <div className="entries-control">
                        <select
                            value={entriesPerPage}
                            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                            className="entries-select"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="entries-text">entries per page</span>
                    </div>
                    <div className="search-control">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>DATE</th>
                                <th>TRANSACTION ID</th>
                                <th>BALANCE TYPE</th>
                                <th>VOUCHER TYPE</th>
                                <th>VOUCHER NO</th>
                                <th className="text-right">AMOUNT</th>
                                <th>FROM/TO</th>
                                <th>ACCOUNT TYPE</th>
                                <th>NOTE</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentEntries.map((txn, index) => (
                                <tr key={txn.id}>
                                    <td>{indexOfFirstEntry + index + 1}</td>
                                    <td>{formatDate(txn.date)}</td>
                                    <td>{txn.transactionId}</td>
                                    <td>
                                        {/* <span className={`status-badge ${txn.balanceType === 'Debit' ? 'status-debit' : 'status-credit'}`}> */}
                                        {txn.balanceType}

                                    </td>
                                    <td className="voucher-type-cell">{formatVoucherType(txn.voucherType)}</td>
                                    <td>
                                        <div className="voucher-badge">
                                            #{txn.voucherNo}
                                        </div>
                                    </td>
                                    <td className={`text-right font-bold ${txn.balanceType === 'Debit' ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(txn.amount)}
                                    </td>
                                    <td>{txn.fromTo}</td>
                                    <td>{txn.accountType}</td>
                                    <td className="note-cell">{txn.note}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn btn-view"
                                                data-tooltip="View"
                                                onClick={() => handleView(txn)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentEntries.length === 0 && (
                                <tr>
                                    <td colSpan="11" className="text-center p-4 text-gray-500">
                                        {loading ? "Loading transactions..." : "No transactions found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-row">
                    <p className="pagination-info">
                        Showing {filteredTransactions.length > 0 ? indexOfFirstEntry + 1 : 0} to {Math.min(indexOfLastEntry, filteredTransactions.length)} of {filteredTransactions.length} entries
                    </p>
                    <div className="pagination-controls">
                        <button
                            className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Simple logic to show first 5 or logic to show current window
                            // For simplicity: just show up to 5, or if many pages need better logic.
                            // Let's just show current page surrounding.
                            let list = [];
                            // ... complex pagination logic omitted for brevity, let's just show Previous/Next + Current
                            return null;
                        })}
                        {/* Simplified Pagination: Active Page Indicator */}
                        <button className="pagination-btn active">{currentPage}</button>

                        <button
                            className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* View Modal */}
            {isModalOpen && selectedTransaction && (
                <div className="modal-overlay">
                    <div className="transaction-modal-content">
                        <div className="modal-header">
                            <h2>Transaction Details</h2>
                            <button className="close-btn" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Transaction ID:</span>
                                <span className="detail-value">{selectedTransaction.transactionId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date:</span>
                                <span className="detail-value">{formatDate(selectedTransaction.date)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Voucher Type:</span>
                                <span className="detail-value">{selectedTransaction.voucherType}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Voucher No:</span>
                                <span className="detail-value">{selectedTransaction.voucherNo}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Amount:</span>
                                <span className={`detail-value ${selectedTransaction.balanceType === 'Debit' ? 'text-success' : 'text-danger'}`}>
                                    {formatCurrency(selectedTransaction.amount)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Balance Type:</span>
                                <span className="detail-value">{selectedTransaction.balanceType}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">From/To:</span>
                                <span className="detail-value">{selectedTransaction.fromTo}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Account Type:</span>
                                <span className="detail-value">{selectedTransaction.accountType}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Note:</span>
                                <span className="detail-value">{selectedTransaction.note}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-close" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
