import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, Building2, Ticket, CreditCard, Key,
    Users, ShoppingCart, Truck, FileText, ClipboardList,
    BarChart3, Settings, ChevronDown, ChevronRight, Box,
    Calculator, Receipt, UserCog, Banknote, Scale, Coins, PieChart, Calendar
} from 'lucide-react';
import './Sidebar.css';
import fullLogo from '../../assets/Images/image.png';
import circleLogo from '../../assets/Images/image.png';

const Sidebar = ({ isOpen, role = 'superadmin', permissions = [], isAdmin = false, onItemClick = () => { } }) => {
    const location = useLocation();
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    // ... menuItems definition ...

    // ... hasPermission function ...

    const menuItems = {
        superadmin: [
            { path: '/superadmin/dashboard', label: 'Dashboard', icon: Home },
            { path: '/superadmin/company', label: 'Company', icon: Building2 },
            { path: '/superadmin/plan', label: 'Plans & Pricing', icon: Ticket },
            { path: '/superadmin/plan-requests', label: 'Request Plan', icon: ClipboardList },
            { path: '/superadmin/payments', label: 'Payments', icon: CreditCard },
            { path: '/superadmin/passwords', label: 'Manage Passwords', icon: Key },
        ],
        company: [
            { path: '/company/dashboard', label: 'Dashboard', icon: Home, perm: 'show dashboard' },
            {
                label: 'User Management',
                icon: Users,
                perm: 'manage user', // Or check subitems
                subItems: [
                    { path: '/company/users/list', label: 'Users', perm: 'manage user' },
                    { path: '/company/users/roles', label: 'Roles & Permissions', perm: 'manage role' },

                ]
            },
            {
                label: 'Client',
                icon: Users,
                subItems: [
                    { path: '/company/client/new', label: 'New Client' },
                    { path: '/company/client/all', label: 'All Client' },
                ]
            },
            {
                label: 'Sales',
                icon: ShoppingCart,
                perm: 'show sales',
                subItems: [
                    { path: '/company/sales/quotation', label: 'Quotation', perm: 'show sales' },
                    { path: '/company/sales/order', label: 'Sales Order', perm: 'show sales' },
                    // { path: '/company/sales/challan', label: 'Delivery Challan', perm: 'show sales' },
                    { path: '/company/sales/invoice', label: 'Invoice', perm: 'show sales' },
                    { path: '/company/sales/payment', label: 'Payment', perm: 'show sales' },
                    { path: '/company/sales/statement', label: 'Sales Statement', perm: 'show sales' },
                    { path: '/company/sales/return', label: 'Sales Return', perm: 'show sales' },
                ]
            },
            {
                label: 'Purchases',
                icon: Truck,
                perm: 'manage purchases',
                subItems: [
                    { path: '/company/purchases/quotation', label: 'Purchase Quotation', perm: 'manage purchases' },
                    { path: '/company/purchases/order', label: 'Purchase Order', perm: 'manage purchases' },
                    { path: '/company/purchases/receipt', label: 'Goods Receipt', perm: 'manage purchases' },
                    { path: '/company/purchases/bill', label: 'Bill', perm: 'manage purchases' },
                    { path: '/company/purchases/payment', label: 'Payment', perm: 'manage purchases' },
                    { path: '/company/purchases/return', label: 'Purchase Return', perm: 'manage purchases' },
                ]
            },
            {
                label: 'Account',
                icon: Calculator,
                perm: 'manage accounts',
                subItems: [
                    { path: '/company/accounts/delivery-note', label: 'Delivery Note', perm: 'manage accounts' },
                    { path: '/company/accounts/credit-note', label: 'Credit Note', perm: 'manage accounts' },
                    { path: '/company/accounts/charts', label: 'Charts of Accounts', perm: 'manage accounts', },
                    { path: '/company/accounts/customers', label: 'Customers/Debtors', perm: 'manage accounts', },
                    { path: '/company/accounts/vendors', label: 'Vendors/Creditors', perm: 'manage accounts', },
                    { path: '/company/accounts/cash-flow', label: 'Cash Flow', perm: 'manage accounts', },
                    { path: '/company/accounts/profit-loss', label: 'Profit & Loss', perm: 'manage accounts', },
                    { path: '/company/accounts/balance-sheet', label: 'Balance Sheet', perm: 'manage accounts', },
                    { path: '/company/accounts/expenses', label: 'Expenses', perm: 'manage accounts', },
                    { path: '/company/accounts/vat-report', label: 'Vat Report', perm: 'manage accounts', },
                    { path: '/company/accounts/tax-report', label: 'Tax Report', perm: 'manage accounts', },
                ]
            },
            {
                label: 'Inventory',
                icon: Box,
                perm: 'manage inventory',
                subItems: [
                    { path: '/company/inventory/warehouse', label: 'Warehouse', perm: 'manage inventory' },
                    { path: '/company/inventory/products', label: 'Product & Inventory', perm: 'manage inventory' },
                    { path: '/company/inventory/services', label: 'Service', perm: 'manage inventory' },


                    { path: '/company/inventory/transfer', label: 'StockTransfer', perm: 'manage inventory' },
                    { path: '/company/inventory/uom', label: 'Unit of measure', perm: 'manage inventory' },
                    { path: '/company/inventory/adjustment', label: 'Inventory Adjustment', perm: 'manage inventory' },
                ]
            },
            {
                label: 'Payroll',
                icon: Banknote, // Using Banknote as a proxy for Payroll icon
                perm: 'manage payroll',
                subItems: [
                    { path: '/company/payroll/employee', label: 'Employee Management', perm: 'manage payroll' },
                    { path: '/company/payroll/salary-structure', label: 'Salary Structure', perm: 'manage payroll' },
                    { path: '/company/payroll/generate', label: 'Generate Payroll', perm: 'manage payroll' },
                    { path: '/company/payroll/payslip-report', label: 'Payslip Report', perm: 'manage payroll' },
                    { path: '/company/payroll/payroll-report', label: 'Payroll Report', perm: 'manage payroll' },
                    { path: '/company/payroll/setting', label: 'Payroll Setting', perm: 'manage payroll' },
                ]
            },
            {
                label: 'Reports',
                icon: BarChart3,
                perm: 'manage reports',
                subItems: [
                    { path: '/company/reports/sales', label: 'Sales Report', perm: 'manage reports' },
                    { path: '/company/reports/purchase', label: 'Purchase Report', perm: 'manage reports' },
                    { path: '/company/reports/pos', label: 'POS Report', perm: 'manage reports' },
                    // { path: '/company/reports/tax', label: 'Tax Report', perm: 'manage reports' },
                    { path: '/company/reports/inventory-summary', label: 'Inventory Summary', perm: 'manage reports' },
                    // { path: '/company/reports/balance-sheet', label: 'Balance Sheet', perm: 'manage reports' },
                    // { path: '/company/reports/cash-flow', label: 'Cash Flow', perm: 'manage reports' },
                    // { path: '/company/reports/profit-loss', label: 'Profit & Loss', perm: 'manage reports' },
                    // { path: '/company/reports/vat', label: 'Vat Report', perm: 'manage reports' },
                    { path: '/company/reports/daybook', label: 'DayBook', perm: 'manage reports' },
                    { path: '/company/reports/journal', label: 'Journal Entries', perm: 'manage reports' },
                    { path: '/company/reports/ledger', label: 'Ledger', perm: 'manage reports' },
                    { path: '/company/reports/trial-balance', label: 'Trial Balance', perm: 'manage reports' },
                    // { path: '/company/accounts/transactions', label: 'All Transaction', perm: 'manage reports' },
                ]
            },

            {
                label: 'Settings',
                icon: Settings,
                perm: 'manage settings',
                subItems: [
                    { path: '/company/settings/info', label: 'Company Info', perm: 'manage settings' },
                    // { path: '/company/settings/password-requests', label: 'Password Requests', perm: 'manage settings' },
                ]
            }
        ]
    };

    const hasPermission = (item) => {
        if (role === 'superadmin' || isAdmin) return true;

        if (!item.perm && !item.subItems) return true;

        if (item.subItems) {
            if (item.perm && !isAdmin && !permissions.includes(item.perm)) return false;

            const visibleChildren = item.subItems.filter(sub =>
                isAdmin || !sub.perm || permissions.includes(sub.perm)
            );
            return visibleChildren.length > 0;
        }

        return permissions.includes(item.perm);
    };

    const renderMenu = (items) => {
        return items.map((item, index) => {
            if (!hasPermission(item)) return null;

            if (item.subItems) {
                const visibleSubItems = item.subItems.filter(sub =>
                    isAdmin || !sub.perm || permissions.includes(sub.perm)
                );

                if (visibleSubItems.length === 0) return null;

                const isExpanded = expandedGroups[item.label];
                const isActive = visibleSubItems.some(sub => location.pathname.startsWith(sub.path));

                return (
                    <div key={index} className="menu-group">
                        <div
                            className={`menu-item has-submenu ${isActive ? 'active-parent' : ''}`}
                            onClick={() => toggleGroup(item.label)}
                        >
                            <div className="icon-label">
                                <div className="menu-icon-wrapper">
                                    {item.icon && <item.icon size={18} />}
                                </div>
                                <span className="menu-text">{item.label}</span>
                            </div>
                            <div className="chevron-wrapper">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        </div>

                        <div className={`submenu ${isExpanded ? 'expanded' : ''}`}>
                            {visibleSubItems.map((sub, subIndex) => (
                                <NavLink
                                    key={subIndex}
                                    to={sub.path}
                                    className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    onClick={onItemClick}
                                >
                                    {sub.icon && <sub.icon size={16} />}
                                    {sub.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                );
            }

            return (
                <NavLink
                    key={index}
                    to={item.path}
                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                    onClick={onItemClick}
                >
                    <div className="menu-icon-wrapper">
                        {item.icon && <item.icon size={18} />}
                    </div>
                    <span className="menu-text">{item.label}</span>
                </NavLink>
            );
        });
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
            <div className="logo">
                <div className="logo-short">
                    <img src={circleLogo} alt="KT" />
                </div>

                <div className="logo-full">
                    <img src={fullLogo} alt="Kiaan Technology" />
                </div>
            </div>

            <div className="sidebar-menu">
                {renderMenu(menuItems[role] || [])}
            </div>
        </div>
    );
};

export default Sidebar;
