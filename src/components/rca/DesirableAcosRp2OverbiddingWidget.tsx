import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, AlertTriangle, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface WidgetProps {
  data: any[];
}

const DesirableAcosRp2OverbiddingWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const analysisData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data
      .filter(row => {
        const acosRp2 = parseFloat(row['Avg ACOS Reporting Period # 2']) || 0;
        const ordersRp2 = parseFloat(row['Avg Daily Orders Reporting Period # 2']) || 0;
        const cpcRp1 = parseFloat(row['Avg CPC Reporting Period # 1']) || 0;
        const cpcRp2 = parseFloat(row['Avg CPC Reporting Period # 2']) || 0;
        
        // Filter for desirable ACOS in RP#2 but overbidding indicators
        return acosRp2 > 0 && acosRp2 < 30 && ordersRp2 > 0 && cpcRp2 > cpcRp1;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || row['Search Term'] || '',
        matchType: row['Match Type'] || '',
        avgAcosRp2: parseFloat(row['Avg ACOS Reporting Period # 2']) || 0,
        avgCpcRp1: parseFloat(row['Avg CPC Reporting Period # 1']) || 0,
        avgCpcRp2: parseFloat(row['Avg CPC Reporting Period # 2']) || 0,
        avgOrdersRp2: parseFloat(row['Avg Daily Orders Reporting Period # 2']) || 0,
        bidIncrease: ((parseFloat(row['Avg CPC Reporting Period # 2']) || 0) - (parseFloat(row['Avg CPC Reporting Period # 1']) || 0)),
      }))
      .sort((a, b) => b.bidIncrease - a.bidIncrease)
      .slice(0, 50);
  }, [data]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatAcos = (value: number) => `${value.toFixed(1)}%`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `"${text}" has been copied to your clipboard.`,
    });
  };

  const handleMatchTypeClick = (item: any) => {
    const params = new URLSearchParams();
    params.set('source', 'rca_analysis');
    params.set('filter_kw', 'KW');
    params.set('value_kw', item.kw);
    params.set('operator_kw', 'equals');
    params.set('filter_campaign', 'Campaign');
    params.set('value_campaign', item.campaign);
    params.set('operator_campaign', 'equals');
    params.set('filter_match', 'Match Type');
    params.set('value_match', item.matchType);
    params.set('operator_match', 'equals');
    navigate(`/bid-simulation?${params.toString()}`);
  };

  return (
    <Card className="shadow-card animate-slide-up h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-700">
                KWs with desirable ACOS in RP # 2, why are we overbidding?
              </CardTitle>
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
                <TableHead className="font-semibold text-xs py-2 w-[60px]">ASIN</TableHead>
                <TableHead className="font-semibold text-xs py-2 w-[80px]">Search Term</TableHead>
                <TableHead className="font-semibold text-xs py-2 w-[50px]">Match</TableHead>
                <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">ACOS RP#2</TableHead>
                <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">CPC RP#1</TableHead>
                <TableHead className="text-center font-semibold text-xs py-2 w-[60px]">CPC RP#2</TableHead>
                <TableHead className="text-center font-semibold text-xs py-2 w-[40px]">Orders RP#2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs py-1 w-[60px]">{item.asin}</TableCell>
                  <TableCell className="max-w-[80px] truncate text-xs py-1" title={item.kw}>
                    <div className="flex items-center gap-1">
                      <span>{item.kw}</span>
                      <Copy 
                        className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" 
                        onClick={() => copyToClipboard(item.kw)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-1 w-[50px]">
                    <Badge 
                      variant="outline" 
                      className="text-xs px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleMatchTypeClick(item)}
                    >
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-1 w-[50px]">
                    <span className="text-emerald-600 font-medium text-xs">
                      {formatAcos(item.avgAcosRp2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs py-1 w-[50px]">{formatCurrency(item.avgCpcRp1)}</TableCell>
                  <TableCell className="text-center py-1 w-[60px]">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 text-red-500" />
                      <span className="text-red-600 text-xs">{formatCurrency(item.avgCpcRp2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs py-1 w-[40px]">{item.avgOrdersRp2.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {analysisData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keywords found with desirable ACOS in RP#2 that show overbidding patterns
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DesirableAcosRp2OverbiddingWidget;