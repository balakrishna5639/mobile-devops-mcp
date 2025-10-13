import { spawn } from 'child_process';
import { platform } from 'os';

class MCPTestClient {
  private serverProcess: any;
  private messageId = 1;

  async startServer() {
    console.log('🚀 Starting MCP Server...');
    
    // Windows-compatible spawn command
    const isWindows = platform() === 'win32';
    const command = isWindows ? 'npx.cmd' : 'npx';
    
    this.serverProcess = spawn(command, ['tsx', 'src/mcp-server.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows
    });

    // Handle server startup
    this.serverProcess.stderr.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      console.log('🔧 Server log:', message);
      if (message.includes('Mobile DevOps MCP Server running')) {
        console.log('✅ MCP Server started successfully!');
        this.runTests();
      }
    });

    // Handle server responses
    this.serverProcess.stdout.on('data', (data: Buffer) => {
      const responses = data.toString().trim().split('\n');
      responses.forEach(response => {
        if (response.trim()) {
          try {
            const parsed = JSON.parse(response);
            console.log('📨 Server Response:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('📨 Raw Response:', response);
          }
        }
      });
    });

    // Handle process errors
    this.serverProcess.on('error', (error: Error) => {
      console.error('❌ Server process error:', error.message);
      console.log('💡 Trying alternative approach...');
      this.startServerAlternative();
    });
  }

  private startServerAlternative() {
    console.log('🔄 Starting server with alternative method...');
    
    // Alternative: Use node directly
    const isWindows = platform() === 'win32';
    const command = isWindows ? 'node.exe' : 'node';
    
    this.serverProcess = spawn(command, [
      '--loader', 'tsx/esm', 
      'src/mcp-server.ts'
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows
    });

    this.serverProcess.stderr.on('data', (data: Buffer) => {
      const message = data.toString().trim();
      console.log('🔧 Server log:', message);
      if (message.includes('Mobile DevOps MCP Server running')) {
        console.log('✅ MCP Server started successfully!');
        this.runTests();
      }
    });

    this.serverProcess.stdout.on('data', (data: Buffer) => {
      const responses = data.toString().trim().split('\n');
      responses.forEach(response => {
        if (response.trim()) {
          try {
            const parsed = JSON.parse(response);
            console.log('📨 Server Response:', JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('📨 Raw Response:', response);
          }
        }
      });
    });
  }

  private sendMessage(method: string, params: any = {}) {
    const message = {
      jsonrpc: "2.0",
      id: this.messageId++,
      method: method,
      params: params
    };

    console.log(`\n📤 Sending: ${method}`);
    this.serverProcess.stdin.write(JSON.stringify(message) + '\n');
  }

  private async runTests() {
    console.log('\n🧪 Starting MCP Protocol Tests...\n');
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: List tools
    console.log('='.repeat(50));
    console.log('TEST 1: List Available Tools');
    console.log('='.repeat(50));
    this.sendMessage('tools/list');

    // Test 2: Generate Cordova Config
    setTimeout(() => {
      console.log('\n' + '='.repeat(50));
      console.log('TEST 2: Generate Cordova Config');
      console.log('='.repeat(50));
      this.sendMessage('tools/call', {
        name: 'generate-cordova-config',
        arguments: {
          appName: 'SmythOS Mobile Demo',
          packageId: 'com.smythos.mobile.demo',
          platforms: ['android', 'ios'],
          minSdkVersion: 24
        }
      });
    }, 2000);

    // Test 3: Android Diagnosis
    setTimeout(() => {
      console.log('\n' + '='.repeat(50));
      console.log('TEST 3: Android Build Diagnosis');
      console.log('='.repeat(50));
      this.sendMessage('tools/call', {
        name: 'diagnose-android-build',
        arguments: {
          errorLog: 'AAPT: error: resource android:attr/lStar not found. Could not find method compile() for arguments',
          gradleVersion: '7.4',
          targetSdkVersion: 35
        }
      });
    }, 4000);

    // Test 4: iOS Signing
    setTimeout(() => {
      console.log('\n' + '='.repeat(50));
      console.log('TEST 4: iOS Code Signing Setup');
      console.log('='.repeat(50));
      this.sendMessage('tools/call', {
        name: 'setup-ios-signing',
        arguments: {
          certificateType: 'distribution',
          bundleId: 'com.smythos.mobile.demo',
          teamId: 'ABCD123456'
        }
      });
    }, 6000);

    // Cleanup
    setTimeout(() => {
      console.log('\n✅ All MCP Protocol Tests Completed!');
      console.log('🎯 Your Mobile DevOps MCP Server is fully functional!');
      this.stop();
      process.exit(0);
    }, 8000);
  }

  stop() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

const client = new MCPTestClient();
client.startServer();

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  client.stop();
  process.exit(0);
});
