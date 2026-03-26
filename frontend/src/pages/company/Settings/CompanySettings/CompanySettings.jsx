import React, { useState, useRef, useEffect } from 'react';
import {
    Building2, Mail, Phone, MapPin, Globe,
    Save, Upload, Image as ImageIcon,
    Landmark, FileText, StickyNote, Check, Lock
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './CompanySettings.css';
import axiosInstance from '../../../../api/axiosInstance';
import companyService from '../../../../api/companyService';
import passwordRequestService from '../../../../api/passwordRequestService';
import GetCompanyId from '../../../../api/GetCompanyId';

const CompanySettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useState(null);

    // Invoice Settings State
    const [invoiceSettings, setInvoiceSettings] = useState({
        template: 'New York',
        color: '#004aad',
        showQr: true,
        logo: null, // File object
        logoPreview: null // URL for preview
    });

    // Inventory Settings State
    const [inventorySettings, setInventorySettings] = useState({
        reserveOnQuotation: false,
        reserveOnSO: false,
        challanAction: 'ISSUE' // 'ISSUE' or 'RESERVE'
    });

    const fileInputRef = useRef(null);
    const invoiceLogoInputRef = useRef(null);

    // Form data state
    const [formData, setFormData] = useState({
        name: 'Kiaan Solutions',
        email: 'info@kiaan.com',
        phone: '+1 234 567 890',
        website: '',
        address: '',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        currency: 'ZAR',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        terms: '',
        notes: '',
        major: '',
        salesWorkflow: ['Quote', 'Invoice', 'Payment', 'Service Delivery'] // Default service based
    });

    const colors = [
        '#004aad', '#4b5563', '#6366f1', '#ef4444', '#f59e0b', '#eab308', '#84cc16',
        '#06b6d4', '#8b5cf6', '#1e293b', '#0f172a', '#3b82f6', '#10b981', '#f43f5e',
        '#ffffff', '#000000'
    ];

    const templates = ['New York', 'Toronto', 'Rio', 'London', 'Istanbul', 'Mumbai', 'Hong Kong', 'Tokyo', 'Sydney', 'Paris'];

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                // Get company ID from utility function
                const companyIdFromStorage = GetCompanyId();

                console.log('🔍 Fetching company data...');
                console.log('Company ID from GetCompanyId():', companyIdFromStorage);

                if (!companyIdFromStorage) {
                    console.error('❌ No company ID found in localStorage');
                    alert('Company ID not found. Please login again.');
                    return;
                }

                setCompanyId(companyIdFromStorage);

                console.log('📡 Calling API: GET /companies/' + companyIdFromStorage);
                const res = await companyService.getById(companyIdFromStorage);
                const data = res.data;

                console.log('✅ Company data received:', data);

                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    website: data.website || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    zip: data.zip || '',
                    country: data.country || 'South Africa',
                    currency: data.currency || 'ZAR',
                    major: data.major || '',
                    salesWorkflow: data.salesWorkflow ? (typeof data.salesWorkflow === 'string' ? JSON.parse(data.salesWorkflow) : data.salesWorkflow) : ['Quote', 'Invoice', 'Payment', 'Service Delivery'],
                    bankName: data.bankName || '',
                    accountHolder: data.accountHolder || '',
                    accountNumber: data.accountNumber || '',
                    ifsc: data.ifsc || '',
                    terms: data.terms || '',
                    notes: data.notes || ''
                });

                setInvoiceSettings({
                    template: data.invoiceTemplate || 'New York',
                    color: data.invoiceColor || '#004aad',
                    showQr: data.showQrCode !== undefined ? data.showQrCode : true,
                    logo: null,
                    logoPreview: data.invoiceLogo || null
                });

                if (data.inventoryConfig) {
                    const invCfg = typeof data.inventoryConfig === 'string'
                        ? JSON.parse(data.inventoryConfig)
                        : data.inventoryConfig;
                    setInventorySettings({
                        reserveOnQuotation: invCfg.reserveOnQuotation || false,
                        reserveOnSO: invCfg.reserveOnSO || false,
                        challanAction: invCfg.challanAction || 'ISSUE'
                    });
                }

                if (data.logo) {
                    setLogoPreview(data.logo);
                }

                console.log('✅ Company data loaded successfully!');
            } catch (error) {
                console.error('❌ Failed to fetch company data:', error);
                alert('Failed to load company data: ' + (error.response?.data?.message || error.message));
            }
        };
        fetchCompany();
    }, []);

    const handleLogoChange = (e, type = 'company') => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'company') {
                    setLogoPreview(reader.result);
                    setFormData(prev => ({ ...prev, logoFile: file }));
                } else {
                    setInvoiceSettings(prev => ({
                        ...prev,
                        logo: file,
                        logoPreview: reader.result
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = (ref) => {
        ref.current.click();
    };

    const handleSave = async () => {
        if (!companyId) {
            alert('Company ID not found. Please refresh the page.');
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();

            // Append general info
            Object.keys(formData).forEach(key => {
                if (key !== 'logoFile' && formData[key] !== null && formData[key] !== undefined) {
                    // Special handling for salesWorkflow array
                    if (key === 'salesWorkflow') {
                        formDataToSend.append(key, JSON.stringify(formData[key]));
                    } else {
                        formDataToSend.append(key, formData[key]);
                    }
                }
            });

            // Append images if they are files
            if (formData.logoFile) {
                formDataToSend.append('logo', formData.logoFile);
            }
            if (invoiceSettings.logo) {
                formDataToSend.append('invoiceLogo', invoiceSettings.logo);
            }

            // Append invoice settings
            formDataToSend.append('invoiceTemplate', invoiceSettings.template);
            formDataToSend.append('invoiceColor', invoiceSettings.color);
            formDataToSend.append('showQrCode', invoiceSettings.showQr);
            formDataToSend.append('inventoryConfig', JSON.stringify(inventorySettings));

            // Debug: Log what we're sending
            console.log('📤 Sending company update to API...');
            console.log('Company ID:', companyId);
            console.log('Form Data Fields:');
            for (let [key, value] of formDataToSend.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: [File] ${value.name}`);
                } else {
                    console.log(`  ${key}:`, value);
                }
            }

            const response = await companyService.update(companyId, formDataToSend);

            console.log('✅ Company update successful!');
            console.log('Response data:', response.data);

            // Update local state with the response data
            if (response.data) {
                const data = response.data;
                setFormData({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    website: data.website || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    zip: data.zip || '',
                    country: data.country || 'South Africa',
                    currency: data.currency || 'ZAR',
                    major: data.major || '',
                    salesWorkflow: data.salesWorkflow ? (typeof data.salesWorkflow === 'string' ? JSON.parse(data.salesWorkflow) : data.salesWorkflow) : ['Quote', 'Invoice', 'Payment', 'Service Delivery'],
                    bankName: data.bankName || '',
                    accountHolder: data.accountHolder || '',
                    accountNumber: data.accountNumber || '',
                    ifsc: data.ifsc || '',
                    terms: data.terms || '',
                    notes: data.notes || ''
                });

                setInvoiceSettings({
                    template: data.invoiceTemplate || 'New York',
                    color: data.invoiceColor || '#004aad',
                    showQr: data.showQrCode !== undefined ? data.showQrCode : true,
                    logo: null,
                    logoPreview: data.invoiceLogo || null
                });

                if (data.logo) {
                    setLogoPreview(data.logo);
                }
            }

            alert('✅ Settings saved successfully!');
        } catch (error) {
            console.error('Save Error:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error occurred';
            alert('❌ Failed to save settings: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChangeRequest = async () => {
        try {
            const response = await passwordRequestService.create();
            alert(response.message || 'Password change request submitted successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to submit request: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleWorkflowChange = (index, value) => {
        const newWorkflow = [...formData.salesWorkflow];
        newWorkflow[index] = value;
        setFormData(prev => ({ ...prev, salesWorkflow: newWorkflow }));
    };

    const handleAddWorkflowStep = () => {
        setFormData(prev => ({ ...prev, salesWorkflow: [...prev.salesWorkflow, ''] }));
    };

    const handleRemoveWorkflowStep = (index) => {
        const newWorkflow = formData.salesWorkflow.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, salesWorkflow: newWorkflow }));
    };

    return (
        <div className="companySetting-settings-page">
            <div className="companySetting-page-header">
                <div>
                    <h1 className="companySetting-page-title">Company Settings</h1>
                    <p className="companySetting-page-subtitle">Manage your company profile and preferences</p>
                </div>
                <button className="companySetting-btn-primary" onClick={handleSave} disabled={loading}>
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="companySetting-settings-container">
                {/* Tabs */}
                <div className="companySetting-settings-tabs">
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General Info
                    </button>
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'address' ? 'active' : ''}`}
                        onClick={() => setActiveTab('address')}
                    >
                        Address
                    </button>
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'business' ? 'active' : ''}`}
                        onClick={() => setActiveTab('business')}
                    >
                        Business Settings
                    </button>
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
                        onClick={() => setActiveTab('invoice')}
                    >
                        Invoice Setting
                    </button>
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventory
                    </button>
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Security
                    </button>
                    <button
                        className={`companySetting-tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
                        onClick={() => setActiveTab('workflow')}
                    >
                        Sales Workflow
                    </button>
                </div>

                {/* Content */}
                <div className="companySetting-settings-content">
                    {activeTab === 'general' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <div className="companySetting-form-grid">
                                <div className="companySetting-form-group">
                                    <label>Company Name <span className="companySetting-required">*</span></label>
                                    <div className="companySetting-icon-wrapper">
                                        <Building2 size={18} className="companySetting-icon" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Company Email <span className="companySetting-required">*</span></label>
                                    <div className="companySetting-icon-wrapper">
                                        <Mail size={18} className="companySetting-icon" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Enter company email"
                                        />
                                    </div>
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Phone Number</label>
                                    <div className="companySetting-icon-wrapper">
                                        <Phone size={18} className="companySetting-icon" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Website</label>
                                    <div className="companySetting-icon-wrapper">
                                        <Globe size={18} className="companySetting-icon" />
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://www.example.com"
                                        />
                                    </div>
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Major (Industry)</label>
                                    <div className="companySetting-icon-wrapper">
                                        <Building2 size={18} className="companySetting-icon" />
                                        <select
                                            value={formData.major}
                                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                            style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', height: '2.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="">Select Industry</option>
                                            <option value="Retail">Retail</option>
                                            <option value="Construction">Construction</option>
                                            <option value="Services">Services</option>
                                            <option value="Manufacturing">Manufacturing</option>
                                            <option value="Logistics">Logistics</option>
                                            <option value="Technology">Technology</option>
                                            <option value="Healthcare">Healthcare</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="companySetting-logo-section">
                                <label>Company Logo</label>
                                <div className="companySetting-logo-uploader">
                                    <div className="companySetting-preview-box">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Company Logo" className="companySetting-logo-preview-img" />
                                        ) : (
                                            <ImageIcon size={32} />
                                        )}
                                    </div>
                                    <div className="companySetting-upload-controls">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => handleLogoChange(e, 'company')}
                                            accept="image/jpeg, image/png, image/gif"
                                            style={{ display: 'none' }}
                                        />
                                        <button className="companySetting-btn-upload" onClick={() => handleUploadClick(fileInputRef)}>
                                            <Upload size={16} /> Upload New Logo
                                        </button>
                                        <p className="companySetting-upload-hint">Allowed JPG, GIF or PNG. Max size of 800K</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <div className="companySetting-form-grid">
                                <div className="companySetting-form-group full-width">
                                    <label>Street Address</label>
                                    <div className="companySetting-icon-wrapper">
                                        <MapPin size={18} className="companySetting-icon" />
                                        <textarea rows="3" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Business St, Tech Park"></textarea>
                                    </div>
                                </div>
                                <div className="companySetting-form-group">
                                    <label>City</label>
                                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                                <div className="companySetting-form-group">
                                    <label>State / Province</label>
                                    <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Postal Code</label>
                                    <input type="text" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Country</label>
                                    <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })}>
                                        <option>United States</option>
                                        <option>Canada</option>
                                        <option>United Kingdom</option>
                                        <option>India</option>
                                        <option>South Africa</option>
                                        <option>Namibia</option>
                                        <option>Botswana</option>
                                        <option>Lesotho</option>
                                        <option>Eswatini</option>
                                        <option>Zambia</option>
                                        <option>Zimbabwe</option>
                                        <option>Mozambique</option>
                                        <option>Malawi</option>
                                        <option>Angola</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'business' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <div className="companySetting-form-grid">
                                <div className="companySetting-form-group">
                                    <label>Currency</label>
                                    <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                                        <option value="ZAR">South African Rand (ZAR)</option>
                                        <option value="NAD">Namibian Dollar (NAD)</option>
                                        <option value="BWP">Botswana Pula (BWP)</option>
                                        <option value="LSL">Lesotho Loti (LSL)</option>
                                        <option value="SZL">Swazi Lilangeni (SZL)</option>
                                        <option value="ZMW">Zambian Kwacha (ZMW)</option>
                                        <option value="ZiG">Zimbabwe Gold (ZiG)</option>
                                        <option value="USD">United States Dollar (USD)</option>
                                        <option value="MZN">Mozambican Metical (MZN)</option>
                                        <option value="MWK">Malawian Kwacha (MWK)</option>
                                        <option value="AOA">Angolan Kwanza (AOA)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                        <option value="GBP">British Pound (GBP)</option>
                                        <option value="INR">Indian Rupee (INR)</option>
                                    </select>
                                </div>
                            </div>

                            <h3 className="companySetting-section-title">Bank Details</h3>
                            <div className="companySetting-form-grid">
                                <div className="companySetting-form-group">
                                    <label>Bank Name</label>
                                    <div className="companySetting-icon-wrapper">
                                        <Landmark size={18} className="companySetting-icon" />
                                        <input type="text" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} placeholder="e.g. Chase Bank" />
                                    </div>
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Account Holder Name</label>
                                    <input type="text" value={formData.accountHolder} onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })} placeholder="e.g. enter company name" />
                                </div>
                                <div className="companySetting-form-group">
                                    <label>Account Number</label>
                                    <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} placeholder="XXXXXXXXXXXX" />
                                </div>
                                <div className="companySetting-form-group">
                                    <label>IFSC / Sort Code</label>
                                    <input type="text" value={formData.ifsc} onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })} placeholder="Code" />
                                </div>
                            </div>

                            <h3 className="companySetting-section-title">Policies & Notes</h3>
                            <div className="companySetting-form-grid">
                                <div className="companySetting-form-group full-width">
                                    <label>Terms & Conditions</label>
                                    <div className="companySetting-icon-wrapper">
                                        <FileText size={18} className="companySetting-icon" />
                                        <textarea rows="4" value={formData.terms} onChange={(e) => setFormData({ ...formData, terms: e.target.value })} placeholder="Enter default terms and conditions for invoices..."></textarea>
                                    </div>
                                </div>
                                <div className="companySetting-form-group full-width">
                                    <label>Default Notes</label>
                                    <div className="companySetting-icon-wrapper">
                                        <StickyNote size={18} className="companySetting-icon" />
                                        <textarea rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Enter default notes for customers..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoice' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <div className="invoice-settings-layout">
                                {/* Left Controls */}
                                <div className="invoice-controls">
                                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Invoice Print Settings</h3>

                                    <div className="companySetting-form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label>Invoice Template</label>
                                        <select
                                            value={invoiceSettings.template}
                                            onChange={(e) => setInvoiceSettings({ ...invoiceSettings, template: e.target.value })}
                                            style={{ padding: '0.8rem', borderColor: '#8ce043' }}
                                        >
                                            {templates.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div className="companySetting-form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label>QR Display?</label>
                                        <label className="switch-label">
                                            <input
                                                type="checkbox"
                                                className="switch-input"
                                                checked={invoiceSettings.showQr}
                                                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showQr: e.target.checked })}
                                            />
                                            <div className="switch-toggle" />
                                        </label>
                                    </div>

                                    <div className="companySetting-form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label>Color Input</label>
                                        <div className="color-swatches">
                                            {colors.map(c => (
                                                <div
                                                    key={c}
                                                    className={`color-swatch ${invoiceSettings.color === c ? 'active' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => setInvoiceSettings({ ...invoiceSettings, color: c })}
                                                >
                                                    {invoiceSettings.color === c && <Check size={14} className="color-swatch-check" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="companySetting-logo-section" style={{ border: 'none', padding: 0 }}>
                                        <label>Invoice Logo</label>
                                        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Overhead content if different from company logo</p>

                                        <input
                                            type="file"
                                            ref={invoiceLogoInputRef}
                                            onChange={(e) => handleLogoChange(e, 'invoice')}
                                            accept="image/jpeg, image/png"
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            className="companySetting-btn-upload"
                                            style={{ backgroundColor: '#8ce043', color: 'white', border: 'none', width: '100%', justifyContent: 'center' }}
                                            onClick={() => handleUploadClick(invoiceLogoInputRef)}
                                        >
                                            <Upload size={16} /> Choose file here
                                        </button>
                                    </div>

                                    <div style={{ marginTop: '3rem' }}>
                                        <button
                                            className="companySetting-btn-primary"
                                            onClick={handleSave}
                                            style={{ backgroundColor: '#8ce043', width: '100%', justifyContent: 'center' }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>

                                {/* Right Preview */}
                                <div
                                    className={`invoice-preview-container template-${invoiceSettings.template.toLowerCase().replace(' ', '')}`}
                                    style={{ '--header-bg': invoiceSettings.color }}
                                >
                                    <div className="invoice-header-wrapper">
                                        <div className="invoice-preview-header">
                                            <div className="invoice-header-left">
                                                {invoiceSettings.logoPreview || logoPreview ? (
                                                    <img src={invoiceSettings.logoPreview || logoPreview} alt="Logo" className="invoice-logo-large" />
                                                ) : (
                                                    <h2 style={{ color: invoiceSettings.color, margin: 0 }}>ACCOUNTGO</h2>
                                                )}

                                                <div className="invoice-company-details">
                                                    <strong>{formData.name}</strong><br />
                                                    {formData.email}<br />
                                                    {formData.phone}<br />
                                                    {formData.address}, {formData.city}<br />
                                                    {formData.country} - {formData.zip}<br />
                                                </div>
                                            </div>
                                            <div className="invoice-header-right">
                                                <div className="invoice-title-large">INVOICE</div>
                                                <div className="invoice-meta-info">
                                                    <div className="invoice-meta-row">
                                                        <span className="invoice-label">Number:</span> #INVO00001
                                                    </div>
                                                    <div className="invoice-meta-row">
                                                        <span className="invoice-label">Issue:</span> Jan 17, 2026
                                                    </div>
                                                    <div className="invoice-meta-row">
                                                        <span className="invoice-label">Due Date:</span> Jan 17, 2026
                                                    </div>
                                                </div>
                                                {invoiceSettings.showQr && (
                                                    <div className="invoice-qr-box">
                                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=InvoiceDemo" alt="QR" className="invoice-qr-code" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="invoice-addresses">
                                        <div className="invoice-bill-to">
                                            <div className="invoice-section-header">Bill To:</div>
                                            <div>&lt;Customer Name&gt;</div>
                                            <div>&lt;Address&gt;</div>
                                            <div>&lt;City&gt;, &lt;State&gt; &lt;Zip&gt;</div>
                                        </div>
                                        <div className="invoice-ship-to" style={{ textAlign: 'right' }}>
                                            <div className="invoice-section-header">Ship To:</div>
                                            <div>&lt;Customer Name&gt;</div>
                                            <div>&lt;Address&gt;</div>
                                            <div>&lt;City&gt;, &lt;State&gt; &lt;Zip&gt;</div>
                                        </div>
                                    </div>

                                    <table className="invoice-table-preview">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Quantity</th>
                                                <th>Rate</th>
                                                <th>Discount</th>
                                                <th>Tax (%)</th>
                                                <th style={{ textAlign: 'right' }}>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Item 1</td>
                                                <td>1</td>
                                                <td>$100.00</td>
                                                <td>$50.00</td>
                                                <td>Tax 10%</td>
                                                <td style={{ textAlign: 'right' }}>$50.00</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    <div className="invoice-total-section">
                                        <div className="invoice-totals">
                                            <div className="invoice-total-row">
                                                <span>Sub Total</span>
                                                <span>$50.00</span>
                                            </div>
                                            <div className="invoice-total-row">
                                                <span>Tax</span>
                                                <span>$5.00</span>
                                            </div>
                                            <div className="invoice-final-total">
                                                <span>Total</span>
                                                <span>$55.00</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <h3 className="companySetting-section-title">Stock Management Logic</h3>

                            <div className="companySetting-form-grid" style={{ gap: '2rem' }}>
                                <div className="companySetting-form-group full-width">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid #e5e7eb' }}>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '0.2rem' }}>Reserve on Quotation</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Automatically reserve stock when a quotation is created</p>
                                        </div>
                                        <label className="switch-label">
                                            <input
                                                type="checkbox"
                                                className="switch-input"
                                                checked={inventorySettings.reserveOnQuotation}
                                                onChange={(e) => setInventorySettings({ ...inventorySettings, reserveOnQuotation: e.target.checked })}
                                            />
                                            <div className="switch-toggle" />
                                        </label>
                                    </div>
                                </div>

                                <div className="companySetting-form-group full-width">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid #e5e7eb' }}>
                                        <div>
                                            <h4 style={{ margin: 0, marginBottom: '0.2rem' }}>Reserve on Sales Order</h4>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Automatically reserve stock when a sales order is created</p>
                                        </div>
                                        <label className="switch-label">
                                            <input
                                                type="checkbox"
                                                className="switch-input"
                                                checked={inventorySettings.reserveOnSO}
                                                onChange={(e) => setInventorySettings({ ...inventorySettings, reserveOnSO: e.target.checked })}
                                            />
                                            <div className="switch-toggle" />
                                        </label>
                                    </div>
                                </div>

                                <div className="companySetting-form-group full-width">
                                    <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.8rem', border: '1px solid #e5e7eb' }}>
                                        <h4 style={{ margin: 0, marginBottom: '1rem' }}>Delivery Challan Behavior</h4>
                                        <div style={{ display: 'flex', gap: '2rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="challanAction"
                                                    value="ISSUE"
                                                    checked={inventorySettings.challanAction === 'ISSUE'}
                                                    onChange={(e) => setInventorySettings({ ...inventorySettings, challanAction: e.target.value })}
                                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                                />
                                                <div>
                                                    <strong>Issue Stock</strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Decrement total stock immediately (Default)</div>
                                                </div>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="challanAction"
                                                    value="RESERVE"
                                                    checked={inventorySettings.challanAction === 'RESERVE'}
                                                    onChange={(e) => setInventorySettings({ ...inventorySettings, challanAction: e.target.value })}
                                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                                />
                                                <div>
                                                    <strong>Reserve Stock</strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Move stock to reserved but remain in total stock</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <h3 className="companySetting-section-title">Password Management</h3>
                            <div className="companySetting-form-grid">
                                <div className="companySetting-form-group full-width">
                                    <label>Request Password Change</label>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                        Submit a request to change your password. Your administrator will review and approve the request.
                                    </p>
                                    <button
                                        className="companySetting-btn-upload"
                                        onClick={handlePasswordChangeRequest}
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Lock size={16} /> Request Password Change
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'workflow' && (
                        <div className="companySetting-form-section companySetting-fade-in">
                            <h3 className="companySetting-section-title">Sales Workflow Customization</h3>
                            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Customize the flow of your sales process to match your business operations.</p>

                            <div className="companySetting-form-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                <div className="companySetting-form-group full-width">
                                    <label>Select Workflow Type</label>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="companySetting-btn-upload"
                                            style={{
                                                backgroundColor: JSON.stringify(formData.salesWorkflow) === JSON.stringify(['Order', 'Invoice', 'Payment']) ? '#004aad' : '#f3f4f6',
                                                color: JSON.stringify(formData.salesWorkflow) === JSON.stringify(['Order', 'Invoice', 'Payment']) ? 'white' : 'black'
                                            }}
                                            onClick={() => setFormData({ ...formData, salesWorkflow: ['Order', 'Invoice', 'Payment'] })}
                                        >
                                            Standard (Product)
                                        </button>
                                        <button
                                            type="button"
                                            className="companySetting-btn-upload"
                                            style={{
                                                backgroundColor: JSON.stringify(formData.salesWorkflow) === JSON.stringify(['Quote', 'Invoice', 'Payment', 'Service Delivery']) ? '#004aad' : '#f3f4f6',
                                                color: JSON.stringify(formData.salesWorkflow) === JSON.stringify(['Quote', 'Invoice', 'Payment', 'Service Delivery']) ? 'white' : 'black'
                                            }}
                                            onClick={() => setFormData({ ...formData, salesWorkflow: ['Quote', 'Invoice', 'Payment', 'Service Delivery'] })}
                                        >
                                            Service Business
                                        </button>
                                    </div>
                                </div>

                                <div className="companySetting-form-group full-width">
                                    <label>Current Workflow Steps</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                        {formData.salesWorkflow && Array.isArray(formData.salesWorkflow) && formData.salesWorkflow.map((step, index) => (
                                            <React.Fragment key={index}>
                                                <div style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '2rem', fontWeight: '500' }}>
                                                    {step}
                                                </div>
                                                {index < formData.salesWorkflow.length - 1 && <div style={{ color: '#9ca3af' }}>➔</div>}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};

export default CompanySettings;
