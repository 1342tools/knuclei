<script lang="ts">
  import { onDestroy } from 'svelte';

  // Types are now global via app.d.ts, no import needed

  let url = '';
  let isLoading = false;
  let scanOutput = ''; // Keep for live raw output
  let analysisResults: WordPressAnalysisResult[] = []; // Store structured results
  let scanError = ''; // Keep for general errors

  async function runScan() {
    if (!window.api) {
      alert('API not available. Preload script might have failed.');
      return;
    }

    isLoading = true;
    scanOutput = ''; // Clear raw output display
    analysisResults = []; // Clear previous analysis results
    scanError = ''; // Clear previous errors
    console.log(`Initiating WordPress analysis scan for URL: ${url}`);

    // Clear previous listeners before starting a new scan
    window.api.removeAllListeners(); 

    // Listen for output chunks
    window.api.onNucleiOutput((outputChunk) => {
      scanOutput += outputChunk;
      // Optional: Auto-scroll or update UI more dynamically here
    });

    // Listen for errors (though stderr is currently routed to output in main.ts)
    window.api.onNucleiError((errorChunk) => {
       scanError += errorChunk; 
    });

    try {
      // Specify target and the analysis type
      const options = {
        target: url,
        analysisType: 'wordpress' as const, // Explicitly set analysis type
      };

      console.log('Calling window.api.runNucleiScan with options:', options);
      // The backend now returns an object possibly containing analysisResults
      const result = await window.api.runNucleiScan(options); 
      
      console.log('Scan process finished with code:', result.code);
      
      // Store the structured analysis results if available
      if (result.analysisResults) {
        analysisResults = result.analysisResults;
        console.log('Received analysis results:', analysisResults);
      } else {
         console.warn('Scan finished, but no analysis results were returned.');
         // Optionally display raw output if analysis failed but raw output exists
         if (result.output && !scanOutput) {
            scanOutput = result.output;
         }
      }

      // Capture any final error output from the process itself
      if (result.errorOutput) {
         scanError += `\nProcess stderr: ${result.errorOutput}`;
      }
      if (result.code !== 0 && !scanError) {
         scanError += `\nScan process exited with non-zero code: ${result.code}`;
      }
      
    } catch (error) {
      console.error('Error running WordPress Nuclei analysis scan:', error);
      scanError += `Error invoking scan: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      isLoading = false;
    }
  }

  // Clean up listeners when the component is destroyed
  onDestroy(() => {
    if (window.api) {
      window.api.removeAllListeners();
    }
  });
</script>

<div class="p-4">
  <!-- Use h1 style from app.css -->
  <h1 class="mb-4">Prebuilt Scans</h1> 

  <!-- Use card class for consistency -->
  <div class="card mb-4"> 
    <!-- Use h2 style from app.css -->
    <h2 class="mb-2">WordPress Scan</h2> 
    <!-- Use text-light variable -->
    <p class="text-sm text-[color:var(--text-light)] mb-3">Scan a WordPress site for common vulnerabilities.</p> 
    <div class="flex items-center space-x-2">
      <input
        type="text"
        bind:value={url}
        placeholder="Enter WordPress URL (e.g., https://example.com)"
        class="input w-full max-w-xs" 
      />
      <!-- Use btn-primary class -->
      <button class="btn btn-primary" on:click={runScan} disabled={!url}>Run Scan</button> 
    </div>
  </div>

  <!-- More prebuilt scans can be added here -->

  {#if isLoading}
    <div class="mt-4">
      <p>Scanning in progress...</p>
      <!-- Use progress class -->
      <progress class="progress w-full"></progress> 
    </div>
  {/if}

  <!-- Display Structured Analysis Results -->
  {#if analysisResults.length > 0}
    <div class="mt-6 space-y-4">
       <!-- Use h3 style and border variable -->
      <h3 class="mb-3 border-b border-[color:var(--border)] pb-1">Analysis Results:</h3> 
      {#each analysisResults as result}
         <!-- Use card class -->
        <div class="card"> 
           <!-- Use h4 style (implicitly from body), primary color, and text-light -->
          <h4 class="text-lg font-medium text-[color:var(--primary)]">Plugin: {result.pluginSlug} <span class="text-sm text-[color:var(--text-light)]">(v{result.detectedVersion})</span></h4> 
          
          {#if result.processingError}
             <!-- Use primary color for errors/warnings -->
            <p class="text-[color:var(--primary)] mt-1">Processing Error: {result.processingError}</p> 
          {/if}
          {#if result.apiError}
             <!-- Use primary color for errors/warnings -->
            <p class="text-[color:var(--primary)] mt-1">API Error: {result.apiError}</p> 
          {/if}

          {#if result.applicableVulnerabilities.length > 0}
             <!-- Use text-light for info -->
            <p class="mt-2 text-[color:var(--text-light)]">{result.applicableVulnerabilities.length} Applicable Vulnerabilities Found:</p> 
            <ul class="list-disc list-inside mt-2 space-y-3 pl-2">
              {#each result.applicableVulnerabilities as vuln}
               <!-- Use primary color for border -->
              <li class="border-l-2 border-[color:var(--primary)] pl-3 py-1"> 
                 <!-- Use primary color for vuln name -->
                 <!-- Correctly escaped '<' to '<' -->
                <strong class="text-[color:var(--primary)]">{vuln.name}</strong> (Affected: &lt {vuln.operator.max_version}) 
                {#if vuln.description}
                   <!-- Use default text color -->
                  <p class="text-sm mt-1">{vuln.description}</p> 
                  {/if}
                   {#if vuln.impact?.cvss}
                     <!-- Use text-light -->
                    <p class="text-sm text-[color:var(--text-light)]">CVSS: {vuln.impact.cvss.score} ({vuln.impact.cvss.severity}) - {vuln.impact.cvss.vector}</p> 
                   {/if}
                   {#if vuln.impact?.cwe && vuln.impact.cwe.length > 0}
                      <!-- Use text-light -->
                     <p class="text-sm text-[color:var(--text-light)]">CWE(s): {vuln.impact.cwe.map(c => `${c.cwe}: ${c.name}`).join(', ')}</p> 
                   {/if}
                  {#if vuln.source.length > 0}
                     <!-- Use text-light -->
                    <p class="text-sm text-[color:var(--text-light)] mt-1">Sources:</p> 
                    <ul class="list-none pl-4 text-xs">
                      {#each vuln.source as src}
                         <li>
                            <!-- Use primary color for links -->
                           <a href={src.link} target="_blank" rel="noopener noreferrer" class="text-[color:var(--primary)] hover:underline">[{src.name}] {src.id}</a> 
                           {#if src.id.startsWith('CVE-')}
                               <!-- Use text-light -->
                              <span class="ml-2 text-[color:var(--text-light)]"> 
                                 (Template: 
                                 {#if vuln.cvemapError}
                                     <!-- Use primary color for errors -->
                                    <span class="text-[color:var(--primary)]">Lookup Error: {vuln.cvemapError}</span> 
                                 {:else if vuln.cvemapTemplate === true}
                                     <!-- Use text-light for success/info -->
                                    <span class="text-[color:var(--text-light)]">Yes</span> 
                                 {:else if vuln.cvemapTemplate === false}
                                     <!-- Use text-light for neutral/warning -->
                                    <span class="text-[color:var(--text-light)]">No</span> 
                                 {:else}
                                    N/A
                                 {/if}
                                 )
                              </span>
                           {/if}
                         </li>
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/each}
            </ul>
          {:else if !result.apiError && !result.processingError}
              <!-- Use text-light -->
             <p class="mt-2 text-[color:var(--text-light)]">No applicable vulnerabilities found for this version based on API data.</p> 
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Display Raw Output (Optional/Debug) -->
  {#if scanOutput}
    <div class="mt-4">
       <!-- Use h3 style -->
      <h3 class="mb-2">Raw Scan Output:</h3> 
       <!-- Use terminal class -->
      <pre class="terminal text-xs max-h-60">{scanOutput}</pre> 
    </div>
  {/if}

  <!-- Display General Errors -->
  {#if scanError}
     <!-- Use primary color -->
    <div class="mt-4 text-[color:var(--primary)]"> 
       <!-- Use h3 style -->
      <h3 class="mb-2">Scan Errors:</h3> 
       <!-- Use terminal class -->
      <pre class="terminal text-sm">{scanError}</pre> 
    </div>
  {/if}
</div>
