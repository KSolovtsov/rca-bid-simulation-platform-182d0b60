import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target } from 'lucide-react';

interface UnderbiddingAnalysisProps {
  data: any[];
}

interface UnderbiddingData {
  asin: string;
  campaign: string;
  kw: string;
  matchType: string;
  avgCpcPeriod1: number;
  avgCpcPeriod2: number;
  avgAcosPeriod1: number;
  avgAcosPeriod2: number;
  avgDailyOrdersPeriod1: number;
  avgDailyOrdersPeriod2: number;
  underbiddingScore: number;
}

const UnderbiddingWidget: React.FC<UnderbiddingAnalysisProps> = ({ data }) => {
  // Calculate underbidding potential based on low ACOS but declining orders
  const underbiddingData = useMemo((): UnderbiddingData[] => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .map((row: any) => {
        const avgCpcPeriod1 = parseFloat(row['Avg CPC Reporting Period # 1']) || 0;
        const avgCpcPeriod2 = parseFloat(row['Avg CPC Reporting Period # 2']) || 0;
        const avgAcosPeriod1 = parseFloat(row['Avg ACOS Reporting Period # 1']) || 0;
        const avgAcosPeriod2 = parseFloat(row['Avg ACOS Reporting Period # 2']) || 0;
        const avgDailyOrdersPeriod1 = parseFloat(row['Avg Daily Orders Reporting Period # 1']) || 0;
        const avgDailyOrdersPeriod2 = parseFloat(row['Avg Daily Orders Reporting Period # 2']) || 0;
        
        // Calculate underbidding score based on low ACOS (<30%) but declining orders
        const ordersDecline = avgDailyOrdersPeriod1 > avgDailyOrdersPeriod2 ? 
          (avgDailyOrdersPeriod1 - avgDailyOrdersPeriod2) / avgDailyOrdersPeriod1 : 0;
        const lowAcos = Math.min(avgAcosPeriod1 > 0 ? avgAcosPeriod1 : 100, avgAcosPeriod2 > 0 ? avgAcosPeriod2 : 100);
        const underbiddingScore = (lowAcos < 30 ? (30 - lowAcos) * 2 : 0) + (ordersDecline * 100);

        return {
          asin: row['ASIN'] || '',
          campaign: row['Campaign'] || '',
          kw: row['KW'] || row['Search Term'] || '',
          matchType: row['Match Type'] || '',
          avgCpcPeriod1,
          avgCpcPeriod2,
          avgAcosPeriod1,
          avgAcosPeriod2,
          avgDailyOrdersPeriod1,
          avgDailyOrdersPeriod2,
          underbiddingScore
        };
      })
      .filter((item: UnderbiddingData) => 
        item.underbiddingScore > 20 && // Significant underbidding opportunity
        (item.avgDailyOrdersPeriod1 > 0 || item.avgDailyOrdersPeriod2 > 0) // Has orders data
      )
      .sort((a: UnderbiddingData, b: UnderbiddingData) => b.underbiddingScore - a.underbiddingScore)
      .slice(0, 10); // Top 10 underbidding opportunities
  }, [data]);

  const formatCurrency = (value: number) => {
    return value > 0 ? `$${value.toFixed(2)}` : '--';
  };

  const formatAcos = (value: number) => {
    return value > 0 ? `${value.toFixed(1)}%` : '--';
  };

  const formatOrders = (value: number) => {
    return value > 0 ? value.toFixed(1) : '--';
  };

  const getOpportunityLevel = (score: number) => {
    if (score > 60) return { label: 'High', variant: 'default' as const };
    if (score > 40) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  if (underbiddingData.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Underbidding Opportunities</CardTitle>
              <CardDescription>
                Keywords with low ACOS and potential for increased bids
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No significant underbidding opportunities detected in the current data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Underbidding Opportunities</CardTitle>
              <CardDescription>
                Keywords with low ACOS and potential for increased bids
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {underbiddingData.length} opportunities
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Opportunity</TableHead>
                <TableHead className="font-semibold">ASIN</TableHead>
                <TableHead className="font-semibold">Campaign</TableHead>
                <TableHead className="font-semibold">Keyword</TableHead>
                <TableHead className="text-center font-semibold">Orders P1</TableHead>
                <TableHead className="text-center font-semibold">Orders P2</TableHead>
                <TableHead className="text-center font-semibold">ACOS P1</TableHead>
                <TableHead className="text-center font-semibold">ACOS P2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {underbiddingData.map((item, index) => {
                const opportunityLevel = getOpportunityLevel(item.underbiddingScore);
                return (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant={opportunityLevel.variant} className="text-xs">
                        {opportunityLevel.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.asin}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.campaign}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{item.kw}</TableCell>
                    <TableCell className="text-center">{formatOrders(item.avgDailyOrdersPeriod1)}</TableCell>
                    <TableCell className="text-center">{formatOrders(item.avgDailyOrdersPeriod2)}</TableCell>
                    <TableCell className="text-center">{formatAcos(item.avgAcosPeriod1)}</TableCell>
                    <TableCell className="text-center">{formatAcos(item.avgAcosPeriod2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="px-6 py-3 bg-muted/20 border-t">
          <p className="text-sm text-muted-foreground">
            Showing top {underbiddingData.length} keywords with highest growth potential
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnderbiddingWidget;