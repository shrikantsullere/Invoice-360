import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clientService from '../../../api/clientService';
import './Client.css';

const NewClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await clientService.createClient(formData);
      if (response.success) {
        alert('Client created successfully');
        navigate('/company/client/all');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert(error.response?.data?.message || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="c-client-container">
      <div className="c-client-header">
        <div>
          <h2>Add New Client</h2>
          <p className="nc-header-subtitle">Create a new client profile</p>
        </div>
      </div>

      <div className="new-client-form-card">
        <form onSubmit={handleSubmit}>
          <div className="c-client-form-group">
            <label>Client Name</label>
            <input
              type="text"
              name="clientName"
              className="c-client-form-input"
              placeholder="Enter client name"
              value={formData.clientName}
              onChange={handleChange}
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
              required
            />
          </div>

          <div className="c-client-form-row">
            <div className="c-client-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="c-client-form-input"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="c-client-form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                className="c-client-form-input"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="c-client-form-group">
            <label>Company / Organization</label>
            <input
              type="text"
              name="companyName"
              className="c-client-form-input"
              placeholder="Company name"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div className="c-client-form-group">
            <label>Address</label>
            <textarea
              name="address"
              className="c-client-form-input"
              rows="3"
              placeholder="Client address"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="c-client-form-row">
            <div className="c-client-form-group">
              <label>GSTIN (Optional)</label>
              <input
                type="text"
                name="gstin"
                className="c-client-form-input"
                placeholder="GST Number"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>
            <div className="c-client-form-group">
              <label>Status</label>
              <select
                name="status"
                className="c-client-form-input"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="new-client-form-footer">
            <button
              type="button"
              className="c-client-btn-cancel"
              onClick={() => navigate('/company/client/all')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="c-client-btn-submit"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewClient;
