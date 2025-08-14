import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, TrendingUp, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';
import { useAppSettings } from '@/hooks/use-app-settings';
import OverbiddingWidget from './OverbiddingWidget';
import UnderbiddingWidget from './UnderbiddingWidget';
import PortalBidAnalysisWidget from './PortalBidAnalysisWidget';
import AgencyBidAnalysisWidget from './AgencyBidAnalysisWidget';
import DesirableAcosRp2UnderbiddingWidget from './DesirableAcosRp2UnderbiddingWidget';
import DesirableAcosRp2OverbiddingWidget from './DesirableAcosRp2OverbiddingWidget';

interface RcaAnalysisData {
  asin: string;
  campaign: string;
  kw: string;
  matchType: string;
  avgDailyOrdersPeriod1: number;
  avgDailyOrdersPeriod2: number;
  avgCpcPeriod1: number;
  avgCpcPeriod2: number;
  avgAcosPeriod1: number;
  avgAcosPeriod2: number;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof RcaAnalysisData;
  direction: SortDirection;
}

const RcaAnalysisWidget = () => {
  const { getFile } = useIndexedDbStorage();
  const { activeFileId } = useAppSettings();
  const navigate = useNavigate();

  // State to hold the actual file data
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Load file data when activeFileId changes
  useEffect(() => {
    const loadFile = async () => {
      console.log('Loading file with activeFileId:', activeFileId);
      setLoading(true);
      setHasAttemptedLoad(true);
      
      if (!activeFileId) {
        console.log('No activeFileId found');
        setFileData(null);
        setLoading(false);
        return;
      }
      
      try {
        const file = await getFile(activeFileId);
        console.log('File loaded successfully:', file?.name);
        setFileData(file);
      } catch (error) {
        console.error('Error loading file:', error);
        setFileData(null);
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure localStorage is properly initialized
    const timer = setTimeout(loadFile, 100);
    return () => clearTimeout(timer);
  }, [activeFileId, getFile]);

  // Transform CSV data to our format
  const transformedData = useMemo((): RcaAnalysisData[] => {
    if (!fileData || !fileData.data) return [];

    return fileData.data.map((row: any) => ({
      asin: row['ASIN'] || '',
      campaign: row['Campaign'] || '',
      kw: row['KW'] || row['Search Term'] || '',
      matchType: row['Match Type'] || '',
      avgDailyOrdersPeriod1: parseFloat(row['Avg Daily Orders Reporting Period # 1']) || 0,
      avgDailyOrdersPeriod2: parseFloat(row['Avg Daily Orders Reporting Period # 2']) || 0,
      avgCpcPeriod1: parseFloat(row['Avg CPC Reporting Period # 1']) || 0,
      avgCpcPeriod2: parseFloat(row['Avg CPC Reporting Period # 2']) || 0,
      avgAcosPeriod1: parseFloat(row['Avg ACOS Reporting Period # 1']) || 0,
      avgAcosPeriod2: parseFloat(row['Avg ACOS Reporting Period # 2']) || 0,
    }));
  }, [fileData]);

  // Apply filters and sorting
  const filteredData = useMemo(() => {
    let filtered = transformedData.filter(item => 
      item.avgDailyOrdersPeriod1 > 0 || item.avgDailyOrdersPeriod2 > 0
    );

    // Apply sorting if a sort config is set
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = aValue < bValue ? -1 : 1;
        }

        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [transformedData, sortConfig]);

  const formatCurrency = (value: number) => {
    return value > 0 ? `$${value.toFixed(2)}` : '--';
  };

  const formatAcos = (value: number) => {
    return value > 0 ? value.toFixed(2) : '--';
  };

  const formatOrders = (value: number) => {
    return value > 0 ? value.toString() : '--';
  };

  // Navigation function with multiple filters - RCA Analysis source
  const navigateToDetailedView = (item: RcaAnalysisData) => {
    const params = new URLSearchParams();
    
    // Add source identifier
    params.append('source', 'rca_analysis');
    
    // Add multiple filters for this specific row
    if (item.asin) {
      params.append('filter_asin', 'ASIN');
      params.append('value_asin', item.asin);
      params.append('operator_asin', 'equals');
    }
    
    if (item.campaign) {
      params.append('filter_campaign', 'Campaign');
      params.append('value_campaign', item.campaign);
      params.append('operator_campaign', 'equals');
    }
    
    if (item.kw) {
      params.append('filter_kw', 'KW');
      params.append('value_kw', item.kw);
      params.append('operator_kw', 'equals');
    }
    
    if (item.matchType) {
      params.append('filter_matchtype', 'Match Type');
      params.append('value_matchtype', item.matchType);
      params.append('operator_matchtype', 'equals');
    }
    
    navigate(`/bid-simulation?${params.toString()}`);
  };

  // Handle sorting
  const handleSort = (key: keyof RcaAnalysisData) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Remove sorting
    });
  };

  // Get sort icon for a column
  const getSortIcon = (key: keyof RcaAnalysisData) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <div className="h-4 w-4" />; // Empty space to maintain alignment
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };


  // Show loading state
  if (loading || !hasAttemptedLoad) {
    return (
      <Card className="shadow-card animate-slide-up">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading active file data...</p>
        </CardContent>
      </Card>
    );
  }

  // Early return if no active file
  if (!activeFileId) {
    return (
      <Card className="shadow-card animate-slide-up">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active File Selected</h3>
          <p className="text-muted-foreground text-center">
            Please upload and activate a CSV file to view RCA analysis data.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!fileData) {
    return (
      <Card className="shadow-card animate-slide-up">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-warning mb-4" />
          <h3 className="text-lg font-semibold mb-2">File Not Found</h3>
          <p className="text-muted-foreground text-center">
            The selected active file could not be found. Please reselect an active file.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rca-bid-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rca-bid-analysis">Bids RCA</TabsTrigger>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="misc-filters">Misc filters</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Performance Analysis</CardTitle>
                    <CardDescription>
                      Data from: {fileData.name.replace(/\.csv$/i, '')}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {transformedData.length} total records
                </Badge>
              </div>
              
              {/* Filter Indicators */}
              <div className="flex items-center gap-2 mt-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active Filters:</span>
                <Badge variant="secondary" className="text-xs">
                  Daily Orders Period #1 &gt; 0
                </Badge>
                <span className="text-muted-foreground text-xs">OR</span>
                <Badge variant="secondary" className="text-xs">
                  Daily Orders Period #2 &gt; 0
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('asin')}
                      >
                        <div className="flex items-center justify-between">
                          ASIN
                          {getSortIcon('asin')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('campaign')}
                      >
                        <div className="flex items-center justify-between">
                          Campaign
                          {getSortIcon('campaign')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('kw')}
                      >
                        <div className="flex items-center justify-between">
                          KW
                          {getSortIcon('kw')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('matchType')}
                      >
                        <div className="flex items-center justify-between">
                          Match Type
                          {getSortIcon('matchType')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('avgDailyOrdersPeriod1')}
                      >
                        <div className="flex items-center justify-between">
                          Daily Orders P1
                          {getSortIcon('avgDailyOrdersPeriod1')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('avgDailyOrdersPeriod2')}
                      >
                        <div className="flex items-center justify-between">
                          Daily Orders P2
                          {getSortIcon('avgDailyOrdersPeriod2')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('avgCpcPeriod1')}
                      >
                        <div className="flex items-center justify-between">
                          Avg CPC P1
                          {getSortIcon('avgCpcPeriod1')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('avgCpcPeriod2')}
                      >
                        <div className="flex items-center justify-between">
                          Avg CPC P2
                          {getSortIcon('avgCpcPeriod2')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('avgAcosPeriod1')}
                      >
                        <div className="flex items-center justify-between">
                          Avg ACOS P1
                          {getSortIcon('avgAcosPeriod1')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => handleSort('avgAcosPeriod2')}
                      >
                        <div className="flex items-center justify-between">
                          Avg ACOS P2
                          {getSortIcon('avgAcosPeriod2')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow 
                        key={index} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer hover:shadow-sm"
                        onClick={() => navigateToDetailedView(item)}
                        title="Click to view detailed analysis in Bid Simulation"
                      >
                        <TableCell className="font-mono text-sm">{item.asin}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{item.campaign}</TableCell>
                        <TableCell className="max-w-[120px] truncate">{item.kw}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.matchType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{formatOrders(item.avgDailyOrdersPeriod1)}</TableCell>
                        <TableCell className="text-center">{formatOrders(item.avgDailyOrdersPeriod2)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(item.avgCpcPeriod1)}</TableCell>
                        <TableCell className="text-center">{formatCurrency(item.avgCpcPeriod2)}</TableCell>
                        <TableCell className="text-center">{formatAcos(item.avgAcosPeriod1)}</TableCell>
                        <TableCell className="text-center">{formatAcos(item.avgAcosPeriod2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No data matches the current filter criteria
                </div>
              )}
              
              <div className="px-6 py-3 bg-muted/20 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {transformedData.length} records from {fileData.name.replace(/\.csv$/i, '')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rca-bid-analysis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortalBidAnalysisWidget data={fileData.data} />
            <AgencyBidAnalysisWidget data={fileData.data} />
          </div>
        </TabsContent>
        
        <TabsContent value="misc-filters" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DesirableAcosRp2UnderbiddingWidget data={fileData.data} />
            <DesirableAcosRp2OverbiddingWidget data={fileData.data} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RcaAnalysisWidget;