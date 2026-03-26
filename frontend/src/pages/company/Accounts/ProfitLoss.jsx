import React, { useState, useEffect } from 'react';
import { FaChartLine, FaArrowTrendDown, FaArrowTrendUp, FaMoneyBillWave, FaLandmark, FaCheckDouble } from 'react-icons/fa6';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';
import './Accounts.css';

const ProfitLossAccount = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(''); // Not used by backend, but kept for potential future use
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // Fetch Data from API
  useEffect(() => {
    const fetchProfitLossData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/reports/profit-loss', {
          params: { year: parseInt(year) }
        });
        
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching P&L data:', error);
        toast.error('Failed to load Profit & Loss data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfitLossData();
  }, [year]);

  // Format currency
  const formatCurrency = (amount) => {
    return `R${parseFloat(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Prepare summary data
  const summaryData = data ? {
    revenue: formatCurrency(data.summary.totalIncome),
    expenses: formatCurrency(data.summary.totalExpense),
    grossProfit: formatCurrency(data.summary.totalIncome - data.summary.totalExpense), // Simplified
    netProfit: formatCurrency(data.summary.netProfit),
  } : {
    revenue: 'R0.00',
    expenses: 'R0.00',
    grossProfit: 'R0.00',
    netProfit: 'R0.00'
  };

  // Prepare detailed breakdown
  const salesData = data ? [
    ...data.incomeCategories.map(cat => ({ label: cat.name, amount: formatCurrency(cat.value), isTotal: false })),
    ...data.expenseCategories.map(cat => ({ label: cat.name, amount: formatCurrency(cat.value), isTotal: false })),
    { label: 'Net Profit', amount: formatCurrency(data.summary.netProfit), isTotal: true, icon: true },
  ] : [];

  return (
    <div className="ac-container">
      {/* Header Card */}
      <div className="ac-pl-header-card">
        <div className="ac-pl-header-left">
          <h2><FaChartLine /> Profit & Loss Statement</h2>
          <p>Financial Year {year}</p>
        </div>
        <div className="ac-pl-filters">
          <div className="ac-pl-filter-group">
            <span className="ac-pl-filter-label">Year:</span>
            <select
              className="ac-pl-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ac-pl-cards-grid">
        <div className="ac-pl-card ac-card-revenue">
          <div className="ac-pl-card-title">
            <FaMoneyBillWave /> Total Revenue
          </div>
          <div className="ac-pl-card-amount">
            {summaryData.revenue}
          </div>
        </div>

        <div className="ac-pl-card ac-card-expense">
          <div className="ac-pl-card-title">
            <FaArrowTrendDown /> Total Expenses
          </div>
          <div className="ac-pl-card-amount">
            {summaryData.expenses}
          </div>
        </div>

        <div className="ac-pl-card ac-card-gross">
          <div className="ac-pl-card-title">
            <FaArrowTrendUp /> Gross Profit
          </div>
          <div className="ac-pl-card-amount">
            {summaryData.grossProfit}
          </div>
        </div>

        <div className="ac-pl-card ac-card-net">
          <div className="ac-pl-card-title">
            <FaLandmark /> Net Profit
          </div>
          <div className="ac-pl-card-amount">
            {summaryData.netProfit}
          </div>
        </div>
      </div>

      {/* Detailed Summary List */}
      <div className="ac-pl-summary-section">
        <div className="ac-pl-section-title">Summary</div>
        {loading ? (
          <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
            Loading profit & loss data...
          </div>
        ) : salesData.length > 0 ? (
          <div className="ac-pl-list">
            {salesData.map((item, index) => (
              <div
                key={index}
                className={`ac-pl-list-item ${item.isTotal ? 'highlight' : ''}`}
              >
                <div className="ac-pl-icon-box">
                  {item.icon && <FaCheckDouble />} {item.label}
                </div>
                <div className="ac-pl-amount">
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>
            No data available for this period
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitLossAccount;
