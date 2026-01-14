import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Server, CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink, Terminal } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

function ClaudeProxySettings() {
  const [status, setStatus] = useState({
    available: false,
    configured: false,
    baseUrl: null,
    hasApiKey: false,
    cliInstalled: false,
    loading: true,
    error: null
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await authenticatedFetch('/api/claude-proxy/status');
      
      if (!response.ok) {
        throw new Error('Failed to check Claude Proxy status');
      }
      
      const data = await response.json();
      setStatus({
        ...data,
        loading: false
      });
    } catch (error) {
      console.error('Error checking Claude Proxy status:', error);
      setStatus({
        available: false,
        configured: false,
        baseUrl: null,
        hasApiKey: false,
        cliInstalled: false,
        loading: false,
        error: error.message
      });
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Test by checking status again
      const response = await authenticatedFetch('/api/claude-proxy/status');
      
      if (!response.ok) {
        throw new Error('Connection test failed');
      }
      
      const data = await response.json();
      
      if (data.available) {
        setTestResult({
          success: true,
          message: 'Connection successful! Claude Code Proxy is ready to use.'
        });
      } else {
        const issues = [];
        if (!data.configured) issues.push('Environment variables not configured');
        if (!data.cliInstalled) issues.push('Claude CLI not installed');
        
        setTestResult({
          success: false,
          message: `Connection test failed: ${issues.join(', ')}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (status.loading) {
      return <Badge variant="secondary">Checking...</Badge>;
    }
    
    if (status.available) {
      return (
        <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Available
        </Badge>
      );
    }
    
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Not Available
        </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Claude Code Proxy
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Use Claude CLI with proxy server configuration
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Status Overview */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-foreground">Configuration Status</h4>
        
        <div className="space-y-2">
          {/* Environment Variables */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Environment Variables</span>
            <div className="flex items-center gap-2">
              {status.loading ? (
                <span className="text-muted-foreground">Checking...</span>
              ) : status.configured ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-foreground">Configured</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-foreground">Not Configured</span>
                </>
              )}
            </div>
          </div>

          {/* Base URL */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ANTHROPIC_BASE_URL</span>
            <div className="flex items-center gap-2">
              {status.baseUrl ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <code className="text-xs bg-background px-2 py-1 rounded border border-border">
                    {status.baseUrl}
                  </code>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-muted-foreground">Not set</span>
                </>
              )}
            </div>
          </div>

          {/* API Key */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ANTHROPIC_API_KEY</span>
            <div className="flex items-center gap-2">
              {status.hasApiKey ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <code className="text-xs bg-background px-2 py-1 rounded border border-border">
                    ••••••••
                  </code>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-muted-foreground">Not set</span>
                </>
              )}
            </div>
          </div>

          {/* Claude CLI */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Claude CLI</span>
            <div className="flex items-center gap-2">
              {status.loading ? (
                <span className="text-muted-foreground">Checking...</span>
              ) : status.cliInstalled ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-foreground">Installed</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-foreground">Not Installed</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Test Connection */}
      <div className="space-y-3">
        <Button
          onClick={testConnection}
          disabled={testing || status.loading}
          className="w-full"
          variant="outline"
        >
          {testing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Server className="w-4 h-4 mr-2" />
              Test Connection
            </>
          )}
        </Button>

        {testResult && (
          <div className={`p-3 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                testResult.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Configuration Guide
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <p>To use Claude Code Proxy, you need to:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Install Claude CLI (if not already installed)</li>
                <li>Set up environment variables in your <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">.env</code> file:</li>
              </ol>
              <div className="bg-blue-100 dark:bg-blue-900/40 rounded p-3 mt-2 font-mono text-xs">
                <div>ANTHROPIC_BASE_URL=http://localhost:8082</div>
                <div>ANTHROPIC_API_KEY=any-value</div>
              </div>
              <p className="mt-2">
                <strong>Note:</strong> The API key can be any value when using a proxy server.
                The proxy server will handle the actual authentication.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      {!status.cliInstalled && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 space-y-3 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <Terminal className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                Claude CLI Not Installed
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Please install Claude CLI to use Claude Code Proxy.
              </p>
              <a
                href="https://docs.anthropic.com/en/docs/agents/claude-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-yellow-900 dark:text-yellow-300 hover:underline font-medium"
              >
                View Installation Guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={checkStatus}
          disabled={status.loading}
          variant="ghost"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${status.loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>
    </div>
  );
}

export default ClaudeProxySettings;
