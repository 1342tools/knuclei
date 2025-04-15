<script lang="ts">
  import { onMount } from 'svelte';
  import { Save, ArrowLeft } from 'lucide-svelte';
  
  let templatePath = '';
  let templateContent = '';
  let templateName = '';
  let loading = true;
  let error = '';
  
  onMount(async () => {
    const url = new URL(window.location.href);
    templatePath = url.searchParams.get('path') || '';
    
    if (!templatePath) {
      error = 'No template path provided';
      loading = false;
      return;
    }
    
    if (window.api) {
      try {
        const result = await window.api.loadTemplate({ path: templatePath });
        
        if (result.success) {
          templateContent = result.content;
          // Extract template name from path
          const pathParts = templatePath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          templateName = fileName.replace(/\.yaml$|\.yml$/i, '');
        } else {
          error = result.error || 'Failed to load template';
        }
      } catch (e) {
        error = 'An error occurred while loading the template';
        console.error(e);
      } finally {
        loading = false;
      }
    }
  });
  
  async function saveTemplate() {
    if (!templateName) {
      alert('Please provide a template name');
      return;
    }
    
    if (window.api) {
      try {
        const result = await window.api.saveTemplate({
          name: templateName,
          content: templateContent
        });
        
        if (result.success) {
          alert('Template saved successfully!');
          window.location.href = '/templates';
        } else {
          alert('Failed to save template');
        }
      } catch (e) {
        console.error('Error saving template:', e);
        alert('An error occurred while saving the template');
      }
    }
  }
</script>

<div class="space-y-6">
  <header>
    <a href="/templates" class="flex items-center text-gray-400 hover:text-white mb-4">
      <ArrowLeft class="w-4 h-4 mr-2" />
      Back to Templates
    </a>
    
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Edit Template</h1>
      
      <button 
        class="btn btn-primary flex items-center" 
        on:click={saveTemplate}
        disabled={loading || !!error}
      >
        <Save class="w-4 h-4 mr-2" />
        Save Template
      </button>
    </div>
  </header>
  
  {#if loading}
    <div class="card">
      <p class="text-center py-4">Loading template...</p>
    </div>
  {:else if error}
    <div class="card bg-red-900/20 border-red-800">
      <p class="text-red-400">{error}</p>
    </div>
  {:else}
    <div class="card">
      <div class="mb-4">
        <label for="template-name" class="block text-sm font-medium mb-1">Template Name</label>
        <input 
          type="text" 
          id="template-name" 
          bind:value={templateName} 
          placeholder="my-custom-template" 
          class="input"
        />
        <p class="text-xs text-gray-500 mt-1">The template will be saved as [name].yaml</p>
      </div>
      
      <div>
        <label for="template-path" class="block text-sm font-medium mb-1">Original Path</label>
        <input 
          type="text" 
          id="template-path" 
          value={templatePath} 
          class="input"
          readonly
        />
      </div>
    </div>
    
    <div class="card">
      <label for="template-content" class="block text-sm font-medium mb-1">Template Content</label>
      <textarea 
        id="template-content" 
        bind:value={templateContent} 
        class="input font-mono h-96"
      ></textarea>
    </div>
  {/if}
</div>

