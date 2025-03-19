import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StockBadgeProps {
    ticker: string;
    price: number;
    priceChangePercentage: number;
}

export function StockBadge({ ticker, price, priceChangePercentage }: StockBadgeProps) {
    // Determine color based on price change
    const isPositive = priceChangePercentage >= 0;
    const bgColor = isPositive ? 'bg-green-900/30' : 'bg-red-900/30';
    const textColor = isPositive ? 'text-green-500' : 'text-red-500';
    const borderColor = isPositive ? 'border-green-600' : 'border-red-600';

    // Format price with two decimal places
    const formattedPrice = price.toFixed(2);

    // Format percentage with + or - sign and two decimal places
    const formattedPercentage = `${isPositive ? '+' : ''}${priceChangePercentage.toFixed(2)}%`;

    return (
        <Badge
            className={`px-2 py-1 ${bgColor} ${textColor} ${borderColor} rounded-full border flex items-center gap-1 font-mono`}
            variant="outline"
        >
            <span className="font-bold">${ticker}</span>
            <span className="mx-1">|</span>
            <span>{formattedPrice}</span>
            <span className="mx-1">|</span>
            <span className={`font-semibold ${textColor}`}>{formattedPercentage}</span>
        </Badge>
    );
} 