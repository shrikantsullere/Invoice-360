import React, { useState, useEffect } from 'react';
import { FaPlus, FaFilePdf, FaFileExcel, FaEye, FaPen, FaTrash, FaXmark } from 'react-icons/fa6';
import { BsCalendar2Date } from 'react-icons/bs';
import voucherService from '../../../services/voucherService';
import chartOfAccountsService from '../../../services/chartOfAccountsService';
import toast from 'react-hot-toast';
import GetCompanyId from '../../../api/GetCompanyId';
import './Accounts.css';

const ExpensesAccount = () => {
  // --- State Management ---
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState([]);
  const [paidFromLedgers, setPaidFromLedgers] = useState([]);
  const [expenseLedgers, setExpenseLedgers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [searchPaymentNo, setSearchPaymentNo] = useState('');
  const [searchAccount, setSearchAccount] = useState('');
  const [searchManualReceipt, setSearchManualReceipt] = useState('');
  const [voucherNumberCounter, setVoucherNumberCounter] = useState(1);


  // --- Form State ---
  const [formData, setFormData] = useState({
    voucherNumber: '',
    manualReceiptNo: '',
    voucherDate: new Date().toISOString().split('T')[0],
    paidFromLedgerId: '',
    paidToLedgerId: '',
    rows: [{ id: 1, accountId: '', amount: '0.00', narration: '' }],
    voucherNarration: ''
  });

  // Fetch Vouchers and Ledgers on Mount
  useEffect(() => {
    fetchVouchers();
    fetchLedgers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const companyId = GetCompanyId();
      const response = await voucherService.getVouchers(companyId);
      if (response.success) {
        const expenseVouchers = response.data.filter(v => v.voucherType === 'EXPENSE');
        setVouchers(expenseVouchers);
        // Set next voucher number
        if (expenseVouchers.length > 0) {
          const maxNum = Math.max(...expenseVouchers.map(v => {
            const match = v.voucherNumber.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          }));
          setVoucherNumberCounter(maxNum + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      // Fetch payment sources (Cash/Bank accounts)
      const paymentResponse = await chartOfAccountsService.getPaymentSourceLedgers();
      if (paymentResponse.success) {
        setPaidFromLedgers(paymentResponse.data);
      }

      // Fetch expense ledgers
      const expenseResponse = await chartOfAccountsService.getExpenseLedgers();
      if (expenseResponse.success) {
        setExpenseLedgers(expenseResponse.data);
      }
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      toast.error('Failed to load ledger options');
    }
  };

  // --- Actions ---

  const handleOpenCreate = () => {
    setFormData({
      voucherNumber: `EVCH-${voucherNumberCounter}`,
      manualReceiptNo: '',
      voucherDate: new Date().toISOString().split('T')[0],
      paidFromLedgerId: '',
      paidToLedgerId: '',
      rows: [{ id: 1, accountId: '', amount: '0.00', narration: '' }],
      voucherNarration: ''
    });
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleEdit = (voucher) => {
    setFormData({
      voucherNumber: voucher.voucherNumber,
      manualReceiptNo: voucher.manualReceiptNo || '',
      voucherDate: new Date(voucher.date).toISOString().split('T')[0],
      paidFromLedgerId: voucher.paidFromLedgerId || '',
      paidToLedgerId: voucher.paidToLedgerId || '',
      rows: voucher.voucheritem?.map((item, idx) => ({
        id: idx + 1,
        accountId: item.ledgerId || '',
        amount: item.amount.toString(),
        narration: item.narration || ''
      })) || [{ id: 1, accountId: '', amount: '0.00', narration: '' }],
      voucherNarration: voucher.notes || ''
    });
    setIsEditMode(true);
    setCurrentVoucher(voucher);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this voucher?')) {
      try {
        const response = await voucherService.deleteVoucher(id);
        if (response.success) {
          toast.success('Voucher deleted successfully');
          fetchVouchers();
        }
      } catch (error) {
        console.error('Error deleting voucher:', error);
        toast.error('Failed to delete voucher');
      }
    }
  };

  const handleSave = async () => {
    try {
      const companyId = GetCompanyId();
      
      // Prepare voucher data
      const voucherData = {
        voucherNumber: formData.voucherNumber,
        manualReceiptNo: formData.manualReceiptNo,
        voucherType: 'EXPENSE',
        date: formData.voucherDate,
        companyId: parseInt(companyId),
        paidFromLedgerId: parseInt(formData.paidFromLedgerId),
        paidToLedgerId: parseInt(formData.paidToLedgerId),
        notes: formData.voucherNarration,
        items: formData.rows.map(row => ({
          ledgerId: parseInt(row.accountId),
          amount: parseFloat(row.amount || 0),
          narration: row.narration
        }))
      };

      let response;
      if (isEditMode && currentVoucher) {
        response = await voucherService.updateVoucher(currentVoucher.id, voucherData);
      } else {
        response = await voucherService.createVoucher(voucherData);
      }

      if (response.success) {
        toast.success(`Voucher ${isEditMode ? 'updated' : 'created'} successfully`);
        setModalOpen(false);
        fetchVouchers();
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} voucher`);
    }
  };

  const formatCurrency = (amount) => {
    return `R${parseFloat(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleAddRow = () => {
    setFormData({
      ...formData,
      rows: [...formData.rows, { id: Date.now(), accountId: '', amount: '0.00', narration: '' }]
    });
  };

  const handleRemoveRow = (id) => {
    if (formData.rows.length > 1) {
      setFormData({
        ...formData,
        rows: formData.rows.filter(row => row.id !== id)
      });
    }
  };

  const handleAddNarrationToRows = () => {
    if (!formData.voucherNarration) {
      toast.error('Please enter a narration first');
      return;
    }
    const newRows = formData.rows.map(row => ({
      ...row,
      narration: row.narration ? `${row.narration} ${formData.voucherNarration}` : formData.voucherNarration
    }));
    setFormData({ ...formData, rows: newRows });
    toast.success('Narration added to all rows');
  };

  const handleExportPDF = () => {
    toast.success("Preparing PDF for print...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportExcel = () => {
    if (vouchers.length === 0) {
      toast.error("No data available to export");
      return;
    }

    toast.success("Exporting to Excel (CSV)...");
    
    // Define headers
    const headers = ["Date", "Payment No", "Manual Receipt", "Paid From", "Paid To", "Accounts", "Total Amount", "Narration"];
    
    // Prepare data rows
    const rows = vouchers.map(voucher => {
      const totalAmount = voucher.voucheritem?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const accountsStr = voucher.voucheritem?.map(item => 
        `${item.ledger?.name || 'N/A'}: ${item.amount}`
      ).join('; ') || '-';

      return [
        formatDate(voucher.date),
        voucher.voucherNumber,
        voucher.manualReceiptNo || '-',
        voucher.paidFromLedger?.name || '-',
        voucher.paidToLedger?.name || '-',
        accountsStr,
        totalAmount,
        voucher.notes || '-'
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expense_Vouchers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Filter Logic ---
  const filteredVouchers = vouchers.filter(voucher => {
    const paymentNo = voucher.voucherNumber || '';
    const manualNo = voucher.manualReceiptNo || '';
    
    const matchPaymentNo = paymentNo.toLowerCase().includes(searchPaymentNo.toLowerCase());
    
    const matchAccount = searchAccount === '' || voucher.voucheritem?.some(item => 
      item.ledger?.name?.toLowerCase().includes(searchAccount.toLowerCase()) ||
      item.productName?.toLowerCase().includes(searchAccount.toLowerCase())
    );
    
    const matchManualReceipt = manualNo.toLowerCase().includes(searchManualReceipt.toLowerCase());
    
    return matchPaymentNo && matchAccount && matchManualReceipt;
  });

  // --- Render Helpers ---

  return (
    <div className="ac-container">
      {/* Header */}
      <div className="ac-header" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '24px' }}>Expense Voucher</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="ac-btn-icon-red" 
            style={{ background: '#ffe4e6', color: '#e11d48', width: '36px', height: '36px' }}
            onClick={handleExportPDF}
            title="Export as PDF"
          >
            <FaFilePdf />
          </button>
          <button 
            className="ac-btn-icon-blue" 
            style={{ background: '#dcfce7', color: '#16a34a', width: '36px', height: '36px' }}
            onClick={handleExportExcel}
            title="Export to Excel"
          >
            <FaFileExcel />
          </button>
          <button className="ac-btn-add" onClick={handleOpenCreate}>
            <FaPlus /> Create Voucher
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ac-action-bar" style={{ alignItems: 'flex-end', gap: '15px', marginBottom: '20px' }}>
        <div className="ac-form-group" style={{ flex: 1 }}>
          <label className="ac-form-label">Payment No</label>
          <input type="text" className="ac-form-input" placeholder="Search by Payment No..." value={searchPaymentNo} onChange={e => setSearchPaymentNo(e.target.value)} />
        </div>
        <div className="ac-form-group" style={{ flex: 1 }}>
          <label className="ac-form-label">Account</label>
          <input type="text" className="ac-form-input" placeholder="Search by Account..." value={searchAccount} onChange={e => setSearchAccount(e.target.value)} />
        </div>
        <div className="ac-form-group" style={{ flex: 1 }}>
          <label className="ac-form-label">Paid From</label>
          <select className="ac-form-input"><option>All</option><option>Cash</option><option>Bank</option></select>
        </div>
        <div className="ac-form-group" style={{ flex: 1 }}>
          <label className="ac-form-label">Manual Receipt No</label>
          <input type="text" className="ac-form-input" placeholder="Search by Manual Receipt No..." value={searchManualReceipt} onChange={e => setSearchManualReceipt(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <button style={{
          padding: '10px 20px',
          background: '#e2e8f0',
          border: 'none',
          borderRadius: '6px 6px 0 0',
          fontWeight: '600',
          color: '#0f172a',
          borderBottom: '2px solid transparent'
        }}>All Vouchers</button>
      </div>

      {/* Table */}
      <div className="ac-table-card">
        <div className="ac-table-container">
          { loading ? (
            <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
              Loading expense vouchers...
            </div>
          ) : (
            <table className="ac-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>PAYMENT NO</th>
                  <th>MANUAL RECEIPT NO</th>
                  <th>PAID FROM</th>
                  <th>PAID TO</th>
                  <th>ACCOUNTS</th>
                  <th>TOTAL AMOUNT</th>
                  <th>STATUS</th>
                  <th>NARRATION</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.length > 0 ? filteredVouchers.map(voucher => {
                  const totalAmount = voucher.voucheritem?.reduce((sum, item) => sum + item.amount, 0) || 0;
                  const accountsStr = voucher.voucheritem?.map(item => 
                    `${item.ledger?.name || 'N/A'}: ${formatCurrency(item.amount)}`
                  ).join(', ') || '-';
                  
                  return (
                    <tr key={voucher.id}>
                      <td>{formatDate(voucher.date)}</td>
                      <td>{voucher.voucherNumber}</td>
                      <td>{voucher.manualReceiptNo || '-'}</td>
                      <td>{voucher.paidFromLedger?.name || '-'}</td>
                      <td>{voucher.paidToLedger?.name || '-'}</td>
                      <td>{accountsStr}</td>
                      <td>{formatCurrency(totalAmount)}</td>
                      <td>
                        <span className="ac-status-badge status-paid">
                          Paid
                        </span>
                      </td>
                      <td>{voucher.notes || '-'}</td>
                      <td className="ac-actions-cell">
                        <button className="ac-btn-icon-blue" style={{ background: 'transparent', width: 'auto' }} onClick={() => handleEdit(voucher)}><FaEye /></button>
                        <button className="ac-btn-icon-yellow" style={{ background: 'transparent', width: 'auto', color: '#eab308' }} onClick={() => handleEdit(voucher)}><FaPen /></button>
                        <button className="ac-btn-icon-red" style={{ background: 'transparent', width: 'auto' }} onClick={() => handleDelete(voucher.id)}><FaTrash /></button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="10" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
                      No expense vouchers found. Click "Create Voucher" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="ac-pagination">
          <div className="ac-pagination-info">Showing {filteredVouchers.length} result(s)</div>
          <div className="ac-pagination-controls">
            <button className="ac-page-btn" disabled>«</button>
            <button className="ac-page-btn active">1</button>
            <button className="ac-page-btn">»</button>
          </div>
        </div>
      </div>

      {/* Page Info Footer */}
      <div className="ac-page-info">
        <div className="ac-page-info-title">Page Info</div>
        <ul>
          <li>Create and manage payment vouchers for various expenses.</li>
          <li>Each voucher is linked to an account and payment method.</li>
          <li>Helps maintain accurate financial records and expense tracking.</li>
        </ul>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-content" style={{ maxWidth: '900px', width: '95%' }}>
            <div className="ac-modal-header" style={{ padding: '15px 25px' }}>
              <h3 className="ac-modal-title" style={{ fontSize: '18px', fontWeight: '700' }}>{isEditMode ? 'Edit Voucher' : 'Create Voucher'}</h3>
              <button className="ac-close-btn" onClick={() => setModalOpen(false)} style={{ fontSize: '20px' }}><FaXmark /></button>
            </div>
            <div className="ac-modal-body" style={{ padding: '20px 25px' }}>
              <div className="ac-modal-form-row">
                <div className="ac-modal-form-col">
                  <label className="ac-modal-label">Auto Receipt No</label>
                  <input className="ac-modal-input" value={formData.voucherNumber} readOnly style={{ background: '#f8fafc' }} />
                </div>
                <div className="ac-modal-form-col">
                  <label className="ac-modal-label">Manual Receipt No</label>
                  <input className="ac-modal-input" value={formData.manualReceiptNo} onChange={e => setFormData({ ...formData, manualReceiptNo: e.target.value })} />
                </div>
              </div>

              <div className="ac-modal-form-row">
                <div className="ac-modal-form-col">
                  <label className="ac-modal-label">Voucher Date</label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" className="ac-modal-input" style={{ width: '100%' }} value={formData.voucherDate} onChange={e => setFormData({ ...formData, voucherDate: e.target.value })} />
                  </div>
                </div>
                <div className="ac-modal-form-col">
                  <label className="ac-modal-label">Paid From</label>
                  <select className="ac-modal-input" value={formData.paidFromLedgerId} onChange={e => setFormData({ ...formData, paidFromLedgerId: e.target.value })}>
                    <option value="">Select Payment Source</option>
                    {paidFromLedgers.map(ledger => (
                      <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ac-modal-form-row">
                <div className="ac-modal-form-col">
                  <label className="ac-modal-label">Paid To</label>
                  <select className="ac-modal-input" value={formData.paidToLedgerId} onChange={e => setFormData({ ...formData, paidToLedgerId: e.target.value })} style={{ borderColor: '#8ce043' }}>
                    <option value="">Select Account or Vendor</option>
                    {expenseLedgers.map(ledger => (
                      <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ac-modal-form-row" style={{ marginTop: '10px' }}>
                <table className="ac-inner-table">
                  <thead>
                    <tr style={{ background: 'transparent' }}>
                      <th style={{ width: '30%', border: 'none', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>ACCOUNT</th>
                      <th style={{ width: '20%', border: 'none', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>AMOUNT</th>
                      <th style={{ width: '40%', border: 'none', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>NARRATION</th>
                      <th style={{ width: '10%', border: 'none', color: '#1e293b', fontSize: '11px', fontWeight: '700' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.rows.map((row, idx) => (
                      <tr key={row.id}>
                        <td>
                          <select className="ac-inner-input" value={row.accountId} onChange={(e) => {
                            const newRows = [...formData.rows];
                            newRows[idx].accountId = e.target.value;
                            setFormData({ ...formData, rows: newRows });
                          }}>
                            <option value="">Select Account</option>
                            {expenseLedgers.map(ledger => (
                              <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input className="ac-inner-input" type="number" step="0.01" value={row.amount} onChange={(e) => {
                            const newRows = [...formData.rows];
                            newRows[idx].amount = e.target.value;
                            setFormData({ ...formData, rows: newRows });
                          }} />
                        </td>
                        <td>
                          <input className="ac-inner-input" placeholder="Row narration" value={row.narration} onChange={(e) => {
                            const newRows = [...formData.rows];
                            newRows[idx].narration = e.target.value;
                            setFormData({ ...formData, rows: newRows });
                          }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="ac-btn-icon-red" onClick={() => handleRemoveRow(row.id)} style={{ width: '28px', height: '28px', margin: '0 auto', background: '#fee2e2' }}><FaTrash size={12} /></button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ border: 'none' }}>
                      <td colSpan="4" style={{ textAlign: 'right', padding: '15px 0', border: 'none' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px' }}>Total: {formatCurrency(formData.rows.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0))}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                <button 
                  className="ac-btn-add" 
                  style={{ width: 'auto', padding: '8px 15px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}
                  onClick={handleAddRow}
                >
                  <FaPlus size={10} style={{ marginRight: '5px' }} /> Add Row
                </button>
                <button 
                  className="ac-btn-add" 
                  style={{ width: 'auto', padding: '8px 15px', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}
                  onClick={handleAddNarrationToRows}
                >
                  + Add Narration to Rows
                </button>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', fontWeight: '600', color: '#1e293b', marginLeft: 'auto' }}>
                  <input type="checkbox" defaultChecked /> Add Voucher Narration
                </label>
              </div>

              <div className="ac-modal-form-col">
                <label className="ac-modal-label">Narration</label>
                <textarea
                  className="ac-modal-input"
                  rows="3"
                  placeholder="Enter narration for this voucher..."
                  value={formData.voucherNarration}
                  onChange={e => setFormData({ ...formData, voucherNarration: e.target.value })}
                  style={{ resize: 'none' }}
                ></textarea>
              </div>

              <div className="ac-modal-footer" style={{ marginTop: '20px', borderTop: 'none', padding: 0 }}>
                <button className="ac-btn-save" onClick={handleSave} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: '700' }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesAccount;
