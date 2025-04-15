// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  // Define the structure for tree items used by getTemplateTree
  interface TreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeItem[];
  }

  // --- Interfaces for WPVulnerability API and Analysis (Shared Types) ---
  // These need to be available globally for the frontend components

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
  
  interface ImpactHolder {
    cvss?: CVSS;
    cwe?: CWE[];
  }

  interface Vulnerability {
    uuid: string;
    name: string;
    description?: string;
    operator: Operator;
    source: Source[];
    impact: ImpactHolder;
  }

  interface AnalyzedVulnerability extends Vulnerability {
    cvemapTemplate?: boolean | null; // null if lookup failed or N/A
    cvemapError?: string;
  }

  interface WordPressAnalysisResult {
    pluginSlug: string;
    detectedVersion: string;
    apiQueried: boolean;
    apiError?: string;
    vulnerabilitiesFound: number;
    applicableVulnerabilities: AnalyzedVulnerability[];
    processingError?: string; // For errors during line processing
  }

  // --- API Interface ---
  interface Window {
    api?: {
      // Update runNucleiScan return type to handle both generic and analysis results
      runNucleiScan: (options: any) => Promise<{ 
        code: number; 
        output?: string; // For generic scans
        analysisResults?: WordPressAnalysisResult[]; // For WP analysis
        errorOutput?: string; 
      }>
      getTemplates: () => Promise<{ path: string; tags: string[] }[]>
      saveTemplate: (template: { name: string; content: string }) => Promise<{ success: boolean; path?: string }>
      loadTemplate: (options: { path: string }) => Promise<{ success: boolean; content?: string; error?: string }>
      selectFile: (options: { directory?: boolean; filters?: { name: string; extensions: string[] }[] }) => Promise<
        string | null
      >
      selectSavePath: (options: {
        defaultPath?: string
        filters?: { name: string; extensions: string[] }[]
      }) => Promise<string | null>
      getTemplateTree: () => Promise<TreeItem[]> // Added template tree handler
      onNucleiOutput: (callback: (output: string) => void) => void
      onNucleiError: (callback: (error: string) => void) => void
      removeAllListeners: () => void
    }
  }
}

export {}
