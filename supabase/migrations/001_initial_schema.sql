-- ============================================
-- Portfolio CMS Database Schema
-- Phase 2: Initial Schema
-- ============================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  year TEXT NOT NULL,
  description TEXT NOT NULL,
  tech TEXT[] DEFAULT '{}',
  github TEXT,
  demo TEXT,
  highlight TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level INTEGER DEFAULT 0 CHECK (level >= 0 AND level <= 100),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education table
CREATE TABLE IF NOT EXISTS education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  period TEXT NOT NULL,
  details TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experience table
CREATE TABLE IF NOT EXISTS experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  period TEXT NOT NULL,
  details TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site content table (for hero, about, footer, etc.)
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_status TEXT,
  about_text TEXT,
  about_paragraph1 TEXT,
  about_paragraph2 TEXT,
  about_paragraph3 TEXT,
  contact_intro TEXT,
  footer_text TEXT,
  seo_title TEXT,
  seo_description TEXT,
  resume_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social links table
CREATE TABLE IF NOT EXISTS socials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Existing appreciations table (keep for backwards compatibility)
CREATE TABLE IF NOT EXISTS appreciations (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE appreciations ENABLE ROW LEVEL SECURITY;

-- Grant SELECT to anon role (required for REST API access)
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.skills TO anon;
GRANT SELECT ON public.education TO anon;
GRANT SELECT ON public.experience TO anon;
GRANT SELECT ON public.certificates TO anon;
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.socials TO anon;
GRANT SELECT ON public.appreciations TO anon;
GRANT UPDATE ON public.appreciations TO anon;

-- Public read access policies for anon role
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_select_skills" ON skills;
DROP POLICY IF EXISTS "anon_select_education" ON education;
DROP POLICY IF EXISTS "anon_select_experience" ON experience;
DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
DROP POLICY IF EXISTS "anon_select_site_content" ON site_content;
DROP POLICY IF EXISTS "anon_select_socials" ON socials;
DROP POLICY IF EXISTS "anon_select_appreciations" ON appreciations;
DROP POLICY IF EXISTS "anon_update_appreciations" ON appreciations;

CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_skills" ON skills FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_education" ON education FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_experience" ON experience FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_site_content" ON site_content FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_socials" ON socials FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_appreciations" ON appreciations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_appreciations" ON appreciations FOR UPDATE TO anon USING (true);

-- ============================================
-- Initial seed data (sample)
-- ============================================

-- Insert sample project
INSERT INTO projects (title, year, description, tech, github, highlight, display_order) VALUES
('Q&A Chat Bot', '2026', 'Intelligent question-answering system that extracts text from PDFs and answers student queries using semantic search.', ARRAY['LangChain', 'HuggingFace', 'FAISS', 'Streamlit', 'Python'], 'https://github.com/asfiahamed0404', 'AI / RAG', 1),
('End-to-End Data Science Project', 'Ongoing', 'Complete machine learning lifecycle project covering data ingestion, preprocessing, model building, evaluation, and deployment.', ARRAY['Python', 'Scikit-learn', 'Pandas', 'MLflow'], NULL, 'Data Science', 2),
('React Movie App', '2025', 'Full-stack movie browsing platform with reviews, search, and responsive UI. Built with modern React patterns and API integration.', ARRAY['React', 'TypeScript', 'REST API', 'Tailwind'], 'https://github.com/asfiahamed0404', 'Full-Stack', 3),
('Healthcare-MediBridge', '2025', 'Healthcare API management platform built with Ballerina. Participated in the official Ballerina Competition 2025 as a team.', ARRAY['Ballerina', 'API Design', 'Backend'], 'https://github.com/asfiahamed0404', 'Backend', 4),
('Nano-processor Mini Project', '2025', 'Designed a functional microprocessor supporting addition, subtraction, and negative number handling. Simulated ALU and instruction execution.', ARRAY['Digital Logic', 'Computer Architecture', 'Verilog'], NULL, 'Hardware', 5)
ON CONFLICT DO NOTHING;

-- Insert skills
INSERT INTO skills (name, category, level, display_order) VALUES
-- Languages
('Python', 'Languages', 90, 1),
('Java', 'Languages', 75, 2),
('C++', 'Languages', 70, 3),
('JavaScript', 'Languages', 85, 4),
('TypeScript', 'Languages', 80, 5),
('HTML', 'Languages', 90, 6),
('CSS', 'Languages', 85, 7)
ON CONFLICT DO NOTHING;

INSERT INTO skills (name, category, level, display_order) VALUES
-- Frameworks & Tools
('React', 'Frameworks & Tools', 85, 1),
('FastAPI', 'Frameworks & Tools', 75, 2),
('Streamlit', 'Frameworks & Tools', 80, 3),
('LangChain', 'Frameworks & Tools', 70, 4),
('HuggingFace', 'Frameworks & Tools', 70, 5),
('Tailwind CSS', 'Frameworks & Tools', 90, 6)
ON CONFLICT DO NOTHING;

INSERT INTO skills (name, category, level, display_order) VALUES
-- Databases
('MySQL', 'Databases', 75, 1),
('MongoDB', 'Databases', 70, 2)
ON CONFLICT DO NOTHING;

INSERT INTO skills (name, category, level, display_order) VALUES
-- AI / ML
('RAG Systems', 'AI / ML', 75, 1),
('FAISS', 'AI / ML', 70, 2),
('Embeddings', 'AI / ML', 75, 3),
('Prompt Engineering', 'AI / ML', 80, 4),
('Scikit-learn', 'AI / ML', 75, 5)
ON CONFLICT DO NOTHING;

-- Insert education
INSERT INTO education (title, subtitle, period, details, display_order) VALUES
('B.Sc. (Hons) Computer Science & Engineering', 'University of Moratuwa', 'Jun 2024 – Present', ARRAY['Specializing in Data Science & Engineering (DSE)', 'Current CGPA: 3.45 / 4.00'], 1),
('G.C.E. Advanced Level', 'KM/Al-Ashraq National School, Nintavur', '2022', ARRAY['Combined Mathematics (A), Chemistry (A), Physics (A)', 'Z-Score: +2.3250 | Island Rank: 424'], 2),
('G.C.E. Ordinary Level', 'KM/Al-Ashraq National School, Nintavur', '2019', ARRAY['9 As including English, ICT, Maths, Science'], 3)
ON CONFLICT DO NOTHING;

-- Insert experience
INSERT INTO experience (title, subtitle, period, details, display_order) VALUES
('Volunteer Teacher', 'Nintavur, Sri Lanka', '2019 – Present', ARRAY['Provide tutoring and academic support to students', 'Analyze student performance to identify skill gaps and track progress'], 1)
ON CONFLICT DO NOTHING;

-- Insert certificates
INSERT INTO certificates (name, issuer, display_order) VALUES
('Intro to Machine Learning', 'Kaggle', 1),
('Pandas + Feature Engineering', 'Kaggle', 2),
('Generative Accelerated AI', 'NVIDIA', 3),
('Cloud Foundations', 'AWS Academy', 4),
('Microservices & CI/CD', 'AWS Academy', 5)
ON CONFLICT DO NOTHING;

-- Insert site content
INSERT INTO site_content
  (id, hero_title, hero_subtitle, hero_status,
   about_text, about_paragraph1, about_paragraph2, about_paragraph3,
   contact_intro, footer_text, seo_title, seo_description, resume_url)
VALUES
  ('main',
   'Asfi Ahamed',
   'Computer Science & Engineering Student<br />Specializing in Data Science & Engineering.',
   'Currently at University of Moratuwa',
   $$I'm a Computer Science & Engineering student at the University of Moratuwa specializing in Data Science & Engineering (DSE). Driven by a strong foundation in mathematics, I love translating complex problems into clean, efficient software architectures.$$,
   $$My engineering focus centers on building practical AI systems, deploying machine learning workflows, developing full-stack applications, and exploring digital logic hardware.$$,
   $$Beyond code, I have been dedicated to serving my community as a Volunteer Teacher since 2019, where I tutor students and analyze performance to track progress.$$,
   $$Have a project or opportunity? I'd love to hear from you.$$,
   '© 2024 Asfi Ahamed. All rights reserved.',
   'Asfi Ahamed - Portfolio',
   'Computer Science & Engineering student specializing in Data Science & Engineering at University of Moratuwa.',
   'Computer Science & Engineering student specializing in Data Science & Engineering (DSE) at University of Moratuwa.',
   NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Insert socials
INSERT INTO socials (label, href, icon, display_order) VALUES
('GitHub', 'https://github.com/asfiahamed0404', 'Github', 1),
('LinkedIn', 'https://www.linkedin.com/in/asfi-ahamed-baa362347', 'Linkedin', 2),
('Email', 'mailto:muasfiahamed276@gmail.com', 'Mail', 3)
ON CONFLICT DO NOTHING;

-- Insert initial appreciation count if not exists
INSERT INTO appreciations (id, count) VALUES (1, 0) ON CONFLICT DO NOTHING;
