import { useState, useCallback } from 'react';

export interface CsvFile {
  id: string;
  name: string;
  notes: string;
  uploadDate: string;
  data: any[];
  headers: string[];
  size: number;
}

const CSV_STORAGE_KEY = 'rca-csv-files';

export const useCsvStorage = () => {
  const [files, setFiles] = useState<CsvFile[]>(() => {
    try {
      const stored = localStorage.getItem(CSV_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToStorage = useCallback((newFiles: CsvFile[]) => {
    try {
      const dataSize = JSON.stringify(newFiles).length;
      const maxSize = 5 * 1024 * 1024; // 5MB limit for localStorage
      
      if (dataSize > maxSize) {
        throw new Error('File too large for storage. Please use smaller files (under 5MB total).');
      }
      
      localStorage.setItem(CSV_STORAGE_KEY, JSON.stringify(newFiles));
      setFiles(newFiles);
    } catch (error) {
      console.error('Failed to save files to storage:', error);
      throw error; // Re-throw to handle in UI
    }
  }, []);

  const addFile = useCallback((file: Omit<CsvFile, 'id' | 'uploadDate'>) => {
    const newFile: CsvFile = {
      ...file,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString(),
    };
    const updatedFiles = [...files, newFile];
    
    try {
      saveToStorage(updatedFiles);
      return newFile;
    } catch (error) {
      throw error; // Re-throw to handle in UI
    }
  }, [files, saveToStorage]);

  const updateFile = useCallback((id: string, updates: Partial<CsvFile>) => {
    const updatedFiles = files.map(file => 
      file.id === id ? { ...file, ...updates } : file
    );
    saveToStorage(updatedFiles);
  }, [files, saveToStorage]);

  const deleteFile = useCallback((id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    saveToStorage(updatedFiles);
  }, [files, saveToStorage]);

  const getFile = useCallback((id: string) => {
    return files.find(file => file.id === id);
  }, [files]);

  const clearAllFiles = useCallback(() => {
    localStorage.removeItem(CSV_STORAGE_KEY);
    setFiles([]);
  }, []);

  return {
    files,
    addFile,
    updateFile,
    deleteFile,
    getFile,
    clearAllFiles,
  };
};