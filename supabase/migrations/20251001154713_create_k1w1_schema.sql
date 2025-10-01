/*
  # k1w1ProPlus - Bolt.new-Style No-Code Platform Schema

  ## Overview
  Complete database schema for a mobile no-code platform with AI-powered code generation,
  live preview, and automated builds.

  ## Tables Created
  
  ### 1. projects
  Stores user projects with metadata
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - project name
  - `description` (text) - optional description
  - `template` (text) - starter template used
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `last_opened_at` (timestamptz)

  ### 2. code_files
  Stores all code files for each project
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `file_path` (text) - e.g., "src/screens/HomeScreen.js"
  - `content` (text) - actual file content
  - `language` (text) - js, tsx, css, json, etc.
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. chat_messages
  Stores AI chat conversation history per project
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `user_id` (uuid, references auth.users)
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - message content
  - `code_changes` (jsonb) - optional array of file changes
  - `created_at` (timestamptz)

  ### 4. builds
  Tracks EAS build history and status
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `user_id` (uuid, references auth.users)
  - `platform` (text) - 'android' or 'ios'
  - `status` (text) - 'pending', 'building', 'success', 'error'
  - `eas_build_id` (text) - EAS build ID
  - `download_url` (text) - APK/IPA download URL
  - `error_message` (text) - error details if failed
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### 5. user_settings
  Stores user preferences and API keys
  - `user_id` (uuid, primary key, references auth.users)
  - `gemini_api_key` (text) - encrypted AI API key
  - `eas_token` (text) - encrypted EAS access token
  - `github_token` (text) - optional GitHub PAT
  - `active_project_id` (uuid) - currently selected project
  - `theme` (text) - always 'dark'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations
  - API keys stored encrypted (app-level encryption before insert)

  ## Indexes
  - Performance indexes on foreign keys and frequently queried columns
  - Composite indexes for common query patterns
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  template text DEFAULT 'blank',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_opened_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_last_opened ON projects(user_id, last_opened_at DESC);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Code Files Table
CREATE TABLE IF NOT EXISTS code_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  content text DEFAULT '',
  language text DEFAULT 'javascript',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_code_files_project_id ON code_files(project_id);

ALTER TABLE code_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files in own projects"
  ON code_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files in own projects"
  ON code_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in own projects"
  ON code_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_files.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files in own projects"
  ON code_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = code_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  code_changes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id, created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own projects"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own projects"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = chat_messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Builds Table
CREATE TABLE IF NOT EXISTS builds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'success', 'error')),
  eas_build_id text,
  download_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_builds_project_id ON builds(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builds_status ON builds(user_id, status);

ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own builds"
  ON builds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create builds in own projects"
  ON builds FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = builds.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own builds"
  ON builds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key text,
  eas_token text,
  github_token text,
  active_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  theme text DEFAULT 'dark',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_files_updated_at
  BEFORE UPDATE ON code_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();