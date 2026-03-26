import React, { useState, useEffect } from 'react';
import { FaBox, FaSearch, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Accounts.css';
import deliveryChallanService from '../../../api/deliveryChallanService';
import customerService from '../../../api/customerService';
import productService from '../../../api/productService';
import warehouseService from '../../../api/warehouseService';
import GetCompanyId from '../../../api/GetCompanyId';

const DeliveryNote = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    id: null,
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    productId: '',
    warehouseId: '',
    quantity: '',
    amount: '', // Display only for now unless backend supports it
    challanNumber: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Filter notes when search term changes
  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const filtered = notes.filter(note => 
        (note.customer?.name || '').toLowerCase().includes(lower) ||
        (note.deliverychallanitem?.[0]?.product?.name || '').toLowerCase().includes(lower) ||
        (note.challanNumber || '').toLowerCase().includes(lower)
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [searchTerm, notes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const companyId = GetCompanyId();
      
      const [challanRes, custRes, prodRes, whRes] = await Promise.all([
        deliveryChallanService.getAll(companyId),
        customerService.getAll(companyId),
        productService.getAll(companyId),
        warehouseService.getAll(companyId)
      ]);

      if (challanRes.data.success) {
        setNotes(challanRes.data.data);
      }
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (whRes.data.success) setWarehouses(whRes.data.data);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setCurrentNote(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate amount if product and quantity change (Visual only)
      if (name === 'productId' || name === 'quantity') {
        const prodId = name === 'productId' ? value : prev.productId;
        const qty = name === 'quantity' ? value : prev.quantity;
        
        if (prodId && qty) {
          const product = products.find(p => p.id === parseInt(prodId));
          if (product) {
            updated.amount = (parseFloat(product.salesPrice || 0) * parseFloat(qty || 0)).toFixed(2);
          }
        }
      }
      return updated;
    });
  };

  const handleAddClick = () => {
    setIsEditing(false);
    // Auto-generate a temp challan number or leave empty for backend to generate if supported
    // For now, let's use a random one or manual input
    const randomChallan = `DC-${Math.floor(100000 + Math.random() * 900000)}`;
    
    setCurrentNote({
      id: null,
      date: new Date().toISOString().split('T')[0],
      customerId: '',
      productId: '',
      warehouseId: warehouses[0]?.id || '', // Default to first warehouse
      quantity: '',
      amount: '',
      challanNumber: randomChallan
    });
    setShowModal(true);
  };

  const handleEditClick = (note) => {
    setIsEditing(true);
    // Extract first item for the simple form
    const firstItem = note.deliverychallanitem?.[0] || {};
    
    setCurrentNote({
      id: note.id,
      date: new Date(note.date).toISOString().split('T')[0],
      customerId: note.customerId,
      productId: firstItem.productId || '',
      warehouseId: firstItem.warehouseId || '',
      quantity: firstItem.quantity || '',
      amount: '', // Calculate or fetch if stored
      challanNumber: note.challanNumber
    });
    
    // Calculate amount for display
    if (firstItem.productId && firstItem.quantity) {
      const product = products.find(p => p.id === firstItem.productId);
      if (product) {
         const amt = (parseFloat(product.salesPrice || 0) * parseFloat(firstItem.quantity)).toFixed(2);
         setCurrentNote(prev => ({ ...prev, amount: amt }));
      }
    }
    
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery note?')) {
      try {
        const companyId = GetCompanyId();
        await deliveryChallanService.delete(id, companyId);
        toast.success('Delivery note deleted successfully');
        fetchData();
      } catch (error) {
        console.error("Error deleting note:", error);
        toast.error("Failed to delete delivery note");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentNote.date || !currentNote.customerId || !currentNote.productId || !currentNote.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const companyId = GetCompanyId();
    
    // Prepare payload
    const payload = {
      challanNumber: currentNote.challanNumber,
      date: currentNote.date,
      customerId: parseInt(currentNote.customerId),
      companyId: parseInt(companyId),
      items: [
        {
          productId: parseInt(currentNote.productId),
          warehouseId: parseInt(currentNote.warehouseId),
          quantity: parseFloat(currentNote.quantity),
          description: products.find(p => p.id === parseInt(currentNote.productId))?.name || ''
        }
      ],
      // Optional fields
      notes: '',
      shippingAddress: '', // Could fetch from customer
    };

    try {
      if (isEditing) {
        await deliveryChallanService.update(currentNote.id, payload, companyId);
        toast.success('Delivery note updated successfully');
      } else {
        await deliveryChallanService.create(payload);
        toast.success('Delivery note added successfully');
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(error.response?.data?.message || "Failed to save delivery note");
    }
  };

  return (
    <div className="ac-container">
      {/* Header */}
      <div className="ac-header">
        <div className="ac-title">
          <FaBox className="ac-title-icon" />
          Delivery Notes
        </div>
        <div className="ac-subtitle">Manage your delivery records easily</div>
      </div>

      {/* Action Bar */}
      <div className="ac-action-bar">
        <div className="ac-search-box">
          <FaSearch className="ac-search-icon" />
          <input
            type="text"
            className="ac-search-input"
            placeholder="Search delivery notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="ac-btn-add" onClick={handleAddClick}>
          <FaPlus /> Add Delivery Note
        </button>
      </div>

      {/* Table */}
      <div className="ac-table-card">
        <div className="ac-table-container">
          {loading ? (
             <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : (
            <table className="ac-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>DATE</th>
                  <th>CHALLAN NO</th>
                  <th>CUSTOMER</th>
                  <th>PRODUCT</th>
                  <th>QUANTITY</th>
                  {/* <th>AMOUNT</th> */} 
                  {/* Amount is often not part of Challan, but we can show it if needed */}
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotes.length > 0 ? (
                  filteredNotes.map((note, index) => {
                    const firstItem = note.deliverychallanitem?.[0];
                    const productName = firstItem?.product?.name || (note.deliverychallanitem?.length > 1 ? 'Multiple Items' : 'Unknown Product');
                    const qty = firstItem?.quantity || 0;
                    
                    return (
                      <tr key={note.id}>
                        <td>{index + 1}</td>
                        <td>{new Date(note.date).toLocaleDateString()}</td>
                        <td>{note.challanNumber}</td>
                        <td>{note.customer?.name || 'Unknown'}</td>
                        <td>{productName}</td>
                        <td>{note.deliverychallanitem?.length > 1 ? `${note.deliverychallanitem.length} items` : qty}</td>
                        {/* <td>{note.totalAmount || '-'}</td> */}
                        <td className="ac-actions-cell">
                          <button className="ac-action-btn ac-btn-edit" onClick={() => handleEditClick(note)}>
                            <FaEdit />
                          </button>
                          <button className="ac-action-btn ac-btn-delete" onClick={() => handleDeleteClick(note.id)}>
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      No delivery notes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-content">
            <div className="ac-modal-header">
              <h3 className="ac-modal-title">{isEditing ? 'Edit Delivery Note' : 'New Delivery Note'}</h3>
              <button className="ac-close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="ac-modal-body">
              <div className="ac-form-grid">
                
                {/* Challan No (Auto or Manual) */}
                 <div className="ac-form-group">
                  <label className="ac-form-label">Challan No</label>
                  <input
                    type="text"
                    className="ac-form-input"
                    name="challanNumber"
                    value={currentNote.challanNumber}
                    onChange={handleInput}
                    required
                  />
                </div>

                <div className="ac-form-group">
                  <label className="ac-form-label">Date</label>
                  <input
                    type="date"
                    className="ac-form-input"
                    name="date"
                    value={currentNote.date}
                    onChange={handleInput}
                    required
                  />
                </div>
                
                <div className="ac-form-group">
                  <label className="ac-form-label">Customer</label>
                  <select
                    className="ac-form-input"
                    name="customerId"
                    value={currentNote.customerId}
                    onChange={handleInput}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="ac-form-group">
                  <label className="ac-form-label">Product</label>
                  <select
                    className="ac-form-input"
                    name="productId"
                    value={currentNote.productId}
                    onChange={handleInput}
                    required
                  >
                     <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                 <div className="ac-form-group">
                  <label className="ac-form-label">Warehouse</label>
                  <select
                    className="ac-form-input"
                    name="warehouseId"
                    value={currentNote.warehouseId}
                    onChange={handleInput}
                    required
                  >
                     <option value="">Select Warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="ac-form-group">
                  <label className="ac-form-label">Quantity</label>
                  <input
                    type="number"
                    className="ac-form-input"
                    placeholder="Enter quantity"
                    name="quantity"
                    value={currentNote.quantity}
                    onChange={handleInput}
                    required
                  />
                </div>
                
                 <div className="ac-form-group">
                  <label className="ac-form-label">Est. Amount (Read Only)</label>
                  <input
                    type="number"
                    className="ac-form-input"
                    placeholder="Auto-calculated"
                    name="amount"
                    value={currentNote.amount}
                    readOnly
                    style={{ backgroundColor: '#f3f4f6' }}
                  />
                </div>

                <div className="ac-form-full">
                  <button type="submit" className="ac-btn-full">
                    {isEditing ? 'Update Delivery Note' : 'Add Delivery Note'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNote;
