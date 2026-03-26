import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import clientService from '../../../api/clientService';
import './Client.css';

const AllClient = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isView, setIsView] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    clientName: '',
    contactName: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    gstin: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getAllClients();
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      clientName: '',
      contactName: '',
      email: '',
      phone: '',
      companyName: '',
      address: '',
      gstin: '',
      status: 'Active'
    });
    setIsEdit(false);
    setIsView(false);
    setShowModal(true);
  };

  const handleEditClick = (e, client) => {
    e.stopPropagation();
    setFormData({
      id: client.id,
      clientName: client.clientName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      companyName: client.companyName,
      address: client.address,
      gstin: client.gstin,
      status: client.status
    });
    setIsEdit(true);
    setIsView(false);
    setShowModal(true);
  };

  const handleViewClick = (e, client) => {
    e.stopPropagation();
    setFormData({
      id: client.id,
      clientName: client.clientName,
      contactName: client.contactName,
      email: client.email,
      phone: client.phone,
      companyName: client.companyName,
      address: client.address,
      gstin: client.gstin,
      status: client.status
    });
    setIsEdit(false);
    setIsView(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await clientService.deleteClient(id);
        if (response.success) {
          setClients(clients.filter(c => c.id !== id));
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      }
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All Status');
    setFromDate('');
    setToDate('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) {
      setShowModal(false);
      return;
    }

    try {
      if (isEdit) {
        const response = await clientService.updateClient(formData.id, formData);
        if (response.success) {
          setClients(clients.map(c => c.id === formData.id ? response.data : c));
        }
      } else {
        const response = await clientService.createClient(formData);
        if (response.success) {
          setClients([response.data, ...clients]);
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error.response?.data?.message || 'Failed to save client');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      (client.clientName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.contactName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All Status' || client.status === statusFilter;

    // Date filtering
    let matchesDate = true;
    const clientDate = new Date(client.createdAt).toISOString().split('T')[0];
    if (fromDate && clientDate < fromDate) matchesDate = false;
    if (toDate && clientDate > toDate) matchesDate = false;

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="c-client-container">
      <div className="c-client-header">
        <div>
          <h2>Client</h2>
          <p className="nc-header-subtitle">Manage your clients</p>
        </div>
        <button className="c-client-add-btn" onClick={handleAddClick}>
          <FaPlus /> Add Client
        </button>
      </div>

      <div className="nc-filter-row">
        <div className="nc-filter-group">
          <label>Search Client</label>
          <div className="nc-search-input-wrapper">
            <input
              type="text"
              placeholder="Enter client name or contact"
              className="nc-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="nc-filter-group">
          <label>Status</label>
          <select
            className="nc-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div className="nc-filter-group">
          <label>From Date</label>
          <input
            type="date"
            className="nc-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="nc-filter-group">
          <label>To Date</label>
          <input
            type="date"
            className="nc-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="nc-filter-group" style={{ display: 'flex', alignItems: 'flex-end', flex: '0 0 auto' }}>
          <button className="nc-btn-clear" onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      </div>

      <div className="c-client-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p>Loading clients...</p>
          </div>
        ) : (
          <table className="c-client-table">
            <thead>
              <tr>
                <th>CLIENT</th>
                <th>CONTACT</th>
                <th>CREATED</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map(client => (
                  <tr key={client.id} className="c-client-row">
                    <td>
                      <div className="nc-client-info">
                        <h4>{client.clientName}</h4>
                        <span>{client.companyName || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="nc-contact-info">
                        <div>{client.contactName}</div>
                        <span>{client.email} &bull; {client.phone}</span>
                      </div>
                    </td>
                    <td>{new Date(client.createdAt).toISOString().split('T')[0]}</td>
                    <td>
                      <span className={`c-client-status-badge ${client.status === 'Active' ? 'c-client-status-active' : 'c-client-status-inactive'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <div className="c-client-action-buttons">
                        <button className="c-client-btn-icon c-client-btn-view" onClick={(e) => handleViewClick(e, client)} title="View">
                          <FaEye />
                        </button>
                        <button className="c-client-btn-icon c-client-btn-edit" onClick={(e) => handleEditClick(e, client)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="c-client-btn-icon c-client-btn-delete" onClick={(e) => handleDeleteClick(e, client.id)} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    No clients found. Click "Add Client" to create your first client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="c-client-modal-overlay">
          <div className="c-client-modal-content">
            <div className="c-client-modal-header">
              <h3>{isEdit ? 'Edit Client' : isView ? 'View Client' : 'Add Client'}</h3>
              <button className="c-client-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="c-client-modal-body">
                <div className="c-client-form-group">
                  <label>Client Name</label>
                  <input
                    type="text"
                    name="clientName"
                    className="c-client-form-input"
                    placeholder="Enter client name"
                    value={formData.clientName}
                    onChange={handleChange}
                    readOnly={isView}
                    required
                  />
                </div>
                <div className="c-client-form-group">
                  <label>Contact Name</label>
                  <input
                    type="text"
                    name="contactName"
                    className="c-client-form-input"
                    placeholder="Contact person"
                    value={formData.contactName}
                    onChange={handleChange}
                    readOnly={isView}
                    required
                  />
                </div>
                <div className="c-client-form-row">
                  <div className="c-client-form-group">
                    <label>Email & Phone</label>
                    <input
                      type="email"
                      name="email"
                      className="c-client-form-input"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly={isView}
                      required
                    />
                  </div>
                  <div className="c-client-form-group">
                    <label>&nbsp;</label>
                    <input
                      type="text"
                      name="phone"
                      className="c-client-form-input"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      readOnly={isView}
                      required
                    />
                  </div>
                </div>
                <div className="c-client-form-group">
                  <label>Company</label>
                  <input
                    type="text"
                    name="companyName"
                    className="c-client-form-input"
                    placeholder="Company / Organization"
                    value={formData.companyName}
                    onChange={handleChange}
                    readOnly={isView}
                  />
                </div>
                <div className="c-client-form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    className="c-client-form-input"
                    rows="2"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleChange}
                    readOnly={isView}
                  ></textarea>
                </div>
                <div className="c-client-form-group">
                  <label>GSTIN (optional)</label>
                  <input
                    type="text"
                    name="gstin"
                    className="c-client-form-input"
                    placeholder="GSTIN"
                    value={formData.gstin}
                    onChange={handleChange}
                    readOnly={isView}
                  />
                </div>
                <div className="c-client-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    className="c-client-form-input"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isView}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="c-client-modal-footer">
                <button type="button" className="c-client-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                {!isView && (
                  <button type="submit" className="c-client-btn-submit">
                    {isEdit ? 'Update Client' : 'Add Client'}
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

export default AllClient;
