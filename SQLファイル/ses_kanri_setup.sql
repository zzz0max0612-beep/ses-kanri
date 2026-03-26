-- ============================================================
-- SES営業管理システム - Supabase テーブル作成SQL
-- Supabase Dashboard > SQL Editor > New query に貼り付けて Run
-- ============================================================

-- 要員テーブル
create table engineers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  affiliation text,
  skills text[] default '{}',
  skill_projects jsonb default '[]',
  experience_years int,
  available_date date,
  prefecture text,
  nearest_station text,
  work_style text default 'hybrid',
  desired_rate int,
  conditions text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 案件テーブル
create table projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  client_name text,
  required_skills text[] default '{}',
  start_date date,
  end_date date,
  prefecture text,
  work_style text default 'onsite',
  budget_min int,
  budget_max int,
  headcount int default 1,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 提案テーブル
create table proposals (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid references engineers(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  status text default '提案中',
  memo text,
  interview jsonb,
  proposed_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- スキルシートテーブル
create table skill_sheets (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid references engineers(id) on delete cascade,
  file_name text,
  storage_path text,
  uploaded_at timestamptz default now()
);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger engineers_updated_at before update on engineers
  for each row execute function update_updated_at();
create trigger projects_updated_at before update on projects
  for each row execute function update_updated_at();
create trigger proposals_updated_at before update on proposals
  for each row execute function update_updated_at();
