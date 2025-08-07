import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CsvUpload = () => {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          CSV Upload
        </h1>
        <p className="text-muted-foreground">
          Upload and manage your CSV data files
        </p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file to upload and process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="file" 
              accept=".csv"
              className="cursor-pointer"
            />
            <Button>Upload File</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>
              Your recently uploaded CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No files uploaded yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CsvUpload