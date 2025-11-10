'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  HardDrive,
  Cloud,
  Database,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Folder,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils/format';

interface StorageStats {
  totalUsed: number;
  totalLimit: number;
  byType: {
    documents: number;
    images: number;
    videos: number;
    audio: number;
    archives: number;
    others: number;
  };
  byUser?: {
    userId: string;
    userName: string;
    used: number;
  }[];
  fileCount: number;
  folderCount: number;
  storageDriver: 'local' | 's3' | 'r2';
  lastUpdated: string;
}

interface StorageStatsProps {
  stats?: StorageStats;
  isLoading?: boolean;
  className?: string;
}

export const StorageStats = ({ stats, isLoading = false, className }: StorageStatsProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getUsagePercentage = (): number => {
    if (!stats || stats.totalLimit === 0) return 0;
    return (stats.totalUsed / stats.totalLimit) * 100;
  };

  const getStorageIcon = (driver: string) => {
    switch (driver) {
      case 'local':
        return <HardDrive className="h-4 w-4" />;
      case 's3':
      case 'r2':
        return <Cloud className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'documents':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'images':
        return <Image className="h-4 w-4 text-green-500" />;
      case 'videos':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'audio':
        return <Music className="h-4 w-4 text-pink-500" />;
      case 'archives':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No storage statistics available
          </p>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = getUsagePercentage();
  const typeEntries = Object.entries(stats.byType).filter(([_, size]) => size > 0);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Statistics
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            {getStorageIcon(stats.storageDriver)}
            {stats.storageDriver.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Storage Used</span>
            <span className="text-sm text-muted-foreground">
              {formatFileSize(stats.totalUsed)} / {formatFileSize(stats.totalLimit)}
            </span>
          </div>
          <Progress
            value={usagePercentage}
            className="h-2"
            indicatorClassName={getUsageColor(usagePercentage)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{usagePercentage.toFixed(1)}% used</span>
            <span>{formatFileSize(stats.totalLimit - stats.totalUsed)} remaining</span>
          </div>
        </div>

        {/* File Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.fileCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Folder className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.folderCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Folders</p>
            </div>
          </div>
        </div>

        {/* Usage by File Type */}
        {typeEntries.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Usage by Type
            </h4>
            <div className="space-y-2">
              {typeEntries
                .sort(([, a], [, b]) => b - a)
                .map(([type, size]) => {
                  const percentage = (size / stats.totalUsed) * 100;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      {getTypeIcon(type)}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize">{type}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(size)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-1" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Top Users (if available) */}
        {stats.byUser && stats.byUser.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Top Users</h4>
            <div className="space-y-2">
              {stats.byUser
                .sort((a, b) => b.used - a.used)
                .slice(0, 5)
                .map((user) => {
                  const percentage = (user.used / stats.totalUsed) * 100;
                  return (
                    <div key={user.userId} className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1">{user.userName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(user.used)}
                        </span>
                        <div className="w-16">
                          <Progress value={percentage} className="h-1" />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};
