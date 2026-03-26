import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa6';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';
import GetCompanyId from '../../../api/GetCompanyId';
import customerService from '../../../services/customerService';
import vendorService from '../../../services/vendorService';
import './Accounts.css';

const TaxReportAccount = () => {
  const [activeTab, setActiveTab] = useState('purchase'); // 'purchase' or 'sales'
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [partyId, setPartyId] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);

  const companyId = GetCompanyId();

  // Fetch Customers/Vendors
  useEffect(() => {
    const fetchParties = async () => {
      try {
        if (activeTab === 'sales') {
          const res = await customerService.getAllCustomers(companyId);
          setParties(res.data || []);
        } else {
          const res = await vendorService.getAllVendors(companyId);
          setParties(res.data || []);
        }
      } catch (error) {
        console.error('Error fetching parties:', error);
      }
    };
    fetchParties();
    setPartyId('All');
  }, [activeTab, companyId]);

  // Fetch Report Data
  useEffect(() => {
    fetchTaxReport();
  }, [activeTab]);

  const fetchTaxReport = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/reports/tax', {
        params: {
          companyId,
          mode: 'detailed',
          type: activeTab,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          partyId: partyId === 'All' ? null : partyId,
          paymentMethod: paymentMethod === 'All' ? null : paymentMethod
        }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching Tax report:', error);
      toast.error('Failed to load Tax report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['REFERENCE', activeTab === 'purchase' ? 'VENDOR' : 'CUSTOMER', 'DATE', 'AMOUNT', 'PAYMENT METHOD', 'DISCOUNT', 'TAX AMOUNT'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        `"${row.ref}"`,
        `"${row.party}"`,
        `"${new Date(row.date).toLocaleDateString()}"`,
        `"${row.amount}"`,
        `"${row.method}"`,
        `"${row.discount}"`,
        `"${row.tax}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab === 'purchase' ? 'Purchase' : 'Sales'}_Tax_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ac-container">
      {/* Tabs */}
      <div className="ac-tax-tabs">
        <button
          className={`ac-tax-tab ${activeTab === 'purchase' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('purchase')}
        >
          Purchase Tax
        </button>
        <button
          className={`ac-tax-tab ${activeTab === 'sales' ? 'active' : 'inactive'}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Tax
        </button>
      </div>

      {/* Main Card */}
      <div className="ac-table-card">
        {/* Header inside Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
            {activeTab === 'purchase' ? 'Purchase Tax Report' : 'Sales Tax Report'}
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="ac-btn-icon-red" 
              onClick={handleExportPDF}
              style={{ background: '#ffe4e6', color: '#e11d48', width: '32px', height: '32px' }}
              title="Export to PDF"
            >
              <FaFilePdf />
            </button>
            <button 
              className="ac-btn-icon-blue" 
              onClick={handleExportExcel}
              style={{ background: '#dcfce7', color: '#16a34a', width: '32px', height: '32px' }}
              title="Export to Excel"
            >
              <FaFileExcel />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 150px' }}>
            <label className="ac-form-label">Start Date</label>
            <input 
              type="date" 
              className="ac-form-input" 
              value={dateRange.startDate} 
              onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} 
            />
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <label className="ac-form-label">End Date</label>
            <input 
              type="date" 
              className="ac-form-input" 
              value={dateRange.endDate} 
              onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} 
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="ac-form-label">{activeTab === 'purchase' ? 'Vendor' : 'Customer'}</label>
            <select className="ac-form-input" value={partyId} onChange={e => setPartyId(e.target.value)}>
              <option value="All">All {activeTab === 'purchase' ? 'Vendors' : 'Customers'}</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label className="ac-form-label">Payment Method</label>
            <select className="ac-form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Stripe">Stripe</option>
              <option value="PayPal">PayPal</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          <button 
            className="ac-btn-add" 
            onClick={fetchTaxReport}
            disabled={loading}
            style={{ height: '42px', minWidth: '160px', justifyContent: 'center', backgroundColor: 'var(--primary)' }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Table */}
        <div className="ac-table-container">
          <table className="ac-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>REFERENCE</th>
                <th style={{ width: '25%' }}>{activeTab === 'purchase' ? 'VENDOR' : 'CUSTOMER'}</th>
                <th style={{ width: '12%' }}>DATE</th>
                <th style={{ width: '12%' }}>AMOUNT</th>
                <th style={{ width: '13%' }}>PAYMENT METHOD</th>
                <th style={{ width: '10%' }}>DISCOUNT</th>
                <th style={{ width: '13%' }}>TAX AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading report data...</td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map(row => (
                  <tr key={`${row.ref}-${row.id}`}>
                    <td style={{ fontWeight: '600', color: '#64748b' }}>{row.ref}</td>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{row.party}</td>
                    <td>{new Date(row.date).toLocaleDateString()}</td>
                    <td style={{ fontWeight: '600' }}>R{parseFloat(row.amount).toFixed(2)}</td>
                    <td>
                      <span className={`ac-badge ac-badge-${row.method.toLowerCase()}`}>
                        {row.method}
                      </span>
                    </td>
                    <td>R{parseFloat(row.discount).toFixed(2)}</td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>R{parseFloat(row.tax).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No tax transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {!loading && reportData.length > 0 && (
          <div className="ac-pagination">
            <div className="ac-pagination-info">Showing {reportData.length} results</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxReportAccount;
