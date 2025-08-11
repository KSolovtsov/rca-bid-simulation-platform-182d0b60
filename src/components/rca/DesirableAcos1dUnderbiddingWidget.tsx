import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingDown, Target } from 'lucide-react';

interface WidgetProps {
  data: any[];
}

const DesirableAcos1dUnderbiddingWidget: React.FC<WidgetProps> = ({ data }) => {
  const analysisData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter(row => {
        const acos1d = parseFloat(row['Avg ACOS_1d']) || 0;
        const orders1d = parseFloat(row['Avg Daily Orders_1d']) || 0;
        const cpcRp1 = parseFloat(row['Avg CPC Reporting Period # 1']) || 0;
        const cpcRp2 = parseFloat(row['Avg CPC Reporting Period # 2']) || 0;
        
        // Filter for desirable ACOS_1d (assuming < 30% is desirable) and underbidding indicators
        return acos1d > 0 && acos1d < 30 && orders1d > 0 && cpcRp2 < cpcRp1;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || row['Search Term'] || '',
        matchType: row['Match Type'] || '',
        avgAcos1d: parseFloat(row['Avg ACOS_1d']) || 0,
        avgCpcRp1: parseFloat(row['Avg CPC Reporting Period # 1']) || 0,
        avgCpcRp2: parseFloat(row['Avg CPC Reporting Period # 2']) || 0,
        avgOrders1d: parseFloat(row['Avg Daily Orders_1d']) || 0,
        bidReduction: ((parseFloat(row['Avg CPC Reporting Period # 1']) || 0) - (parseFloat(row['Avg CPC Reporting Period # 2']) || 0)),
      }))
      .sort((a, b) => b.bidReduction - a.bidReduction)
      .slice(0, 50);
  }, [data]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatAcos = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card className="shadow-card animate-slide-up h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Target className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-cyan-700">
                KWs with desirable ACOS_1d, why are we underbidding?
              </CardTitle>
              <CardDescription className="text-sm">
                Keywords with good daily ACOS but reduced bidding activity
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {analysisData.length} keywords
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-120px)]">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs">ASIN</TableHead>
                <TableHead className="font-semibold text-xs">KW</TableHead>
                <TableHead className="font-semibold text-xs">Match</TableHead>
                <TableHead className="text-center font-semibold text-xs">ACOS_1d</TableHead>
                <TableHead className="text-center font-semibold text-xs">CPC RP#1</TableHead>
                <TableHead className="text-center font-semibold text-xs">CPC RP#2</TableHead>
                <TableHead className="text-center font-semibold text-xs">Orders_1d</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">{item.asin}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-cyan-600 font-medium text-xs">
                      {formatAcos(item.avgAcos1d)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs">{formatCurrency(item.avgCpcRp1)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                      <span className="text-orange-600 text-xs">{formatCurrency(item.avgCpcRp2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs">{item.avgOrders1d.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {analysisData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keywords found with desirable ACOS_1d that show underbidding patterns
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DesirableAcos1dUnderbiddingWidget;