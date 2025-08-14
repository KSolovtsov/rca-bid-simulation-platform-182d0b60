import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TrendingDown, Target, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';
import { toast } from 'sonner';

interface WidgetProps {
  data: any[];
}

const DesirableAcosRp2UnderbiddingWidget: React.FC<WidgetProps> = ({ data }) => {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { getFile } = useIndexedDbStorage();
  const [activeFileName, setActiveFileName] = useState<string>('Analysis of keyword groups');

  // Get active file name
  React.useEffect(() => {
    const fetchActiveFileName = async () => {
      if (settings.activeFileId) {
        try {
          const file = await getFile(settings.activeFileId);
          if (file) {
            setActiveFileName(file.name);
          }
        } catch (error) {
          console.error('Error fetching active file:', error);
        }
      }
    };
    
    fetchActiveFileName();
  }, [settings.activeFileId, getFile]);
  
  const [sortConfig, setSortConfig] = useState<{
    grp1: { field: string; direction: 'asc' | 'desc' } | null;
    grp2: { field: string; direction: 'asc' | 'desc' } | null;
    grp3: { field: string; direction: 'asc' | 'desc' } | null;
    grp4: { field: string; direction: 'asc' | 'desc' } | null;
  }>({
    grp1: null,
    grp2: null,
    grp3: null,
    grp4: null,
  });
  
  const analysisData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { grp1: [], grp2: [], grp3: [], grp4: [], filteredRows: 0, globalFilteredData: [] };

    // Apply global widget filter first
    const globalFilteredData = data.filter(row => {
      const appliedAcos = parseFloat(row['I: Applied ACOS']) || 0;
      const targetAcos = parseFloat(row['G: Target ACOS']) || 0;
      const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
      const currentBid = parseFloat(row['Current Bid As displayed on Amazon Seller Central']) || 0;
      const adSpend = parseFloat(row['J: Ad Spend']) || 0;
      const price = parseFloat(row['K: Price']) || 0;

      // Condition 1: Applied ACOS < 9999 && Applied ACOS < Target ACOS
      const condition1 = appliedAcos < 9999 && appliedAcos < targetAcos;
      
      // Condition 2: Applied ACOS = 9999 && Ad Spend < (Target ACOS * Price)
      const condition2 = appliedAcos === 9999 && adSpend < (targetAcos * price);
      
      return condition1 || condition2;
    });

    // GRP # 1: effective_ceiling = 0.02
    const grp1 = globalFilteredData
      .filter(row => {
        const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
        return effectiveCeiling === 0.02;
      })
     .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        searchTerm: row['Search Term'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        adSpend: row['J: Ad Spend'] || '',
        nCvr: row['N: CVR'] || '',
        cvrDateRange: row['CVR Date Range'] || '',
        avgCvrRp1: row['Avg CVR Reporting Period # 1'] || '',
        avgCvrRp2: row['Avg CVR Reporting Period # 2'] || '',
      }))
      .slice(0, 50);

    // GRP # 2: effective_ceiling = 0.03
    const grp2 = globalFilteredData
      .filter(row => {
        const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
        return effectiveCeiling === 0.03;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        searchTerm: row['Search Term'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
        adjustedBid: parseFloat(row['Adjusted Bid']) || 0,
        bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Current Bid As displayed on Amazon Seller Central']) || 0),
      }))
      .slice(0, 50);

    // GRP # 3: effective_ceiling = 0.04
    const grp3 = globalFilteredData
      .filter(row => {
        const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
        return effectiveCeiling === 0.04;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        searchTerm: row['Search Term'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
        adjustedBid: parseFloat(row['Adjusted Bid']) || 0,
      }))
      .slice(0, 50);

    // GRP # 4: effective_ceiling > 0.04
    const grp4 = globalFilteredData
      .filter(row => {
        const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
        return effectiveCeiling > 0.04;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        searchTerm: row['Search Term'] || '',
        kw: row['KW'] || '',
        matchType: row['Match Type'] || '',
        latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
        mTos: row['M: TOS%'] || '',
        minSuggestedBid: parseFloat(row['O: Min. Suggested Bid']) || 0,
        bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Current Bid As displayed on Amazon Seller Central']) || 0),
      }))
      .slice(0, 50);

    return {
      grp1,
      grp2,
      grp3,
      grp4,
      filteredRows: globalFilteredData.length,
      globalFilteredData
    };
  }, [data]);

  const { grp1, grp2, grp3, grp4 } = analysisData;

  const getSortIcon = (group: 'grp1' | 'grp2' | 'grp3' | 'grp4', field: string) => {
    const sort = sortConfig[group];
    if (sort?.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
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

  const handleSort = (group: 'grp1' | 'grp2' | 'grp3' | 'grp4', field: string) => {
    const currentSort = sortConfig[group];
    const direction = currentSort?.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig(prev => ({
      ...prev,
      [group]: { field, direction }
    }));
  };

  const sortData = (data: any[], group: 'grp1' | 'grp2' | 'grp3' | 'grp4') => {
    const sort = sortConfig[group];
    if (!sort) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      // Special handling for numeric fields
      if (sort.field === 'latestBid' || sort.field === 'effectiveCeiling' || sort.field === 'adjustedBid' || 
          sort.field === 'bidDelta' || sort.field === 'minSuggestedBid') {
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
    if (grp1.length === 0) {
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

    const sortedData = sortData(grp1, 'grp1');
    
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
                ASIN {getSortIcon('grp1', 'asin')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'campaign')}
              >
                Campaign {getSortIcon('grp1', 'campaign')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[120px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'searchTerm')}
              >
                Search Term {getSortIcon('grp1', 'searchTerm')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'kw')}
              >
                KW {getSortIcon('grp1', 'kw')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[65px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'matchType')}
              >
                Match {getSortIcon('grp1', 'matchType')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'adSpend')}
              >
                Ad Spend {getSortIcon('grp1', 'adSpend')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[50px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'nCvr')}
              >
                N CVR {getSortIcon('grp1', 'nCvr')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'cvrDateRange')}
              >
                CVR Date Range {getSortIcon('grp1', 'cvrDateRange')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'avgCvrRp1')}
              >
                Avg CVR RP1 {getSortIcon('grp1', 'avgCvrRp1')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'avgCvrRp2')}
              >
                Avg CVR RP2 {getSortIcon('grp1', 'avgCvrRp2')}
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[120px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[65px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[70px] border-r border-border/30">{item.adSpend}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[50px] border-r border-border/30">{item.nCvr}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">{item.cvrDateRange}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px] border-r border-border/30">{item.avgCvrRp1}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px]">{item.avgCvrRp2}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderGrp2Table = () => {
    if (grp2.length === 0) {
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

    const sortedData = sortData(grp2, 'grp2');
    
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
                ASIN {getSortIcon('grp2', 'asin')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'campaign')}
              >
                Campaign {getSortIcon('grp2', 'campaign')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[120px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'searchTerm')}
              >
                Search Term {getSortIcon('grp2', 'searchTerm')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'kw')}
              >
                KW {getSortIcon('grp2', 'kw')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[65px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'matchType')}
              >
                Match {getSortIcon('grp2', 'matchType')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'latestBid')}
              >
                Latest Bid {getSortIcon('grp2', 'latestBid')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'effectiveCeiling')}
              >
                Effective Ceiling {getSortIcon('grp2', 'effectiveCeiling')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'adjustedBid')}
              >
                Adjusted Bid {getSortIcon('grp2', 'adjustedBid')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[70px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'bidDelta')}
              >
                Bid Δ {getSortIcon('grp2', 'bidDelta')}
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[120px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[65px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[70px] border-r border-border/30">{formatCurrency(item.latestBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">{item.effectiveCeiling.toFixed(2)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px] border-r border-border/30">{formatCurrency(item.adjustedBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[70px]">{formatCurrency(item.bidDelta)}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderGrp3Table = () => {
    if (grp3.length === 0) {
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

    const sortedData = sortData(grp3, 'grp3');
    
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
                ASIN {getSortIcon('grp3', 'asin')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'campaign')}
              >
                Campaign {getSortIcon('grp3', 'campaign')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[120px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'searchTerm')}
              >
                Search Term {getSortIcon('grp3', 'searchTerm')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'kw')}
              >
                KW {getSortIcon('grp3', 'kw')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[65px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'matchType')}
              >
                Match {getSortIcon('grp3', 'matchType')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'latestBid')}
              >
                Latest Bid {getSortIcon('grp3', 'latestBid')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'effectiveCeiling')}
              >
                Effective Ceiling {getSortIcon('grp3', 'effectiveCeiling')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[85px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'adjustedBid')}
              >
                Adjusted Bid {getSortIcon('grp3', 'adjustedBid')}
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[120px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[65px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[70px] border-r border-border/30">{formatCurrency(item.latestBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">{item.effectiveCeiling.toFixed(2)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[85px]">{formatCurrency(item.adjustedBid)}</div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderGrp4Table = () => {
    if (grp4.length === 0) {
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

    const sortedData = sortData(grp4, 'grp4');
    
    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-1 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'asin')}
              >
                ASIN {getSortIcon('grp4', 'asin')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'campaign')}
              >
                Campaign {getSortIcon('grp4', 'campaign')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[120px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'searchTerm')}
              >
                Search Term {getSortIcon('grp4', 'searchTerm')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'kw')}
              >
                KW {getSortIcon('grp4', 'kw')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[65px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'matchType')}
              >
                Match {getSortIcon('grp4', 'matchType')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'latestBid')}
              >
                Latest Bid {getSortIcon('grp4', 'latestBid')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[60px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'mTos')}
              >
                M TOS {getSortIcon('grp4', 'mTos')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'minSuggestedBid')}
              >
                Min Suggested Bid {getSortIcon('grp4', 'minSuggestedBid')}
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-1 w-[70px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'bidDelta')}
              >
                Bid Δ {getSortIcon('grp4', 'bidDelta')}
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="min-w-full">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border/30">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border/30 truncate">{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[120px] border-r border-border/30" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border/30">
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[65px] border-r border-border/30">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[70px] border-r border-border/30">{formatCurrency(item.latestBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[60px] border-r border-border/30">{item.mTos}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[100px] border-r border-border/30">{formatCurrency(item.minSuggestedBid)}</div>
                <div className="text-center text-[10px] px-1 py-0.5 w-[70px]">{formatCurrency(item.bidDelta)}</div>
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
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-emerald-700">
                KWs with desirable ACOS in RP # 2, why are we underbidding?
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
            <TabsList className="grid w-full grid-cols-4 mx-0 mt-2 gap-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp1" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#1 ({grp1.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 1 Filter Logic:</p>
                  <p className="text-xs">effective_ceiling = 0.02</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp2" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#2 ({grp2.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 2 Filter Logic:</p>
                  <p className="text-xs">effective_ceiling = 0.03</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp3" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#3 ({grp3.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 3 Filter Logic:</p>
                  <p className="text-xs">effective_ceiling = 0.04</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp4" className="text-[9px] px-0.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#4 ({grp4.length})</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 4 Filter Logic:</p>
                  <p className="text-xs">effective_ceiling &gt; 0.04</p>
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
          
          <TabsContent value="grp4" className="h-[calc(100%-50px)] mt-4">
            {renderGrp4Table()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DesirableAcosRp2UnderbiddingWidget;