<script lang="ts">
  import { Save } from 'lucide-svelte';
  
  let nucleiPath = 'nuclei';
  let templatesPath = '';
  let autoUpdateTemplates = true;
  let defaultOutputDir = '';
  let maxConcurrency = 25;
  let defaultTimeout = 10;
  let defaultRetries = 1;
  
  function saveSettings() {
    // This would require additional implementation in the main process
    alert('Settings saved successfully!');
  }
</script>

<div class="space-y-6">
  <header>
    <h1 class="text-3xl font-bold">Settings</h1>
    <p class="text-gray-400">Configure Knuclei</p>
  </header>
  
  <div class="card">
    <h2 class="text-xl font-bold mb-4">Nuclei Configuration</h2>
    
    <div class="space-y-4">
      <div>
        <label for="nuclei-path" class="block text-sm font-medium mb-1">Nuclei Path</label>
        <input 
          type="text" 
          id="nuclei-path" 
          bind:value={nucleiPath} 
          placeholder="nuclei" 
          class="input"
        />
        <p class="text-xs text-gray-500 mt-1">Path to the nuclei executable</p>
      </div>
      
      <div>
        <label for="templates-path" class="block text-sm font-medium mb-1">Templates Path</label>
        <input 
          type="text" 
          id="templates-path" 
          bind:value={templatesPath} 
          placeholder="Leave empty for default" 
          class="input"
        />
        <p class="text-xs text-gray-500 mt-1">Custom path to nuclei templates</p>
      </div>
      
      <div class="flex items-center">
        <input 
          type="checkbox" 
          id="auto-update" 
          bind:checked={autoUpdateTemplates} 
          class="mr-2"
        />
        <label for="auto-update" class="text-sm">Auto-update templates on startup</label>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2 class="text-xl font-bold mb-4">Scan Defaults</h2>
    
    <div class="space-y-4">
      <div>
        <label for="output-dir" class="block text-sm font-medium mb-1">Default Output Directory</label>
        <input 
          type="text" 
          id="output-dir" 
          bind:value={defaultOutputDir} 
          placeholder="Leave empty for current directory" 
          class="input"
        />
      </div>
      
      <div>
        <label for="concurrency" class="block text-sm font-medium mb-1">Default Concurrency</label>
        <input 
          type="number" 
          id="concurrency" 
          bind:value={maxConcurrency} 
          min="1" 
          max="100" 
          class="input"
        />
        <p class="text-xs text-gray-500 mt-1">Maximum number of templates to be executed in parallel</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="timeout" class="block text-sm font-medium mb-1">Default Timeout (seconds)</label>
          <input 
            type="number" 
            id="timeout" 
            bind:value={defaultTimeout} 
            min="1" 
            class="input"
          />
        </div>
        
        <div>
          <label for="retries" class="block text-sm font-medium mb-1">Default Retries</label>
          <input 
            type="number" 
            id="retries" 
            bind:value={defaultRetries} 
            min="0" 
            class="input"
          />
        </div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2 class="text-xl font-bold mb-4">About</h2>
    
    <div class="space-y-2">
      <p>Knuclei v0.0.1</p>
      <p class="text-sm text-gray-400">A graphical user interface for the Nuclei vulnerability scanner</p>
      <p class="text-sm text-gray-400">Built with Electron, Vite, SvelteKit, and TypeScript</p>
    </div>
  </div>
  
  <div class="flex justify-end">
    <button 
      class="btn btn-primary flex items-center" 
      on:click={saveSettings}
    >
      <Save class="w-4 h-4 mr-2" />
      Save Settings
    </button>
  </div>
</div>

