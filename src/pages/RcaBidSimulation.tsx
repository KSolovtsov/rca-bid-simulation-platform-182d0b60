import React, { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Upload, FileText, TrendingUp, BarChart3, Target, AlertCircle, ArrowLeft, Home, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useCsvStorage } from '@/hooks/use-csv-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface CsvData {
  [key: string]: string | number;
}

interface ColumnMapping {
  asin: string[];
  searchTerm: string[];
  campaign: string[];
  currentBid: string[];
  previousBid: string[];
  adSpend: string[];
  orders: string[];
  clicks: string[];
  revenue: string[];
  acos: string[];
  cvr: string[];
  cpc: string[];
  impressions: string[];
}

interface AggregatedMetrics {
  totalRecords: number;
  totalASINs: number;
  totalCampaigns: number;
  averageCurrentBid: number;
  totalAdSpend: number;
  totalOrders: number;
  totalClicks: number;
  totalRevenue: number;
  averageACOS: number;
  averageCVR: number;
  averageCPC: number;
  totalImpressions: number;
  topPerformingASINs: Array<{ asin: string; orders: number; revenue: number }>;
  topPerformingSearchTerms: Array<{ term: string; orders: number; revenue: number }>;
  campaignPerformance: Array<{ campaign: string; acos: number; orders: number }>;
  bidAnalysis: Array<{ metric: string; value: number; change: number }>;
}

