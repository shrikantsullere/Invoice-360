import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Navbar from '../components/Navbar/Navbar';
import './SuperAdminLayout.css';

const SuperAdminLayout = () => {
    // Initialize based on screen width
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const { currentUser } = useContext(AuthContext);
    const location = useLocation();

    // Mapping backend roles to Sidebar keys
    // Backend: SUPERADMIN -> 'superadmin' menu
    // All others (ADMIN, COMPANY, Custom) -> 'company' menu
    let userRole = 'company'; // Default

    if (currentUser?.role === 'SUPERADMIN') {
        userRole = 'superadmin';
    } else {
        // All other roles (ADMIN, COMPANY, USER, Custom Roles) use the Company Menu structure
        // The Sidebar component will filter specific items based on 'permissions'
        userRole = 'company';
    }

    const handleSidebarItemClick = () => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="layout-container">
            {/* Mobile Backdrop */}
            {isSidebarOpen && window.innerWidth <= 768 && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999
                    }}
                />
            )}

            <Sidebar
                isOpen={isSidebarOpen}
                role={userRole}
                permissions={currentUser?.permissions || []}
                isAdmin={currentUser?.role === 'COMPANY' || currentUser?.role === 'ADMIN'}
                onItemClick={handleSidebarItemClick}
            />
            <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
