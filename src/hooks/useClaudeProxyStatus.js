import { useState, useEffect } from 'react';
import { authenticatedFetch } from '../utils/api';

/**
 * Hook to check Claude Code Proxy availability and configuration status
 * @returns {Object} Status object with availability, loading state, and configuration details
 */
export function useClaudeProxyStatus() {
  const [status, setStatus] = useState({
    available: false,
    loading: true,
    baseUrl: null,
    hasApiKey: false,
    cliInstalled: false,
    configured: false,
    error: null
  });
  
  useEffect(() => {
    let mounted = true;
    
    const checkStatus = async () => {
      try {
        const response = await authenticatedFetch('/api/claude-proxy/status');
        
        if (!response.ok) {
          throw new Error('Failed to check Claude Proxy status');
        }
        
        const data = await response.json();
        
        if (mounted) {
          setStatus({
            ...data,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error checking Claude Proxy status:', error);
        
        if (mounted) {
          setStatus({
            available: false,
            loading: false,
            baseUrl: null,
            hasApiKey: false,
            cliInstalled: false,
            configured: false,
            error: error.message
          });
        }
      }
    };
    
    checkStatus();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return status;
}
