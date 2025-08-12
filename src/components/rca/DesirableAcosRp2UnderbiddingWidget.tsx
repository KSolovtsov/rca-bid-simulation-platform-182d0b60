import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Target, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';

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
  }>({
    grp1: null,
    grp2: null,
    grp3: null,
  });
  
  const analysisData = useMemo(() => {
    if (!data || !Array.isArray(data)) return { grp1: [], grp2: [], grp3: [], filteredRows: 0, globalFilteredData: [] };

    // Apply global widget filter first
    const globalFilteredData = data.filter(row => {
      const appliedAcos = parseFloat(row['I: Applied ACOS']) || 0;
      const targetAcos = parseFloat(row['G: Target ACOS']) || 0;
      const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
      const currentBid = parseFloat(row['Current Bid As displayed on Amazon Seller Central']) || 0;
      const adSpend = parseFloat(row['J: Ad Spend']) || 0;
      const price = parseFloat(row['K: Price']) || 0;

      // Condition 1: Applied ACOS < 9999 && Applied ACOS < Target ACOS && Latest Bid < Current Bid
      const condition1 = appliedAcos < 9999 && appliedAcos < targetAcos && latestBid < currentBid;
      
      // Condition 2: Applied ACOS = 9999 && Ad Spend < (Target ACOS * Price) && Latest Bid < Current Bid
      const condition2 = appliedAcos === 9999 && adSpend < (targetAcos * price) && latestBid < currentBid;
      
      return condition1 || condition2;
    });

    // GRP # 1: Latest Bid Calculated by the System = effective_ceiling
    const grp1 = globalFilteredData
      .filter(row => {
        const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
        const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
        return latestBid === effectiveCeiling;
      })
      .map(row => ({
        asin: row['ASIN'] || '',
        campaign: row['Campaign'] || '',
        kw: row['KW'] || row['Search Term'] || '',
        matchType: row['Match Type'] || '',
        syncStatus: row['Sync Status'] || '',
        nCvr: row['N: CVR'] || '',
        cvrDateRange: row['CVR Date Range'] || '',
      }));

    // GRP # 2: NOT (Latest Bid Calculated by the System <= effective_ceiling && Δ <= 0 && M: TOS% >= 0.5)
    const grp2Data = globalFilteredData.map(row => ({
      asin: row['ASIN'] || '',
      campaign: row['Campaign'] || '',
      kw: row['KW'] || row['Search Term'] || '',
      matchType: row['Match Type'] || '',
      syncStatus: row['Sync Status'] || '',
      latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
      effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
      bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0),
      mTos: parseFloat(row['M: TOS%']) || 0,
    }));
    
    const grp2Violations = grp2Data.filter(item => {
      return !(item.latestBid <= item.effectiveCeiling && item.bidDelta <= 0 && item.mTos >= 0.5);
    });

    // GRP # 3: NOT (Latest Bid Calculated by the System < effective_ceiling && Δ > 0 && M: TOS% < 0.5)
    const grp3Data = globalFilteredData.map(row => ({
      asin: row['ASIN'] || '',
      campaign: row['Campaign'] || '',
      kw: row['KW'] || row['Search Term'] || '',
      matchType: row['Match Type'] || '',
      syncStatus: row['Sync Status'] || '',
      latestBid: parseFloat(row['Latest Bid Calculated by the System']) || 0,
      effectiveCeiling: parseFloat(row['effective_ceiling']) || 0,
      bidDelta: (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0),
      mTos: parseFloat(row['M: TOS%']) || 0,
    }));
    
    const grp3Violations = grp3Data.filter(item => {
      return !(item.latestBid < item.effectiveCeiling && item.bidDelta > 0 && item.mTos < 0.5);
    });
    
    return {
      grp1,
      grp2: grp2Violations,
      grp3: grp3Violations,
      grp2AllGood: grp2Violations.length === 0,
      grp3AllGood: grp3Violations.length === 0,
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
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  const getSortIcon = (group: 'grp1' | 'grp2' | 'grp3', field: string) => {
    const sort = sortConfig[group];
    if (sort?.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  const renderGrp1Table = (groupData: any[]) => {
    const sortedData = sortData(groupData, 'grp1');
    
    return (
      <div className="h-full flex flex-col">
        <Table>
          <TableHeader className="bg-background border-b shadow-sm">
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[80px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'asin')}
                >
                  ASIN {getSortIcon('grp1', 'asin')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'campaign')}
                >
                  Campaign {getSortIcon('grp1', 'campaign')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[90px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'kw')}
                >
                  KW {getSortIcon('grp1', 'kw')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'matchType')}
                >
                  Match {getSortIcon('grp1', 'matchType')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'syncStatus')}
                >
                  Sync {getSortIcon('grp1', 'syncStatus')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'nCvr')}
                >
                  CVR {getSortIcon('grp1', 'nCvr')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[80px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp1', 'cvrDateRange')}
                >
                  Date Range {getSortIcon('grp1', 'cvrDateRange')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        
        <ScrollArea className="flex-1">
          <Table>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors h-8">
                  <TableCell className="font-mono text-[10px] px-1 py-1 w-[80px]">{item.asin}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[100px] max-w-[100px] truncate" title={item.campaign}>{item.campaign}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[90px] max-w-[90px] truncate" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell className="px-1 py-1 w-[70px]">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[70px]">{item.syncStatus}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{item.nCvr}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[80px] max-w-[80px] truncate" title={item.cvrDateRange}>{item.cvrDateRange}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
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
        <Table>
          <TableHeader className="bg-background border-b shadow-sm">
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'asin')}
                >
                  ASIN {getSortIcon('grp2', 'asin')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[90px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'campaign')}
                >
                  Campaign {getSortIcon('grp2', 'campaign')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[80px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'kw')}
                >
                  KW {getSortIcon('grp2', 'kw')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'matchType')}
                >
                  Match {getSortIcon('grp2', 'matchType')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'syncStatus')}
                >
                  Sync {getSortIcon('grp2', 'syncStatus')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'latestBid')}
                >
                  Latest Bid {getSortIcon('grp2', 'latestBid')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'effectiveCeiling')}
                >
                  Ceiling {getSortIcon('grp2', 'effectiveCeiling')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'bidDelta')}
                >
                  Δ Bid {getSortIcon('grp2', 'bidDelta')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp2', 'mTos')}
                >
                  TOS% {getSortIcon('grp2', 'mTos')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        
        <ScrollArea className="flex-1">
          <Table>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors h-8">
                  <TableCell className="font-mono text-[10px] px-1 py-1 w-[70px]">{item.asin}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[90px] max-w-[90px] truncate" title={item.campaign}>{item.campaign}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[80px] max-w-[80px] truncate" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell className="px-1 py-1 w-[60px]">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{item.syncStatus}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[70px]">{formatCurrency(item.latestBid)}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[70px]">{formatCurrency(item.effectiveCeiling)}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{formatCurrency(item.bidDelta)}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{item.mTos.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
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
        <Table>
          <TableHeader className="bg-background border-b shadow-sm">
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'asin')}
                >
                  ASIN {getSortIcon('grp3', 'asin')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[90px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'campaign')}
                >
                  Campaign {getSortIcon('grp3', 'campaign')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[80px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'kw')}
                >
                  KW {getSortIcon('grp3', 'kw')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'matchType')}
                >
                  Match {getSortIcon('grp3', 'matchType')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'syncStatus')}
                >
                  Sync {getSortIcon('grp3', 'syncStatus')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'latestBid')}
                >
                  Latest Bid {getSortIcon('grp3', 'latestBid')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[70px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'effectiveCeiling')}
                >
                  Ceiling {getSortIcon('grp3', 'effectiveCeiling')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'bidDelta')}
                >
                  Δ Bid {getSortIcon('grp3', 'bidDelta')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-[10px] px-1 py-1 w-[60px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-[10px] hover:bg-transparent"
                  onClick={() => handleSort('grp3', 'mTos')}
                >
                  TOS% {getSortIcon('grp3', 'mTos')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        
        <ScrollArea className="flex-1">
          <Table>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors h-8">
                  <TableCell className="font-mono text-[10px] px-1 py-1 w-[70px]">{item.asin}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[90px] max-w-[90px] truncate" title={item.campaign}>{item.campaign}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[80px] max-w-[80px] truncate" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell className="px-1 py-1 w-[60px]">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{item.syncStatus}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[70px]">{formatCurrency(item.latestBid)}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[70px]">{formatCurrency(item.effectiveCeiling)}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{formatCurrency(item.bidDelta)}</TableCell>
                  <TableCell className="text-[10px] px-1 py-1 w-[60px]">{item.mTos.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No violations found in this group
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
                      <p><strong>Condition 1:</strong> Applied ACOS &lt; 9999 AND Applied ACOS &lt; Target ACOS AND Latest Bid &lt; Current Bid</p>
                      <p><strong>OR</strong></p>
                      <p><strong>Condition 2:</strong> Applied ACOS = 9999 AND Ad Spend &lt; (Target ACOS × Price) AND Latest Bid &lt; Current Bid</p>
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
            <TabsList className="grid w-full grid-cols-3 mx-0 mt-2 gap-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp1" className="text-[9px] px-0.5">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#1 ({analysisData.grp1.length} - {getPercentage(analysisData.grp1.length)}%)</span>
                      {analysisData.grp1.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-3 px-1 ml-0.5 text-[8px] bg-blue-500 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/bid-simulation', { 
                              state: { 
                                filteredData: analysisData.globalFilteredData.filter(row => {
                                  const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
                                  const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
                                  return latestBid === effectiveCeiling;
                                }).map(row => ({
                                  'ASIN': row['ASIN'] || '',
                                  'Campaign': row['Campaign'] || '',
                                  'KW': row['KW'] || row['Search Term'] || '',
                                  'Match Type': row['Match Type'] || '',
                                  'Sync Status': row['Sync Status'] || '',
                                  'Latest Bid Calculated by the System': row['Latest Bid Calculated by the System'] || '',
                                  'effective_ceiling': row['effective_ceiling'] || '',
                                  'I: Applied ACOS': row['I: Applied ACOS'] || '',
                                  'G: Target ACOS': row['G: Target ACOS'] || '',
                                  'Current Bid As displayed on Amazon Seller Central': row['Current Bid As displayed on Amazon Seller Central'] || '',
                                  'J: Ad Spend': row['J: Ad Spend'] || '',
                                  'K: Price': row['K: Price'] || ''
                                }))
                              }
                            });
                          }}
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 1 Filter Logic:</p>
                  <p className="text-xs">Latest Bid Calculated by the System = effective_ceiling</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp2" className="text-[9px] px-0.5">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#2 ({analysisData.grp2.length} - {getPercentage(analysisData.grp2.length)}%)</span>
                      {analysisData.grp2.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-3 px-1 ml-0.5 text-[8px] bg-blue-500 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/bid-simulation', { 
                              state: { 
                                filteredData: analysisData.globalFilteredData.filter(row => {
                                  const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
                                  const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
                                  const bidDelta = (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0);
                                  const tosPercent = parseFloat(row['M: TOS%']) || 0;
                                  
                                  // NOT (Latest Bid <= effective_ceiling && Δ <= 0 && M: TOS% >= 0.5)
                                  const condition = latestBid <= effectiveCeiling && bidDelta <= 0 && tosPercent >= 0.5;
                                  return !condition;
                                }).map(row => ({
                                  'ASIN': row['ASIN'] || '',
                                  'Campaign': row['Campaign'] || '',
                                  'KW': row['KW'] || row['Search Term'] || '',
                                  'Match Type': row['Match Type'] || '',
                                  'Sync Status': row['Sync Status'] || '',
                                  'Latest Bid Calculated by the System': row['Latest Bid Calculated by the System'] || '',
                                  'effective_ceiling': row['effective_ceiling'] || '',
                                  'M: TOS%': row['M: TOS%'] || '',
                                  'I: Applied ACOS': row['I: Applied ACOS'] || '',
                                  'G: Target ACOS': row['G: Target ACOS'] || '',
                                  'Current Bid As displayed on Amazon Seller Central': row['Current Bid As displayed on Amazon Seller Central'] || '',
                                  'J: Ad Spend': row['J: Ad Spend'] || '',
                                  'K: Price': row['K: Price'] || '',
                                  'Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)': row['Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)'] || ''
                                }))
                              }
                            });
                          }}
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 2 Filter Logic:</p>
                  <p className="text-xs">NOT (Latest Bid ≤ effective_ceiling AND Δ ≤ 0 AND M: TOS% ≥ 0.5)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="grp3" className="text-[9px] px-0.5">
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">GRP#3 ({analysisData.grp3.length} - {getPercentage(analysisData.grp3.length)}%)</span>
                      {analysisData.grp3.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-3 px-1 ml-0.5 text-[8px] bg-blue-500 text-white hover:bg-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/bid-simulation', { 
                              state: { 
                                filteredData: analysisData.globalFilteredData.filter(row => {
                                  const latestBid = parseFloat(row['Latest Bid Calculated by the System']) || 0;
                                  const effectiveCeiling = parseFloat(row['effective_ceiling']) || 0;
                                  const bidDelta = (parseFloat(row['Latest Bid Calculated by the System']) || 0) - (parseFloat(row['Previous Bid Calculated by the System']) || 0);
                                  const tosPercent = parseFloat(row['M: TOS%']) || 0;
                                  
                                  // NOT (Latest Bid < effective_ceiling && Δ > 0 && M: TOS% < 0.5)
                                  const condition = latestBid < effectiveCeiling && bidDelta > 0 && tosPercent < 0.5;
                                  return !condition;
                                }).map(row => ({
                                  'ASIN': row['ASIN'] || '',
                                  'Campaign': row['Campaign'] || '',
                                  'KW': row['KW'] || row['Search Term'] || '',
                                  'Match Type': row['Match Type'] || '',
                                  'Sync Status': row['Sync Status'] || '',
                                  'Latest Bid Calculated by the System': row['Latest Bid Calculated by the System'] || '',
                                  'effective_ceiling': row['effective_ceiling'] || '',
                                  'M: TOS%': row['M: TOS%'] || '',
                                  'I: Applied ACOS': row['I: Applied ACOS'] || '',
                                  'G: Target ACOS': row['G: Target ACOS'] || '',
                                  'Current Bid As displayed on Amazon Seller Central': row['Current Bid As displayed on Amazon Seller Central'] || '',
                                  'J: Ad Spend': row['J: Ad Spend'] || '',
                                  'K: Price': row['K: Price'] || '',
                                  'Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)': row['Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)'] || ''
                                }))
                              }
                            });
                          }}
                        >
                          Details
                        </Button>
                      )}
                    </div>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium mb-1">GRP # 3 Filter Logic:</p>
                  <p className="text-xs">NOT (Latest Bid &lt; effective_ceiling AND Δ &gt; 0 AND M: TOS% &lt; 0.5)</p>
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
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DesirableAcosRp2UnderbiddingWidget;
