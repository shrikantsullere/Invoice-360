import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt, FaUser, FaMoneyBillWave, FaEye, FaDownload,
  FaEnvelope, FaWhatsapp, FaPrint, FaTimes
} from 'react-icons/fa';
import payrollService from '../../../api/payrollService';
import toast from 'react-hot-toast';
import './Payroll.css';

const PayslipReport = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    month: 'All Months',
    employee: '',
    status: 'All'
  });

  useEffect(() => {
    fetchPayslips();
  }, [filters]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getPayrollHistory(filters);
      if (response.success) {
        setPayslips(response.data);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleView = (slip) => {
    setSelectedPayslip(slip);
    setShowViewModal(true);
  };

  const handleEmail = (name) => {
    toast.success(`Payslip emailed to ${name}`);
  };

  const handleWhatsapp = (name) => {
    toast.success(`Payslip sent via WhatsApp to ${name}`);
  };

  const handlePrint = (slip) => {
    if (!slip) return;

    const printContent = `
            <html>
                <head>
                    <title>Payslip - ${slip.employee.fullName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                        .payslip-container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 30px; border-radius: 8px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; }
                        .header h1 { margin: 0; color: #2c3e50; font-size: 28px; }
                        .header p { margin: 5px 0; color: #666; }
                        .emp-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8f9fa; padding: 15px; border-radius: 6px; }
                        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color: #2c3e50; }
                        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                        .amount { font-weight: 500; }
                        .total-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 2px solid #2c3e50; font-weight: bold; font-size: 18px; }
                        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
                        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: ${slip.status === 'Paid' ? '#166534' : '#f59e0b'}; }
                    </style>
                </head>
                <body>
                    <div class="payslip-container">
                        <div class="header">
                            <h1>KIAAN TECHNOLOGY</h1>
                            <p>Payslip for the month of ${slip.month} ${slip.year}</p>
                        </div>

                        <div class="emp-info">
                            <div>
                                <p><strong>Payslip No:</strong> PS-${String(slip.id).padStart(3, '0')}</p>
                                <p><strong>Employee Name:</strong> ${slip.employee.fullName}</p>
                                <p><strong>Department:</strong> ${slip.employee.department}</p>
                            </div>
                            <div style="text-align: right;">
                                <p><strong>Payment Status:</strong> <span class="status-badge">${slip.status}</span></p>
                                <p><strong>Basic Salary:</strong> R${slip.basicSalary.toLocaleString()}</p>
                            </div>
                        </div>

                        <div class="details-grid">
                            <div>
                                <div class="section-title">Earnings</div>
                                <div class="row"><span>Basic Salary</span> <span class="amount">R${slip.basicSalary.toLocaleString()}</span></div>
                                ${slip.details.filter(d => d.type === 'EARNING').map(d => `
                                     <div class="row"><span>${d.componentName}</span> <span class="amount">R${d.amount.toLocaleString()}</span></div>
                                `).join('')}
                            </div>
                            <div>
                                <div class="section-title">Deductions</div>
                                ${slip.details.filter(d => d.type === 'DEDUCTION').map(d => `
                                     <div class="row"><span>${d.componentName}</span> <span class="amount">R${d.amount.toLocaleString()}</span></div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="total-row">
                            <span>Net Payable Amount</span>
                            <span>R${slip.netSalary.toLocaleString()}</span>
                        </div>

                        <div class="footer">
                            <p>This is a computer-generated document and does not require a signature.</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = (slip) => {
    handlePrint(slip);
    toast.success('Downloading payslip...');
  };

  return (
    <div className="em-container">
      <div className="em-header">
        <h2>Payslip Reports</h2>
      </div>

      {/* Filter Bar */}
      <div className="pr-filter-container">
        <div className="pr-filter-item">
          <FaCalendarAlt className="pr-filter-icon" />
          <select
            className="em-input pr-input-pl"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option value="All Months">All Months</option>
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="pr-filter-item">
          <FaUser className="pr-filter-icon" />
          <input
            type="text"
            className="em-input pr-input-pl"
            placeholder="Filter by Employee Name"
            value={filters.employee}
            onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
          />
        </div>
        <div className="pr-filter-item">
          <FaMoneyBillWave className="pr-filter-icon" />
          <select
            className="em-input pr-input-pl"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="em-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading reports...</div>
        ) : (
          <table className="em-table">
            <thead>
              <tr>
                <th>PAYSLIP NO</th>
                <th>EMPLOYEE NAME</th>
                <th>DEPARTMENT</th>
                <th>MONTH</th>
                <th>NET SALARY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length > 0 ? payslips.map(slip => (
                <tr key={slip.id} className="em-row">
                  <td>PS-{String(slip.id).padStart(3, '0')}</td>
                  <td><strong>{slip.employee.fullName}</strong></td>
                  <td>{slip.employee.department}</td>
                  <td>{slip.month} {slip.year}</td>
                  <td><strong>R{slip.netSalary.toLocaleString()}</strong></td>
                  <td>
                    <span className={slip.status === 'Paid' ? 'gp-status-paid' : 'gp-status-pending'}>
                      {slip.status}
                    </span>
                  </td>
                  <td>
                    <div className="gp-action-row">
                      <button
                        className="gp-icon-btn gp-btn-eye"
                        title="View"
                        onClick={() => handleView(slip)}
                      >
                        <FaEye />
                      </button>
                      <button
                        className="gp-icon-btn gp-btn-download"
                        title="Download PDF"
                        onClick={() => handleDownload(slip)}
                      >
                        <FaDownload />
                      </button>
                      <button
                        className="gp-icon-btn gp-btn-mail"
                        title="Email"
                        onClick={() => handleEmail(slip.employee.fullName)}
                      >
                        <FaEnvelope />
                      </button>
                      <button
                        className="gp-icon-btn gp-btn-whatsapp"
                        title="WhatsApp"
                        onClick={() => handleWhatsapp(slip.employee.fullName)}
                      >
                        <FaWhatsapp />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>No reports found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedPayslip && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '500px' }}>
            <div className="em-modal-header">
              <h3>Payslip PS-{String(selectedPayslip.id).padStart(3, '0')}</h3>
              <button className="em-close-btn" onClick={() => setShowViewModal(false)}><FaTimes /></button>
            </div>
            <div className="em-modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <h4>{selectedPayslip.employee.fullName}</h4>
                <p style={{ color: '#666' }}>{selectedPayslip.employee.department}</p>
                <span className={selectedPayslip.status === 'Paid' ? 'gp-status-paid' : 'gp-status-pending'} style={{ marginTop: '10px' }}>
                  {selectedPayslip.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Month:</span>
                  <strong>{selectedPayslip.month} {selectedPayslip.year}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Basic Pay:</span>
                  <strong>R{selectedPayslip.basicSalary.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Earnings:</span>
                  <span style={{ color: 'green' }}>+ R{selectedPayslip.totalEarnings.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Deductions:</span>
                  <span style={{ color: 'red' }}>- R{selectedPayslip.totalDeductions.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc', fontSize: '18px' }}>
                  <strong>Net Pay:</strong>
                  <strong>R{selectedPayslip.netSalary.toLocaleString()}</strong>
                </div>
              </div>
            </div>
            <div className="em-modal-footer">
              <button
                className="gp-btn-action-modal gp-btn-outline"
                style={{ display: 'flex', justifyContent: 'center' }}
                onClick={() => handlePrint(selectedPayslip)}
              >
                <FaPrint /> Print / Download
              </button>
              <button className="em-btn-submit" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipReport;
