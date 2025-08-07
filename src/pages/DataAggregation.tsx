import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';

const DataAggregation = () => {
  const { activeFileId } = useAppSettings();
  const { files } = useIndexedDbStorage();
  const navigate = useNavigate();

  // Navigation helper for filtering - Data Aggregation source
  const navigateToSimulation = (filterType: string, value: string, operator: string = 'equals', valueFrom?: string, valueTo?: string) => {
    const params = new URLSearchParams({
      source: 'data_aggregation',
      filter: filterType,
      value: value,
      operator: operator
    });
    
    if (valueFrom && valueTo) {
      params.set('valueFrom', valueFrom);
      params.set('valueTo', valueTo);
    }
    
    navigate(`/bid-simulation?${params.toString()}`);
  };
  
  const activeFile = useMemo(() => {
    return files.find(file => file.id === activeFileId);
  }, [files, activeFileId]);

  const syncStatusAggregation = useMemo(() => {
    if (!activeFile || !activeFile.data || !activeFile.headers) {
      return { portalManaged: 0, agencyManaged: 0, total: 0, debug: 'No data' };
    }

    const syncStatusHeader = 'Sync Status';
    const syncStatusIndex = activeFile.headers.indexOf(syncStatusHeader);
    
    if (syncStatusIndex === -1) {
      return { portalManaged: 0, agencyManaged: 0, total: activeFile.data.length, debug: 'Column not found' };
    }

    let portalManaged = 0;
    let agencyManaged = 0;

    activeFile.data.forEach((row) => {
      let syncStatusValue;
      
      if (Array.isArray(row)) {
        syncStatusValue = row[syncStatusIndex];
      } else if (typeof row === 'object' && row !== null) {
        syncStatusValue = row[syncStatusHeader] || row['Sync Status'];
      }

      const normalizedValue = String(syncStatusValue).toLowerCase().trim();

      if (normalizedValue === 'true' || normalizedValue === '1' || syncStatusValue === true || syncStatusValue === 1) {
        portalManaged++;
      } else if (normalizedValue === 'false' || normalizedValue === '0' || syncStatusValue === false || syncStatusValue === 0) {
        agencyManaged++;
      }
    });

    return { 
      portalManaged, 
      agencyManaged, 
      total: activeFile.data.length,
      debug: `Column found, processing ${activeFile.data.length} rows`
    };
  }, [activeFile]);

  const bidAlignmentAggregation = useMemo(() => {
    if (!activeFile || !activeFile.data || !activeFile.headers) {
      return { values: {}, total: 0, debug: 'No data' };
    }

    // Найдем колонку Agency v/s System Bid Alignment Status
    const alignmentHeader = 'Agency v/s System  Bid Alignment Status';
    const alignmentIndex = activeFile.headers.indexOf(alignmentHeader);
    
    if (alignmentIndex === -1) {
      return { values: {}, total: activeFile.data.length, debug: 'Column not found' };
    }

    const valuesCounts: { [key: string]: number } = {};

    activeFile.data.forEach((row) => {
      let alignmentValue;
      
      if (Array.isArray(row)) {
        alignmentValue = row[alignmentIndex];
      } else if (typeof row === 'object' && row !== null) {
        alignmentValue = row[alignmentHeader] || row['Agency v/s System  Bid Alignment Status'];
      }

      if (alignmentValue && alignmentValue !== null && alignmentValue !== '') {
        const normalizedValue = String(alignmentValue).trim();
        valuesCounts[normalizedValue] = (valuesCounts[normalizedValue] || 0) + 1;
      }
    });

    return { 
      values: valuesCounts, 
      total: activeFile.data.length,
      debug: `Column found, processing ${activeFile.data.length} rows`
    };
  }, [activeFile]);

  const bidDeltaAggregation = useMemo(() => {
    if (!activeFile || !activeFile.data || !activeFile.headers) {
      return { groups: {}, total: 0, debug: 'No data' };
    }

    // Найдем колонку Δ (Current Bid As displayed on Amazon Seller Central - Latest Bid Calculated by the System)
    const deltaHeader = 'Δ (Current Bid As displayed on Amazon Seller Central - Latest Bid Calculated by the System)';
    const deltaIndex = activeFile.headers.indexOf(deltaHeader);
    
    if (deltaIndex === -1) {
      return { groups: {}, total: activeFile.data.length, debug: 'Column not found' };
    }

    const groups = {
      // Positive ranges
      '0-0.25': 0,
      '0.25-0.5': 0,
      '0.5-1.0': 0,
      '1.0-1.5': 0,
      '1.5-2.0': 0,
      '>2.0': 0,
      // Negative ranges
      '0 to -0.25': 0,
      '-0.25 to -0.5': 0,
      '-0.5 to -1.0': 0,
      '-1.0 to -1.5': 0,
      '-1.5 to -2.0': 0,
      '<-2.0': 0
    };

    activeFile.data.forEach((row) => {
      let deltaValue;
      
      if (Array.isArray(row)) {
        deltaValue = row[deltaIndex];
      } else if (typeof row === 'object' && row !== null) {
        deltaValue = row[deltaHeader];
      }

      if (deltaValue !== undefined && deltaValue !== null && deltaValue !== '') {
        const numValue = parseFloat(String(deltaValue));
        
        if (!isNaN(numValue)) {
          if (numValue >= 0 && numValue < 0.25) {
            groups['0-0.25']++;
          } else if (numValue >= 0.25 && numValue < 0.5) {
            groups['0.25-0.5']++;
          } else if (numValue >= 0.5 && numValue < 1.0) {
            groups['0.5-1.0']++;
          } else if (numValue >= 1.0 && numValue < 1.5) {
            groups['1.0-1.5']++;
          } else if (numValue >= 1.5 && numValue <= 2.0) {
            groups['1.5-2.0']++;
          } else if (numValue > 2.0) {
            groups['>2.0']++;
          } else if (numValue < 0 && numValue > -0.25) {
            groups['0 to -0.25']++;
          } else if (numValue <= -0.25 && numValue > -0.5) {
            groups['-0.25 to -0.5']++;
          } else if (numValue <= -0.5 && numValue > -1.0) {
            groups['-0.5 to -1.0']++;
          } else if (numValue <= -1.0 && numValue > -1.5) {
            groups['-1.0 to -1.5']++;
          } else if (numValue <= -1.5 && numValue >= -2.0) {
            groups['-1.5 to -2.0']++;
          } else if (numValue < -2.0) {
            groups['<-2.0']++;
          }
        }
      }
    });

    return { 
      groups, 
      total: activeFile.data.length,
      debug: `Column found, processing ${activeFile.data.length} rows`
    };
  }, [activeFile]);

  const analysisDeltaAggregation = useMemo(() => {
    if (!activeFile || !activeFile.data || !activeFile.headers) {
      return { values: {}, total: 0, debug: 'No data' };
    }

    // Найдем колонку Analysis Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)
    const analysisHeader = 'Analysis Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)';
    const analysisIndex = activeFile.headers.indexOf(analysisHeader);
    
    if (analysisIndex === -1) {
      return { values: {}, total: activeFile.data.length, debug: 'Column not found' };
    }

    const valuesCounts: { [key: string]: number } = {};

    activeFile.data.forEach((row, index) => {
      let analysisValue;
      
      if (Array.isArray(row)) {
        analysisValue = row[analysisIndex];
      } else if (typeof row === 'object' && row !== null) {
        analysisValue = row[analysisHeader];
      }

      if (analysisValue && analysisValue !== null && analysisValue !== '') {
        const normalizedValue = String(analysisValue).trim();
        valuesCounts[normalizedValue] = (valuesCounts[normalizedValue] || 0) + 1;
      }
    });

    return { 
      values: valuesCounts, 
      total: activeFile.data.length,
      debug: `Column found, processing ${activeFile.data.length} rows`
    };
  }, [activeFile]);

  const cvrWaterfallAggregation = useMemo(() => {
    if (!activeFile || !activeFile.data || !activeFile.headers) {
      return { levels: {}, total: 0, debug: 'No data' };
    }

    // Найдем колонку CVR Waterfall Level
    const cvrHeader = 'CVR Waterfall Level';
    const cvrIndex = activeFile.headers.indexOf(cvrHeader);
    
    if (cvrIndex === -1) {
      return { levels: {}, levelNames: {}, total: activeFile.data.length, debug: 'Column not found' };
    }

    const levels: { [key: string]: number } = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };

    // Mapping of numeric levels to their names
    const levelNames: { [key: string]: string } = {
      '1': 'ST Level CVR',
      '2': 'KW Level CVR', 
      '3': 'Campaign Level CVR',
      '4': 'ASIN Level CVR',
      '5': 'Default CVR'
    };

    // Для отладки - собираем все уникальные значения
    const allValues = new Set<string>();

    activeFile.data.forEach((row, index) => {
      let cvrValue;
      
      if (Array.isArray(row)) {
        cvrValue = row[cvrIndex];
      } else if (typeof row === 'object' && row !== null) {
        cvrValue = row[cvrHeader];
      }

      if (cvrValue !== undefined && cvrValue !== null && cvrValue !== '') {
        // Нормализуем значение: преобразуем числа в строки и убираем .0
        let normalizedValue = String(cvrValue).trim();
        
        // Если это число с .0, убираем .0 (например, "1.0" -> "1")
        if (normalizedValue.endsWith('.0')) {
          normalizedValue = normalizedValue.slice(0, -2);
        }
        
        allValues.add(normalizedValue);
        
        if (levels.hasOwnProperty(normalizedValue)) {
          levels[normalizedValue]++;
        }
      }
    });

    return { 
      levels, 
      levelNames,
      total: activeFile.data.length,
      debug: `Column found, processing ${activeFile.data.length} rows`
    };
  }, [activeFile]);

  if (!activeFile) {
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
              Data Aggregation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please select a CSV file from the homepage to view aggregation data
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            Data Aggregation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Intelligent data aggregation with real-time metrics and performance indicators
          </p>
        </div>

        {/* Active File Info */}
        <div className="mb-8 text-center">
          <p className="text-muted-foreground">
            Active File: <span className="font-medium text-foreground">{activeFile.name.replace(/\.csv$/i, '')}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Records: {activeFile.data?.length || 0}
          </p>
        </div>

        {/* Sync Status Widget - Full Width at Top */}
        <div className="max-w-7xl mx-auto mb-6">
          <Card className="shadow-card animate-slide-up">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Sync Status Overview</CardTitle>
                  <CardDescription>
                    Portal vs Agency managed keywords distribution
                  </CardDescription>
                  <div className="text-sm text-muted-foreground mt-2">
                    <span>Total Records: <span className="font-medium">{syncStatusAggregation.total}</span></span>
                  </div>
                </div>
                <div className="flex items-stretch space-x-12">
                  {/* Portal Managed */}
                  <div 
                    className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] flex-1 min-h-[80px]"
                    onClick={() => navigateToSimulation('sync_status', 'true')}
                  >
                    <div className="p-2 bg-blue-500 rounded-full shadow-lg flex-shrink-0">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <p className="text-sm font-medium text-foreground">Portal Manage Bids</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {syncStatusAggregation.portalManaged}
                        </span>
                        <span className="text-sm text-blue-500 dark:text-blue-400">
                          ({((syncStatusAggregation.portalManaged / syncStatusAggregation.total) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agency Managed */}
                  <div 
                    className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] flex-1 min-h-[80px]"
                    onClick={() => navigateToSimulation('sync_status', 'false')}
                  >
                    <div className="p-2 bg-red-500 rounded-full shadow-lg flex-shrink-0">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <p className="text-sm font-medium text-foreground">Agency Manually Manage Bids</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          {syncStatusAggregation.agencyManaged}
                        </span>
                        <span className="text-sm text-red-500 dark:text-red-400">
                          ({((syncStatusAggregation.agencyManaged / syncStatusAggregation.total) * 100 || 0).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Widgets Container */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* CVR Waterfall Level Widget */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">CVR Waterfall Level</CardTitle>
              <CardDescription>
                CVR calculation priority distribution across keyword levels
              </CardDescription>
              <div className="flex justify-center text-sm text-muted-foreground mt-2">
                <span>Total Records: <span className="font-medium">{cvrWaterfallAggregation.total}</span></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(cvrWaterfallAggregation.levels)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([level, count], index) => {
                    const levelName = cvrWaterfallAggregation.levelNames?.[level] || `Level ${level}`;
                    const percentage = ((count / cvrWaterfallAggregation.total) * 100).toFixed(1);
                    const isActive = count > 0;
                    
                    // Цветная схема для каждого уровня
                    const colors = [
                      'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'
                    ];
                    const bgColors = [
                      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
                      'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                      'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
                      'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800'
                    ];
                    const textColors = [
                      'text-blue-600 dark:text-blue-400',
                      'text-emerald-600 dark:text-emerald-400',
                      'text-orange-600 dark:text-orange-400',
                      'text-purple-600 dark:text-purple-400',
                      'text-pink-600 dark:text-pink-400'
                    ];
                    
                    return (
                      <div 
                        key={level}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                        onClick={() => navigateToSimulation('cvr_waterfall_level', level)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 ${colors[index % colors.length]} rounded-full shadow-lg`}>
                            <BarChart3 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{levelName}</p>
                            <p className="text-xs text-muted-foreground">Level {level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${textColors[index % textColors.length]}`}>{count}</p>
                          <p className="text-xs text-muted-foreground">({percentage}%)</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Bid Delta Widget */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">
                Bid Delta Distribution
                <span className="block text-lg font-normal text-muted-foreground mt-1">
                  Total Records: {bidDeltaAggregation.total}
                </span>
              </CardTitle>
              <CardDescription>
                Agency vs Portal bid difference groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Positive Values Column (> 0) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-center text-emerald-600 dark:text-emerald-400 mb-4 pb-2 border-b border-emerald-200 dark:border-emerald-800">
                    Positive Values (&gt; 0)
                  </h4>
                  {Object.entries(bidDeltaAggregation.groups)
                    .filter(([range]) => !range.startsWith('-') && !range.startsWith('<-') && range !== '0 to -0.25')
                    .map(([range, count], index) => {
                      const percentage = ((count / bidDeltaAggregation.total) * 100).toFixed(2);
                      const colors = [
                        'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500', 
                        'bg-purple-500', 'bg-pink-500'
                      ];
                      const bgColors = [
                        'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
                        'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                        'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                        'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                        'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
                        'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800'
                      ];
                      const textColors = [
                        'text-emerald-600 dark:text-emerald-400',
                        'text-blue-600 dark:text-blue-400',
                        'text-orange-600 dark:text-orange-400',
                        'text-red-600 dark:text-red-400',
                        'text-purple-600 dark:text-purple-400',
                        'text-pink-600 dark:text-pink-400'
                      ];
                      
                      return (
                        <div 
                          key={range} 
                          className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                          onClick={() => {
                            // Parse range and create between filter
                            const [from, to] = range === '>2.0' ? ['2.01', '999'] : range.split('-');
                            navigateToSimulation('bid_delta', '', 'between', from, to);
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="font-medium text-foreground text-sm">{range}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold text-sm ${textColors[index % textColors.length]}`}>{count}</span>
                            <span className="text-xs text-muted-foreground">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Negative Values Column (< 0) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-center text-red-600 dark:text-red-400 mb-4 pb-2 border-b border-red-200 dark:border-red-800">
                    Negative Values (&lt; 0)
                  </h4>
                  {Object.entries(bidDeltaAggregation.groups)
                    .filter(([range]) => range.startsWith('-') || range.startsWith('<-') || range === '0 to -0.25')
                    .map(([range, count], index) => {
                       const percentage = ((count / bidDeltaAggregation.total) * 100).toFixed(2);
                       // Use the same colors as positive column for symmetry
                       const colors = [
                         'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500', 
                         'bg-purple-500', 'bg-pink-500'
                       ];
                       const bgColors = [
                         'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
                         'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                         'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                         'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                         'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
                         'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800'
                       ];
                       const textColors = [
                         'text-emerald-600 dark:text-emerald-400',
                         'text-blue-600 dark:text-blue-400',
                         'text-orange-600 dark:text-orange-400',
                         'text-red-600 dark:text-red-400',
                         'text-purple-600 dark:text-purple-400',
                         'text-pink-600 dark:text-pink-400'
                       ];
                      
                       return (
                         <div 
                           key={range} 
                           className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                            onClick={() => {
                              // Parse negative range and create between filter
                              console.log('Clicking on range:', range);
                              if (range === '<-2.0') {
                                console.log('Navigating with: bid_delta, "", between, -999, -2.01');
                                navigateToSimulation('bid_delta', '', 'between', '-999', '-2.01');
                              } else if (range === '0 to -0.25') {
                                // For this range, we need from=-0.25 to=0, so swap the values since it's "0 to -0.25"
                                console.log('Navigating with: bid_delta, "", between, -0.25, 0');
                                navigateToSimulation('bid_delta', '', 'between', '-0.25', '0');
                              } else {
                                const [to, from] = range.split(' to '); // Note: swapped order because it's "to from" format for negatives
                                console.log('Navigating with: bid_delta, "", between,', from, to);
                                navigateToSimulation('bid_delta', '', 'between', from, to);
                              }
                            }}
                         >
                           <div className="flex items-center space-x-2">
                             <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                             <span className="font-medium text-foreground text-sm">{range}</span>
                           </div>
                           <div className="flex items-center space-x-2">
                             <span className={`font-bold text-sm ${textColors[index % textColors.length]}`}>{count}</span>
                             <span className="text-xs text-muted-foreground">({percentage}%)</span>
                           </div>
                         </div>
                       );
                    })}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Bid Alignment Status Widget - Two Columns */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Bid Alignment Status</CardTitle>
              <CardDescription>
                Agency vs System bid alignment distribution
              </CardDescription>
              <div className="flex justify-center text-sm text-muted-foreground mt-2">
                <span>Total Records: <span className="font-medium">{bidAlignmentAggregation.total}</span></span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* First Column - Items 1-5 */}
                <div className="space-y-3">
                  {Object.entries(bidAlignmentAggregation.values)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([value, count], index) => {
                      const percentage = ((count / bidAlignmentAggregation.total) * 100).toFixed(2);
                      const colors = [
                        'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500', 
                        'bg-purple-500'
                      ];
                      const bgColors = [
                        'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                        'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                        'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
                        'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
                        'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
                      ];
                      const textColors = [
                        'text-blue-600 dark:text-blue-400',
                        'text-red-600 dark:text-red-400',
                        'text-green-600 dark:text-green-400',
                        'text-orange-600 dark:text-orange-400',
                        'text-purple-600 dark:text-purple-400'
                      ];
                      
                      return (
                        <div 
                          key={value} 
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                          onClick={() => navigateToSimulation('bid_alignment', value)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="font-medium text-foreground text-sm">{value}</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${textColors[index % textColors.length]}`}>
                            <span className="font-bold">{count}</span>
                            <span className="text-xs">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Second Column - Items 6-10 */}
                <div className="space-y-3">
                  {Object.entries(bidAlignmentAggregation.values)
                    .sort(([,a], [,b]) => b - a)
                    .slice(5, 10)
                    .map(([value, count], index) => {
                      const percentage = ((count / bidAlignmentAggregation.total) * 100).toFixed(2);
                      const colors = [
                        'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-yellow-500', 'bg-cyan-500'
                      ];
                      const bgColors = [
                        'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
                        'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
                        'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
                        'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
                        'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800'
                      ];
                      const textColors = [
                        'text-pink-600 dark:text-pink-400',
                        'text-indigo-600 dark:text-indigo-400',
                        'text-teal-600 dark:text-teal-400',
                        'text-yellow-600 dark:text-yellow-400',
                        'text-cyan-600 dark:text-cyan-400'
                      ];
                      
                      return (
                        <div 
                          key={value} 
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                          onClick={() => navigateToSimulation('bid_alignment', value)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="font-medium text-foreground text-sm">{value}</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${textColors[index % textColors.length]}`}>
                            <span className="font-bold">{count}</span>
                            <span className="text-xs">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Delta Widget */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">
                Analysis Delta Status
                <span className="block text-lg font-normal text-muted-foreground mt-1">
                  Total Records: {analysisDeltaAggregation.total}
                </span>
              </CardTitle>
              <CardDescription>
                Latest vs Previous bid calculation difference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* First Column (0-3 items) */}
                <div className="space-y-3">
                  {Object.entries(analysisDeltaAggregation.values)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([value, count], index) => {
                      const percentage = ((count / analysisDeltaAggregation.total) * 100).toFixed(2);
                      const colors = [
                        'bg-cyan-500', 'bg-violet-500', 'bg-amber-500'
                      ];
                      const bgColors = [
                        'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
                        'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
                        'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                      ];
                      const textColors = [
                        'text-cyan-600 dark:text-cyan-400',
                        'text-violet-600 dark:text-violet-400',
                        'text-amber-600 dark:text-amber-400'
                      ];
                      
                      return (
                        <div 
                          key={value} 
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                          onClick={() => navigateToSimulation('analysis_delta', value)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="font-medium text-foreground">{value}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${textColors[index % textColors.length]}`}>
                              {count}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Second Column (3-5 items) */}
                <div className="space-y-3">
                  {Object.entries(analysisDeltaAggregation.values)
                    .sort(([,a], [,b]) => b - a)
                    .slice(3, 6)
                    .map(([value, count], index) => {
                      const percentage = ((count / analysisDeltaAggregation.total) * 100).toFixed(2);
                      const colors = [
                        'bg-lime-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-emerald-500'
                      ];
                      const bgColors = [
                        'bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-800',
                        'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
                        'bg-fuchsia-50 dark:bg-fuchsia-950/30 border-fuchsia-200 dark:border-fuchsia-800',
                        'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      ];
                      const textColors = [
                        'text-lime-600 dark:text-lime-400',
                        'text-sky-600 dark:text-sky-400',
                        'text-fuchsia-600 dark:text-fuchsia-400',
                        'text-emerald-600 dark:text-emerald-400'
                      ];
                      
                      return (
                        <div 
                          key={value} 
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] ${bgColors[index % bgColors.length]}`}
                          onClick={() => navigateToSimulation('analysis_delta', value)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="font-medium text-foreground">{value}</span>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${textColors[index % textColors.length]}`}>
                              {count}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default DataAggregation;