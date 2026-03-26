
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Filter, ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { CompanyContext } from '../../../context/CompanyContext';
import customerService from '../../../services/customerService';
import chartOfAccountsService from '../../../services/chartOfAccountsService';
import './Customers.css';

const Customers = () => {
    const { formatCurrency } = React.useContext(CompanyContext);
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [currentCustomer, setCurrentCustomer] = useState(null);

    // Initial Form State
    const initialFormState = {
        name: '',
        nameArabic: '',
        companyName: '',
        companyLocation: '',
        profileImage: '',
        anyFile: '',
        accountType: '',
        balanceType: 'Debit',
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
            const [customersRes, typesRes] = await Promise.all([
                customerService.getAllCustomers(),
                chartOfAccountsService.getAccountTypes()
            ]);

            if (customersRes.success) {
                setCustomers(customersRes.data);
            }
            if (typesRes.success) {
                setAccountTypes(typesRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load customers');
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

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setCurrentCustomer(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalMode('create');
        setShowModal(true);
    };

    const openEditModal = (customer) => {
        setCurrentCustomer(customer);
        setFormData({
            ...initialFormState,
            ...customer,
            creationDate: customer.creationDate ? new Date(customer.creationDate).toISOString().split('T')[0] : initialFormState.creationDate,
            shippingSameAsBilling: customer.shippingSameAsBilling || false,
            gstEnabled: customer.gstEnabled || false
        });
        setModalMode('edit');
        setShowModal(true);
    };

    const openViewModal = (customer) => {
        setCurrentCustomer(customer);
        setFormData({
            ...initialFormState,
            ...customer,
            creationDate: customer.creationDate ? new Date(customer.creationDate).toISOString().split('T')[0] : initialFormState.creationDate,
            shippingSameAsBilling: customer.shippingSameAsBilling || false,
            gstEnabled: customer.gstEnabled || false
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
                await customerService.createCustomer(formData);
                toast.success('Customer created successfully!');
            } else if (modalMode === 'edit') {
                await customerService.updateCustomer(currentCustomer.id, formData);
                toast.success('Customer updated successfully!');
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving customer:', error);
            toast.error(error.message || 'Failed to save customer');
        }
    };

    const handleDelete = async (customer) => {
        if (!window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
            return;
        }

        try {
            await customerService.deleteCustomer(customer.id);
            toast.success('Customer deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast.error(error.message || 'Failed to delete customer');
        }
    };

    if (loading) return <div className="p-8">Loading customers...</div>;

    return (
        <div className="Customers-customers-page">
            <div className="Customers-page-header">
                <h1 className="Customers-page-title">Customers</h1>
                <button className="Customers-btn-add" onClick={openCreateModal}>
                    <Plus size={18} />
                    Add Customer
                </button>
            </div>

            <div className="Customers-customers-card">
                <div className="Customers-controls-row">
                    <div className="Customers-entries-control">
                        <span className="Customers-entries-text">Show</span>
                        <select className="Customers-entries-select">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="Customers-entries-text">entries</span>
                    </div>
                    <div className="Customers-search-control">
                        <input type="text" className="Customers-search-input" placeholder="Search..." />
                    </div>
                </div>

                <div className="Customers-table-container">
                    <table className="Customers-customers-table">
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
                            {customers.length > 0 ? (
                                customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                            {customer.nameArabic && <div style={{ fontSize: '0.8em', color: '#9ca3af' }}>{customer.nameArabic}</div>}
                                        </td>
                                        <td>{customer.companyName || '-'}</td>
                                        <td>
                                            <div>{customer.email}</div>
                                            <div style={{ fontSize: '0.85em', color: '#6b7280' }}>{customer.phone}</div>
                                        </td>
                                        <td>
                                            <div className="Customers-text-success">{formatCurrency(customer.accountBalance || 0)}</div>
                                            {customer.creditPeriod && <div style={{ fontSize: '0.85em', color: '#6b7280' }}>Credit: {customer.creditPeriod} days</div>}
                                        </td>
                                        <td>
                                            {customer.ledger ? (
                                                <button
                                                    className="Customers-voucher-badge text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                    onClick={() => navigate(`/company/accounts/customers/${customer.id}`)}
                                                >
                                                    {customer.ledger.name}
                                                </button>
                                            ) : (
                                                <span className="Customers-text-danger">Not Linked</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="Customers-action-buttons">
                                                <button className="Customers-action-btn Customers-btn-view" onClick={() => openViewModal(customer)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="Customers-action-btn Customers-btn-edit" onClick={() => openEditModal(customer)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="Customers-action-btn Customers-btn-delete" onClick={() => handleDelete(customer)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-4">No customers found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="Customers-modal-overlay">
                    <div className={`Customers-modal-content Customers-modal-large`}>
                        <div className="Customers-modal-header">
                            <h2 className="Customers-modal-title">
                                {modalMode === 'create' && 'Add Customer'}
                                {modalMode === 'edit' && 'Edit Customer'}
                                {modalMode === 'view' && 'Customer Details'}
                            </h2>
                            <button className="Customers-close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="Customers-modal-body">
                            {/* Basic Information */}
                            <div className="Customers-form-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                                <h3 className="Customers-section-subtitle">Basic Information</h3>
                                <div className="Customers-form-row Customers-mixed-col">
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Name (English) <span className="Customers-text-red">*</span></label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Name"
                                        />
                                    </div>
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Name (Arabic)</label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="nameArabic"
                                            value={formData.nameArabic}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Name (Arabic)"
                                        />
                                    </div>
                                </div>

                                <div className="Customers-form-row Customers-mixed-col">
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Company Name</label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                    <div className="Customers-form-group Customers-google-loc">
                                        <label className="Customers-form-label">Company Google Location</label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="companyLocation"
                                            value={formData.companyLocation}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Google Maps link"
                                        />
                                    </div>
                                </div>

                                {/* File Uploads */}
                                <div className="Customers-form-row Customers-mixed-col">
                                    <div className="Customers-form-group Customers-profile-img">
                                        <label className="Customers-form-label">Profile Image</label>
                                        <div className="Customers-file-input-wrapper">
                                            <div className="Customers-file-label">
                                                <span className="Customers-file-btn">Choose File</span>
                                                <span className="Customers-file-name">
                                                    {formData.profileImage?.name || (typeof formData.profileImage === 'string' ? 'Existing Image' : 'No file chosen')}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                name="profileImage"
                                                className="Customers-file-input"
                                                onChange={handleFileChange}
                                                disabled={modalMode === 'view'}
                                                accept="image/*"
                                            />
                                        </div>
                                        <span className="Customers-file-note">JPEG, PNG or JPG (max 5MB)</span>
                                        {formData.profileImage && (
                                            <div className="mt-2">
                                                <img
                                                    src={typeof formData.profileImage === 'string' ? formData.profileImage : URL.createObjectURL(formData.profileImage)}
                                                    alt="Preview"
                                                    className="w-20 h-20 object-cover rounded-md border"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="Customers-form-group Customers-any-file">
                                        <label className="Customers-form-label">Any File</label>
                                        <div className="Customers-file-input-wrapper">
                                            <div className="Customers-file-label">
                                                <span className="Customers-file-btn">Choose File</span>
                                                <span className="Customers-file-name">
                                                    {formData.anyFile?.name || (typeof formData.anyFile === 'string' ? 'Existing File' : 'No file chosen')}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                name="anyFile"
                                                className="Customers-file-input"
                                                onChange={handleFileChange}
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>
                                        <span className="Customers-file-note">Any file type. Max 5MB</span>
                                        {typeof formData.anyFile === 'string' && formData.anyFile && (
                                            <div className="mt-2 text-sm text-blue-600">
                                                <a href={formData.anyFile} target="_blank" rel="noopener noreferrer">View Attachment</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="Customers-form-section">
                                <h3 className="Customers-section-subtitle">Account Information</h3>
                                <div className="Customers-form-row Customers-mixed-col">
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Account Type <span className="Customers-text-red">*</span></label>
                                        <select
                                            className="Customers-form-select"
                                            name="accountType"
                                            value={formData.accountType}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        >
                                            {/* <option value="">-- Select Account --</option> */}
                                            {accountTypes
                                                .flatMap(group => group.accounts)
                                                .filter(acc => acc.accountTypeName === 'Accounts Receivable')
                                                .map((acc, j) => (
                                                    <option key={j} value={acc.accountTypeId}>{acc.accountTypeName}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Balance Type</label>
                                        <select
                                            className="Customers-form-select"
                                            name="balanceType"
                                            value={formData.balanceType}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        >
                                            <option value="Debit">Debit</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="Customers-form-row Customers-mixed-col">
                                    <div className="Customers-form-group Customers-half-width">
                                        <div className="Customers-input-with-note">
                                            <label className="Customers-form-label">Account Name <span className="Customers-text-red">*</span></label>
                                            <input
                                                type="text"
                                                className="Customers-form-input"
                                                value={formData.companyName || formData.name}
                                                readOnly
                                                disabled
                                                style={{ backgroundColor: '#f3f4f6' }}
                                            />
                                            <span className="Customers-input-note">This will auto-fill from selection above</span>
                                        </div>
                                    </div>
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Account Balance <span className="Customers-text-red">*</span></label>
                                        <input
                                            type="number"
                                            className="Customers-form-input"
                                            name="accountBalance"
                                            value={formData.accountBalance}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Creation Date <span className="Customers-text-red">*</span></label>
                                        <input
                                            type="date"
                                            className="Customers-form-input"
                                            name="creationDate"
                                            value={formData.creationDate}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="Customers-form-section">
                                <h3 className="Customers-section-subtitle">Bank Details</h3>
                                <div className="Customers-form-row Customers-three-col">
                                    <div className="Customers-form-group">
                                        <label className="Customers-form-label">Bank Account Number</label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="bankAccountNumber"
                                            value={formData.bankAccountNumber}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter bank account number"
                                        />
                                    </div>
                                    <div className="Customers-form-group">
                                        <label className="Customers-form-label">Bank IFSC</label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="bankIFSC"
                                            value={formData.bankIFSC}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter bank IFSC"
                                        />
                                    </div>
                                    <div className="Customers-form-group">
                                        <label className="Customers-form-label">Bank Name & Branch</label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
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
                            <div className="Customers-form-section">
                                <h3 className="Customers-section-subtitle">Contact & Status</h3>
                                <div className="Customers-form-row Customers-mixed-col">
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Phone <span className="Customers-text-red">*</span></label>
                                        <input
                                            type="text"
                                            className="Customers-form-input"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Phone"
                                        />
                                    </div>
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Email <span className="Customers-text-red">*</span></label>
                                        <input
                                            type="email"
                                            className="Customers-form-input"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter Email"
                                        />
                                    </div>
                                    <div className="Customers-form-group Customers-half-width">
                                        <label className="Customers-form-label">Credit Period (days)</label>
                                        <input
                                            type="number"
                                            className="Customers-form-input"
                                            name="creditPeriod"
                                            value={formData.creditPeriod}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Enter credit period"
                                        />
                                    </div>
                                </div>

                                <div className="Customers-form-row" style={{ alignItems: 'center' }}>
                                    <label className="Customers-switch" style={{ marginRight: '10px' }}>
                                        <input
                                            type="checkbox"
                                            name="gstEnabled"
                                            checked={formData.gstEnabled}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                        />
                                        <span className="Customers-slider Customers-round"></span>
                                    </label>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Enable GST</span>

                                    {formData.gstEnabled && (
                                        <div className="Customers-form-group" style={{ marginLeft: '2rem', flex: 1 }}>
                                            <input
                                                type="text"
                                                className="Customers-form-input"
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
                            <div className="Customers-form-section">
                                <div className="Customers-form-row">
                                    {/* Billing Address */}
                                    <div style={{ flex: 1 }}>
                                        <h3 className="Customers-section-subtitle">Billing Address</h3>
                                        <div className="Customers-form-group">
                                            <label className="Customers-form-label">Name</label>
                                            <input
                                                type="text"
                                                className="Customers-form-input"
                                                name="billingName"
                                                value={formData.billingName}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter Name"
                                            />
                                        </div>
                                        <div className="Customers-form-group">
                                            <label className="Customers-form-label">Phone</label>
                                            <input
                                                type="text"
                                                className="Customers-form-input"
                                                name="billingPhone"
                                                value={formData.billingPhone}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter Phone"
                                            />
                                        </div>
                                        <div className="Customers-form-group">
                                            <label className="Customers-form-label">Address</label>
                                            <textarea
                                                className="Customers-form-textarea"
                                                name="billingAddress"
                                                value={formData.billingAddress}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Enter Address"
                                                rows="3"
                                            />
                                        </div>
                                        <div className="Customers-form-row">
                                            <div className="Customers-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Customers-form-input"
                                                    name="billingCity"
                                                    value={formData.billingCity}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div className="Customers-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Customers-form-input"
                                                    name="billingState"
                                                    value={formData.billingState}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="State"
                                                />
                                            </div>
                                        </div>
                                        <div className="Customers-form-row">
                                            <div className="Customers-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Customers-form-input"
                                                    name="billingCountry"
                                                    value={formData.billingCountry}
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    placeholder="Country"
                                                />
                                            </div>
                                            <div className="Customers-form-group" style={{ flex: 1 }}>
                                                <input
                                                    type="text"
                                                    className="Customers-form-input"
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
                                            <h3 className="Customers-section-subtitle">Shipping Address</h3>
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
                                                <div className="Customers-form-group">
                                                    <label className="Customers-form-label">Name</label>
                                                    <input
                                                        type="text"
                                                        className="Customers-form-input"
                                                        name="shippingName"
                                                        value={formData.shippingName}
                                                        onChange={handleInputChange}
                                                        disabled={modalMode === 'view'}
                                                        placeholder="Enter Name"
                                                    />
                                                </div>
                                                <div className="Customers-form-group">
                                                    <label className="Customers-form-label">Phone</label>
                                                    <input
                                                        type="text"
                                                        className="Customers-form-input"
                                                        name="shippingPhone"
                                                        value={formData.shippingPhone}
                                                        onChange={handleInputChange}
                                                        disabled={modalMode === 'view'}
                                                        placeholder="Enter Phone"
                                                    />
                                                </div>
                                                <div className="Customers-form-group">
                                                    <label className="Customers-form-label">Address</label>
                                                    <textarea
                                                        className="Customers-form-textarea"
                                                        name="shippingAddress"
                                                        value={formData.shippingAddress}
                                                        onChange={handleInputChange}
                                                        disabled={modalMode === 'view'}
                                                        placeholder="Enter Address"
                                                        rows="3"
                                                    />
                                                </div>
                                                <div className="Customers-form-row">
                                                    <div className="Customers-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Customers-form-input"
                                                            name="shippingCity"
                                                            value={formData.shippingCity}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="City"
                                                        />
                                                    </div>
                                                    <div className="Customers-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Customers-form-input"
                                                            name="shippingState"
                                                            value={formData.shippingState}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="State"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="Customers-form-row">
                                                    <div className="Customers-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Customers-form-input"
                                                            name="shippingCountry"
                                                            value={formData.shippingCountry}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            placeholder="Country"
                                                        />
                                                    </div>
                                                    <div className="Customers-form-group" style={{ flex: 1 }}>
                                                        <input
                                                            type="text"
                                                            className="Customers-form-input"
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

                        <div className="Customers-modal-footer">
                            <button className="Customers-btn-cancel" onClick={() => setShowModal(false)}>
                                {modalMode === 'view' ? 'Close' : 'Cancel'}
                            </button>
                            {modalMode !== 'view' && (
                                <button className="Customers-btn-save" onClick={handleSubmit}>
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

export default Customers;
