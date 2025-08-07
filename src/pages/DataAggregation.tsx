import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DataAggregation = () => {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Data Aggregation
        </h1>
        <p className="text-muted-foreground">
          Aggregate and analyze your data
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
            <CardDescription>
              Overview of your aggregated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Records:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Processed:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-medium text-destructive">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              Current data processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No active processing</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DataAggregation