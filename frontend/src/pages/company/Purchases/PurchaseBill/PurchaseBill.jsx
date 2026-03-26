import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CompanyContext } from '../../../../context/CompanyContext';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown,
    FileText, ShoppingCart, Truck, Receipt, CreditCard,
    CheckCircle2, Clock, ArrowRight, Eye, Printer, FilePlus, Check, ArrowLeft
} from 'lucide-react';

import toast from 'react-hot-toast';
import '../Purchase.css';
import './PurchaseBill.css';
import './PurchaseBillInvoiceView.css';
import purchaseBillService from '../../../../services/purchaseBillService';
import vendorService from '../../../../services/vendorService';
import productService from '../../../../api/productService';
import warehouseService from '../../../../api/warehouseService';
import purchaseOrderService from '../../../../services/purchaseOrderService';
import goodsReceiptNoteService from '../../../../services/goodsReceiptNoteService';
import companyService from '../../../../api/companyService';
import GetCompanyId from '../../../../api/GetCompanyId';

const PurchaseBill = () => {
    const { formatCurrency } = useContext(CompanyContext);
    const location = useLocation();
    const navigate = useNavigate();
    const sourceData = location.state?.sourceData;

    // --- State Management ---
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [viewBill, setViewBill] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Source Selection State
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [sourceStep, setSourceStep] = useState('type');
    const [selectedSourceType, setSelectedSourceType] = useState(null);
    const [sourceDocs, setSourceDocs] = useState([]);
    const [linkedSource, setLinkedSource] = useState(null);

    // Form State
    const [companyDetails, setCompanyDetails] = useState({
        name: 'Kiaan Technology', address: 'Indore, MP', email: 'info@kiaantechnology.com', phone: '97521 00980', logo: '', notes: '', terms: ''
    });
    const [billMeta, setBillMeta] = useState({
        manualNo: '', date: new Date().toISOString().split('T')[0], dueDate: ''
    });
    const [vendorId, setVendorId] = useState('');

    const [items, setItems] = useState([
        { id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }
    ]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountName: '', bankName: '', accountNo: '', branch: '', ifsc: ''
    });
    const [nextBillNumber, setNextBillNumber] = useState('');

    const fetchNextBillNumber = async () => {
        try {
            const companyId = GetCompanyId();
            if (companyId) {
                const res = await purchaseBillService.getNextNumber(companyId);
                if (res.success && res.nextNumber) {
                    setNextBillNumber(res.nextNumber);
                    return res.nextNumber;
                }
            }
        } catch (error) {
            console.error("Error generating next bill number:", error);
        }
        return '';
    };

    useEffect(() => {
        fetchInitialData();
        fetchBills();
    }, []);

    // Handle Deep Link from Navigation State
    useEffect(() => {
        if (location.state && location.state.targetBillId) {
            const fetchTarget = async () => {
                try {
                    const companyId = GetCompanyId();
                    const response = await purchaseBillService.getBillById(location.state.targetBillId, companyId);
                    if (response.success) {
                        setViewBill(response.data);
                        setIsViewMode(true);
                        setIsViewMode(true);
                        // setShowAddModal(true); // No longer needed for full page view
                    }
                } catch (error) {
                    console.error("Error loading target purchase bill", error);
                }
            };
            fetchTarget();
        }
    }, [location.state]);

    useEffect(() => {
        if (sourceData && !editingId && vendors.length > 0) {
            setVendorId(sourceData.vendorId);
            setNotes(sourceData.notes || '');
            setTerms(sourceData.terms || '');

            if (sourceData.items) {
                const billItems = sourceData.items.map(item => {
                    let rate = item.rate || 0;
                    let tax = item.taxRate || item.tax || 0;
                    let discount = item.discount || 0;

                    // If we have a GRN source with PO items linked in sourceData (unlikely but safe)
                    if (sourceData.sourceType === 'grn' && sourceData.poItems) {
                        const poItem = sourceData.poItems.find(pi => pi.productId === item.productId);
                        if (poItem) {
                            rate = poItem.rate || 0;
                            tax = poItem.taxRate || 0;
                            discount = poItem.discount || 0;
                        }
                    }

                    return {
                        id: Date.now() + Math.random(),
                        productId: item.productId || item.product?.id || '',
                        warehouseId: item.warehouseId || item.warehouse?.id || '',
                        qty: item.receivedQty || item.quantity || item.qty || 1,
                        rate,
                        tax,
                        discount,
                        total: 0,
                        description: item.description || ''
                    };
                });

                const calculatedItems = billItems.map(i => {
                    const sub = i.qty * i.rate;
                    const taxAmt = ((sub - i.discount) * i.tax) / 100;
                    return { ...i, total: (sub - i.discount) + taxAmt };
                });

                setItems(calculatedItems);
            }
            setShowAddModal(true);
        }
    }, [sourceData, editingId, vendors, warehouses]);

    const fetchInitialData = async () => {
        try {
            const companyId = GetCompanyId();
            const promises = [
                vendorService.getAllVendors(companyId),
                productService.getProducts(companyId),
                warehouseService.getWarehouses(companyId)
            ];

            if (companyId) {
                promises.push(companyService.getById(companyId));
            }

            const results = await Promise.all(promises);
            const vendorRes = results[0];
            const productRes = results[1];
            const warehouseRes = results[2];
            const companyRes = companyId ? results[3] : null;

            setVendors(vendorRes.data || vendorRes || []);
            setProducts(productRes.data || productRes || []);
            setWarehouses(warehouseRes.data || warehouseRes || []);

            if (companyRes && companyRes.data) {
                const cData = companyRes.data;
                setCompanyDetails({
                    name: cData.name || 'Kiaan Technology',
                    email: cData.email || 'info@kiaantechnology.com',
                    phone: cData.phone || '97521 00980',
                    address: `${cData.address || 'Indore'}, ${cData.city || 'MP'}`,
                    logo: cData.logo || '',
                    template: cData.invoiceTemplate || 'New York',
                    color: cData.invoiceColor || '#004aad',
                    notes: cData.notes || '',
                    terms: cData.terms || ''
                });
                setNotes(cData.notes || '');
                setTerms(cData.terms || '');
                setBankDetails({
                    accountName: cData.accountHolder || '',
                    bankName: cData.bankName || '',
                    accountNo: cData.accountNumber || '',
                    branch: '',
                    ifsc: cData.ifsc || ''
                });
                if (cData.notes) setNotes(cData.notes);
                if (cData.terms) setTerms(cData.terms);
            }

        } catch (error) {
            console.error(error);
            toast.error("Failed to load initial data");
        }
    };

    const fetchBills = async () => {
        setLoading(true);
        try {
            const companyId = GetCompanyId();
            const res = await purchaseBillService.getBills(companyId);
            if (res.success) {
                setBills(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setIsViewMode(false);
        setViewBill(null);
        setVendorId('');
        setBillMeta({ manualNo: '', date: new Date().toISOString().split('T')[0], dueDate: '' });
        setItems([{ id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
        setNotes(companyDetails.notes || '');
        setTerms(companyDetails.terms || '');
        setShowAddModal(false);
        setShowSourceModal(false);
        setSourceStep('type');
        setSourceDocs([]);
        setLinkedSource(null);
        fetchInitialData();
    };

    const handleAddNew = () => {
        resetForm();
        setShowSourceModal(true);
    };

    const handleSourceTypeSelect = async (type) => {
        setSelectedSourceType(type);
        if (type === 'manual') {
            setShowSourceModal(false);
            const nextNum = await fetchNextBillNumber();
            setBillMeta(prev => ({ ...prev, manualNo: nextNum }));
            setShowAddModal(true);
        } else if (type === 'po') {
            setLoading(true);
            try {
                const companyId = GetCompanyId();
                const res = await purchaseOrderService.getOrders(companyId);
                const orders = res.data || res || [];
                // Filter out POs that are already completed OR already have linked bills
                setSourceDocs(orders.filter(o => o.status !== 'COMPLETED' && (!o.purchaseBills || o.purchaseBills.length === 0)));
                setSourceStep('list');
            } catch (err) {
                toast.error('Failed to fetch Purchase Orders');
            } finally {
                setLoading(false);
            }
        } else if (type === 'grn') {
            setLoading(true);
            try {
                const companyId = GetCompanyId();
                const res = await goodsReceiptNoteService.getGRNs(companyId);
                const grns = res.data || res || [];
                // Filter out GRNs that are already invoiced OR already have linked bills
                setSourceDocs(grns.filter(g => g.status !== 'Invoiced' && (!g.purchaseBills || g.purchaseBills.length === 0)));
                setSourceStep('list');
            } catch (err) {
                toast.error('Failed to fetch GRNs');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSourceDocSelect = async (doc) => {
        setVendorId(doc.vendorId);
        setNotes(doc.notes || '');
        setTerms(doc.terms || '');

        let mappedItems = [];
        const itemsList = doc.purchaseorderitem || doc.goodsreceiptnoteitem || doc.items || [];
        if (itemsList.length > 0) {
            mappedItems = itemsList.map(item => {
                let rate = item.rate || 0;
                let tax = item.taxRate || item.tax || 0;
                let discount = item.discount || 0;

                // For GRN, pull rates/taxes from the linked Purchase Order
                if (selectedSourceType === 'grn' && doc.purchaseorder?.purchaseorderitem) {
                    const poItem = doc.purchaseorder.purchaseorderitem.find(pi => pi.productId === item.productId);
                    if (poItem) {
                        rate = poItem.rate || 0;
                        tax = poItem.taxRate || 0;
                        discount = poItem.discount || 0;
                    }
                }

                return {
                    id: Date.now() + Math.random(),
                    productId: item.productId || item.product?.id || '',
                    warehouseId: item.warehouseId || item.warehouse?.id || '',
                    qty: item.receivedQty || item.quantity || item.qty || 1,
                    rate,
                    tax,
                    discount,
                    total: 0,
                    description: item.description || ''
                };
            });

            mappedItems = mappedItems.map(i => {
                const sub = i.qty * i.rate;
                const taxAmt = ((sub - i.discount) * i.tax) / 100;
                return { ...i, total: (sub - i.discount) + taxAmt };
            });
            setItems(mappedItems);
        }

        if (selectedSourceType === 'po') {
            setLinkedSource({ purchaseOrderId: doc.id });
            const nextNum = await fetchNextBillNumber();
            setBillMeta(prev => ({ ...prev, manualNo: nextNum || `BILL-PO-${doc.poNumber || doc.id}` }));
        } else if (selectedSourceType === 'grn') {
            setLinkedSource({ grnId: doc.id, purchaseOrderId: doc.purchaseOrderId });
            const nextNum = await fetchNextBillNumber();
            setBillMeta(prev => ({ ...prev, manualNo: nextNum || `BILL-GRN-${doc.grnNumber || doc.id}` }));
        }

        setShowSourceModal(false);
        setShowAddModal(true);
    };

    const handleView = async (bill) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseBillService.getBillById(bill.id, companyId);
            if (res.success && res.data) {
                const billData = res.data;
                resetForm();
                setViewBill(billData);
                setEditingId(billData.id);
                setVendorId(billData.vendorId);
                setBillMeta({
                    manualNo: billData.billNumber,
                    date: billData.date.split('T')[0],
                    dueDate: billData.dueDate ? billData.dueDate.split('T')[0] : ''
                });
                setNotes(billData.notes || '');

                const itemsData = billData.purchasebillitem || billData.items;
                if (itemsData) {
                    const mappedItems = itemsData.map(i => ({
                        id: i.id || Date.now() + Math.random(),
                        productId: i.productId || '',
                        warehouseId: i.warehouseId || '',
                        qty: i.quantity,
                        rate: i.rate,
                        tax: i.taxRate,
                        discount: i.discount,
                        total: i.amount,
                        description: i.description
                    }));
                    setItems(mappedItems);
                }

                setIsViewMode(true);
                // setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error fetching bill details", error);
            toast.error("Failed to fetch bill details");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleEdit = async (id) => {
        try {
            const companyId = GetCompanyId();
            const res = await purchaseBillService.getBillById(id, companyId);
            if (res.success && res.data) {
                const billToEdit = res.data;
                resetForm();
                setEditingId(id);
                setVendorId(billToEdit.vendorId);
                setBillMeta({
                    manualNo: billToEdit.billNumber,
                    date: billToEdit.date.split('T')[0],
                    dueDate: billToEdit.dueDate ? billToEdit.dueDate.split('T')[0] : ''
                });
                setNotes(billToEdit.notes || '');

                const itemsData = billToEdit.purchasebillitem || billToEdit.items;
                if (itemsData) {
                    const mappedItems = itemsData.map(i => ({
                        id: i.id || Date.now() + Math.random(),
                        productId: i.productId || '',
                        warehouseId: i.warehouseId || '',
                        qty: i.quantity,
                        rate: i.rate,
                        tax: i.taxRate,
                        discount: i.discount,
                        total: i.amount,
                        description: i.description
                    }));
                    setItems(mappedItems);
                }
                setShowAddModal(true);
            }
        } catch (error) {
            console.error("Error fetching bill details", error);
            toast.error("Failed to fetch details for editing");
        }
    };

    const handleDelete = (id) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        try {
            const companyId = GetCompanyId();
            await purchaseBillService.deleteBill(deleteId, companyId);
            toast.success("Bill deleted");
            fetchBills();
        } catch (error) {
            console.error(error);
        }
        setShowDeleteConfirm(false);
        setDeleteId(null);
    };

    const safeFloat = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    const handleSave = async () => {
        if (!vendorId) {
            toast.error("Please select a vendor");
            return;
        }

        const totals = calculateTotals();

        const companyId = GetCompanyId();
        const payload = {
            companyId,
            purchaseOrderId: sourceData?.purchaseOrderId || linkedSource?.purchaseOrderId || null,
            grnId: sourceData?.grnId || linkedSource?.grnId || null,
            vendorId: parseInt(vendorId),
            billNumber: billMeta.manualNo || `BILL-${Date.now()}`,
            date: billMeta.date,
            dueDate: billMeta.dueDate,
            totalAmount: safeFloat(totals.total),
            taxAmount: safeFloat(totals.tax),
            discountAmount: safeFloat(totals.discount),
            items: items.map(item => ({
                productId: parseInt(item.productId),
                warehouseId: item.warehouseId ? parseInt(item.warehouseId) : null,
                description: item.description,
                quantity: safeFloat(item.qty),
                rate: safeFloat(item.rate),
                discount: safeFloat(item.discount),
                taxRate: safeFloat(item.tax),
                amount: safeFloat(item.total)
            })),
            notes
        };

        try {
            if (editingId) {
                await purchaseBillService.updateBill(editingId, payload);
                toast.success("Bill updated successfully");
                setEditingId(null);
                setShowAddModal(false);
                fetchBills();
            } else {
                await purchaseBillService.createBill(payload);
                toast.success("Bill created successfully");
                setShowAddModal(false);
                fetchBills();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to save bill");
        }
    };

    const handleMakePayment = (bill) => {
        navigate('/company/purchases/payment', {
            state: {
                sourceData: {
                    vendorId: bill.vendorId,
                    amount: bill.totalAmount,
                    billNumber: bill.billNumber,
                    billId: bill.id
                }
            }
        });
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', warehouseId: '', qty: 1, rate: 0, tax: 0, discount: 0, total: 0, description: '' }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                let updatedItem = { ...item, [field]: value };

                if (field === 'productId') {
                    const prod = products.find(p => p.id === parseInt(value));
                    if (prod) {
                        updatedItem.rate = prod.purchasePrice || 0;
                        updatedItem.description = prod.description || '';
                    }
                }

                if (['qty', 'rate', 'tax', 'discount'].includes(field) || field === 'productId') {
                    const qty = parseFloat(updatedItem.qty) || 0;
                    const rate = parseFloat(updatedItem.rate) || 0;
                    const tax = parseFloat(updatedItem.tax) || 0;
                    const discount = parseFloat(updatedItem.discount) || 0;

                    const subtotal = qty * rate;
                    const taxable = subtotal - discount;
                    const taxAmount = (taxable * tax) / 100;

                    const totalVal = taxable + taxAmount;
                    updatedItem.total = isNaN(totalVal) ? 0 : totalVal;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        return items.reduce((acc, item) => {
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            const discount = parseFloat(item.discount) || 0;
            const subtotal = qty * rate;
            const tax = parseFloat(item.tax) || 0;
            const taxable = subtotal - discount;
            const taxAmount = (taxable * tax) / 100;

            acc.subTotal += subtotal;
            acc.discount += discount;
            acc.total += item.total;
            acc.tax += taxAmount;
            return acc;
        }, { subTotal: 0, tax: 0, discount: 0, total: 0 });
    };

    const totals = calculateTotals();

    const purchaseProcess = [
        { id: 'quotation', label: 'Quotation', icon: FileText, status: 'completed' },
        { id: 'purchase-order', label: 'Purchase Order', icon: ShoppingCart, status: 'completed' },
        { id: 'grn', label: 'Goods Receipt', icon: Truck, status: 'completed' },
        { id: 'bill', label: 'Bill', icon: Receipt, status: 'active' },
        { id: 'payment', label: 'Payment', icon: CreditCard, status: 'pending' },
    ];

    if (isViewMode && viewBill) {
        return (
            <div className="PBILL-page-full-view">
                <div className="PBILL-view-header no-print">
                    <button className="PBILL-back-btn" onClick={() => {
                        if (location.state && location.state.targetBillId) {
                            navigate(-1);
                        } else {
                            setIsViewMode(false);
                            setViewBill(null);
                            navigate('/company/purchases/bill', { replace: true, state: {} });
                        }
                    }}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="PBILL-view-actions">
                        <button className="PBILL-btn-print" onClick={handlePrint}>
                            <Printer size={18} /> Print
                        </button>
                    </div>
                </div>

                <div className="PBILL-view-content-pane printable-area">
                    <div className="PBILL-invoice-view-container" id="print-area">
                        <div
                            className={`PBILL-invoice-preview-container PBILL-template-${(companyDetails.template || 'newyork').toLowerCase().replace(/\s+/g, '')}`}
                            style={{ '--header-bg': companyDetails.color || '#004aad' }}
                        >
                            {/* Header Section */}
                            <div className="PBILL-invoice-header-wrapper">
                                <div className="PBILL-invoice-preview-header">
                                    <div className="PBILL-invoice-header-left">
                                        {companyDetails.logo ? (
                                            <img src={companyDetails.logo} alt="Company Logo" className="PBILL-invoice-logo-large" />
                                        ) : (
                                            <h2 style={{ color: companyDetails.color, margin: 0, textTransform: 'uppercase' }}>{companyDetails.name}</h2>
                                        )}

                                        <div className="PBILL-invoice-company-details">
                                            <strong>{companyDetails.name}</strong><br />
                                            {companyDetails.email}<br />
                                            {companyDetails.phone}<br />
                                            {companyDetails.address}
                                        </div>
                                    </div>
                                    <div className="PBILL-invoice-header-right">
                                        <div className="PBILL-invoice-title-large">PURCHASE BILL</div>
                                        <div className="PBILL-invoice-meta-info">
                                            <div className="PBILL-invoice-meta-row">
                                                <span className="PBILL-invoice-label">Bill No:</span> {viewBill.billNumber}
                                            </div>
                                            <div className="PBILL-invoice-meta-row">
                                                <span className="PBILL-invoice-label">Date:</span> {new Date(viewBill.date).toLocaleDateString()}
                                            </div>
                                            <div className="PBILL-invoice-meta-row">
                                                <span className="PBILL-invoice-label">Due Date:</span> {viewBill.dueDate ? new Date(viewBill.dueDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="PBILL-invoice-qr-box">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${viewBill.billNumber || 'Bill'}`} alt="QR" className="PBILL-invoice-qr-code" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses Section */}
                            <div className="PBILL-invoice-addresses">
                                <div className="PBILL-invoice-bill-to">
                                    <div className="PBILL-invoice-section-header">Vendor Details (From):</div>
                                    <div>{viewBill.vendor?.name || 'N/A'}</div>
                                    <div>{viewBill.vendor?.billingAddress || 'N/A'}</div>
                                    <div>
                                        {[viewBill.vendor?.city, viewBill.vendor?.state, viewBill.vendor?.zipCode].filter(Boolean).join(', ')}
                                    </div>
                                </div>
                                <div className="PBILL-invoice-ship-to" style={{ textAlign: 'right' }}>
                                    <div className="PBILL-invoice-section-header">Vendor Shipping Addr:</div>
                                    <div>{viewBill.vendor?.name || 'N/A'}</div>
                                    <div>{viewBill.vendor?.shippingAddress || viewBill.vendor?.billingAddress}</div>
                                    <div>
                                        {[viewBill.vendor?.city, viewBill.vendor?.state, viewBill.vendor?.zipCode].filter(Boolean).join(', ')}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="PBILL-invoice-table-preview">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th>Warehouse</th>
                                        <th style={{ textAlign: 'center' }}>Qty</th>
                                        <th style={{ textAlign: 'right' }}>Rate</th>
                                        <th style={{ textAlign: 'right' }}>Tax %</th>
                                        <th style={{ textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(viewBill.purchasebillitem || viewBill.items || []).map((item, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{item.product?.name || 'Unknown Product'}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{item.description}</div>
                                            </td>
                                            <td>{item.warehouse?.name || '-'}</td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                                            <td style={{ textAlign: 'right' }}>{item.taxRate}%</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals Section */}
                            <div className="PBILL-invoice-total-section">
                                <div className="PBILL-invoice-totals">
                                    <div className="PBILL-invoice-total-row">
                                        <span className="PBILL-invoice-label">Sub Total:</span>
                                        <span>{formatCurrency(viewBill.totalAmount - (viewBill.taxAmount || 0) + (viewBill.discountAmount || 0))}</span>
                                    </div>
                                    <div className="PBILL-invoice-total-row">
                                        <span className="PBILL-invoice-label">Discount:</span>
                                        <span style={{ color: '#ef4444' }}>- {formatCurrency(viewBill.discountAmount || 0)}</span>
                                    </div>
                                    <div className="PBILL-invoice-total-row">
                                        <span className="PBILL-invoice-label">Tax:</span>
                                        <span>+ {formatCurrency(viewBill.taxAmount || 0)}</span>
                                    </div>
                                    <div className="PBILL-invoice-total-final">
                                        <span className="PBILL-invoice-label">Total Amount:</span>
                                        <span className="PBILL-invoice-total-value">{formatCurrency(viewBill.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {viewBill.notes && (
                                <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <h3 className="PBILL-invoice-section-header">Notes</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{viewBill.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="PBILL-page">
            <div className="PBILL-header">
                <div>
                    <h1 className="PBILL-title">Purchase Bill</h1>
                    <p className="PBILL-subtitle">Record vendor bills and invoices</p>
                </div>
                <button className="PBILL-btn-add" onClick={handleAddNew}>
                    <Plus size={18} /> Create Bill
                </button>
            </div>

            <div className="PBILL-tracker-card">
                <div className="PBILL-tracker-wrapper">
                    {purchaseProcess.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className={`PBILL-tracker-step ${step.status}`}>
                                <div className="PBILL-step-icon-box">
                                    <step.icon size={20} />
                                </div>
                                <span className="PBILL-step-label">{step.label}</span>
                            </div>
                            {index < purchaseProcess.length - 1 && (
                                <div className={`PBILL-tracker-divider ${purchaseProcess[index + 1].status !== 'pending' ? 'active' : ''}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="PBILL-table-card">
                <div className="PBILL-table-container">
                    <table className="PBILL-table">
                        <thead>
                            <tr>
                                <th>BILL ID</th>
                                <th>PO REF</th>
                                <th>VENDOR</th>
                                <th>DATE</th>
                                <th>DUE DATE</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && bills.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                            ) : bills.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>No bills found</td></tr>
                            ) : (
                                bills.map(b => (
                                    <tr key={b.id}>
                                        <td className="PBILL-id-cell">{b.billNumber}</td>
                                        <td>{b.purchaseorder?.orderNumber || '-'}</td>
                                        <td>{b.vendor?.name}</td>
                                        <td>{new Date(b.date).toLocaleDateString()}</td>
                                        <td>{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '-'}</td>
                                        <td className="PBILL-amount-cell">{formatCurrency(b.totalAmount)}</td>
                                        <td>
                                            <span className={`PBILL-status-pill ${b.status?.toLowerCase()}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="PBILL-action-group">
                                                <button className="PBILL-btn-icon view" onClick={() => handleView(b)} title="View"><Eye size={16} /></button>
                                                <button className="PBILL-btn-icon edit" onClick={() => handleEdit(b.id)} title="Edit"><Pencil size={16} /></button>
                                                <button className="PBILL-btn-icon delete" onClick={() => handleDelete(b.id)} title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - ONLY FOR ADD/EDIT NOW */}
            {showAddModal && !isViewMode && (
                <div className="PBILL-modal-overlay">
                    <div className="PBILL-form-modal">
                        <div className="PBILL-modal-header no-print">
                            <div>
                                <h1 className="PBILL-modal-title">
                                    {editingId ? 'Edit Bill' : 'New Purchase Bill'}
                                </h1>
                                <p className="PBILL-modal-subtitle">Complete the fields below to finalize the bill</p>
                            </div>
                            <div className="PBILL-modal-actions">
                                <button className="PBILL-close-btn" onClick={() => setShowAddModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="PBILL-modal-body">
                            <div className="PBILL-form-scroll-area">
                                <div className="PBILL-form-header-grid">
                                    {/* ... Form Content starts here ... */}
                                    <div className="PBILL-company-info-section">
                                        <div className="PBILL-logo-uploader">
                                            {companyDetails.logo ? (
                                                <img src={companyDetails.logo} alt="Logo" />
                                            ) : (
                                                <div className="PBILL-logo-placeholder">
                                                    <Plus size={24} />
                                                    <span>Upload Logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="PBILL-company-inputs">
                                            <input
                                                type="text"
                                                className="PBILL-input-brand"
                                                value={companyDetails.name}
                                                onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                                                placeholder="Company Name"
                                            />
                                            <input
                                                type="text"
                                                className="PBILL-input-sub"
                                                value={companyDetails.address}
                                                onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                                                placeholder="Company Address"
                                            />
                                            <div className="PBILL-input-wrapper-row">
                                                <input
                                                    type="text"
                                                    className="PBILL-input-field"
                                                    value={companyDetails.email}
                                                    onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                                                    placeholder="Email Address"
                                                />
                                                <input
                                                    type="text"
                                                    className="PBILL-input-field"
                                                    value={companyDetails.phone}
                                                    onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
                                                    placeholder="Phone Number"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="PBILL-meta-config-card">
                                        <div className="PBILL-meta-field">
                                            <label>Bill Number</label>
                                            <input type="text" value={billMeta.manualNo || nextBillNumber} onChange={(e) => setBillMeta({ ...billMeta, manualNo: e.target.value })} placeholder="Auto-Generated" />
                                        </div>
                                        <div className="PBILL-meta-field">
                                            <label>Date</label>
                                            <input type="date" value={billMeta.date} onChange={(e) => setBillMeta({ ...billMeta, date: e.target.value })} />
                                        </div>
                                        <div className="PBILL-meta-field">
                                            <label>Due Date</label>
                                            <input type="date" value={billMeta.dueDate} onChange={(e) => setBillMeta({ ...billMeta, dueDate: e.target.value })} />
                                        </div>
                                        <div className="PBILL-status-indicator">UNPAID</div>
                                    </div>
                                </div>

                                <div className="PBILL-vendor-section">
                                    <div className="PBILL-section-header">
                                        <label className="PBILL-field-label">Bill To Vendor</label>
                                    </div>
                                    <div className="PBILL-vendor-selection-box">
                                        <select
                                            className="PBILL-select-vendor"
                                            value={vendorId}
                                            onChange={(e) => setVendorId(e.target.value)}
                                            disabled={!!sourceData}
                                        >
                                            <option value="">Choose a Vendor...</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="PBILL-vendor-info-grid">
                                        <div className="PBILL-info-field">
                                            <label>Billing Address</label>
                                            <input type="text" placeholder="Not Specified" value={vendors.find(v => v.id == vendorId)?.billingAddress || ''} readOnly />
                                        </div>
                                        <div className="PBILL-info-field">
                                            <label>Email</label>
                                            <input type="text" placeholder="not-found@vendor.com" value={vendors.find(v => v.id == vendorId)?.email || ''} readOnly />
                                        </div>
                                        <div className="PBILL-info-field">
                                            <label>Phone</label>
                                            <input type="text" placeholder="+00 00000 00000" value={vendors.find(v => v.id == vendorId)?.phone || ''} readOnly />
                                        </div>
                                    </div>
                                </div>

                                <div className="PBILL-items-section">
                                    <div className="PBILL-section-header">
                                        <h3 className="PBILL-inner-title">Line Items</h3>
                                        <button className="PBILL-btn-add-line" onClick={addItem}>
                                            <Plus size={16} /> Add Line Item
                                        </button>
                                    </div>
                                    <div className="PBILL-table-container">
                                        <table className="PBILL-form-table">
                                            <thead>
                                                <tr>
                                                    <th>Item Details</th>
                                                    <th>Warehouse</th>
                                                    <th className="PBILL-w-80">Qty</th>
                                                    <th className="PBILL-w-120">Rate</th>
                                                    <th className="PBILL-w-80">Tax %</th>
                                                    <th className="PBILL-w-100">Disc.</th>
                                                    <th className="PBILL-w-140">Amount</th>
                                                    <th className="PBILL-w-50"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(item => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <select
                                                                className="PBILL-item-select"
                                                                value={item.productId || ''}
                                                                onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                                                            >
                                                                <option value="">Search Product...</option>
                                                                {products.map(p => (
                                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="PBILL-item-select"
                                                                value={item.warehouseId || ''}
                                                                onChange={(e) => updateItem(item.id, 'warehouseId', e.target.value)}
                                                            >
                                                                <option value="">Search Warehouse...</option>
                                                                {warehouses.map(w => (
                                                                    <option key={w.id} value={w.id}>{w.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input type="number" className="PBILL-item-input center" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input type="number" className="PBILL-item-input right" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input type="number" className="PBILL-item-input center" value={item.tax} onChange={(e) => updateItem(item.id, 'tax', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <input type="number" className="PBILL-item-input center" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', e.target.value)} />
                                                        </td>
                                                        <td>
                                                            <div className="PBILL-item-total">{formatCurrency(item.total)}</div>
                                                        </td>
                                                        <td className="PBILL-text-center">
                                                            <button className="PBILL-btn-remove" onClick={() => removeItem(item.id)}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="PBILL-footer-details">
                                    <div className="PBILL-left-col">
                                        <div className="PBILL-footer-block">
                                            <h3 className="PBILL-inner-title">Bank Details</h3>
                                            <div className="PBILL-bank-input-grid">
                                                <div className="PBILL-info-field">
                                                    <label>Account Holder</label>
                                                    <input type="text" value={bankDetails.accountName} onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })} placeholder="Name on Account" />
                                                </div>
                                                <div className="PBILL-info-field">
                                                    <label>Account No.</label>
                                                    <input type="text" value={bankDetails.accountNo} onChange={e => setBankDetails({ ...bankDetails, accountNo: e.target.value })} placeholder="0000 0000 0000" />
                                                </div>
                                                <div className="PBILL-info-field">
                                                    <label>Bank Name</label>
                                                    <input type="text" value={bankDetails.bankName} onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })} placeholder="HDFC / SBI / etc." />
                                                </div>
                                                <div className="PBILL-info-field">
                                                    <label>IFSC Code</label>
                                                    <input type="text" value={bankDetails.ifsc} onChange={e => setBankDetails({ ...bankDetails, ifsc: e.target.value })} placeholder="HDFC0001234" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="PBILL-footer-block">
                                            <h3 className="PBILL-inner-title">Additional Notes</h3>
                                            <textarea
                                                className="PBILL-notes-area"
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Terms, internal records, or shipping instructions..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="PBILL-right-col">
                                        <div className="PBILL-summary-card">
                                            <div className="PBILL-summary-row">
                                                <span>Sub Total</span>
                                                <span>{formatCurrency(totals.subTotal)}</span>
                                            </div>
                                            <div className="PBILL-summary-row PBILL-discount">
                                                <span>Total Discount</span>
                                                <span>-{formatCurrency(totals.discount)}</span>
                                            </div>
                                            <div className="PBILL-summary-row">
                                                <span>Tax Amount</span>
                                                <span>{formatCurrency(totals.tax)}</span>
                                            </div>
                                            <div className="PBILL-summary-row PBILL-grand-total">
                                                <span>Grand Total</span>
                                                <span>{formatCurrency(totals.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="PBILL-form-actions">
                                    <button className="PBILL-btn-cancel" onClick={() => setShowAddModal(false)}>Discard changes</button>
                                    <button className="PBILL-btn-primary" onClick={handleSave}>
                                        {editingId ? 'Update Bill' : 'Confirm & Save Bill'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Source Selection Modal */}
            {
                showSourceModal && (
                    <div className="PBILL-modal-overlay">
                        <div className="PBILL-source-modal">
                            <div className="PBILL-source-header">
                                <h2 className="PBILL-source-title">{sourceStep === 'type' ? 'Select Invoice Source' : (selectedSourceType === 'po' ? 'Pick a Purchase Order' : 'Pick a Goods Receipt')}</h2>
                                <button className="PBILL-close-btn" onClick={() => setShowSourceModal(false)}><X size={18} /></button>
                            </div>
                            <div className="PBILL-source-body">
                                {sourceStep === 'type' ? (
                                    <div className="PBILL-source-grid">
                                        <div className="PBILL-src-card PBILL-manual" onClick={() => handleSourceTypeSelect('manual')}>
                                            <div className="PBILL-src-icon"><FilePlus size={24} /></div>
                                            <div className="PBILL-src-text">
                                                <h4>Direct Billing</h4>
                                                <p>Create a bill from scratch manually</p>
                                            </div>
                                        </div>
                                        <div className="PBILL-src-card PBILL-po" onClick={() => handleSourceTypeSelect('po')}>
                                            <div className="PBILL-src-icon"><ShoppingCart size={24} /></div>
                                            <div className="PBILL-src-text">
                                                <h4>From Purchase Order</h4>
                                                <p>Pull details from an existing PO</p>
                                            </div>
                                        </div>
                                        <div className="PBILL-src-card PBILL-grn" onClick={() => handleSourceTypeSelect('grn')}>
                                            <div className="PBILL-src-icon"><Truck size={24} /></div>
                                            <div className="PBILL-src-text">
                                                <h4>From Goods Receipt</h4>
                                                <p>Pull details from received goods</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="PBILL-doc-list-wrapper">
                                        {sourceDocs.length === 0 ? (
                                            <div className="PBILL-empty-state">No available documents found.</div>
                                        ) : (
                                            <div className="PBILL-doc-scroll">
                                                {sourceDocs.map(doc => (
                                                    <div key={doc.id} className="PBILL-doc-item" onClick={() => handleSourceDocSelect(doc)}>
                                                        <div className="PBILL-doc-main">
                                                            <span className="PBILL-doc-ref">{doc.poNumber || doc.grnNumber || doc.billNumber || doc.id}</span>
                                                            <span className="PBILL-doc-date">{new Date(doc.createdAt || doc.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="PBILL-doc-sub">
                                                            <span>{doc.vendor?.name || 'Unknown Vendor'}</span>
                                                            <span className="PBILL-doc-price">{formatCurrency(doc.totalAmount || 0)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button className="PBILL-back-link" onClick={() => setSourceStep('type')}>
                                            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Selection
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="PBILL-modal-overlay">
                        <div className="PBILL-delete-card">
                            <div className="PBILL-delete-icon"><Trash2 size={32} /></div>
                            <h3>Permanently Delete Bill?</h3>
                            <p>This action will remove the record and cannot be reversed. Linked ledger entries will be updated accordingly.</p>
                            <div className="PBILL-delete-actions">
                                <button className="PBILL-btn-alt" onClick={() => setShowDeleteConfirm(false)}>Keep it</button>
                                <button className="PBILL-btn-danger" onClick={confirmDelete}>Yes, Delete Bill</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PurchaseBill;
