<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Play, StopCircle, Save, Upload, Trash2 } from 'lucide-svelte';
  import Tree from '$lib/Tree.svelte'; // Import the Tree component

  // Define the structure for tree items, matching Tree.svelte
  interface TreeItemData {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeItemData[];
  }

  let target = '';
  let targetList = '';
  // selectedTemplates will now be bound to the Tree component's selectedPaths
  let selectedTemplates: string[] = [];
  let severity: string[] = [];
  let output = ''; // This seems unused? Keeping for now.
  let outputPath = '';
  let jsonOutput = false;
  let verbose = false;
  let additionalArgs = '';

  let isScanning = false;
  let scanOutput = '';
  let scanErrors = '';

  // Template Tree state
  let templateTree: TreeItemData[] = []; // Holds the complete tree
  let filteredTree: TreeItemData[] = []; // Holds the filtered tree
  let templateFilter = ''; // Search term for templates

  onMount(async () => {
    if (window.api) {
      try {
        // Fetch the hierarchical template tree structure
        templateTree = await window.api.getTemplateTree();
        filteredTree = templateTree; // Initialize filtered tree
      } catch (error) {
        console.error('Failed to get template tree:', error);
        // Optionally show an error message to the user
      }

      window.api.onNucleiOutput((output) => {
        scanOutput += output;
        // Auto-scroll to bottom
        const terminal = document.getElementById('output-terminal');
        if (terminal) {
          terminal.scrollTop = terminal.scrollHeight;
        }
      });

      window.api.onNucleiError((error) => {
        scanErrors += error;
      });
    }
  });

  onDestroy(() => {
    if (window.api) {
      window.api.removeAllListeners();
    }
  });

  async function selectTargetList() {
    if (window.api) {
      const filePath = await window.api.selectFile({
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
      });
      if (filePath) {
        targetList = filePath;
      }
    }
  }

  async function selectOutputPath() {
    if (window.api) {
      const filePath = await window.api.selectSavePath({
        defaultPath: 'nuclei-results.txt',
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'JSON Files', extensions: ['json'] }
        ]
      });
      if (filePath) {
        outputPath = filePath;
      }
    }
  }

  async function startScan() {
    if (!target && !targetList) {
      alert('Please provide a target or target list');
      return;
    }
    if (selectedTemplates.length === 0) {
       alert('Please select at least one template or directory');
       return;
    }

    isScanning = true;
    scanOutput = '';
    scanErrors = '';

    try {
      if (window.api) {
        // selectedTemplates is now correctly populated by the Tree component binding
        await window.api.runNucleiScan({
          target,
          targetList,
          templates: selectedTemplates,
          severity,
          output: outputPath,
          jsonOutput,
          verbose,
          additionalArgs
        });
      }
    } catch (error) {
      console.error('Scan failed:', error);
      scanErrors += `\nError starting scan: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      isScanning = false;
    }
  }

  function stopScan() {
    // if (window.api) {
    //   window.api.stopNucleiScan(); // TODO: Implement stopNucleiScan in main process and preload
    // }
    isScanning = false; // Force stop state visually
    scanOutput += '\n\n--- Scan manually stopped ---';
    console.log('Attempted to stop scan');
    // alert('Stop functionality requires backend implementation');
  }

  function clearOutput() {
    scanOutput = '';
    scanErrors = '';
  }

  // Removed toggleTemplate function - handled by Tree component

  function toggleSeverity(level: string) {
    if (severity.includes(level)) {
      severity = severity.filter(s => s !== level);
    } else {
      severity = [...severity, level];
    }
  }

  // Recursive function to filter the tree based on the search term
  function filterTree(nodes: TreeItemData[], term: string): TreeItemData[] {
    if (!term) {
      return nodes; // Return all nodes if search term is empty
    }
    term = term.toLowerCase();

    return nodes.reduce((acc, node) => {
      if (node.type === 'directory') {
        const filteredChildren = filterTree(node.children || [], term);
        // Include directory if its name matches OR it has matching children
        if (node.name.toLowerCase().includes(term) || filteredChildren.length > 0) {
          // Return the directory with potentially filtered children
          acc.push({ ...node, children: filteredChildren });
        }
      } else if (node.type === 'file') {
        // Include file if its name matches the search term
        if (node.name.toLowerCase().includes(term) || node.path.toLowerCase().includes(term)) {
          acc.push(node);
        }
      }
      return acc;
    }, [] as TreeItemData[]);
  }

  // Reactive statement to update the filtered tree whenever the search term or the original tree changes
  $: if (templateTree) {
    filteredTree = filterTree(templateTree, templateFilter);
  }

</script>

<div class="space-y-6">
  <header>
    <!-- Use h1 style from app.css -->
    <h1>Scan</h1> 
    <!-- Use text-light variable -->
    <p class="text-[color:var(--text-light)]">Configure and run Nuclei scans</p> 
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Scan Configuration -->
    <div class="lg:col-span-1 space-y-6">
      <div class="card">
        <!-- Use h2 style from app.css -->
        <h2 class="mb-4">Target</h2> 

        <div class="space-y-4">
          <div>
            <!-- Use text-light for label -->
            <label for="target" class="block text-sm font-medium mb-1 text-[color:var(--text-light)]">URL/Host</label> 
            <input
              type="text"
              id="target"
              bind:value={target}
              placeholder="example.com"
              class="input"
              disabled={!!targetList}
            />
          </div>

          <div class="flex items-center">
             <!-- Use text-light for label -->
            <span class="text-sm font-medium mr-2 text-[color:var(--text-light)]">OR</span> 
          </div>

          <div class="flex items-center space-x-2">
            <input
              type="text"
              bind:value={targetList}
              placeholder="Path to target list"
              class="input flex-1"
              readonly
              disabled={!!target}
            />
            <!-- Use btn-secondary class -->
            <button 
              class="btn btn-secondary" 
              on:click={selectTargetList}
              disabled={!!target}
            >
              <Upload class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="card">
         <!-- Use h2 style from app.css -->
        <h2 class="mb-4">Output</h2>

        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <input
              type="text"
              bind:value={outputPath}
              placeholder="Output file path (optional)"
              class="input flex-1"
              readonly
            />
             <!-- Use btn-secondary class -->
            <button 
              class="btn btn-secondary" 
              on:click={selectOutputPath}
            >
              <Save class="w-4 h-4" />
            </button>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="json-output"
              bind:checked={jsonOutput}
              class="mr-2 form-checkbox"
            />
             <!-- Use text-light for label -->
            <label for="json-output" class="text-sm text-[color:var(--text-light)]">JSON Output</label> 
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="verbose"
              bind:checked={verbose}
              class="mr-2 form-checkbox"
            />
             <!-- Use text-light for label -->
            <label for="verbose" class="text-sm text-[color:var(--text-light)]">Verbose Output</label> 
          </div>
        </div>
      </div>

      <div class="card">
         <!-- Use h2 style from app.css -->
        <h2 class="mb-4">Severity</h2> 

        <div class="space-y-2">
          {#each ['info', 'low', 'medium', 'high', 'critical'] as level}
            <div class="flex items-center">
              <input
                type="checkbox"
                id={`severity-${level}`}
                checked={severity.includes(level)}
                on:change={() => toggleSeverity(level)}
                class="mr-2 form-checkbox"
              />
               <!-- Use text-light for label -->
              <label for={`severity-${level}`} class="text-sm capitalize text-[color:var(--text-light)]">{level}</label> 
            </div>
          {/each}
        </div>
      </div>

      <div class="card">
         <!-- Use h2 style from app.css -->
        <h2 class="mb-4">Advanced</h2> 

        <div>
           <!-- Use text-light for label -->
          <label for="additional-args" class="block text-sm font-medium mb-1 text-[color:var(--text-light)]">Additional Arguments</label> 
          <input
            type="text"
            id="additional-args"
            bind:value={additionalArgs}
            placeholder="-fr -max-redirects 10"
            class="input"
          />
        </div>
      </div>

      <div class="flex space-x-2">
         <!-- Use btn-primary class -->
        <button 
          class="btn btn-primary flex-1 flex items-center justify-center" 
          on:click={startScan}
          disabled={isScanning || (!target && !targetList) || selectedTemplates.length === 0}
        >
          <Play class="w-4 h-4 mr-2" />
          Start Scan
        </button>

         <!-- Use btn-secondary class -->
        <button 
          class="btn btn-secondary flex items-center justify-center" 
          on:click={stopScan}
          disabled={!isScanning}
        >
          <StopCircle class="w-4 h-4 mr-2" />
          Stop
        </button>
      </div>
    </div>

    <!-- Templates and Output -->
    <div class="lg:col-span-2 space-y-6">
      <div class="card flex flex-col h-[calc(50vh_-_1.5rem)]"> <!-- Adjust height as needed -->
         <!-- Use h2 style from app.css -->
        <h2 class="mb-4 flex-shrink-0">Templates</h2> 

        <div class="mb-4 flex-shrink-0">
          <input
            type="text"
            bind:value={templateFilter}
            placeholder="Search templates by name or path..."
            class="input"
          />
        </div>

        <!-- Template Tree -->
         <!-- Use card-bg and border variables -->
        <div class="flex-grow overflow-auto bg-[color:var(--card-bg)] rounded p-2 border border-[color:var(--border)]"> 
          {#if !templateTree || templateTree.length === 0}
             <!-- Use text-light variable -->
            <p class="text-[color:var(--text-light)] text-center py-4">Loading templates or none found...</p> 
          {:else if filteredTree.length === 0}
             <!-- Use text-light variable -->
            <p class="text-[color:var(--text-light)] text-center py-4">No templates found matching "{templateFilter}".</p> 
          {:else}
            <!-- Tree component itself should ideally use theme variables internally -->
            <Tree items={filteredTree} selectable={true} bind:selectedPaths={selectedTemplates} />
          {/if}
        </div>
      </div>

      <div class="card flex flex-col h-[calc(50vh_-_1.5rem)]"> <!-- Adjust height as needed -->
        <div class="flex justify-between items-center mb-4 flex-shrink-0">
           <!-- Use h2 style from app.css -->
          <h2>Output</h2> 
           <!-- Use btn-outline class -->
          <button 
            class="btn btn-outline flex items-center" 
            on:click={clearOutput}
            disabled={isScanning}
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Clear
          </button>
        </div>

         <!-- Use terminal class -->
        <div id="output-terminal" class="terminal flex-grow"> 
          {#if scanOutput}
            <pre>{scanOutput}</pre>
          {:else if isScanning}
            <p>Scanning in progress...</p>
          {:else}
             <!-- Use text-light variable -->
            <p class="text-[color:var(--text-light)]">Output will appear here when you start a scan.</p> 
          {/if}
        </div>

        {#if scanErrors}
          <div class="mt-4 flex-shrink-0">
             <!-- Use h3 style and primary color for errors -->
            <h3 class="mb-2 text-[color:var(--primary)]">Errors</h3> 
             <!-- Use terminal class and primary color for errors -->
            <div class="terminal text-[color:var(--primary)] max-h-32 overflow-y-auto"> 
              <pre>{scanErrors}</pre>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
