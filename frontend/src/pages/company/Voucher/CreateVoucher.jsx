import React, { useState, useEffect, useContext } from 'react';
import { Search, Plus, Pencil, Trash2, X, Eye, Receipt, Upload, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import { CompanyContext } from '../../../context/CompanyContext';
import voucherService from '../../../services/voucherService';
import chartOfAccountsService from '../../../services/chartOfAccountsService';
import vendorService from '../../../services/vendorService';
import customerService from '../../../services/customerService';
import productService from '../../../services/productService';
import inventoryService from '../../../services/inventoryService';
import GetCompanyId from '../../../api/GetCompanyId';
import './CreateVoucher.css';

const CreateVoucher = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Dropdown Data State
    const [accountList, setAccountList] = useState([]);
    const [vendorList, setVendorList] = useState([]);
    const [customerList, setCustomerList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [warehouseList, setWarehouseList] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        voucherNumber: `V-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        voucherType: 'EXPENSE',
        date: new Date().toISOString().split('T')[0],
        companyName: '',
        paidFromAccount: '',
        paidToParty: '',
        notes: ''
    });

    const [items, setItems] = useState([{ id: Date.now(), name: '', rate: 0, qty: 1, amount: 0 }]);
    const [logo, setLogo] = useState(null);
    const [signature, setSignature] = useState(null);

    // Fetch vouchers on component mount
    useEffect(() => {
        fetchVouchers();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const companyId = GetCompanyId();
            const [
                ledgersResponse,
                vendorsResponse,
                customersResponse,
                productsResponse,
                warehousesResponse
            ] = await Promise.allSettled([
                chartOfAccountsService.getAllLedgers(companyId),
                vendorService.getAllVendors(companyId),
                customerService.getAllCustomers(companyId),
                productService.getProducts(companyId),
                inventoryService.getWarehouses(companyId)
            ]);

            const getArray = (res) => {
                if (!res) return [];
                if (Array.isArray(res)) return res;
                if (res.data && Array.isArray(res.data)) return res.data;
                return [];
            };

            if (ledgersResponse.status === 'fulfilled') setAccountList(getArray(ledgersResponse.value));
            if (vendorsResponse.status === 'fulfilled') setVendorList(getArray(vendorsResponse.value));
            if (customersResponse.status === 'fulfilled') setCustomerList(getArray(customersResponse.value));
            if (productsResponse.status === 'fulfilled') setProductList(getArray(productsResponse.value));
            if (warehousesResponse.status === 'fulfilled') setWarehouseList(getArray(warehousesResponse.value));

        } catch (error) {
            console.error('Error fetching dropdown data:', error);
            toast.error('Failed to load some dropdown data');
        }
    };

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const companyId = GetCompanyId();
            const response = await voucherService.getVouchers(companyId);
            if (response.success) {
                setVouchers(response.data);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            toast.error('Failed to fetch vouchers');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (formData.voucherType === 'JOURNAL') {
                // Journal Validation
                if (Math.abs(journalTotals.dr - journalTotals.cr) > 0.01) {
                    toast.error('Total Debit must equal Total Credit');
                    return;
                }
                if (journalRows.some(r => !r.accountId || !r.type)) {
                    toast.error('All rows must have an Account and Type');
                    return;
                }

                // Payload for Journal
                const voucherData = {
                    ...formData,
                    isJournal: true,
                    journalRows: journalRows.map(r => ({
                        type: r.type,
                        accountId: parseInt(r.accountId),
                        debit: parseFloat(r.debit) || 0,
                        credit: parseFloat(r.credit) || 0,
                        narration: r.narration
                    })),
                    companyId: GetCompanyId(),
                    totalAmount: journalTotals.dr,
                    items: []
                };

                const response = await voucherService.createVoucher(voucherData);
                if (response.success) {
                    toast.success('Journal Voucher created successfully');
                    fetchVouchers();
                    handleCloseModal();
                }
                return;
            }

            // Calculate total
            const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

            const voucherData = {
                ...formData,
                items: items.map(item => ({
                    productName: item.name,
                    quantity: item.qty,
                    rate: item.rate,
                    amount: item.amount
                })),
                totalAmount,
                companyId: GetCompanyId(),
                logo,
                signature
            };

            if (selectedVoucher && showEditModal) {
                // Update existing voucher
                const response = await voucherService.updateVoucher(selectedVoucher.id, voucherData);
                if (response.success) {
                    toast.success('Voucher updated successfully');
                    fetchVouchers();
                    handleCloseModal();
                }
            } else {
                // Create new voucher
                const response = await voucherService.createVoucher(voucherData);
                if (response.success) {
                    toast.success('Voucher created successfully');
                    fetchVouchers();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error('Error saving voucher:', error);
            toast.error(error.response?.data?.message || 'Failed to save voucher');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const response = await voucherService.deleteVoucher(selectedVoucher.id);
            if (response.success) {
                toast.success('Voucher deleted successfully');
                fetchVouchers();
                setShowDeleteModal(false);
                setSelectedVoucher(null);
            }
        } catch (error) {
            console.error('Error deleting voucher:', error);
            toast.error('Failed to delete voucher');
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedVoucher(null);
        setFormData({
            voucherNumber: `V-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
            voucherType: 'EXPENSE',
            date: new Date().toISOString().split('T')[0],
            companyName: '',
            paidFromAccount: '',
            paidToParty: '',
            notes: ''
        });
        setItems([{ id: Date.now(), name: '', rate: 0, qty: 1, amount: 0 }]);
        setLogo(null);
        setSignature(null);
    };

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), name: '', rate: 0, qty: 1, amount: 0 }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleLogoUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    setLogo(readerEvent.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleSignatureUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    setSignature(readerEvent.target.result);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleView = (v) => {
        setSelectedVoucher(v);
        setShowViewModal(true);
    };

    const handleEdit = (v) => {
        setSelectedVoucher(v);
        setFormData({
            voucherNumber: v.voucherNumber,
            voucherType: v.voucherType,
            date: new Date(v.date).toISOString().split('T')[0],
            companyName: v.companyName || '',
            paidFromAccount: v.paidFromAccount || '',
            paidFromLedgerId: v.paidFromLedgerId || '',
            paidToParty: v.paidToParty || v.vendor?.name || v.customer?.name || '',
            vendorId: v.vendorId || null,
            customerId: v.customerId || null,
            warehouseId: v.warehouseId || '', // If added to backend later
            notes: v.notes || ''
        });
        setItems(v.voucheritem?.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.productName || item.product?.name,
            rate: item.rate,
            qty: item.quantity,
            amount: item.amount
        })) || [{ id: Date.now(), name: '', rate: 0, qty: 1, amount: 0 }]);
        setLogo(v.logo);
        setSignature(v.signature);
        setShowEditModal(true);
    };

    const [journalRows, setJournalRows] = useState([
        { id: '1', type: 'Dr', accountId: '', debit: '', credit: '', narration: '' },
        { id: '2', type: 'Cr', accountId: '', debit: '', credit: '', narration: '' }
    ]);

    const handleJournalRowChange = (id, field, value) => {
        setJournalRows(prev => prev.map(row => {
            if (row.id === id) {
                const newRow = { ...row, [field]: value };
                if (field === 'type') {
                    newRow.debit = '';
                    newRow.credit = '';
                }
                return newRow;
            }
            return row;
        }));
    };

    const addJournalRow = () => {
        setJournalRows([...journalRows, { id: Date.now().toString(), type: 'Dr', accountId: '', debit: '', credit: '', narration: '' }]);
    };

    const removeJournalRow = (id) => {
        if (journalRows.length > 2) {
            setJournalRows(journalRows.filter(r => r.id !== id));
        } else {
            toast.error("Journal must have at least 2 rows");
        }
    };

    const journalTotals = React.useMemo(() => {
        return journalRows.reduce((acc, row) => ({
            dr: acc.dr + (parseFloat(row.debit) || 0),
            cr: acc.cr + (parseFloat(row.credit) || 0)
        }), { dr: 0, cr: 0 });
    }, [journalRows]);

    const handleDelete = (v) => {
        setSelectedVoucher(v);
        setShowDeleteModal(true);
    };

    // Filtered lists for Dropdowns
    const cashBankLedgers = accountList.filter(acc => {
        const sub = acc.accountsubgroup?.name?.toLowerCase() || '';
        return sub.includes('cash') || sub.includes('bank');
    });

    const payableLedgers = accountList.filter(acc => {
        const sub = acc.accountsubgroup?.name?.toLowerCase() || '';
        return sub.includes('payable');
    });

    const availableProducts = formData.warehouseId
        ? productList.filter(p => p.stock?.some(s => s.warehouseId === parseInt(formData.warehouseId)))
        : productList;

    return (
        <div className="voucher-page">
            <div className="page-header">
                <h1 className="page-title">Vouchers</h1>
                <button className="btn-add" style={{ backgroundColor: '#8ce043' }} onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Create Voucher
                </button>
            </div>

            <div className="voucher-card">
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

                <div className="table-container">
                    <table className="voucher-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>TYPE</th>
                                <th>DATE</th>
                                <th>CUSTOMER/VENDOR</th>
                                <th>VOUCHER NO</th>
                                <th>AMOUNT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">Loading vouchers...</td>
                                </tr>
                            ) : vouchers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">No vouchers found</td>
                                </tr>
                            ) : vouchers.map((v, index) => (
                                <tr key={v.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <span className={`type-badge ${(v.voucherType || '').toLowerCase()}`}>
                                            {v.voucherType}
                                        </span>
                                    </td>
                                    <td>{new Date(v.date).toLocaleDateString()}</td>
                                    <td>{v.paidToParty || v.vendor?.name || v.customer?.name || '-'}</td>
                                    <td className="voucher-no-text">{v.voucherNumber}</td>
                                    <td className="font-semibold text-green-600">{formatCurrency(v.totalAmount || 0)}</td>
                                    <td>
                                        <div className="voucher-action-buttons">
                                            <button className="action-btn btn-view" data-tooltip="View" onClick={() => handleView(v)}>
                                                <Eye size={18} />
                                            </button>
                                            <button className="action-btn btn-edit" data-tooltip="Edit" onClick={() => handleEdit(v)}>
                                                <Pencil size={18} />
                                            </button>
                                            <button className="action-btn btn-delete" data-tooltip="Delete" onClick={() => handleDelete(v)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-row">
                    <p className="pagination-info">Showing 1 to {vouchers.length} of {vouchers.length} entries</p>
                    <div className="pagination-controls">
                        <button className="pagination-btn disabled">Previous</button>
                        <button className="pagination-btn active">1</button>
                        <button className="pagination-btn disabled">Next</button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Voucher Modal */}
            {(showAddModal || showEditModal) && (
                <div className="modal-overlay">
                    <div className="modal-content voucher-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{showEditModal ? 'Edit Voucher' : 'Create Voucher'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group full-width">
                                <label className="form-label">Voucher Type <span className="text-red">*</span></label>
                                <select
                                    className="form-input"
                                    value={formData.voucherType}
                                    onChange={(e) => setFormData({ ...formData, voucherType: e.target.value })}
                                >
                                    <option value="EXPENSE">Expense</option>
                                    <option value="INCOME">Income</option>
                                    <option value="CONTRA">Contra</option>
                                    <option value="JOURNAL">Journal Voucher</option>
                                </select>
                            </div>

                            {formData.voucherType === 'JOURNAL' ? (
                                <div className="journal-mode-content">
                                    <div className="form-grid mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Voucher No</label>
                                            <input className="form-input" value={formData.voucherNumber} onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Date <span className="text-red">*</span></label>
                                            <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Ref No</label>
                                            <input className="form-input" value={formData.manualReceiptNo} onChange={(e) => setFormData({ ...formData, manualReceiptNo: e.target.value })} placeholder="Optional" />
                                        </div>
                                    </div>

                                    <div className="table-container thin-border mb-4">
                                        <table className="voucher-items-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '80px' }}>TYPE</th>
                                                    <th>ACCOUNT</th>
                                                    <th style={{ width: '150px' }}>DEBIT</th>
                                                    <th style={{ width: '150px' }}>CREDIT</th>
                                                    <th>NARRATION</th>
                                                    <th style={{ width: '50px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {journalRows.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>
                                                            <select className="form-input" value={row.type} onChange={(e) => handleJournalRowChange(row.id, 'type', e.target.value)}>
                                                                <option value="Dr">Dr</option>
                                                                <option value="Cr">Cr</option>
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select className="form-input" value={row.accountId} onChange={(e) => handleJournalRowChange(row.id, 'accountId', e.target.value)}>
                                                                <option value="">Select Account</option>
                                                                {accountList.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input className="form-input text-right" disabled={row.type === 'Cr'} value={row.debit} onChange={(e) => handleJournalRowChange(row.id, 'debit', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input className="form-input text-right" disabled={row.type === 'Dr'} value={row.credit} onChange={(e) => handleJournalRowChange(row.id, 'credit', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input className="form-input" value={row.narration} onChange={(e) => handleJournalRowChange(row.id, 'narration', e.target.value)} />
                                                        </td>
                                                        <td className="text-center">
                                                            <button onClick={() => removeJournalRow(row.id)} className="action-btn btn-delete"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="p-3 bg-gray-50 flex justify-between items-center border-t">
                                            <button onClick={addJournalRow} className="flex items-center text-blue-600"><Plus size={16} className="mr-1" /> Add Line</button>
                                            <div className="flex gap-6 font-bold text-sm">
                                                <span>Total Dr: {journalTotals.dr.toFixed(2)}</span>
                                                <span>Total Cr: {journalTotals.cr.toFixed(2)}</span>
                                                <span className={Math.abs(journalTotals.dr - journalTotals.cr) < 0.01 ? 'text-green-600' : 'text-red-600'}>
                                                    DIFF: {Math.abs(journalTotals.dr - journalTotals.cr).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Master Narration</label>
                                        <textarea className="form-input h-20" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Enter journal description..." />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="voucher-header-top">
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label className="form-label">Company Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter Company Name"
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            />
                                        </div>
                                        <div className="logo-upload-area" onClick={handleLogoUpload}>
                                            {logo ? (
                                                <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <>
                                                    <Upload size={24} color="#94a3b8" />
                                                    <span className="logo-upload-placeholder">LOGO<br />Click to upload</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Paid From (Cash/Bank) <span className="text-red">*</span></label>
                                            <select
                                                className="form-input"
                                                value={formData.paidFromLedgerId || ''}
                                                onChange={(e) => {
                                                    const selected = accountList.find(a => a.id.toString() === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        paidFromLedgerId: e.target.value,
                                                        paidFromAccount: selected ? selected.name : ''
                                                    });
                                                }}
                                            >
                                                <option value="">Select Account</option>
                                                {cashBankLedgers.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">
                                                {formData.voucherType === 'INCOME' ? 'Paid To (Customer)' :
                                                    formData.voucherType === 'CONTRA' ? 'Paid To (Bank/Cash)' :
                                                        'Paid To (Vendor/Payable)'} <span className="text-red">*</span>
                                            </label>
                                            <select
                                                className="form-input"
                                                value={
                                                    formData.vendorId ? `v-${formData.vendorId}` :
                                                        formData.customerId ? `c-${formData.customerId}` :
                                                            formData.paidToLedgerId ? `l-${formData.paidToLedgerId}` : ''
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!val) {
                                                        setFormData({ ...formData, vendorId: null, customerId: null, paidToLedgerId: null, paidToParty: '' });
                                                        return;
                                                    }

                                                    const [type, idStr] = val.split('-');
                                                    const id = parseInt(idStr);

                                                    let newData = {
                                                        ...formData,
                                                        vendorId: null,
                                                        customerId: null,
                                                        paidToLedgerId: null,
                                                        paidToParty: ''
                                                    };

                                                    if (type === 'v') {
                                                        const vendor = vendorList.find(v => v.id === id);
                                                        newData.vendorId = id;
                                                        newData.paidToParty = vendor ? vendor.name : '';
                                                    } else if (type === 'c') {
                                                        const customer = customerList.find(c => c.id === id);
                                                        newData.customerId = id;
                                                        newData.paidToParty = customer ? customer.name : '';
                                                    } else if (type === 'l') {
                                                        const ledger = accountList.find(a => a.id === id);
                                                        newData.paidToLedgerId = id;
                                                        newData.paidToParty = ledger ? ledger.name : '';
                                                    }
                                                    setFormData(newData);
                                                }}
                                            >
                                                <option value="">Select Party/Account</option>
                                                {(formData.voucherType === 'EXPENSE' || !formData.voucherType) && (
                                                    <>
                                                        <optgroup label="Vendors">
                                                            {vendorList.map(v => (
                                                                <option key={`v-${v.id}`} value={`v-${v.id}`}>{v.name}</option>
                                                            ))}
                                                        </optgroup>
                                                        <optgroup label="Accounts Payable">
                                                            {payableLedgers.map(acc => (
                                                                <option key={`l-${acc.id}`} value={`l-${acc.id}`}>{acc.name}</option>
                                                            ))}
                                                        </optgroup>
                                                    </>
                                                )}
                                                {formData.voucherType === 'INCOME' && (
                                                    <optgroup label="Customers">
                                                        {customerList.map(c => (
                                                            <option key={`c-${c.id}`} value={`c-${c.id}`}>{c.name}</option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                                {formData.voucherType === 'CONTRA' && (
                                                    <optgroup label="Bank/Cash Accounts">
                                                        {cashBankLedgers.map(acc => (
                                                            <option key={`l-${acc.id}`} value={`l-${acc.id}`}>{acc.name}</option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label className="form-label">Warehouse</label>
                                            <select
                                                className="form-input"
                                                value={formData.warehouseId || ''}
                                                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                                            >
                                                <option value="">Select Warehouse</option>
                                                {warehouseList.map(w => (
                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Voucher Number</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.voucherNumber}
                                                onChange={(e) => setFormData({ ...formData, voucherNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group mb-4" style={{ maxWidth: '50%' }}>
                                        <label className="form-label">Date <span className="text-red">*</span></label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="product-details-header">
                                        <h3 className="product-details-title">Product Details</h3>
                                    </div>

                                    <div className="table-container thin-border">
                                        <table className="voucher-items-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40%' }}>PRODUCT</th>
                                                    <th>RATE</th>
                                                    <th>QTY</th>
                                                    <th>AMOUNT</th>
                                                    <th style={{ width: '50px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <select
                                                                className="form-input input-sm"
                                                                value={item.productId || ''}
                                                                onChange={(e) => {
                                                                    const selectedProduct = productList.find(p => p.id.toString() === e.target.value);
                                                                    const newItems = [...items];

                                                                    if (selectedProduct) {
                                                                        newItems[index].productId = selectedProduct.id;
                                                                        newItems[index].name = selectedProduct.name;
                                                                        // Use purchasePrice for EXPENSE, salePrice for INCOME
                                                                        const rate = formData.voucherType === 'INCOME'
                                                                            ? (selectedProduct.salePrice || 0)
                                                                            : (selectedProduct.purchasePrice || 0);
                                                                        newItems[index].rate = rate;
                                                                        newItems[index].amount = rate * (newItems[index].qty || 1);
                                                                    } else {
                                                                        newItems[index].productId = null;
                                                                        newItems[index].name = '';
                                                                        newItems[index].rate = 0;
                                                                        newItems[index].amount = 0;
                                                                    }
                                                                    setItems(newItems);
                                                                }}
                                                            >
                                                                <option value="">Select Product</option>
                                                                {availableProducts.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input input-sm"
                                                                value={item.rate}
                                                                onChange={(e) => {
                                                                    const newItems = [...items];
                                                                    newItems[index].rate = parseFloat(e.target.value) || 0;
                                                                    newItems[index].amount = newItems[index].rate * newItems[index].qty;
                                                                    setItems(newItems);
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input input-sm"
                                                                value={item.qty}
                                                                onChange={(e) => {
                                                                    const newItems = [...items];
                                                                    newItems[index].qty = parseFloat(e.target.value) || 0;
                                                                    newItems[index].amount = newItems[index].rate * newItems[index].qty;
                                                                    setItems(newItems);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="font-semibold text-center">{formatCurrency(item.amount || 0)}</td>
                                                        <td>
                                                            <button className="btn-delete-item" onClick={() => handleRemoveItem(item.id)}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button className="btn-add-item-link" onClick={handleAddItem} style={{ color: '#8ce043', borderColor: '#8ce043' }}>
                                        + Add Item
                                    </button>

                                    <div className="voucher-footer-grid">
                                        <div className="notes-section">
                                            <label className="form-label">Notes</label>
                                            <textarea
                                                className="form-input textarea"
                                                rows={4}
                                                placeholder="Notes"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            ></textarea>
                                        </div>
                                        <div className="totals-section">
                                            <div className="total-row">
                                                <span>Subtotal</span>
                                                <span>{formatCurrency(items.reduce((sum, i) => sum + (i.amount || 0), 0))}</span>
                                            </div>
                                            <div className="total-row grand-total">
                                                <span>Total</span>
                                                <span>{formatCurrency(items.reduce((sum, i) => sum + (i.amount || 0), 0))}</span>
                                            </div>
                                        </div>
                                    </div>

                                </>
                            )}
                            <div className="signature-section">
                                <span className="signature-label">Signature</span>
                                <div className="signature-upload-wrapper">
                                    {signature && (
                                        <div className="signature-preview mb-3">
                                            <button className="remove-sig" onClick={() => setSignature(null)}><X size={12} /></button>
                                            <img src={signature} alt="Signature" style={{ maxHeight: '80px', borderBottom: '1px solid #eee' }} />
                                        </div>
                                    )}
                                    <button className="btn-upload-signature" onClick={handleSignatureUpload} style={{ backgroundColor: '#8ce043' }}>
                                        <Upload size={16} /> Upload Signature
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                            <button className="btn-submit" style={{ backgroundColor: '#8ce043' }} onClick={handleSubmit}>
                                {showEditModal ? 'Update Voucher' : 'Save Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Voucher Modal */}
            {showViewModal && (
                <div className="modal-overlay">
                    <div className="modal-content voucher-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">View Voucher</h2>
                            <button className="close-btn" onClick={() => setShowViewModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="view-header-grid">
                                <div className="view-group">
                                    <label>VOUCHER TYPE</label>
                                    <span className={`type-badge ${(selectedVoucher?.voucherType || '').toLowerCase()}`}>
                                        {selectedVoucher?.voucherType}
                                    </span>
                                </div>
                                <div className="view-group">
                                    <label>VOUCHER NO</label>
                                    <p className="voucher-no-text">{selectedVoucher?.voucherNumber}</p>
                                </div>
                                <div className="view-group">
                                    <label>DATE</label>
                                    <p>{selectedVoucher?.date ? new Date(selectedVoucher.date).toLocaleDateString() : ''}</p>
                                </div>
                            </div>

                            <div className="view-party-info mt-4">
                                <div className="view-group">
                                    <label>CUSTOMER/VENDOR</label>
                                    <p className="font-bold text-lg">{selectedVoucher?.paidToParty}</p>
                                </div>
                            </div>

                            <div className="product-details-header mt-5">
                                <h3 className="product-details-title">Product Details</h3>
                            </div>

                            <table className="voucher-items-table view-mode">
                                <thead>
                                    <tr>
                                        <th>PRODUCT</th>
                                        <th>RATE</th>
                                        <th>QTY</th>
                                        <th>AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVoucher?.voucheritem?.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.productName || item.product?.name}</td>
                                            <td>{formatCurrency(item.rate || 0)}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.amount || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="voucher-footer-grid mt-4">
                                <div className="notes-section">
                                    <label className="form-label">Notes</label>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[80px]">
                                        {selectedVoucher?.notes || "No additional notes provided."}
                                    </p>
                                </div>
                                <div className="totals-section">
                                    <div className="total-row grand-total">
                                        <span>Total</span>
                                        <span>{formatCurrency(selectedVoucher?.totalAmount || 0)}</span>
                                    </div>
                                    {selectedVoucher?.signature && (
                                        <div className="view-signature mt-4">
                                            <label className="signature-label text-xs">AUTHORIZED SIGNATURE</label>
                                            <img src={selectedVoucher.signature} alt="Signature" style={{ maxHeight: '60px', marginTop: '5px' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
                            <button className="btn-submit" style={{ backgroundColor: '#4dd0e1' }} onClick={() => { setShowViewModal(false); setShowEditModal(true); }}>Edit Voucher</button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Voucher</h2>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete voucher <strong>{selectedVoucher?.voucherNo}</strong>?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn-submit" style={{ backgroundColor: '#ff4d4d' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateVoucher;
