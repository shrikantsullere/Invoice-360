import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import uomService from '../../../../services/uomService';
import GetCompanyId from '../../../../api/GetCompanyId';
import './UOM.css';

const UOM = () => {
    const [uoms, setUoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUom, setEditingUom] = useState(null);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Form State
    const [formData, setFormData] = useState({
        category: '',
        unitName: '',
        weightPerUnit: ''
    });

    const measurementCategories = ['Weight', 'Area', 'Volume', 'Length', 'Count'];

    const unitsByCategory = {
        'Weight': ['KG', 'Gram', 'Milligram', 'Pound', 'Ounce'],
        'Area': ['Square Meter', 'Square Foot', 'Acre', 'Hectare'],
        'Volume': ['Litre', 'Millilitre', 'Cubic Meter', 'Gallon'],
        'Length': ['Meter', 'Centimeter', 'Millimeter', 'Inch', 'Foot'],
        'Count': ['Piece', 'Dozen', 'Box', 'Packet']
    };

    useEffect(() => {
        fetchUOMs();
    }, []);

    const fetchUOMs = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const res = await uomService.getUOMs(companyId);
            if (res.success) {
                setUoms(res.data);
            }
        } catch (error) {
            console.error('Error fetching UOMs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Reset unit if category changes
            ...(name === 'category' ? { unitName: '' } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const companyId = GetCompanyId();
            let res;
            if (editingUom) {
                res = await uomService.updateUOM(editingUom.id, formData, companyId);
            } else {
                res = await uomService.createUOM({ ...formData, companyId: parseInt(companyId) });
            }

            if (res.success) {
                fetchUOMs();
                closeModal();
            }
        } catch (error) {
            console.error('Error saving UOM:', error);
            alert(error.response?.data?.message || 'Failed to save UOM');
        }
    };

    const handleEdit = (uom) => {
        setEditingUom(uom);
        setFormData({
            category: uom.category,
            unitName: uom.unitName,
            weightPerUnit: uom.weightPerUnit || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            try {
                const companyId = GetCompanyId();
                const res = await uomService.deleteUOM(id, companyId);
                if (res.success) {
                    fetchUOMs();
                }
            } catch (error) {
                console.error('Error deleting UOM:', error);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUom(null);
        setFormData({
            category: '',
            unitName: '',
            weightPerUnit: ''
        });
    };

    const filteredUoms = uoms.filter(uom =>
        uom.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uom.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredUoms.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredUoms.length / entriesPerPage);

    return (
        <div className="uom-page">
            <div className="uom-header">
                <h1>Unit of Measure</h1>
                <button className="add-uom-btn" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Add Unit
                </button>
            </div>

            <div className="uom-container">
                <div className="table-controls">
                    <div className="entries-select">
                        <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span>entries per page</span>
                    </div>
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="uom-table-wrapper">
                    <table className="uom-table">
                        <thead>
                            <tr>
                                <th>S.NO</th>
                                <th>UNIT NAME</th>
                                <th>CATEGORY</th>
                                <th>WEIGHT PER UNIT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="text-center">Loading...</td></tr>
                            ) : currentEntries.length > 0 ? (
                                currentEntries.map((uom, index) => (
                                    <tr key={uom.id}>
                                        <td>{indexOfFirstEntry + index + 1}</td>
                                        <td>{uom.unitName}</td>
                                        <td>
                                            <span className={`category-badge ${uom.category.toLowerCase()}`}>
                                                {uom.category.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>{uom.weightPerUnit || '-'}</td>
                                        <td className="actions-cell">
                                            <button className="edit-btn" onClick={() => handleEdit(uom)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(uom.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center">No units found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <div className="footer-info">
                        Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredUoms.length)} of {filteredUoms.length} entries
                    </div>
                    <div className="pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="page-btn"
                        >
                            Previous
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="page-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="uom-modal">
                        <div className="modal-header">
                            <h2>Unit Details</h2>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Measurement Category*</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {measurementCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit of Measurement (UOM)*</label>
                                    <select
                                        name="unitName"
                                        value={formData.unitName}
                                        onChange={handleInputChange}
                                        required
                                        disabled={!formData.category}
                                    >
                                        <option value="">Select Unit</option>
                                        {formData.category && unitsByCategory[formData.category].map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Weight per Unit*</label>
                                    <input
                                        type="text"
                                        name="weightPerUnit"
                                        placeholder="e.g. 0.5 KG"
                                        value={formData.weightPerUnit}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="footer-close-btn" onClick={closeModal}>Close</button>
                                <button type="submit" className="save-btn">{editingUom ? 'Update' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UOM;