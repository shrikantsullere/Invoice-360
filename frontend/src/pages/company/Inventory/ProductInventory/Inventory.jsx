import React, { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, X, Upload, Loader2, Eye } from 'lucide-react';
import './Inventory.css';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';
import inventoryService from '../../../../services/inventoryService';
import uomService from '../../../../services/uomService';
import { toast } from 'react-hot-toast';
import { uploadToCloudinary } from '../../../../utils/cloudinaryUpload';
import { useNavigate } from 'react-router-dom';
import GetCompanyId from '../../../../api/GetCompanyId';

const Inventory = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [uoms, setUoms] = useState([]);

    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        hsn: '',
        barcode: '',
        categoryId: '',
        uomId: '',
        unit: '',
        description: '',
        asOfDate: new Date().toISOString().split('T')[0],
        taxAccount: '',
        initialCost: 0,
        salePrice: 0,
        purchasePrice: 0,
        discount: 0,
        remarks: '',
        image: null // File or null
    });

    const [warehouseRows, setWarehouseRows] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            const [prodRes, catRes, whRes, uomRes] = await Promise.all([
                productService.getProducts(companyId),
                categoryService.getCategories(companyId),
                inventoryService.getWarehouses(companyId),
                uomService.getUOMs(companyId)
            ]);

            if (prodRes.success) setProducts(prodRes.data);
            if (catRes.success) setCategories(catRes.data);
            if (whRes.success) setWarehouses(whRes.data);
            if (uomRes.success) setUoms(uomRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    const addWarehouseRow = () => {
        const firstWhId = warehouses.length > 0 ? warehouses[0].id : '';
        setWarehouseRows([...warehouseRows, {
            id: Date.now(),
            warehouseId: firstWhId,
            quantity: 0,
            minOrderQty: 0,
            initialQty: 0
        }]);
    };

    const removeWarehouseRow = (id) => {
        setWarehouseRows(warehouseRows.filter(row => row.id !== id));
    };

    const handleWhRowChange = (id, field, value) => {
        setWarehouseRows(warehouseRows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            try {
                setUploadingImage(true);
                toast.loading('Uploading image...', { id: 'image-upload' });
                const imageUrl = await uploadToCloudinary(file);
                setFormData(prev => ({ ...prev, image: imageUrl }));
                toast.success('Image uploaded successfully', { id: 'image-upload' });
            } catch (error) {
                console.error('Error uploading image:', error);
                toast.error('Failed to upload image', { id: 'image-upload' });
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', sku: '', hsn: '', barcode: '', categoryId: '',
            uomId: '', unit: '', description: '', asOfDate: new Date().toISOString().split('T')[0],
            taxAccount: '', initialCost: 0, salePrice: 0, purchasePrice: 0,
            discount: 0, remarks: '', image: null
        });
        setWarehouseRows([]);
    };

    // Build payload - now sending JSON as we have image URL
    const buildPayload = () => {
        const companyId = GetCompanyId();
        return {
            ...formData,
            companyId,
            warehouseInfo: warehouseRows
        };
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();

        if (uploadingImage) {
            toast.error('Please wait for image upload to complete');
            return;
        }

        try {
            const payload = buildPayload();
            // Assuming productService handles JSON correctly (axios default)
            const res = await productService.createProduct(payload);
            if (res.success) {
                toast.success('Product added successfully');
                setShowAddModal(false);
                resetForm();
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add product');
        }
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();

        if (uploadingImage) {
            toast.error('Please wait for image upload to complete');
            return;
        }

        try {
            const payload = buildPayload();
            const res = await productService.updateProduct(selectedProduct.id, payload);
            if (res.success) {
                toast.success('Product updated successfully');
                setShowEditModal(false);
                resetForm();
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update product');
        }
    };

    const handleDeleteProduct = async () => {
        try {
            const companyId = GetCompanyId();
            const res = await productService.deleteProduct(selectedProduct.id, companyId);
            if (res.success) {
                toast.success('Product deleted successfully');
                setShowDeleteModal(false);
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku || '',
            hsn: product.hsn || '',
            barcode: product.barcode || '',
            categoryId: product.categoryId || '',
            uomId: product.uomId || '',
            unit: product.unit || '',
            description: product.description || '',
            asOfDate: product.asOfDate ? product.asOfDate.split('T')[0] : new Date().toISOString().split('T')[0],
            taxAccount: product.taxAccount || '',
            initialCost: product.initialCost || 0,
            salePrice: product.salePrice || 0,
            purchasePrice: product.purchasePrice || 0,
            discount: product.discount || 0,
            remarks: product.remarks || '',
            image: product.image || null // This is a URL string for existing products
        });
        setWarehouseRows(product.stock.map(s => ({
            id: s.id,
            warehouseId: s.warehouseId,
            quantity: s.quantity,
            minOrderQty: s.minOrderQty,
            initialQty: s.initialQty
        })));
        setShowEditModal(true);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return toast.error('Category name is required');
        try {
            const companyId = GetCompanyId();
            const res = await categoryService.createCategory({ name: newCategoryName, companyId });
            if (res.success) {
                toast.success('Category added');
                setShowCategoryModal(false);
                setNewCategoryName('');
                const catRes = await categoryService.getCategories(companyId);
                if (catRes.success) setCategories(catRes.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add category');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="inventory-page">
            <div className="page-header">
                <h1 className="page-title">Product Inventory</h1>
                <button className="btn-add" onClick={() => { resetForm(); setShowAddModal(true); }}>
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            <div className="inventory-card">
                <div className="controls-row">
                    <div className="entries-control">
                        <select
                            value={entriesPerPage}
                            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th>SKU</th>
                                <th>SALE PRICE</th>
                                <th>PURCHASE PRICE</th>
                                <th>CATEGORY</th>
                                <th>UNIT</th>
                                <th>QUANTITY</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8">
                                        <div className="flex justify-center items-center gap-2 text-slate-500">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Loading products...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => (
                                    <tr key={p.id}>
                                        <td className="font-semibold">{p.name}</td>
                                        <td>{p.sku || '-'}</td>
                                        <td>${(p.salePrice || 0).toLocaleString()}</td>
                                        <td>${(p.purchasePrice || 0).toLocaleString()}</td>
                                        <td>{p.category?.name || 'Uncategorized'}</td>
                                        <td>{p.uom?.unitName || p.unit || '-'}</td>
                                        <td>{p.totalQuantity}</td>
                                        <td>
                                            <div className="product-action-buttons">
                                                <button className="action-btn btn-view" onClick={() => navigate(`/company/inventory/products/${p.id}`)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn btn-edit" data-tooltip="Edit" onClick={() => openEditModal(p)}>
                                                    <Pencil size={16} />
                                                </button>
                                                <button className="action-btn btn-delete" data-tooltip="Delete" onClick={() => { setSelectedProduct(p); setShowDeleteModal(true); }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-slate-400">No products found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-row">
                    <p className="pagination-info">Showing 1 to {filteredProducts.length} of {filteredProducts.length} entries</p>
                    <div className="pagination-controls">
                        <button className="pagination-btn disabled">Previous</button>
                        <button className="pagination-btn active">1</button>
                        <button className="pagination-btn disabled">Next</button>
                    </div>
                </div>
            </div>

            {/* Add / Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="modal-overlay">
                    <div className="modal-content inventory-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{showAddModal ? 'Add Product' : 'Edit Product'}</h2>
                            <button className="close-btn" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={showAddModal ? handleAddProduct : handleEditProduct}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Item Name <span className="text-red">*</span></label>
                                        <input
                                            name="name" type="text" className="form-input"
                                            placeholder="Enter item name" required
                                            value={formData.name} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">HSN</label>
                                        <input
                                            name="hsn" type="text" className="form-input"
                                            placeholder="Enter HSN code"
                                            value={formData.hsn} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Barcode</label>
                                        <input
                                            name="barcode" type="text" className="form-input"
                                            placeholder="Enter barcode"
                                            value={formData.barcode} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Item Image</label>
                                        <div className="file-input-wrapper">
                                            <label className="file-label" style={{ opacity: uploadingImage ? 0.6 : 1, cursor: uploadingImage ? 'not-allowed' : 'pointer' }}>
                                                {uploadingImage ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block', marginRight: '6px' }} />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={16} style={{ display: 'inline-block', marginRight: '6px' }} />
                                                        <span>Choose File</span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    className="hidden-file-input"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                    disabled={uploadingImage}
                                                />
                                            </label>
                                            <span className="file-name">
                                                {formData.image ? (
                                                    <a href={formData.image} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                                        View Image
                                                    </a>
                                                ) : 'No file chosen'}
                                            </span>
                                        </div>
                                        {formData.image && (
                                            <div style={{ marginTop: '10px' }}>
                                                <img
                                                    src={formData.image}
                                                    alt="Product preview"
                                                    style={{
                                                        maxWidth: '200px',
                                                        maxHeight: '200px',
                                                        objectFit: 'contain',
                                                        borderRadius: '8px',
                                                        border: '1px solid #e5e7eb'
                                                    }}

                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Item Category <span className="text-red">*</span></label>
                                        <div className="input-with-action">
                                            <select
                                                name="categoryId" className="form-input" required
                                                value={formData.categoryId} onChange={handleInputChange}
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <button type="button" className="btn-inline-add" onClick={() => setShowCategoryModal(true)}><Plus size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit of Measure</label>
                                        <select
                                            name="uomId" className="form-input"
                                            value={formData.uomId} onChange={handleInputChange}
                                        >
                                            <option value="">Select UOM</option>
                                            {uoms.map(uom => (
                                                <option key={uom.id} value={uom.id}>{uom.unitName} ({uom.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SKU <span className="text-red">*</span></label>
                                        <input
                                            name="sku" type="text" className="form-input"
                                            placeholder="Enter SKU" required
                                            value={formData.sku} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="section-title-row">
                                    <h3 className="section-title">Warehouse Information</h3>
                                    <button type="button" className="btn-inline-add" onClick={addWarehouseRow}>+ Add Warehouse</button>
                                </div>

                                <div className="warehouse-table-container">
                                    <table className="warehouse-input-table">
                                        <thead>
                                            <tr>
                                                <th>WAREHOUSE</th>
                                                <th>QUANTITY</th>
                                                <th>MINIMUM ORDER QUANTITY</th>
                                                <th>INITIAL QUANTITY ON HAND</th>
                                                <th>ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {warehouseRows.map((row) => (
                                                <tr key={row.id}>
                                                    <td>
                                                        <select
                                                            className="form-input mini"
                                                            value={row.warehouseId}
                                                            onChange={(e) => handleWhRowChange(row.id, 'warehouseId', e.target.value)}
                                                        >
                                                            <option value="">Select Warehouse</option>
                                                            {warehouses.map(wh => (
                                                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td><input type="number" className="form-input mini" value={row.quantity} onChange={(e) => handleWhRowChange(row.id, 'quantity', e.target.value)} /></td>
                                                    <td><input type="number" className="form-input mini" value={row.minOrderQty} onChange={(e) => handleWhRowChange(row.id, 'minOrderQty', e.target.value)} /></td>
                                                    <td><input type="number" className="form-input mini" value={row.initialQty} onChange={(e) => handleWhRowChange(row.id, 'initialQty', e.target.value)} /></td>
                                                    <td>
                                                        <button type="button" className="btn-remove" onClick={() => removeWarehouseRow(row.id)}>Remove</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                                    <label className="form-label">Item Description</label>
                                    <textarea
                                        name="description" className="form-input textarea"
                                        placeholder="Enter item description" rows={3}
                                        value={formData.description} onChange={handleInputChange}
                                    ></textarea>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">As Of Date</label>
                                        <input
                                            name="asOfDate" type="date" className="form-input"
                                            value={formData.asOfDate} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Default Tax Account</label>
                                        <input
                                            name="taxAccount" type="text" className="form-input"
                                            placeholder="Enter tax account"
                                            value={formData.taxAccount} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Initial Cost/Unit</label>
                                        <input
                                            name="initialCost" type="number" className="form-input"
                                            step="0.01" value={formData.initialCost} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Default Sale Price (Exclusive)</label>
                                        <input
                                            name="salePrice" type="number" className="form-input"
                                            step="0.01" value={formData.salePrice} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Default Purchase Price (Inclusive)</label>
                                        <input
                                            name="purchasePrice" type="number" className="form-input"
                                            step="0.01" value={formData.purchasePrice} onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Default Discount %</label>
                                        <input
                                            name="discount" type="number" className="form-input"
                                            value={formData.discount} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">Remarks</label>
                                    <input
                                        name="remarks" type="text" className="form-input"
                                        placeholder="Enter remarks"
                                        value={formData.remarks} onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
                                <button type="submit" className="btn-submit">
                                    {showAddModal ? 'Add' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '430px' }}>
                            <div className="modal-header">
                                <h2 className="modal-title">Delete Product</h2>
                                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body" style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>
                                    Are you sure you want to delete product <strong>{selectedProduct?.name}</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer" style={{ padding: '1.25rem', backgroundColor: '#f9fafb', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                                <button className="btn-cancel" onClick={() => setShowDeleteModal(false)} style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>Cancel</button>
                                <button className="btn-submit" onClick={handleDeleteProduct} style={{ backgroundColor: '#ef4444' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add New Category Modal */}
            {
                showCategoryModal && (
                    <div className="modal-overlay sub-modal">
                        <div className="modal-content category-modal">
                            <div className="modal-header">
                                <h2 className="modal-title">Add New Category</h2>
                                <button className="close-btn" onClick={() => setShowCategoryModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Category Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter new category name"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                                <button className="btn-submit" onClick={handleAddCategory}>Add</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Inventory;