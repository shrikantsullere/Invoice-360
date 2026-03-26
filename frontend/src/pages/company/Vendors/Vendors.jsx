import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Filter, ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CompanyContext } from '../../../context/CompanyContext';
import vendorService from '../../../services/vendorService';
import chartOfAccountsService from '../../../services/chartOfAccountsService';
import './Vendors.css';

const Vendors = () => {
    const { formatCurrency } = React.useContext(CompanyContext);
    const [vendors, setVendors] = useState([]);
    const navigate = useNavigate();
    const [accountTypes, setAccountTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [currentVendor, setCurrentVendor] = useState(null);

    // Initial Form State
    const initialFormState = {
        name: '',
        nameArabic: '',
        companyName: '',
        companyLocation: '',
        profileImage: '',
        anyFile: '',
        accountType: '',
        balanceType: 'Credit', // Default to Credit for Vendors
        accountBalance: 0,
        creationDate: new Date().toISOString().split('T')[0],
        bankAccountNumber: '',
        bankIFSC: '',
        bankNameBranch: '',
        phone: '',
        email: '',
        creditPeriod: '',
        gstNumber: '',
        gstEnabled: false,
        billingName: '',
        billingPhone: '',
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingCountry: '',
        billingZipCode: '',
        shippingSameAsBilling: false,
        shippingName: '',
        shippingPhone: '',
        shippingAddress: '',
        shippingCity: '',
        shippingState: '',
        shippingCountry: '',
        shippingZipCode: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vendorsRes, typesRes] = await Promise.all([
                vendorService.getAllVendors(),
                chartOfAccountsService.getAccountTypes()
            ]);

            if (vendorsRes.success) {
                setVendors(vendorsRes.data);
            }
            if (typesRes.success) {
                setAccountTypes(typesRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load vendors');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // Auto-fill shipping address if "same as billing" is checked
            if (name === 'shippingSameAsBilling' && checked) {
                newData.shippingName = prev.billingName;
                newData.shippingPhone = prev.billingPhone;
                newData.shippingAddress = prev.billingAddress;
                newData.shippingCity = prev.billingCity;
                newData.shippingState = prev.billingState;
                newData.shippingCountry = prev.billingCountry;
                newData.shippingZipCode = prev.billingZipCode;
            }

            return newData;
        });
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setCurrentVendor(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setShowModal(true);
    };

    const openEditModal = (vendor) => {
        setCurrentVendor(vendor);
        setFormData({
            ...initialFormState,
            ...vendor,
            creationDate: vendor.creationDate ? new Date(vendor.creationDate).toISOString().split('T')[0] : initialFormState.creationDate,
            shippingSameAsBilling: vendor.shippingSameAsBilling || false,
            gstEnabled: vendor.gstEnabled || false
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const openViewModal = (vendor) => {
        setCurrentVendor(vendor);
        setFormData({
            ...initialFormState,
            ...vendor,
            creationDate: vendor.creationDate ? new Date(vendor.creationDate).toISOString().split('T')[0] : initialFormState.creationDate,
            shippingSameAsBilling: vendor.shippingSameAsBilling || false,
            gstEnabled: vendor.gstEnabled || false
        });
        setModalMode('view');
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Please fill in required fields (Name and Email)');
            return;
        }

        try {
            if (modalMode === 'create') {
                await vendorService.createVendor(formData);
                toast.success('Vendor created successfully!');
            } else if (modalMode === 'edit') {
                await vendorService.updateVendor(currentVendor.id, formData);
                toast.success('Vendor updated successfully!');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving vendor:', error);
            toast.error(error.message || 'Failed to save vendor');
        }
    };

    const handleDelete = async (vendor) => {
        if (!window.confirm(`Are you sure you want to delete ${vendor.name}?`)) {
            return;
        }

        try {
            await vendorService.deleteVendor(vendor.id);
            toast.success('Vendor deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting vendor:', error);
            toast.error(error.message || 'Failed to delete vendor');
        }
    };

    if (loading) return <div className="p-8">Loading vendors...</div>;

    return (
        <div className="Vendors-page">
            <div className="Vendors-page-header">
                <h1 className="Vendors-page-title">Vendors / Suppliers</h1>
                <button className="Vendors-btn-add" onClick={openCreateModal}>
                    <Plus size={18} />
                    Add Vendor
                </button>
            </div>

            <div className="Vendors-card">
                <div className="Vendors-controls-row">
                    <div className="Vendors-entries-control">
                        <span className="Vendors-entries-text">Show</span>
                        <select className="Vendors-entries-select">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="Vendors-entries-text">entries</span>
                    </div>
                    <div className="Vendors-search-control">
                        <input type="text" className="Vendors-search-input" placeholder="Search..." />
                    </div>
                </div>

                <div className="Vendors-table-container">
                    <table className="Vendors-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Email / Phone</th>
                                <th>Balance & Credit</th>
                                <th>Linked Ledger</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length > 0 ? (
                                vendors.map((vendor) => (
                                    <tr key={vendor.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{vendor.name}</div>
                                            {vendor.nameArabic && <div style={{ fontSize: '0.8em', color: '#9ca3af' }}>{vendor.nameArabic}</div>}
                                        </td>
                                        <td>{vendor.companyName || '-'}</td>
                                        <td>
                                            <div>{vendor.email}</div>
                                            <div style={{ fontSize: '0.85em', color: '#6b7280' }}>{vendor.phone}</div>
                                        </td>
                                        <td>
                                            <div className="Vendors-text-success">{formatCurrency(vendor.accountBalance || 0)}</div>
                                            {vendor.creditPeriod && <div style={{ fontSize: '0.85em', color: '#6b7280' }}>Credit: {vendor.creditPeriod} days</div>}
                                        </td>
                                        <td>
                                            {vendor.ledger ? (
                                                <button
                                                    className="Vendors-badge p-2 border-0 bg-transparent text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/company/accounts/vendors/${vendor.id}`);
                                                    }}
                                                >
                                                    {vendor.ledger.name} <ArrowRight size={14} />
                                                </button>
                                            ) : (
                                                <span className="Vendors-text-danger">Not Linked</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="Vendors-action-buttons">
                                                <button className="Vendors-action-btn Vendors-btn-view" onClick={() => openViewModal(vendor)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="Vendors-action-btn Vendors-btn-edit" onClick={() => openEditModal(vendor)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="Vendors-action-btn Vendors-btn-delete" onClick={() => handleDelete(vendor)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-4">No vendors found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="Vendors-modal-overlay">
                    <div className={`Vendors-modal-content Vendors-modal-large`}>
                        <div className="Vendors-modal-header">
                            <h2 className="Vendors-modal-title">
                                {modalMode === 'create' && 'Add Vendor'}
                                {modalMode === 'edit' && 'Edit Vendor'}
                                {modalMode === 'view' && 'Vendor Details'}
                            </h2>
                            <button className="Vendors-close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="Vendors-modal-body">
                            {/* Basic Information */}
                            <div className="Vendors-form-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                <h3 className="Vendors-section-subtitle">Basic Information</h3>
                                <div className="Vendors-form-row Vendors-mixed-col">
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Name (English) <span className="Vendors-text-red">*</span></label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Name"
                                        />
                                    </div>
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Name (Arabic)</label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="nameArabic"
                                            value={formData.nameArabic}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Name (Arabic)"
                                        />
                                    </div>
                                </div>

                                <div className="Vendors-form-row Vendors-mixed-col">
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Company Name</label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    <div className="Vendors-form-group Vendors-google-loc">
                                        <label className="Vendors-form-label">Company Google Location</label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="companyLocation"
                                            value={formData.companyLocation}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Google Maps link"
                                        />
                                    </div>
                                </div>

                                {/* File Uploads Mockup */}
                                <div className="Vendors-form-row Vendors-mixed-col">
                                    <div className="Vendors-form-group Vendors-profile-img">
                                        <label className="Vendors-form-label">Profile Image</label>
                                        <div className="Vendors-file-input-wrapper">
                                            <div className="Vendors-file-label">
                                                <span className="Vendors-file-btn">Choose File</span>
                                                <span className="Vendors-file-name">No file chosen</span>
                                            </div>
                                            <input type="file" className="Vendors-file-input" disabled={modalMode === 'view'} />
                                        </div>
                                        <span className="Vendors-file-note">JPEG, PNG or JPG (max 5MB)</span>
                                    </div>
                                    <div className="Vendors-form-group Vendors-any-file">
                                        <label className="Vendors-form-label">Any File</label>
                                        <div className="Vendors-file-input-wrapper">
                                            <div className="Vendors-file-label">
                                                <span className="Vendors-file-btn">Choose File</span>
                                                <span className="Vendors-file-name">No file chosen</span>
                                            </div>
                                            <input type="file" className="Vendors-file-input" disabled={modalMode === 'view'} />
                                        </div>
                                        <span className="Vendors-file-note">Any file type. If image, max 5MB</span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="Vendors-form-section">
                                <h3 className="Vendors-section-subtitle">Account Information</h3>
                                <div className="Vendors-form-row Vendors-mixed-col">
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Account Type <span className="Vendors-text-red">*</span></label>
                                        <select
                                            className="Vendors-form-select"
                                            name="accountType"
                                            value={formData.accountType}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        >
                                            {/* <option value="">-- Select Account --</option> */}
                                            {accountTypes
                                                .flatMap(group => group.accounts)
                                                .filter(acc => acc.accountTypeName === 'Accounts Payable')
                                                .map((acc, j) => (
                                                    <option key={j} value={acc.accountTypeId}>{acc.accountTypeName}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Balance Type</label>
                                        <select
                                            className="Vendors-form-select"
                                            name="balanceType"
                                            value={formData.balanceType}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        >
                                            <option value="Credit">Credit</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="Vendors-form-row Vendors-mixed-col">
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <div className="Vendors-input-with-note">
                                            <label className="Vendors-form-label">Account Name <span className="Vendors-text-red">*</span></label>
                                            <input
                                                type="text"
                                                className="Vendors-form-input"
                                                value={formData.companyName || formData.name}
                                                readOnly
                                                disabled
                                                style={{ backgroundColor: '#f3f4f6' }}
                                            />
                                            <span className="Vendors-input-note">This will auto-fill from selection above</span>
                                        </div>
                                    </div>
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Account Balance <span className="Vendors-text-red">*</span></label>
                                        <input
                                            type="number"
                                            className="Vendors-form-input"
                                            name="accountBalance"
                                            value={formData.accountBalance}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Creation Date <span className="Vendors-text-red">*</span></label>
                                        <input
                                            type="date"
                                            className="Vendors-form-input"
                                            name="creationDate"
                                            value={formData.creationDate}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="Vendors-form-section">
                                <h3 className="Vendors-section-subtitle">Bank Details</h3>
                                <div className="Vendors-form-row Vendors-three-col">
                                    <div className="Vendors-form-group">
                                        <label className="Vendors-form-label">Bank Account Number</label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="bankAccountNumber"
                                            value={formData.bankAccountNumber}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter bank account number"
                                        />
                                    </div>
                                    <div className="Vendors-form-group">
                                        <label className="Vendors-form-label">Bank IFSC</label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="bankIFSC"
                                            value={formData.bankIFSC}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter bank IFSC"
                                        />
                                    </div>
                                    <div className="Vendors-form-group">
                                        <label className="Vendors-form-label">Bank Name & Branch</label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="bankNameBranch"
                                            value={formData.bankNameBranch}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter bank name & branch"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & GST */}
                            <div className="Vendors-form-section">
                                <h3 className="Vendors-section-subtitle">Contact & Status</h3>
                                <div className="Vendors-form-row Vendors-mixed-col">
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Phone <span className="Vendors-text-red">*</span></label>
                                        <input
                                            type="text"
                                            className="Vendors-form-input"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Phone"
                                        />
                                    </div>
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Email <span className="Vendors-text-red">*</span></label>
                                        <input
                                            type="email"
                                            className="Vendors-form-input"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Email"
                                        />
                                    </div>
                                    <div className="Vendors-form-group Vendors-half-width">
                                        <label className="Vendors-form-label">Credit Period (days)</label>
                                        <input
                                            type="number"
                                            className="Vendors-form-input"
                                            name="creditPeriod"
                                            value={formData.creditPeriod}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter credit period"
                                        />
                                    </div>
                                </div>

                                <div className="Vendors-form-row" style={{ alignItems: 'center' }}>
                                    <label className="Vendors-switch" style={{ marginRight: '10px' }}>
                                        <input
                                            type="checkbox"
                                            name="gstEnabled"
                                            checked={formData.gstEnabled}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        />
                                        <span className="Vendors-slider Vendors-round"></span>
                                    </label>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Enable GST</span>

                                    {formData.gstEnabled && (
                                        <div className="Vendors-form-group" style={{ marginLeft: '2rem', flex: 1 }}>
                                            <input
                                                type="text"
                                                className="Vendors-form-input"
                                                name="gstNumber"
                                                value={formData.gstNumber}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter GSTIN"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Addresses */}
                            <div className="Vendors-form-section">
                                <div className="Vendors-form-row">
                                    {/* Billing Address */}
                                    <div style={{ flex: 1 }}>
                                        <h3 className="Vendors-section-subtitle">Billing Address</h3>
                                        <div className="Vendors-form-group">
                                            <label className="Vendors-form-label">Name</label>
                                            <input
                                                type="text"
                                                className="Vendors-form-input"
                                                name="billingName"
                                                value={formData.billingName}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter Name"
                                            />
                                        </div>
                                        <div className="Vendors-form-group">
                                            <label className="Vendors-form-label">Phone</label>
                                            <input
                                                type="text"
                                                className="Vendors-form-input"
                                                name="billingPhone"
                                                value={formData.billingPhone}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter Phone"
                                            />
                                        </div>
                                        <div className="Vendors-form-group">
                                            <label className="Vendors-form-label">Address</label>
                                            <textarea
                                                className="Vendors-form-textarea"
                                                name="billingAddress"
                                                value={formData.billingAddress}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter Address"
                                                rows="3"
                                            />
                                        </div>
                                        <div className="Vendors-form-row">
                                            <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Vendors-form-input"
                                                    name="billingCity"
                                                    value={formData.billingCity}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Vendors-form-input"
                                                    name="billingState"
                                                    value={formData.billingState}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="State"
                                                />
                                            </div>
                                        </div>
                                        <div className="Vendors-form-row">
                                            <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Vendors-form-input"
                                                    name="billingCountry"
                                                    value={formData.billingCountry}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="Country"
                                                />
                                            </div>
                                            <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Vendors-form-input"
                                                    name="billingZipCode"
                                                    value={formData.billingZipCode}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="Zip Code"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div style={{ flex: 1, paddingLeft: '2rem', borderLeft: '1px solid #edf2f7' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 className="Vendors-section-subtitle">Shipping Address</h3>
                                            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                                <input
                                                    type="checkbox"
                                                    name="shippingSameAsBilling"
                                                    checked={formData.shippingSameAsBilling}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    style={{ marginRight: '5px' }}
                                                />
                                                Shipping Same As Billing
                                            </label>
                                        </div>

                                        {!formData.shippingSameAsBilling && (
                                            <>
                                                <div className="Vendors-form-group">
                                                    <label className="Vendors-form-label">Name</label>
                                                    <input
                                                        type="text"
                                                        className="Vendors-form-input"
                                                        name="shippingName"
                                                        value={formData.shippingName}
                                                        onChange={handleInputChange}
                                                        disabled={modalMode === 'view'}
                                                        placeholder="Enter Name"
                                                    />
                                                </div>
                                                <div className="Vendors-form-group">
                                                    <label className="Vendors-form-label">Phone</label>
                                                    <input
                                                        type="text"
                                                        className="Vendors-form-input"
                                                        name="shippingPhone"
                                                        value={formData.shippingPhone}
                                                        onChange={handleInputChange}
                                                        disabled={modalMode === 'view'}
                                                        placeholder="Enter Phone"
                                                    />
                                                </div>
                                                <div className="Vendors-form-group">
                                                    <label className="Vendors-form-label">Address</label>
                                                    <textarea
                                                        className="Vendors-form-textarea"
                                                        name="shippingAddress"
                                                        value={formData.shippingAddress}
                                                        onChange={handleInputChange}
                                                        disabled={modalMode === 'view'}
                                                        placeholder="Enter Address"
                                                        rows="3"
                                                    />
                                                </div>
                                                <div className="Vendors-form-row">
                                                    <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Vendors-form-input"
                                                            name="shippingCity"
                                                            value={formData.shippingCity}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="City"
                                                        />
                                                    </div>
                                                    <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Vendors-form-input"
                                                            name="shippingState"
                                                            value={formData.shippingState}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="State"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="Vendors-form-row">
                                                    <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Vendors-form-input"
                                                            name="shippingCountry"
                                                            value={formData.shippingCountry}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="Country"
                                                        />
                                                    </div>
                                                    <div className="Vendors-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Vendors-form-input"
                                                            name="shippingZipCode"
                                                            value={formData.shippingZipCode}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="Zip Code"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="Vendors-modal-footer">
                            <button className="Vendors-btn-cancel" onClick={() => setShowModal(false)}>
                                {modalMode === 'view' ? 'Close' : 'Cancel'}
                            </button>
                            {modalMode !== 'view' && (
                                <button className="Vendors-btn-save" onClick={handleSubmit}>
                                    {modalMode === 'create' ? 'Create' : 'Update'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendors;
