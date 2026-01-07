import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { University } from '@/types/database';

interface UniversityContextType {
  selectedUniversity: University | null;
  setSelectedUniversity: (university: University | null) => void;
  universities: University[];
  isLoading: boolean;
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

export function UniversityProvider({ children }: { children: ReactNode }) {
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
        
        // Set default university (Koç University)
        const defaultUniversity = typedData.find(u => u.name === 'Koç University');
        if (defaultUniversity) {
          setSelectedUniversity(defaultUniversity);
        } else if (typedData.length > 0) {
          setSelectedUniversity(typedData[0]);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUniversities();
  }, []);

  return (
    <UniversityContext.Provider value={{ selectedUniversity, setSelectedUniversity, universities, isLoading }}>
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
