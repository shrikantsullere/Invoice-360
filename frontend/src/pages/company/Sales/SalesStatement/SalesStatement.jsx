import React, { useState, useEffect } from 'react';
import {
  FileText, Search, Download, Printer, Filter,
  Calendar, User, CreditCard, ChevronDown, Eye,
  Mail, MessageCircle, FileSpreadsheet, RefreshCcw
} from 'lucide-react';
import salesStatementService from '../../../../services/salesStatementService';
import customerService from '../../../../services/customerService';
import toast from 'react-hot-toast';
import './SalesStatement.css';

const SalesStatement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPaid: 0,
    totalPending: 0,
    totalInvoices: 0
  });
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerId: 'all',
    status: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchSalesStatement();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers();
      // The backend returns { success: true, data: [...] }
      const customersData = response.data || [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchSalesStatement = async () => {
    setLoading(true);
    try {
      const response = await salesStatementService.getSalesStatement(filters);
      setData(response.data);
      setSummary(response.summary);
    } catch (error) {
      console.error('Error fetching sales statement:', error);
      toast.error('Failed to load sales statement');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    fetchSalesStatement();
  };

  const resetFilters = () => {
    const resetData = {
      startDate: '',
      endDate: '',
      customerId: 'all',
      status: 'all',
      searchTerm: ''
    };
    setFilters(resetData);
    // We use the resetData directly because state update is async
    fetchSalesStatement(resetData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'status-paid';
      case 'PARTIAL': return 'status-partial';
      case 'UNPAID': return 'status-unpaid';
      case 'OVERDUE': return 'status-overdue';
      default: return 'status-default';
    }
  };

  return (
    <div className="sales-statement-container">
      {/* Header section */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Statement</h1>
          <p className="page-subtitle">Track and analyze your sales performance across customers</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={18} />
            <span>Print</span>
          </button>
          <button className="btn btn-secondary">
            <FileSpreadsheet size={18} />
            <span>Excel</span>
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="card-icon bg-blue-soft">
            <FileText className="text-blue" size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Invoices</span>
            <h3 className="card-value">{summary.totalInvoices}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-green-soft">
            <RefreshCcw className="text-green" size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Sales</span>
            <h3 className="card-value">{formatCurrency(summary.totalSales)}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-purple-soft">
            <CreditCard className="text-purple" size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Paid</span>
            <h3 className="card-value">{formatCurrency(summary.totalPaid)}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-orange-soft">
            <Calendar className="text-orange" size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Pending</span>
            <h3 className="card-value">{formatCurrency(summary.totalPending)}</h3>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Start Date</label>
            <div className="input-with-icon">
              <Calendar className="input-icon" size={16} />
              <input
                type="date"
                name="startDate"
                className="filter-input"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">End Date</label>
            <div className="input-with-icon">
              <Calendar className="input-icon" size={16} />
              <input
                type="date"
                name="endDate"
                className="filter-input"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Customer</label>
            <div className="input-with-icon">
              <User className="input-icon" size={16} />
              <select
                name="customerId"
                className="filter-input"
                value={filters.customerId}
                onChange={handleFilterChange}
              >
                <option value="all">All Customers</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="input-with-icon">
              <Filter className="input-icon" size={16} />
              <select
                name="status"
                className="filter-input"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="all">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>
          <div className="filter-group col-span-2">
            <label className="filter-label">Search</label>
            <div className="input-with-icon">
              <Search className="input-icon" size={16} />
              <input
                type="text"
                name="searchTerm"
                placeholder="Search by Invoice No..."
                className="filter-input"
                value={filters.searchTerm}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-secondary" onClick={resetFilters}>Reset</button>
          <button className="btn btn-primary" onClick={applyFilters}>
            <Filter size={18} />
            Filter Data
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sales statement...</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="statement-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.filter(item =>
                    item.invoiceNo.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                    item.customer.toLowerCase().includes(filters.searchTerm.toLowerCase())
                  ).map((item, index) => (
                    <tr key={item.id}>
                      <td className="font-semibold">{item.invoiceNo}</td>
                      <td>{item.customer}</td>
                      <td>{formatDate(item.date)}</td>
                      <td className="font-medium">{formatCurrency(item.amount)}</td>
                      <td className="text-green font-medium">{formatCurrency(item.paid)}</td>
                      <td className="text-red font-medium">{formatCurrency(item.balance)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn text-blue" title="View">
                            <Eye size={16} />
                          </button>
                          <button className="action-btn text-purple" title="Download">
                            <Download size={16} />
                          </button>
                          <button className="action-btn text-orange" title="Email">
                            <Mail size={16} />
                          </button>
                          <button className="action-btn text-green" title="WhatsApp">
                            <MessageCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      No sales records found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesStatement;
