import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const RcaAnalysisWidget = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>RCA Analysis Widget</CardTitle>
        <CardDescription>
          Root Cause Analysis component for detailed insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Primary Causes</h4>
              <div className="text-2xl font-bold text-primary">0</div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Secondary Causes</h4>
              <div className="text-2xl font-bold text-secondary">0</div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Analysis Status</h4>
            <p className="text-sm text-muted-foreground">
              No analysis data available
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default RcaAnalysisWidget