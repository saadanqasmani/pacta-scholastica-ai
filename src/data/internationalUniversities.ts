// Real international universities (public data, approximate as of 2025) used
// as the partner network for the IRIS desktop demo dataset. Profile fields
// follow the same University shape as the Turkish registry.
import type { University } from '@/types/database';

const T = '2026-01-01T00:00:00Z';

const u = (
  id: string,
  name: string,
  country: string,
  region: string,
  type: 'public' | 'private',
  size: 'small' | 'medium' | 'large',
  maturity: 'low' | 'medium' | 'high',
  founded: number,
  website: string,
  strengths: string[]
): University => ({
  id,
  name,
  country,
  region,
  type,
  size,
  internationalization_maturity: maturity,
  educational_union: 'Erasmus+',
  journals: [],
  research_strengths: strengths,
  accreditations: [],
  founded_year: founded,
  website,
  created_at: T,
  updated_at: T,
});

export const INTERNATIONAL_UNIVERSITIES: University[] = [
  u('int-tum', 'Technical University of Munich', 'Germany', 'Europe', 'public', 'large', 'high', 1868, 'https://www.tum.de', ['Engineering', 'Computer Science', 'Natural Sciences']),
  u('int-heidelberg', 'Heidelberg University', 'Germany', 'Europe', 'public', 'medium', 'high', 1386, 'https://www.uni-heidelberg.de', ['Medicine', 'Life Sciences', 'Physics']),
  u('int-bologna', 'University of Bologna', 'Italy', 'Europe', 'public', 'large', 'high', 1088, 'https://www.unibo.it', ['Law', 'Humanities', 'Engineering']),
  u('int-polimi', 'Politecnico di Milano', 'Italy', 'Europe', 'public', 'large', 'high', 1863, 'https://www.polimi.it', ['Engineering', 'Architecture', 'Design']),
  u('int-sorbonne', 'Sorbonne University', 'France', 'Europe', 'public', 'large', 'high', 1257, 'https://www.sorbonne-universite.fr', ['Humanities', 'Medicine', 'Sciences']),
  u('int-charles', 'Charles University', 'Czech Republic', 'Europe', 'public', 'large', 'high', 1348, 'https://cuni.cz', ['Medicine', 'Law', 'Social Sciences']),
  u('int-warsaw', 'University of Warsaw', 'Poland', 'Europe', 'public', 'large', 'medium', 1816, 'https://www.uw.edu.pl', ['Social Sciences', 'Physics', 'Economics']),
  u('int-jagiellonian', 'Jagiellonian University', 'Poland', 'Europe', 'public', 'large', 'medium', 1364, 'https://www.uj.edu.pl', ['Medicine', 'Humanities', 'Chemistry']),
  u('int-vienna', 'University of Vienna', 'Austria', 'Europe', 'public', 'large', 'high', 1365, 'https://www.univie.ac.at', ['Social Sciences', 'Humanities', 'Life Sciences']),
  u('int-groningen', 'University of Groningen', 'Netherlands', 'Europe', 'public', 'large', 'high', 1614, 'https://www.rug.nl', ['Economics', 'Medicine', 'Engineering']),
  u('int-lisbon', 'University of Lisbon', 'Portugal', 'Europe', 'public', 'large', 'medium', 1911, 'https://www.ulisboa.pt', ['Engineering', 'Marine Sciences', 'Humanities']),
  u('int-barcelona', 'University of Barcelona', 'Spain', 'Europe', 'public', 'large', 'high', 1450, 'https://www.ub.edu', ['Medicine', 'Biology', 'Economics']),
  u('int-bucharest', 'University of Bucharest', 'Romania', 'Europe', 'public', 'large', 'medium', 1864, 'https://unibuc.ro', ['Social Sciences', 'Law', 'Computer Science']),
  u('int-sofia', 'Sofia University St. Kliment Ohridski', 'Bulgaria', 'Europe', 'public', 'medium', 'medium', 1888, 'https://www.uni-sofia.bg', ['Humanities', 'Physics', 'Law']),
  u('int-belgrade', 'University of Belgrade', 'Serbia', 'Europe', 'public', 'large', 'medium', 1808, 'https://www.bg.ac.rs', ['Engineering', 'Medicine', 'Agriculture']),
  u('int-sarajevo', 'University of Sarajevo', 'Bosnia and Herzegovina', 'Europe', 'public', 'medium', 'low', 1949, 'https://www.unsa.ba', ['Social Sciences', 'Engineering', 'Medicine']),
  u('int-tirana', 'University of Tirana', 'Albania', 'Europe', 'public', 'medium', 'low', 1957, 'https://unitir.edu.al', ['Economics', 'Law', 'Natural Sciences']),
  u('int-baku', 'Baku State University', 'Azerbaijan', 'Asia', 'public', 'medium', 'medium', 1919, 'https://bsu.edu.az', ['Physics', 'Oriental Studies', 'Law']),
  u('int-ada', 'ADA University', 'Azerbaijan', 'Asia', 'private', 'small', 'medium', 2006, 'https://www.ada.edu.az', ['International Relations', 'Business', 'Computer Science']),
  u('int-alfarabi', 'Al-Farabi Kazakh National University', 'Kazakhstan', 'Asia', 'public', 'large', 'medium', 1934, 'https://www.kaznu.kz', ['Natural Sciences', 'Economics', 'Oriental Studies']),
  u('int-nazarbayev', 'Nazarbayev University', 'Kazakhstan', 'Asia', 'public', 'small', 'high', 2010, 'https://nu.edu.kz', ['Engineering', 'Medicine', 'Public Policy']),
  u('int-tashkent', 'National University of Uzbekistan', 'Uzbekistan', 'Asia', 'public', 'large', 'low', 1918, 'https://nuu.uz', ['Natural Sciences', 'Mathematics', 'Philology']),
  u('int-cairo', 'Cairo University', 'Egypt', 'Middle East', 'public', 'large', 'medium', 1908, 'https://cu.edu.eg', ['Medicine', 'Engineering', 'Law']),
  u('int-jordan', 'University of Jordan', 'Jordan', 'Middle East', 'public', 'large', 'medium', 1962, 'https://www.ju.edu.jo', ['Medicine', 'Pharmacy', 'Humanities']),
  u('int-qatar', 'Qatar University', 'Qatar', 'Middle East', 'public', 'medium', 'medium', 1977, 'https://www.qu.edu.qa', ['Engineering', 'Business', 'Islamic Studies']),
  u('int-malaya', 'Universiti Malaya', 'Malaysia', 'Asia', 'public', 'large', 'high', 1905, 'https://www.um.edu.my', ['Medicine', 'Engineering', 'Computer Science']),
  u('int-indonesia', 'Universitas Indonesia', 'Indonesia', 'Asia', 'public', 'large', 'medium', 1849, 'https://www.ui.ac.id', ['Medicine', 'Social Sciences', 'Engineering']),
  u('int-lagos', 'University of Lagos', 'Nigeria', 'Africa', 'public', 'large', 'low', 1962, 'https://unilag.edu.ng', ['Engineering', 'Business', 'Law']),
];
