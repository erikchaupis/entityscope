import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Loader2, PanelLeft, PanelLeftClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { PackageNav } from '@/components/PackageNav';
import { EntityGraph } from '@/components/EntityGraph';
import { DetailsPanel } from '@/components/DetailsPanel';
import { ToolbarActions } from '@/components/ToolbarActions';
import { useVsCodeApi, useExtensionMessages } from '@/hooks/useVsCodeApi';
import { useTheme, DEFAULT_THEME, applyTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import type { AppTheme, DomainModelJson } from '@/types';

export default function App() {
  const { postMessage } = useVsCodeApi();
  const [model, setModel] = useState<DomainModelJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [detailsEntity, setDetailsEntity] = useState<string | null>(null);
  const [packageFilter, setPackageFilter] = useState<string | null>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [showProperties, setShowProperties] = useState(true);
  const [packageSidebarOpen, setPackageSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);
  const themeManuallySet = useRef(false);

  useTheme(theme);

  useExtensionMessages(
    useCallback((message) => {
      switch (message.type) {
        case 'model':
          setModel(message.data);
          setLoading(false);
          setError(null);
          break;
        case 'selectEntity':
          setSelectedEntity(message.entityName);
          setDetailsEntity(null);
          break;
        case 'theme':
          if (!themeManuallySet.current) {
            setTheme(message.theme);
          }
          break;
        case 'error':
          setError(message.message);
          setLoading(false);
          break;
      }
    }, [])
  );

  const handleRefresh = () => {
    setLoading(true);
    postMessage({ type: 'refresh' });
  };

  const handleOpenSource = useCallback(
    (entityName: string) => {
      postMessage({ type: 'openEntity', entityName });
    },
    [postMessage]
  );

  const handleCopyName = useCallback((entityName: string) => {
    void navigator.clipboard.writeText(entityName);
  }, []);

  const handleCopyFqn = useCallback(
    (entityName: string) => {
      const entity = model?.entities.find((e) => e.name === entityName);
      if (!entity) {
        return;
      }
      const fqn = entity.package ? `${entity.package}.${entity.name}` : entity.name;
      void navigator.clipboard.writeText(fqn);
    },
    [model?.entities]
  );

  const handleTogglePackage = (pkg: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) {
        next.delete(pkg);
      } else {
        next.add(pkg);
      }
      return next;
    });
  };

  const handleFilterPackage = (pkg: string | null) => {
    setPackageFilter(pkg);
  };

  const handleSelectEntity = useCallback((name: string) => {
    setSelectedEntity(name);
  }, []);

  const handleShowDetails = useCallback((name: string) => {
    setSelectedEntity(name);
    setDetailsEntity(name);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsEntity(null);
  }, []);

  const handleToggleDetails = useCallback(() => {
    if (!selectedEntity) {
      return;
    }
    setDetailsEntity((current) => (current === selectedEntity ? null : selectedEntity));
  }, [selectedEntity]);

  const detailsEntityData = useMemo(
    () => model?.entities.find((e) => e.name === detailsEntity) ?? null,
    [model?.entities, detailsEntity]
  );

  const detailsOpen = detailsEntity !== null;

  const entityActions = useMemo(
    () => ({
      onShowDetails: handleShowDetails,
      onOpenSource: handleOpenSource,
      onCopyName: handleCopyName,
      onCopyFqn: handleCopyFqn,
    }),
    [handleShowDetails, handleOpenSource, handleCopyName, handleCopyFqn]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedEntity) {
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleOpenSource(selectedEntity);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleShowDetails(selectedEntity);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEntity, handleOpenSource, handleShowDetails]);

  if (loading && !model) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Scanning JPA entities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col ui-sans">
      <div className="flex items-center border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 ml-1"
          onClick={() => setPackageSidebarOpen((open) => !open)}
          title={packageSidebarOpen ? 'Hide packages panel' : 'Show packages panel'}
          aria-label={packageSidebarOpen ? 'Hide packages panel' : 'Show packages panel'}
          aria-expanded={packageSidebarOpen}
        >
          {packageSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1 min-w-0">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <ToolbarActions
          showProperties={showProperties}
          onToggleProperties={() => setShowProperties((v) => !v)}
          theme={theme}
          onThemeChange={(next) => {
            themeManuallySet.current = true;
            applyTheme(next);
            setTheme(next);
          }}
          onRefresh={handleRefresh}
          entityCount={model?.entities.length}
          detailsOpen={detailsOpen}
          canShowDetails={selectedEntity !== null}
          onToggleDetails={handleToggleDetails}
        />
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {model && (
          <aside
            aria-hidden={!packageSidebarOpen}
            className={cn(
              'shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out border-r border-border bg-card',
              packageSidebarOpen ? 'w-52' : 'w-0 border-transparent'
            )}
          >
            <div className="w-52 h-full min-h-0 flex flex-col">
              <PackageNav
                entities={model.entities}
                expandedPackages={expandedPackages}
                selectedPackage={packageFilter}
                onTogglePackage={handleTogglePackage}
                onFocusPackage={handleFilterPackage}
                onSelectEntity={handleSelectEntity}
                selectedEntity={selectedEntity}
              />
            </div>
          </aside>
        )}

        <div className="flex flex-1 min-w-0 min-h-0 relative">
          {!packageSidebarOpen && (
            <button
              type="button"
              className="absolute left-0 top-1/2 z-20 flex h-14 w-[18px] -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground transition-colors"
              onClick={() => setPackageSidebarOpen(true)}
              title="Show packages"
              aria-label="Show packages"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {model && (
            <EntityGraph
              entities={model.entities}
              relations={model.relations}
              selectedEntity={selectedEntity}
              searchQuery={searchQuery}
              packageFilter={packageFilter}
              showProperties={showProperties}
              onSelectEntity={handleSelectEntity}
              entityActions={entityActions}
            />
          )}

          {detailsEntityData && (
            <DetailsPanel
              entity={detailsEntityData}
              relations={model?.relations ?? []}
              onClose={handleCloseDetails}
              onOpenSource={handleOpenSource}
              onSelectEntity={handleShowDetails}
            />
          )}
        </div>
      </div>
    </div>
  );
}
