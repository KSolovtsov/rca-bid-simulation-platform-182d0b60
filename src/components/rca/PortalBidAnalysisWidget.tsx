import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface PortalBidAnalysisWidgetProps {
  data: any[];
}

const PortalBidAnalysisWidget = ({ data }: PortalBidAnalysisWidgetProps) => {
  // Debug: Log available columns
  React.useEffect(() => {
    if (data && data.length > 0) {
      console.log('=== PORTAL WIDGET DEBUG ===');
      console.log('Available columns:', Object.keys(data[0]));
      console.log('Total records:', data.length);
      console.log('Sample row data:', data[0]);
      
      // Check specific columns that we need
      const sampleRow = data[0];
      console.log('Key column values:');
      console.log('- Sync Status:', sampleRow['Sync Status'], typeof sampleRow['Sync Status']);
      console.log('- Applied ACOS:', sampleRow['Applied ACOS'], typeof sampleRow['Applied ACOS']);
      console.log('- Target ACOS:', sampleRow['Target ACOS'], typeof sampleRow['Target ACOS']);
      console.log('- Latest Bid Calculated by the System:', sampleRow['Latest Bid Calculated by the System']);
      console.log('- Ad Spend:', sampleRow['Ad Spend']);
      console.log('- Price:', sampleRow['Price']);
      console.log('- Min. Suggested Bid:', sampleRow['Min. Suggested Bid']);
      console.log('- Current Bid As displayed on Amazon Seller Central:', sampleRow['Current Bid As displayed on Amazon Seller Central']);
      console.log('=== END PORTAL DEBUG ===');
    }
  }, [data]);

  // Helper function to safely convert values to numbers
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

  // Calculate Portal Overbidding cases
  const portalOverbidding1 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedAcos = toNumber(row['Applied ACOS']);
    const targetAcos = toNumber(row['Target ACOS']);
    const latestBid = toNumber(row['Latest Bid Calculated by the System']);
    
    return syncStatus && 
           appliedAcos < 9999 && 
           appliedAcos > targetAcos && 
           latestBid > 0.02;
  });

  const portalOverbidding2 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedAcos = toNumber(row['Applied ACOS']);
    const adSpend = toNumber(row['Ad Spend']);
    const targetAcos = toNumber(row['Target ACOS']);
    const price = toNumber(row['Price']);
    const latestBid = toNumber(row['Latest Bid Calculated by the System']);
    
    return syncStatus && 
           appliedAcos === 9999 && 
           adSpend > (targetAcos * price) && 
           latestBid > 0.02;
  });

  // Calculate Portal Underbidding cases
  const portalUnderbidding1 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedAcos = toNumber(row['Applied ACOS']);
    const targetAcos = toNumber(row['Target ACOS']);
    const latestBid = toNumber(row['Latest Bid Calculated by the System']);
    
    return syncStatus && 
           appliedAcos < 9999 && 
           appliedAcos < targetAcos && 
           latestBid === 0.02;
  });

  const portalUnderbidding2 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedAcos = toNumber(row['Applied ACOS']);
    const adSpend = toNumber(row['Ad Spend']);
    const targetAcos = toNumber(row['Target ACOS']);
    const price = toNumber(row['Price']);
    const latestBid = toNumber(row['Latest Bid Calculated by the System']);
    
    return syncStatus && 
           appliedAcos === 9999 && 
           adSpend < (targetAcos * price) && 
           latestBid === 0.02;
  });

  const portalUnderbidding3 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const minSuggestedBid = toNumber(row['Min. Suggested Bid']);
    const latestBid = toNumber(row['Latest Bid Calculated by the System']);
    const adSpend = toNumber(row['Ad Spend']);
    
    return syncStatus && 
           minSuggestedBid > latestBid && 
           adSpend === 0;
  });

  const portalUnderbidding4 = data.filter(row => {
    const syncStatus = toBool(row['Sync Status']);
    const appliedAcos = toNumber(row['Applied ACOS']);
    const targetAcos = toNumber(row['Target ACOS']);
    const currentBidAmazon = toNumber(row['Current Bid As displayed on Amazon Seller Central']);
    const latestBid = toNumber(row['Latest Bid Calculated by the System']);
    const delta = currentBidAmazon - latestBid;
    
    return !syncStatus && 
           appliedAcos < targetAcos && 
           delta > 0.26;
  });

  const overbiddingCases = [
    { 
      type: 'Portal Overbidding #1', 
      count: portalOverbidding1.length, 
      description: 'Portal engineers Issues',
      color: 'bg-red-500' 
    },
    { 
      type: 'Portal Overbidding #2', 
      count: portalOverbidding2.length, 
      description: 'Portal engineers Issues',
      color: 'bg-orange-500' 
    }
  ];

  const underbiddingCases = [
    { 
      type: 'Portal Underbidding #1', 
      count: portalUnderbidding1.length, 
      description: 'Portal CVR Logic issue',
      color: 'bg-blue-500' 
    },
    { 
      type: 'Portal Underbidding #2', 
      count: portalUnderbidding2.length, 
      description: 'Portal CVR Logic issue',
      color: 'bg-indigo-500' 
    },
    { 
      type: 'Portal Underbidding #3', 
      count: portalUnderbidding3.length, 
      description: 'Portal Bid Limit, Expensive Bids need Human Loop',
      color: 'bg-purple-500' 
    },
    { 
      type: 'Portal Underbidding #4', 
      count: portalUnderbidding4.length, 
      description: 'Portal Bid Limit Expensive Bids need Human Loop',
      color: 'bg-pink-500' 
    }
  ];

  const totalRecords = data.length;
  const totalOverbidding = portalOverbidding1.length + portalOverbidding2.length;
  const totalUnderbidding = portalUnderbidding1.length + portalUnderbidding2.length + portalUnderbidding3.length + portalUnderbidding4.length;

  return (
    <Card className="shadow-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Portal Bids RCA
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Total Records: {totalRecords}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Portal Overbidding Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-foreground">Portal Overbidding:</h4>
            </div>
          
            <div className="space-y-3">
              {overbiddingCases.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">({totalRecords > 0 ? ((item.count / totalRecords) * 100).toFixed(1) : 0}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portal Underbidding Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <h4 className="font-medium text-foreground">Portal Underbidding:</h4>
            </div>
            
            <div className="space-y-3">
              {underbiddingCases.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center`}>
                      <TrendingDown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">{item.count}</p>
                    <p className="text-xs text-muted-foreground">({totalRecords > 0 ? ((item.count / totalRecords) * 100).toFixed(1) : 0}%)</p>
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

export default PortalBidAnalysisWidget;