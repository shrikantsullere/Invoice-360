import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes, FaEye, FaUserPlus, FaMoneyBillWave } from 'react-icons/fa';
import payrollService from '../../../api/payrollService';
import toast from 'react-hot-toast';
import './Payroll.css';

const SalaryStructure = () => {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Form States
  const [structureName, setStructureName] = useState('');
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'EARNING',
    calculationType: 'FIXED',
    value: ''
  });
  const [assignForm, setAssignForm] = useState({
    structureId: '',
    employeeId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [structuresRes, employeesRes] = await Promise.all([
        payrollService.getAllStructures(),
        payrollService.getAllEmployees()
      ]);
      if (structuresRes.success) setStructures(structuresRes.data);
      if (employeesRes.success) setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    if (!structureName.trim()) {
      toast.error('Please enter structure name');
      return;
    }
    try {
      const response = await payrollService.createStructure({
        name: structureName,
        components: []
      });
      if (response.success) {
        toast.success('Structure created successfully!');
        setStructures([...structures, response.data]);
        setShowCreateModal(false);
        setStructureName('');
      }
    } catch (error) {
      toast.error('Error creating structure');
    }
  };

  const handleAddComponent = (structure) => {
    setSelectedStructure(structure);
    setComponentForm({
      name: '',
      type: 'EARNING',
      calculationType: 'FIXED',
      value: ''
    });
    setShowComponentModal(true);
  };

  const handleSaveComponent = async (e) => {
    e.preventDefault();
    if (!componentForm.name || !componentForm.value) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const response = await payrollService.addComponent(selectedStructure.id, componentForm);
      if (response.success) {
        toast.success('Component added successfully!');
        fetchData();
        setShowComponentModal(false);
      }
    } catch (error) {
      toast.error('Error adding component');
    }
  };

  const handleViewComponents = (structure) => {
    setSelectedStructure(structure);
    setShowViewModal(true);
  };

  const handleOpenAssign = (structure) => {
    setSelectedStructure(structure);
    setAssignForm({
      structureId: structure.id,
      employeeId: ''
    });
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    try {
      const response = await payrollService.assignStructure(assignForm);
      if (response.success) {
        toast.success('Structure assigned successfully!');
        fetchData();
        setShowAssignModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error assigning structure');
    }
  };

  // Get employee name by ID
  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.fullName : 'N/A';
  };

  // Get assigned employees for a structure
  const getAssignedEmployees = (structureId) => {
    return employees.filter(emp =>
      emp.salary_structure_assignment?.structureId === structureId
    );
  };

  return (
    <div className="em-container">
      <div className="em-header">
        <h2>Salary Structure Management</h2>
        <button className="em-btn em-btn-add" onClick={() => setShowCreateModal(true)}>
          <FaPlus /> Create Structure
        </button>
      </div>

      {/* Structures Table */}
      <div className="em-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : (
          <table className="em-table">
            <thead>
              <tr>
                <th>STRUCTURE ID</th>
                <th>STRUCTURE NAME</th>
                <th>COMPONENTS</th>
                <th>ASSIGNED TO</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {structures.length > 0 ? structures.map((structure) => {
                const assignedEmps = getAssignedEmployees(structure.id);
                return (
                  <tr key={structure.id} className="em-row">
                    <td>STR{structure.id}</td>
                    <td>{structure.name}</td>
                    <td>{structure.components?.length || 0} Components</td>
                    <td>{assignedEmps.length} Employee(s)</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="ss-btn ss-btn-add"
                          onClick={() => handleAddComponent(structure)}
                          title="Add Component"
                        >
                          Add Component
                        </button>
                        <button
                          className="ss-btn ss-btn-view"
                          onClick={() => handleViewComponents(structure)}
                          title="View Components"
                        >
                          View Components
                        </button>
                        <button
                          className="ss-btn ss-btn-assign"
                          onClick={() => handleOpenAssign(structure)}
                          title="Assign to Employee"
                        >
                          <FaUserPlus /> Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    No salary structures found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Structure Modal */}
      {showCreateModal && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '500px' }}>
            <div className="em-modal-header">
              <h3>Create Structure</h3>
              <button className="em-close-btn" onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateStructure}>
              <div className="em-modal-body">
                <div className="em-form-group">
                  <label>Structure Name</label>
                  <input
                    type="text"
                    className="em-input"
                    placeholder="e.g., Standard Staff, Senior Management"
                    value={structureName}
                    onChange={(e) => setStructureName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="em-modal-footer">
                <button type="button" className="em-btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="em-btn-submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Component Modal */}
      {showComponentModal && selectedStructure && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '600px' }}>
            <div className="em-modal-header">
              <h3>Add Component to "{selectedStructure.name}"</h3>
              <button className="em-close-btn" onClick={() => setShowComponentModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSaveComponent}>
              <div className="em-modal-body">
                <div className="em-form-grid">
                  <div className="em-form-group">
                    <label>Component Name</label>
                    <input
                      type="text"
                      className="em-input"
                      placeholder="e.g., Basic Salary, HRA, Tax"
                      value={componentForm.name}
                      onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="em-form-group">
                    <label>Type</label>
                    <select
                      className="em-select"
                      value={componentForm.type}
                      onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                    >
                      <option value="EARNING">Earning</option>
                      <option value="DEDUCTION">Deduction</option>
                    </select>
                  </div>
                  <div className="em-form-group">
                    <label>Calculation Type</label>
                    <select
                      className="em-select"
                      value={componentForm.calculationType}
                      onChange={(e) => setComponentForm({ ...componentForm, calculationType: e.target.value })}
                    >
                      <option value="FIXED">Fixed Amount</option>
                      <option value="PERCENTAGE">Percentage of Basic</option>
                    </select>
                  </div>
                  <div className="em-form-group">
                    <label>
                      {componentForm.calculationType === 'FIXED' ? 'Amount' : 'Percentage'}
                    </label>
                    <input
                      type="number"
                      className="em-input"
                      placeholder={componentForm.calculationType === 'FIXED' ? 'e.g., 5000' : 'e.g., 10'}
                      value={componentForm.value}
                      onChange={(e) => setComponentForm({ ...componentForm, value: e.target.value })}
                      required
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <div className="em-modal-footer">
                <button type="button" className="em-btn-cancel" onClick={() => setShowComponentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="em-btn-submit">
                  Add Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Components Modal */}
      {showViewModal && selectedStructure && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '700px' }}>
            <div className="em-modal-header">
              <h3>Components of "{selectedStructure.name}"</h3>
              <button className="em-close-btn" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="em-modal-body">
              {selectedStructure.components && selectedStructure.components.length > 0 ? (
                <table className="em-table">
                  <thead>
                    <tr>
                      <th>COMPONENT NAME</th>
                      <th>TYPE</th>
                      <th>CALCULATION</th>
                      <th>VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStructure.components.map((comp, idx) => (
                      <tr key={idx}>
                        <td>{comp.name}</td>
                        <td>
                          <span className={comp.type === 'EARNING' ? 'gp-status-paid' : 'gp-status-pending'}>
                            {comp.type}
                          </span>
                        </td>
                        <td>{comp.calculationType}</td>
                        <td>
                          {comp.calculationType === 'FIXED'
                            ? `R${comp.value.toLocaleString()}`
                            : `${comp.value}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No components added yet. Click "Add Component" to add salary components.
                </p>
              )}
            </div>
            <div className="em-modal-footer">
              <button className="em-btn-submit" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Structure Modal */}
      {showAssignModal && selectedStructure && (
        <div className="em-modal-overlay">
          <div className="em-modal-content" style={{ maxWidth: '500px' }}>
            <div className="em-modal-header">
              <h3>Assign "{selectedStructure.name}" to Employee</h3>
              <button className="em-close-btn" onClick={() => setShowAssignModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="em-modal-body">
              <div className="em-form-group">
                <label>Select Employee</label>
                <select
                  className="em-select"
                  value={assignForm.employeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeId}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: '15px', padding: '10px', background: '#f0f9ff', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
                  <strong>Note:</strong> This will assign the salary structure to the selected employee.
                  The structure's components will be used when generating payroll.
                </p>
              </div>
            </div>
            <div className="em-modal-footer">
              <button className="em-btn-cancel" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="em-btn-submit" onClick={handleAssign}>
                Assign Structure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryStructure;
