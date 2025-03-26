import { Metadata } from 'next';
import StockControls from './stock-controls';

export const metadata: Metadata = {
    title: 'Admin Dashboard - Vibe Trader',
    description: 'Admin dashboard for managing Vibe Trader application settings',
};

export default function AdminPage() {
    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid gap-8">
                <section>
                    <h2 className="text-xl font-semibold mb-4">Stock Market Data</h2>
                    <StockControls />
                </section>

                {/* Add more admin sections here as needed */}
            </div>
        </div>
    );
} 