import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingDown, AlertTriangle } from 'lucide-react';

interface OverbiddingAnalysisProps {
  data: any[];
}

interface OverbiddingData {
  asin: string;
  campaign: string;
  kw: string;
  matchType: string;
  avgCpcPeriod1: number;
  avgCpcPeriod2: number;
  avgAcosPeriod1: number;
  avgAcosPeriod2: number;
  overbiddingScore: number;
}

const OverbiddingWidget: React.FC<OverbiddingAnalysisProps> = ({ data }) => {
  // TODO: Implement overbidding analysis logic
  const overbiddingData: OverbiddingData[] = [];

  const formatCurrency = (value: number) => {
    return value > 0 ? `$${value.toFixed(2)}` : '--';
  };

  const formatAcos = (value: number) => {
    return value > 0 ? `${value.toFixed(1)}%` : '--';
  };

  const getOverbiddingRisk = (score: number) => {
    if (score > 80) return { label: 'Critical', variant: 'destructive' as const };
    if (score > 50) return { label: 'High', variant: 'default' as const };
    return { label: 'Medium', variant: 'secondary' as const };
  };

  if (overbiddingData.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">Overbidding Analysis</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No significant overbidding risks detected in the current data.
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
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">Overbidding Analysis</CardTitle>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {overbiddingData.length} risks found
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Risk Level</TableHead>
                <TableHead className="font-semibold">ASIN</TableHead>
                <TableHead className="font-semibold">Campaign</TableHead>
                <TableHead className="font-semibold">Keyword</TableHead>
                <TableHead className="text-center font-semibold">CPC P1</TableHead>
                <TableHead className="text-center font-semibold">CPC P2</TableHead>
                <TableHead className="text-center font-semibold">ACOS P1</TableHead>
                <TableHead className="text-center font-semibold">ACOS P2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overbiddingData.map((item, index) => {
                const riskLevel = getOverbiddingRisk(item.overbiddingScore);
                return (
                  <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant={riskLevel.variant} className="text-xs">
                        {riskLevel.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.asin}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.campaign}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{item.kw}</TableCell>
                    <TableCell className="text-center">{formatCurrency(item.avgCpcPeriod1)}</TableCell>
                    <TableCell className="text-center">{formatCurrency(item.avgCpcPeriod2)}</TableCell>
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
            Showing top {overbiddingData.length} keywords with highest overbidding risk
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverbiddingWidget;