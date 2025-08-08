import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AgencyBidAnalysisWidgetProps {
  data: any[];
}

const AgencyBidAnalysisWidget = ({ data }: AgencyBidAnalysisWidgetProps) => {
  // Mock data for now - will be replaced with actual calculations
  const positiveValues = [
    { range: '0-0.25', count: 339, percentage: 17.81, color: 'bg-green-500' },
    { range: '0.25-0.5', count: 66, percentage: 3.47, color: 'bg-blue-500' },
    { range: '0.5-1.0', count: 311, percentage: 16.34, color: 'bg-orange-500' },
    { range: '1.0-1.5', count: 221, percentage: 11.61, color: 'bg-red-500' },
    { range: '1.5-2.0', count: 128, percentage: 6.73, color: 'bg-purple-500' },
    { range: '>2.0', count: 16, percentage: 0.84, color: 'bg-pink-500' }
  ];

  const negativeValues = [
    { range: '0 to -0.25', count: 367, percentage: 19.29, color: 'bg-green-600' },
    { range: '-0.25 to -0.5', count: 399, percentage: 20.97, color: 'bg-blue-600' },
    { range: '-0.5 to -1.0', count: 53, percentage: 2.79, color: 'bg-orange-600' },
    { range: '-1.0 to -1.5', count: 3, percentage: 0.16, color: 'bg-red-600' },
    { range: '-1.5 to -2.0', count: 0, percentage: 0.00, color: 'bg-purple-600' },
    { range: '<-2.0', count: 0, percentage: 0.00, color: 'bg-pink-600' }
  ];

  const totalRecords = 1903;

  return (
    <Card className="shadow-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Agency Bid Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total Records: {totalRecords}
        </p>
        <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-block">
          Agency vs Portal bid difference groups
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Positive Values */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <h4 className="font-medium text-sm text-green-600">Positive Values (&gt; 0)</h4>
            </div>
            
            <div className="space-y-2">
              {positiveValues.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded border border-green-200 bg-green-50/50 hover:bg-green-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-foreground">{item.range}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className="font-bold text-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Negative Values */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <h4 className="font-medium text-sm text-red-600">Negative Values (&lt; 0)</h4>
            </div>
            
            <div className="space-y-2">
              {negativeValues.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded border border-red-200 bg-red-50/50 hover:bg-red-100/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-foreground">{item.range}</span>
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

        {/* Overbidding and Underbidding sections */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <h4 className="font-medium text-foreground">Overbidding:</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              High positive delta cases requiring bid reduction review
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <h4 className="font-medium text-foreground">Underbidding:</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              High negative delta cases with bid increase opportunities
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgencyBidAnalysisWidget;