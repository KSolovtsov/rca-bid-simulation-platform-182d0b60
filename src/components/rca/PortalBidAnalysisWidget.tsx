import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortalBidAnalysisWidgetProps {
  data: any[];
}

const PortalBidAnalysisWidget = ({ data }: PortalBidAnalysisWidgetProps) => {
  // Mock data for now - will be replaced with actual calculations
  const overbiddingCases = [
    { type: 'Campaign Level CVR', count: 727, percentage: 38.2, level: 'Level 3', color: 'bg-orange-500' },
    { type: 'ASIN Level CVR', count: 198, percentage: 10.4, level: 'Level 4', color: 'bg-purple-500' },
    { type: 'Default CVR', count: 963, percentage: 50.6, level: 'Level 5', color: 'bg-pink-500' },
    { type: 'KW Level CVR', count: 7, percentage: 0.4, level: 'Level 2', color: 'bg-blue-500' },
    { type: 'ST Level CVR', count: 8, percentage: 0.4, level: 'Level 1', color: 'bg-blue-400' }
  ];

  const underbiddingCases = [
    { type: 'High Performance KW', count: 156, percentage: 8.2, level: 'Opportunity', color: 'bg-green-500' },
    { type: 'Low ACOS Targets', count: 89, percentage: 4.7, level: 'Potential', color: 'bg-emerald-500' },
    { type: 'Scaled Campaigns', count: 234, percentage: 12.3, level: 'Review', color: 'bg-teal-500' }
  ];

  const totalRecords = 1903;

  return (
    <Card className="shadow-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Portal RCA Bid Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          CVR calculation priority distribution across keyword levels
        </p>
        <p className="text-xs text-muted-foreground">
          Total Records: {totalRecords}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overbidding Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-red-500" />
            <h4 className="font-medium text-foreground">Overbidding:</h4>
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
                    <p className="text-xs text-muted-foreground">{item.level}</p>
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

        {/* Underbidding Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <h4 className="font-medium text-foreground">Underbidding:</h4>
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
                    <p className="text-xs text-muted-foreground">{item.level}</p>
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
      </CardContent>
    </Card>
  );
};

export default PortalBidAnalysisWidget;