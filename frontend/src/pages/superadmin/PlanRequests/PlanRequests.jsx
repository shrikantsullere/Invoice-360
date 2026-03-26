import React, { useState, useEffect } from 'react';
import {
    Clock, Search, Pencil, Trash2, X,
    CheckCircle2, XCircle, AlertCircle, Building2,
    Mail, Calendar, Filter, Key
} from 'lucide-react';
import toast from 'react-hot-toast';
import planRequestService from '../../../services/planRequestService';
import planService from '../../../services/planService';
import './PlanRequests.css';

const PlanRequests = () => {
    const [requests, setRequests] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [requestToDelete, setRequestToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        email: '',
        planId: '',
        billingCycle: 'Monthly',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [requestsData, plansData] = await Promise.all([
                planRequestService.getPlanRequests(),
                planService.getPlans()
            ]);
            setRequests(requestsData);
            setPlans(plansData);
        } catch (error) {
            toast.error('Failed to fetch data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedPlan = plans.find(p => p.id === parseInt(formData.planId));
            const dataToSubmit = {
                ...formData,
                planName: selectedPlan ? selectedPlan.name : ''
            };

            if (editingRequest) {
                await planRequestService.updatePlanRequest(editingRequest.id, dataToSubmit);
                toast.success('Request updated successfully');
            } else {
                await planRequestService.createPlanRequest(dataToSubmit);
                toast.success('Request created successfully');
            }
            fetchData();
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await planRequestService.deletePlanRequest(requestToDelete.id);
            toast.success('Request deleted successfully');
            fetchData();
            setShowDeleteModal(false);
        } catch (error) {
            toast.error('Failed to delete request');
        }
    };

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [requestToApprove, setRequestToApprove] = useState(null);
    const [approvePassword, setApprovePassword] = useState('123456');

    const handleApprove = async () => {
        try {
            await planRequestService.approvePlanRequest(requestToApprove.id, { password: approvePassword });
            toast.success('Request Accepted and Company Created');
            fetchData();
            setShowApproveModal(false);
            setRequestToApprove(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to approve request');
        }
    };

    const handleReject = async (id) => {
        try {
            await planRequestService.rejectPlanRequest(id);
            toast.success('Request Rejected');
            fetchData();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const openModal = (request = null) => {
        if (request) {
            setEditingRequest(request);
            setFormData({
                companyName: request.companyName,
                email: request.email,
                planId: request.planId || '',
                billingCycle: request.billingCycle,
                startDate: request.startDate ? request.startDate.split('T')[0] : '',
                status: request.status
            });
        } else {
            setEditingRequest(null);
            setFormData({
                companyName: '',
                email: '',
                planId: '',
                billingCycle: 'Monthly',
                startDate: new Date().toISOString().split('T')[0],
                status: 'Pending'
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingRequest(null);
    };

    const getStatusBadgeClass = (status) => {
        const s = status?.toString().toLowerCase();
        if (s === 'accepted' || s === 'approved') return 'badge-success';
        if (s === 'rejected') return 'badge-danger';
        if (s === 'pending') return 'badge-warning';
        return 'badge-secondary';
    };

    const getStatusLabel = (status) => {
        if (!status) return 'Pending';
        const s = status.toString().toLowerCase();
        // User wants to show "Accepted" and "Rejected"
        if (s === 'approved' || s === 'accepted') return 'Accepted';
        if (s === 'rejected') return 'Rejected';
        if (s === 'pending') return 'Pending';
        return status;
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch = req.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === '' || req.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="plan-requests-page">
            <div className="page-header">
                <div className="page-title">
                    <Clock size={24} className="text-orange-500" />
                    <span>Requested Plans</span>
                </div>
                <button className="add-btn" onClick={() => openModal()}>
                    Complete Your Purchase
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by company or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group flex items-center gap-2">
                    <select
                        className="form-control"
                        style={{ width: '200px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                    </select>
                </div>
            </div>

            <div className="table-container">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Billing</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-10">Loading requests...</td></tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-10">No requests found.</td></tr>
                        ) : (
                            filteredRequests.map(request => (
                                <tr key={request.id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="company-icon-sm">
                                                <Building2 size={16} />
                                            </div>
                                            <span className="font-semibold">{request.companyName}</span>
                                        </div>
                                    </td>
                                    <td>{request.email}</td>
                                    <td>
                                        <span className="plan-name-tag">
                                            {request.plan?.name || request.planName || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{request.billingCycle}</td>
                                    <td>{new Date(request.startDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                                            {getStatusLabel(request.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns-wrapper">
                                            {request.status?.toLowerCase() === 'pending' ? (
                                                <>
                                                    <button
                                                        className="btn-action-sm btn-approve-sm"
                                                        onClick={() => { setRequestToApprove(request); setShowApproveModal(true); }}
                                                        title="Accept"
                                                    >
                                                        <CheckCircle2 size={14} /> Accept
                                                    </button>
                                                    <button
                                                        className="btn-action-sm btn-reject-sm"
                                                        onClick={() => handleReject(request.id)}
                                                        title="Reject"
                                                    >
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic"></span>
                                            )}
                                            <div className="flex gap-1 ml-2 border-l pl-2">
                                                <button
                                                    className="btn-action-sm btn-edit-sm"
                                                    onClick={() => openModal(request)}
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    className="btn-action-sm  btn-delete-sm"
                                                    onClick={() => { setRequestToDelete(request); setShowDeleteModal(true); }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Post/Put Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-md">
                        <div className="modal-header">
                            <h2>{editingRequest ? 'Update Purchase Request' : 'Complete Your Purchase'}</h2>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="space-y-4">
                                    <div className="form-group mb-4">
                                        <label className="required block mb-1 font-semibold text-slate-700">Selected Plan</label>
                                        <select
                                            name="planId"
                                            className="form-control w-full"
                                            value={formData.planId}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select a Plan</option>
                                            {plans.map(plan => (
                                                <option key={plan.id} value={plan.id}>{plan.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="required block mb-1 font-semibold text-slate-700">Company Name</label>
                                        <div className="input-with-icon">
                                            <Building2 size={16} className="input-icon" />
                                            <input
                                                type="text"
                                                name="companyName"
                                                className="form-control"
                                                placeholder="Enter Company Name"
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="required block mb-1 font-semibold text-slate-700">Email Address</label>
                                        <div className="input-with-icon">
                                            <Mail size={16} className="input-icon" />
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                placeholder="Enter Email Address"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="required block mb-1 font-semibold text-slate-700">Billing Duration</label>
                                        <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                                                <input
                                                    type="radio"
                                                    name="billingCycle"
                                                    value="Monthly"
                                                    checked={formData.billingCycle === 'Monthly'}
                                                    onChange={handleInputChange}
                                                />
                                                <span>Monthly</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                                                <input
                                                    type="radio"
                                                    name="billingCycle"
                                                    value="Yearly"
                                                    checked={formData.billingCycle === 'Yearly'}
                                                    onChange={handleInputChange}
                                                />
                                                <span>Yearly</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="required block mb-1 font-semibold text-slate-700">Start Date</label>
                                        <div className="input-with-icon">
                                            <Calendar size={16} className="input-icon" />
                                            <input
                                                type="date"
                                                name="startDate"
                                                className="form-control"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    {editingRequest && (
                                        <div className="form-group mb-4">
                                            <label className="block mb-1 font-semibold text-slate-700">Status</label>
                                            <select
                                                name="status"
                                                className="form-control w-full"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Accepted">Accepted</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-save">
                                    {editingRequest ? 'Update Request' : 'Submit Purchase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-sm">
                        <div className="delete-modal-body">
                            <div className="delete-icon-wrapper">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="delete-modal-title">Delete Request?</h3>
                            <p className="delete-modal-text">
                                Are you sure you want to delete this purchase request?
                                <br />This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-5 mt-4">
                                <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button className="btn-delete" onClick={handleDelete}>Delete Anyway</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Approve Confirmation Modal */}
            {showApproveModal && requestToApprove && (
                <div className="modal-overlay">
                    <div className="modal-content modal-sm">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CheckCircle2 size={24} className="text-green-500" /> Accept Request
                            </h2>
                            <button className="close-btn" onClick={() => setShowApproveModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body p-6">
                            <div className="p-4 bg-green-50 rounded-xl mb-4 border border-green-100">
                                <p className="text-sm text-green-800">
                                    Accepting this request for <strong>{requestToApprove.companyName}</strong> will automatically:
                                </p>
                                <ul className="text-xs text-green-700 mt-2 list-disc ml-4 space-y-1">
                                    <li>Create a new Company record</li>
                                    <li>Create a Company Admin user</li>
                                    <li>Initialize Chart of Accounts, Warehouses & UOMs</li>
                                    <li>Link the <strong>{requestToApprove.planName || requestToApprove.plan?.name}</strong> plan</li>
                                </ul>
                            </div>

                            <div className="form-group">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Set Initial Password</label>
                                <div className="input-with-icon relative">
                                    <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        className="form-control w-full pl-10"
                                        value={approvePassword}
                                        onChange={(e) => setApprovePassword(e.target.value)}
                                        placeholder="Set initial password"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1 italic">Default is '123456'. Share this with the company admin.</p>
                            </div>
                        </div>
                        <div className="modal-footer p-4 border-t flex justify-end gap-3">
                            <button className="btn-cancel px-4 py-2 rounded-lg" onClick={() => setShowApproveModal(false)}>Cancel</button>
                            <button className="btn-save px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2" onClick={handleApprove}>
                                <CheckCircle2 size={18} /> Confirm & Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanRequests;