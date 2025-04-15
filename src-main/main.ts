import { app, BrowserWindow, ipcMain, protocol, net, dialog } from 'electron';
import path from 'path';
import url from 'url';
import { stat, readdir, readFile, unlink } from 'node:fs/promises'; // Added readFile, unlink
import { join } from "path"
import { spawn, execSync } from "child_process" // Added execSync
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { homedir, tmpdir } from "os" // Added tmpdir
import crypto from 'crypto'; // Added crypto
import semver from 'semver'; // Import semver

// Declare Vite global variables
declare const VITE_DEV_SERVER_URLS: Record<string, string>;

let mainWindow: BrowserWindow | null = null

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
import electronSquirrelStartup from 'electron-squirrel-startup';
if(electronSquirrelStartup) app.quit();

// Only one instance of the electron main process should be running due to how chromium works.
// If another instance of the main process is already running `app.requestSingleInstanceLock()`
// will return false, `app.quit()` will be called, and the other instances will receive a
// `'second-instance'` event.
// https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelockadditionaldata
if(!app.requestSingleInstanceLock()) {
	app.quit();
}

// This event will be called when a second instance of the app tries to run.
// https://www.electronjs.org/docs/latest/api/app#event-second-instance
app.on('second-instance', (event, args, workingDirectory, additionalData) => {
	createWindow();
});

const scheme = 'app';
const srcFolder = path.join(app.getAppPath(), `.vite/main_window/`);
const staticAssetsFolder = import.meta.env.DEV ? path.join(import.meta.dirname, '../../static/') : srcFolder;

protocol.registerSchemesAsPrivileged([{
		scheme: scheme,
		privileges: {
			standard: true,
			secure: true,
			allowServiceWorkers: true,
			supportFetchAPI: true,
			corsEnabled: false,
			stream: true, // video stream from schema
			codeCache: true,
		},
	},
]);

app.on('ready', () => {
	protocol.handle(scheme, async (request) => {
		const requestPath = path.normalize(decodeURIComponent(new URL(request.url).pathname));

		async function isFile(filePath: string) {
			try {
				if((await stat(filePath)).isFile()) return filePath;
			}
			catch(e) {}
		}

		const responseFilePath = await isFile(path.join(srcFolder, requestPath))
		?? await isFile(path.join(srcFolder, path.dirname(requestPath), `${path.basename(requestPath) || 'index'}.html`))
		?? path.join(srcFolder, '200.html');

		return await net.fetch(url.pathToFileURL(responseFilePath).toString());
	});
});