const RcaBidSimulation = () => {
  const [searchParams] = useSearchParams();
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [csvData, setCsvData] = useState<CsvData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { files, getFile } = useCsvStorage();
  const { toast } = useToast();

  // Load file from URL parameter on component mount
  useEffect(() => {
    const fileId = searchParams.get('fileId');
    if (fileId && files.length > 0) {
      const file = getFile(fileId);
      if (file) {
        setSelectedFileId(fileId);
        setCsvData(file.data);
        const aggregated = processData(file.data);
        setAggregatedData(aggregated);
      }
    }
  }, [searchParams, files, getFile]);

  // Handle file selection change
  const handleFileSelection = useCallback((fileId: string) => {
    if (!fileId) {
      setSelectedFileId('');
      setCsvData([]);
      setAggregatedData(null);
      return;
    }

    const file = getFile(fileId);
    if (file) {
      setSelectedFileId(fileId);
      setCsvData(file.data);
      const aggregated = processData(file.data);
      setAggregatedData(aggregated);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('fileId', fileId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [getFile]);

  const currentFile = selectedFileId ? getFile(selectedFileId) : null;

  const detectColumnMappings = useCallback((headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      asin: [],
      searchTerm: [],
      campaign: [],
      currentBid: [],
      previousBid: [],
      adSpend: [],
      orders: [],
      clicks: [],
      revenue: [],
      acos: [],
      cvr: [],
      cpc: [],
      impressions: []
    };

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('asin')) mapping.asin.push(header);
      if (lowerHeader.includes('search term') || lowerHeader.includes('searchterm')) mapping.searchTerm.push(header);
      if (lowerHeader.includes('campaign')) mapping.campaign.push(header);
      if (lowerHeader.includes('current bid') || lowerHeader.includes('currentbid')) mapping.currentBid.push(header);
      if (lowerHeader.includes('previous bid') || lowerHeader.includes('previousbid')) mapping.previousBid.push(header);
      if (lowerHeader.includes('spend') || lowerHeader.includes('cost')) mapping.adSpend.push(header);
      if (lowerHeader.includes('orders') || lowerHeader.includes('sales count')) mapping.orders.push(header);
      if (lowerHeader.includes('clicks')) mapping.clicks.push(header);
      if (lowerHeader.includes('revenue') || lowerHeader.includes('sales') || lowerHeader.includes('value')) mapping.revenue.push(header);
      if (lowerHeader.includes('acos')) mapping.acos.push(header);
      if (lowerHeader.includes('cvr') || lowerHeader.includes('conversion')) mapping.cvr.push(header);
      if (lowerHeader.includes('cpc') || lowerHeader.includes('cost per click')) mapping.cpc.push(header);
      if (lowerHeader.includes('impressions') || lowerHeader.includes('impr')) mapping.impressions.push(header);
    });

    return mapping;
  }, []);

  const processData = useCallback((data: CsvData[]) => {
    if (data.length === 0) return null;

    const headers = Object.keys(data[0]);
    const columnMapping = detectColumnMappings(headers);
    
    const totalRecords = data.length;
    
    // Get unique values
    const uniqueASINs = new Set();
    const uniqueCampaigns = new Set();
    
    // Process each row for aggregations
    let totalAdSpend = 0;
    let totalOrders = 0;
    let totalClicks = 0;
    let totalRevenue = 0;
    let totalACOS = 0;
    let totalCVR = 0;
    let totalCPC = 0;
    let totalImpressions = 0;
    let totalCurrentBid = 0;
    
    const asinPerformance: { [key: string]: { orders: number; revenue: number } } = {};
    const searchTermPerformance: { [key: string]: { orders: number; revenue: number } } = {};
    const campaignPerformance: { [key: string]: { acos: number; orders: number; count: number } } = {};
    
    let validBidCount = 0;
    let validACOSCount = 0;
    let validCVRCount = 0;
    let validCPCCount = 0;

    data.forEach(row => {
      // ASIN tracking
      const asin = columnMapping.asin[0] ? String(row[columnMapping.asin[0]]) : '';
      if (asin) uniqueASINs.add(asin);
      
      // Campaign tracking
      const campaign = columnMapping.campaign[0] ? String(row[columnMapping.campaign[0]]) : '';
      if (campaign) uniqueCampaigns.add(campaign);
      
      // Search Term tracking
      const searchTerm = columnMapping.searchTerm[0] ? String(row[columnMapping.searchTerm[0]]) : '';
      
      // Numeric aggregations
      const currentBid = columnMapping.currentBid[0] ? Number(row[columnMapping.currentBid[0]]) || 0 : 0;
      const adSpend = columnMapping.adSpend[0] ? Number(row[columnMapping.adSpend[0]]) || 0 : 0;
      const orders = columnMapping.orders[0] ? Number(row[columnMapping.orders[0]]) || 0 : 0;
      const clicks = columnMapping.clicks[0] ? Number(row[columnMapping.clicks[0]]) || 0 : 0;
      const revenue = columnMapping.revenue[0] ? Number(row[columnMapping.revenue[0]]) || 0 : 0;
      const acos = columnMapping.acos[0] ? Number(row[columnMapping.acos[0]]) || 0 : 0;
      const cvr = columnMapping.cvr[0] ? Number(row[columnMapping.cvr[0]]) || 0 : 0;
      const cpc = columnMapping.cpc[0] ? Number(row[columnMapping.cpc[0]]) || 0 : 0;
      const impressions = columnMapping.impressions[0] ? Number(row[columnMapping.impressions[0]]) || 0 : 0;
      
      // Accumulate totals
      if (currentBid > 0) { totalCurrentBid += currentBid; validBidCount++; }
      totalAdSpend += adSpend;
      totalOrders += orders;
      totalClicks += clicks;
      totalRevenue += revenue;
      if (acos > 0) { totalACOS += acos; validACOSCount++; }
      if (cvr > 0) { totalCVR += cvr; validCVRCount++; }
      if (cpc > 0) { totalCPC += cpc; validCPCCount++; }
      totalImpressions += impressions;
      
      // ASIN performance
      if (asin) {
        if (!asinPerformance[asin]) asinPerformance[asin] = { orders: 0, revenue: 0 };
        asinPerformance[asin].orders += orders;
        asinPerformance[asin].revenue += revenue;
      }
      
      // Search Term performance
      if (searchTerm) {
        if (!searchTermPerformance[searchTerm]) searchTermPerformance[searchTerm] = { orders: 0, revenue: 0 };
        searchTermPerformance[searchTerm].orders += orders;
        searchTermPerformance[searchTerm].revenue += revenue;
      }
      
      // Campaign performance
      if (campaign) {
        if (!campaignPerformance[campaign]) campaignPerformance[campaign] = { acos: 0, orders: 0, count: 0 };
        campaignPerformance[campaign].acos += acos;
        campaignPerformance[campaign].orders += orders;
        campaignPerformance[campaign].count++;
      }
    });

    // Calculate averages
    const averageCurrentBid = validBidCount > 0 ? totalCurrentBid / validBidCount : 0;
    const averageACOS = validACOSCount > 0 ? totalACOS / validACOSCount : 0;
    const averageCVR = validCVRCount > 0 ? totalCVR / validCVRCount : 0;
    const averageCPC = validCPCCount > 0 ? totalCPC / validCPCCount : 0;

    // Top performing ASINs
    const topPerformingASINs = Object.entries(asinPerformance)
      .sort(([,a], [,b]) => b.orders - a.orders)
      .slice(0, 5)
      .map(([asin, data]) => ({ asin, orders: data.orders, revenue: data.revenue }));

    // Top performing Search Terms
    const topPerformingSearchTerms = Object.entries(searchTermPerformance)
      .sort(([,a], [,b]) => b.orders - a.orders)
      .slice(0, 5)
      .map(([term, data]) => ({ term, orders: data.orders, revenue: data.revenue }));

    // Campaign performance with average ACOS
    const campaignPerformanceArray = Object.entries(campaignPerformance)
      .map(([campaign, data]) => ({
        campaign,
        acos: data.count > 0 ? data.acos / data.count : 0,
        orders: data.orders
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    // Bid analysis metrics
    const bidAnalysis = [
      { metric: 'Average Current Bid', value: averageCurrentBid, change: 0 },
      { metric: 'Total Ad Spend', value: totalAdSpend, change: 0 },
      { metric: 'Average ACOS', value: averageACOS, change: 0 },
      { metric: 'Average CVR', value: averageCVR, change: 0 }
    ];

    return {
      totalRecords,
      totalASINs: uniqueASINs.size,
      totalCampaigns: uniqueCampaigns.size,
      averageCurrentBid,
      totalAdSpend,
      totalOrders,
      totalClicks,
      totalRevenue,
      averageACOS,
      averageCVR,
      averageCPC,
      totalImpressions,
      topPerformingASINs,
      topPerformingSearchTerms,
      campaignPerformance: campaignPerformanceArray,
      bidAnalysis
    };
  }, [detectColumnMappings]);

  // Remove the old file upload handler since we're using stored files now

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="shadow-card hover:shadow-elegant transition-all">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            RCA & Bid Simulation Report
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analyze your Amazon advertising CSV data for ASIN performance, bid management, and campaign optimization insights
          </p>
        </div>

        {/* File Selection */}
        <Card className="mb-8 shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Select CSV File for Analysis
            </CardTitle>
            <CardDescription>
              Choose from your uploaded files or upload a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Available Files ({files.length})
                </label>
                <Select value={selectedFileId} onValueChange={handleFileSelection}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a CSV file to analyze..." />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((file) => (
                      <SelectItem key={file.id} value={file.id}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{file.name.replace(/\.csv$/i, '')}</div>
                            <div className="text-xs text-muted-foreground">
                              {file.data.length} records • {file.notes}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Link to="/csv-upload">
                <Button variant="outline" size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New File
                </Button>
              </Link>
            </div>
            
            {currentFile && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">{currentFile.name.replace(/\.csv$/i, '')}</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <Badge variant="secondary">{currentFile.data.length} records</Badge>
                  <Badge variant="outline">{new Date(currentFile.uploadDate).toLocaleDateString()}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{currentFile.notes}</p>
              </div>
            )}

            {files.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No CSV files found</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first CSV file to start analyzing your data
                    </p>
                    <Link to="/csv-upload">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV File
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section - Only show if file is selected */}
        {selectedFileId && aggregatedData && (
          <div className="space-y-8 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.totalRecords.toLocaleString()}</div>
                  <Badge variant="secondary" className="mt-2">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Amazon Data
                  </Badge>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total ASINs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.totalASINs.toLocaleString()}</div>
                  <Badge variant="outline" className="mt-2">
                    <Target className="h-3 w-3 mr-1" />
                    Products
                  </Badge>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.totalCampaigns.toLocaleString()}</div>
                  <Badge variant="default" className="mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Current Bid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${aggregatedData.averageCurrentBid.toFixed(2)}</div>
                  <Badge className="mt-2 bg-gradient-accent">
                    <Target className="h-3 w-3 mr-1" />
                    Bid Price
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Ad Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${aggregatedData.totalAdSpend.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-1">Investment</p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.totalOrders.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-1">Conversions</p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average ACOS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.averageACOS.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Efficiency</p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aggregatedData.totalImpressions.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-1">Visibility</p>
                </CardContent>
              </Card>
            </div>

            {/* Amazon Performance Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top ASINs */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Top Performing ASINs</CardTitle>
                  <CardDescription>ASINs ranked by total orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aggregatedData.topPerformingASINs.map((item, index) => (
                      <div key={item.asin} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium block">{item.asin}</span>
                            <span className="text-sm text-muted-foreground">${item.revenue.toLocaleString()} revenue</span>
                          </div>
                        </div>
                        <Badge variant="secondary">{item.orders} orders</Badge>
                      </div>
                    ))}
                    {aggregatedData.topPerformingASINs.length === 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>No ASIN data found</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Search Terms */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Top Search Terms</CardTitle>
                  <CardDescription>Best performing search terms by orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aggregatedData.topPerformingSearchTerms.map((item, index) => (
                      <div key={item.term} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium block truncate max-w-[120px]" title={item.term}>
                              {item.term}
                            </span>
                            <span className="text-sm text-muted-foreground">${item.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline">{item.orders}</Badge>
                      </div>
                    ))}
                    {aggregatedData.topPerformingSearchTerms.length === 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>No search term data found</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Performance */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Campaigns ranked by orders and ACOS</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aggregatedData.campaignPerformance.map((item, index) => (
                      <div key={item.campaign} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium block truncate max-w-[120px]" title={item.campaign}>
                              {item.campaign}
                            </span>
                            <span className="text-sm text-muted-foreground">{item.acos.toFixed(1)}% ACOS</span>
                          </div>
                        </div>
                        <Badge className="bg-gradient-accent">{item.orders}</Badge>
                      </div>
                    ))}
                    {aggregatedData.campaignPerformance.length === 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span>No campaign data found</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bid Analysis */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Bid & Performance Analysis</CardTitle>
                <CardDescription>Key metrics summary from your Amazon advertising data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {aggregatedData.bidAnalysis.map((metric) => (
                    <div key={metric.metric} className="p-4 border rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground">{metric.metric}</p>
                      <p className="text-xl font-bold mt-1">
                        {metric.metric.includes('Spend') || metric.metric.includes('Bid') 
                          ? `$${metric.value.toFixed(2)}` 
                          : metric.metric.includes('%') 
                            ? `${metric.value.toFixed(1)}%`
                            : metric.value.toFixed(3)
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Preview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>First 5 rows of your uploaded CSV data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(csvData[0] || {}).map((header) => (
                          <th key={header} className="text-left p-2 font-medium text-sm">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value, colIndex) => (
                            <td key={colIndex} className="p-2 text-sm">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State - Show when no file selected */}
        {!selectedFileId && files.length > 0 && (
          <Card className="shadow-card text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select a File to Analyze</h3>
                  <p className="text-muted-foreground">
                    Choose a CSV file from the dropdown above to start analyzing your data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - Show when no files at all */}
        {files.length === 0 && (
          <Card className="shadow-card text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No CSV Files Available</h3>
                  <p className="text-muted-foreground">
                    Upload your first CSV file to start analyzing your Amazon advertising data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RcaBidSimulation;