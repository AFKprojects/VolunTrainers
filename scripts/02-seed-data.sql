-- Fixed invalid UUIDs to use proper hexadecimal format
-- Insert sample foundation users
INSERT INTO users (id, email, password_hash, role) VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'foundation1@example.com', '$2a$10$example_hash_1', 'foundation'),
  ('a2222222-2222-2222-2222-222222222222', 'foundation2@example.com', '$2a$10$example_hash_2', 'foundation');

-- Insert sample coach users  
INSERT INTO users (id, email, password_hash, role) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'coach1@example.com', '$2a$10$example_hash_3', 'coach'),
  ('b2222222-2222-2222-2222-222222222222', 'coach2@example.com', '$2a$10$example_hash_4', 'coach');

-- Insert foundation profiles
INSERT INTO profiles (user_id, first_name, last_name, location, bio) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Sports', 'Foundation', 'Warsaw, Poland', 'Dedicated to promoting youth sports in underserved communities.'),
  ('a2222222-2222-2222-2222-222222222222', 'Active', 'Kids', 'Krakow, Poland', 'Helping children stay active through organized sports programs.');

-- Insert coach profiles
INSERT INTO profiles (user_id, first_name, last_name, location, bio) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Jan', 'Kowalski', 'Warsaw, Poland', 'Experienced football coach with 10 years of youth training.'),
  ('b2222222-2222-2222-2222-222222222222', 'Anna', 'Nowak', 'Gdansk, Poland', 'Basketball coach passionate about developing young talent.');

-- Insert foundation info
INSERT INTO foundation_info (user_id, organization_name, description) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Sports for All Foundation', 'We believe every child deserves access to quality sports education and training.'),
  ('a2222222-2222-2222-2222-222222222222', 'Active Kids Organization', 'Promoting healthy lifestyles through sports and physical activity.');

-- Insert coach skills
INSERT INTO coach_skills (user_id, sport, experience_years, certification) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Football', 10, 'UEFA B License'),
  ('b1111111-1111-1111-1111-111111111111', 'Athletics', 5, 'IAAF Level 2'),
  ('b2222222-2222-2222-2222-222222222222', 'Basketball', 8, 'FIBA Level 3'),
  ('b2222222-2222-2222-2222-222222222222', 'Volleyball', 3, 'CEV Level 1');

-- Insert sample projects
INSERT INTO projects (id, foundation_id, title, description, sport, location, start_date, end_date, required_skills, max_volunteers) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Youth Football Training Program', 'Looking for experienced football coaches to train children aged 8-14 in basic football skills and teamwork.', 'Football', 'Warsaw, Poland', '2024-03-01', '2024-06-30', ARRAY['Youth coaching', 'Football fundamentals', 'Team management'], 2),
  ('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Basketball Skills Workshop', 'Need basketball coaches for weekend workshops teaching shooting, dribbling, and game strategy to teenagers.', 'Basketball', 'Krakow, Poland', '2024-02-15', '2024-05-15', ARRAY['Basketball coaching', 'Youth development', 'Weekend availability'], 1);
