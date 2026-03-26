import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import roleService from '../../../services/roleService';
import GetCompanyId from '../../../api/GetCompanyId';
import { toast } from 'react-hot-toast';
import './RoleList.css';

const RoleList = () => {
    const [roles, setRoles] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] });
    const [isLoading, setIsLoading] = useState(false);

    // Permission Modules Definition
    const modules = [
        { name: 'Dashboard', permissions: ['Show'] },
        { name: 'User', permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'Role', permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'Accounts', subModules: ['Charts of Accounts', 'Customers', 'Vendors'], permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'Inventory', subModules: ['Warehouse', 'Products', 'Services'], permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'Sales', subModules: ['Invoice', 'Quotation', 'Order'], permissions: ['Manage', 'Create', 'Edit', 'Delete', 'Show', 'Send'] },
        { name: 'Purchases', subModules: ['Bill', 'Order', 'Return'], permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'POS', permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'Voucher', permissions: ['Manage', 'Create', 'Edit', 'Delete'] },
        { name: 'Reports', permissions: ['Manage', 'View'] },
        { name: 'Settings', permissions: ['Manage', 'Edit', 'View'] }
    ];

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const companyId = GetCompanyId();
            const response = await roleService.getRoles(companyId);
            if (response.success) {
                setRoles(response.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load roles");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setFormData({ name: '', permissions: [] });
        setShowAddModal(true);
    };

    const handleOpenEdit = (role) => {
        setSelectedRole(role);
        setFormData({ name: role.name, permissions: role.permissions || [] });
        setShowEditModal(true);
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setSelectedRole(null);
        setFormData({ name: '', permissions: [] });
    };

    // Helper to generate permission key
    const getPermKey = (modName, action) => `${action.toLowerCase()} ${modName.toLowerCase()}`;

    const togglePermission = (modName, action) => {
        const key = getPermKey(modName, action);
        setFormData(prev => {
            const exists = prev.permissions.includes(key);
            if (exists) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== key) };
            } else {
                return { ...prev, permissions: [...prev.permissions, key] };
            }
        });
    };

    const toggleModulePermissions = (modName, modPerms) => {
        // Check if all are currently selected
        const allKeys = modPerms.map(p => getPermKey(modName, p));
        const allSelected = allKeys.every(k => formData.permissions.includes(k));

        setFormData(prev => {
            let newPerms = [...prev.permissions];
            if (allSelected) {
                // Remove all
                newPerms = newPerms.filter(p => !allKeys.includes(p));
            } else {
                // Add missing
                allKeys.forEach(k => {
                    if (!newPerms.includes(k)) newPerms.push(k);
                });
            }
            return { ...prev, permissions: newPerms };
        });
    };

    const handleSubmit = async (isEdit) => {
        if (!formData.name.trim()) {
            toast.error("Role Name is required");
            return;
        }

        try {
            if (isEdit) {
                const response = await roleService.updateRole(selectedRole.id, formData);
                if (response.success) {
                    toast.success("Role updated successfully");
                    fetchRoles();
                    handleCloseModal();
                }
            } else {
                const response = await roleService.createRole(formData);
                if (response.success) {
                    toast.success("Role created successfully");
                    fetchRoles();
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async () => {
        try {
            const response = await roleService.deleteRole(selectedRole.id);
            if (response.success) {
                toast.success("Role deleted successfully");
                fetchRoles();
                handleCloseModal();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete role");
        }
    };

    const filteredRoles = roles.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="role-list-page">
            <div className="page-header">
                <h1 className="page-title">Role & Permission</h1>
                <button className="btn-add" onClick={handleOpenAdd}>
                    <Plus size={18} className="mr-2" /> Create Role
                </button>
            </div>

            <div className="table-card">
                <div className="table-controls">
                    <div className="entries-control">
                        <select
                            value={entriesPerPage}
                            onChange={(e) => setEntriesPerPage(e.target.value)}
                            className="entries-select"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="entries-text">entries per page</span>
                    </div>
                    <div className="search-control">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="role-table">
                        <thead>
                            <tr>
                                <th>ROLE</th>
                                <th>PERMISSIONS</th>
                                <th className="text-right">ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colspan="3" className="text-center p-4">Loading...</td></tr>
                            ) : filteredRoles.length === 0 ? (
                                <tr><td colspan="3" className="text-center p-4">No roles found</td></tr>
                            ) : filteredRoles.map((role) => (
                                <tr key={role.id}>
                                    <td className="role-name-cell">{role.name}</td>
                                    <td>
                                        <div className="permissions-badge-grid">
                                            {(role.permissions || []).slice(0, 8).map((perm, index) => (
                                                <span key={index} className="perm-badge">{perm}</span>
                                            ))}
                                            {(role.permissions || []).length > 8 && (
                                                <span className="perm-badge more">+{role.permissions.length - 8} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="role-action-buttons">
                                            <button className="role-btn-edit" onClick={() => handleOpenEdit(role)}>
                                                <Pencil size={16} />
                                            </button>
                                            <button className="role-btn-delete" onClick={() => { setSelectedRole(role); setShowDeleteModal(true); }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="modal-overlay">
                    <div className="modal-content role-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{showEditModal ? 'Edit Role' : 'Create Role'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body p-0">
                            <div className="role-form-container">
                                <div className="form-group mb-6">
                                    <label className="form-label">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter Role Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="permissions-section">
                                    <h3 className="section-title">Assign Permission to Roles</h3>
                                    <div className="permissions-table-container">
                                        <table className="permissions-entry-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}>
                                                        <input type="checkbox" className="custom-checkbox" />
                                                    </th>
                                                    <th style={{ width: '200px' }}>MODULE</th>
                                                    <th>PERMISSIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modules.map((mod, idx) => {
                                                    const allKeys = mod.permissions.map(p => getPermKey(mod.name, p));
                                                    const allChecked = allKeys.every(k => formData.permissions.includes(k));

                                                    return (
                                                        <tr key={idx}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    className="custom-checkbox"
                                                                    checked={allChecked}
                                                                    onChange={() => toggleModulePermissions(mod.name, mod.permissions)}
                                                                />
                                                            </td>
                                                            <td className="module-name-cell">
                                                                {mod.name}
                                                                {mod.subModules && <span className="text-xs text-gray-400 block font-normal">{mod.subModules.join(', ')}</span>}
                                                            </td>
                                                            <td>
                                                                <div className="permission-checkbox-group">
                                                                    {mod.permissions.map((perm, pIdx) => {
                                                                        const key = getPermKey(mod.name, perm);
                                                                        return (
                                                                            <label key={pIdx} className="perm-checkbox-item">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="custom-checkbox"
                                                                                    checked={formData.permissions.includes(key)}
                                                                                    onChange={() => togglePermission(mod.name, perm)}
                                                                                />
                                                                                <span>{perm}</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                            <button className="btn-submit" style={{ backgroundColor: '#8ce043' }} onClick={() => handleSubmit(showEditModal)}>
                                {showEditModal ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Role</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body text-center py-8">
                            <div className="delete-icon-circle mx-auto mb-4">
                                <Trash2 size={32} color="#f43f5e" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Are you sure?</h3>
                            <p className="text-gray-500 mt-2">
                                You are about to delete the role <strong>{selectedRole?.name}</strong>.
                                This will affect all users assigned to this role.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                            <button className="btn-submit" style={{ backgroundColor: '#f43f5e' }} onClick={handleDelete}>Delete Role</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleList;
