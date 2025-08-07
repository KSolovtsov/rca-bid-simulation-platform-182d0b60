import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'

export interface CsvData {
  headers: string[]
  rows: any[][]
  fileName: string
}

export function useCsvStorage() {
  const [csvData, setCsvData] = useState<CsvData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const parseCsv = useCallback((file: File): Promise<CsvData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error('CSV parsing failed'))
            return
          }
          
          const [headers, ...rows] = results.data as string[][]
          resolve({
            headers,
            rows,
            fileName: file.name
          })
        },
        error: reject
      })
    })
  }, [])

  const uploadCsv = useCallback(async (file: File) => {
    setIsLoading(true)
    try {
      const data = await parseCsv(file)
      setCsvData(data)
      toast.success(`CSV file "${file.name}" uploaded successfully`)
      return data
    } catch (error) {
      toast.error('Failed to upload CSV file')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [parseCsv])

  const clearCsv = useCallback(() => {
    setCsvData(null)
    toast.success('CSV data cleared')
  }, [])

  return {
    csvData,
    isLoading,
    uploadCsv,
    clearCsv
  }
}