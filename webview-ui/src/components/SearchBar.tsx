import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search entities or tables...' }: SearchBarProps) {
  return (
    <div className="relative flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-8"
      />
      {value && (
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onChange('')}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