function createWindow() {
	// Create the browser window.
	// Assign to the outer mainWindow variable
	mainWindow = new BrowserWindow({
		icon: path.join(staticAssetsFolder, '/icon.png'),
		width: 900,
		height: 700,
		minWidth: 400,
		minHeight: 200,
		// Window Controls Overlay API - https://developer.mozilla.org/en-US/docs/Web/API/Window_Controls_Overlay_API
		// Allows for a custom window header while overlaying native window controls in the corner.
		// https://www.electronjs.org/docs/latest/tutorial/window-customization#window-controls-overlay
		titleBarStyle: 'hidden',
		// Default title bar colors (match dark theme from app.css initially)
		// These will be updated by the renderer process via IPC.
		titleBarOverlay: {
			color: '#18181b',      // Default to dark theme background
			symbolColor: '#f4f4f5', // Default to dark theme text color
			height: 40
		},
		backgroundColor: '#18181b', // Match initial title bar color
		webPreferences: {
			preload: path.join(import.meta.dirname, '../preload/preload.js'),
		},
	});

	if(import.meta.env.DEV) {
		mainWindow.loadURL(VITE_DEV_SERVER_URLS['main_window']);

		// Open the DevTools.
		// mainWindow.webContents.openDevTools();
	}
	else {
		mainWindow.loadURL('app://-/');
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if(BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('toggleDevTools', (event) => event.sender.toggleDevTools());
ipcMain.on('setTitleBarColors', (event, bgColor, iconColor) => {
	const window = BrowserWindow.fromWebContents(event.sender);
	if(window === null) return;
	
	// MacOS title bar overlay buttons do not need styling so the function is undefined
	if(window.setTitleBarOverlay === undefined) return;

	window.setTitleBarOverlay({
		color: bgColor,
		symbolColor: iconColor,
		height: 40
	});
});

// --- Interfaces for IPC Handlers ---

interface NucleiScanOptions {
  target?: string;
  targetList?: string;
  templates?: string[];
  severity?: string[];
  output?: string;
  jsonOutput?: boolean;
  verbose?: boolean;
  additionalArgs?: string;
  analysisType?: 'wordpress'; // Added for specific analysis
}

// --- Interfaces for WPVulnerability API and Analysis ---

interface WPVulnResponse {
  error: number;
  message?: string;
  data?: PluginData;
}

interface PluginData {
  name: string;
  plugin: string; // slug
  link: string;
  vulnerability: Vulnerability[];
}

interface Vulnerability {
  uuid: string;
  name: string;
  description?: string;
  operator: Operator;
  source: Source[];
  impact: ImpactHolder;
}

interface Operator {
  min_version?: string;
  max_version: string;
  max_operator: string;
}

interface Source {
  id: string;
  name: string;
  link: string;
  description?: string;
  date?: string;
}

// Using a simplified structure for ImpactHolder as direct unmarshalling logic isn't needed
interface ImpactHolder {
  cvss?: CVSS;
  cwe?: CWE[];
}

interface CVSS {
  version: string;
  vector: string;
  score: number;
  severity: string;
}

interface CWE {
  cwe: string;
  name: string;
  description: string;
}

// Interface for cvemap output (simplified based on usage)
interface CvemapOutput {
  is_template?: boolean; // Optional boolean
}

// Interface for structured analysis result
interface WordPressAnalysisResult {
  pluginSlug: string;
  detectedVersion: string;
  apiQueried: boolean;
  apiError?: string;
  vulnerabilitiesFound: number;
  applicableVulnerabilities: AnalyzedVulnerability[];
  processingError?: string; // For errors during line processing
}

interface AnalyzedVulnerability extends Vulnerability {
  cvemapTemplate?: boolean | null; // null if lookup failed or N/A
  cvemapError?: string;
}


interface TemplateInfo {
  path: string;
  tags: string[];
}

interface SaveTemplateArgs {
  name: string;
  content: string;
}

interface LoadTemplateArgs {
  path: string;
}

interface SelectFileOptions {
  directory?: boolean;
  filters?: Electron.FileFilter[];
}

interface SelectSavePathOptions {
  defaultPath?: string;
  filters?: Electron.FileFilter[];
}

// Interface for the tree structure
interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeItem[];
}

// --- Nuclei Configuration ---

// Ensure the nuclei config directory exists
const nucleiConfigDir = path.join(homedir(), ".nuclei-gui")
if (!existsSync(nucleiConfigDir)) {
  mkdirSync(nucleiConfigDir, { recursive: true })
}

const templatesDir = path.join(homedir(), "nuclei-templates")
if (!existsSync(templatesDir)) {
  mkdirSync(templatesDir, { recursive: true })
}


// --- WordPress Analysis Logic ---

const wpVulnApiEndpointTemplate = "https://www.wpvulnerability.net/plugin/%s";
// Adjusted regex: make "wordpress-" prefix optional, allow ":" followed by non-"]" chars
const nucleiWpRegex = /\[(?:wordpress-)?([a-zA-Z0-9_-]+)(?::[^\]]+)?\].*?\["([0-9.]+)"\]/; 

// Helper to run cvemap command
function runCvemap(cveId: string): { isTemplate?: boolean | null, error?: string } {
  try {
    // Ensure cvemap is installed and in PATH
    const command = `cvemap -id ${cveId} -json`;
    console.log(`Running cvemap: ${command}`);
    const outputBuffer = execSync(command, { timeout: 5000 }); // 5 second timeout
    const outputString = outputBuffer.toString().trim();
    console.log(`cvemap output for ${cveId}: ${outputString}`);

    if (!outputString) {
      return { isTemplate: null, error: "Empty output from cvemap" };
    }

    let cvemapData: any;
    try {
      cvemapData = JSON.parse(outputString);
    } catch (parseError) {
      console.error(`Failed to parse cvemap JSON for ${cveId}:`, parseError);
      return { isTemplate: null, error: `JSON parse error: ${(parseError as Error).message}` };
    }

    // Handle both array and object responses from cvemap
    let resultData: CvemapOutput | null = null;
    if (Array.isArray(cvemapData) && cvemapData.length > 0) {
      resultData = cvemapData[0]; // Use the first element if it's an array
    } else if (typeof cvemapData === 'object' && cvemapData !== null && !Array.isArray(cvemapData)) {
      resultData = cvemapData; // Use the object directly
    }

    if (resultData && typeof resultData.is_template === 'boolean') {
      return { isTemplate: resultData.is_template };
    } else {
      // is_template key might be missing or not a boolean
      return { isTemplate: null, error: "is_template key missing or invalid in cvemap output" };
    }

  } catch (error) {
    console.error(`Error running cvemap for ${cveId}:`, error);
    // Check if it's a timeout error
    if ((error as any).signal === 'SIGTERM' || (error as any).code === 'ETIMEDOUT') {
       return { isTemplate: null, error: "cvemap command timed out" };
    }
    // Check stderr for the specific API key error
    const stderr = (error as any)?.stderr?.toString() || '';
    if (stderr.includes('api key cannot be empty')) {
      return { isTemplate: null, error: "cvemap failed: API key is missing or empty." };
    }
    // Generic error for other command failures
    return { isTemplate: null, error: `cvemap command execution failed: ${(error as Error).message}` };
  }
}


// Main analysis function for a single line of Nuclei output
async function analyzeWordPressNucleiLine(line: string): Promise<WordPressAnalysisResult | null> {
  const trimmedLine = line.trim();
  if (!trimmedLine) {
    return null; // Skip empty lines
  }

  const matches = trimmedLine.match(nucleiWpRegex);
  if (!matches || matches.length !== 3) {
    console.warn(`[WordPress Analysis] Could not parse plugin/version from line: ${trimmedLine}`);
    return null; // Skip lines that don't match
  }

  const pluginSlug = matches[1];
  const detectedVersionStr = matches[2];
  let detectedVersion: semver.SemVer | null = null;

  try {
    detectedVersion = semver.parse(detectedVersionStr);
    if (!detectedVersion) throw new Error("Parsed version is null");
  } catch (e) {
    console.error(`[WordPress Analysis] Failed to parse detected version '${detectedVersionStr}' for slug '${pluginSlug}':`, e);
    return {
      pluginSlug,
      detectedVersion: detectedVersionStr,
      apiQueried: false,
      vulnerabilitiesFound: 0,
      applicableVulnerabilities: [],
      processingError: `Invalid detected version: ${detectedVersionStr}`
    };
  }

  const analysisResult: WordPressAnalysisResult = {
    pluginSlug,
    detectedVersion: detectedVersionStr,
    apiQueried: false,
    vulnerabilitiesFound: 0,
    applicableVulnerabilities: [],
  };

  // --- Query WPVulnerability API ---
  const apiUrl = wpVulnApiEndpointTemplate.replace("%s", pluginSlug);
  console.log(`[WordPress Analysis] Querying API: ${apiUrl}`);
  try {
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) }); // 15s timeout
    analysisResult.apiQueried = true;

    if (!response.ok) {
      throw new Error(`API returned non-OK status (${response.status})`);
    }

    const apiResponse: WPVulnResponse = await response.json();

    if (apiResponse.error !== 0) {
      throw new Error(`API Error (${apiResponse.error}): ${apiResponse.message || 'Unknown API error'}`);
    }

    if (!apiResponse.data || apiResponse.data.vulnerability.length === 0) {
      console.log(`[WordPress Analysis] No vulnerabilities found via API for ${pluginSlug}.`);
      return analysisResult; // Return early, no vulns found
    }

    analysisResult.vulnerabilitiesFound = apiResponse.data.vulnerability.length;
    console.log(`[WordPress Analysis] Found ${analysisResult.vulnerabilitiesFound} potential vulnerabilities for ${pluginSlug}. Filtering...`);

    // --- Filter Vulnerabilities ---
    for (const vuln of apiResponse.data.vulnerability) {
      if (!vuln.operator?.max_version) {
        console.warn(`[WordPress Analysis] Skipping vuln UUID ${vuln.uuid} for ${pluginSlug}: Missing max_version`);
        continue;
      }

      try {
        const maxAffectedVersion = semver.parse(vuln.operator.max_version);
        if (!maxAffectedVersion) {
           console.warn(`[WordPress Analysis] Skipping vuln UUID ${vuln.uuid} for ${pluginSlug}: Could not parse max_version '${vuln.operator.max_version}'`);
           continue;
        }

        // Check if detected version is strictly less than max affected version
        if (semver.lt(detectedVersion, maxAffectedVersion)) {
          const analyzedVuln: AnalyzedVulnerability = { ...vuln, cvemapTemplate: null }; // Initialize cvemap field

          // --- Run cvemap for CVE sources ---
          for (const source of vuln.source) {
            if (source.id.startsWith("CVE-")) {
              const cveResult = runCvemap(source.id);
              // Store the first cvemap result found for this vulnerability
              // (Assuming we only care about one CVE's template status per vuln)
              if (analyzedVuln.cvemapTemplate === null) { // Only set if not already set
                 analyzedVuln.cvemapTemplate = cveResult.isTemplate ?? null; // Use null if undefined
                 analyzedVuln.cvemapError = cveResult.error;
              }
              // Log if multiple CVEs are present but we only store the first result
              // else { console.log(`[WordPress Analysis] Multiple CVEs for vuln ${vuln.uuid}, using first cvemap result.`); }
            }
          }
          analysisResult.applicableVulnerabilities.push(analyzedVuln);
        }
      } catch (e) {
        console.warn(`[WordPress Analysis] Skipping vuln UUID ${vuln.uuid} for ${pluginSlug}: Error processing max_version '${vuln.operator.max_version}':`, e);
      }
    }

  } catch (error) {
    console.error(`[WordPress Analysis] Error processing plugin ${pluginSlug}:`, error);
    analysisResult.apiError = (error as Error).message;
    // Keep processingError undefined here unless the error was fatal for the line
  }

  console.log(`[WordPress Analysis] Found ${analysisResult.applicableVulnerabilities.length} applicable vulnerabilities for ${pluginSlug} v${detectedVersionStr}.`);
  return analysisResult;
}


