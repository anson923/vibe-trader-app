import { NextResponse } from 'next/server';
import { setStockUpdatesEnabled, isStockUpdatesEnabled } from '@/lib/stock-batch-worker';
import { isServerInitialized } from '@/lib/server-init';
import { supabaseAdmin } from '@/lib/supabase-admin';

// API endpoint to toggle stock updates feature flag
export async function GET() {
    try {
        // Make sure server is initialized
        if (!isServerInitialized()) {
            return NextResponse.json({
                error: 'Server not initialized yet'
            }, { status: 503 });
        }

        // Return current status
        return NextResponse.json({
            enabled: isStockUpdatesEnabled()
        });
    } catch (error) {
        console.error('Error getting stock updates status:', error);
        return NextResponse.json({
            error: 'Failed to get stock updates status'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // Make sure server is initialized
        if (!isServerInitialized()) {
            return NextResponse.json({
                error: 'Server not initialized yet'
            }, { status: 503 });
        }

        // For simplicity, we're using admin authorization in this route
        // In a production environment, you should implement proper authentication here

        // Parse request body
        const { enable } = await request.json();

        if (typeof enable !== 'boolean') {
            return NextResponse.json({
                error: 'Invalid request: "enable" must be a boolean'
            }, { status: 400 });
        }

        // Set the feature flag
        setStockUpdatesEnabled(enable);

        // Return updated status
        return NextResponse.json({
            success: true,
            enabled: isStockUpdatesEnabled()
        });
    } catch (error) {
        console.error('Error updating stock updates status:', error);
        return NextResponse.json({
            error: 'Failed to update stock updates status'
        }, { status: 500 });
    }
} 