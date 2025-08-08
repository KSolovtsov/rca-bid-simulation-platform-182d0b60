import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, TrendingUp, AlertCircle } from 'lucide-react';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';
import { useAppSettings } from '@/hooks/use-app-settings';
import OverbiddingWidget from './OverbiddingWidget';
import UnderbiddingWidget from './UnderbiddingWidget';
import PortalBidAnalysisWidget from './PortalBidAnalysisWidget';
import AgencyBidAnalysisWidget from './AgencyBidAnalysisWidget';

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

const RcaAnalysisWidget = () => {
  const { getFile } = useIndexedDbStorage();
  const { activeFileId } = useAppSettings();
  const navigate = useNavigate();

  // Get active file data - wait for initialization
  const activeFile = useMemo(async () => {
    if (!activeFileId) return null;
    return await getFile(activeFileId);
  }, [activeFileId, getFile]);

  // State to hold the actual file data
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load file data when activeFileId changes
  useEffect(() => {
    const loadFile = async () => {
      setLoading(true);
      if (!activeFileId) {
        setFileData(null);
        setLoading(false);
        return;
      }
      
      try {
        const file = await getFile(activeFileId);
        setFileData(file);
      } catch (error) {
        console.error('Error loading file:', error);
        setFileData(null);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
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

  // Apply filters: show only rows where at least one period has >0 orders
  const filteredData = useMemo(() => {
    return transformedData.filter(item => 
      item.avgDailyOrdersPeriod1 > 0 || item.avgDailyOrdersPeriod2 > 0
    );
  }, [transformedData]);

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


  // Show loading state
  if (loading) {
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="rca-bid-analysis">Bids RCA</TabsTrigger>
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
                      <TableHead className="font-semibold">ASIN</TableHead>
                      <TableHead className="font-semibold">Campaign</TableHead>
                      <TableHead className="font-semibold">KW</TableHead>
                      <TableHead className="font-semibold">Match Type</TableHead>
                      <TableHead className="text-center font-semibold">Daily Orders P1</TableHead>
                      <TableHead className="text-center font-semibold">Daily Orders P2</TableHead>
                      <TableHead className="text-center font-semibold">Avg CPC P1</TableHead>
                      <TableHead className="text-center font-semibold">Avg CPC P2</TableHead>
                      <TableHead className="text-center font-semibold">Avg ACOS P1</TableHead>
                      <TableHead className="text-center font-semibold">Avg ACOS P2</TableHead>
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
      </Tabs>
    </div>
  );
};

export default RcaAnalysisWidget;