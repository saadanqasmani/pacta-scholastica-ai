import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { University } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

interface UniversityContextType {
  selectedUniversity: University | null;
  setSelectedUniversity: (university: University | null) => void;
  universities: University[];
  isLoading: boolean;
  /** Master accounts (the first account on an installation) can view the
   *  system as any university; university accounts are locked to their own. */
  isMaster: boolean;
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

export function UniversityProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  // Pre-RBAC accounts were created with role 'admin' — treat them as master.
  const isMaster = profile?.role === 'master' || profile?.role === 'admin' || !profile;
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUniversities() {
      try {
        const { data, error } = await supabase
          .from('universities')
          .select('*')
          .order('name');

        if (error) throw error;

        const typedData = (data || []) as University[];
        setUniversities(typedData);

        // Restore the last university the user was viewing (developer master
        // control: any university can be selected from the header and the
        // choice survives restarts). Falls back to İstanbul Nişantaşı
        // Üniversitesi as the primary institution.
        const NISANTASI_ID = '54dfc8d0-8e29-4ef8-ace4-147df5c9557d';
        // University accounts are pinned to their own institution.
        const own = profile?.university_id
          ? typedData.find(u => u.id === profile.university_id)
          : undefined;
        if (!isMaster && own) {
          setSelectedUniversity(own);
          return;
        }
        const savedId = localStorage.getItem('iris-selected-university');
        const saved = savedId ? typedData.find(u => u.id === savedId) : undefined;
        const nisantasi = typedData.find(u => u.id === NISANTASI_ID);
        setSelectedUniversity(own || saved || nisantasi || typedData[0] || null);
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUniversities();
  }, [profile?.university_id, profile?.role, isMaster]);

  const selectAndRemember = (university: University | null) => {
    if (!isMaster) return; // university accounts cannot switch institutions
    setSelectedUniversity(university);
    if (university) localStorage.setItem('iris-selected-university', university.id);
    else localStorage.removeItem('iris-selected-university');
  };

  return (
    <UniversityContext.Provider value={{ selectedUniversity, setSelectedUniversity: selectAndRemember, universities, isLoading, isMaster }}>
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (context === undefined) {
    throw new Error('useUniversity must be used within a UniversityProvider');
  }
  return context;
}
