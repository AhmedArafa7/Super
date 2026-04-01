'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLearningHubStore } from './learning-hub-store';

export function LearningSearchBar() {
  const { searchQuery, setSearchQuery } = useLearningHubStore();

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="ابحث في المواد..."
        className="pr-10 pl-10 h-10 bg-white/5 border-white/10 rounded-xl text-right text-sm placeholder:text-muted-foreground/60"
        dir="rtl"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground hover:text-white"
          onClick={() => setSearchQuery('')}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
