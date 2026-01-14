import express from 'express';
import { checkProxyConfiguration, checkClaudeCLI } from '../claude-code-proxy.js';

const router = express.Router();

/**
 * GET /api/claude-proxy/status
 * Check Claude Code Proxy configuration and availability
 */
router.get('/status', async (req, res) => {
  try {
    // Check environment variables
    const proxyConfig = checkProxyConfiguration();
    
    // Check Claude CLI installation
    const cliInstalled = await checkClaudeCLI();
    
    // Determine overall availability
    const available = proxyConfig.configured && cliInstalled;
    
    res.json({
      available,
      baseUrl: proxyConfig.baseUrl,
      hasApiKey: proxyConfig.hasApiKey,
      cliInstalled,
      configured: proxyConfig.configured,
      error: null
    });
  } catch (error) {
    console.error('[Claude Proxy API] Error checking status:', error);
    res.status(500).json({
      available: false,
      baseUrl: null,
      hasApiKey: false,
      cliInstalled: false,
      configured: false,
      error: error.message
    });
  }
});

export default router;
