# knuclei

A GUI interface for the tool [nuclei](https://github.com/projectdiscovery/nuclei) by ProjectDiscovery.

## Features

- Template Viewer
- Prebuilt scans
- All existing nuclei functionality accessibly through an easy to use GUI

## Getting Started

### Prerequisites

- Node.js 
- npm

### Installation & Running

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/1342tools/knuclei
    cd knuclei
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application in development mode:**
    ```bash
    npm run start
    ```

### Building the Application

To create a distributable package:

```bash
npm run package
```

This will generate packages for your current operating system in the `out` directory.

## Technology Stack

- [Electron](https://www.electronjs.org/)
- [SvelteKit](https://kit.svelte.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

