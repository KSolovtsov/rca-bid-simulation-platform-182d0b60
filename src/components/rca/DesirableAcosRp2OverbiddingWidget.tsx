import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    grp1?: { field: string; direction: 'asc' | 'desc' };
    grp2?: { field: string; direction: 'asc' | 'desc' };
    grp3?: { field: string; direction: 'asc' | 'desc' };
  }>({});
  
  // Apply global Desire ACOS filter
  const baseFilteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.log('DesirableAcosRp2Overbidding - No data or not array:', data?.length || 0);
      return [];
    }
    
    console.log('🔍 DesirableAcosRp2Overbidding - Input data length:', data.length);
    
    if (data.length > 0) {
      console.log('📋 Available columns:', Object.keys(data[0]));
      console.log('📋 Sample row:', data[0]);
    }
    
    let passedCount = 0;
    
    const filtered = data.filter((row, index) => {
      const appliedAcos = parseFloat(row['I: Applied ACOS']) || 0;
      const targetAcos = parseFloat(row['G: Target ACOS']) || 0;
      const adSpend = parseFloat(row['J: Ad Spend']) || 0;
      const price = parseFloat(row['K: Price']) || 0;
      
      // Desire ACOS filter logic
      let passes = false;
      if (appliedAcos < 9999 && appliedAcos < targetAcos) {
        passes = true;
      } else if (appliedAcos === 9999 && adSpend < (targetAcos * price)) {
        passes = true;
      }
      
      // Log first 5 rows for debugging
      if (index < 5) {
        console.log(`🔍 BaseFilter Row ${index}:`, {
          'I: Applied ACOS': row['I: Applied ACOS'],
          appliedAcos,
          'G: Target ACOS': row['G: Target ACOS'], 
          targetAcos,
          'J: Ad Spend': row['J: Ad Spend'],
          adSpend,
          'K: Price': row['K: Price'],
          price,
          condition1: appliedAcos < 9999 && appliedAcos < targetAcos,
          condition2: appliedAcos === 9999 && adSpend < (targetAcos * price),
          passes
        });
      }
      
      if (passes) {
        passedCount++;
      }
      
      return passes;
    });
    
    console.log('🎯 BaseFilter results:', {
      totalInput: data.length,
      totalPassed: filtered.length,
      passedCount
    });
    
    return filtered;
  }, [data]);
  
  // GRP#1 Analysis
  const grp1Data = useMemo(() => {
    return baseFilteredData
      .filter(row => {
        const cvr = parseFloat(row['N: CVR']) || 0;
        const avgCvrRp2 = parseFloat(row['Avg CVR Reporting Period # 2']) || 0;
        const tosPercent = parseFloat(row['TOS%']) || 0;
        
        return cvr <= avgCvrRp2 && tosPercent > 50;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        searchTerm: row['Search Term'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        cvr: parseFloat(row['N: CVR']) || 0,
        avgCvrRp2: parseFloat(row['Avg CVR Reporting Period # 2']) || 0,
        tosPercent: parseFloat(row['TOS%']) || 0,
      }))
      .slice(0, 50);
  }, [baseFilteredData]);
  
  // GRP#2 Analysis
  const grp2Data = useMemo(() => {
    return baseFilteredData
      .filter(row => {
        const cvr = parseFloat(row['N: CVR']) || 0;
        const avgCvrRp2 = parseFloat(row['Avg CVR Reporting Period # 2']) || 0;
        const tosPercent = parseFloat(row['TOS%']) || 0;
        const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
        const previousBid = parseFloat(row['Previous Bid Calculated by the System']) || 0;
        const bidDelta = latestBid - previousBid;
        
        return cvr <= avgCvrRp2 && tosPercent <= 50 && bidDelta >= 0;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        searchTerm: row['Search Term'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        cvr: parseFloat(row['N: CVR']) || 0,
        avgCvrRp2: parseFloat(row['Avg CVR Reporting Period # 2']) || 0,
        tosPercent: parseFloat(row['TOS%']) || 0,
      }))
      .slice(0, 50);
  }, [baseFilteredData]);
  
  // GRP#3 Analysis (Simplified: CVR > Avg CVR RP2 AND Clicks >= 5)
  const grp3Data = useMemo(() => {
    console.log('🔍 GRP#3 Debug - Starting analysis...');
    console.log('📊 BaseFilteredData length:', baseFilteredData.length);
    
    if (baseFilteredData.length > 0) {
      console.log('📋 Sample row columns:', Object.keys(baseFilteredData[0]));
      console.log('📋 Sample row values:', baseFilteredData[0]);
    }
    
    let matchCount = 0;
    
    const filtered = baseFilteredData.filter((row, index) => {
      const cvr = parseFloat(row['N: CVR']) || 0;
      const avgCvrRp2 = parseFloat(row['Avg CVR Reporting Period # 2']) || 0;
      const clicks = parseFloat(row['L: Clicks']) || 0;
      
      const cvrGreaterThanAvg = cvr > avgCvrRp2;
      const clicksAtLeast5 = clicks >= 5;
      
      const passes = cvrGreaterThanAvg && clicksAtLeast5;
      
      // Log first 5 rows for debugging
      if (index < 5) {
        console.log(`🔍 Row ${index}:`, {
          asin: row['ASIN'],
          kw: row['KW'],
          'N: CVR': row['N: CVR'],
          cvr,
          'Avg CVR Reporting Period # 2': row['Avg CVR Reporting Period # 2'],
          avgCvrRp2,
          'L: Clicks': row['L: Clicks'],
          clicks,
          cvrGreaterThanAvg,
          clicksAtLeast5,
          passes
        });
      }
      
      if (passes) {
        matchCount++;
        console.log(`✅ GRP#3 Match #${matchCount}:`, {
          asin: row['ASIN'],
          kw: row['KW'],
          cvr,
          avgCvrRp2,
          clicks,
          cvrGreaterThanAvg,
          clicksAtLeast5
        });
      }
      
      return passes;
    });

    console.log('🎯 GRP#3 final results:', {
      totalProcessed: baseFilteredData.length,
      totalMatches: filtered.length,
      matchCount
    });

    return filtered
      .map(row => ({
        asin: row['ASIN'] || '',
        searchTerm: row['Search Term'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        cvr: parseFloat(row['N: CVR']) || 0,
        avgCvrRp2: parseFloat(row['Avg CVR Reporting Period # 2']) || 0,
        adSpend: parseFloat(row['J: Ad Spend']) || 0,
        clicks: parseFloat(row['L: Clicks']) || 0,
        cvrWaterfallLevel: row['CVR Waterfall Level'] || '-',
      }))
      .slice(0, 50);
  }, [baseFilteredData]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatAcos = (value: number) => `${value.toFixed(1)}%`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${type} copied successfully`,
      });
    }).catch(() => {
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    });
  };

  const renderCellWithCopy = (content: string, type: 'Search Term' | 'Campaign' | 'KW') => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors truncate">
            {content}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => copyToClipboard(content, type)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy {type}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
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

  const handleSort = (group: 'grp1' | 'grp2' | 'grp3', field: string) => {
    const currentSort = sortConfig[group];
    const direction = currentSort?.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig(prev => ({
      ...prev,
      [group]: { field, direction }
    }));
  };

  const sortData = (data: any[], group: 'grp1' | 'grp2' | 'grp3') => {
    const sort = sortConfig[group];
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      // Special handling for numeric fields
      if (sort.field === 'latestBid' || sort.field === 'cvr' || sort.field === 'avgCvrRp2' || 
          sort.field === 'tosPercent' || sort.field === 'adSpend' || sort.field === 'clicks') {
        const aNum = parseFloat(aVal) || 0;
        const bNum = parseFloat(bVal) || 0;
        return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (aStr < bStr) return sort.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderGrp1Table = () => {
    if (grp1Data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-emerald-600 mb-2">All Good!!</h3>
            <p className="text-muted-foreground">All conditions are met for this group</p>
          </div>
        </div>
      );
    }

    const sortedData = sortData(grp1Data, 'grp1');
    
    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-1 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[63px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[50px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'cvr')}
              >
                CVR
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'avgCvrRp2')}
              >
                Avg CVR RP2
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[40px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'tosPercent')}
              >
                TOS%
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[63px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[50px] border-r border-border/30">{(item.cvr * 100).toFixed(2)}%</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px] border-r border-border/30">{(item.avgCvrRp2 * 100).toFixed(2)}%</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[40px]">{(item.tosPercent * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderGrp2Table = () => {
    if (grp2Data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-emerald-600 mb-2">All Good!!</h3>
            <p className="text-muted-foreground">All conditions are met for this group</p>
          </div>
        </div>
      );
    }

    const sortedData = sortData(grp2Data, 'grp2');
    
    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-1 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[63px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[65px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'latestBid')}
              >
                Latest Bid
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[50px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'cvr')}
              >
                CVR
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'avgCvrRp2')}
              >
                Avg CVR RP2
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[40px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'tosPercent')}
              >
                TOS%
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[63px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[65px] border-r border-border/30">{formatCurrency(item.latestBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[50px] border-r border-border/30">{(item.cvr * 100).toFixed(2)}%</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px] border-r border-border/30">{(item.avgCvrRp2 * 100).toFixed(2)}%</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[40px]">{(item.tosPercent * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderGrp3Table = () => {
    if (grp3Data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-emerald-600 mb-2">All Good!!</h3>
            <p className="text-muted-foreground">All conditions are met for this group</p>
          </div>
        </div>
      );
    }

    const sortedData = sortData(grp3Data, 'grp3');
    
    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-1 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[63px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[65px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'latestBid')}
              >
                Latest Bid
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[50px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'cvr')}
              >
                CVR
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'avgCvrRp2')}
              >
                Avg CVR RP2
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[60px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'adSpend')}
              >
                Ad Spend
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[60px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'cvrWaterfallLevel')}
              >
                CVR Waterfall
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[50px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'clicks')}
              >
                Clicks
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[63px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[65px] border-r border-border/30">{formatCurrency(item.latestBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[50px] border-r border-border/30">{(item.cvr * 100).toFixed(2)}%</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px] border-r border-border/30">{(item.avgCvrRp2 * 100).toFixed(2)}%</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[60px] border-r border-border/30">{formatCurrency(item.adSpend)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[60px] border-r border-border/30">{item.cvrWaterfallLevel || '-'}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[50px]">{item.clicks}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
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
              {activeFileName && (
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Active file: {activeFileName.replace('.csv', '')}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-120px)]">
        <Tabs defaultValue="grp1" className="h-full">
          <TooltipProvider>
            <TabsList className="grid w-full grid-cols-3 mx-0 mt-2 gap-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp1" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#1 ({grp1Data.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 1 Filter Logic:</p>
                  <p className="text-xs">CVR ≤ Avg CVR RP2 AND TOS% &gt; 0.5</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp2" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#2 ({grp2Data.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 2 Filter Logic:</p>
                  <p className="text-xs">CVR ≤ Avg CVR RP2 AND TOS% ≤ 50 AND Δ ≥ 0</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp3" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#3 ({grp3Data.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 3 Filter Logic:</p>
                  <p className="text-xs">CVR &gt; Avg CVR RP2 AND Clicks ≥ 5</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </TooltipProvider>
          
          <TabsContent value="grp1" className="h-[calc(100%-50px)] mt-4">
            {renderGrp1Table()}
          </TabsContent>
          
          <TabsContent value="grp2" className="h-[calc(100%-50px)] mt-4">
            {renderGrp2Table()}
          </TabsContent>
          
          <TabsContent value="grp3" className="h-[calc(100%-50px)] mt-4">
            {renderGrp3Table()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DesirableAcosRp2OverbiddingWidget;