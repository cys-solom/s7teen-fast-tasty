import React, { useState } from 'react';

interface StyledTableProps {
  headers: Array<{
    key: string;
    label: string;
    sortable?: boolean;
  }>;
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: boolean;
  itemsPerPage?: number;
}

const colorSchemes = {
  blue: {
    header: 'bg-blue-600 text-white',
    row: 'hover:bg-blue-50',
    evenRow: 'bg-blue-50',
    border: 'border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  green: {
    header: 'bg-green-600 text-white',
    row: 'hover:bg-green-50',
    evenRow: 'bg-green-50',
    border: 'border-green-200',
    button: 'bg-green-600 hover:bg-green-700 text-white'
  },
  purple: {
    header: 'bg-purple-600 text-white',
    row: 'hover:bg-purple-50',
    evenRow: 'bg-purple-50',
    border: 'border-purple-200',
    button: 'bg-purple-600 hover:bg-purple-700 text-white'
  },
  orange: {
    header: 'bg-orange-600 text-white',
    row: 'hover:bg-orange-50',
    evenRow: 'bg-orange-50',
    border: 'border-orange-200',
    button: 'bg-orange-600 hover:bg-orange-700 text-white'
  },
  red: {
    header: 'bg-red-600 text-white',
    row: 'hover:bg-red-50',
    evenRow: 'bg-red-50',
    border: 'border-red-200',
    button: 'bg-red-600 hover:bg-red-700 text-white'
  }
};

const StyledTable: React.FC<StyledTableProps> = ({
  headers,
  data,
  renderRow,
  colorScheme = 'blue',
  className = '',
  isLoading = false,
  emptyMessage = 'No data available',
  pagination = false,
  itemsPerPage = 10
}) => {
  const colors = colorSchemes[colorScheme];
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sort functionality
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Apply sorting
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);
  
  // Pagination
  const totalPages = pagination ? Math.ceil(sortedData.length / itemsPerPage) : 1;
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedData;
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  if (isLoading) {
    return (
      <div className="w-full p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  return (
    <div className={`w-full ${className}`}>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className={`min-w-full divide-y divide-gray-200 ${colors.border} border`}>
          <thead className={colors.header}>
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  className={`px-4 py-3 text-right text-sm font-medium uppercase tracking-wider ${header.sortable ? 'cursor-pointer' : ''}`}
                  onClick={header.sortable ? () => requestSort(header.key) : undefined}
                >
                  <div className="flex items-center justify-end">
                    {header.label}
                    {header.sortable && (
                      <span className="ml-1">
                        {sortConfig && sortConfig.key === header.key ? (
                          sortConfig.direction === 'ascending' ? '▲' : '▼'
                        ) : '⇅'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr 
                  key={index} 
                  className={`${colors.row} ${index % 2 === 1 ? colors.evenRow : ''} transition-colors duration-150 ease-in-out`}
                >
                  {renderRow(item, index)}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={headers.length} 
                  className="px-4 py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, sortedData.length)}
                </span>{' '}
                of <span className="font-medium">{sortedData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : colors.button} focus:z-20`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Calculate page numbers to show, centered around current page
                  let pageToShow: number;
                  if (totalPages <= 5) {
                    pageToShow = i + 1;
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i;
                  } else {
                    pageToShow = currentPage - 2 + i;
                  }
                  
                  if (pageToShow <= totalPages) {
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => handlePageChange(pageToShow)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === pageToShow 
                            ? `${colors.button} z-10` 
                            : 'text-gray-900 bg-white hover:bg-gray-50'
                        } focus:z-20`}
                      >
                        {pageToShow}
                      </button>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : colors.button} focus:z-20`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyledTable;