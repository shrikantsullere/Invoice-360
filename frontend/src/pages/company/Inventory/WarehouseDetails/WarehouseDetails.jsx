import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import inventoryService from '../../../../services/inventoryService';
import GetCompanyId from '../../../../api/GetCompanyId';
import './WarehouseDetails.css';

const WarehouseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [warehouse, setWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const companyId = GetCompanyId();
                const res = await inventoryService.getWarehouseById(id, companyId);
                if (res.success) {
                    setWarehouse(res.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!warehouse) return <div className="p-6">Warehouse not found</div>;

    const { stats, inventory } = warehouse;

    // Get unique categories
    const categoriesList = ['All', ...new Set(inventory.map(item => item.category))];

    // Filtered inventory
    const filteredInventory = categoryFilter === 'All'
        ? inventory
        : inventory.filter(item => item.category === categoryFilter);

    return (
        <div className="warehouse-details-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <div className="header-info">
                    <h1 className="page-title">{warehouse.name}</h1>
                    <div className="location-tag">
                        <MapPin size={16} />
                        <span>Location: {warehouse.location}</span>
                    </div>
                </div>
            </div>

            <div className="">
                {/* Left Side: Address & Stats */}
                <div className="left-column">
                    <div className="info-card address-card">
                        <h3>{warehouse.state || 'State'}</h3>
                        <p>{warehouse.city}, {warehouse.state ? `${warehouse.state} - ` : ''} {warehouse.postalCode}</p>
                        <p>{warehouse.country}</p>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <h4>Total Categories</h4>
                            <p>{stats?.totalCategories || 0}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Total Products</h4>
                            <p>{stats?.totalProducts || 0}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Total Stock Units</h4>
                            <p>{stats?.totalStockUnits || 0}</p>
                        </div>
                        <div className="stat-card light-green">
                            <h4>Lowest Stock Product</h4>
                            <p>{stats?.lowestStockProduct || '-'}</p>
                        </div>
                        <div className="stat-card light-red">
                            <h4>Highest Stock Product</h4>
                            <p>{stats?.highestStockProduct || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Inventory List */}
                <div className="right-column">
                    <div className="inventory-card">
                        <div className="card-header">
                            <h2>Inventory List</h2>
                            <div className="filter-controls">
                                <select
                                    className="category-select"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    {categoriesList.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <span className="total-badge">Shown: {filteredInventory.length}</span>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="inventory-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Category</th>
                                        <th>Product</th>
                                        <th>Measurement</th>
                                        <th>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInventory && filteredInventory.length > 0 ? (
                                        filteredInventory.map((item, index) => (
                                            <tr key={item.id}>
                                                <td>{index + 1}</td>
                                                <td>{item.category}</td>
                                                <td>{item.product}</td>
                                                <td>{item.unit}</td>
                                                <td className="stock-cell">
                                                    {item.quantity}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center p-4 text-gray-500">No inventory found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default WarehouseDetails;
