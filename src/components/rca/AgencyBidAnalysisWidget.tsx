import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AgencyBidAnalysisWidgetProps {
  data: any[];
}

const AgencyBidAnalysisWidget = ({ data }: AgencyBidAnalysisWidgetProps) => {
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
        <p className="text-sm text-muted-foreground">
          Total Records: {totalRecords}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Agency Underbidding */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📉</span>
              <h4 className="font-medium text-sm text-green-600">Agency Underbidding:</h4>
            </div>
            
            <div className="space-y-2">
              {agencyUnderbiddingData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col p-3 rounded border border-green-200 bg-green-50/50 hover:bg-green-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-xs font-medium text-foreground">{item.title}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-bold text-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agency Overbidding */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📈</span>
              <h4 className="font-medium text-sm text-red-600">Agency Overbidding:</h4>
            </div>
            
            <div className="space-y-2">
              {agencyOverbiddingData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col p-3 rounded border border-red-200 bg-red-50/50 hover:bg-red-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-xs font-medium text-foreground">{item.title}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-bold text-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">({item.percentage}%)</span>
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