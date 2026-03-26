import React, { useState, useEffect, useContext } from 'react';
import { CompanyContext } from '../../../context/CompanyContext';
import {
    Search,
    Grid,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    CreditCard,
    Home,
    Package,
    RefreshCw,
    X,
    Check,
    Printer
} from 'lucide-react';
import './POS.css';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import posService from '../../../services/posService';
import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import customerService from '../../../services/customerService';
import companyService from '../../../api/companyService';
import GetCompanyId from '../../../api/GetCompanyId';

const POS = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Payment States
    const [paymentStatus, setPaymentStatus] = useState('Paid'); // Paid, Partial, Due
    const [partialAmount, setPartialAmount] = useState('');
    const [selectedTax, setSelectedTax] = useState(10); // Default 10%

    // Modal States
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash, Card, UPI
    const [notes, setNotes] = useState('');

    // Data States
    const [categories, setCategories] = useState(['All']);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [companyDetails, setCompanyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            const promises = [
                categoryService.getCategories(companyId),
                productService.getProducts(companyId),
                customerService.getAllCustomers(companyId)
            ];

            if (companyId) {
                promises.push(companyService.getById(companyId));
            }

            const results = await Promise.all(promises);
            const catsRes = results[0];
            const prodsRes = results[1];
            const custsRes = results[2];
            const compRes = companyId ? results[3] : null;

            if (catsRes && catsRes.data) {
                setCategories(['All', ...catsRes.data.map(c => c.name)]);
            }

            if (prodsRes && prodsRes.data) {
                const mappedProducts = prodsRes.data.map(p => {
                    const totalStock = p.stock ? p.stock.reduce((sum, s) => sum + s.quantity, 0) : 0;
                    const defaultWarehouseId = p.stock && p.stock.length > 0 ? p.stock[0].warehouseId : (p.stocks && p.stocks.length > 0 ? p.stocks[0].warehouseId : null);

                    return {
                        id: p.id,
                        name: p.name,
                        price: p.salePrice || 0,
                        category: p.category?.name || 'Uncategorized',
                        stock: totalStock,
                        image: p.image,
                        warehouseId: defaultWarehouseId,
                        taxRate: p.taxAccount ? 10 : 10 // Mock default
                    };
                });
                setProducts(mappedProducts);
            }

            if (custsRes && custsRes.data) {
                setCustomers(custsRes.data);
            }

            if (compRes && compRes.data) {
                setCompanyDetails(compRes.data);
            }

        } catch (error) {
            console.error("Error fetching POS data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Cart Logic
    const addToCart = (product) => {
        if (product.stock <= 0) {
            toast.error("Out of Stock");
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (existingItem.qty >= product.stock) {
                    toast.error("Max stock reached");
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prevCart, { ...product, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    const updateQty = (id, change) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.id === id) {
                    const product = products.find(p => p.id === id);
                    const newQty = item.qty + change;
                    if (newQty < 1) return item;
                    if (product && newQty > product.stock) {
                        toast.error("Not enough stock");
                        return item;
                    }
                    return { ...item, qty: newQty };
                }
                return item;
            });
        });
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * (selectedTax / 100);
    const total = subtotal + tax;

    // Payment Logic
    const getPaidAmount = () => {
        if (paymentStatus === 'Paid') return total;
        if (paymentStatus === 'Due Payment') return 0;
        return parseFloat(partialAmount) || 0;
    };

    const amountDue = total - getPaidAmount();

    const handleOpenCheckout = () => {
        if (cart.length === 0) return;
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmCheckout = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const companyId = GetCompanyId();
            const paidAmt = getPaidAmount();

            const payload = {
                companyId,
                customerId: selectedCustomer ? selectedCustomer.id : null,
                paymentMode: paymentMethod.toUpperCase(),
                notes: notes,
                items: cart.map(item => ({
                    productId: item.id,
                    warehouseId: item.warehouseId || 1,
                    quantity: item.qty,
                    rate: item.price,
                    discount: 0,
                    taxRate: selectedTax,
                    description: item.name
                })),
                discountAmount: 0,
                receivedAmount: paidAmt
            };

            const response = await posService.createPOSInvoice(payload);
            if (response.success) {
                toast.success(`Invoice Created! #${response.data.invoiceNumber}`);

                // Prepare Invoice Data for Print
                const finalInvoice = {
                    ...payload,
                    invoiceNumber: response.data.invoiceNumber,
                    date: new Date().toISOString(),
                    dueDate: new Date().toISOString(),
                    customer: selectedCustomer,
                    totalAmount: total,
                    taxAmount: tax,
                    subTotal: subtotal,
                    paymentMethod: paymentMethod
                };

                setInvoiceData(finalInvoice);
                setIsCheckoutModalOpen(false);
                setShowPrintModal(true);
            } else {
                toast.error('Failed to create invoice');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error creating invoice: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleClosePrint = () => {
        setShowPrintModal(false);
        setCart([]);
        setSelectedCustomer(null);
        setNotes('');
        setPaymentStatus('Paid');
        setPartialAmount('');
        fetchData();
    };

    return (
        <div className="companypos-layout">
            <div className="companypos-main-content">
                <div className="companypos-header">
                    <div className="companypos-search-bar">
                        <Search className="companypos-search-icon" size={20} />
                        <input
                            type="text"
                            className="companypos-search-input"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-600" onClick={fetchData} title="Refresh Data">
                            <RefreshCw size={20} />
                        </button>
                        <button className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-600" onClick={() => navigate('/company/dashboard')}>
                            <Home size={20} />
                        </button>
                    </div>
                </div>

                <div className="companypos-categories">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`companypos-category-pill ${selectedCategory === cat ? 'companypos-active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="companypos-products-grid">
                    {loading ? <p className="col-span-full text-center py-10">Loading Products...</p> :
                        filteredProducts.length === 0 ? <p className="col-span-full text-center py-10">No products found</p> :
                            filteredProducts.map(product => (
                                <div key={product.id} className={`companypos-product-card ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`} onClick={() => addToCart(product)}>
                                    <div className={`companypos-stock-badge ${product.stock < 5 ? 'bg-red-500' : 'bg-green-500'}`}>{product.stock} in stock</div>
                                    <div className="companypos-product-image-placeholder">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="companypos-product-img"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/150?text=📦';
                                                }}
                                            />
                                        ) : (
                                            <Package size={40} strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div className="companypos-product-info">
                                        <h3>{product.name}</h3>
                                        <p>{product.category}</p>
                                        <div className="companypos-product-price">{formatCurrency(product.price)}</div>
                                    </div>
                                </div>
                            ))}
                </div>
            </div>

            {/* Right Sidebar: Cart */}
            <div className="companypos-sidebar">
                <div className="companypos-cart-header">
                    <h2>Current Sale</h2>
                    <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Clear Cart" onClick={() => setCart([])}>
                        <Trash2 size={18} />
                    </button>
                </div>

                <div className="companypos-customer-selector">
                    <div className="companypos-customer-select-wrapper">
                        <User size={18} className="companypos-input-icon left" />
                        <select
                            className="companypos-customer-select"
                            value={selectedCustomer ? selectedCustomer.id : ""}
                            onChange={(e) => {
                                const cust = customers.find(c => c.id === parseInt(e.target.value));
                                setSelectedCustomer(cust || null);
                            }}
                        >
                            <option value="">Walk-in Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
                            ))}
                        </select>
                        <Grid size={16} className="companypos-input-icon right" />
                    </div>
                </div>

                <div className="companypos-cart-items-container">
                    {cart.length === 0 ? (
                        <div className="companypos-empty-cart">
                            <ShoppingCart size={48} />
                            <p>Cart is empty</p>
                            <span className="text-sm text-gray-400">Click products to add here</span>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="companypos-cart-item">
                                <div className="companypos-cart-item-details">
                                    <span className="companypos-cart-item-title">{item.name}</span>
                                    <span className="companypos-cart-item-sku">Rate: {formatCurrency(item.price)}</span>
                                </div>
                                <div className="companypos-qty-controls">
                                    <button className="companypos-qty-btn" onClick={() => updateQty(item.id, -1)} disabled={item.qty <= 1}><Minus size={14} /></button>
                                    <span className="companypos-qty-display">{item.qty}</span>
                                    <button className="companypos-qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                                </div>
                                <div className="companypos-cart-item-price">
                                    {formatCurrency(item.price * item.qty)}
                                </div>
                                <button className="ml-3 text-gray-400 hover:text-red-500" onClick={() => removeFromCart(item.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="companypos-cart-footer">
                    {/* Settings Controls */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Tax</label>
                            <select
                                className="companypos-control-select bg-green-700 text-white border-0"

                                value={selectedTax}
                                onChange={(e) => setSelectedTax(parseFloat(e.target.value))}
                            >
                                <option value={0}>No Tax</option>
                                <option value={5}>GST 5%</option>
                                <option value={10}>GST 10%</option>
                                <option value={12}>GST 12%</option>
                                <option value={18}>GST 18%</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Status</label>
                            <select
                                className="companypos-control-select"
                                value={paymentStatus}
                                onChange={(e) => setPaymentStatus(e.target.value)}
                            >
                                <option value="Paid">Paid</option>
                                <option value="Partial">Partial Payment</option>
                                <option value="Due Payment">Due Payment</option>
                            </select>
                        </div>
                    </div>

                    {paymentStatus === 'Partial' && (
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount Paid</label>
                            <input
                                type="number"
                                className="companypos-control-input"
                                value={partialAmount}
                                onChange={(e) => setPartialAmount(e.target.value)}
                                placeholder="Enter amount"
                            />
                        </div>
                    )}

                    <div className="companypos-summary-container p-3 bg-white border rounded-lg mb-4">
                        <div className="companypos-summary-row">
                            <span className="font-bold text-gray-800">Subtotal:</span>
                            <span className="font-bold text-gray-800">{formatCurrency(subtotal)}</span>
                        </div>
                    </div>
                    <div className="companypos-summary-row">
                        <span className="font-bold text-gray-800">Tax ({selectedTax}%):</span>
                        <span className="font-bold text-gray-800">{formatCurrency(tax)}</span>
                    </div>
                    {paymentStatus !== 'Paid' && (
                        <div className="companypos-summary-row">
                            <span className="font-bold text-gray-800">Amount Paid:</span>
                            <span className="font-bold text-gray-800">{formatCurrency(getPaidAmount())}</span>
                        </div>
                    )}
                    {paymentStatus !== 'Paid' && (
                        <div className="companypos-summary-row">
                            <span className="font-bold text-gray-800">Amount Due:</span>
                            <span className="font-bold text-gray-800">{formatCurrency(amountDue)}</span>
                        </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                </div>

                <button className="companypos-checkout-btn" disabled={cart.length === 0} onClick={handleOpenCheckout}>
                    <span>Pay Now</span>
                    <div className="flex items-center gap-2">
                        <span>{formatCurrency(total)}</span>
                        <CreditCard size={20} />
                    </div>
                </button>
            </div>

            {/* Checkout Modal */}
            {
                isCheckoutModalOpen && (
                    <div className="companypos-modal-overlay">
                        <div className="companypos-modal-content">
                            <div className="companypos-modal-header">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="text-blue-500" size={24} />
                                    <h2>Complete Checkout</h2>
                                </div>
                                <button onClick={() => setIsCheckoutModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="companypos-modal-body">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Amount Payable</div>
                                        <div className="text-3xl font-extrabold text-gray-900">{formatCurrency(total)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Customer</div>
                                        <div className="text-lg font-bold text-gray-800">{selectedCustomer ? selectedCustomer.name : 'Walk-in'}</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block">Payment Method</label>
                                    <div className="companypos-payment-methods">
                                        {['Cash', 'Card', 'UPI'].map(method => (
                                            <button
                                                key={method}
                                                className={`companypos-method-card ${paymentMethod === method ? 'active' : ''}`}
                                                onClick={() => setPaymentMethod(method)}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Internal Notes</label>
                                    <textarea
                                        className="companypos-notes-input"
                                        placeholder="Add any transaction notes here..."
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="companypos-modal-footer">
                                <button className="companypos-btn-secondary" onClick={() => setIsCheckoutModalOpen(false)}>
                                    Cancel
                                </button>
                                <button className="companypos-btn-success" onClick={handleConfirmCheckout} disabled={submitting}>
                                    {submitting ? (
                                        <span>Processing...</span>
                                    ) : (
                                        <>
                                            <span>Confirm & Print Receipt</span>
                                            <Check size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Print Receipt Modal */}
            {
                showPrintModal && invoiceData && (
                    <div className="companypos-modal-overlay">
                        <div className="companypos-modal-content print-mode">
                            <div className="companypos-modal-header no-print">
                                <div className="flex items-center gap-2">
                                    <Printer className="text-blue-500" size={24} />
                                    <h2>Invoice Receipt</h2>
                                </div>
                                <div className="flex gap-2">
                                    <button className="companypos-btn-success" onClick={handlePrint}>
                                        <Printer size={18} /> Print
                                    </button>
                                    <button onClick={handleClosePrint} className="text-gray-400 hover:text-gray-600">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="companypos-modal-body padded-print" id="print-area">
                                <div className="POS-invoice-preview-container flex flex-col items-center">
                                    {/* Header */}
                                    <div className={`POS-invoice-preview-container w-full POS-template-${(companyDetails?.template || 'newyork').toLowerCase()}`}>
                                        <div className="POS-invoice-header-wrapper">
                                            <div className="POS-invoice-preview-header">
                                                <div className="POS-invoice-header-left">
                                                    {companyDetails?.logo ? (
                                                        <img src={companyDetails.logo} alt="Logo" className="POS-invoice-logo-large" />
                                                    ) : (
                                                        <h2 style={{ color: companyDetails?.color || '#004aad', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{companyDetails?.name || 'Company Name'}</h2>
                                                    )}
                                                    <div className="POS-invoice-company-details mt-2">
                                                        <strong>{companyDetails?.name}</strong><br />
                                                        {companyDetails?.email}<br />
                                                        {companyDetails?.phone}<br />
                                                        {companyDetails?.address}
                                                    </div>
                                                </div>
                                                <div className="POS-invoice-header-right">
                                                    <div className="POS-invoice-title-large">INVOICE</div>
                                                    <div className="POS-invoice-meta-info">
                                                        <div className="POS-invoice-meta-row">
                                                            <span className="POS-invoice-label">Number:</span> #{invoiceData.invoiceNumber}
                                                        </div>
                                                        <div className="POS-invoice-meta-row">
                                                            <span className="POS-invoice-label">Issue:</span> {new Date(invoiceData.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="POS-invoice-meta-row">
                                                            <span className="POS-invoice-label">Due Date:</span> {new Date(invoiceData.dueDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="POS-invoice-qr-box">
                                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${invoiceData.invoiceNumber}`} alt="QR" className="POS-invoice-qr-code" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="POS-invoice-addresses">
                                            <div className="POS-invoice-bill-to">
                                                <div className="POS-invoice-section-header">Bill To:</div>
                                                {invoiceData.customer ? (
                                                    <>
                                                        <div className="font-bold text-gray-800">{invoiceData.customer.name}</div>
                                                        <div className="text-sm text-gray-600">{invoiceData.customer.email}</div>
                                                        <div className="text-sm text-gray-600">{invoiceData.customer.phone}</div>
                                                        <div className="text-sm text-gray-600">{invoiceData.customer.billingAddress || invoiceData.customer.address}</div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-gray-500">Walk-in Customer</div>
                                                )}
                                            </div>
                                            <div className="POS-invoice-ship-to text-right">
                                                <div className="POS-invoice-section-header">Ship To:</div>
                                                {invoiceData.customer ? (
                                                    <>
                                                        <div className="font-bold text-gray-800">{invoiceData.customer.name}</div>
                                                        <div className="text-sm text-gray-600">{invoiceData.customer.shippingAddress || invoiceData.customer.address || invoiceData.customer.billingAddress}</div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-gray-500">Same as Billing</div>
                                                )}
                                            </div>
                                        </div>

                                        <table className="POS-invoice-table-preview">
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th>Warehouse</th>
                                                    <th className="text-center">Quantity</th>
                                                    <th className="text-right">Rate</th>
                                                    <th className="text-right">Discount</th>
                                                    <th className="text-right">Tax (%)</th>
                                                    <th className="text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceData.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <div className="font-bold text-gray-800">{item.description || 'Item'}</div>
                                                        </td>
                                                        <td>Warehouse Hub</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-right">{formatCurrency(item.rate)}</td>
                                                        <td className="text-right">{formatCurrency(item.discount || 0)}</td>
                                                        <td className="text-right">{item.taxRate}%</td>
                                                        <td className="text-right font-bold">{formatCurrency((item.quantity * item.rate) * (1 + item.taxRate / 100))}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div className="POS-invoice-total-section">
                                            <div className="POS-invoice-totals">
                                                <div className="POS-invoice-total-row">
                                                    <span className="POS-invoice-label">Sub Total</span>
                                                    <span>{formatCurrency(invoiceData.subTotal)}</span>
                                                </div>
                                                <div className="POS-invoice-total-row">
                                                    <span className="POS-invoice-label">Tax</span>
                                                    <span>{formatCurrency(invoiceData.taxAmount)}</span>
                                                </div>
                                                <div className="POS-invoice-final-total">
                                                    <span className="text-xl">Total</span>
                                                    <span className="text-xl">{formatCurrency(invoiceData.totalAmount)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {invoiceData.notes && (
                                            <div className="POS-invoice-notes-section">
                                                <div className="POS-invoice-section-header">Notes</div>
                                                <p className="POS-invoice-notes-text">{invoiceData.notes}</p>
                                            </div>
                                        )}

                                        <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                                            <p>This is a computer generated invoice and does not require a signature.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* End of CompanyPOS Layout */}
        </div >
    );
};

export default POS;