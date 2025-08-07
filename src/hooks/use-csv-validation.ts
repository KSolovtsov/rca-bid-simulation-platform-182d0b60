export interface ValidationResult {
  isValid: boolean;
  missingColumns: string[];
  message: string;
}

// Required columns for bid analysis
const REQUIRED_COLUMNS = [
  'ASIN',
  'Search Term',
  'Campaign',
  'KW',
  'Match Type',
  'Sync Status',
  'Current Bid',
  'Latest Bid Calculated by the System',
  'Target ACOS',
  'Applied ACOS',
  'Clicks',
  'CVR',
  'Min. Suggested Bid',
  'Max. Suggested Bid'
];

export const useCsvValidation = () => {
  const validateCsvColumns = (headers: string[]): ValidationResult => {
    const normalizedHeaders = headers.map(h => h.trim());
    const missingColumns = REQUIRED_COLUMNS.filter(
      requiredCol => !normalizedHeaders.some(header => 
        header.toLowerCase().includes(requiredCol.toLowerCase()) ||
        requiredCol.toLowerCase().includes(header.toLowerCase())
      )
    );

    const isValid = missingColumns.length === 0;
    
    return {
      isValid,
      missingColumns,
      message: isValid 
        ? 'All required columns are present'
        : `Missing required columns: ${missingColumns.join(', ')}`
    };
  };

  return { validateCsvColumns, REQUIRED_COLUMNS };
};