import React, { useState, useEffect } from 'react';
import {
    Plus, Search, RotateCcw, Edit, Trash2, ChevronRight, X, Sparkles, Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import chartOfAccountsService from '../../../../services/chartOfAccountsService';
import './BankTransfer.css';

const BankTransfer = () => {
    const [entries, setEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedEntry, setSelectedEntry] = useState(null);
    const [formData, setFormData] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        date: '',
        reference: '',
        description: ''
    });

    // Fetch Data
    const fetchData = async () => {
        try {
            setLoading(true);
            const [transfersRes, coaRes] = await Promise.all([
                chartOfAccountsService.getTransfers(),
                chartOfAccountsService.getChartOfAccounts()
            ]);

            if (transfersRes.success) {
                setEntries(transfersRes.data);
            }

            if (coaRes.success) {
                // Flatten COA
                let flatAccounts = [];
                const traverse = (groups) => {
                    groups.forEach(group => {
                        if (group.ledger) {
                            group.ledger.forEach(l => flatAccounts.push({ ...l, groupName: group.name }));
                        }
                        if (group.accountsubgroup) {
                            traverse(group.accountsubgroup);
                        }
                    });
                };
                traverse(coaRes.data);
                setAccounts(flatAccounts);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Form Handling
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            fromAccountId: '',
            toAccountId: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            reference: '',
            description: ''
        });
    };

    const openCreate = () => {
        resetForm();
        setIsCreateOpen(true);
    };

    const openEdit = (entry) => {
        setSelectedEntry(entry);
        setFormData({
            fromAccountId: entry.fromAccount?.id || '',
            toAccountId: entry.toAccount?.id || '',
            amount: entry.amount,
            date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
            reference: entry.reference || '',
            description: entry.description || ''
        });
        setIsEditOpen(true);
    };

    const openDelete = (entry) => {
        setSelectedEntry(entry);
        setIsDeleteOpen(true);
    };

    // Actions
    const handleCreate = async () => {
        try {
            if (!formData.fromAccountId || !formData.toAccountId || !formData.amount || !formData.date) {
                toast.error("Please fill required fields");
                return;
            }
            if (formData.fromAccountId == formData.toAccountId) {
                toast.error("Source and Destination accounts must be different");
                return;
            }

            await chartOfAccountsService.createTransfer(formData);
            toast.success('Transfer created successfully');
            setIsCreateOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create transfer');
        }
    };

    const handleUpdate = async () => {
        try {
            await chartOfAccountsService.updateTransfer(selectedEntry.id, formData);
            toast.success('Transfer updated successfully');
            setIsEditOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update transfer');
        }
    };

    const handleDelete = async () => {
        try {
            await chartOfAccountsService.deleteTransfer(selectedEntry.id);
            toast.success('Transfer deleted successfully');
            setIsDeleteOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete transfer');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="bank-transfer-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bank Balance Transfer</h1>
                    <div className="breadcrumb">
                        <Link to="/company/dashboard" className="breadcrumb-link">Dashboard</Link>
                        <ChevronRight size={14} />
                        <span className="breadcrumb-current">Bank Balance Transfer</span>
                    </div>
                </div>
                <button className="btn-success" onClick={openCreate}>
                    <Plus size={18} />
                </button>
            </div>

            <div className="filter-card">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>Date</label>
                        <input type="date" placeholder="YYYY-MM-DD" />
                    </div>
                    <div className="filter-group">
                        <label>From Account</label>
                        <select defaultValue="">
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>To Account</label>
                        <select defaultValue="">
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-actions">
                        <button className="btn-search-green">
                            <Search size={18} />
                        </button>
                        <button className="btn-reset-red">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-card">
                <div className="table-controls">
                    <div className="entries-control">
                        <select defaultValue="10">
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                        <span>entries per page</span>
                    </div>
                    <div className="search-control">
                        <input type="text" placeholder="Search..." />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>FROM ACCOUNT</th>
                                <th>TO ACCOUNT</th>
                                <th>AMOUNT</th>
                                <th>REFERENCE</th>
                                <th>DESCRIPTION</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
                            ) : entries.length > 0 ? (
                                entries.map((row) => (
                                    <tr key={row.id}>
                                        <td>{new Date(row.date).toLocaleDateString()}</td>
                                        <td>{row.fromAccount?.name || '-'}</td>
                                        <td>{row.toAccount?.name || '-'}</td>
                                        <td>{formatCurrency(row.amount)}</td>
                                        <td>{row.reference || '-'}</td>
                                        <td>{row.description || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon edit" onClick={() => openEdit(row)}>
                                                    <Edit size={16} />
                                                </button>
                                                <button className="btn-icon delete" onClick={() => openDelete(row)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="text-center p-4">No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span>Showing {entries.length} entries</span>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h2>Create Transfer</h2>
                            <button className="close-btn" onClick={() => setIsCreateOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>From Account<span className="required">*</span></label>
                                    <select
                                        name="fromAccountId"
                                        value={formData.fromAccountId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option
                                                key={acc.id}
                                                value={acc.id}
                                                disabled={acc.id == formData.toAccountId}
                                            >
                                                {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                    {/* <div className="helper-text">
                                        Create from account here. <Link to="/company/chart-of-accounts" className="link-text">Create from account</Link>
                                    </div> */}
                                </div>
                                <div className="form-group half">
                                    <label>To Account<span className="required">*</span></label>
                                    <select
                                        name="toAccountId"
                                        value={formData.toAccountId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option
                                                key={acc.id}
                                                value={acc.id}
                                                disabled={acc.id == formData.fromAccountId}
                                            >
                                                {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                    {/* <div className="helper-text">
                                        Create to account here. <Link to="/company/chart-of-accounts" className="link-text">Create to account</Link>
                                    </div> */}
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Amount<span className="required">*</span></label>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="Enter Amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Date<span className="required">*</span></label>
                                    <div className="date-input-wrapper">
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reference</label>
                                <input
                                    type="text"
                                    name="reference"
                                    placeholder="Enter Reference"
                                    value={formData.reference}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter Description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                            <button className="btn-create" onClick={handleCreate}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h2>Edit Transfer</h2>
                            <button className="close-btn" onClick={() => setIsEditOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>From Account<span className="required">*</span></label>
                                    <select
                                        name="fromAccountId"
                                        value={formData.fromAccountId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option
                                                key={acc.id}
                                                value={acc.id}
                                                disabled={acc.id == formData.toAccountId}
                                            >
                                                {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group half">
                                    <label>To Account<span className="required">*</span></label>
                                    <select
                                        name="toAccountId"
                                        value={formData.toAccountId}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option
                                                key={acc.id}
                                                value={acc.id}
                                                disabled={acc.id == formData.fromAccountId}
                                            >
                                                {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Amount<span className="required">*</span></label>
                                    <input
                                        type="number"
                                        name="amount"
                                        placeholder="Enter Amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Date<span className="required">*</span></label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reference</label>
                                <input
                                    type="text"
                                    name="reference"
                                    placeholder="Enter Reference"
                                    value={formData.reference}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Enter Description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsEditOpen(false)}>Cancel</button>
                            <button className="btn-create" onClick={handleUpdate}>Update</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteOpen && (
                <div className="modal-overlay">
                    <div className="modal-content small-modal">
                        <div className="modal-header">
                            <h2>Delete Transfer</h2>
                            <button className="close-btn" onClick={() => setIsDeleteOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete this transfer?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsDeleteOpen(false)}>Cancel</button>
                            <button className="btn-delete-confirm" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankTransfer;
