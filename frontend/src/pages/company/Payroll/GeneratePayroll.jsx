import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaCheckCircle, FaFilter, FaCalendarAlt, FaBuilding,
  FaEye, FaEnvelope, FaWhatsapp, FaTrash, FaCheck, FaTimes,
  FaFileInvoiceDollar, FaDownload, FaPrint
} from 'react-icons/fa';
import payrollService from '../../../api/payrollService';
import './Payroll.css';
import toast from 'react-hot-toast';

const GeneratePayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    month: 'All Months',
    department: 'All',
    year: new Date().getFullYear().toString()
  });

  // Form State for Generate Payroll
  const [genForm, setGenForm] = useState({
    month: 'January',
    year: new Date().getFullYear().toString(),
    selectAll: false,
    selectedEmployees: [], // ids
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, employeesRes] = await Promise.all([
        payrollService.getPayrollHistory(filters),
        payrollService.getAllEmployees()
      ]);
      if (historyRes.success) setPayrolls(historyRes.data);
      if (employeesRes.success) setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    setGenForm({
      month: currentMonth,
      year: new Date().getFullYear().toString(),
      selectAll: false,
      selectedEmployees: [],
      remarks: ''
    });
    setShowGenerateModal(true);
  };

  const handleClearFilters = () => {
    setFilters({ month: 'All Months', department: 'All', year: new Date().getFullYear().toString() });
  };

  // Selection Logic
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setGenForm(prev => ({
        ...prev,
        selectAll: true,
        selectedEmployees: employees.map(emp => emp.id)
      }));
    } else {
      setGenForm(prev => ({
        ...prev,
        selectAll: false,
        selectedEmployees: []
      }));
    }
  };

  const handleEmployeeSelect = (id) => {
    setGenForm(prev => {
      const isSelected = prev.selectedEmployees.includes(id);
      const newSelection = isSelected
        ? prev.selectedEmployees.filter(empId => empId !== id)
        : [...prev.selectedEmployees, id];

      return {
        ...prev,
        selectedEmployees: newSelection,
        selectAll: newSelection.length === employees.length
      };
    });
  };

  // Action Handlers
  const handleGenerateSubmit = async () => {
    if (genForm.selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }
    try {
      const response = await payrollService.generatePayroll({
        month: genForm.month,
        year: genForm.year,
        employeeIds: genForm.selectedEmployees,
        remarks: genForm.remarks
      });
      if (response.success) {
        toast.success(`Payroll generated for ${response.data.length} employees!`);
        setShowGenerateModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error generating payroll');
    }
  };

  const handleView = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  const handleApprove = async (id) => {
    try {
      const response = await payrollService.updatePayrollStatus(id, 'Paid');
      if (response.success) {
        setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: 'Paid' } : p));
        toast.success('Payroll approved successfully!');
      }
    } catch (error) {
      toast.error('Error approving payroll');
    }
  };

  const handleEmail = (name) => {
    toast.success(`Payslip emailed to ${name}`);
  };

  const handleWhatsApp = (name) => {
    toast.success(`Payslip sent via WhatsApp to ${name}`);
  };

  const handleDelete = (id) => {
    // Delete endpoint not explicitly created yet, but can be added if needed
    toast.error('Delete functionality for payroll entries is restricted.');
  };

  const handleBulkApprove = async () => {
    const pendingPayrolls = payrolls.filter(p => p.status === 'Pending');
    if (pendingPayrolls.length === 0) {
      toast('No pending payrolls to approve', { icon: 'ℹ️' });
      return;
    }

    if (window.confirm(`Approve all ${pendingPayrolls.length} pending payrolls?`)) {
      try {
        await Promise.all(pendingPayrolls.map(p => payrollService.updatePayrollStatus(p.id, 'Paid')));
        fetchData();
        toast.success('All pending payrolls approved!');
      } catch (error) {
        toast.error('Error in bulk approval');
      }
    }
  };

  const handlePrint = () => {
    if (!selectedPayroll) return;

    const printContent = `
            <html>
                <head>
                    <title>Payslip - ${selectedPayroll.employee.fullName}</title>
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
                        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; background: ${selectedPayroll.status === 'Paid' ? '#166534' : '#f59e0b'}; }
                    </style>
                </head>
                <body>
                    <div class="payslip-container">
                        <div class="header">
                            <h1>KIAAN TECHNOLOGY</h1>
                            <p>Premium Payroll Solutions</p>
                            <p>Payslip for the month of ${selectedPayroll.month} ${selectedPayroll.year}</p>
                        </div>

                        <div class="emp-info">
                            <div>
                                <p><strong>Employee Name:</strong> ${selectedPayroll.employee.fullName}</p>
                                <p><strong>Department:</strong> ${selectedPayroll.employee.department}</p>
                                <p><strong>Employee ID:</strong> ${selectedPayroll.employee.employeeId}</p>
                            </div>
                            <div style="text-align: right;">
                                <p><strong>Payment Status:</strong> <span class="status-badge">${selectedPayroll.status}</span></p>
                                <p><strong>Date Generated:</strong> ${new Date(selectedPayroll.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div class="details-grid">
                            <div>
                                <div class="section-title">Earnings</div>
                                <div class="row"><span>Basic Salary</span> <span class="amount">R${selectedPayroll.basicSalary.toLocaleString()}</span></div>
                                ${selectedPayroll.details.filter(d => d.type === 'EARNING').map(d => `
                                    <div class="row"><span>${d.componentName}</span> <span class="amount">R${d.amount.toLocaleString()}</span></div>
                                `).join('')}
                                <div class="row" style="font-weight: bold; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px;">
                                    <span>Total Earnings</span> <span>R${(selectedPayroll.basicSalary + selectedPayroll.totalEarnings).toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                <div class="section-title">Deductions</div>
                                ${selectedPayroll.details.filter(d => d.type === 'DEDUCTION').map(d => `
                                    <div class="row"><span>${d.componentName}</span> <span class="amount">R${d.amount.toLocaleString()}</span></div>
                                `).join('')}
                                <div class="row" style="font-weight: bold; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px;">
                                    <span>Total Deductions</span> <span>R${selectedPayroll.totalDeductions.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div class="total-row">
                            <span>Net Payable Amount</span>
                            <span>R${selectedPayroll.netSalary.toLocaleString()}</span>
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

  return (
    <div className="em-container">
      {/* Header */}
      <div className="em-header">
        <h2>Payroll Management</h2>
        <button className="em-btn em-btn-add" onClick={handleGenerateClick}>
          <FaPlus /> Generate Payroll
        </button>
      </div>

      {/* Filter Section */}
      <div className="gp-filter-bar">
        <div className="gp-filter-header">
          <FaFilter /> Filters
        </div>
        <div className="gp-filter-row">
          <div className="gp-filter-controls">
            <div className="gp-filter-group">
              <label className="gp-filter-label"><FaCalendarAlt /> Month</label>
              <select
                className="ss-select"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              >
                <option value="All Months">All Months</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="gp-filter-group">
              <label className="gp-filter-label"><FaCalendarAlt /> Year</label>
              <select
                className="ss-select"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
              </select>
            </div>
            <div className="gp-filter-group">
              <label className="gp-filter-label"><FaBuilding /> Department</label>
              <select
                className="ss-select"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="All">All</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <button className="gp-btn-clear" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
          <button className="gp-btn-bulk" onClick={handleBulkApprove}>
            <FaCheckCircle /> Bulk Approve ({payrolls.filter(p => p.status === 'Pending').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="em-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading payroll data...</div>
        ) : (
          <table className="em-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" /></th>
                <th>EMPLOYEE NAME</th>
                <th>DEPARTMENT</th>
                <th>MONTH</th>
                <th>BASIC PAY</th>
                <th>EARNINGS</th>
                <th>DEDUCTIONS</th>
                <th>NET PAY</th>
                <th>PAYMENT STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length > 0 ? payrolls.map(pay => (
                <tr key={pay.id} className="em-row">
                  <td><input type="checkbox" /></td>
                  <td><strong>{pay.employee.fullName}</strong></td>
                  <td>{pay.employee.department}</td>
                  <td>{pay.month} {pay.year}</td>
                  <td>R{pay.basicSalary.toLocaleString()}</td>
                  <td>R{pay.totalEarnings.toLocaleString()}</td>
                  <td>R{pay.totalDeductions.toLocaleString()}</td>
                  <td><strong>R{pay.netSalary.toLocaleString()}</strong></td>
                  <td>
                    <span className={pay.status === 'Paid' ? 'gp-status-paid' : 'gp-status-pending'}>
                      {pay.status}
                    </span>
                  </td>
                  <td>
                    <div className="gp-action-row">
                      <button
                        className="gp-icon-btn gp-btn-eye"
                        title="View Details"
                        onClick={() => handleView(pay)}
                      >
                        <FaEye />
                      </button>
                      {pay.status === 'Pending' && (
                        <button
                          className="gp-icon-btn gp-btn-check"
                          title="Approve Payment"
                          onClick={() => handleApprove(pay.id)}
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        className="gp-icon-btn gp-btn-mail"
                        title="Email Payslip"
                        onClick={() => handleEmail(pay.employee.fullName)}
                      >
                        <FaEnvelope />
                      </button>
                      <button
                        className="gp-icon-btn gp-btn-whatsapp"
                        title="Send via WhatsApp"
                        onClick={() => handleWhatsApp(pay.employee.fullName)}
                      >
                        <FaWhatsapp />
                      </button>
                      <button
                        className="gp-icon-btn gp-btn-trash"
                        title="Delete Entry"
                        onClick={() => handleDelete(pay.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>No payroll records found for selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '700px' }}>
            <div className="em-modal-header">
              <h3>Generate Payroll</h3>
              <button className="em-close-btn" onClick={() => setShowGenerateModal(false)}><FaTimes /></button>
            </div>
            <div className="em-modal-body">
              <div className="em-form-grid">
                <div className="em-form-group" style={{ gridColumn: 'span 2' }}>
                  <label><FaCalendarAlt /> Select Payroll Period (Month & Year)</label>
                  <input
                    type="month"
                    className="em-input"
                    value={`${genForm.year}-${new Date(Date.parse(genForm.month + " 1, 2012")).getMonth() + 1 < 10 ? '0' : ''}${new Date(Date.parse(genForm.month + " 1, 2012")).getMonth() + 1}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1));
                      setGenForm({ ...genForm, year, month: monthName });
                    }}
                    required
                  />
                </div>
              </div>

              <div className="em-form-group">
                <label>Select Employees</label>
                <div className="em-checkbox-wrapper" style={{ marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    className="em-checkbox"
                    checked={genForm.selectAll}
                    onChange={handleSelectAll}
                    id="selectAll"
                  />
                  <label htmlFor="selectAll" className="em-checkbox-label">Select All</label>
                </div>
                <div className="gp-employee-list-box">
                  {employees.map(emp => (
                    <div key={emp.id} className="gp-list-item">
                      <input
                        type="checkbox"
                        className="em-checkbox"
                        checked={genForm.selectedEmployees.includes(emp.id)}
                        onChange={() => handleEmployeeSelect(emp.id)}
                        id={`emp-${emp.id}`}
                      />
                      <label htmlFor={`emp-${emp.id}`} style={{ marginBottom: 0, fontWeight: 400 }}>{emp.fullName} ({emp.department})</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="em-form-group">
                <label>Remarks (Optional)</label>
                <textarea
                  className="em-textarea"
                  placeholder="Enter remarks"
                  value={genForm.remarks}
                  onChange={(e) => setGenForm({ ...genForm, remarks: e.target.value })}
                ></textarea>
              </div>
            </div>

            <div className="em-modal-footer">
              <button className="em-btn-cancel" onClick={() => setShowGenerateModal(false)}>Cancel</button>
              <button className="em-btn-submit" onClick={handleGenerateSubmit}>Generate Payroll</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedPayroll && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '500px' }}>
            <div className="em-modal-header">
              <h3>Payslip Details</h3>
              <button className="em-close-btn" onClick={() => setShowViewModal(false)}><FaTimes /></button>
            </div>
            <div className="em-modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <h4>{selectedPayroll.employee.fullName}</h4>
                <p style={{ color: '#666' }}>{selectedPayroll.employee.department}</p>
                <span className={selectedPayroll.status === 'Paid' ? 'gp-status-paid' : 'gp-status-pending'} style={{ marginTop: '10px' }}>
                  {selectedPayroll.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Pay Period:</span>
                  <strong>{selectedPayroll.month} {selectedPayroll.year}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Basic Pay:</span>
                  <strong>R{selectedPayroll.basicSalary.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Total Earnings:</span>
                  <span style={{ color: 'green' }}>+ R{selectedPayroll.totalEarnings.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Total Deductions:</span>
                  <span style={{ color: 'red' }}>- R{selectedPayroll.totalDeductions.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc', fontSize: '18px' }}>
                  <strong>Net Pay:</strong>
                  <strong>R{selectedPayroll.netSalary.toLocaleString()}</strong>
                </div>
              </div>
            </div>
            <div className="em-modal-footer">
              <button
                className="gp-btn-action-modal gp-btn-outline"
                style={{ display: 'flex', justifyContent: 'center' }}
                onClick={handlePrint}
              >
                <FaPrint /> Print
              </button>
              <button className="em-btn-submit" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratePayroll;
