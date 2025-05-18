/**
 * Device fingerprinting utilities for secure authentication
 */
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { DeviceFingerprint } from '@alive-human/shared';

/**
 * Generate a device fingerprint using multiple hardware and software signals
 * @returns Promise that resolves to a device fingerprint
 */
export async function generateDeviceFingerprint(): Promise<DeviceFingerprint> {
  // Initialize FingerprintJS
  const fp = await FingerprintJS.load();
  
  // Get the visitor identifier
  const result = await fp.get();
  
  // Get installed fonts (this is a simplified version)
  const installedFonts = await getInstalledFonts();
  
  // Generate canvas fingerprint
  const canvasFingerprint = generateCanvasFingerprint();
  
  // Generate WebGL fingerprint
  const webglFingerprint = generateWebGLFingerprint();
  
  // Collect device information
  const fingerprint: DeviceFingerprint = {
    hardwareId: result.visitorId,
    browserInfo: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      language: navigator.language,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    },
    screenResolution: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth
    },
    installedFonts,
    installedPlugins: getInstalledPlugins(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvasFingerprint,
    webglFingerprint
  };
  
  return fingerprint;
}

/**
 * Get the browser name
 */
function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  } else if (userAgent.match(/android/i)) {
    browserName = "Android";
  } else if (userAgent.match(/iphone/i)) {
    browserName = "iPhone";
  }
  
  return browserName;
}

/**
 * Get the browser version
 */
function getBrowserVersion(): string {
  const userAgent = navigator.userAgent;
  let version = "Unknown";
  
  // This is a simplified version, in a real implementation
  // we would parse the UA string more precisely
  const match = userAgent.match(/(?:chrome|firefox|safari|opr|edge|msie|rv)[\s/:](\d+(\.\d+)?)/i);
  if (match) {
    version = match[1];
  }
  
  return version;
}

/**
 * Get a list of installed fonts
 * Note: This is a simplified version. In production, we'd use a more robust solution
 */
async function getInstalledFonts(): Promise<string[]> {
  // This is a simplified version that tests for common fonts
  const fontList = [
    'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier',
    'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Impact', 'Tahoma'
  ];
  
  // We create a canvas and test each font by measuring text width
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    return [];
  }
  
  const testString = 'mmmmmmmmmmlli';
  const baseFont = 'monospace';
  
  context.font = `16px ${baseFont}`;
  const baseWidth = context.measureText(testString).width;
  
  const detectedFonts: string[] = [];
  
  for (const font of fontList) {
    try {
      context.font = `16px ${font}, ${baseFont}`;
      const width = context.measureText(testString).width;
      
      // If the width is different than the base width, the font is likely installed
      if (width !== baseWidth) {
        detectedFonts.push(font);
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  return detectedFonts;
}

/**
 * Get a list of installed browser plugins
 */
function getInstalledPlugins(): string[] {
  const plugins: string[] = [];
  
  // Check if navigator.plugins is available (not in all browsers)
  if (navigator.plugins && navigator.plugins.length > 0) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      if (plugin && plugin.name) {
        plugins.push(plugin.name);
      }
    }
  }
  
  return plugins;
}

/**
 * Generate a canvas fingerprint
 */
function generateCanvasFingerprint(): string {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    return '';
  }
  
  // Set canvas dimensions
  canvas.width = 200;
  canvas.height = 60;
  
  // Draw background
  context.fillStyle = '#f60';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#069';
  context.fillText('Canvas Fingerprint', 2, 15);
  
  // Draw a unique shape
  context.strokeStyle = 'rgba(102, 204, 0, 0.7)';
  context.beginPath();
  context.arc(50, 30, 20, 0, Math.PI * 2, true);
  context.stroke();
  
  // Get the data URL and extract a hash
  try {
    return canvas.toDataURL().replace('data:image/png;base64,', '').substring(0, 32);
  } catch (e) {
    return '';
  }
}

/**
 * Generate a WebGL fingerprint
 */
function generateWebGLFingerprint(): string {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return '';
  }
  
  // Get WebGL vendor and renderer
  const vendor = gl.getParameter(gl.VENDOR);
  const renderer = gl.getParameter(gl.RENDERER);
  const extensions = gl.getSupportedExtensions() || [];
  
  // Create a simple hash from the information
  const glInfo = [vendor, renderer, ...extensions].join('_');
  
  // Return a substring to keep the size reasonable
  return glInfo.substring(0, 64);
}
