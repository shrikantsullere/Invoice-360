import React, { useState, useEffect } from 'react';
import {
  FaFilePdf, FaFileExcel, FaFileCsv, FaPrint, FaSearch, FaEye, FaTimes
} from 'react-icons/fa';
import payrollService from '../../../api/payrollService';
import toast from 'react-hot-toast';
import './Payroll.css';

const PayrollReport = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [allPayrolls, setAllPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: 'All Months',
    department: 'All',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getPayrollHistory();
      if (response.success) {
        setAllPayrolls(response.data);
      }
    } catch (error) {
      console.error('Error fetching payroll history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derived Data - Monthly Summary
  const getMonthlySummary = () => {
    const summary = {};
    allPayrolls.forEach(p => {
      const key = `${p.month} ${p.year}`;
      if (!summary[key]) {
        summary[key] = { month: key, employees: new Set(), gross: 0, deductions: 0, net: 0 };
      }
      summary[key].employees.add(p.employeeId);
      summary[key].gross += (p.basicSalary + p.totalEarnings);
      summary[key].deductions += p.totalDeductions;
      summary[key].net += p.netSalary;
    });
    return Object.values(summary).map(s => ({ ...s, employees: s.employees.size }));
  };

  // Derived Data - Department Report
  const getDepartmentSummary = () => {
    const summary = {};
    allPayrolls.forEach(p => {
      const dept = p.employee.department;
      if (!summary[dept]) {
        summary[dept] = { dept, employees: new Set(), total: 0 };
      }
      summary[dept].employees.add(p.employeeId);
      summary[dept].total += p.netSalary;
    });
    return Object.values(summary).map(s => ({
      ...s,
      employees: s.employees.size,
      avg: s.total / s.employees.size
    }));
  };

  // Derived Data - Tax & Deduction
  const getTaxDeductionReport = () => {
    const summary = {};
    allPayrolls.forEach(p => {
      const key = `${p.month} ${p.year}`;
      if (!summary[key]) {
        summary[key] = { month: key, tax: 0, pf: 0, total: 0 };
      }
      // Assuming component names include 'Tax' or 'PF'
      p.details.forEach(d => {
        if (d.type === 'DEDUCTION') {
          if (d.componentName.toLowerCase().includes('tax')) summary[key].tax += d.amount;
          else if (d.componentName.toLowerCase().includes('pf')) summary[key].pf += d.amount;
          summary[key].total += d.amount;
        }
      });
    });
    return Object.values(summary);
  };

  const filteredHistory = allPayrolls.filter(p => {
    const matchesMonth = filters.month === 'All Months' || p.month === filters.month;
    const matchesDept = filters.department === 'All' || p.employee.department === filters.department;
    const matchesSearch = p.employee.fullName.toLowerCase().includes(filters.search.toLowerCase());
    return matchesMonth && matchesDept && matchesSearch;
  });

  const handleView = (data, type) => {
    setSelectedData({ ...data, type });
    setShowModal(true);
  };

  const handlePrint = () => {
    toast.success("Opening print dialog...");
    setTimeout(() => window.print(), 500);
  };

  const handleDownloadPDF = () => toast.success("Downloading PDF Report...");
  const handleExportExcel = () => toast.success("Exporting to Excel...");
  const handleExportCSV = () => toast.success("Exporting to CSV...");

  return (
    <div className="em-container">
      <div className="em-header">
        <h2>Payroll Reports</h2>
      </div>

      <div className="pr-header-row">
        <div className="pr-title">Reports Overview</div>
        <div className="pr-export-group">
          <button className="pr-btn-export pr-btn-pdf" onClick={handleDownloadPDF}><FaFilePdf /> PDF</button>
          <button className="pr-btn-export pr-btn-excel" onClick={handleExportExcel}><FaFileExcel /> Excel</button>
          <button className="pr-btn-export pr-btn-csv" onClick={handleExportCSV}><FaFileCsv /> CSV</button>
          <button className="pr-btn-export pr-btn-print" onClick={handlePrint}><FaPrint /> Print</button>
        </div>
      </div>

      <div className="gp-filter-bar" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="gp-filter-group" style={{ flex: 1 }}>
          <label className="gp-filter-label">Filter by Month</label>
          <select
            className="ss-select"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          >
            <option>All Months</option>
            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="gp-filter-group" style={{ flex: 1 }}>
          <label className="gp-filter-label">Filter by Department</label>
          <select
            className="ss-select"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option>All</option>
            <option>IT</option>
            <option>HR</option>
            <option>Finance</option>
            <option>Sales</option>
            <option>Marketing</option>
          </select>
        </div>
        <div className="gp-filter-group" style={{ flex: 1.5 }}>
          <label className="gp-filter-label">Search Employee</label>
          <div className="pr-search-box" style={{ marginTop: 0 }}>
            <input
              type="text"
              className="pr-search-input"
              placeholder="Employee name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <button className="pr-search-btn"><FaSearch /></button>
          </div>
        </div>
      </div>

      <div className="pr-tabs-container">
        {['monthly', 'department', 'history', 'tax'].map(tab => (
          <button
            key={tab}
            className={`pr-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'tax' ? '& Deduction' : 'Report'}
          </button>
        ))}
      </div>

      <div className="pr-tab-content">
        <div className="em-table-container" style={{ boxShadow: 'none', border: 'none' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading reports...</div>
          ) : (
            <table className="em-table">
              {activeTab === 'monthly' && (
                <>
                  <thead>
                    <tr>
                      <th>MONTH</th>
                      <th>TOTAL EMPLOYEES</th>
                      <th>GROSS PAY</th>
                      <th>DEDUCTIONS</th>
                      <th>NET PAY</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getMonthlySummary().map((item, i) => (
                      <tr key={i} className="em-row">
                        <td>{item.month}</td>
                        <td>{item.employees}</td>
                        <td>R{item.gross.toLocaleString()}</td>
                        <td>R{item.deductions.toLocaleString()}</td>
                        <td>R{item.net.toLocaleString()}</td>
                        <td>
                          <button className="pr-btn-eye" onClick={() => handleView(item, 'Monthly Summary Details')}>
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
              {activeTab === 'department' && (
                <>
                  <thead>
                    <tr>
                      <th>DEPARTMENT</th>
                      <th>EMPLOYEES</th>
                      <th>TOTAL SALARY</th>
                      <th>AVG SALARY</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDepartmentSummary().map((item, i) => (
                      <tr key={i} className="em-row">
                        <td>{item.dept}</td>
                        <td>{item.employees}</td>
                        <td>R{item.total.toLocaleString()}</td>
                        <td>R{item.avg.toLocaleString()}</td>
                        <td>
                          <button className="pr-btn-eye" onClick={() => handleView(item, 'Department Report Details')}>
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
              {activeTab === 'history' && (
                <>
                  <thead>
                    <tr>
                      <th>EMPLOYEE</th>
                      <th>MONTH</th>
                      <th>GROSS PAY</th>
                      <th>DEDUCTIONS</th>
                      <th>NET PAY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(item => (
                      <tr key={item.id} className="em-row">
                        <td>{item.employee.fullName}</td>
                        <td>{item.month} {item.year}</td>
                        <td>R{(item.basicSalary + item.totalEarnings).toLocaleString()}</td>
                        <td>R{item.totalDeductions.toLocaleString()}</td>
                        <td>R{item.netSalary.toLocaleString()}</td>
                        <td>
                          <span className={item.status === 'Paid' ? 'gp-status-paid' : 'gp-status-pending'}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
              {activeTab === 'tax' && (
                <>
                  <thead>
                    <tr>
                      <th>MONTH</th>
                      <th>TAX</th>
                      <th>PF</th>
                      <th>TOTAL DEDUCTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTaxDeductionReport().map((item, i) => (
                      <tr key={i} className="em-row">
                        <td>{item.month}</td>
                        <td>R{item.tax.toLocaleString()}</td>
                        <td>R{item.pf.toLocaleString()}</td>
                        <td>R{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>
      </div>

      {showModal && selectedData && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '500px' }}>
            <div className="em-modal-header">
              <h3>{selectedData.type}</h3>
              <button className="em-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <div className="em-modal-body">
              {Object.entries(selectedData).map(([key, value]) => {
                if (key === 'id' || key === 'type') return null;
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{key}</strong>
                    <span>{typeof value === 'number' ? 'R' + value.toLocaleString() : value}</span>
                  </div>
                );
              })}
            </div>
            <div className="em-modal-footer">
              <button className="em-btn-submit" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollReport;
