import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
  actions?: React.ReactNode;
  exportFileName?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchable = true,
  searchKeys,
  searchPlaceholder = 'Search records...',
  pageSize = 10,
  actions,
  exportFileName = 'export',
  onRowClick
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = item[k];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
        });
      }
      return Object.values(item).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // CSV Export
  const exportToCSV = () => {
    if (!data.length) return;
    const headers = columns.map((c) => c.header).join(',');
    const rows = filteredData.map((row) =>
      columns
        .map((c) => {
          let val = '';
          if (typeof c.accessor === 'function') {
            val = '';
          } else if (c.accessor) {
            val = String(row[c.accessor] ?? '');
          }
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
      {/* Top Bar: Search & Action Buttons */}
      <div className="p-3 border-b border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-50/70">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-md">
          {searchable && (
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="datatable-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="datatable-export-csv-btn"
            onClick={exportToCSV}
            title="Export filtered records to CSV"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>CSV</span>
          </button>
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/90 select-none">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-3.5 py-2.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-indigo-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-3.5 py-2.5 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? String(row[col.accessor] ?? '-')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-1.5">
                    <Filter className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                    <div className="text-xs font-semibold text-slate-600">No records found</div>
                    <div className="text-[11px] text-slate-400">Try changing your search query or filters</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-3.5 py-2.5 border-t border-slate-200/90 flex items-center justify-between text-xs text-slate-500 bg-slate-50/70">
        <div>
          Showing <span className="font-bold text-slate-800">{filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredData.length)}</span> of{' '}
          <span className="font-bold text-slate-800">{filteredData.length}</span> records
        </div>

        <div className="flex items-center gap-1">
          <button
            id="datatable-prev-page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            id="datatable-next-page-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

