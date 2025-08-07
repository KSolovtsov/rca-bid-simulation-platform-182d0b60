import { useState, useCallback, useEffect } from 'react';

export interface CsvFile {
  id: string;
  name: string;
  notes: string;
  uploadDate: string;
  data: any[];
  headers: string[];
  size: number;
}

const DB_NAME = 'csv-files-db';
const DB_VERSION = 1;
const STORE_NAME = 'csv-files';

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async addFile(file: CsvFile): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(file);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllFiles(): Promise<CsvFile[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateFile(id: string, updates: Partial<CsvFile>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const file = getRequest.result;
        if (file) {
          const updatedFile = { ...file, ...updates };
          const putRequest = store.put(updatedFile);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('File not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getFile(id: string): Promise<CsvFile | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

const dbStorage = new IndexedDBStorage();

export const useIndexedDbStorage = () => {
  const [files, setFiles] = useState<CsvFile[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await dbStorage.init();
        const allFiles = await dbStorage.getAllFiles();
        setFiles(allFiles);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };

    initDB();
  }, []);

  const addFile = useCallback(async (file: Omit<CsvFile, 'id' | 'uploadDate'>) => {
    const newFile: CsvFile = {
      ...file,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString(),
    };

    try {
      await dbStorage.addFile(newFile);
      setFiles(prev => [...prev, newFile]);
      return newFile;
    } catch (error) {
      console.error('Failed to add file:', error);
      throw error;
    }
  }, []);

  const updateFile = useCallback(async (id: string, updates: Partial<CsvFile>) => {
    try {
      await dbStorage.updateFile(id, updates);
      setFiles(prev => prev.map(file => 
        file.id === id ? { ...file, ...updates } : file
      ));
    } catch (error) {
      console.error('Failed to update file:', error);
      throw error;
    }
  }, []);

  const deleteFile = useCallback(async (id: string) => {
    try {
      await dbStorage.deleteFile(id);
      setFiles(prev => prev.filter(file => file.id !== id));
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }, []);

  const getFile = useCallback(async (id: string): Promise<CsvFile | null> => {
    try {
      return await dbStorage.getFile(id);
    } catch (error) {
      console.error('Failed to get file:', error);
      return null;
    }
  }, []);

  const clearAllFiles = useCallback(async () => {
    try {
      await dbStorage.clearAll();
      setFiles([]);
    } catch (error) {
      console.error('Failed to clear files:', error);
      throw error;
    }
  }, []);

  return {
    files,
    addFile,
    updateFile,
    deleteFile,
    getFile,
    clearAllFiles,
    isInitialized,
  };
};