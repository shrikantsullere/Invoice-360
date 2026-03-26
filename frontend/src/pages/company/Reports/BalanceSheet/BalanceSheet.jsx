import React, { useState, useEffect } from 'react';
import {
    Calendar, Download, Printer, Share2,
    ChevronDown, ChevronRight, TrendingUp
} from 'lucide-react';
import './BalanceSheet.css';
import axiosInstance from '../../../../api/axiosInstance';
import GetCompanyId from '../../../../api/GetCompanyId';

const BalanceSheet = () => {
    const [expandedSections, setExpandedSections] = useState({
        currentAssets: true,
        fixedAssets: true,
        currentLiabilities: true,
        longTermLiabilities: true,
        equity: true
    });

    const [balanceData, setBalanceData] = useState({
        assets: { current: [], fixed: [], total: 0 },
        liabilities: { current: [], longTerm: [], total: 0 },
        equity: { items: [], total: 0 },
        netProfit: 0
    });

    // Date filter state
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const [loading, setLoading] = useState(true);

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
        fetchBalanceSheet();
    }, [asOfDate]);

    const fetchBalanceSheet = async () => {
        try {
            setLoading(true);
            const companyId = GetCompanyId();
            if (companyId) {
                const response = await axiosInstance.get(`/reports/balance-sheet?companyId=${companyId}&asOfDate=${asOfDate}`);
                if (response.data.success) {
                    setBalanceData(response.data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching balance sheet:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculations - Data comes pre-aggregated but we might want frontend sums for display logic if needed.
    // However, backend sends: { assets: { current: [], fixed: [], total: ... }, liabilities: ..., equity: ... }
    // Let's use backend totals if available, or reduce locally if preferred.
    // The backend sends 'total' for each main category.
    // We can compute sub-totals.

    const totalCurrentAssets = balanceData.assets.current.reduce((acc, item) => acc + item.value, 0);
    const totalFixedAssets = balanceData.assets.fixed.reduce((acc, item) => acc + item.value, 0);

    // Note: If backend categorizes correctly, totalAssets should equal CURRENT + FIXED
    const totalAssets = balanceData.assets.total;

    // Re-calculating to ensure strict UI consistency
    const calcTotalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = balanceData.liabilities.current.reduce((acc, item) => acc + item.value, 0);
    const totalLongTermLiabilities = balanceData.liabilities.longTerm.reduce((acc, item) => acc + item.value, 0);
    const totalLiabilities = balanceData.liabilities.total;

    const totalEquity = balanceData.equity.total;
    const totalLiabilitiesEquity = totalLiabilities + totalEquity;

    // Helper Components for clean render
    const SectionHeader = ({ title, sectionKey, total, expanded, onToggle }) => (
        <div className="bs-section-header" onClick={() => onToggle(sectionKey)}>
            <div className="bs-flex-center">
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="bs-section-title-text">{title}</span>
            </div>
            <span className="bs-section-total">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
    );

    const RowItem = ({ item }) => (
        <div className="bs-row">
            <span className="bs-row-name">{item.name}</span>
            <span className="bs-row-value">₹{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
    );

    if (loading) return <div className="p-8 text-center">Loading Balance Sheet...</div>;

    return (
        <div className="bs-page">
            <div className="bs-header">
                <div>
                    <h1 className="bs-title">Balance Sheet</h1>
                    <p className="bs-subtitle">Statement of financial position as of Today</p>
                </div>
                <div className="bs-actions">
                    <div className="bs-date-wrapper">
                        <Calendar size={16} />
                        <span className="text-gray-500 mr-2">As of:</span>
                        <input
                            type="date"
                            className="bg-transparent border-none outline-none text-sm font-medium text-slate-600"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                        />
                    </div>
                    <button className="bs-btn-icon" title="Print"><Printer size={18} /></button>
                    <button className="bs-btn-icon" title="Share"><Share2 size={18} /></button>
                    <button className="bs-btn-primary"><Download size={18} /> Export PDF</button>
                </div>
            </div>

            <div className="bs-sheet-container">
                {/* Assets Column */}
                <div className="bs-column">
                    <h2 className="bs-col-header assets">Assets</h2>

                    <div className="bs-card">
                        <SectionHeader
                            title="Current Assets"
                            sectionKey="currentAssets"
                            total={totalCurrentAssets}
                            expanded={expandedSections.currentAssets}
                            onToggle={toggleSection}
                        />
                        {expandedSections.currentAssets && (
                            <div className="bs-section-content">
                                {balanceData.assets.current.length > 0 ? (
                                    balanceData.assets.current.map((item, idx) => <RowItem key={idx} item={item} />)
                                ) : <div className="text-gray-400 italic pl-8 py-1">No current assets</div>}
                            </div>
                        )}

                        <div className="bs-divider"></div>

                        <SectionHeader
                            title="Fixed Assets"
                            sectionKey="fixedAssets"
                            total={totalFixedAssets}
                            expanded={expandedSections.fixedAssets}
                            onToggle={toggleSection}
                        />
                        {expandedSections.fixedAssets && (
                            <div className="bs-section-content">
                                {balanceData.assets.fixed.length > 0 ? (
                                    balanceData.assets.fixed.map((item, idx) => <RowItem key={idx} item={item} />)
                                ) : <div className="text-gray-400 italic pl-8 py-1">No fixed assets</div>}
                            </div>
                        )}

                        <div className="bs-total-row main">
                            <div className="bs-row-line top">
                                <span className="bs-label-total">Total</span>
                                <span className="bs-total-amount">₹{calcTotalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="bs-row-line bottom">
                                <span className="bs-label-section">Assets</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div className="bs-column">
                    <h2 className="bs-col-header liabilities">Liabilities & Equity</h2>

                    <div className="bs-card">
                        <SectionHeader
                            title="Current Liabilities"
                            sectionKey="currentLiabilities"
                            total={totalCurrentLiabilities}
                            expanded={expandedSections.currentLiabilities}
                            onToggle={toggleSection}
                        />
                        {expandedSections.currentLiabilities && (
                            <div className="bs-section-content">
                                {balanceData.liabilities.current.length > 0 ? (
                                    balanceData.liabilities.current.map((item, idx) => <RowItem key={idx} item={item} />)
                                ) : <div className="text-gray-400 italic pl-8 py-1">No current liabilities</div>}
                            </div>
                        )}

                        <SectionHeader
                            title="Long-term Liabilities"
                            sectionKey="longTermLiabilities"
                            total={totalLongTermLiabilities}
                            expanded={expandedSections.longTermLiabilities} // NOTE: Ensure this key matches state
                            onToggle={toggleSection}
                        />
                        <div className="bs-section-content">
                            {expandedSections.longTermLiabilities !== false && ( /* Handle implicit expansion or check keys */
                                balanceData.liabilities.longTerm.length > 0 ? (
                                    balanceData.liabilities.longTerm.map((item, idx) => <RowItem key={idx} item={item} />)
                                ) : <div className="text-gray-400 italic pl-8 py-1">No long-term liabilities</div>
                            )}
                        </div>

                        <div className="bs-total-row sub">
                            <span>Total Liabilities</span>
                            <span>₹{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="bs-divider"></div>

                        <SectionHeader
                            title="Equity"
                            sectionKey="equity"
                            total={totalEquity}
                            expanded={expandedSections.equity}
                            onToggle={toggleSection}
                        />
                        {expandedSections.equity && (
                            <div className="bs-section-content">
                                {balanceData.equity.items.map((item, idx) => <RowItem key={idx} item={item} />)}
                            </div>
                        )}

                        <div className="bs-total-row main">
                            <div className="bs-row-line top">
                                <span className="bs-label-total">Total</span>
                                <span className="bs-total-amount">₹{totalLiabilitiesEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="bs-row-line bottom">
                                <span className="bs-label-section">Liabilities & Equity</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Check Balance Status */}
            <div className={`bs-status ${calcTotalAssets === totalLiabilitiesEquity ? 'status-balanced' : 'status-unbalanced'}`}>
                {calcTotalAssets === totalLiabilitiesEquity ? (
                    <>
                        <div className="bs-status-icon success"><TrendingUp size={20} /></div>
                        <div className="bs-status-text">
                            <h4>Books are Balanced</h4>
                            <p>Total Assets align perfectly with Total Liabilities & Equity.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bs-status-icon error">!</div>
                        <div className="bs-status-text">
                            <h4>Discrepancy Detected</h4>
                            <p>Assets do not equal Liabilities + Equity. Please review entries.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BalanceSheet;
