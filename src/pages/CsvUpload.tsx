import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, ArrowLeft, Trash2, Edit3, Calendar, HardDrive, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { useIndexedDbStorage } from '@/hooks/use-indexed-db-storage';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useCsvValidation } from '@/hooks/use-csv-validation';
import Papa from 'papaparse';

const CsvUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentNotes, setCurrentNotes] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { files, addFile, updateFile, deleteFile, isInitialized } = useIndexedDbStorage();
  const { activeFileId, setActiveFile, clearActiveFile } = useAppSettings();
  const { validateCsvColumns } = useCsvValidation();
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File select triggered");
    const file = event.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    console.log("File set to state:", file.name);
  }, [toast]);

  const handleSaveFile = useCallback(() => {
    console.log("Save file triggered, selectedFile:", selectedFile?.name);
    if (!selectedFile) {
      console.log("No file to save");
      return;
    }

    if (!isInitialized) {
      toast({
        title: "Database not ready",
        description: "Please wait for the database to initialize.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    Papa.parse(selectedFile, {
      complete: async (results) => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        setTimeout(async () => {
          const data = results.data as any[];
          const headers = data.length > 0 ? Object.keys(data[0]) : [];
          
          // Validate CSV columns
          const validation = validateCsvColumns(headers);
          
          try {
            const newFile = await addFile({
              name: selectedFile.name,
              notes: currentNotes.trim() || `Uploaded on ${new Date().toLocaleDateString()}`,
              data: data,
              headers: headers,
              size: selectedFile.size,
            });

            setIsLoading(false);
            setUploadProgress(0);
            setCurrentNotes('');
            setSelectedFile(null);
            
            toast({
              title: validation.isValid ? "File uploaded successfully" : "File uploaded with warnings",
              description: validation.isValid 
                ? `${selectedFile.name} has been processed with ${data.length} records.`
                : validation.missingColumns.length > 0 
                  ? `${selectedFile.name} uploaded but missing required columns: ${validation.missingColumns.join(', ')}. Please ensure your CSV includes all necessary columns for proper analysis.`
                  : `${selectedFile.name} uploaded but ${validation.message}`,
              variant: validation.isValid ? "default" : "destructive"
            });

            // Reset file input
            const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          } catch (error) {
            setIsLoading(false);
            setUploadProgress(0);
            toast({
              title: "Storage error",
              description: error instanceof Error ? error.message : "Failed to save file.",
              variant: "destructive"
            });
          }
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        setIsLoading(false);
        setUploadProgress(0);
        toast({
          title: "Error processing file",
          description: error.message,
          variant: "destructive"
        });
      },
      header: true,
      skipEmptyLines: true
    });
  }, [addFile, currentNotes, selectedFile, toast, isInitialized]);

  const handleEditNotes = useCallback((fileId: string, currentNotes: string) => {
    setEditingFile(fileId);
    setEditNotes(currentNotes);
  }, []);

  const handleSaveNotes = useCallback(async (fileId: string) => {
    try {
      await updateFile(fileId, { notes: editNotes.trim() || 'No notes' });
      setEditingFile(null);
      setEditNotes('');
      toast({
        title: "Notes updated",
        description: "File notes have been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error updating notes",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    }
  }, [updateFile, editNotes, toast]);

  const handleDeleteFile = useCallback(async (fileId: string, fileName: string) => {
    try {
      await deleteFile(fileId);
      if (activeFileId === fileId) {
        clearActiveFile();
      }
      toast({
        title: "File deleted",
        description: `${fileName} has been removed from your files.`
      });
    } catch (error) {
      toast({
        title: "Error deleting file",
        description: "Failed to delete file. Please try again.",
        variant: "destructive"
      });
    }
  }, [deleteFile, toast, activeFileId, clearActiveFile]);

  const handleProceedWithFile = useCallback((fileId: string, fileName: string) => {
    setActiveFile(fileId, fileName);
    toast({
      title: "File activated",
      description: `${fileName} is now selected for processing.`
    });
  }, [setActiveFile, toast]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/20">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm" className="shadow-card hover:shadow-elegant transition-all">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            File Manager
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload, manage, and organize your RCA reports with notes and easy access for analysis
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 shadow-card animate-slide-up">
          <CardContent className="space-y-4">
            {/* Notes Input */}
            <div className="space-y-2">
              <label htmlFor="file-notes" className="text-sm font-medium">
                File Notes (Optional)
              </label>
              <Textarea
                id="file-notes"
                placeholder="Add notes about this file (e.g., 'Amazon Q4 2024 campaign data', 'Test data for analysis'...)"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                disabled={isLoading}
                className="min-h-[40px]"
              />
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
                disabled={isLoading}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {selectedFile ? selectedFile.name.replace(/\.csv$/i, '') : "Drop your CSV file here or click to browse"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports large CSV files (using IndexedDB storage)
                    </p>
                  </div>
                  {!isLoading && !selectedFile && (
                    <Button 
                      size="lg" 
                      className="mt-2"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('csv-upload')?.click();
                      }}
                    >
                      Choose File
                    </Button>
                  )}
                </div>
              </label>
              
              {selectedFile && !isLoading && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-green-600 font-medium">
                    Selected: {selectedFile.name.replace(/\.csv$/i, '')}
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handleSaveFile} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Save File
                  </Button>
                </div>
              )}
              
              {isLoading && (
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Processing file...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Files Processed ({files.length})
            </CardTitle>
            <CardDescription>
              Manage your uploaded files and select them for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
                    <p className="text-muted-foreground">
                      Upload your first CSV file to get started with data analysis
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {files.map((file) => (
                   <Card key={file.id} className={`shadow-card hover:shadow-elegant transition-all ${activeFileId === file.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                     <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                              <h3 className="font-semibold text-lg truncate">{file.name.replace(/\.csv$/i, '')}</h3>
                              {activeFileId === file.id && (
                               <Badge variant="default" className="ml-2">
                                 <CheckCircle className="h-3 w-3 mr-1" />
                                 Active
                               </Badge>
                             )}
                           </div>
                           
                           <div className="flex flex-wrap gap-2 mb-3">
                             <Badge variant="secondary">
                               {file.data.length} records
                             </Badge>
                             <Badge variant="outline">
                               {formatFileSize(file.size)}
                             </Badge>
                             <Badge variant="outline" className="text-xs">
                               <Calendar className="h-3 w-3 mr-1" />
                               {formatDate(file.uploadDate)}
                             </Badge>
                             {(() => {
                               const validation = validateCsvColumns(file.headers);
                               return validation.isValid ? (
                                 <Badge variant="outline" className="text-green-600">
                                   <CheckCircle className="h-3 w-3 mr-1" />
                                   Valid columns
                                 </Badge>
                               ) : (
                                 <Badge variant="destructive" className="text-xs">
                                   <XCircle className="h-3 w-3 mr-1" />
                                   Missing columns
                                 </Badge>
                               );
                             })()}
                           </div>

                          {/* Notes Section */}
                          <div className="mb-4">
                            {editingFile === file.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Add notes about this file..."
                                  className="min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveNotes(file.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingFile(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <p className="text-sm text-muted-foreground flex-1">
                                  {file.notes}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditNotes(file.id, file.notes)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            onClick={() => handleProceedWithFile(file.id, file.name)}
                            className={`shadow-card hover:shadow-elegant ${activeFileId === file.id ? 'bg-primary text-primary-foreground' : ''}`}
                          >
                            {activeFileId === file.id ? 'Active' : 'Proceed'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFile(file.id, file.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CsvUpload;