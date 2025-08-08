import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Target, Filter, X, Columns } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';
import { format, parseISO, isValid } from 'date-fns';

const BidSimulation = () => {
  const { activeFileId } = useAppSettings();
  const { files, isInitialized } = useIndexedDbStorage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Record<string, { operator: string; value: string; valueFrom?: string; valueTo?: string; source?: string }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [columnsPopoverOpen, setColumnsPopoverOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [tempVisibleColumns, setTempVisibleColumns] = useState<Record<string, boolean>>({});
  const itemsPerPage = 30;

  const filterOperators = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'greater', label: 'Greater' },
    { value: 'less', label: 'Less' },
    { value: 'greaterEqual', label: 'Greater or Equal' },
    { value: 'lessEqual', label: 'Less or Equal' },
    { value: 'between', label: 'Between' }
  ];

  const activeFile = useMemo(() => {
    return files.find(file => file.id === activeFileId);
  }, [files, activeFileId]);

  // Helper function for RCA complex filtering logic
  const applyRcaComplexFilter = (row: any, filterType: string, source: string) => {
    // Helper functions to safely get values from row
    const getValue = (columnName: string) => {
      if (Array.isArray(row)) {
        const index = activeFile?.headers?.indexOf(columnName) ?? -1;
        return index >= 0 ? row[index] : null;
      }
      return row[columnName];
    };
    
    const toNumber = (value: any): number => {
      if (value === null || value === undefined || value === '') return 0;
      const num = parseFloat(value.toString().replace(/[,$%]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      const str = value?.toString().toLowerCase();
      return str === 'true' || str === '1' || str === 'yes';
    };

    // Implement specific RCA filter logic
    switch (filterType) {
      case 'agency_underbidding_1':
        const syncStatus1 = toBool(getValue('Sync Status'));
        const appliedAcos1 = toNumber(getValue('I: Applied ACOS'));
        const adSpend1 = toNumber(getValue('J: Ad Spend'));
        const tosPercent1 = toNumber(getValue('M: TOS%'));
        const minSuggestedBid1 = toNumber(getValue('O: Min. Suggested Bid'));
        const currentBid1 = toNumber(getValue('Current Bid As displayed on Amazon Seller Central'));
        
        console.log('Agency Underbidding #1 filter check:', {
          syncStatus: !syncStatus1,
          appliedAcos: appliedAcos1,
          adSpend: adSpend1,
          tosPercent: tosPercent1,
          minSuggestedBid: minSuggestedBid1,
          currentBid: currentBid1,
          result: !syncStatus1 && appliedAcos1 === 9999 && adSpend1 === 0 && tosPercent1 <= 0 && minSuggestedBid1 > currentBid1
        });
        
        return !syncStatus1 && 
               appliedAcos1 === 9999 && 
               adSpend1 === 0 && 
               tosPercent1 <= 0 && 
               minSuggestedBid1 > currentBid1;

      case 'agency_overbidding_1':
        const syncStatus2 = toBool(getValue('Sync Status'));
        const appliedAcos2 = toNumber(getValue('I: Applied ACOS'));
        const targetAcos2 = toNumber(getValue('G: Target ACOS'));
        const currentBid2 = toNumber(getValue('Current Bid As displayed on Amazon Seller Central'));
        
        console.log('Agency Overbidding #1 filter check:', {
          syncStatus: !syncStatus2,
          appliedAcos: appliedAcos2,
          targetAcos: targetAcos2,
          currentBid: currentBid2,
          result: !syncStatus2 && appliedAcos2 < 9999 && appliedAcos2 > targetAcos2 && currentBid2 > 0.2
        });
        
        return !syncStatus2 && 
               appliedAcos2 < 9999 && 
               appliedAcos2 > targetAcos2 && 
               currentBid2 > 0.2;

      case 'agency_overbidding_2':
        const syncStatus3 = toBool(getValue('Sync Status'));
        const appliedAcos3 = toNumber(getValue('I: Applied ACOS'));
        const adSpend3 = toNumber(getValue('J: Ad Spend'));
        const targetAcos3 = toNumber(getValue('G: Target ACOS'));
        const price3 = toNumber(getValue('K: Price'));
        const currentBid3 = toNumber(getValue('Current Bid As displayed on Amazon Seller Central'));
        
        return !syncStatus3 && 
               appliedAcos3 === 9999 && 
               adSpend3 > (targetAcos3 * price3) && 
               currentBid3 > 0.2;

      case 'agency_overbidding_3':
        const syncStatus4 = toBool(getValue('Sync Status'));
        const appliedAcos4 = toNumber(getValue('I: Applied ACOS'));
        const currentBid4 = toNumber(getValue('Current Bid As displayed on Amazon Seller Central'));
        
        return !syncStatus4 && 
               appliedAcos4 < 9999 && 
               appliedAcos4 > 0.35 && 
               currentBid4 > 0.2;

      case 'portal_overbidding_1':
        const appliedAcos5 = toNumber(getValue('I: Applied ACOS'));
        const targetAcos5 = toNumber(getValue('G: Target ACOS'));
        const latestBid5 = toNumber(getValue('Latest Bid Calculated by the System'));
        
        console.log('Portal Overbidding #1 filter check:', {
          appliedAcos: appliedAcos5,
          targetAcos: targetAcos5,
          latestBid: latestBid5,
          result: appliedAcos5 < 9999 && appliedAcos5 > targetAcos5 && latestBid5 > 0.02
        });
        
        return appliedAcos5 < 9999 && 
               appliedAcos5 > targetAcos5 && 
               latestBid5 > 0.02;

      case 'portal_overbidding_2':
        const syncStatus6 = toBool(getValue('Sync Status'));
        const appliedAcos6 = toNumber(getValue('I: Applied ACOS'));
        const adSpend6 = toNumber(getValue('J: Ad Spend'));
        const targetAcos6 = toNumber(getValue('G: Target ACOS'));
        const price6 = toNumber(getValue('K: Price'));
        const latestBid6 = toNumber(getValue('Latest Bid Calculated by the System'));
        
        return syncStatus6 && 
               appliedAcos6 === 9999 && 
               adSpend6 > (targetAcos6 * price6) && 
               latestBid6 > 0.02;

      case 'portal_underbidding_1':
        const appliedAcos7 = toNumber(getValue('I: Applied ACOS'));
        const targetAcos7 = toNumber(getValue('G: Target ACOS'));
        const latestBid7 = toNumber(getValue('Latest Bid Calculated by the System'));
        
        console.log('Portal Underbidding #1 filter check:', {
          appliedAcos: appliedAcos7,
          targetAcos: targetAcos7,
          latestBid: latestBid7,
          result: appliedAcos7 < 9999 && appliedAcos7 < targetAcos7 && latestBid7 === 0.02
        });
        
        return appliedAcos7 < 9999 && 
               appliedAcos7 < targetAcos7 && 
               latestBid7 === 0.02;

      case 'portal_underbidding_2':
        const appliedAcos8 = toNumber(getValue('I: Applied ACOS'));
        const adSpend8 = toNumber(getValue('J: Ad Spend'));
        const targetAcos8 = toNumber(getValue('G: Target ACOS'));
        const price8 = toNumber(getValue('K: Price'));
        const latestBid8 = toNumber(getValue('Latest Bid Calculated by the System'));
        
        console.log('Portal Underbidding #2 filter check:', {
          appliedAcos: appliedAcos8,
          adSpend: adSpend8,
          targetAcos: targetAcos8,
          price: price8,
          latestBid: latestBid8,
          result: appliedAcos8 === 9999 && adSpend8 < (targetAcos8 * price8) && latestBid8 === 0.02
        });
        
        return appliedAcos8 === 9999 && 
               adSpend8 < (targetAcos8 * price8) && 
               latestBid8 === 0.02;

      case 'portal_underbidding_3':
        const syncStatus9 = toBool(getValue('Sync Status'));
        const minSuggestedBid9 = toNumber(getValue('O: Min. Suggested Bid'));
        const latestBid9 = toNumber(getValue('Latest Bid Calculated by the System'));
        const adSpend9 = toNumber(getValue('J: Ad Spend'));
        
        console.log('Portal Underbidding #3 filter check:', {
          syncStatus: syncStatus9,
          minSuggestedBid: minSuggestedBid9,
          latestBid: latestBid9,
          adSpend: adSpend9,
          result: syncStatus9 && minSuggestedBid9 > latestBid9 && adSpend9 === 0
        });
        
        return syncStatus9 && 
               minSuggestedBid9 > latestBid9 && 
               adSpend9 === 0;

      case 'portal_underbidding_4':
        const syncStatus10 = toBool(getValue('Sync Status'));
        const appliedAcos10 = toNumber(getValue('I: Applied ACOS'));
        const targetAcos10 = toNumber(getValue('G: Target ACOS'));
        const currentBidAmazon10 = toNumber(getValue('Current Bid As displayed on Amazon Seller Central'));
        const latestBid10 = toNumber(getValue('Latest Bid Calculated by the System'));
        const delta10 = currentBidAmazon10 - latestBid10;
        
        console.log('Portal Underbidding #4 filter check:', {
          syncStatus: syncStatus10,
          appliedAcos: appliedAcos10,
          targetAcos: targetAcos10,
          currentBidAmazon: currentBidAmazon10,
          latestBid: latestBid10,
          delta: delta10,
          result: !syncStatus10 && appliedAcos10 < targetAcos10 && delta10 > 0.26
        });
        
        return !syncStatus10 && 
               appliedAcos10 < targetAcos10 && 
               delta10 > 0.26;

      default:
        return true;
    }
  };

  // Initialize visible columns when file changes
  useEffect(() => {
    if (activeFile?.headers) {
      // Try to load saved column visibility settings
      const savedSettings = localStorage.getItem(`columnVisibility_${activeFileId}`);
      let initialVisibility: Record<string, boolean>;
      
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          // Ensure all current headers are included (for new columns)
          initialVisibility = activeFile.headers.reduce((acc, header) => {
            acc[header] = parsed[header] !== undefined ? parsed[header] : true;
            return acc;
          }, {} as Record<string, boolean>);
        } catch (error) {
          // If parsing fails, show all columns by default
          initialVisibility = activeFile.headers.reduce((acc, header) => {
            acc[header] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      } else {
        // No saved settings, show all columns by default
        initialVisibility = activeFile.headers.reduce((acc, header) => {
          acc[header] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
      
      setVisibleColumns(initialVisibility);
      setTempVisibleColumns(initialVisibility);
    }
  }, [activeFile?.headers, activeFileId]);

  // Load filters from URL params - handle different sources separately
  useEffect(() => {
    const newFilters: Record<string, { operator: string; value: string; valueFrom?: string; valueTo?: string }> = {};
    const source = searchParams.get('source');
    
    if (source === 'data_aggregation') {
      // Handle Data Aggregation format (single filter)
      const filterType = searchParams.get('filter');
      const filterValue = searchParams.get('value');
      const filterOperator = searchParams.get('operator') || 'equals';
      const valueFrom = searchParams.get('valueFrom');
      const valueTo = searchParams.get('valueTo');

      if (filterType && (filterValue || (filterOperator === 'between' && (valueFrom || valueTo)))) {
        let columnName = '';
        
        // Map filter types to actual column names (Data Aggregation)
        switch (filterType) {
          case 'sync_status':
            columnName = 'Sync Status';
            break;
          case 'bid_alignment':
            columnName = 'Agency v/s System  Bid Alignment Status';
            break;
          case 'bid_delta':
            columnName = 'Δ (Current Bid As displayed on Amazon Seller Central - Latest Bid Calculated by the System)';
            break;
          case 'analysis_delta':
            columnName = 'Analysis Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)';
            break;
          case 'cvr_waterfall_level':
            columnName = 'CVR Waterfall Level';
            break;
          default:
            columnName = filterType;
        }

        if (columnName) {
          const filterConfig: any = {
            operator: filterOperator,
            value: filterValue
          };

          // Add between values if they exist
          if (filterOperator === 'between' && (valueFrom || valueTo)) {
            filterConfig.valueFrom = valueFrom || '';
            filterConfig.valueTo = valueTo || '';
          } else if (valueFrom && valueTo) {
            filterConfig.valueFrom = valueFrom;
            filterConfig.valueTo = valueTo;
          }

          newFilters[columnName] = filterConfig;
        }
      }
    } else if (source === 'rca_analysis') {
      // Handle RCA Analysis format (multiple filters with suffixes)
      const allParams = Array.from(searchParams.entries());
      const filterGroups: Record<string, Record<string, string>> = {};
      
      allParams.forEach(([key, value]) => {
        const parts = key.split('_');
        if (parts.length >= 2 && ['filter', 'value', 'operator', 'valueFrom', 'valueTo'].includes(parts[0])) {
          const paramType = parts[0]; // filter, value, operator
          const filterKey = parts.slice(1).join('_'); // asin, campaign, kw, etc.
          
          if (!filterGroups[filterKey]) {
            filterGroups[filterKey] = {};
          }
          filterGroups[filterKey][paramType] = value;
        }
      });
      
      // Process each filter group (RCA Analysis)
      Object.entries(filterGroups).forEach(([filterKey, params]) => {
        const filterType = params.filter;
        const filterValue = params.value;
        const filterOperator = params.operator || 'equals';
        const valueFrom = params.valueFrom;
        const valueTo = params.valueTo;
        
        if (filterType && (filterValue || (filterOperator === 'between' && (valueFrom || valueTo)))) {
          let columnName = '';
          
          // Map filter types to actual column names (RCA Analysis)
          switch (filterType) {
            case 'ASIN':
            case 'Campaign':
            case 'KW':
            case 'Match Type':
              columnName = filterType;
              break;
            default:
              columnName = filterType;
          }

          if (columnName) {
            const filterConfig: any = {
              operator: filterOperator,
              value: filterValue
            };

            // Add between values if they exist
            if (filterOperator === 'between' && (valueFrom || valueTo)) {
              filterConfig.valueFrom = valueFrom || '';
              filterConfig.valueTo = valueTo || '';
            } else if (valueFrom && valueTo) {
              filterConfig.valueFrom = valueFrom;
              filterConfig.valueTo = valueTo;
            }

            newFilters[columnName] = filterConfig;
          }
        }
      });
    } else if (source === 'rca_portal' || source === 'rca_agency') {
      // Handle RCA Portal/Agency format with complex logic
      const filterType = searchParams.get('filter_type');
      
      console.log('RCA Filter Debug:', {
        source,
        filterType,
        allParams: Object.fromEntries(searchParams.entries())
      });
      
      if (filterType) {
        // Store the complex filter type for special handling
        newFilters['__rca_filter_type__'] = {
          operator: 'rca_complex',
          value: filterType
        };
        
        console.log('Applied RCA complex filter:', filterType);
      }
    }
    
    // Apply filters if any were found
    if (Object.keys(newFilters).length > 0) {
      setFilters(newFilters);
    }

    // Clear URL params after applying
    setSearchParams(new URLSearchParams());
  }, [searchParams, setSearchParams]);

  const filteredData = useMemo(() => {
    if (!activeFile?.data || !activeFile?.headers) return [];

    return activeFile.data.filter((row) => {
      return Object.entries(filters).every(([column, filter]) => {
        // Handle RCA complex filters
        if (filter.operator === 'rca_complex') {
          // Determine source from the URL searchParams if column doesn't help
          const urlSource = new URLSearchParams(window.location.search).get('source');
          let actualSource = 'agency'; // default
          
          if (urlSource === 'rca_portal') {
            actualSource = 'portal';
          } else if (urlSource === 'rca_agency') {
            actualSource = 'agency';
          }
          
          console.log('RCA Complex Filter Apply:', {
            filterValue: filter.value,
            actualSource,
            urlSource,
            column
          });
          
          return applyRcaComplexFilter(row, filter.value, actualSource);
        }
        // For between filter, check if at least one value is provided
        if (filter.operator === 'between' && (!filter.valueFrom && !filter.valueTo)) {
          return true; // Skip filtering if both values are empty
        }
        
        // For other filters, check if value exists
        if (filter.operator !== 'between' && !filter.value) {
          return true; // Skip filtering if no value
        }
        
        let cellValue;
        if (Array.isArray(row)) {
          const columnIndex = activeFile.headers.indexOf(column);
          cellValue = row[columnIndex];
        } else {
          cellValue = row[column];
        }
        
        const cellStr = String(cellValue || '').toLowerCase();
        const filterStr = (filter.value || '').toLowerCase();
        const cellNum = parseFloat(cellValue || '0');
        const filterNum = parseFloat(filter.value || '0');

        switch (filter.operator) {
          case 'equals':
            // Специальная обработка для CVR Waterfall Level
            if (column === 'CVR Waterfall Level') {
              // Нормализуем значение из данных для сравнения
              let normalizedCellValue = String(cellValue || '').trim();
              if (normalizedCellValue.endsWith('.0')) {
                normalizedCellValue = normalizedCellValue.slice(0, -2);
              }
              return normalizedCellValue === filter.value;
            }
            return cellStr === filterStr;
          case 'contains':
            return cellStr.includes(filterStr);
          case 'greater':
            return !isNaN(cellNum) && !isNaN(filterNum) && cellNum > filterNum;
          case 'less':
            return !isNaN(cellNum) && !isNaN(filterNum) && cellNum < filterNum;
          case 'greaterEqual':
            return !isNaN(cellNum) && !isNaN(filterNum) && cellNum >= filterNum;
          case 'lessEqual':
            return !isNaN(cellNum) && !isNaN(filterNum) && cellNum <= filterNum;
          case 'between':
            const hasFromValue = filter.valueFrom && filter.valueFrom.trim() !== '';
            const hasToValue = filter.valueTo && filter.valueTo.trim() !== '';
            
            if (!hasFromValue && !hasToValue) {
              return true; // No values provided, skip filter
            }
            
            const fromValue = hasFromValue ? parseFloat(filter.valueFrom) : Number.NEGATIVE_INFINITY;
            const toValue = hasToValue ? parseFloat(filter.valueTo) : Number.POSITIVE_INFINITY;
            
            // If only one value is provided, treat as >= or <= respectively
            if (!isNaN(cellNum)) {
              let result = false;
              if (hasFromValue && hasToValue) {
                result = cellNum >= fromValue && cellNum <= toValue;
              } else if (hasFromValue) {
                result = cellNum >= fromValue;
              } else if (hasToValue) {
                result = cellNum <= toValue;
              }
              return result;
            }
            return false;
          default:
            return cellStr.includes(filterStr);
        }
      });
    });
  }, [activeFile, filters]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleFilterChange = (column: string, operator: string, value: string, valueFrom?: string, valueTo?: string) => {
    if (operator === 'between') {
      // For between operator, we need both valueFrom and valueTo
      if (!valueFrom && !valueTo) {
        // If both are empty, remove the filter
        setFilters(prev => {
          const newFilters = { ...prev };
          delete newFilters[column];
          return newFilters;
        });
      } else {
        // Keep the between filter with current values
        setFilters(prev => {
          const newFilter = { operator, value: '', valueFrom: valueFrom || '', valueTo: valueTo || '' };
          return {
            ...prev,
            [column]: newFilter
          };
        });
      }
    } else {
      // For other operators
      if (!value) {
        // Remove filter if value is empty
        setFilters(prev => {
          const newFilters = { ...prev };
          delete newFilters[column];
          return newFilters;
        });
      } else {
        setFilters(prev => {
          const newFilter = { operator, value };
          return {
            ...prev,
            [column]: newFilter
          };
        });
      }
    }
    setCurrentPage(1);
  };

  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Get column width with fallback to default
  const getColumnWidth = (header: string) => {
    if (columnWidths[header]) {
      return columnWidths[header];
    }
    
    // Set compact default widths - users can expand if needed
    if (header.includes('Date & Time:')) {
      return 80; // Compact dates
    }
    if (header.includes('ASIN') || header.includes('Campaign')) {
      return 80; // Compact IDs and names
    }
    if (header.includes('Δ (') || header.includes('Delta')) {
      return 80; // Compact delta columns
    }
    if (header.includes('Status') || header.includes('Type')) {
      return 80; // Compact status columns
    }
    if (header.includes('KW') || header.includes('Search Term')) {
      return 80; // Compact keywords
    }
    
    return 80; // Compact default width
  };

  // Handle column resize
  const handleMouseDown = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(header);
    
    const startX = e.clientX;
    const startWidth = getColumnWidth(header);
    
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX)); // Minimum width of 80px
      setColumnWidths(prev => ({
        ...prev,
        [header]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Generate grid template columns with custom widths
  const getGridTemplate = () => {
    if (!activeFile?.headers) return '';
    return activeFile.headers
      .filter(header => visibleColumns[header])
      .map(header => `${getColumnWidth(header)}px`)
      .join(' ');
  };

  // Get filtered headers based on visibility
  const filteredHeaders = useMemo(() => {
    if (!activeFile?.headers) return [];
    return activeFile.headers.filter(header => visibleColumns[header]);
  }, [activeFile?.headers, visibleColumns]);

  // Column management functions
  const handleColumnsMenuOpen = () => {
    setTempVisibleColumns({ ...visibleColumns });
    setColumnsPopoverOpen(true);
  };

  const handleColumnToggle = (header: string, checked: boolean) => {
    setTempVisibleColumns(prev => ({
      ...prev,
      [header]: checked
    }));
  };

  const handleSaveColumns = () => {
    setVisibleColumns({ ...tempVisibleColumns });
    // Save to localStorage for persistence
    if (activeFileId) {
      localStorage.setItem(`columnVisibility_${activeFileId}`, JSON.stringify(tempVisibleColumns));
    }
    setColumnsPopoverOpen(false);
  };

  const handleAbortColumns = () => {
    setTempVisibleColumns({ ...visibleColumns });
    setColumnsPopoverOpen(false);
  };

  const formatCellValue = (value: any, header: string, row?: any) => {
    // Calculate delta values if they're missing or blank
    if (header === 'Δ (Current Bid As displayed on Amazon Seller Central - Previous Bid As displayed on Amazon Seller Central )' && row) {
      let currentBid, previousBid;
      
      if (Array.isArray(row)) {
        const currentBidIndex = activeFile?.headers?.indexOf('Current Bid As displayed on Amazon Seller Central') ?? -1;
        const previousBidIndex = activeFile?.headers?.indexOf('Previous Bid As displayed on Amazon Seller Central') ?? -1;
        currentBid = currentBidIndex >= 0 ? parseFloat(row[currentBidIndex] || '0') : 0;
        previousBid = previousBidIndex >= 0 ? parseFloat(row[previousBidIndex] || '0') : 0;
      } else {
        currentBid = parseFloat(row['Current Bid As displayed on Amazon Seller Central'] || '0');
        previousBid = parseFloat(row['Previous Bid As displayed on Amazon Seller Central'] || '0');
      }
      
      if (!isNaN(currentBid) && !isNaN(previousBid) && (currentBid > 0 || previousBid > 0)) {
        const delta = currentBid - previousBid;
        return delta.toFixed(2);
      }
      
      // If calculation fails or original value exists, use original value
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(String(value));
        return !isNaN(numValue) ? numValue.toFixed(2) : value;
      }
      
      return '--';
    }
    
    // Check if this is a numeric column that needs 2 decimal places formatting (check this FIRST)
    const numericColumns = [
      'Previous Bid As displayed on Amazon Seller Central',
      'Current Bid As displayed on Amazon Seller Central',
      'Previous Bid Calculated by the System',
      'Latest Bid Calculated by the System',
      'Δ (Current Bid As displayed on Amazon Seller Central - Latest Bid Calculated by the System)',
      'Δ (Current Bid As displayed on Amazon Seller Central - Previous Bid As displayed on Amazon Seller Central )',
      'Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)',
      'Analysis Δ (Latest Bid Calculated by the System - Previous Bid Calculated by the System)',
      'A: Fixed Bid',
      'C: Ceiling Bid',
      'E: Floor Bid',
      'effective_ceiling',
      'effective_floor',
      'adjusted_bid',
      'G: Target ACOS',
      'I: Applied ACOS',
      'J: Ad Spend',
      'K: Price',
      'L: Clicks',
      'M: TOS%',
      'N: CVR',
      'CVR Waterfall Level',
      'O: Min. Suggested Bid',
      'P: Max. Suggested Bid',
      'Impressions for latest available date i.e. today or yesterday',
      'Impressions for latest available date - 1',
      'Bid before 0.19 ASIN-KW-Match Type level',
      'Avg. CPC_30d ASIN-Search Term level',
      'Avg Daily Orders Reporting Period # 1',
      '50P_Daily Orders Reporting Period # 1',
      '75P_Daily Orders Reporting Period # 1',
      'Orders_1d',
      'Avg Daily Orders Reporting Period # 2',
      '50P_Daily Orders Reporting Period # 2',
      '75P_Daily Orders Reporting Period # 2',
      'Avg CPC Reporting Period # 1',
      '50P_CPC corresponding to Order dates Reporting Period # 1',
      '75P_CPC corresponding to Order dates Reporting Period # 1',
      'CPC_1d',
      'Avg CPC Reporting Period # 2',
      '50P_CPC corresponding to Order dates Reporting Period # 2',
      '75P_CPC corresponding to Order dates Reporting Period # 2',
      'Avg CVR Reporting Period # 1',
      '50P_CVR corresponding to Order dates Reporting Period # 1',
      '75P_CVR corresponding to Order dates Reporting Period # 1',
      'CVR_1d',
      'Avg CVR Reporting Period # 2',
      '50P_CVR corresponding to Order dates Reporting Period # 2',
      '75P_CVR corresponding to Order dates Reporting Period # 2',
      'Avg ACOS Reporting Period # 1',
      '50P_ACOS corresponding to Order dates Reporting Period # 1',
      '75P_ACOS corresponding to Order dates Reporting Period # 1',
      'ACOS_1d',
      'Avg ACOS Reporting Period # 2',
      '50P_ACOS corresponding to Order dates Reporting Period # 2',
      '75P_ACOS corresponding to Order dates Reporting Period # 2',
      'Avg TOS% Reporting Period # 1',
      '50P_TOS% corresponding to Order dates Reporting Period # 1',
      '75P_TOS% corresponding to Order dates Reporting Period # 1',
      'TOS%_1d',
      'Avg TOS% Reporting Period # 2',
      '50P_TOS% corresponding to Order dates Reporting Period # 2',
      '75P_TOS% corresponding to Order dates Reporting Period # 2',
      'Avg. Price Weighted by Orders Reporting Period # 1',
      '50P_Price corresponding to Order dates Reporting Period # 1',
      '75P_Price corresponding to Order dates Reporting Period # 1',
      'Price_1d',
      'Avg. Price Weighted by Orders Reporting Period # 2',
      '50P_Price corresponding to Order dates Reporting Period # 2',
      '75P_Price corresponding to Order dates Reporting Period # 2',
      'Avg Daily Orders ASIN + Search Term Level Reporting Period # 1',
      '50P_Daily Orders ASIN + Search Term Level Reporting Period # 1',
      '75P_Daily Orders ASIN + Search Term Level Reporting Period # 1',
      'Orders_1d ASIN + Search Term Level',
      'Avg Daily Orders ASIN + Search Term Level Reporting Period # 2',
      '50P_Daily Orders ASIN + Search Term Level Reporting Period # 2',
      '75P_Daily Orders ASIN + Search Term Level Reporting Period # 2'
    ];
    
    const isNumericColumn = numericColumns.includes(header);
    
    // Check if this is a date column (only for actual date columns, not numeric columns with "date" in name)
    const isDateColumn = !isNumericColumn && (
      header.includes('Date & Time:') || 
      (header.toLowerCase().includes('date') && !header.includes('corresponding to Order dates')) ||
      header.toLowerCase().includes('time')
    );
    
    if (isDateColumn && value) {
      try {
        const stringValue = String(value).trim();
        
        if (stringValue && stringValue !== '') {
          // Handle special case: Long.MIN_VALUE (-9223372036854775808) means "not set"
          if (stringValue === '-9223372036854775808') {
            return '-';
          }
          
          // Handle numeric timestamps (microseconds or nanoseconds)
          if (/^\d+$/.test(stringValue)) {
            const numValue = parseInt(stringValue);
            let date: Date | null = null;
            
            // Try different timestamp formats
            if (stringValue.length === 19) {
              // Likely nanoseconds, convert to milliseconds
              date = new Date(numValue / 1000000);
            } else if (stringValue.length === 16) {
              // Likely microseconds, convert to milliseconds  
              date = new Date(numValue / 1000);
            } else if (stringValue.length === 13) {
              // Likely milliseconds
              date = new Date(numValue);
            } else if (stringValue.length === 10) {
              // Likely seconds
              date = new Date(numValue * 1000);
            }
            
            if (date && !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
              return format(date, 'yyyy-MM-dd');
            }
          }
          
          // Handle PostgreSQL timestamp format (e.g., "2025-08-06 09:27:19.727364+00:00")
          // Extract just the date part before the space
          if (stringValue.includes(' ')) {
            const datePart = stringValue.split(' ')[0];
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return datePart;
            }
          }
          
          // Fallback: try to parse as date and format
          const date = new Date(stringValue);
          if (!isNaN(date.getTime())) {
            return format(date, 'yyyy-MM-dd');
          }
        }
      } catch (error) {
        console.log('Date parsing failed for:', value, error);
      }
    }
    
    if (isNumericColumn && value !== null && value !== undefined && value !== '') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue.toFixed(2);
      }
    }
    
    return String(value || '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="shadow-card hover:shadow-elegant transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Bid Simulation
            </h1>
          </div>
          <ThemeToggle />
        </div>
        {/* Subtle gray line separator */}
        <div className="h-px bg-border/50"></div>
      </div>
      
      <div className="pt-[68px] px-4 py-6">

        {!isInitialized ? (
          <Card className="shadow-card animate-slide-up max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                <Target className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">Loading...</CardTitle>
              <CardDescription className="text-base">
                Loading CSV data, please wait...
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !activeFile ? (
          <Card className="shadow-card animate-slide-up max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="p-4 bg-warning/10 rounded-full w-fit mx-auto mb-4">
                <Target className="h-12 w-12 text-warning" />
              </div>
              <CardTitle className="text-2xl">No CSV File Selected</CardTitle>
              <CardDescription className="text-base">
                Please select a CSV file to view the bid simulation data
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/csv-upload">
                <Button className="mt-4">
                  Upload CSV File
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Data Table */}
            <Card className="shadow-card">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Target className="h-5 w-5" />
                   {activeFile.name.replace(/\.csv$/i, '')}
                 </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>
                    Total Records: {filteredData.length} / {activeFile.data.length} | 
                    Showing {paginatedData.length} records (Page {currentPage} of {totalPages})
                  </span>
                  <div className="flex items-center gap-2">
                    <Popover open={columnsPopoverOpen} onOpenChange={setColumnsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleColumnsMenuOpen}
                        >
                          <Columns className="h-4 w-4 mr-2" />
                          Columns
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 max-h-96 overflow-y-auto" side="bottom" align="end">
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Column Visibility</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {activeFile.headers.map((header) => (
                              <div key={header} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`column-${header}`}
                                  checked={tempVisibleColumns[header] || false}
                                  onCheckedChange={(checked) => 
                                    handleColumnToggle(header, checked as boolean)
                                  }
                                />
                                <label 
                                  htmlFor={`column-${header}`}
                                  className="text-xs flex-1 cursor-pointer"
                                  title={header}
                                >
                                  {header.length > 50 ? `${header.substring(0, 50)}...` : header}
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleAbortColumns}
                            >
                              Abort
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveColumns}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {Object.keys(filters).length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAllFilters}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[70vh] flex flex-col">
                  {/* Fixed Header with Filters - Always Visible */}
                  <div className="sticky top-0 z-30 bg-card border-b shadow-sm">
                    <div 
                      className="overflow-x-auto scrollbar-hide"
                      onScroll={(e) => {
                        // Sync scroll with data area
                        const dataContainer = e.currentTarget.parentElement?.nextElementSibling?.firstElementChild as HTMLElement;
                        if (dataContainer) {
                          dataContainer.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                      ref={(el) => {
                        if (el) {
                          // Store reference for syncing from data area
                          (el as any).syncScroll = true;
                        }
                      }}
                    >
                      <div 
                        className="grid gap-0 min-w-fit"
                        style={{ 
                          gridTemplateColumns: getGridTemplate()
                        }}
                      >
                        {filteredHeaders.map((header, headerIndex) => (
                          <div key={header} className="border-r last:border-r-0 bg-card relative group">
                            <div className="p-2">
                              <div className="space-y-1">
                                <div 
                                  className="font-medium text-xs leading-tight h-20 overflow-hidden flex items-center justify-center text-center"
                                  title={header}
                                  style={{
                                    wordBreak: 'break-word',
                                    hyphens: 'auto',
                                    lineHeight: '1.2',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 8,
                                    WebkitBoxOrient: 'vertical'
                                  }}
                                >
                                  {header}
                                </div>
                                <Select
                                  value={filters[header]?.operator || 'contains'}
                                  onValueChange={(operator) => {
                                    if (operator === 'between') {
                                      // Initialize between filter immediately to show input fields
                                      setFilters(prev => ({
                                        ...prev,
                                        [header]: { operator: 'between', value: '', valueFrom: '', valueTo: '' }
                                      }));
                                    } else {
                                      // For other operators, keep existing value or empty
                                      handleFilterChange(header, operator, filters[header]?.value || '');
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-full h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="z-50 bg-background">
                                    {filterOperators.map((op) => (
                                      <SelectItem key={op.value} value={op.value} className="text-xs">
                                        {op.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                {/* Between filter with horizontal layout */}
                                {filters[header]?.operator === 'between' ? (
                                  <div className="flex gap-1">
                                    <Input
                                      placeholder="From..."
                                      value={filters[header]?.valueFrom || ''}
                                      onChange={(e) => 
                                        handleFilterChange(
                                          header, 
                                          'between', 
                                          '', 
                                          e.target.value, 
                                          filters[header]?.valueTo || ''
                                        )
                                      }
                                      className="h-7 text-xs flex-1"
                                    />
                                    <Input
                                      placeholder="To..."
                                      value={filters[header]?.valueTo || ''}
                                      onChange={(e) => 
                                        handleFilterChange(
                                          header, 
                                          'between', 
                                          '', 
                                          filters[header]?.valueFrom || '', 
                                          e.target.value
                                        )
                                      }
                                      className="h-7 text-xs flex-1"
                                    />
                                    {(filters[header]?.valueFrom || filters[header]?.valueTo) && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => clearFilter(header)}
                                        className="h-7 w-7 p-0 shrink-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    <Input
                                      placeholder="Filter..."
                                      value={filters[header]?.value || ''}
                                      onChange={(e) => 
                                        handleFilterChange(header, filters[header]?.operator || 'contains', e.target.value)
                                      }
                                      className="h-7 text-xs flex-1"
                                    />
                                    {filters[header]?.value && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => clearFilter(header)}
                                        className="h-7 w-7 p-0 shrink-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Resizable Handle */}
                            {headerIndex < filteredHeaders.length - 1 && (
                              <div
                                className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors ${
                                  resizingColumn === header ? 'bg-primary' : ''
                                }`}
                                onMouseDown={(e) => handleMouseDown(e, header)}
                                style={{ userSelect: 'none' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Scrollable Data Area */}
                  <div className="flex-1 overflow-y-auto">
                    <div 
                      className="overflow-x-auto scrollbar-hide"
                      onScroll={(e) => {
                        // Sync scroll with header
                        const headerContainer = e.currentTarget.parentElement?.previousElementSibling?.firstElementChild as HTMLElement;
                        if (headerContainer && (headerContainer as any).syncScroll) {
                          headerContainer.scrollLeft = e.currentTarget.scrollLeft;
                        }
                        // Sync with bottom scrollbar
                        const bottomScrollbar = e.currentTarget.parentElement?.nextElementSibling?.firstElementChild as HTMLElement;
                        if (bottomScrollbar) {
                          bottomScrollbar.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                    >
                      <div className="space-y-0 min-w-fit">
                        {paginatedData.map((row, index) => (
                          <div 
                            key={index} 
                            className={`grid gap-0 hover:bg-muted/40 transition-colors border-b ${
                              index % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                            }`}
                             style={{ 
                               gridTemplateColumns: getGridTemplate()
                             }}
                          >
                            {filteredHeaders.map((header, cellIndex) => {
                              let cellValue;
                              if (Array.isArray(row)) {
                                const originalIndex = activeFile.headers.indexOf(header);
                                cellValue = row[originalIndex];
                              } else {
                                cellValue = row[header];
                              }
                              
                              const formattedValue = formatCellValue(cellValue, header, row);
                              
                              return (
                                <div key={cellIndex} className="p-2 border-r last:border-r-0 flex items-center">
                                  <div className="truncate text-xs w-full" title={formattedValue}>
                                    {formattedValue}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fixed Horizontal Scrollbar - Always Visible and Controls All */}
                  <div className="sticky bottom-0 z-20 bg-card border-t">
                    <div 
                      className="overflow-x-auto overflow-y-hidden"
                      onScroll={(e) => {
                        // Sync scroll with both header and data area
                        const container = e.currentTarget.parentElement?.parentElement;
                        const headerContainer = container?.firstElementChild?.firstElementChild as HTMLElement;
                        const dataContainer = container?.children[1]?.firstElementChild as HTMLElement;
                        
                        if (headerContainer && (headerContainer as any).syncScroll) {
                          headerContainer.scrollLeft = e.currentTarget.scrollLeft;
                        }
                        if (dataContainer) {
                          dataContainer.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                    >
                       <div style={{ 
                         width: `${filteredHeaders.reduce((total, header) => total + getColumnWidth(header), 0)}px`, 
                         height: '16px' 
                       }}></div>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t bg-card/95 backdrop-blur-sm">
                    <div className="flex items-center justify-between p-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
                        {filteredData.length} entries
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-3 text-sm font-medium bg-muted/50 rounded">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidSimulation;