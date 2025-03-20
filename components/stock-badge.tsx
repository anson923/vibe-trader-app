import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
    ticker: string;
    price: number;
    priceChange?: number | null;
    priceChangePercentage: number | null;
}

export function StockBadge({ ticker, price, priceChange, priceChangePercentage }: StockBadgeProps) {
    // Determine color based on price change
    const isPositive = (priceChangePercentage || 0) >= 0;
    const bgColor = isPositive ? 'bg-green-900/30' : 'bg-red-900/30';
    const textColor = isPositive ? 'text-green-500' : 'text-red-500';
    const borderColor = isPositive ? 'border-green-600' : 'border-red-600';

    // Format price with two decimal places
    const formattedPrice = price.toFixed(2);

    // Format price change with sign and two decimal places if available
    const formattedPriceChange = priceChange !== null && priceChange !== undefined
        ? `${isPositive ? '+' : ''}${priceChange.toFixed(2)}`
        : '';

    // Format percentage with + or - sign and two decimal places
    const formattedPercentage = priceChangePercentage !== null
        ? `${isPositive ? '+' : ''}${priceChangePercentage.toFixed(2)}%`
        : '0.00%';

    return (
        <Badge
            className={`px-2 py-1 ${bgColor} ${textColor} ${borderColor} rounded-full border flex items-center gap-1 font-mono`}
            variant="outline"
        >
            <span className="font-bold">${ticker}</span>
            <span className="mx-1">|</span>
            <span>{formattedPrice}</span>
            {priceChange !== null && priceChange !== undefined && (
                <>
                    <span className="mx-1">|</span>
                    <span className={`font-semibold ${textColor}`}>{formattedPriceChange}</span>
                </>
            )}
            <span className="mx-1">|</span>
            <span className={`font-semibold ${textColor}`}>{formattedPercentage}</span>
        </Badge>
    );
} 