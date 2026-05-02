const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://tiles-inventory-management-system.onrender.com/api';

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.message === 'Account has been deactivated' || errorData.message === 'Account deactivated by an administrator') {
      window.dispatchEvent(new CustomEvent('auth:deactivated', { detail: errorData.message }));
    } else {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    if (response.status === 401) {
        throw new Error(errorData.message || 'Unauthorized');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
};
