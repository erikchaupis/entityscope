import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Crosshair, ExternalLink, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityActionHandlers } from '@/lib/entityActions';

interface EntityContextMenuProps {
  entityName: string;
  fqn: string;
  actions: EntityActionHandlers;
  children: ReactNode;
}

interface MenuItem {
  label: string;
  icon: ReactNode;
  shortcut?: string;
  onClick: () => void;
  separatorBefore?: boolean;
}

export function EntityContextMenu({
  entityName,
  fqn,
  actions,
  children,
}: EntityContextMenuProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!position) {
      return;
    }
    const close = () => setPosition(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('blur', close);
    };
  }, [position]);

  const run = (fn: () => void) => {
    fn();
    setPosition(null);
  };

  const items: MenuItem[] = [
    {
      label: 'View details',
      icon: <PanelRight className="h-3.5 w-3.5" />,
      shortcut: 'Enter',
      onClick: () => actions.onShowDetails(entityName),
    },
    {
      label: 'Open source',
      icon: <ExternalLink className="h-3.5 w-3.5" />,
      shortcut: '⌘↵',
      onClick: () => actions.onOpenSource(entityName),
    },
    {
      label: 'Center in view',
      icon: <Crosshair className="h-3.5 w-3.5" />,
      separatorBefore: true,
      onClick: () => actions.onCenter(entityName),
    },
    {
      label: 'Copy name',
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: () => actions.onCopyName(entityName),
    },
    {
      label: 'Copy full name',
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: () => actions.onCopyFqn(entityName),
    },
  ];

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPosition({ x: e.clientX, y: e.clientY });
        }}
      >
        {children}
      </div>
      {position &&
        createPortal(
          <div
            className="ev-context-menu fixed z-[100] min-w-[200px] py-1"
            style={{ left: position.x, top: position.y }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {items.map((item) => (
              <div key={item.label}>
                {item.separatorBefore && (
                  <div className="my-1 border-t border-border" role="separator" />
                )}
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    'ev-context-menu-item w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm',
                    'text-foreground hover:bg-accent'
                  )}
                  onClick={() => run(item.onClick)}
                >
                  <span className="text-muted-foreground shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              </div>
            ))}
            <div className="mt-1 px-3 py-1 border-t border-border">
              <span className="text-[10px] text-muted-foreground font-mono truncate block" title={fqn}>
                {fqn}
              </span>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
