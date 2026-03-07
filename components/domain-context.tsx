"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface Domain {
  id: string;
  domain: string;
  displayName: string;
  [key: string]: unknown;
}

interface DomainContextValue {
  selectedDomainId: string | null;
  setSelectedDomainId: (id: string) => void;
  domains: Domain[];
  loading: boolean;
}

const DomainContext = createContext<DomainContextValue>({
  selectedDomainId: null,
  setSelectedDomainId: () => {},
  domains: [],
  loading: true,
});

const STORAGE_KEY = "contentintel_selected_domain";

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainIdState] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const setSelectedDomainId = useCallback((id: string) => {
    setSelectedDomainIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    async function fetchDomains() {
      try {
        const res = await fetch("/api/domains");
        if (!res.ok) return;
        const data = await res.json();
        const list: Domain[] = data.domains ?? [];
        setDomains(list);

        // Restore from localStorage or default to first domain
        let stored: string | null = null;
        try {
          stored = localStorage.getItem(STORAGE_KEY);
        } catch {
          // localStorage unavailable
        }

        if (stored && list.some((d) => d.id === stored)) {
          setSelectedDomainIdState(stored);
        } else if (list.length > 0) {
          setSelectedDomainIdState(list[0].id);
          try {
            localStorage.setItem(STORAGE_KEY, list[0].id);
          } catch {
            // localStorage unavailable
          }
        }
      } catch {
        // fetch failed — domains stay empty
      } finally {
        setLoading(false);
      }
    }

    fetchDomains();
  }, []);

  return (
    <DomainContext.Provider
      value={{ selectedDomainId, setSelectedDomainId, domains, loading }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain() {
  return useContext(DomainContext);
}
