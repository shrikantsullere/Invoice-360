import React, { useState, useEffect } from 'react';
import {
    Plus, Search, RotateCcw, Edit, Trash2, ChevronRight, X, Calendar, Save, Trash, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import chartOfAccountsService from '../../../../services/chartOfAccountsService';
import GetCompanyId from '../../../../api/GetCompanyId';
import './ContraVoucher.css';

const ContraVoucher = () => {
    const [contraVouchers, setContraVouchers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedContra, setSelectedContra] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        manualReceiptNo: '',
        sourceAccountId: '', // Paid From / Source / Credit
        items: [
            { accountId: '', amount: '', narration: '' } // Deposited To / Destination / Debit
        ],
        mainNarration: ''
    });

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        const companyId = GetCompanyId();

        // Fetch COA
        try {
            const coaRes = await chartOfAccountsService.getChartOfAccounts(companyId);
            if (coaRes.success) {
                // Flatten COA
                let flatAccounts = [];
                const traverse = (groups, parentType = null) => {
                    groups.forEach(group => {
                        const currentType = group.type || parentType;
                        if (group.ledger) {
                            group.ledger.forEach(l => flatAccounts.push({ ...l, groupName: group.name, type: currentType }));
                        }
                        if (group.accountsubgroup) {
                            traverse(group.accountsubgroup, currentType);
                        }
                    });
                };
                traverse(coaRes.data);

                // Filter CASH and BANK accounts only
                setAccounts(flatAccounts.filter(a => ['ASSETS', 'LIABILITIES'].includes(a.type)));
            }
        } catch (error) {
            console.error('Error fetching COA:', error);
            toast.error('Failed to load accounts');
        }

        // Fetch Contra
        try {
            const contraRes = await chartOfAccountsService.getContra(companyId);
            if (contraRes.success) {
                setContraVouchers(contraRes.data);
            }
        } catch (error) {
            console.error('Error fetching contra vouchers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            manualReceiptNo: '',
            sourceAccountId: '',
            items: [{ accountId: '', amount: '', narration: '' }],
            mainNarration: ''
        });
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { accountId: '', amount: '', narration: '' }]
        }));
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length === 1) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const handleSave = async () => {
        try {
            if (!formData.sourceAccountId || !formData.date) {
                toast.error("Please fill required fields (Date, Paid From)");
                return;
            }
            if (formData.items.some(item => !item.accountId || !item.amount)) {
                toast.error("Please fill all item rows (Account and Amount)");
                return;
            }

            // Basic Validation: Source != Destination
            if (formData.items.some(item => item.accountId == formData.sourceAccountId)) {
                toast.error("Source and Destination accounts cannot be the same.");
                return;
            }

            const companyId = GetCompanyId();
            const payload = {
                ...formData,
                companyId,
                items: formData.items.map(item => ({
                    ...item,
                    amount: parseFloat(item.amount)
                }))
            };

            if (selectedContra) {
                await chartOfAccountsService.updateContra(selectedContra.voucherNumber, payload, companyId);
                toast.success('Contra voucher updated successfully');
            } else {
                await chartOfAccountsService.createContra(payload, companyId);
                toast.success('Contra voucher created successfully');
            }

            setIsCreateOpen(false);
            fetchData();
            setSelectedContra(null); // Reset selection
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save contra voucher');
        }
    };

    const handleEdit = (row) => {
        setSelectedContra(row);
        setFormData({
            date: new Date(row.date).toISOString().split('T')[0],
            manualReceiptNo: row.manualReceiptNo || '',
            sourceAccountId: row.sourceAccountId,
            items: row.items.map(i => ({
                accountId: i.accountId,
                amount: i.amount,
                narration: i.narration
            })),
            mainNarration: row.mainNarration || ''
        });
        setIsCreateOpen(true);
    };

    const handleView = (row) => {
        setSelectedContra(row);
        setIsViewOpen(true);
    };

    const openDelete = (contra) => {
        setSelectedContra(contra);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        try {
            await chartOfAccountsService.deleteContra(selectedContra.voucherNumber);
            toast.success('Contra voucher deleted successfully');
            setIsDeleteOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete contra');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="expenses-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Contra Voucher</h1>
                </div>
                <button className="expenses-btn-success" onClick={() => { resetForm(); setSelectedContra(null); setIsCreateOpen(true); }}>
                    <Plus size={18} /> Create Voucher
                </button>
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
                                <th>AUTO REF NO</th>
                                <th>MANUAL REF NO</th>
                                <th>PAID FROM (SOURCE)</th>
                                <th>DEPOSITED TO (DEST)</th>
                                <th>TOTAL AMOUNT</th>
                                <th>NARRATION</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center p-4">Loading...</td></tr>
                            ) : contraVouchers.length > 0 ? (
                                contraVouchers.map((row) => (
                                    <tr key={row.id}>
                                        <td>{new Date(row.date).toLocaleDateString()}</td>
                                        <td>{row.voucherNumber}</td>
                                        <td>{row.manualReceiptNo || '-'}</td>
                                        <td>{row.sourceAccount?.name || '-'}</td>
                                        <td>{row.accounts}</td>
                                        <td>{formatCurrency(row.totalAmount)}</td>
                                        <td>{row.mainNarration || '-'}</td>
                                        <td className="text-left">
                                            <div className="action-buttons1">
                                                <button className="expenses-btn-icon view" onClick={() => handleView(row)} title="View">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="expenses-btn-icon edit" onClick={() => handleEdit(row)} title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="expenses-btn-icon delete" onClick={() => openDelete(row)} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="text-center p-4">No data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {isViewOpen && selectedContra && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h2>View Voucher Details</h2>
                            <button className="close-btn" onClick={() => setIsViewOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Voucher No</label>
                                    <input type="text" value={selectedContra.voucherNumber} disabled className="bg-gray-100" />
                                </div>
                                <div className="form-group half">
                                    <label>Date</label>
                                    <input type="text" value={new Date(selectedContra.date).toLocaleDateString()} disabled className="bg-gray-100" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Manual Ref</label>
                                    <input type="text" value={selectedContra.manualReceiptNo || '-'} disabled className="bg-gray-100" />
                                </div>
                                <div className="form-group half">
                                    <label>Paid From (Source)</label>
                                    <input type="text" value={selectedContra.sourceAccount?.name || '-'} disabled className="bg-gray-100" />
                                </div>
                            </div>

                            <div className="items-table-wrapper mt-4">
                                <table className="items-table view-table">
                                    <thead>
                                        <tr>
                                            <th>Deposited To (Account)</th>
                                            <th>Narration</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedContra.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{accounts.find(a => a.id === item.accountId)?.name || item.accountId}</td>
                                                <td>{item.narration || '-'}</td>
                                                <td>{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="2" className="text-right font-bold">Total:</td>
                                            <td className="text-right font-bold">{formatCurrency(selectedContra.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="form-group mt-4">
                                <label>Main Narration</label>
                                <textarea rows="2" value={selectedContra.mainNarration || '-'} disabled className="bg-gray-100"></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsViewOpen(false)}>Close</button>
                            <button className="btn-save" onClick={() => { setIsViewOpen(false); handleEdit(selectedContra); }}>Edit</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h2>{selectedContra ? 'Edit Voucher' : 'Create Voucher'}</h2>
                            <button className="close-btn" onClick={() => setIsCreateOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Auto Receipt No</label>
                                    <input type="text" value={selectedContra ? selectedContra.voucherNumber : "AUTO-GENERATED"} disabled className="bg-gray-100" />
                                </div>
                                <div className="form-group half">
                                    <label>Manual Receipt No</label>
                                    <input
                                        type="text"
                                        placeholder="Enter manual number"
                                        value={formData.manualReceiptNo}
                                        onChange={(e) => setFormData({ ...formData, manualReceiptNo: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Voucher Date<span className="required">*</span></label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Paid From (Source/Credit)<span className="required">*</span></label>
                                    <select
                                        value={formData.sourceAccountId}
                                        onChange={(e) => setFormData({ ...formData, sourceAccountId: e.target.value })}
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.filter(a => ['ASSETS', 'LIABILITIES'].includes(a.type)).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="items-table-wrapper">
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40%' }}>DEPOSITED TO (DEST/DEBIT)</th>
                                            <th style={{ width: '20%' }}>AMOUNT</th>
                                            <th style={{ width: '30%' }}>NARRATION</th>
                                            <th style={{ width: '10%' }}>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <select
                                                        value={item.accountId}
                                                        onChange={(e) => handleItemChange(index, 'accountId', e.target.value)}
                                                    >
                                                        <option value="">Search account...</option>
                                                        {accounts.filter(a => ['ASSETS', 'LIABILITIES'].includes(a.type)).map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={item.narration}
                                                        onChange={(e) => handleItemChange(index, 'narration', e.target.value)}
                                                        placeholder="Narration for this item"
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <button className="expenses-btn-icon-red" onClick={() => handleRemoveItem(index)}>
                                                        <Trash size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="text-right font-bold">Total:</td>
                                            <td className="font-bold pl-2">{formatCurrency(calculateTotal())}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                                <button className="btn-add-row" onClick={handleAddItem}>
                                    + Add Row
                                </button>
                            </div>

                            <div className="form-group mt-4">
                                <label>Voucher Narration</label>
                                <textarea
                                    rows="3"
                                    placeholder="Enter narration for this voucher..."
                                    value={formData.mainNarration}
                                    onChange={(e) => setFormData({ ...formData, mainNarration: e.target.value })}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSave}>{selectedContra ? 'Update' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteOpen && (
                <div className="modal-overlay">
                    <div className="modal-content small-modal">
                        <div className="modal-header">
                            <h2>Delete Voucher</h2>
                            <button className="close-btn" onClick={() => setIsDeleteOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete voucher <b>{selectedContra?.voucherNumber}</b>?</p>
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

export default ContraVoucher;
