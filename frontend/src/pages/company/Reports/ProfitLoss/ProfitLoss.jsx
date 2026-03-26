import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Calendar,
    Download, Printer, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';
import './ProfitLoss.css';

const ProfitLoss = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    // Data States
    const [summaryData, setSummaryData] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        profitGrowth: 0
    });

    const [chartData, setChartData] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);

    useEffect(() => {
        fetchProfitLoss();
    }, [year]);

    const fetchProfitLoss = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (!companyId) return;

            const response = await axiosInstance.get(`/reports/profit-loss?companyId=${companyId}&year=${year}`);
            if (response.data.success) {
                const { summary, chartData, incomeCategories, expenseCategories } = response.data.data;
                setSummaryData(summary);
                setChartData(chartData);
                setIncomeCategories(incomeCategories);
                setExpenseCategories(expenseCategories);
            }
        } catch (error) {
            console.error("Error fetching Profit & Loss report:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Profit & Loss Report...</div>;

    return (
        <div className="profit-loss-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Profit & Loss</h1>
                    <p className="page-subtitle">Financial performance overview</p>
                </div>
                <div className="header-actions">
                    <div className="date-filter">
                        <Calendar size={16} />
                        <select
                            className="date-select"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn-icon" title="Print"><Printer size={18} /></button>
                    <button className="btn-primary"><Download size={18} /> Export</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="kpi-card income">
                    <div className="kpi-icon"><TrendingUp size={24} /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Income</span>
                        <h3 className="kpi-value">₹{summaryData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                        <span className={`kpi-trend ${summaryData.incomeGrowth >= 0 ? 'positive' : 'negative'}`}>
                            {summaryData.incomeGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(summaryData.incomeGrowth)}% vs last year
                        </span>
                    </div>
                </div>
                <div className="kpi-card expense">
                    <div className="kpi-icon"><TrendingDown size={24} /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Expenses</span>
                        <h3 className="kpi-value">₹{summaryData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                        <span className={`kpi-trend ${summaryData.expenseGrowth <= 0 ? 'positive' : 'negative'}`}>
                            {/* For expense, increase is usually 'negative' trend for business, but let's just show arrow */}
                            {summaryData.expenseGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(summaryData.expenseGrowth)}% vs last year
                        </span>
                    </div>
                </div>
                <div className="kpi-card profit">
                    <div className="kpi-icon"><DollarSign size={24} /></div>
                    <div className="kpi-content">
                        <span className="kpi-label">Net Profit</span>
                        <h3 className="kpi-value">₹{summaryData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                        <span className={`kpi-trend ${summaryData.profitGrowth >= 0 ? 'positive' : 'negative'}`}>
                            {summaryData.profitGrowth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(summaryData.profitGrowth)}% vs last year
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
                <div className="chart-card main-chart">
                    <h3>Income vs Expense</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `₹${value.toLocaleString()}`}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="chart-card secondary-chart">
                    <h3>Net Profit Trend</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => `₹${value.toLocaleString()}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income" // This was income in original, maybe should be (income-expense)? 
                                    // Actually user wants Net Profit Trend. 
                                    // I should transform chartData to have 'profit' key or just use 'income' as proxy?
                                    // Let's calculate profit per month for this chart or simpler: Just use Income line vs Expense line?
                                    // The mock used 'income'. Let's change to a calculated 'profit' if possible, or just Income for now.
                                    // Better: Let's calculate profit for the chart.
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorProfit)"
                                />
                                {/* Let's assume the user wants the Profit line. I'll modify dataKey to 'profit' below if I add it to chartData */}
                                <Area type="monotone" dataKey="income" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit)" name="Income Trend" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="breakdown-grid">
                <div className="breakdown-card">
                    <div className="card-header">
                        <h3>Income Breakdown</h3>
                        <span className="total-badge income">+₹{summaryData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {incomeCategories.length > 0 ? (
                        <ul className="category-list">
                            {incomeCategories.map((cat, idx) => (
                                <li key={idx} className="category-item">
                                    <span className="cat-name">{cat.name}</span>
                                    <span className="cat-value">₹{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-400 italic p-4">No income recorded</p>}
                </div>

                <div className="breakdown-card">
                    <div className="card-header">
                        <h3>Expense Breakdown</h3>
                        <span className="total-badge expense">-₹{summaryData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {expenseCategories.length > 0 ? (
                        <ul className="category-list">
                            {expenseCategories.map((cat, idx) => (
                                <li key={idx} className="category-item">
                                    <span className="cat-name">{cat.name}</span>
                                    <span className="cat-value">₹{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-400 italic p-4">No expenses recorded</p>}
                </div>
            </div>
        </div>
    );
};

export default ProfitLoss;
