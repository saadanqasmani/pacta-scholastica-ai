DO $$
DECLARE
  koc uuid := '9543ac7a-88d2-4ef4-b842-dee2fa0a1a43';
  bilkent uuid := '34a80406-4225-4800-952c-4508da61acc8';

  koc_eng uuid; koc_econ uuid; koc_arts uuid;
  bil_eng uuid; bil_econ uuid; bil_arts uuid;
BEGIN
  -- -----------------------------
  -- Faculties (Demo set)
  -- -----------------------------
  INSERT INTO public.faculties (university_id, name)
  SELECT koc, 'Engineering'
  WHERE NOT EXISTS (SELECT 1 FROM public.faculties WHERE university_id = koc AND name = 'Engineering');

  INSERT INTO public.faculties (university_id, name)
  SELECT koc, 'Economics and Administrative Sciences'
  WHERE NOT EXISTS (SELECT 1 FROM public.faculties WHERE university_id = koc AND name = 'Economics and Administrative Sciences');

  INSERT INTO public.faculties (university_id, name)
  SELECT koc, 'Arts and Design'
  WHERE NOT EXISTS (SELECT 1 FROM public.faculties WHERE university_id = koc AND name = 'Arts and Design');

  INSERT INTO public.faculties (university_id, name)
  SELECT bilkent, 'Engineering'
  WHERE NOT EXISTS (SELECT 1 FROM public.faculties WHERE university_id = bilkent AND name = 'Engineering');

  INSERT INTO public.faculties (university_id, name)
  SELECT bilkent, 'Economics and Administrative Sciences'
  WHERE NOT EXISTS (SELECT 1 FROM public.faculties WHERE university_id = bilkent AND name = 'Economics and Administrative Sciences');

  INSERT INTO public.faculties (university_id, name)
  SELECT bilkent, 'Arts and Design'
  WHERE NOT EXISTS (SELECT 1 FROM public.faculties WHERE university_id = bilkent AND name = 'Arts and Design');

  SELECT id INTO koc_eng FROM public.faculties WHERE university_id = koc AND name = 'Engineering' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO koc_econ FROM public.faculties WHERE university_id = koc AND name = 'Economics and Administrative Sciences' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO koc_arts FROM public.faculties WHERE university_id = koc AND name = 'Arts and Design' ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO bil_eng FROM public.faculties WHERE university_id = bilkent AND name = 'Engineering' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO bil_econ FROM public.faculties WHERE university_id = bilkent AND name = 'Economics and Administrative Sciences' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO bil_arts FROM public.faculties WHERE university_id = bilkent AND name = 'Arts and Design' ORDER BY created_at DESC LIMIT 1;

  -- -----------------------------
  -- Departments (2 per faculty)
  -- -----------------------------
  -- Koç
  INSERT INTO public.departments (faculty_id, name)
  SELECT koc_eng, 'Civil Engineering'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = koc_eng AND name = 'Civil Engineering');

  INSERT INTO public.departments (faculty_id, name)
  SELECT koc_eng, 'Computer Engineering'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = koc_eng AND name = 'Computer Engineering');

  INSERT INTO public.departments (faculty_id, name)
  SELECT koc_econ, 'Economics'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = koc_econ AND name = 'Economics');

  INSERT INTO public.departments (faculty_id, name)
  SELECT koc_econ, 'Business Administration'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = koc_econ AND name = 'Business Administration');

  INSERT INTO public.departments (faculty_id, name)
  SELECT koc_arts, 'Media and Visual Arts'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = koc_arts AND name = 'Media and Visual Arts');

  INSERT INTO public.departments (faculty_id, name)
  SELECT koc_arts, 'Industrial Design'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = koc_arts AND name = 'Industrial Design');

  -- Bilkent
  INSERT INTO public.departments (faculty_id, name)
  SELECT bil_eng, 'Civil Engineering'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = bil_eng AND name = 'Civil Engineering');

  INSERT INTO public.departments (faculty_id, name)
  SELECT bil_eng, 'Computer Engineering'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = bil_eng AND name = 'Computer Engineering');

  INSERT INTO public.departments (faculty_id, name)
  SELECT bil_econ, 'Economics'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = bil_econ AND name = 'Economics');

  INSERT INTO public.departments (faculty_id, name)
  SELECT bil_econ, 'Business Administration'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = bil_econ AND name = 'Business Administration');

  INSERT INTO public.departments (faculty_id, name)
  SELECT bil_arts, 'Media and Visual Arts'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = bil_arts AND name = 'Media and Visual Arts');

  INSERT INTO public.departments (faculty_id, name)
  SELECT bil_arts, 'Industrial Design'
  WHERE NOT EXISTS (SELECT 1 FROM public.departments WHERE faculty_id = bil_arts AND name = 'Industrial Design');

  -- -----------------------------
  -- Courses (>=5 per department, with descriptions)
  -- -----------------------------
  -- Koç | Civil Engineering
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CE101', 'Engineering Mechanics I (Statics)',
    'Core concepts: force systems, equilibrium of particles and rigid bodies, trusses, frames, internal forces, friction. Typical assessments include problem sets and design-style statics problems.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CE101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CE201', 'Structural Analysis I',
    'Analysis of determinate/indeterminate structures: influence lines, virtual work, force method, displacement method basics, stability, load paths. Emphasis on modeling and interpreting results.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CE201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CE221', 'Soil Mechanics',
    'Soil classification, effective stress, consolidation, shear strength, permeability, slope stability, bearing capacity. Includes lab-style interpretation and geotechnical problem solving.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CE221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CE231', 'Hydraulics and Open Channel Flow',
    'Fluid properties, hydrostatics, Bernoulli equation, pipe flow, pumps, open-channel flow fundamentals, energy losses, hydraulic structures overview.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CE231');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CE311', 'Reinforced Concrete Design',
    'Behavior and design of reinforced concrete members: flexure, shear, serviceability, detailing, basic code concepts, load combinations, durability. Focus on design calculations and detailing decisions.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CE311');

  -- Koç | Computer Engineering
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CENG101', 'Programming I',
    'Structured programming with problem solving: variables, control flow, functions, arrays, debugging, testing. Includes weekly labs and programming assignments.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CENG101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CENG201', 'Data Structures',
    'Abstract data types, lists, stacks, queues, trees, hash tables, complexity analysis, implementation in a high-level language, performance tradeoffs.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CENG201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CENG301', 'Algorithms',
    'Design and analysis of algorithms: greedy, divide-and-conquer, dynamic programming, graph algorithms, NP-completeness basics. Emphasis on proofs and complexity.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CENG301');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CENG311', 'Database Systems',
    'Relational model, SQL, normalization, transactions, indexing, query planning, basic NoSQL concepts. Includes hands-on schema design and query projects.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CENG311');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'CENG321', 'Operating Systems',
    'Processes/threads, scheduling, synchronization, memory management, file systems, virtualization basics. Includes programming assignments implementing OS concepts.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'CENG321');

  -- Koç | Economics
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ECON101', 'Principles of Microeconomics',
    'Consumer/producer theory, market equilibrium, elasticity, welfare analysis, market structures, externalities. Uses graphs/models to analyze decisions.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ECON101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ECON102', 'Principles of Macroeconomics',
    'National income accounting, inflation, unemployment, monetary/fiscal policy, growth, open economy basics. Interprets macro indicators and policy tradeoffs.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ECON102');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ECON201', 'Intermediate Microeconomics',
    'Utility maximization, duality, production/cost, general equilibrium, game theory foundations, information basics. Strong analytical problem solving focus.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ECON201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ECON221', 'Econometrics I',
    'Linear regression, estimation/inference, hypothesis testing, model diagnostics, causal interpretation pitfalls. Uses software labs for applied work.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ECON221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ECON301', 'International Economics',
    'Trade theory, tariffs/quotas, exchange rates, balance of payments, open-economy macro interactions, policy debates. Includes case-based analysis.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ECON301');

  -- Koç | Business Administration
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'BA101', 'Introduction to Management',
    'Planning, organizing, leading, controlling; decision making; team dynamics; leadership basics. Case discussions and group projects.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'BA101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'BA111', 'Financial Accounting',
    'Financial statements, accrual accounting, revenue/expense recognition, basic ratio analysis. Emphasizes interpreting accounting information for decisions.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'BA111');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'BA201', 'Marketing Principles',
    'Segmentation, targeting, positioning, consumer behavior basics, marketing mix, branding, pricing, channels. Includes applied market analysis.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'BA201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'BA221', 'Corporate Finance',
    'Time value of money, valuation, risk/return, capital budgeting, cost of capital, capital structure fundamentals. Spreadsheet-based analysis.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'BA221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'BA301', 'Organizational Behavior',
    'Individual and group behavior, motivation, culture, leadership, conflict, change management. Applies behavioral theories to real organizational issues.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'BA301');

  -- Koç | Media and Visual Arts
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'MVA101', 'Visual Communication Fundamentals',
    'Composition, typography, color theory, layout systems, visual hierarchy. Studio exercises translating concepts into visual outcomes.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'MVA101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'MVA111', 'Digital Photography',
    'Camera operation, exposure, lighting basics, image composition, post-processing workflow. Portfolio-oriented assignments.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'MVA111');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'MVA201', 'Motion Graphics',
    'Time-based design, keyframes, transitions, kinetic typography, storytelling through motion. Projects using common motion design tools.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'MVA201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'MVA221', 'Interactive Media Design',
    'Human-centered design basics, interaction patterns, prototyping, usability testing, interface critique. Deliverables include interactive prototypes.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'MVA221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'MVA301', 'Visual Storytelling',
    'Narrative structure, storyboarding, pacing, visual metaphor, editing principles. Produces a short narrative project with critique sessions.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'MVA301');

  -- Koç | Industrial Design
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ID101', 'Design Studio I',
    'Design process introduction: problem framing, ideation, sketching, critique culture, basic prototyping. Studio-based with iterative feedback.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ID101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ID111', 'Materials and Manufacturing',
    'Materials properties, selection for design, manufacturing processes, tolerances, sustainability considerations. Includes material-driven design exercises.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ID111');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ID201', 'Computer-Aided Design (CAD)',
    '3D modeling fundamentals, assemblies, constraints, drawings, parametric design thinking. Produces manufacturable CAD deliverables.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ID201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ID221', 'Ergonomics and Human Factors',
    'Human capabilities/limitations, anthropometrics, usability, safety, inclusive design. Applies measurement and evaluation to product design decisions.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ID221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT koc, 'ID301', 'Product Design Studio',
    'Integrated product design project: research, concept development, prototyping, refinement, presentation. Emphasis on constraints and manufacturability.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = koc AND course_code = 'ID301');

  -- -----------------------------
  -- Bilkent University | Equivalent catalog
  -- -----------------------------
  -- Bilkent | Civil Engineering
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CE101', 'Statics for Civil Engineers',
    'Force equilibrium, moments, trusses, frames, friction and internal force diagrams. Emphasis on structural idealization and solving engineering statics problems.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CE101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CE202', 'Structural Analysis',
    'Indeterminate structures, displacement methods, virtual work/energy methods, influence lines. Focus on comparing solution approaches and interpreting responses.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CE202');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CE222', 'Geotechnical Engineering',
    'Effective stress, consolidation, shear strength, slope stability, shallow foundations. Uses case-style geotechnical problem setups and calculations.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CE222');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CE232', 'Hydraulics',
    'Pipe flow, energy losses, pumps, open channel flow basics, hydraulic modeling. Applies Bernoulli and momentum to engineering systems.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CE232');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CE312', 'Concrete Structures',
    'Reinforced concrete member behavior, flexure/shear design, detailing, serviceability, load combinations. Practical design computations and detailing considerations.',
    3, 6, 'Civil Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CE312');

  -- Bilkent | Computer Engineering
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CENG101', 'Introduction to Programming',
    'Programming basics: control flow, functions, arrays, debugging, testing. Weekly lab exercises build computational thinking.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CENG101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CENG202', 'Data Structures and Abstractions',
    'Lists, stacks, queues, trees, hashing, complexity, implementation tradeoffs. Emphasis on choosing the right structure for performance.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CENG202');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CENG302', 'Algorithm Design',
    'Greedy, DP, graph algorithms, complexity analysis, correctness reasoning, NP-completeness overview. Strong focus on analysis and problem patterns.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CENG302');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CENG312', 'Database Management Systems',
    'Relational databases, SQL, normalization, transactions, indexing, and query optimization concepts. Includes a schema + query project.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CENG312');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'CENG322', 'Operating Systems Concepts',
    'Concurrency, synchronization, memory, file systems, scheduling, and system call interfaces. Implementation-oriented assignments reinforce concepts.',
    3, 6, 'Computer Engineering', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'CENG322');

  -- Bilkent | Economics
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ECON101', 'Microeconomics',
    'Choice under scarcity, demand/supply, welfare, market structures, externalities. Analytical model-based problem solving.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ECON101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ECON102', 'Macroeconomics',
    'GDP, inflation, unemployment, growth, business cycles, policy tools, open economy basics. Interprets data and policy implications.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ECON102');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ECON201', 'Intermediate Micro Theory',
    'Consumer/firm theory, equilibrium, basic game theory, uncertainty and information. Strong mathematical/graphical reasoning practice.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ECON201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ECON221', 'Introductory Econometrics',
    'Regression, estimation, inference, diagnostics, causal interpretation, applied lab sessions. Uses software to run and interpret models.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ECON221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ECON301', 'International Trade and Finance',
    'Trade models, policy instruments, exchange rate regimes, balance of payments, open-economy macro. Combines theory with policy cases.',
    3, 6, 'Economics', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ECON301');

  -- Bilkent | Business Administration
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'BA101', 'Management and Organizations',
    'Organizing principles, leadership, decision making, teamwork, organizational structure. Case discussions and applied exercises.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'BA101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'BA111', 'Accounting Fundamentals',
    'Accounting cycle, financial statements, accruals, revenue/expense recognition, interpretation for business decisions.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'BA111');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'BA201', 'Marketing Management',
    'Marketing strategy, segmentation/targeting, branding, pricing, channels, integrated communications. Applied market analysis project.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'BA201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'BA221', 'Finance for Managers',
    'Discounted cash flow, valuation, risk-return, capital budgeting, cost of capital. Spreadsheet modeling and case problems.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'BA221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'BA301', 'Organizational Behavior',
    'Motivation, leadership, groups, culture, conflict and change management. Applies theory to organizational challenges.',
    3, 6, 'Business Administration', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'BA301');

  -- Bilkent | Media and Visual Arts
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'MVA101', 'Foundations of Visual Design',
    'Color, composition, typography, layout, visual systems. Studio practice translating design principles into artifacts.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'MVA101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'MVA111', 'Photography and Image Making',
    'Exposure, lighting, composition, editing workflows, critical viewing. Produces a photo series portfolio.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'MVA111');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'MVA201', 'Motion Design',
    'Animation principles, keyframing, transitions, kinetic typography, visual rhythm. Project-based motion pieces.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'MVA201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'MVA221', 'Interaction Design',
    'User needs, interaction patterns, prototyping, usability evaluation, interface critique. Delivers an interactive prototype with testing.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'MVA221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'MVA301', 'Narrative and Storyboarding',
    'Narrative structure, storyboards, pacing, editing logic, visual metaphor. Produces a storyboard-driven narrative project.',
    3, 6, 'Media and Visual Arts', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'MVA301');

  -- Bilkent | Industrial Design
  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ID101', 'Industrial Design Studio I',
    'Design process, ideation, sketching, critique, rapid prototyping. Studio-based iterative projects building core design skills.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ID101');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ID111', 'Materials and Processes',
    'Materials selection, manufacturing processes, tolerances, sustainability. Material-driven exercises and evaluation of design feasibility.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ID111');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ID201', '3D CAD and Modeling',
    'Parametric 3D modeling, assemblies, drawings, design intent. Produces CAD deliverables for a design concept.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ID201');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ID221', 'Human Factors in Design',
    'Anthropometrics, ergonomics, usability, safety, inclusive design. Evaluates product concepts with human-centered criteria.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ID221');

  INSERT INTO public.courses (university_id, course_code, course_name, description, credits, ects_credits, department, level)
  SELECT bilkent, 'ID301', 'Product Design Studio',
    'End-to-end product design project: research, concept development, prototyping, refinement, presentation. Emphasizes manufacturability and constraints.',
    3, 6, 'Industrial Design', 'undergraduate'
  WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE university_id = bilkent AND course_code = 'ID301');

END $$;