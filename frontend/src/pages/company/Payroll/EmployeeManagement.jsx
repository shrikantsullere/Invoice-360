import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaFileCsv, FaUsers, FaUserCheck, FaUserSlash, FaMoneyBillWave,
  FaEye, FaEdit, FaTrash, FaTimes
} from 'react-icons/fa';
import payrollService from '../../../api/payrollService';
import './Payroll.css';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isView, setIsView] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    department: '',
    designation: '',
    joiningDate: '',
    salaryType: 'Monthly',
    basicSalary: '',
    bankAccount: '',
    ifsc: '',
    taxId: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getAllEmployees();
      if (response.success) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derived Stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const inactiveEmployees = employees.filter(e => e.status === 'Inactive').length;
  const totalPayrollLimit = employees.reduce((acc, curr) => acc + (parseFloat(curr.basicSalary) || 0), 0);

  // Handlers
  const handleAddNew = () => {
    setFormData({
      employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      fullName: '',
      department: '',
      designation: '',
      joiningDate: '',
      salaryType: 'Monthly',
      basicSalary: '',
      bankAccount: '',
      ifsc: '',
      taxId: '',
      status: 'Active'
    });
    setIsEdit(false);
    setIsView(false);
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setFormData({
      id: emp.id,
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      salaryType: emp.salaryType,
      basicSalary: emp.basicSalary,
      bankAccount: emp.bankAccount || '',
      ifsc: emp.ifsc || '',
      taxId: emp.taxId || '',
      status: emp.status
    });
    setIsEdit(true);
    setIsView(false);
    setShowModal(true);
  };

  const handleView = (emp) => {
    setFormData({
      id: emp.id,
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      salaryType: emp.salaryType,
      basicSalary: emp.basicSalary,
      bankAccount: emp.bankAccount || '',
      ifsc: emp.ifsc || '',
      taxId: emp.taxId || '',
      status: emp.status
    });
    setIsEdit(false);
    setIsView(true);
    setShowModal(true);
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const response = await payrollService.deleteEmployee(id);
        if (response.success) {
          setEmployees(employees.filter(e => e.id !== id));
        }
      } catch (error) {
        alert('Error deleting employee');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleToggleStatus = () => {
    if (!isView) {
      setFormData({ ...formData, status: formData.status === 'Active' ? 'Inactive' : 'Active' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) {
      setShowModal(false);
      return;
    }

    try {
      if (isEdit) {
        const response = await payrollService.updateEmployee(formData.id, formData);
        if (response.success) {
          setEmployees(employees.map(e => e.id === formData.id ? response.data : e));
        }
      } else {
        const response = await payrollService.createEmployee(formData);
        if (response.success) {
          setEmployees([...employees, response.data]);
        }
      }
      setShowModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving employee');
    }
  };

  return (
    <div className="em-container">
      {/* Header */}
      <div className="em-header">
        <h2>Employee Management</h2>
        <div className="em-header-actions">
          <button className="em-btn em-btn-add" onClick={handleAddNew}>
            <FaPlus /> Add Employee
          </button>
          <button className="em-btn em-btn-import">
            <FaFileCsv /> Import CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="em-stats-grid">
        <div className="em-stat-card">
          <div className="em-stat-icon-wrapper em-icon-total">
            <FaUsers />
          </div>
          <div className="em-stat-info">
            <h3>{totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon-wrapper em-icon-active">
            <FaUserCheck />
          </div>
          <div className="em-stat-info">
            <h3>{activeEmployees}</h3>
            <p>Active Employees</p>
          </div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon-wrapper em-icon-inactive">
            <FaUserSlash />
          </div>
          <div className="em-stat-info">
            <h3>{inactiveEmployees}</h3>
            <p>Inactive Employees</p>
          </div>
        </div>
        <div className="em-stat-card">
          <div className="em-stat-icon-wrapper em-icon-payroll">
            <FaMoneyBillWave />
          </div>
          <div className="em-stat-info">
            <h3>R{totalPayrollLimit.toLocaleString()}</h3>
            <p>Base Payroll</p>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="em-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <table className="em-table">
            <thead>
              <tr>
                <th>EMPLOYEE ID</th>
                <th>FULL NAME</th>
                <th>DEPARTMENT</th>
                <th>DESIGNATION</th>
                <th>JOINING DATE</th>
                <th>SALARY TYPE</th>
                <th>BASE SALARY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? employees.map(emp => (
                <tr key={emp.id} className="em-row">
                  <td>{emp.employeeId}</td>
                  <td><strong>{emp.fullName}</strong></td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>{emp.joiningDate ? emp.joiningDate.split('T')[0] : 'N/A'}</td>
                  <td>{emp.salaryType}</td>
                  <td>R{emp.basicSalary?.toLocaleString()}</td>
                  <td>
                    <span className={`em-status-badge ${emp.status === 'Active' ? 'em-status-active' : 'em-status-inactive'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="em-actions">
                      <button className="em-action-btn em-btn-view" onClick={() => handleView(emp)}><FaEye /></button>
                      <button className="em-action-btn em-btn-edit" onClick={() => handleEdit(emp)}><FaEdit /></button>
                      <button className="em-action-btn em-btn-delete" onClick={() => handleDelete(emp.id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="em-modal-overlay">
          <div className="em-modal-content">
            <div className="em-modal-header">
              <h3>{isEdit ? 'Edit Employee' : isView ? 'Employee Details' : 'Add New Employee'}</h3>
              <button className="em-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="em-modal-body">
                {/* Full Name - Full Width */}
                <div className="em-form-group full-width">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="em-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    readOnly={isView}
                    required
                  />
                </div>

                <div className="em-form-grid">
                  {/* Department */}
                  <div className="em-form-group">
                    <label>Department</label>
                    <select
                      name="department"
                      className="em-select"
                      value={formData.department}
                      onChange={handleChange}
                      disabled={isView}
                      required
                    >
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="em-form-group">
                    <label>Designation</label>
                    <select
                      name="designation"
                      className="em-select"
                      value={formData.designation}
                      onChange={handleChange}
                      disabled={isView}
                      required
                    >
                      <option value="">Select Designation</option>
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Sales Executive">Sales Executive</option>
                    </select>
                  </div>

                  {/* Joining Date */}
                  <div className="em-form-group">
                    <label>Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      className="em-input"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      readOnly={isView}
                      required
                    />
                  </div>

                  {/* Salary Type */}
                  <div className="em-form-group">
                    <label>Salary Type</label>
                    <select
                      name="salaryType"
                      className="em-select"
                      value={formData.salaryType}
                      onChange={handleChange}
                      disabled={isView}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>

                  {/* Basic Salary */}
                  <div className="em-form-group">
                    <label>Basic Salary</label>
                    <input
                      type="number"
                      name="basicSalary"
                      className="em-input"
                      value={formData.basicSalary}
                      onChange={handleChange}
                      readOnly={isView}
                      required
                    />
                  </div>

                  {/* Bank Account Number */}
                  <div className="em-form-group">
                    <label>Bank Account Number</label>
                    <input
                      type="text"
                      name="bankAccount"
                      className="em-input"
                      value={formData.bankAccount}
                      onChange={handleChange}
                      readOnly={isView}
                    />
                  </div>

                  {/* IFSC / Branch Name */}
                  <div className="em-form-group">
                    <label>IFSC / Branch Name</label>
                    <input
                      type="text"
                      name="ifsc"
                      className="em-input"
                      value={formData.ifsc}
                      onChange={handleChange}
                      readOnly={isView}
                    />
                  </div>

                  {/* Tax ID */}
                  <div className="em-form-group">
                    <label>Tax ID (PAN / VAT)</label>
                    <input
                      type="text"
                      name="taxId"
                      className="em-input"
                      value={formData.taxId}
                      onChange={handleChange}
                      readOnly={isView}
                    />
                  </div>
                </div>

                {/* Active Status Toggle */}
                <div className="em-toggle-wrapper" onClick={handleToggleStatus}>
                  <div className={`em-toggle ${formData.status === 'Active' ? 'active' : ''}`}>
                    <div className="em-toggle-circle"></div>
                  </div>
                  <span className="em-toggle-label">Active Status</span>
                </div>

              </div>

              <div className="em-modal-footer">
                <button type="button" className="em-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                {!isView && (
                  <button type="submit" className="em-btn-submit">
                    {isEdit ? 'Update Employee' : 'Add Employee'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeManagement;
