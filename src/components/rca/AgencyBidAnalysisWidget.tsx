import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AgencyBidAnalysisWidgetProps {
  data: any[];
}

const AgencyBidAnalysisWidget = ({ data }: AgencyBidAnalysisWidgetProps) => {
  
  const getOverbiddingDescription = (index: number) => {
    const descriptions = [
      'ACOS Greater than Global ACOS',
      'High ACOS without sales', 
      'ACOS >35% Need Human Loop'
    ];
    return descriptions[index] || '';
  };
  // Debug: Log the data structure
  console.log('Agency Widget - CSV Data:', data);
  console.log('Agency Widget - Sample record:', data[0]);
  
  // Calculate Agency Underbidding
  const agencyUnderbidding1 = data.filter(row => {
    const syncStatus = row['Sync Status']?.toString().toLowerCase() === 'false';
    const appliedACOS = parseFloat(row['Applied ACOS']) || 0;
    const adSpend = parseFloat(row['Ad Spend']) || 0;
    const tosPercent = parseFloat(row['TOS%']) || 0;
    const minSuggestedBid = parseFloat(row['Min. Suggested Bid']) || 0;
    const currentBid = parseFloat(row['Current Bid']) || 0;
    
    return syncStatus &&
           appliedACOS === 9999 &&
           adSpend === 0 &&
           tosPercent <= 0 &&
           minSuggestedBid > currentBid;
  });

  // Calculate Agency Overbidding
  const agencyOverbidding1 = data.filter(row => {
    const syncStatus = row['Sync Status']?.toString().toLowerCase() === 'false';
    const appliedACOS = parseFloat(row['Applied ACOS']) || 0;
    const targetACOS = parseFloat(row['Target ACOS']) || 0;
    const currentBid = parseFloat(row['Current Bid']) || 0;
    
    return syncStatus &&
           appliedACOS < 9999 &&
           appliedACOS < targetACOS &&
           currentBid > 0.2;
  });

  const agencyOverbidding2 = data.filter(row => {
    const syncStatus = row['Sync Status']?.toString().toLowerCase() === 'false';
    const appliedACOS = parseFloat(row['Applied ACOS']) || 0;
    const adSpend = parseFloat(row['Ad Spend']) || 0;
    const targetACOS = parseFloat(row['Target ACOS']) || 0;
    const price = parseFloat(row['Price']) || 0;
    const currentBid = parseFloat(row['Current Bid']) || 0;
    
    return syncStatus &&
           appliedACOS === 9999 &&
           adSpend > (targetACOS * price) &&
           currentBid > 0.2;
  });

  const agencyOverbidding3 = data.filter(row => {
    const syncStatus = row['Sync Status']?.toString().toLowerCase() === 'false';
    const appliedACOS = parseFloat(row['Applied ACOS']) || 0;
    const currentBid = parseFloat(row['Current Bid']) || 0;
    
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
      title: 'Agency Overbidding #1 (ACOS Greater than Global ACOS)', 
      count: agencyOverbidding1.length, 
      percentage: totalRecords > 0 ? ((agencyOverbidding1.length / totalRecords) * 100).toFixed(2) : '0.00',
      color: 'bg-red-500' 
    },
    { 
      title: 'Agency Overbidding #2 (High ACOS without sales)', 
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
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
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
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
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
        </div>

      </CardContent>
    </Card>
  );
};

export default AgencyBidAnalysisWidget;