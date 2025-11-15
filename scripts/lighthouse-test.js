import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const PORT = 4173;

async function runLighthouse(url, config = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox'] });
  
  try {
    const options = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      ...config,
    };

    const runnerResult = await lighthouse(url, options);
    
    // Save HTML report
    const reportHtml = runnerResult.report;
    const reportDir = resolve(projectRoot, 'lighthouse-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const deviceType = config.formFactor === 'desktop' ? 'desktop' : 'mobile';
    const reportPath = resolve(reportDir, `lighthouse-${deviceType}-${Date.now()}.html`);
    fs.writeFileSync(reportPath, reportHtml);
    
    // Log scores
    const scores = runnerResult.lhr.categories;
    console.log(`\n📊 Lighthouse Scores (${deviceType}):`);
    console.log(`Performance: ${Math.round(scores.performance.score * 100)}`);
    console.log(`Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
    console.log(`Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
    console.log(`SEO: ${Math.round(scores.seo.score * 100)}`);
    console.log(`\n📄 Report saved to: ${reportPath}\n`);
    
    return runnerResult;
  } catch (error) {
    console.error(`Error running Lighthouse: ${error.message}`);
    throw error;
  } finally {
    await chrome.kill();
  }
}

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server did not start in time');
}

function killProcess(process) {
  if (!process || process.killed) return;
  
  try {
    if (process.pid) {
      // On Windows, kill the process tree
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', process.pid.toString()], {
          stdio: 'ignore',
          detached: true,
        });
      } else {
        process.kill('SIGTERM');
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 2000);
      }
    }
  } catch (e) {
    // Process might already be dead
  }
}

async function main() {
  const args = process.argv.slice(2);
  const deviceType = args[0] || 'all';
  let previewProcess = null;
  
  try {
    console.log('🔨 Building production version...');
    execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
    
    console.log(`🚀 Starting preview server on port ${PORT}...`);
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    previewProcess = spawn(command, ['run', 'preview', '--', '--port', PORT.toString()], {
      cwd: projectRoot,
      detached: false,
      stdio: 'pipe',
      shell: isWindows,
    });
    
    let actualPort = PORT;
    let serverReady = false;
    
    previewProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Try to detect port from output
      const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch) {
        actualPort = parseInt(portMatch[1]);
        console.log(`📡 Detected server running on port ${actualPort}`);
      }
      
      // Check if server is ready
      if (output.includes('Local:') && !serverReady) {
        serverReady = true;
      }
    });
    
    previewProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    previewProcess.on('error', (error) => {
      console.error('Preview server error:', error);
    });
    
    previewProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`Preview server exited with code ${code}`);
      }
    });
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    const actualUrl = `http://localhost:${actualPort}`;
    
    // Try multiple ports in case the requested port is in use
    const portsToTry = [PORT, PORT + 1, PORT + 2, PORT + 3, PORT + 4];
    let serverUrl = null;
    
    for (const port of portsToTry) {
      try {
        const url = `http://localhost:${port}`;
        await waitForServer(url, 10);
        serverUrl = url;
        actualPort = port;
        console.log(`✅ Server is ready on port ${actualPort}!\n`);
        break;
      } catch (e) {
        // Try next port
      }
    }
    
    if (!serverUrl) {
      throw new Error('Could not connect to preview server on any port');
    }
    
    // Run lighthouse tests
    if (deviceType === 'desktop' || deviceType === 'all') {
      console.log('\n🖥️  Running Lighthouse test for DESKTOP...');
      await runLighthouse(serverUrl, {
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
        },
      });
    }
    
    if (deviceType === 'mobile' || deviceType === 'all') {
      console.log('\n📱 Running Lighthouse test for MOBILE...');
      await runLighthouse(serverUrl, {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 732,
          deviceScaleFactor: 2.625,
        },
      });
    }
    
    console.log('\n✅ Lighthouse tests completed successfully!');
  } catch (error) {
    console.error('Error during Lighthouse testing:', error);
    throw error;
  } finally {
    // Kill preview server
    if (previewProcess) {
      console.log('\n🛑 Stopping preview server...');
      killProcess(previewProcess);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});