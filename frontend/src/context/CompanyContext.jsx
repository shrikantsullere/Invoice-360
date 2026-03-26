import React, { createContext, useState, useEffect, useContext } from 'react';
import companyService from '../api/companyService';
import GetCompanyId from '../api/GetCompanyId';
import { AuthContext } from './AuthContext';

export const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const { currentUser } = useContext(AuthContext);
    const [companySettings, setCompanySettings] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCompanySettings = async () => {
        const companyId = GetCompanyId();
        if (companyId) {
            try {
                const res = await companyService.getById(companyId);
                setCompanySettings(res.data);
            } catch (error) {
                console.error("Error fetching company settings:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchCompanySettings();
        } else {
            setCompanySettings(null);
            setLoading(false);
        }
    }, [currentUser]);

    const formatCurrency = (amount) => {
        const currency = companySettings?.currency || 'ZAR';

        // Map currencies to appropriate locales for better formatting
        const localeMap = {
            'ZAR': 'en-ZA',
            'NAD': 'en-NA',
            'BWP': 'en-BW',
            'LSL': 'en-LS',
            'SZL': 'en-SZ',
            'ZMW': 'en-ZM',
            'MZN': 'pt-MZ',
            'MWK': 'en-MW',
            'AOA': 'pt-AO',
            'INR': 'en-IN',
            'GBP': 'en-GB',
            'EUR': 'en-DE',
            'USD': 'en-US'
        };

        const locale = localeMap[currency] || 'en-US';

        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 2
            }).format(amount || 0);
        } catch (e) {
            // Fallback for newer or unsupported currency codes like ZiG
            const symbols = {
                'ZiG': 'ZiG',
                'ZAR': 'R',
                'NAD': 'N$',
                'BWP': 'P',
                'USD': '$'
            };
            const symbol = symbols[currency] || currency;
            return `${symbol} ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        }
    };

    return (
        <CompanyContext.Provider value={{ companySettings, fetchCompanySettings, formatCurrency, loading }}>
            {children}
        </CompanyContext.Provider>
    );
};
