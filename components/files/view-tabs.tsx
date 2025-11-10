'use client';

import { Button } from '@/components/ui/button';
import { Table, FolderTree as FolderTreeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'table' | 'tree';

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewTabs = ({ activeView, onViewChange }: ViewTabsProps) => {
  return (
    <div className="flex items-center gap-2 border-b">
      <Button
        variant="ghost"
        className={cn(
          "rounded-none border-b-2 border-transparent -mb-px",
          activeView === 'table' && "border-primary text-primary font-semibold"
        )}
        onClick={() => onViewChange('table')}
      >
        <Table className="h-4 w-4 mr-2" />
        Table View
      </Button>
      <Button
        variant="ghost"
        className={cn(
          "rounded-none border-b-2 border-transparent -mb-px",
          activeView === 'tree' && "border-primary text-primary font-semibold"
        )}
        onClick={() => onViewChange('tree')}
      >
        <FolderTreeIcon className="h-4 w-4 mr-2" />
        Folder Tree
      </Button>
    </div>
  );
};

