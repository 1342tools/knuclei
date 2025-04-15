<script lang="ts">
  import TreeItem from './TreeItem.svelte';
  import Tree from './Tree.svelte'; // Import self for recursion
  import { createEventDispatcher } from 'svelte';

  // Define the structure for tree items
  interface TreeItemData {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: TreeItemData[];
  }

  // Props
  export let items: TreeItemData[] = [];
  export let level: number = 0; // Current indentation level (for recursive calls)
  export let selectable: boolean = false; // Enable selection mode
  export let selectedPaths: string[] = []; // Bindable array of selected paths

  // Internal state for expansion
  let expandedPaths = new Set<string>();

  const dispatch = createEventDispatcher<{
    select: { path: string; type: 'file' | 'directory' };
    // Forward selection changes if needed by the page using the Tree
    selectionChange: string[];
  }>();

  // Function to handle the selection update request from TreeItem or nested Tree
  function handleRequestUpdate(event: CustomEvent<{ pathsToAdd: string[]; pathsToRemove: string[] }>) {
    const { pathsToAdd, pathsToRemove } = event.detail;
    let currentSelected = new Set(selectedPaths);

    pathsToRemove.forEach(path => currentSelected.delete(path));
    pathsToAdd.forEach(path => currentSelected.add(path));

    // Update the bound selectedPaths prop
    selectedPaths = Array.from(currentSelected);
    // Dispatch an event to notify parent page if necessary
    dispatch('selectionChange', selectedPaths);
  }

  // Function to handle expansion toggles from TreeItem or nested Tree
  function handleExpandToggle(event: CustomEvent<{ path: string; expanded: boolean }>) {
    const { path, expanded } = event.detail;
    if (expanded) {
      expandedPaths.add(path);
    } else {
      expandedPaths.delete(path);
    }
    expandedPaths = expandedPaths; // Trigger reactivity
  }

  // Forward the basic select event if needed
  function forwardSelect(event: CustomEvent<{ path: string; type: 'file' | 'directory' }>) {
    dispatch('select', event.detail);
  }

</script>

<div class="tree-container space-y-px">
  {#if items && items.length > 0}
    {#each items as item (item.path)}
      <!-- Render the TreeItem for the current node -->
      <TreeItem
        {item}
        {level}
        {selectable}
        {selectedPaths}
        expanded={expandedPaths.has(item.path)}
        on:requestUpdateSelection={handleRequestUpdate}
        on:expandToggle={handleExpandToggle}
        on:select={forwardSelect}
      />

      <!-- If the item is an expanded directory with children, render a nested Tree -->
      {#if item.type === 'directory' && expandedPaths.has(item.path) && item.children && item.children.length > 0}
        <!-- Use explicit <Tree> component for recursion -->
        <Tree
          items={item.children}
          level={level + 1}
          {selectable}
          bind:selectedPaths={selectedPaths}
          on:requestUpdateSelection={handleRequestUpdate}
          on:expandToggle={handleExpandToggle}
          on:select={forwardSelect}
        />
      {/if}
    {/each}
  {:else}
    <!-- Optional: Message when the tree/subtree is empty -->
    {#if level === 0} <!-- Only show top-level empty message -->
      <!-- <p class="text-gray-500 text-sm px-2 py-1">No items to display.</p> -->
    {/if}
  {/if}
</div>

<style>
  /* Add any container-specific styles if needed */
  .tree-container {
    /* Example: */
    /* padding-left: 0.5rem; */
  }
</style>
