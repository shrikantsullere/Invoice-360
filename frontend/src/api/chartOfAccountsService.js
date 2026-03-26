import axios from './axiosInstance';

const chartOfAccountsService = {
  // Get full COA hierarchy
  getChartOfAccounts: (companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return axios.get(`/chart-of-accounts${query}`);
  },

  // Get Account Types (Sub-groups) for dropdowns
  getAccountTypes: (companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return axios.get(`/chart-of-accounts/types${query}`);
  },

  // Initialize Default Accounts
  initializeCOA: (companyId) => {
    return axios.post('/chart-of-accounts/initialize', { companyId }); // Passed in body if needed, or query
  },

  // Ledger Operations
  createLedger: (data) => axios.post('/chart-of-accounts/ledgers', data),
  
  updateLedger: (id, data, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return axios.put(`/chart-of-accounts/ledgers/${id}${query}`, data);
  },

  deleteLedger: (id, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return axios.delete(`/chart-of-accounts/ledgers/${id}${query}`);
  },

  getLedgerTransactions: (id, companyId) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return axios.get(`/chart-of-accounts/ledgers/${id}/transactions${query}`);
  }
};

export default chartOfAccountsService;
