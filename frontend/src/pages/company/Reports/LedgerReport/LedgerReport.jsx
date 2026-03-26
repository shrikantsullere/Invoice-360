import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import chartOfAccountsService from '../../../../services/chartOfAccountsService';
import GetCompanyId from '../../../../api/GetCompanyId';
import './LedgerReport.css';

const LedgerReport = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State
    const [ledgers, setLedgers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedAccount, setSelectedAccount] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Helper to flatten COA for dropdown
    const flattenLedgers = (coaData) => {
        let flattened = [];
        const traverse = (groups, parentType = null) => {
            groups.forEach(group => {
                const currentType = group.type || parentType;
                if (group.ledger) {
                    group.ledger.forEach(ledger => flattened.push({ ...ledger, groupName: group.name, groupType: currentType }));
                }
                if (group.accountsubgroup) {
                    traverse(group.accountsubgroup, currentType);
                }
            });
        };
        traverse(coaData);
        // Also try chartOfAccountsService.getAllLedgers if that returns a flat list directly,
        // but traversing the tree is safer if we want grouped structure or specific fields.
        return flattened;
    };

    // Fetch initial data (Ledger List)
    useEffect(() => {
        const fetchLedgers = async () => {
            try {
                // We use getChartOfAccounts to build the dropdown options
                const response = await chartOfAccountsService.getChartOfAccounts();
                if (response.success) {
                    const allLedgers = flattenLedgers(response.data);
                    setLedgers(allLedgers);

                    // Pre-select account if passed via navigation state
                    if (location.state?.accountId) {
                        setSelectedAccount(location.state.accountId);
                    } else if (allLedgers.length > 0) {
                        // Default to first account 
                        setSelectedAccount(allLedgers[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching ledgers:', error);
                toast.error('Failed to load chart of accounts');
            }
        };

        const initDates = () => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            setDateRange({
                startDate: firstDay.toISOString().split('T')[0],
                endDate: lastDay.toISOString().split('T')[0]
            });
        };

        fetchLedgers();
        initDates();
    }, [location.state]);

    // Fetch Transactions when Selected Account Changes or Search is clicked
    const fetchTransactions = async () => {
        if (!selectedAccount) return;

        setLoading(true);
        try {
            const companyId = GetCompanyId();
            // NOTE: The service method might need to support date filtering params.
            // Currently assuming getLedgerTransactions fetches all or we filter client side.
            // If backend supports optional query params, we should pass them.
            // For now, fetching all and filtering client side if needed, or assumig backend gives recent.
            const response = await chartOfAccountsService.getLedgerTransactions(selectedAccount, companyId);
            if (response.success) {
                setTransactions(response.data);
            } else {
                setTransactions([]); // Clear or empty
                if (response.message) toast.error(response.message);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            // toast.error('Failed to fetch transactions'); // Optional, to avoid spam
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch when selectedAccount changes (optional, or wait for search button)
    useEffect(() => {
        if (selectedAccount) {
            fetchTransactions();
        }
    }, [selectedAccount]);

    const handleSearch = () => {
        fetchTransactions();
    };

    const handleReset = () => {
        const today = new Date();
        setDateRange({
            startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
        });
        // Optionally reset account or keep it
        fetchTransactions();
    };

    // Process transactions to add running balance
    const processedTransactions = React.useMemo(() => {
        if (!ledgers || !selectedAccount) return [];

        // Find current ledger for opening balance
        const currentLedger = ledgers.find(l => l.id == selectedAccount);
        
        let openingBalance = 0;
        if (currentLedger) {
            const rawOpening = parseFloat(currentLedger.openingBalance) || 0;
            // Determine if account is naturally Credit (Liabilities, Equity, Income)
            // If so, treat positive Opening Balance as Credit (negative for running balance calc)
            // Note: We need to verify if 'groupType' is successfully populated for nested subgroups.
            // If not, we might default to Dr.
            // For now, let's assume direct groups work.
            // CAUTION: flattenLedgers as written above only captures type from immediate parent if it has it.
            // If traverse is recursive, we need to pass type down.
            
            // Let's rely on ChartOfAccounts.jsx logic which seemed to work.
            // Actually, let's fix flatten logic first properly in the implementation below.
            
            const isCreditNature = ['LIABILITIES', 'EQUITY', 'INCOME'].includes(currentLedger.groupType);
            openingBalance = isCreditNature ? -rawOpening : rawOpening;
        }

        let runningBalance = openingBalance;
        const resultRows = [];
        
        const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        if (endDate) endDate.setHours(23, 59, 59, 999);

        // Filter transactions BEFORE start date to add to opening balance
        let balanceBroughtForward = openingBalance;
        
        // Separate transactions into "Previous" (for B/F calc) and "Current" (for display)
        const displayTxns = [];

        sorted.forEach(txn => {
            const txnDate = new Date(txn.date);
            
            const isDebit = txn.debitLedgerId === parseInt(selectedAccount);
            const isCredit = txn.creditLedgerId === parseInt(selectedAccount);
            const debit = isDebit ? txn.amount : 0;
            const credit = isCredit ? txn.amount : 0;
            
            // Standard Accounting: Asset/Exp (Dr +), Liab/Inc (Cr +).
            // But usually Ledger Report is simple Dr - Cr running balance.
            // Let's assume Dr is positive impact on "Debit Balance".
            const netChange = debit - credit;

            if (startDate && txnDate < startDate) {
                balanceBroughtForward += netChange;
            } else if (!endDate || txnDate <= endDate) {
                displayTxns.push({ ...txn, debit, credit, netChange });
            }
        });

        // Add B/F Row
        resultRows.push({
            id: 'opening',
            date: startDate ? startDate.toISOString() : (currentLedger?.createdAt || new Date().toISOString()),
            partyName: 'Opening Balance (B/F)',
            typeLabel: '',
            voucherNumber: '',
            debit: balanceBroughtForward > 0 ? balanceBroughtForward : 0,
            credit: balanceBroughtForward < 0 ? Math.abs(balanceBroughtForward) : 0,
            balance: balanceBroughtForward,
            isOpening: true
        });

        // Process Display Transactions
        let currentRunBalance = balanceBroughtForward;
        
        displayTxns.forEach(txn => {
            currentRunBalance += txn.netChange;
            
            // Resolve Party Name
            let partyName = '-';
            const isDebit = txn.debit > 0;
            
            if (txn.invoice?.customer) partyName = txn.invoice.customer.name;
            else if (txn.purchaseBill?.vendor) partyName = txn.purchaseBill.vendor.name;
            else if (txn.receipt?.customer) partyName = txn.receipt.customer.name;
            else if (txn.payment?.vendor) partyName = txn.payment.vendor.name;
            else {
                 if (isDebit) partyName = txn.creditLedger?.name || 'Unknown';
                 else partyName = txn.debitLedger?.name || 'Unknown';
            }

            // Type Label
             let typeLabel = txn.voucherType;
             let refNo = txn.voucherNumber;
 
             if (txn.invoice) { typeLabel = 'Invoice'; refNo = txn.invoice.invoiceNumber; }
             else if (txn.purchaseBill) { typeLabel = 'Bill'; refNo = txn.purchaseBill.billNumber; }
             else if (txn.receipt) { typeLabel = 'Receipt'; refNo = txn.receipt.receiptNumber; }
             else if (txn.payment) { typeLabel = 'Payment'; refNo = txn.payment.paymentNumber; }

            resultRows.push({
                ...txn,
                partyName,
                typeLabel,
                refNo,
                balance: currentRunBalance
            });
        });

        return resultRows;
    }, [ledgers, transactions, selectedAccount, dateRange]);

    const currentLedgerName = ledgers.find(l => l.id == selectedAccount)?.name || '';

    return (
        <div className="Ledger-report-page">
            <div className="Ledger-page-header">
                <div>
                    <h1 className="Ledger-page-title">Ledger Summary</h1>
                    {/* <div className="Ledger-breadcrumb">
                        <span className="Ledger-breadcrumb-active">Dashboard</span>
                        <span className="Ledger-breadcrumb-sep">{'>'}</span>
                        <span className="Ledger-breadcrumb-current">Ledger Summary</span>
                    </div> */}
                </div>
                <button className="Ledger-btn-download">
                    <Download size={18} />
                </button>
            </div>

            {/* Filter Card */}
            <div className="Ledger-filter-card">
                <div className="Ledger-filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        className="Ledger-form-input"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                </div>
                <div className="Ledger-filter-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        className="Ledger-form-input"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                </div>
                <div className="Ledger-filter-group" style={{ flexGrow: 1 }}>
                    <label>Account</label>
                    <div className="Ledger-select-wrapper">
                        <select
                            className="Ledger-form-select"
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                        >
                            <option value="">Select Account</option>
                            {ledgers.map(ledger => (
                                <option key={ledger.id} value={ledger.id}>{ledger.name} - {ledger.groupName}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="Ledger-filter-actions">
                    <button className="Ledger-btn-search" onClick={handleSearch} title="Search">
                        <Search size={20} />
                    </button>
                    <button className="Ledger-btn-reset" onClick={handleReset} title="Reset">
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="Ledger-table-card">
                <table className="Ledger-table">
                    <thead>
                        <tr>
                            <th>ACCOUNT NAME</th>
                            <th>CUSTOME/VENDOR NAME</th>
                            <th>TRANSACTION TYPE</th>
                            <th>TRANSACTION DATE</th>
                            <th>DEBIT</th>
                            <th>CREDIT</th>
                            <th>BALANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center p-4">Loading transactions...</td></tr>
                        ) : processedTransactions.length > 0 ? (
                            processedTransactions.map((txn, index) => (
                                <tr key={index}>
                                    <td className="font-medium">{currentLedgerName}</td>
                                    <td>{txn.partyName}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500 }}>{txn.typeLabel}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>#{txn.refNo || txn.voucherNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td>{new Date(txn.date).toLocaleDateString()}</td>
                                    <td className="text-right">{txn.debit > 0 ? formatCurrency(txn.debit) : '-'}</td>
                                    <td className="text-right">{txn.credit > 0 ? formatCurrency(txn.credit) : '-'}</td>
                                    <td className="text-right font-medium">
                                        {formatCurrency(Math.abs(txn.balance))} {txn.balance >= 0 ? 'Dr' : 'Cr'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center p-4">No transactions found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LedgerReport;
