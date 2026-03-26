import React, { useState, useEffect } from 'react';
import { FaFileInvoiceDollar, FaSearch, FaPlus, FaEdit, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './Accounts.css';
import salesReturnService from '../../../api/salesReturnService';
import customerService from '../../../api/customerService';
import productService from '../../../api/productService';
import warehouseService from '../../../api/warehouseService';
import GetCompanyId from '../../../api/GetCompanyId';

const CreditNote = () => {
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
    returnNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerId: '',
    description: '', // Maps to 'reason'
    productId: '',
    warehouseId: '',
    quantity: '',
    rate: '',
    amount: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const filtered = notes.filter(note => 
        (note.customer?.name || '').toLowerCase().includes(lower) ||
        (note.reason || '').toLowerCase().includes(lower) ||
        (note.returnNumber || '').toLowerCase().includes(lower)
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
      
      const [returnsRes, custRes, prodRes, whRes] = await Promise.all([
        salesReturnService.getAll(companyId),
        customerService.getAll(companyId),
        productService.getAll(companyId),
        warehouseService.getAll(companyId)
      ]);

      if (returnsRes.data.success) {
        setNotes(returnsRes.data.data);
      }
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (whRes.data.success) setWarehouses(whRes.data.data);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setCurrentNote(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate Amount
      if (name === 'quantity' || name === 'rate') {
        const qty = parseFloat(name === 'quantity' ? value : prev.quantity) || 0;
        const rate = parseFloat(name === 'rate' ? value : prev.rate) || 0;
        updated.amount = (qty * rate).toFixed(2);
      }

      // Auto-fill Rate if Product Selected
      if (name === 'productId') {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          updated.rate = product.salesPrice || 0;
          const qty = parseFloat(updated.quantity) || 0;
          updated.amount = (qty * parseFloat(product.salesPrice || 0)).toFixed(2);
        }
      }

      return updated;
    });
  };

  const handleAddClick = () => {
    setIsEditing(false);
    // Auto-generate temp return number
    const randomReturnNo = `SR-${Math.floor(1000 + Math.random() * 9000)}`;
    
    setCurrentNote({
      id: null,
      returnNumber: randomReturnNo,
      date: new Date().toISOString().split('T')[0],
      customerId: '',
      description: '',
      productId: '',
      warehouseId: warehouses[0]?.id || '',
      quantity: '',
      rate: '',
      amount: ''
    });
    setShowModal(true);
  };

  const handleEditClick = (note) => {
    setIsEditing(true);
    const firstItem = note.salesreturnitem?.[0] || {};
    
    setCurrentNote({
      id: note.id,
      returnNumber: note.returnNumber,
      date: new Date(note.date).toISOString().split('T')[0],
      customerId: note.customerId,
      description: note.reason || '',
      productId: firstItem.productId || '',
      warehouseId: firstItem.warehouseId || '',
      quantity: firstItem.quantity || '',
      rate: firstItem.rate || '',
      amount: note.totalAmount || ''
    });
    setShowModal(true);
  };

  // Delete not supported by backend controller
  const handleDeleteClick = () => {
    toast.error("Deletion is not supported for Credit Notes. Please create a debit note or adjustment to reverse.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentNote.date || !currentNote.customerId || !currentNote.productId || !currentNote.warehouseId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const companyId = GetCompanyId();
    
    const payload = {
      returnNumber: currentNote.returnNumber,
      date: currentNote.date,
      customerId: parseInt(currentNote.customerId),
      reason: currentNote.description,
      items: [
        {
          productId: parseInt(currentNote.productId),
          warehouseId: parseInt(currentNote.warehouseId),
          quantity: parseFloat(currentNote.quantity),
          rate: parseFloat(currentNote.rate)
        }
      ]
    };

    try {
      if (isEditing) {
        await salesReturnService.update(currentNote.id, payload, companyId);
        toast.success('Credit note updated successfully');
      } else {
        await salesReturnService.create(payload);
        toast.success('Credit note created successfully');
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving credit note:", error);
      toast.error(error.response?.data?.message || "Failed to save credit note");
    }
  };

  return (
    <div className="ac-container">
      {/* Header */}
      <div className="ac-header">
        <div className="ac-title" style={{ color: 'var(--primary)' }}>
          Credit Notes
        </div>
      </div>

      {/* Action Bar */}
      <div className="ac-action-bar">
        <div className="ac-search-box">
          <FaSearch className="ac-search-icon" />
          <input
            type="text"
            className="ac-search-input"
            placeholder="Search credit notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="ac-btn-add" onClick={handleAddClick}>
          <FaPlus /> Add Credit Note
        </button>
      </div>

      {/* List Layout */}
      <div className="ac-list-container">
        {loading ? (
           <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
             const firstItem = note.salesreturnitem?.[0];
             const qty = firstItem?.quantity || 0;
             const rate = firstItem?.rate || 0;

            return (
              <div key={note.id} className="ac-list-item">
                {/* Left Side: Customer & Description */}
                <div className="ac-item-left">
                  <div className="ac-item-title">{note.customer?.name || 'Unknown Customer'}</div>
                  <div className="ac-item-desc">
                    <span style={{ fontWeight: 'bold', marginRight: '5px' }}>{note.returnNumber}</span>
                    {note.reason || 'No description'}
                  </div>
                  <div className="ac-item-date">{new Date(note.date).toLocaleDateString()}</div>
                </div>

                {/* Right Side: Financials & Actions */}
                <div className="ac-item-right">
                  <div className="ac-stat-row">
                    <span className="ac-stat-label">Qty:</span>
                    <span className="ac-stat-value">{qty}</span>
                  </div>
                  <div className="ac-stat-row">
                    <span className="ac-stat-label">Rate:</span>
                    <span className="ac-stat-value">R{rate}</span>
                  </div>
                  <div className="ac-stat-row">
                    <span className="ac-stat-label">Amount:</span>
                    <span className="ac-stat-value highlight">R{note.totalAmount}</span>
                  </div>
                  <div className="ac-item-actions">
                    <button className="ac-action-btn ac-btn-edit" onClick={() => handleEditClick(note)}>
                      <FaEdit />
                    </button>
                    {/* Delete hidden/disabled as backend doesn't support it */}
                   {/* <button className="ac-action-btn ac-btn-delete" onClick={handleDeleteClick}>
                      <FaTrash />
                    </button> */}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="ac-empty-state">No credit notes found.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal-content" style={{ maxWidth: '500px' }}>
            <div className="ac-modal-header">
              <h3 className="ac-modal-title" style={{ color: '#1e293b' }}>
                {isEditing ? 'Edit Credit Note' : 'Add Credit Note'}
              </h3>
              <button className="ac-close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="ac-modal-body">
              
               <div className="ac-form-group">
                <label className="ac-form-label">Return No</label>
                <input
                  type="text"
                  className="ac-form-input"
                  name="returnNumber"
                  value={currentNote.returnNumber}
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
                <label className="ac-form-label">Description / Reason</label>
                <input
                  type="text"
                  className="ac-form-input"
                  placeholder="Enter reason"
                  name="description"
                  value={currentNote.description}
                  onChange={handleInput}
                />
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
                <label className="ac-form-label">Rate</label>
                <input
                  type="number"
                  className="ac-form-input"
                  placeholder="Enter rate"
                  name="rate"
                  value={currentNote.rate}
                  onChange={handleInput}
                  required
                />
              </div>
              
               <div className="ac-form-group">
                <label className="ac-form-label">Total Amount</label>
                <input
                  type="number"
                  className="ac-form-input"
                  name="amount"
                  value={currentNote.amount}
                  readOnly
                  style={{ backgroundColor: '#f3f4f6' }}
                />
              </div>

              <button type="submit" className="ac-btn-full" style={{ marginTop: '20px' }}>
                {isEditing ? 'Update' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNote;
