import React, { useState, useEffect } from 'react';
import {
  FaCog, FaFileInvoiceDollar, FaBuilding, FaUpload,
  FaCheck, FaSyncAlt, FaEye, FaSave
} from 'react-icons/fa';
import payrollService from '../../../api/payrollService';
import toast from 'react-hot-toast';
import './Payroll.css';

const PayrollSettings = () => {
  const [settings, setSettings] = useState({
    payCycle: 'Monthly',
    bankAccount: '',
    currency: 'USD',
    taxSlab: '',
    enablePF: true,
    enableInsurance: true,
    enableOtherDeductions: false,
    layout: 'Simple',
    footerNotes: '',
    digitalSignature: true,
    enableEmail: true,
    enableWhatsapp: false,
    emailTemplate: 'Your payslip for {month} is now available.',
    companyLogo: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching payroll settings...');
      const response = await payrollService.getSettings();
      console.log('Settings response:', response);
      if (response.success && response.data) {
        // Merge with existing defaults if some fields are missing
        setSettings(prev => ({ ...prev, ...response.data }));
        console.log('Settings loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async () => {
    try {
      console.log('Saving settings:', settings);
      const response = await payrollService.updateSettings(settings);
      console.log('Save response:', response);
      if (response.success) {
        toast.success('Settings saved successfully!');
        // Refresh settings to ensure we have the latest data
        await fetchSettings();
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Could not save settings.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to defaults?')) {
      setSettings({
        payCycle: 'Monthly',
        bankAccount: '',
        currency: 'USD',
        taxSlab: '',
        enablePF: false,
        enableInsurance: false,
        enableOtherDeductions: false,
        layout: 'Simple',
        footerNotes: '',
        digitalSignature: false,
        enableEmail: true,
        enableWhatsapp: false,
        emailTemplate: 'Your payslip for {month} is now available.',
        companyLogo: ''
      });
      toast.success('Settings reset to defaults');
    }
  };

  const handlePreview = () => {
    toast("Previewing Payslip Template...", {
      icon: '📄',
    });
  };

  if (loading) return <div className="em-container">Loading settings...</div>;

  return (
    <div className="em-container">
      <div className="em-header">
        <h2>Payroll Settings</h2>
      </div>

      <div className="ps-layout-grid">
        {/* Left Column */}
        <div className="ps-column">

          {/* Company Payroll Info */}
          <div className="ps-card">
            <div className="ps-card-header">
              <FaBuilding />
              <span className="ps-card-title">Company Payroll Info</span>
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Default Pay Cycle</label>
              <select
                name="payCycle"
                className="ps-select"
                value={settings.payCycle}
                onChange={handleChange}
              >
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Bi-Weekly</option>
              </select>
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Default Bank Account</label>
              <input
                type="text"
                name="bankAccount"
                className="ps-input"
                placeholder="Enter bank account number"
                value={settings.bankAccount || ''}
                onChange={handleChange}
              />
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Default Currency</label>
              <select
                name="currency"
                className="ps-select"
                value={settings.currency}
                onChange={handleChange}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
                <option>ZAR</option>
              </select>
            </div>
          </div>

          {/* Tax Configuration */}
          <div className="ps-card">
            <div className="ps-card-header">
              <FaFileInvoiceDollar />
              <span className="ps-card-title">Tax Configuration</span>
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Add Tax Slab / Percentage</label>
              <input
                type="text"
                name="taxSlab"
                className="ps-input"
                placeholder="e.g., 10% for income up to R50,000"
                value={settings.taxSlab || ''}
                onChange={handleChange}
              />
            </div>

            <div className="ps-switch-row">
              <div className="em-toggle-wrapper" onClick={() => setSettings({ ...settings, enablePF: !settings.enablePF })}>
                <div className={`em-toggle ${settings.enablePF ? 'active' : ''}`}>
                  <div className="em-toggle-circle"></div>
                </div>
                <span className="ps-label" style={{ margin: 0 }}>Enable PF (Provident Fund)</span>
              </div>
            </div>

            <div className="ps-switch-row">
              <div className="em-toggle-wrapper" onClick={() => setSettings({ ...settings, enableInsurance: !settings.enableInsurance })}>
                <div className={`em-toggle ${settings.enableInsurance ? 'active' : ''}`}>
                  <div className="em-toggle-circle"></div>
                </div>
                <span className="ps-label" style={{ margin: 0 }}>Enable Insurance</span>
              </div>
            </div>

            <div className="ps-switch-row">
              <div className="em-toggle-wrapper" onClick={() => setSettings({ ...settings, enableOtherDeductions: !settings.enableOtherDeductions })}>
                <div className={`em-toggle ${settings.enableOtherDeductions ? 'active' : ''}`}>
                  <div className="em-toggle-circle"></div>
                </div>
                <span className="ps-label" style={{ margin: 0 }}>Enable Other Deductions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="ps-column">

          {/* Payslip Template Settings */}
          <div className="ps-card">
            <div className="ps-card-header">
              <FaFileInvoiceDollar />
              <span className="ps-card-title">Payslip Template Settings</span>
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Upload Company Logo</label>
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setSettings({ ...settings, companyLogo: reader.result });
                      toast.success('Logo uploaded successfully!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button
                className="ps-upload-btn"
                onClick={() => document.getElementById('logoUpload').click()}
                type="button"
              >
                <FaUpload /> Upload
              </button>
              {settings.companyLogo && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={settings.companyLogo}
                    alt="Company Logo"
                    style={{ maxWidth: '150px', maxHeight: '80px', objectFit: 'contain', border: '1px solid #ddd', padding: '5px', borderRadius: '4px' }}
                  />
                </div>
              )}
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Select Layout</label>
              <select
                name="layout"
                className="ps-select"
                value={settings.layout}
                onChange={handleChange}
              >
                <option>Simple</option>
                <option>Modern</option>
                <option>Detailed</option>
              </select>
            </div>
            <div className="ps-form-group">
              <label className="ps-label">Add Footer Notes</label>
              <textarea
                name="footerNotes"
                className="ps-textarea"
                placeholder="Enter footer notes for payslips"
                value={settings.footerNotes || ''}
                onChange={handleChange}
              ></textarea>
            </div>
            <div className="em-checkbox-wrapper">
              <input
                type="checkbox"
                className="em-checkbox"
                checked={settings.digitalSignature}
                onChange={handleChange}
                name="digitalSignature"
                style={{ accentColor: 'black' }}
              />
              <span className="ps-label" style={{ margin: 0 }}>Include Digital Signature</span>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="ps-card">
            <div className="ps-card-header">
              <FaCog />
              <span className="ps-card-title">Notification Settings</span>
            </div>

            <div className="ps-switch-row">
              <div className="em-toggle-wrapper" onClick={() => setSettings({ ...settings, enableEmail: !settings.enableEmail })}>
                <div className={`em-toggle ${settings.enableEmail ? 'active' : ''}`}>
                  <div className="em-toggle-circle"></div>
                </div>
                <span className="ps-label" style={{ margin: 0 }}>Enable Email Send</span>
              </div>
            </div>

            <div className="ps-switch-row">
              <div className="em-toggle-wrapper" onClick={() => setSettings({ ...settings, enableWhatsapp: !settings.enableWhatsapp })}>
                <div className={`em-toggle ${settings.enableWhatsapp ? 'active' : ''}`}>
                  <div className="em-toggle-circle"></div>
                </div>
                <span className="ps-label" style={{ margin: 0 }}>Enable WhatsApp Send</span>
              </div>
            </div>

            <div className="ps-form-group">
              <label className="ps-label">Default Message Template</label>
              <textarea
                name="emailTemplate"
                className="ps-textarea"
                placeholder="Enter message template"
                value={settings.emailTemplate || ''}
                onChange={handleChange}
              ></textarea>
              <p className="ps-hint">Use {'{month}'} as a placeholder for the month name.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="ps-footer">
        <button className="ps-btn ps-btn-save" onClick={handleSave}><FaSave /> Save Settings</button>
        <button className="ps-btn ps-btn-preview" onClick={handlePreview}><FaEye /> Preview Payslip Template</button>
        <button className="ps-btn ps-btn-reset" onClick={handleReset}><FaSyncAlt /> Reset Defaults</button>
      </div>
    </div>
  );
};

export default PayrollSettings;
