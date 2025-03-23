import { startStockWorker } from './stock-batch-worker';
import { initializeCache } from './server-store';

// Flag to track initialization
let initialized = false;
let initializationPromise: Promise<void> | null = null;

// Function to initialize all server-side services
export async function initializeServer(): Promise<void> {
    // If already initialized, return immediately
    if (initialized) {
        return;
    }
    
    // If initialization is in progress, wait for it to complete
    if (initializationPromise) {
        return initializationPromise;
    }
    
    // Start initialization
    initializationPromise = doInitialization();
    return initializationPromise;
}

// Actual initialization function
async function doInitialization(): Promise<void> {
    try {
        console.log('Initializing server...');
        
        // Initialize cache first (posts and stocks)
        await initializeCache();
        
        // Start the stock worker which will periodically update stock data
        await startStockWorker();
        
        initialized = true;
        console.log('Server initialization complete');
    } catch (error) {
        console.error('Error during server initialization:', error);
        initializationPromise = null; // Allow retry
        throw error;
    }
}

// Export a function to check if server is initialized
export function isServerInitialized(): boolean {
    return initialized;
} 