import { spawn } from 'child_process';
import crossSpawn from 'cross-spawn';

// Use cross-spawn on Windows for better command execution
const spawnFunction = process.platform === 'win32' ? crossSpawn : spawn;

// Track active Claude Proxy processes by session ID
let activeClaudeProxyProcesses = new Map();

/**
 * Check if Claude Code Proxy is properly configured via environment variables
 * @returns {Object} Configuration status
 */
function checkProxyConfiguration() {
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  return {
    available: !!(baseUrl && apiKey),
    configured: !!(baseUrl && apiKey),
    baseUrl: baseUrl || null,
    hasApiKey: !!apiKey
  };
}

/**
 * Check if Claude CLI is installed and accessible
 * @returns {Promise<boolean>} True if Claude CLI is installed
 */
async function checkClaudeCLI() {
  return new Promise((resolve) => {
    const process = spawnFunction('claude', ['--version']);
    
    let hasOutput = false;
    
    process.stdout.on('data', () => {
      hasOutput = true;
    });
    
    process.on('close', (code) => {
      resolve(code === 0 && hasOutput);
    });
    
    process.on('error', () => {
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      process.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Build command line arguments for Claude CLI
 * @param {string} command - User message
 * @param {Object} options - Command options
 * @returns {Array<string>} Command arguments
 */
function buildClaudeArgs(command, options) {
  const args = [];
  
  // Resume existing session
  if (options.sessionId) {
    args.push('--resume', options.sessionId);
  }
  
  // User message/prompt
  if (command && command.trim()) {
    args.push('-p', command);
  }
  
  // Model selection (only for new sessions)
  if (!options.sessionId && options.model) {
    args.push('--model', options.model);
  }
  
  // Request streaming JSON output
  args.push('--output-format', 'stream-json');
  
  // When using -p with stream-json, --verbose is required
  if (command && command.trim()) {
    args.push('--verbose');
  }
  
  // Skip permissions if enabled
  if (options.skipPermissions || options.dangerouslySkipPermissions) {
    args.push('--dangerously-skip-permissions');
    console.log('⚠️  Using --dangerously-skip-permissions flag');
  }
  
  return args;
}

/**
 * Spawn Claude CLI process and handle conversation
 * @param {string} command - User message
 * @param {Object} options - Command options
 * @param {Object} ws - WebSocket writer
 * @returns {Promise<void>}
 */
async function spawnClaudeProxy(command, options = {}, ws) {
  return new Promise(async (resolve, reject) => {
    const { sessionId, projectPath, cwd, model, skipPermissions, dangerouslySkipPermissions } = options;
    let capturedSessionId = sessionId;
    let sessionCreatedSent = false;
    let messageBuffer = '';
    
    // Build Claude CLI command arguments
    const args = buildClaudeArgs(command, options);
    
    // Use cwd (actual project directory) or projectPath
    const workingDir = cwd || projectPath || process.cwd();
    
    console.log('[Claude Proxy] Spawning Claude CLI:', 'claude', args.join(' '));
    console.log('[Claude Proxy] Working directory:', workingDir);
    console.log('[Claude Proxy] Session info - Input sessionId:', sessionId);
    
    // Check proxy configuration
    const proxyConfig = checkProxyConfiguration();
    if (!proxyConfig.configured) {
      const error = 'Claude Code Proxy not configured. Please set ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY environment variables.';
      console.error('[Claude Proxy]', error);
      ws.send({
        type: 'error',
        error: error
      });
      reject(new Error(error));
      return;
    }
    
    // Spawn Claude CLI process
    const claudeProcess = spawnFunction('claude', args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      }
    });
    
    // Store process reference for potential abort
    const processKey = capturedSessionId || Date.now().toString();
    activeClaudeProxyProcesses.set(processKey, claudeProcess);
    
    // Handle stdout (streaming JSON responses)
    claudeProcess.stdout.on('data', (data) => {
      const rawOutput = data.toString();
      console.log('[Claude Proxy] stdout:', rawOutput);
      
      const lines = rawOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          console.log('[Claude Proxy] Parsed JSON:', response);
          
          // Handle different message types
          switch (response.type) {
            case 'system':
              if (response.subtype === 'init') {
                // Capture session ID
                if (response.session_id && !capturedSessionId) {
                  capturedSessionId = response.session_id;
                  console.log('[Claude Proxy] Captured session ID:', capturedSessionId);
                  
                  // Update process key with captured session ID
                  if (processKey !== capturedSessionId) {
                    activeClaudeProxyProcesses.delete(processKey);
                    activeClaudeProxyProcesses.set(capturedSessionId, claudeProcess);
                  }
                  
                  // Set session ID on writer
                  if (ws.setSessionId && typeof ws.setSessionId === 'function') {
                    ws.setSessionId(capturedSessionId);
                  }
                  
                  // Send session-created event only once for new sessions
                  if (!sessionId && !sessionCreatedSent) {
                    sessionCreatedSent = true;
                    ws.send({
                      type: 'session-created',
                      sessionId: capturedSessionId,
                      model: response.model,
                      cwd: response.cwd
                    });
                  }
                }
                
                // Send system info to frontend
                ws.send({
                  type: 'claude-proxy-system',
                  data: response
                });
              }
              break;
              
            case 'user':
              // Forward user message
              ws.send({
                type: 'cursor-user',
                data: response
              });
              break;
              
            case 'assistant':
              // Accumulate assistant message chunks
              if (response.message && response.message.content && response.message.content.length > 0) {
                const textContent = response.message.content[0].text;
                messageBuffer += textContent;
                
                // Send as Claude-compatible format for frontend
                ws.send({
                  type: 'claude-response',
                  data: {
                    type: 'content_block_delta',
                    delta: {
                      type: 'text_delta',
                      text: textContent
                    }
                  }
                });
              }
              break;
              
            case 'result':
              // Session complete
              console.log('[Claude Proxy] Session result:', response);
              
              // Send final message if we have buffered content
              if (messageBuffer) {
                ws.send({
                  type: 'claude-response',
                  data: {
                    type: 'content_block_stop'
                  }
                });
              }
              
              // Send completion event
              ws.send({
                type: 'claude-complete',
                sessionId: capturedSessionId || sessionId,
                success: response.subtype === 'success',
                isNewSession: !sessionId && !!command
              });
              break;
              
            default:
              // Forward any other message types
              ws.send({
                type: 'claude-proxy-response',
                data: response
              });
          }
        } catch (parseError) {
          console.log('[Claude Proxy] Non-JSON response:', line);
          // If not JSON, send as raw text
          ws.send({
            type: 'claude-proxy-output',
            data: line
          });
        }
      }
    });
    
    // Handle stderr
    claudeProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.error('[Claude Proxy] stderr:', errorOutput);
      ws.send({
        type: 'error',
        error: errorOutput
      });
    });
    
    // Handle process completion
    claudeProcess.on('close', async (code) => {
      console.log(`[Claude Proxy] Process exited with code ${code}`);
      
      // Clean up process reference
      const finalSessionId = capturedSessionId || sessionId || processKey;
      activeClaudeProxyProcesses.delete(finalSessionId);
      
      ws.send({
        type: 'claude-complete',
        sessionId: finalSessionId,
        exitCode: code,
        isNewSession: !sessionId && !!command
      });
      
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Claude CLI exited with code ${code}`));
      }
    });
    
    // Handle process errors
    claudeProcess.on('error', (error) => {
      console.error('[Claude Proxy] Process error:', error);
      
      // Clean up process reference on error
      const finalSessionId = capturedSessionId || sessionId || processKey;
      activeClaudeProxyProcesses.delete(finalSessionId);
      
      ws.send({
        type: 'error',
        error: error.message
      });
      
      reject(error);
    });
    
    // Close stdin since Claude doesn't need interactive input
    claudeProcess.stdin.end();
  });
}

/**
 * Abort an active Claude Proxy session
 * @param {string} sessionId - Session ID to abort
 * @returns {boolean} True if session was aborted
 */
function abortClaudeProxySession(sessionId) {
  const process = activeClaudeProxyProcesses.get(sessionId);
  if (process) {
    console.log(`[Claude Proxy] 🛑 Aborting session: ${sessionId}`);
    process.kill('SIGTERM');
    activeClaudeProxyProcesses.delete(sessionId);
    return true;
  }
  return false;
}

/**
 * Check if a Claude Proxy session is active
 * @param {string} sessionId - Session ID to check
 * @returns {boolean} True if session is active
 */
function isClaudeProxySessionActive(sessionId) {
  return activeClaudeProxyProcesses.has(sessionId);
}

/**
 * Get all active Claude Proxy session IDs
 * @returns {Array<string>} Array of active session IDs
 */
function getActiveClaudeProxySessions() {
  return Array.from(activeClaudeProxyProcesses.keys());
}

export {
  checkProxyConfiguration,
  checkClaudeCLI,
  buildClaudeArgs,
  spawnClaudeProxy,
  abortClaudeProxySession,
  isClaudeProxySessionActive,
  getActiveClaudeProxySessions,
  activeClaudeProxyProcesses
};
