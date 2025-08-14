import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Target, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
          // Error fetching active file
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
        cvrDateRange: row['CVR Waterfall Level'] || '',
        avgCvrRp1: row['Avg CVR Reporting Period # 1'] || '',
        avgCvrRp2: row['Avg CVR Reporting Period # 2'] || '',
      }));

    // GRP # 2: Latest Bid <= effective_ceiling && Δ < 0 && TOS% <= 0.5
    const grp2Data = globalFilteredData.map(row => ({
      asin: row['ASIN'] || '',
      campaign: row['Campaign'] || '',
      searchTerm: row['Search Term'] || '',
      kw: row['KW'] || '',
      matchType: row['Match Type'] || '',
      latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
      effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
      adjustedBid: parseFloat(row['adjusted_bid']) || 0,
      bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0),
      mTos: parseFloat(row['M: TOS%']) || 0,
      nCvr: row['N: CVR'] || '',
      cvrWaterfall: row['CVR Waterfall Level'] || '',
    }));
    
    const grp2Violations = grp2Data.filter(item => {
      return item.latestBid <= item.effectiveCeiling && item.bidDelta < 0 && item.mTos <= 50 && item.effectiveCeiling > 0.02;
    });

    // GRP # 3: Latest Bid < effective_ceiling && Δ > 0 && TOS% > 0.5
    const grp3Data = globalFilteredData.map(row => ({
      asin: row['ASIN'] || '',
      campaign: row['Campaign'] || '',
      searchTerm: row['Search Term'] || '',
      kw: row['KW'] || '',
      matchType: row['Match Type'] || '',
      latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
      effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
      bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0),
      mTos: parseFloat(row['M: TOS%']) || 0,
    }));
    
    const grp3Violations = grp3Data.filter(item => {
      return item.latestBid < item.effectiveCeiling && item.bidDelta > 0 && item.mTos > 50;
    });

    // GRP # 4: effective_ceiling > 0.02 && (Min. Suggested Bid - Latest Bid) > 0.5 && Δ <= 0 && TOS% <= 0.5
    const grp4Data = globalFilteredData.map(row => ({
      asin: row['ASIN'] || '',
      campaign: row['Campaign'] || '',
      searchTerm: row['Search Term'] || '',
      kw: row['KW'] || '',
      matchType: row['Match Type'] || '',
      latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
      minSuggestedBid: parseFloat(row['O: Min. Suggested Bid']) || 0,
      effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
      adjustedBid: parseFloat(row['adjusted_bid']) || 0,
      bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0),
      mTos: parseFloat(row['M: TOS%']) || 0,
    }));
    
    const grp4Violations = grp4Data.filter(item => {
      const minSuggestedBidDelta = item.minSuggestedBid - item.latestBid;
      return item.effectiveCeiling > 0.02 && minSuggestedBidDelta > 0.5 && item.bidDelta <= 0 && item.mTos <= 50;
    });
    
    return {
      grp1,
      grp2: grp2Violations,
      grp3: grp3Violations,
      grp4: grp4Violations,
      grp2AllGood: grp2Violations.length === 0,
      grp3AllGood: grp3Violations.length === 0,
      grp4AllGood: grp4Violations.length === 0,
      filteredRows: globalFilteredData.length,
      globalFilteredData: globalFilteredData,
    };
  }, [data]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatAcos = (value: number) => `${value.toFixed(1)}%`;
  
  const totalRows = data ? data.length : 0;
  
  // Calculate percentages
  const getPercentage = (count: number) => {
    return totalRows > 0 ? ((count / totalRows) * 100).toFixed(1) : '0.0';
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
      
      // Special handling for numeric fields that might be stored as strings
      if (sort.field === 'adSpend' || sort.field === 'latestBid' || sort.field === 'effectiveCeiling' || 
          sort.field === 'minSuggestedBid' || sort.field === 'adjustedBid' || sort.field === 'mTos' || 
          sort.field === 'bidDelta') {
        const aNum = parseFloat(aVal) || 0;
        const bNum = parseFloat(bVal) || 0;
        return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const getSortIcon = (group: 'grp1' | 'grp2' | 'grp3' | 'grp4', field: string) => {
    const sort = sortConfig[group];
    if (sort?.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const handleMatchTypeClick = (item: any) => {
    const params = new URLSearchParams();
    params.set('source', 'rca_analysis');
    params.set('filter_kw', 'KW');
    params.set('value_kw', item.kw || item.searchTerm);
    params.set('operator_kw', 'equals');
    params.set('filter_campaign', 'Campaign');
    params.set('value_campaign', item.campaign);
    params.set('operator_campaign', 'equals');
    params.set('filter_match', 'Match Type');
    params.set('value_match', item.matchType);
    params.set('operator_match', 'equals');
    navigate(`/bid-simulation?${params.toString()}`);
  };

  const renderCellWithCopy = (content: string, type: 'Campaign' | 'KW' | 'Search Term') => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors">
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

  const renderGrp1Table = (groupData: any[]) => {
    if (groupData.length === 0) {
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

    const sortedData = sortData(groupData, 'grp1');
    
    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-2 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[63px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[63px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'adSpend')}
              >
                Spend
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[60px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'nCvr')}
              >
                N: CVR
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[106px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'cvrDateRange')}
              >
                CVR Waterfall
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[85px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'avgCvrRp1')}
              >
                Avg CVR RP1
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[40px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp1', 'avgCvrRp2')}
              >
                Avg CVR RP2
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border truncate" title={item.asin}>{item.asin}</div>
                <div className="text-[10px] py-0.5 w-[100px] border-r border-border truncate" title={item.campaign}>
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border truncate" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] py-0.5 w-[90px] border-r border-border truncate" title={item.kw}>
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[63px] border-r border-border">
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-1 py-0 h-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[63px] border-r border-border">{formatCurrency(parseFloat(item.adSpend) || 0)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[60px] border-r border-border">{item.nCvr}</div>
                <div className="text-[10px] px-1 py-0.5 w-[106px] border-r border-border truncate" title={item.cvrDateRange}>{item.cvrDateRange}</div>
                <div className="text-[10px] px-1 py-0.5 w-[85px] border-r border-border">{item.avgCvrRp1}</div>
                <div className="text-[10px] px-1 py-0.5 w-[40px]">{item.avgCvrRp2}</div>
              </div>
            ))}
          </div>
          
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keywords found in this group
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const renderGrp2Table = (groupData: any[]) => {
    if (analysisData.grp2AllGood) {
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

    const sortedData = sortData(groupData, 'grp2');

    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="grid bg-muted/50" style={{ gridTemplateColumns: '80px 100px 90px 90px 70px 80px 70px 66px 54px 60px 106px' }}>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'latestBid')}
              >
                Latest Bid
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'effectiveCeiling')}
              >
                Effective
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'adjustedBid')}
              >
                Adjusted
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'mTos')}
              >
                TOS%
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'nCvr')}
              >
                CVR
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp2', 'cvrWaterfall')}
              >
                CVR Waterfall
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {sortedData.map((item, index) => (
              <div key={index} className="grid hover:bg-muted/30 transition-colors border-b border-border" style={{ gridTemplateColumns: '80px 100px 90px 90px 70px 80px 70px 66px 54px 60px 106px' }}>
                <div className="font-mono text-[10px] px-1 py-0.5 border-r border-border truncate" title={item.asin}>{item.asin}</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border truncate" title={item.campaign}>{item.campaign}</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border truncate" title={item.searchTerm}>{item.searchTerm}</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border truncate" title={item.kw}>{item.kw}</div>
                <div className="px-1 py-0.5 border-r border-border">
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-1 py-0 h-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border">{formatCurrency(item.latestBid)}</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border">{formatCurrency(item.effectiveCeiling)}</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border">{formatCurrency(item.adjustedBid)}</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border">{item.mTos.toFixed(1)}%</div>
                <div className="text-[10px] px-1 py-0.5 border-r border-border">{item.nCvr}</div>
                <div className="text-[10px] px-1 py-0.5 truncate" title={item.cvrWaterfall}>{item.cvrWaterfall}</div>
              </div>
            ))}
          </div>
          
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keywords found in this group
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const renderGrp3Table = (groupData: any[]) => {
    if (analysisData.grp3AllGood) {
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

    const sortedData = sortData(groupData, 'grp3');

    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-2 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'latestBid')}
              >
                Latest Bid
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'effectiveCeiling')}
              >
                Effective
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[60px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp3', 'mTos')}
              >
                TOS%
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border truncate" title={item.asin}>{item.asin}</div>
                <div className="text-[10px] py-0.5 w-[100px] border-r border-border truncate" title={item.campaign}>
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border truncate" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] py-0.5 w-[90px] border-r border-border truncate" title={item.kw}>
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[70px] border-r border-border">
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-1 py-0 h-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[80px] border-r border-border">{formatCurrency(item.latestBid)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[70px] border-r border-border">{formatCurrency(item.effectiveCeiling)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[60px]">{formatAcos(item.mTos)}</div>
              </div>
            ))}
          </div>
          
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keywords found in this group
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const renderGrp4Table = (groupData: any[]) => {
    if (analysisData.grp4AllGood) {
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

    const sortedData = sortData(groupData, 'grp4');

    return (
      <div className="h-full flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
          <div className="flex bg-muted/50">
            <div className="font-semibold text-[10px] px-1 py-2 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'asin')}
              >
                ASIN
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[100px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'campaign')}
              >
                Campaign
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'searchTerm')}
              >
                Search Term
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[90px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'kw')}
              >
                KW
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'matchType')}
              >
                Match
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[80px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'latestBid')}
              >
                Latest Bid
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[92px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'minSuggestedBid')}
              >
                Min. Suggested Bid
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'effectiveCeiling')}
              >
                Effective
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[70px] border-r border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'adjustedBid')}
              >
                Adjusted
              </Button>
            </div>
            <div className="font-semibold text-[10px] px-1 py-2 w-[48px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent w-full justify-start"
                onClick={() => handleSort('grp4', 'mTos')}
              >
                TOS%
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {sortedData.map((item, index) => (
              <div key={index} className="flex hover:bg-muted/30 transition-colors border-b border-border">
                <div className="font-mono text-[10px] px-1 py-0.5 w-[80px] border-r border-border truncate" title={item.asin}>{item.asin}</div>
                <div className="text-[10px] py-0.5 w-[100px] border-r border-border truncate" title={item.campaign}>
                  {renderCellWithCopy(item.campaign, 'Campaign')}
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[90px] border-r border-border truncate" title={item.searchTerm}>
                  {renderCellWithCopy(item.searchTerm, 'Search Term')}
                </div>
                <div className="text-[10px] py-0.5 w-[90px] border-r border-border truncate" title={item.kw}>
                  {renderCellWithCopy(item.kw, 'KW')}
                </div>
                <div className="px-1 py-0.5 w-[70px] border-r border-border">
                  <Badge 
                    variant="outline" 
                    className="text-[9px] px-1 py-0 h-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleMatchTypeClick(item)}
                  >
                    {item.matchType}
                  </Badge>
                </div>
                <div className="text-[10px] px-1 py-0.5 w-[80px] border-r border-border">{formatCurrency(item.latestBid)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[92px] border-r border-border">{formatCurrency(item.minSuggestedBid)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[70px] border-r border-border">{formatCurrency(item.effectiveCeiling)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[70px] border-r border-border">{formatCurrency(item.adjustedBid)}</div>
                <div className="text-[10px] px-1 py-0.5 w-[48px]">{formatAcos(item.mTos)}</div>
              </div>
            ))}
          </div>
          
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No keywords found in this group
            </div>
          )}
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Target className="h-5 w-5 text-emerald-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-md">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Global Widget Filter:</p>
                    <div className="text-xs space-y-1">
                      <p><strong>Condition 1:</strong> Applied ACOS &lt; 9999 AND Applied ACOS &lt; Target ACOS</p>
                      <p><strong>OR</strong></p>
                      <p><strong>Condition 2:</strong> Applied ACOS = 9999 AND Ad Spend &lt; (Target ACOS × Price)</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div>
              <CardTitle className="text-lg text-emerald-700">
                KWs with desirable ACOS in RP # 2, why are we underbidding?
              </CardTitle>
              <CardDescription className="text-sm">
                Active file: {activeFileName.replace('.csv', '')}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs">
              Filtered: {analysisData.filteredRows} / {totalRows}
            </Badge>
            <div className="text-xs text-muted-foreground">
              Global filter applied
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
                  <TabsTrigger value="grp1" className="text-[9px] px-0.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-medium">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#1 ({analysisData.grp1.length} - {getPercentage(analysisData.grp1.length)}%)</span>
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
                  <TabsTrigger value="grp2" className="text-[9px] px-0.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-medium">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#2 ({analysisData.grp2.length} - {getPercentage(analysisData.grp2.length)}%)</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 2 Filter Logic:</p>
                  <p className="text-xs">Latest Bid ≤ effective_ceiling AND Δ &lt; 0 AND TOS% ≤ 50</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp3" className="text-[9px] px-0.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-medium">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#3 ({analysisData.grp3.length} - {getPercentage(analysisData.grp3.length)}%)</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 3 Filter Logic:</p>
                  <p className="text-xs">Latest Bid &lt; effective_ceiling AND Δ &gt; 0 AND TOS% &gt; 50</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp4" className="text-[9px] px-0.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-medium">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#4 ({analysisData.grp4.length} - {getPercentage(analysisData.grp4.length)}%)</span>
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 4 Filter Logic:</p>
                  <p className="text-xs">effective_ceiling &gt; 0.02 AND (Min. Suggested Bid - Latest Bid) &gt; 0.5 AND Δ ≤ 0 AND TOS% ≤ 50</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </TooltipProvider>
          
          <TabsContent value="grp1" className="mt-4 h-[calc(100%-56px)]">
            {renderGrp1Table(analysisData.grp1)}
          </TabsContent>
          
          <TabsContent value="grp2" className="mt-4 h-[calc(100%-56px)]">
            {renderGrp2Table(analysisData.grp2)}
          </TabsContent>
          
          <TabsContent value="grp3" className="mt-4 h-[calc(100%-56px)]">
            {renderGrp3Table(analysisData.grp3)}
          </TabsContent>

          <TabsContent value="grp4" className="mt-4 h-[calc(100%-56px)]">
            {renderGrp4Table(analysisData.grp4)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DesirableAcosRp2UnderbiddingWidget;
