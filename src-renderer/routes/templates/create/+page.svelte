<script lang="ts">
  import { Save, ArrowLeft } from 'lucide-svelte';
  
  let templateName = '';
  let templateContent = `id: template-id
info:
  name: Template Name
  author: author
  severity: info
  description: Template description
  tags: tag1,tag2

requests:
  - method: GET
    path:
      - "{{BaseURL}}"
    matchers:
      - type: word
        words:
          - "example"`;
  
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
      } catch (error) {
        console.error('Error saving template:', error);
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
      <h1 class="text-3xl font-bold">Create Template</h1>
      
      <button 
        class="btn btn-primary flex items-center" 
        on:click={saveTemplate}
      >
        <Save class="w-4 h-4 mr-2" />
        Save Template
      </button>
    </div>
  </header>
  
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
  </div>
  
  <div class="card">
    <label for="template-content" class="block text-sm font-medium mb-1">Template Content</label>
    <textarea 
      id="template-content" 
      bind:value={templateContent} 
      class="input font-mono h-96"
    ></textarea>
    <p class="text-xs text-gray-500 mt-1">Write your template in YAML format</p>
  </div>
  
  <div class="card">
    <h2 class="text-xl font-bold mb-4">Template Structure Help</h2>
    
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">Basic Structure</h3>
        <pre class="bg-gray-900 p-2 rounded-md text-sm overflow-x-auto">
id: template-id
info:
  name: Template Name
  author: author
  severity: info
  description: Template description
  tags: tag1,tag2

requests:
  - method: GET
    path:
      - "{{BaseURL}}"
    matchers:
      - type: word
        words:
          - "example"</pre>
      </div>
      
      <div>
        <h3 class="text-lg font-medium">Matcher Types</h3>
        <ul class="list-disc list-inside space-y-1 text-sm">
          <li><strong>word</strong>: Match specific words in response</li>
          <li><strong>regex</strong>: Match regex patterns</li>
          <li><strong>status</strong>: Match HTTP status codes</li>
          <li><strong>size</strong>: Match response size</li>
          <li><strong>dsl</strong>: Use DSL expressions</li>
        </ul>
      </div>
      
      <div>
        <h3 class="text-lg font-medium">Extractors</h3>
        <pre class="bg-gray-900 p-2 rounded-md text-sm overflow-x-auto">
extractors:
  - type: regex
    name: example
    group: 1
    regex:
      - "Version: ([0-9.]+)"</pre>
      </div>
    </div>
  </div>
</div>

