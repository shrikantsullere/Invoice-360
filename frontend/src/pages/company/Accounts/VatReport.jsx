import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa6';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';
import GetCompanyId from '../../../api/GetCompanyId';
import './Accounts.css';

const VatReportAccount = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [transactionType, setTransactionType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [vatData, setVatData] = useState([]);

  useEffect(() => {
    fetchVatReport();
  }, []);

  const fetchVatReport = async () => {
    try {
      setLoading(true);
      const companyId = GetCompanyId();
      const response = await axiosInstance.get('/reports/vat', {
        params: {
          companyId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type: transactionType
        }
      });

      if (response.data.success) {
        setVatData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching VAT report:', error);
      toast.error('Failed to load VAT report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (vatData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['TYPE', 'DESCRIPTION', 'TAXABLE AMOUNT', 'VAT RATE (%)', 'VAT AMOUNT'];
    const csvContent = [
      headers.join(','),
      ...vatData.map(row => [
        `"${row.type}"`,
        `"${row.description}"`,
        `"${row.taxableAmount.replace('R', '')}"`,
        `"${row.vatRate}"`,
        `"${row.vatAmount.replace('R', '')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `VAT_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ac-container">
      <div className="ac-header">
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '5px', color: 'var(--primary)' }}>GCC VAT Return Report</h2>
        <div className="ac-subtitle">Auto-generated VAT summary.</div>
      </div>

      {/* Filter Section */}
      <div className="ac-table-card" style={{ marginBottom: '25px', padding: '25px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="ac-form-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="ac-form-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Transaction Type</label>
            <select
              className="ac-form-input"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="All">All Transactions</option>
              <option value="Outward">Outward Supplies Only</option>
              <option value="Inward">Inward Supplies Only</option>
            </select>
          </div>

          <button
            className="ac-btn-add"
            onClick={fetchVatReport}
            disabled={loading}
            style={{
              justifyContent: 'center',
              height: '45px',
              minWidth: '150px'
            }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* VAT Summary Section */}
      <div className="ac-table-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>VAT Summary</h3>
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

        <div className="ac-table-container">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Calculating VAT summary...</div>
          ) : (
            <table className="ac-table">
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>TYPE</th>
                  <th style={{ width: '30%' }}>DESCRIPTION</th>
                  <th style={{ width: '20%' }}>TAXABLE AMOUNT</th>
                  <th style={{ width: '15%' }}>VAT RATE (%)</th>
                  <th style={{ width: '15%' }}>VAT AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {vatData.length > 0 ? (
                  vatData.map((row, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: '600', color: '#334155' }}>{row.type}</td>
                      <td>{row.description}</td>
                      <td style={{ fontWeight: '600' }}>{row.taxableAmount}</td>
                      <td>{row.vatRate}</td>
                      <td style={{ fontWeight: '600' }}>{row.vatAmount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No transactions found for the selected period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Page Info Footer */}
      <div className="ac-page-info">
        <div className="ac-page-info-title">Page Info</div>
        <ul>
          <li>VAT (Value Added Tax) is an indirect tax applied on the sale of goods and services.</li>
          <li>It is charged at every stage of the supply chain — from manufacturer to retailer.</li>
          <li>The final consumer ultimately bears the VAT cost while businesses collect and remit it.</li>
        </ul>
      </div>
    </div>
  );
};

export default VatReportAccount;
