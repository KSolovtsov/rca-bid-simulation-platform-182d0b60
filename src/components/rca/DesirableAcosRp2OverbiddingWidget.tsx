import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, AlertTriangle, Copy, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAppSettings } from '@/hooks/use-app-settings';

interface WidgetProps {
  data: any[];
}

const DesirableAcosRp2OverbiddingWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeFileName } = useAppSettings();
  
  // Apply global Desire ACOS filter
  const baseFilteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(row => {
      const appliedAcos = parseFloat(row['Applied ACOS']) || 0;
      const targetAcos = parseFloat(row['Target ACOS']) || 0;
      const adSpend = parseFloat(row['Ad Spend']) || 0;
      const price = parseFloat(row['Price']) || 0;
      
      // Desire ACOS filter
      if (appliedAcos < 9999 && appliedAcos < targetAcos) {
        return true;
      } else if (appliedAcos === 9999 && adSpend < (targetAcos * price)) {
        return true;
      }
      return false;
    });
  }, [data]);
  
  // GRP#1 Analysis
  const grp1Data = useMemo(() => {
    return baseFilteredData
      .filter(row => {
        const cvr = parseFloat(row['CVR']) || 0;
        const avgCvrRp2 = parseFloat(row['Avg CVR Reporting Period # 2']) || 0;
        const tosPercent = parseFloat(row['TOS%']) || 0;
        
        return cvr <= avgCvrRp2 && tosPercent > 0.5;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        searchTerm: row['Search Term'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        cvr: parseFloat(row['CVR']) || 0,
        avgCvrRp2: parseFloat(row['Avg CVR Reporting Period # 2']) || 0,
        tosPercent: parseFloat(row['TOS%']) || 0,
      }))
      .slice(0, 50);
  }, [baseFilteredData]);
  
  // GRP#2 Analysis
  const grp2Data = useMemo(() => {
    return baseFilteredData
      .filter(row => {
        const cvr = parseFloat(row['CVR']) || 0;
        const avgCvrRp2 = parseFloat(row['Avg CVR Reporting Period # 2']) || 0;
        const tosPercent = parseFloat(row['TOS%']) || 0;
        const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
        const previousBid = parseFloat(row['Previous Bid Calculated by the System']) || 0;
        const bidDelta = latestBid - previousBid;
        
        return cvr <= avgCvrRp2 && tosPercent <= 0.5 && bidDelta >= 0;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        searchTerm: row['Search Term'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        cvr: parseFloat(row['CVR']) || 0,
        avgCvrRp2: parseFloat(row['Avg CVR Reporting Period # 2']) || 0,
        tosPercent: parseFloat(row['TOS%']) || 0,
      }))
      .slice(0, 50);
  }, [baseFilteredData]);
  
  // GRP#3 Analysis
  const grp3Data = useMemo(() => {
    return baseFilteredData
      .filter(row => {
        const avgCvrRp2 = parseFloat(row['Avg CVR Reporting Period # 2']) || 0;
        const cvr = parseFloat(row['CVR']) || 0;
        const clicks = parseFloat(row['Clicks']) || 0;
        
        return avgCvrRp2 > 0 && cvr > avgCvrRp2 && clicks >= 5;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        searchTerm: row['Search Term'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        cvr: parseFloat(row['CVR']) || 0,
        avgCvrRp2: parseFloat(row['Avg CVR Reporting Period # 2']) || 0,
        adSpend: parseFloat(row['Ad Spend']) || 0,
        clicks: parseFloat(row['Clicks']) || 0,
      }))
      .slice(0, 50);
  }, [baseFilteredData]);

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

  const renderGrp1Table = () => (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-xs py-2 w-[60px]">ASIN</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">Search Term</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">Campaign</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">KW</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[50px]">Match Type</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">CVR</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[60px]">Avg CVR RP2</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">TOS%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grp1Data.map((item, index) => (
            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-xs py-0.5 w-[60px]">{item.asin}</TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5" title={item.searchTerm}>
                <div className="flex items-center gap-1">
                  <span>{item.searchTerm}</span>
                  <Copy 
                    className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" 
                    onClick={() => copyToClipboard(item.searchTerm)}
                  />
                </div>
              </TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5">{item.campaign}</TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5">{item.kw}</TableCell>
              <TableCell className="py-0.5 w-[50px]">
                <Badge 
                  variant="outline" 
                  className="text-xs px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleMatchTypeClick(item)}
                >
                  {item.matchType}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[50px]">{(item.cvr * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[60px]">{(item.avgCvrRp2 * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[50px]">{(item.tosPercent * 100).toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {grp1Data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No data found for GRP#1 criteria
        </div>
      )}
    </ScrollArea>
  );

  const renderGrp2Table = () => (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-xs py-2 w-[60px]">ASIN</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">Search Term</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">Campaign</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">KW</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[50px]">Match Type</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[70px]">Latest Bid</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">CVR</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[60px]">Avg CVR RP2</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">TOS%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grp2Data.map((item, index) => (
            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-xs py-0.5 w-[60px]">{item.asin}</TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5" title={item.searchTerm}>
                <div className="flex items-center gap-1">
                  <span>{item.searchTerm}</span>
                  <Copy 
                    className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" 
                    onClick={() => copyToClipboard(item.searchTerm)}
                  />
                </div>
              </TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5">{item.campaign}</TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5">{item.kw}</TableCell>
              <TableCell className="py-0.5 w-[50px]">
                <Badge 
                  variant="outline" 
                  className="text-xs px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleMatchTypeClick(item)}
                >
                  {item.matchType}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[70px]">{formatCurrency(item.latestBid)}</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[50px]">{(item.cvr * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[60px]">{(item.avgCvrRp2 * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[50px]">{(item.tosPercent * 100).toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {grp2Data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No data found for GRP#2 criteria
        </div>
      )}
    </ScrollArea>
  );

  const renderGrp3Table = () => (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-xs py-2 w-[60px]">ASIN</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">Search Term</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">Campaign</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[80px]">KW</TableHead>
            <TableHead className="font-semibold text-xs py-2 w-[50px]">Match Type</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[70px]">Latest Bid</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">CVR</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[60px]">Avg CVR RP2</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[60px]">Ad Spend</TableHead>
            <TableHead className="text-center font-semibold text-xs py-2 w-[50px]">Clicks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grp3Data.map((item, index) => (
            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-xs py-0.5 w-[60px]">{item.asin}</TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5" title={item.searchTerm}>
                <div className="flex items-center gap-1">
                  <span>{item.searchTerm}</span>
                  <Copy 
                    className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" 
                    onClick={() => copyToClipboard(item.searchTerm)}
                  />
                </div>
              </TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5">{item.campaign}</TableCell>
              <TableCell className="max-w-[80px] truncate text-xs py-0.5">{item.kw}</TableCell>
              <TableCell className="py-0.5 w-[50px]">
                <Badge 
                  variant="outline" 
                  className="text-xs px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleMatchTypeClick(item)}
                >
                  {item.matchType}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[70px]">{formatCurrency(item.latestBid)}</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[50px]">{(item.cvr * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[60px]">{(item.avgCvrRp2 * 100).toFixed(2)}%</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[60px]">{formatCurrency(item.adSpend)}</TableCell>
              <TableCell className="text-center text-xs py-0.5 w-[50px]">{item.clicks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {grp3Data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No data found for GRP#3 criteria
        </div>
      )}
    </ScrollArea>
  );

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
              {activeFileName && (
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Active file: {activeFileName.replace('.csv', '')}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs cursor-help">
                    <Info className="h-3 w-3 mr-1" />
                    Toolkit
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">Global Filter - Desire ACOS:</h4>
                    <div className="text-sm space-y-1">
                      <p>• IF Applied ACOS &lt; 9999 AND Applied ACOS &lt; Target ACOS</p>
                      <p>• OR IF Applied ACOS = 9999 AND Ad Spend &lt; (Target ACOS × Price)</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="outline" className="text-xs">
              GRP#1: {grp1Data.length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              GRP#2: {grp2Data.length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              GRP#3: {grp3Data.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-120px)]">
        <Tabs defaultValue="grp1" className="h-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-2">
            <TabsTrigger value="grp1" className="text-xs">
              GRP#1 ({grp1Data.length})
            </TabsTrigger>
            <TabsTrigger value="grp2" className="text-xs">
              GRP#2 ({grp2Data.length})
            </TabsTrigger>
            <TabsTrigger value="grp3" className="text-xs">
              GRP#3 ({grp3Data.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grp1" className="h-[calc(100%-50px)] mt-0">
            {renderGrp1Table()}
          </TabsContent>
          
          <TabsContent value="grp2" className="h-[calc(100%-50px)] mt-0">
            {renderGrp2Table()}
          </TabsContent>
          
          <TabsContent value="grp3" className="h-[calc(100%-50px)] mt-0">
            {renderGrp3Table()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DesirableAcosRp2OverbiddingWidget;