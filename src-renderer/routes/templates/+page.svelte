<script lang="ts">
  import { onMount } from 'svelte';
  import Tree from '$lib/Tree.svelte'; // Assuming Tree component path

  // Define the structure for tree items, matching the main process
  interface TreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeItem[];
  }

  let templateTree: TreeItem[] = []; // Holds the complete tree
  let filteredTree: TreeItem[] = []; // Holds the tree filtered by search
  let searchTerm: string = '';
  let isLoading: boolean = true;
  let error: string | null = null;

  // Fetch the template tree structure when the component mounts
  onMount(async () => {
    try {
      isLoading = true;
      error = null;
      // Ensure the api object is available
      if (window.api && typeof window.api.getTemplateTree === 'function') {
        templateTree = await window.api.getTemplateTree();
        console.log(templateTree)
        filteredTree = templateTree; // Initially show the full tree
      } else {
        throw new Error('API function getTemplateTree not found. Check preload script.');
      }
    } catch (err: any) {
      console.error('Error fetching template tree:', err);
      error = `Failed to load templates: ${err.message || 'Unknown error'}`;
      templateTree = [];
      filteredTree = [];
    } finally {
      isLoading = false;
    }
  });

  // Recursive function to filter the tree based on the search term
  function filterTree(nodes: TreeItem[], term: string): TreeItem[] {
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
        if (node.name.toLowerCase().includes(term)) {
          acc.push(node);
        }
      }
      return acc;
    }, [] as TreeItem[]);
  }

  // Reactive statement to update the filtered tree whenever the search term or the original tree changes
  $: if (templateTree) {
    filteredTree = filterTree(templateTree, searchTerm);
  }

</script>

<div class="space-y-6">
  <header>
    <h1>Templates</h1>
    <p class="text-[color:var(--text-light)]">Browse and manage Nuclei templates</p>
  </header>

  <!-- Search Bar -->
  <div class="relative card p-4"> <!-- Added card and padding for consistency -->
    <input
      type="text"
      bind:value={searchTerm}
      placeholder="Search templates..."
      class="input w-full"
    />
    {#if searchTerm}
      <button
        on:click={() => searchTerm = ''}
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-[color:var(--text-light)] hover:text-[color:var(--text-DEFAULT)] mr-4"
        aria-label="Clear search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
           <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
         </svg>
      </button>
    {/if}
  </div>

  <!-- Template Tree -->
  <div class="card flex flex-col flex-grow">
    <div class="flex-grow overflow-auto bg-[color:var(--card-bg)] rounded p-2 border border-[color:var(--border)] m-4">
      {#if isLoading}
        <p class="text-[color:var(--text-light)] text-center py-4">Loading templates...</p>
      {:else if error}
        <p class="text-red-400 text-center py-4">{error}</p>
      {:else if filteredTree.length === 0 && templateTree.length > 0}
         <p class="text-[color:var(--text-light)] text-center py-4">No templates found matching "{searchTerm}".</p>
      {:else if filteredTree.length === 0 && templateTree.length === 0}
         <p class="text-[color:var(--text-light)] text-center py-4">No templates found in the directory.</p>
      {:else}
        <Tree items={filteredTree} />
      {/if}
    </div> <!-- Added missing closing div -->
  </div>
</div>

<style>
  /* Add any specific styles if needed */
</style>
