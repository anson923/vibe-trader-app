'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function StockControls() {
    const [isEnabled, setIsEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({
        type: null,
        message: null,
    });

    // Fetch current status on load
    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/stock-updates');

            if (!response.ok) {
                throw new Error(`Failed to fetch status: ${response.statusText}`);
            }

            const data = await response.json();
            setIsEnabled(data.enabled);
            setStatus({ type: 'success', message: 'Status loaded' });
        } catch (error) {
            console.error('Error fetching stock update status:', error);
            setStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStockUpdates = async () => {
        try {
            setIsLoading(true);
            setStatus({ type: null, message: null });

            const response = await fetch('/api/admin/stock-updates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enable: !isEnabled }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const data = await response.json();
            setIsEnabled(data.enabled);
            setStatus({
                type: 'success',
                message: `Stock updates ${data.enabled ? 'enabled' : 'disabled'} successfully`
            });
        } catch (error) {
            console.error('Error toggling stock updates:', error);
            setStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Stock Market Data Updates</CardTitle>
                <CardDescription>
                    Control automatic stock data updates for the application
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium">Auto-updates</p>
                        <p className="text-sm text-gray-500">
                            {isEnabled
                                ? 'Updates every 15 minutes during market hours'
                                : 'Currently disabled, no automatic updates'}
                        </p>
                    </div>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={toggleStockUpdates}
                        disabled={isLoading}
                        aria-label="Toggle stock updates"
                    />
                </div>

                {status.type && (
                    <div className={`mt-4 p-3 rounded-md flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {status.type === 'success' ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <AlertCircle className="h-5 w-5" />
                        )}
                        <p className="text-sm">{status.message}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <p className="text-xs text-gray-500">
                    Last checked: {isLoading ? 'Loading...' : new Date().toLocaleTimeString()}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStatus}
                    disabled={isLoading}
                >
                    Refresh
                </Button>
            </CardFooter>
        </Card>
    );
} 