import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Target, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetProps {
  data: any[];
}

const DesirableAcosRp2UnderbiddingWidget: React.FC<WidgetProps> = ({ data }) => {
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
    if (!data || !Array.isArray(data)) return { grp1: [], grp2: [], grp3: [] };

    // GRP # 1: Latest Bid Calculated by the System = effective_ceiling
    const grp1 = data
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

    // GRP # 2: Latest Bid <= effective_ceiling && Δ <= 0 && M: TOS% >= 0.5
    const grp2Data = data.map(row => ({
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

    // GRP # 3: Latest Bid < effective_ceiling && Δ > 0 && M: TOS%
    const grp3Data = data.map(row => ({
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
      return !(item.latestBid < item.effectiveCeiling && item.bidDelta > 0 && item.mTos > 0);
    });
    
    return {
      grp1,
      grp2: grp2Violations,
      grp3: grp3Violations,
      grp2AllGood: grp2Violations.length === 0,
      grp3AllGood: grp3Violations.length === 0,
    };
  }, [data]);

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatAcos = (value: number) => `${value.toFixed(1)}%`;
  
  const totalKeywords = analysisData.grp1.length + analysisData.grp2.length + analysisData.grp3.length;

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
      <div className="h-full relative">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'asin')}
                  >
                    ASIN {getSortIcon('grp1', 'asin')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'campaign')}
                  >
                    Campaign {getSortIcon('grp1', 'campaign')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'kw')}
                  >
                    KW {getSortIcon('grp1', 'kw')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'matchType')}
                  >
                    Match Type {getSortIcon('grp1', 'matchType')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'syncStatus')}
                  >
                    Sync Status {getSortIcon('grp1', 'syncStatus')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'nCvr')}
                  >
                    N: CVR {getSortIcon('grp1', 'nCvr')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp1', 'cvrDateRange')}
                  >
                    CVR Date Range {getSortIcon('grp1', 'cvrDateRange')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">{item.asin}</TableCell>
                  <TableCell className="text-xs">{item.campaign}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.syncStatus}</TableCell>
                  <TableCell className="text-xs">{item.nCvr}</TableCell>
                  <TableCell className="text-xs">{item.cvrDateRange}</TableCell>
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
      <div className="h-full relative">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'asin')}
                  >
                    ASIN {getSortIcon('grp2', 'asin')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'campaign')}
                  >
                    Campaign {getSortIcon('grp2', 'campaign')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'kw')}
                  >
                    KW {getSortIcon('grp2', 'kw')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'matchType')}
                  >
                    Match Type {getSortIcon('grp2', 'matchType')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'syncStatus')}
                  >
                    Sync Status {getSortIcon('grp2', 'syncStatus')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'latestBid')}
                  >
                    Latest Bid {getSortIcon('grp2', 'latestBid')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'effectiveCeiling')}
                  >
                    Effective Ceiling {getSortIcon('grp2', 'effectiveCeiling')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'bidDelta')}
                  >
                    Δ Bid {getSortIcon('grp2', 'bidDelta')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp2', 'mTos')}
                  >
                    M: TOS% {getSortIcon('grp2', 'mTos')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">{item.asin}</TableCell>
                  <TableCell className="text-xs">{item.campaign}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.syncStatus}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(item.latestBid)}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(item.effectiveCeiling)}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(item.bidDelta)}</TableCell>
                  <TableCell className="text-xs">{item.mTos.toFixed(1)}%</TableCell>
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
      <div className="h-full relative">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 border-b">
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'asin')}
                  >
                    ASIN {getSortIcon('grp3', 'asin')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'campaign')}
                  >
                    Campaign {getSortIcon('grp3', 'campaign')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'kw')}
                  >
                    KW {getSortIcon('grp3', 'kw')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'matchType')}
                  >
                    Match Type {getSortIcon('grp3', 'matchType')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'syncStatus')}
                  >
                    Sync Status {getSortIcon('grp3', 'syncStatus')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'latestBid')}
                  >
                    Latest Bid {getSortIcon('grp3', 'latestBid')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'effectiveCeiling')}
                  >
                    Effective Ceiling {getSortIcon('grp3', 'effectiveCeiling')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'bidDelta')}
                  >
                    Δ Bid {getSortIcon('grp3', 'bidDelta')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold text-xs hover:bg-transparent"
                    onClick={() => handleSort('grp3', 'mTos')}
                  >
                    M: TOS% {getSortIcon('grp3', 'mTos')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs">{item.asin}</TableCell>
                  <TableCell className="text-xs">{item.campaign}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs" title={item.kw}>
                    {item.kw}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {item.matchType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.syncStatus}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(item.latestBid)}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(item.effectiveCeiling)}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(item.bidDelta)}</TableCell>
                  <TableCell className="text-xs">{item.mTos.toFixed(1)}%</TableCell>
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
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-emerald-700">
                KWs with desirable ACOS in RP # 2, why are we underbidding?
              </CardTitle>
              <CardDescription className="text-sm">
                Keywords performing well but potentially leaving money on the table
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalKeywords} keywords
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-120px)]">
        <Tabs defaultValue="grp1" className="h-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="grp1" className="text-xs">
              GRP # 1 ({analysisData.grp1.length})
            </TabsTrigger>
            <TabsTrigger value="grp2" className="text-xs">
              GRP # 2 ({analysisData.grp2.length})
            </TabsTrigger>
            <TabsTrigger value="grp3" className="text-xs">
              GRP # 3 ({analysisData.grp3.length})
            </TabsTrigger>
          </TabsList>
          
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