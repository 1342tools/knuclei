<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { Home, FileText, Play, Settings, Package } from 'lucide-svelte'; // Added Package icon

  // Helper function to construct class string
  function navLinkClass(path: string): string {
    const baseStyles = "flex items-center p-2 border-l-4"; // Base layout styles
    const hoverStyles = "hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"; // Hover styles for border and text
    const isActive = $page.url.pathname === path;

    // Determine border and text color based on active state
    let borderClass = "border-transparent";
    let textClass = "text-[color:var(--text-light)]"; // Default text color

    if (isActive) {
      borderClass = "border-[color:var(--primary)]"; // Active border color
      textClass = "text-[color:var(--primary)]";   // Active text color
    }

    // Combine all classes
    return `${baseStyles} ${borderClass} ${textClass} ${hoverStyles}`;
  }
</script>

<!-- Removed bg-gray-900 text-white - body style from app.css should handle this -->
<div class="min-h-screen flex"> 
  <!-- Sidebar -->
  <!-- Use CSS variable for background -->
  <aside class="w-64 bg-[color:var(--card-bg)] p-4 flex flex-col border-r border-[color:var(--border)]"> 
    <div class="mb-8">
      <!-- Use CSS variable for heading color -->
      <h1 class="text-2xl font-bold text-[color:var(--primary)]">Knuclei</h1> 
      <!-- Use CSS variable for text color -->
      <p class="text-[color:var(--text-light)] text-sm">Vulnerability Scanner</p> 
    </div>
    
    <nav class="flex-1">
      <ul class="space-y-2">
        <li>
          <!-- Use helper function for dynamic classes -->
          <a href="/" class={navLinkClass('/')}>
            <Home class="w-5 h-5 mr-3" />
            Dashboard
          </a>
        </li>
        <li>
          <a href="/scan" class={navLinkClass('/scan')}>
            <Play class="w-5 h-5 mr-3" />
            Scan
          </a>
        </li>
        <li>
          <a href="/templates" class={navLinkClass('/templates')}>
            <FileText class="w-5 h-5 mr-3" />
            Templates
          </a>
        </li>
        <li>
          <a href="/prebuilt" class={navLinkClass('/prebuilt')}>
            <Package class="w-5 h-5 mr-3" />
            Prebuilt Scans
          </a>
        </li>
        <li>
          <a href="/settings" class={navLinkClass('/settings')}>
            <Settings class="w-5 h-5 mr-3" />
            Settings
          </a>
        </li>
      </ul>
    </nav>
    
    <!-- Use CSS variable for border and text color -->
    <div class="mt-auto pt-4 border-t border-[color:var(--border)]"> 
      <p class="text-xs text-[color:var(--text-light)]">Knuclei v1.0.0</p> 
    </div>
  </aside>
  
  <!-- Main content -->
  <!-- Use CSS variable for background -->
  <main class="flex-1 p-6 overflow-auto bg-[color:var(--background)]"> 
    <slot />
  </main>
</div>
