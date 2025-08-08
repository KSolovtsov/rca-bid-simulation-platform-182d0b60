import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AgencyBidAnalysisWidgetProps {
  data: any[];
}

const AgencyBidAnalysisWidget = ({ data }: AgencyBidAnalysisWidgetProps) => {
  const navigate = useNavigate();
  // Debug: Log the data structure and available columns
  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log('=== AGENCY WIDGET DEBUG ===');
      console.log('Available columns:', Object.keys(data[0]));
      console.log('Total records:', data.length);
      console.log('Sample row data:', data[0]);
      
      // Check specific columns that we need
      const sampleRow = data[0];
      console.log('Key column values:');
      console.log('- Sync Status:', sampleRow['Sync Status'], typeof sampleRow['Sync Status']);
      console.log('- Applied ACOS:', sampleRow['Applied ACOS'], typeof sampleRow['Applied ACOS']);
      console.log('- Target ACOS:', sampleRow['Target ACOS'], typeof sampleRow['Target ACOS']);
      console.log('- Current Bid As displayed on Amazon Seller Central:', sampleRow['Current Bid As displayed on Amazon Seller Central']);
      console.log('- Ad Spend:', sampleRow['Ad Spend']);
      console.log('- TOS%:', sampleRow['TOS%']);
      console.log('- Min. Suggested Bid:', sampleRow['Min. Suggested Bid']);
      console.log('=== END AGENCY DEBUG ===');
    }
  }, [data]);

  const getOverbiddingDescription = (index: number) => {
    const descriptions = [
      'ACOS Greater than Target ACOS',
      'High Spends without sales', 
      'ACOS >35% Need Human Loop'
    ];
    return descriptions[index] || '';
  };
  
  // Helper functions to safely convert values
  const toNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value.toString().replace(/[,$%]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const toBool = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    const str = value?.toString().toLowerCase();
    return str === 'false';
  };

  // Navigation function for RCA Agency filters
  const navigateToSimulation = (filterType: string) => {
    const params = new URLSearchParams();
    params.append('source', 'rca_agency');
    params.append('filter_type', filterType);
    
    // Add common conditions for Agency widgets
    params.append('filter_sync_status', 'Sync Status');
    params.append('value_sync_status', 'false');
    params.append('operator_sync_status', 'equals');
    
    // Add specific conditions based on filter type
    switch (filterType) {
      case 'agency_underbidding_1':
        params.append('filter_applied_acos', 'I: Applied ACOS');
        params.append('value_applied_acos', '9999');
        params.append('operator_applied_acos', 'equals');
        
        params.append('filter_ad_spend', 'J: Ad Spend');
        params.append('value_ad_spend', '0');
        params.append('operator_ad_spend', 'equals');
        
        params.append('filter_tos_percent', 'M: TOS%');
        params.append('value_tos_percent', '0');
        params.append('operator_tos_percent', 'lessEqual');
        
        params.append('filter_min_suggested_bid', 'O: Min. Suggested Bid');
        params.append('filter_current_bid', 'Current Bid As displayed on Amazon Seller Central');
        params.append('operator_bid_comparison', 'min_greater_than_current');
        break;
        
      case 'agency_overbidding_1':
        params.append('filter_applied_acos', 'I: Applied ACOS');
        params.append('value_applied_acos', '9999');
        params.append('operator_applied_acos', 'less');
        
        params.append('filter_target_acos', 'G: Target ACOS');
        params.append('operator_acos_comparison', 'applied_less_than_target');
        
        params.append('filter_current_bid', 'Current Bid As displayed on Amazon Seller Central');
        params.append('value_current_bid', '0.2');
        params.append('operator_current_bid', 'greater');
        break;
        
      case 'agency_overbidding_2':
        params.append('filter_applied_acos', 'I: Applied ACOS');
        params.append('value_applied_acos', '9999');
        params.append('operator_applied_acos', 'equals');
        
        params.append('filter_ad_spend', 'J: Ad Spend');
        params.append('filter_target_acos', 'G: Target ACOS');
        params.append('filter_price', 'K: Price');
        params.append('operator_spend_comparison', 'ad_spend_greater_than_target_price');
        
        params.append('filter_current_bid', 'Current Bid As displayed on Amazon Seller Central');
        params.append('value_current_bid', '0.2');
        params.append('operator_current_bid', 'greater');
        break;
        
      case 'agency_overbidding_3':
        params.append('filter_applied_acos', 'I: Applied ACOS');
        params.append('value_applied_acos', '9999');
        params.append('operator_applied_acos', 'less');
        
        params.append('filter_applied_acos_threshold', 'I: Applied ACOS');
        params.append('value_applied_acos_threshold', '0.35');
        params.append('operator_applied_acos_threshold', 'greater');
        
        params.append('filter_current_bid', 'Current Bid As displayed on Amazon Seller Central');
        params.append('value_current_bid', '0.2');
        params.append('operator_current_bid', 'greater');
        break;
    }
    
    navigate(`/bid-simulation?${params.toString()}`);
  };

  // Calculate Agency Underbidding
  const agencyUnderbidding1 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedACOS = toNumber(row['I: Applied ACOS']);
    const adSpend = toNumber(row['J: Ad Spend']);
    const tosPercent = toNumber(row['M: TOS%']);
    const minSuggestedBid = toNumber(row['O: Min. Suggested Bid']);
    const currentBid = toNumber(row['Current Bid As displayed on Amazon Seller Central']);
    
    console.log('Agency Underbidding #1 check:', {
      syncStatus,
      appliedACOS,
      adSpend,
      tosPercent,
      minSuggestedBid,
      currentBid,
      passes: syncStatus && appliedACOS === 9999 && adSpend === 0 && tosPercent <= 0 && minSuggestedBid > currentBid
    });
    
    return syncStatus &&
           appliedACOS === 9999 &&
           adSpend === 0 &&
           tosPercent <= 0 &&
           minSuggestedBid > currentBid;
  });

  // Calculate Agency Overbidding
  const agencyOverbidding1 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedACOS = toNumber(row['I: Applied ACOS']);
    const targetACOS = toNumber(row['G: Target ACOS']);
    const currentBid = toNumber(row['Current Bid As displayed on Amazon Seller Central']);
    
    console.log('Agency Overbidding #1 check:', {
      syncStatus,
      appliedACOS,
      targetACOS,
      currentBid,
      passes: syncStatus && appliedACOS < 9999 && appliedACOS < targetACOS && currentBid > 0.2
    });
    
    return syncStatus &&
           appliedACOS < 9999 &&
           appliedACOS < targetACOS &&
           currentBid > 0.2;
  });

  const agencyOverbidding2 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedACOS = toNumber(row['I: Applied ACOS']);
    const adSpend = toNumber(row['J: Ad Spend']);
    const targetACOS = toNumber(row['G: Target ACOS']);
    const price = toNumber(row['K: Price']);
    const currentBid = toNumber(row['Current Bid As displayed on Amazon Seller Central']);
    
    return syncStatus &&
           appliedACOS === 9999 &&
           adSpend > (targetACOS * price) &&
           currentBid > 0.2;
  });

  const agencyOverbidding3 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedACOS = toNumber(row['I: Applied ACOS']);
    const currentBid = toNumber(row['Current Bid As displayed on Amazon Seller Central']);
    
    return syncStatus &&
           appliedACOS < 9999 &&
           appliedACOS > 0.35 &&
           currentBid > 0.2;
  });

  const totalRecords = data.length;

  const agencyUnderbiddingData = [
    { 
      title: 'Agency Underbidding #1 (Low Bid need Human Loop)', 
      count: agencyUnderbidding1.length, 
      percentage: totalRecords > 0 ? ((agencyUnderbidding1.length / totalRecords) * 100).toFixed(2) : '0.00',
      color: 'bg-green-500' 
    }
  ];

  const agencyOverbiddingData = [
    { 
      title: 'Agency Overbidding #1 (ACOS Greater than Target ACOS)', 
      count: agencyOverbidding1.length, 
      percentage: totalRecords > 0 ? ((agencyOverbidding1.length / totalRecords) * 100).toFixed(2) : '0.00',
      color: 'bg-red-500' 
    },
    { 
      title: 'Agency Overbidding #2 (High Spends without sales)', 
      count: agencyOverbidding2.length, 
      percentage: totalRecords > 0 ? ((agencyOverbidding2.length / totalRecords) * 100).toFixed(2) : '0.00',
      color: 'bg-orange-500' 
    },
    { 
      title: 'Agency Overbidding #3 (ACOS >35% Need Human Loop)', 
      count: agencyOverbidding3.length, 
      percentage: totalRecords > 0 ? ((agencyOverbidding3.length / totalRecords) * 100).toFixed(2) : '0.00',
      color: 'bg-purple-500' 
    }
  ];

  return (
    <Card className="shadow-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Agency Bids RCA
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Total Records: {totalRecords}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agency Overbidding Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-foreground">Agency Overbidding:</h4>
            </div>
            
            <div className="space-y-3">
              {agencyOverbiddingData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => {
                    const filterType = index === 0 ? 'agency_overbidding_1' : 
                                     index === 1 ? 'agency_overbidding_2' : 'agency_overbidding_3';
                    navigateToSimulation(filterType);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{getOverbiddingDescription(index)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">({item.percentage}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agency Underbidding Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <h4 className="font-medium text-foreground">Agency Underbidding:</h4>
            </div>
            
            <div className="space-y-3">
              {agencyUnderbiddingData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigateToSimulation('agency_underbidding_1')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Low Bid need Human Loop</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">({item.percentage}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default AgencyBidAnalysisWidget;