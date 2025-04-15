<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  // Removed import of TreeItem itself

  // Define the structure for tree items
  interface TreeItemData {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeItemData[];
    // Optional: Add expanded state if managed within the data
    // expanded?: boolean;
  }

  export let item: TreeItemData;
  export let level: number = 0;
  export let selectable: boolean = false;
  export let selectedPaths: string[] = [];
  // Optional: If expanded state is managed by parent Tree, pass it down
  // export let expanded: boolean = false;

  // Internal expanded state if not passed as prop
  let internalExpanded = false;
  // Use passed-in prop if available, otherwise internal state
  $: expanded = $$props.expanded !== undefined ? $$props.expanded : internalExpanded;

  let isChecked: boolean | null = null;

  const dispatch = createEventDispatcher<{
    select: { path: string; type: 'file' | 'directory' };
    requestUpdateSelection: { pathsToAdd: string[]; pathsToRemove: string[] };
    // Event to notify parent about expansion toggle
    expandToggle: { path: string; expanded: boolean };
  }>();

  // --- Expansion Logic ---
  function toggleExpand() {
    if (item.type === 'directory') {
      const newState = !expanded;
      // If using internal state, update it
      if ($$props.expanded === undefined) {
        internalExpanded = newState;
      }
      // Notify parent
      dispatch('expandToggle', { path: item.path, expanded: newState });
    }
  }

  // --- Selection Logic ---
   function getAllFilePathsRecursive(node: TreeItemData): string[] {
    if (node.type === 'file') {
      return [node.path];
    }
    let paths: string[] = [];
    if (node.type === 'directory' && node.children) {
      for (const child of node.children) {
        paths = paths.concat(getAllFilePathsRecursive(child));
      }
    }
    return paths;
  }

  // Determine checkbox state based on whether the item's own path is selected
  $: {
    if (selectable) {
      // Checkbox is checked if the item's path (file or directory) is in selectedPaths
      isChecked = selectedPaths.includes(item.path);
    } else {
      // Not selectable, checkbox is not relevant (or shown)
      isChecked = false; // Default to false, though it won't be visible
    }
  }

  function handleCheckboxChange(event: Event) {
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    const shouldBeSelected = target.checked;
    let pathsToAdd: string[] = [];
    let pathsToRemove: string[] = [];

    // Add or remove the item's own path based on the checkbox state
    if (shouldBeSelected) {
      // Add path if it's not already selected (shouldn't happen with current logic, but safe)
      if (!selectedPaths.includes(item.path)) {
        pathsToAdd = [item.path];
      }
    } else {
      // Remove path if it is currently selected
      if (selectedPaths.includes(item.path)) {
        pathsToRemove = [item.path];
      }
    }

    if (pathsToAdd.length > 0 || pathsToRemove.length > 0) {
        dispatch('requestUpdateSelection', { pathsToAdd, pathsToRemove });
    }
  }

   function handleItemClick() {
    dispatch('select', { path: item.path, type: item.type });
    // Toggle expansion on click for directories
    if (item.type === 'directory') {
      toggleExpand();
    }
  }

  $: indentStyle = `padding-left: ${level * 1.5}rem;`;

</script>

<!-- Renders only the current item, no recursion here -->
<div class="tree-item select-none group" style={indentStyle}>
  <div
    class="flex items-center space-x-1 cursor-pointer hover:bg-gray-700 rounded px-1 py-0.5"
    on:click={handleItemClick}
    role="treeitem"
    tabindex="0"
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(); }}
    aria-expanded={item.type === 'directory' ? expanded : undefined}
    aria-selected={selectable ? (isChecked === true) : undefined}
  >
    <!-- Checkbox -->
    {#if selectable}
      <input
        type="checkbox"
        class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-800"
        checked={isChecked === true}
        aria-label={`Select ${item.name}`}
        on:change={handleCheckboxChange}
        on:click|stopPropagation
      />
    {/if}

    <!-- Expansion Arrow (only for directories) -->
    {#if item.type === 'directory'}
      <button
        class="flex-shrink-0 w-4 h-4 text-gray-400 hover:text-gray-200 transition-transform duration-100 {expanded ? 'rotate-90' : ''}"
        on:click|stopPropagation={toggleExpand}
        aria-label={expanded ? 'Collapse' : 'Expand'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    {/if}

    <!-- Placeholder (only for files when NOT selectable, to maintain alignment) -->
    {#if item.type === 'file' && !selectable}
      <div class="w-4 flex-shrink-0"></div>
    {/if}
    <!-- Note: If it's a file AND selectable, the checkbox occupies this space -->

    <!-- Icon -->
    {#if item.type === 'directory'}
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 text-yellow-500">
         <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
       </svg>
    {:else}
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 flex-shrink-0 text-gray-300">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
       </svg>
    {/if}

    <!-- Item Name -->
    <span class="truncate text-sm text-gray-200 group-hover:text-white">{item.name}</span>
  </div>

  <!-- Child rendering is now handled by the parent Tree component -->
</div>
