<script lang="ts">
  import { onMount } from 'svelte';
  import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-svelte';
  
  let recentScans = [
    { 
      id: 1, 
      target: 'example.com', 
      date: '2023-10-15 14:30', 
      findings: 3,
      status: 'completed'
    },
    { 
      id: 2, 
      target: 'test-site.org', 
      date: '2023-10-14 09:15', 
      findings: 0,
      status: 'completed'
    },
    { 
      id: 3, 
      target: 'demo.local', 
      date: '2023-10-13 16:45', 
      findings: 7,
      status: 'completed'
    }
  ];
  
  let stats = {
    totalScans: 24,
    vulnerabilitiesFound: 42,
    templatesAvailable: 0
  };
  
  onMount(async () => {
    if (window.api) {
      try {
        const templates = await window.api.getTemplates();
        stats.templatesAvailable = templates.length;
        console.log(stats.templatesAvailable)
      } catch (error) {
        console.error('Failed to get templates:', error);
      }
    }
  });
</script>

<div class="space-y-6">
  <header>
    <!-- Use h1 style from app.css -->
    <h1>Dashboard</h1> 
    <!-- Use text-light variable -->
    <p class="text-[color:var(--text-light)]">Overview of your Nuclei scanning activities</p> 
  </header>
  
  <!-- Use .card class defined in app.css -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card flex items-center">
      <!-- Use theme colors - text-light for info -->
      <div class="p-3 rounded-full bg-[color:var(--text-light)]/10 mr-4"> 
        <Shield class="w-6 h-6 text-[color:var(--text-light)]" />
      </div>
      <div>
        <!-- Use h3 style from app.css -->
        <h3>Total Scans</h3> 
        <p class="text-2xl font-bold">{stats.totalScans}</p>
      </div>
    </div>
    
    <div class="card flex items-center">
      <!-- Use theme colors - primary for vulnerabilities/warnings -->
      <div class="p-3 rounded-full bg-[color:var(--primary)]/10 mr-4"> 
        <AlertTriangle class="w-6 h-6 text-[color:var(--primary)]" />
      </div>
      <div>
        <h3>Vulnerabilities</h3>
        <p class="text-2xl font-bold">{stats.vulnerabilitiesFound}</p>
      </div>
    </div>
    
    <div class="card flex items-center">
       <!-- Use theme colors - text-light for info -->
      <div class="p-3 rounded-full bg-[color:var(--text-light)]/10 mr-4">
        <CheckCircle class="w-6 h-6 text-[color:var(--text-light)]" />
      </div>
      <div>
        <h3>Templates</h3>
        <p class="text-2xl font-bold">{stats.templatesAvailable}</p>
      </div>
    </div>
  </div>
  
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <!-- Use h2 style from app.css -->
      <h2>Recent Scans</h2> 
      <!-- Use standard btn class, which uses primary border -->
      <a href="/scan" class="btn">New Scan</a> 
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
           <!-- Use border variable -->
          <tr class="border-b border-[color:var(--border)]">
            <th class="text-left py-2 px-4 font-semibold text-[color:var(--text-light)]">Target</th>
            <th class="text-left py-2 px-4 font-semibold text-[color:var(--text-light)]">Date</th>
            <th class="text-left py-2 px-4 font-semibold text-[color:var(--text-light)]">Findings</th>
            <th class="text-left py-2 px-4 font-semibold text-[color:var(--text-light)]">Status</th>
            <th class="text-left py-2 px-4 font-semibold text-[color:var(--text-light)]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each recentScans as scan}
             <!-- Use border variable and card-bg for hover -->
            <tr class="border-b border-[color:var(--border)] hover:bg-[color:var(--card-bg)]">
              <td class="py-2 px-4">{scan.target}</td>
              <td class="py-2 px-4">{scan.date}</td>
              <td class="py-2 px-4">
                 <!-- Use primary for findings > 0, text-light otherwise -->
                <span class="px-2 py-1 rounded-full text-xs {scan.findings > 0 ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : 'bg-[color:var(--text-light)]/10 text-[color:var(--text-light)]'}">
                  {scan.findings} {scan.findings === 1 ? 'issue' : 'issues'}
                </span>
              </td>
              <td class="py-2 px-4">
                <div class="flex items-center">
                   <!-- Use text-light for completed/running, primary for failed -->
                  {#if scan.status === 'completed'}
                    <CheckCircle class="w-4 h-4 text-[color:var(--text-light)] mr-2" />
                    <span>Completed</span>
                  {:else if scan.status === 'running'}
                    <Clock class="w-4 h-4 text-[color:var(--text-light)] mr-2" />
                    <span>Running</span>
                  {:else}
                    <AlertTriangle class="w-4 h-4 text-[color:var(--primary)] mr-2" />
                    <span>Failed</span>
                  {/if}
                </div>
              </td>
              <td class="py-2 px-4">
                 <!-- Use text-light for view, primary for delete -->
                <button class="text-[color:var(--text-light)] hover:underline mr-2">View</button> 
                <button class="text-[color:var(--primary)] hover:underline">Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