// --- IPC Handlers ---

ipcMain.handle("run-nuclei-scan", async (_, options: NucleiScanOptions) => {
  // Specific handling for WordPress analysis
  if (options.analysisType === 'wordpress') {
    console.log("[WordPress Analysis] Starting WordPress scan with temp file analysis.");
    // Override templates for WordPress scan
    options.templates = ['http/vulnerabilities/wordpress/', 'http/technologies/wordpress/'];
    options.jsonOutput = false; // Ensure JSON is off for standard line parsing

    // Generate temporary file path
    const tempFileName = `nuclei-wp-scan-${crypto.randomBytes(6).toString('hex')}.txt`;
    const tempFilePath = path.join(tmpdir(), tempFileName);
    console.log(`[WordPress Analysis] Using temporary output file: ${tempFilePath}`);

    return new Promise(async (resolve) => {
      const args: string[] = [];
      let analysisResults: WordPressAnalysisResult[] = [];
      let rawOutputAccumulator = ""; // Accumulate raw output for final result if needed
      let errorOutput = "";

      // Build Nuclei arguments
      if (options.target) args.push("-target", options.target);
      else if (options.targetList) args.push("-list", options.targetList);
      
      args.push("-t", options.templates.join(",")); 
      args.push("-o", tempFilePath); // Output to temp file
      args.push("-nc"); // No color codes

      if (options.severity && options.severity.length > 0) args.push("-severity", options.severity.join(","));
      // Do not pass original options.output if it exists, we use the temp file
      if (options.verbose) args.push("-v");
      if (options.additionalArgs) args.push(...options.additionalArgs.split(" "));

      console.log("[WordPress Analysis] Running nuclei with args:", args);
      const nucleiProcess = spawn("nuclei", args);

      // Stream stdout/stderr to frontend for live view
      nucleiProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        rawOutputAccumulator += chunk; // Accumulate for final object, maybe useful
        mainWindow?.webContents.send("nuclei-output", chunk); 
      });

      nucleiProcess.stderr.on("data", (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        mainWindow?.webContents.send("nuclei-output", `[STDERR] ${chunk}`);
      });

      nucleiProcess.on("close", async (code) => {
        console.log(`[WordPress Analysis] Nuclei process exited with code ${code}. Analyzing ${tempFilePath}...`);
        
        try {
          // Read the temporary file
          const fileContent = await readFile(tempFilePath, 'utf-8');
          const lines = fileContent.split('\n');

          // Process each line from the file
          const analysisPromises = lines.map(line => analyzeWordPressNucleiLine(line));
          const results = await Promise.all(analysisPromises);
          analysisResults = results.filter((r): r is WordPressAnalysisResult => r !== null); // Filter out nulls

          console.log(`[WordPress Analysis] Analysis complete. Found ${analysisResults.length} relevant plugin entries.`);

        } catch (readError) {
          console.error(`[WordPress Analysis] Error reading or processing temp file ${tempFilePath}:`, readError);
          errorOutput += `\nError reading temp file: ${(readError as Error).message}`;
        } finally {
          // Clean up the temporary file
          try {
            await unlink(tempFilePath);
            console.log(`[WordPress Analysis] Deleted temporary file: ${tempFilePath}`);
          } catch (deleteError) {
            console.error(`[WordPress Analysis] Failed to delete temporary file ${tempFilePath}:`, deleteError);
            // Log error but don't fail the whole process
          }
        }
        
        // Resolve with analysis results
        resolve({
          code,
          analysisResults, 
          rawOutput: rawOutputAccumulator, // Include accumulated raw output
          errorOutput,
        });
      });

       nucleiProcess.on("error", (err) => {
         console.error("[WordPress Analysis] Failed to start Nuclei process:", err);
         // Attempt to clean up temp file even on spawn error, though it likely wasn't created
         unlink(tempFilePath).catch(e => console.error(`[WordPress Analysis] Error cleaning up temp file on spawn error: ${e}`));
         resolve({
           code: -1, // Indicate failure
           analysisResults: [],
           rawOutput: "",
           errorOutput: `Failed to start Nuclei process: ${err.message}`,
         });
       });

    });
  } 
  // --- Original generic scan logic ---
  else {
    console.log("Starting generic Nuclei scan.");
    return new Promise((resolve) => {
      const args: string[] = [];

      // Add target
      if (options.target) {
        args.push("-target", options.target);
      } else if (options.targetList) {
        args.push("-list", options.targetList);
      }

      // Add templates with explicit check
      let relativeTemplatePaths: string[] = []; // Initialize outside
      // Check if options.templates exists and has items before mapping
      if (options.templates && options.templates.length > 0) { 
          // Re-add type assertion for map as TS needs it here
          relativeTemplatePaths = (options.templates as string[]).map((absolutePath: string) => 
            path.relative(templatesDir, absolutePath) 
          );
      }

      // Only add the argument if templates were processed
      if (relativeTemplatePaths.length > 0) {
          args.push("-t", relativeTemplatePaths.join(","));
      }

      // Add other options
      if (options.severity && options.severity.length > 0) {
        args.push("-severity", options.severity.join(","));
      }
      if (options.output) {
        args.push("-output", options.output);
      }
      if (options.jsonOutput) {
        args.push("-json"); // Generic scan can use JSON
      }
      if (options.verbose) {
        args.push("-v");
      }
      if (options.additionalArgs) {
        args.push(...options.additionalArgs.split(" "));
      }

      console.log("Running generic nuclei with args:", args);

      const nucleiProcess = spawn("nuclei", args);

      let output = ""; // Declare variables in the correct scope
      let errorOutput = "";

      nucleiProcess.stdout.on("data", (data) => {
        const chunk = data.toString();
        output += chunk;
        mainWindow?.webContents.send("nuclei-output", chunk);
      });

      nucleiProcess.stderr.on("data", (data) => {
        const chunk = data.toString();
        // Send stderr data also to the main output channel
        output += chunk; // Append to the combined output variable as well
        mainWindow?.webContents.send("nuclei-output", `[STDERR] ${chunk}`);
        // Keep track of errors separately if needed later
        errorOutput += chunk;
      });

      nucleiProcess.on("close", (code) => {
        console.log(`Generic Nuclei process exited with code ${code}`);
        resolve({
          code,
          output, // Resolve with raw output for generic scans
          errorOutput,
        });
      });

      nucleiProcess.on("error", (err) => {
        console.error("Failed to start generic Nuclei process:", err);
        resolve({
          code: -1, // Indicate failure
          output: "",
          errorOutput: `Failed to start Nuclei process: ${err.message}`,
        });
      });
    }); // End of Promise for generic scan
  } // End of else block
}); // End of ipcMain.handle("run-nuclei-scan", ...)
  
  ipcMain.handle("get-templates", async (): Promise<TemplateInfo[]> => {
	// TODO: Consider adding error handling for spawn failure or empty output
	return new Promise((resolve) => {
	  const nucleiProcess = spawn("nuclei", ["-tl"])
  
	  let output = ""
  
	  nucleiProcess.stdout.on("data", (data) => {
		output += data.toString()
	  })
  
	  nucleiProcess.on("close", () => {
		// Parse the template list output
		const templates = output
		  .split("\n")
		  .filter((line) => line.trim().length > 0)
		  .map((line) => {
			const parts = line.split("[")
			if (parts.length >= 2) {
			  const path = parts[0].trim()
			  const tagsStr = "[" + parts.slice(1).join("[")
			  const tags = tagsStr.match(/\[(.*?)\]/g) || []
			  return {
				path,
				tags: tags.map((tag) => tag.replace(/[[\]]/g, "")),
			  }
			}
			return { path: line.trim(), tags: [] }
		  })
  
		resolve(templates)
	  })
	})
  })
  
  ipcMain.handle("save-template", async (_, { name, content }: SaveTemplateArgs) => {
	// TODO: Add error handling for writeFileSync
	const templatePath = path.join(templatesDir, `${name}.yaml`)
	writeFileSync(templatePath, content)
	return { success: true, path: templatePath }
  })
  
  ipcMain.handle("load-template", async (_, { path: templatePath }: LoadTemplateArgs) => {
	try {
	  const content = readFileSync(templatePath, "utf8")
	  return { success: true, content }
	} catch (error) {
	  return { success: false, error: (error as Error).message }
	}
  })
  
  ipcMain.handle("select-file", async (_, options: SelectFileOptions) => {
	const result = await dialog.showOpenDialog({
	  properties: [options.directory ? "openDirectory" : "openFile"],
	  filters: options.filters || [],
	})
  
	return result.filePaths[0] || null
  })
  
  ipcMain.handle("select-save-path", async (_, options: SelectSavePathOptions) => {
	const result = await dialog.showSaveDialog({
	  defaultPath: options.defaultPath || "",
	  filters: options.filters || [],
	})
  
	return result.filePath || null
  })
  
  // --- Helper function to recursively read directory ---
  async function readDirectoryRecursive(dirPath: string): Promise<TreeItem[]> {
	const entries = await readdir(dirPath, { withFileTypes: true });
	const items: TreeItem[] = [];
  
	for (const entry of entries) {
	  const fullPath = path.join(dirPath, entry.name);
	  if (entry.isDirectory()) {
		items.push({
		  name: entry.name,
		  path: fullPath,
		  type: 'directory',
		  children: await readDirectoryRecursive(fullPath),
		});
	  } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
		// Only include YAML files
		items.push({
		  name: entry.name,
		  path: fullPath,
		  type: 'file',
		});
	  }
	}
	// Sort directories first, then files, alphabetically
	items.sort((a, b) => {
	  if (a.type === 'directory' && b.type === 'file') return -1;
	  if (a.type === 'file' && b.type === 'directory') return 1;
	  return a.name.localeCompare(b.name);
	});
	return items;
  }
  
  // --- New IPC Handler for Template Tree ---
  ipcMain.handle("get-template-tree", async (): Promise<TreeItem[]> => {
	try {
	  if (!existsSync(templatesDir)) {
		console.log(`Templates directory does not exist: ${templatesDir}`);
		return []; // Return empty array if directory doesn't exist
	  }
	  return await readDirectoryRecursive(templatesDir);
	} catch (error) {
	  console.error("Error reading template directory:", error);
	  return []; // Return empty array on error
	}
  });
