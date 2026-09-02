import { useState, useEffect, useCallback } from "react";
import { SLUG_TO_SIDEBAR, SIDEBAR_TO_SLUG } from "@/lib/routes";

export interface WorkspaceTab {
  id: string; // The sidebarId / activeTool ID (e.g. "json-formatter")
  lastAccessed: number;
}

const MAX_TABS = 5;
const STORAGE_KEY = "devscratchpad_workspace_tabs";

export function useWorkspaceTabs(initialSidebarId: string) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>(initialSidebarId);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WorkspaceTab[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          // If initial is set from URL, ensure it's in the tabs and active
          if (initialSidebarId) {
            setActiveTabId(initialSidebarId);
            if (!parsed.find(t => t.id === initialSidebarId)) {
              const newTabs = [{ id: initialSidebarId, lastAccessed: Date.now() }, ...parsed].slice(0, MAX_TABS);
              setTabs(newTabs);
            }
          } else {
            // Otherwise default to the most recently accessed tab
            const latest = [...parsed].sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
            setActiveTabId(latest.id);
          }
        } else {
          setTabs([{ id: initialSidebarId, lastAccessed: Date.now() }]);
        }
      } else {
        setTabs([{ id: initialSidebarId, lastAccessed: Date.now() }]);
      }
    } catch (e) {
      console.error("Failed to load workspace tabs", e);
      setTabs([{ id: initialSidebarId, lastAccessed: Date.now() }]);
    }
    setIsLoaded(true);
  }, []);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    }
  }, [tabs, isLoaded]);

  const openTab = useCallback((sidebarId: string) => {
    setActiveTabId(sidebarId);
    setTabs(prev => {
      const existing = prev.find(t => t.id === sidebarId);
      if (existing) {
        return prev.map(t => t.id === sidebarId ? { ...t, lastAccessed: Date.now() } : t);
      }
      
      const newTabs = [{ id: sidebarId, lastAccessed: Date.now() }, ...prev];
      // Keep only MAX_TABS, discarding the least recently used if we overflow
      if (newTabs.length > MAX_TABS) {
        newTabs.sort((a, b) => b.lastAccessed - a.lastAccessed);
        return newTabs.slice(0, MAX_TABS);
      }
      return newTabs;
    });
  }, []);

  const closeTab = useCallback((sidebarId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== sidebarId);
      // If we closed the active tab, fallback to the most recently used
      if (activeTabId === sidebarId && filtered.length > 0) {
        const latest = [...filtered].sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
        setActiveTabId(latest.id);
      } else if (filtered.length === 0) {
        // Don't allow closing the last tab, just reset it to default
        return [{ id: "json-formatter", lastAccessed: Date.now() }];
      }
      return filtered;
    });
    
    if (activeTabId === sidebarId && tabs.length > 1) {
       // fallback already handled in setTabs logic, but we need to trigger a router push in the UI component
    }
  }, [activeTabId, tabs]);

  return {
    tabs,
    activeTabId,
    isLoaded,
    openTab,
    closeTab,
  };
}
