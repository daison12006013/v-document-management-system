'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Calendar, FileType } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { debounce } from 'lodash';

export interface SearchFilters {
  query: string;
  type?: 'file' | 'folder';
  mimeType?: string;
  createdAfter?: string;
  createdBefore?: string;
  sizeMin?: number;
  sizeMax?: number;
}

interface FileSearchProps {
  onSearch: (filters: SearchFilters) => void;
  className?: string;
}

const FILE_TYPES = [
  { value: 'image/*', label: 'Images' },
  { value: 'application/pdf', label: 'PDF Documents' },
  { value: 'text/*', label: 'Text Files' },
  { value: 'application/vnd.ms-excel', label: 'Excel Files' },
  { value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel Files (xlsx)' },
  { value: 'application/msword', label: 'Word Documents' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'Word Documents (docx)' },
  { value: 'video/*', label: 'Videos' },
  { value: 'audio/*', label: 'Audio Files' },
];

const SIZE_RANGES = [
  { value: '0-1', label: 'Less than 1 MB', min: 0, max: 1024 * 1024 },
  { value: '1-10', label: '1 MB - 10 MB', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { value: '10-100', label: '10 MB - 100 MB', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
  { value: '100+', label: 'More than 100 MB', min: 100 * 1024 * 1024, max: undefined },
];

export const FileSearch = ({ onSearch, className }: FileSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({ query: '' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only render Radix UI components after client-side mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      onSearch(searchFilters);
    }, 300),
    [onSearch]
  );

  // Trigger search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => {
      // query must always be a string, never undefined
      if (key === 'query') {
        return {
          ...prev,
          query: value || '',
        };
      }
      // Other fields can be undefined
      return {
        ...prev,
        [key]: value || undefined,
      };
    });
  };

  const clearFilter = (key: keyof SearchFilters) => {
    setFilters(prev => {
      // query must always be a string, never deleted
      if (key === 'query') {
        return {
          ...prev,
          query: '',
        };
      }
      // Other fields can be deleted
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({ query: '' });
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key =>
      key !== 'query' && filters[key as keyof SearchFilters] !== undefined
    ).length;
  };

  const handleSizeRangeChange = (value: string) => {
    const range = SIZE_RANGES.find(r => r.value === value);
    if (range) {
      updateFilter('sizeMin', range.min);
      updateFilter('sizeMax', range.max);
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search files and folders..."
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
        </div>

        {isMounted ? (
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filters</h4>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              <Separator />

              {/* Type Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  Type
                </Label>
                {isMounted ? (
                  <Select
                    value={filters.type || ''}
                    onValueChange={(value) => updateFilter('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="file">Files only</SelectItem>
                      <SelectItem value="folder">Folders only</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    All types
                  </div>
                )}
              </div>

              {/* File Type Filter */}
              <div className="space-y-2">
                <Label>File Type</Label>
                {isMounted ? (
                  <Select
                    value={filters.mimeType || ''}
                    onValueChange={(value) => updateFilter('mimeType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All file types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All file types</SelectItem>
                      {FILE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    All file types
                  </div>
                )}
              </div>

              {/* Size Filter */}
              <div className="space-y-2">
                <Label>File Size</Label>
                {isMounted ? (
                  <Select onValueChange={handleSizeRangeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any size</SelectItem>
                      {SIZE_RANGES.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                    Any size
                  </div>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={filters.createdAfter || ''}
                      onChange={(e) => updateFilter('createdAfter', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={filters.createdBefore || ''}
                      onChange={(e) => updateFilter('createdBefore', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        ) : (
          <Button variant="outline" className="relative" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('type')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.mimeType && (
            <Badge variant="secondary" className="gap-1">
              File type: {FILE_TYPES.find(t => t.value === filters.mimeType)?.label || filters.mimeType}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('mimeType')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {(filters.sizeMin !== undefined || filters.sizeMax !== undefined) && (
            <Badge variant="secondary" className="gap-1">
              Size: {filters.sizeMin ? `${Math.round(filters.sizeMin / 1024 / 1024)}MB+` : ''}
              {filters.sizeMax ? ` - ${Math.round(filters.sizeMax / 1024 / 1024)}MB` : ''}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => {
                  clearFilter('sizeMin');
                  clearFilter('sizeMax');
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.createdAfter && (
            <Badge variant="secondary" className="gap-1">
              After: {new Date(filters.createdAfter).toISOString().split('T')[0]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('createdAfter')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.createdBefore && (
            <Badge variant="secondary" className="gap-1">
              Before: {new Date(filters.createdBefore).toISOString().split('T')[0]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => clearFilter('createdBefore')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
