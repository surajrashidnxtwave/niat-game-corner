// Create (or update) the Brain Gym tables. Safe to run more than once.
// Usage: npm run db:setup
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) { console.error('Set DATABASE_URL in .env.local first.'); process.exit(1); }
const sql = neon(process.env.DATABASE_URL);

const steps = [
  // one row per student; roll number is unique within a pilot group
  `CREATE TABLE IF NOT EXISTS students (
     id          serial PRIMARY KEY,
     name        text NOT NULL,
     roll        text NOT NULL,
     pilot       text NOT NULL,
     created_at  timestamptz NOT NULL DEFAULT now(),
     last_seen   timestamptz NOT NULL DEFAULT now(),
     UNIQUE (pilot, roll)
   )`,
  // a device that has joined; only the sha-256 of the token is stored
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash  text PRIMARY KEY,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
  // running totals per student per game (only ever go up)
  `CREATE TABLE IF NOT EXISTS progress (
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     game_id     text NOT NULL,
     active      int NOT NULL DEFAULT 0,
     best        int NOT NULL DEFAULT 0,
     best_pct    int NOT NULL DEFAULT 0,
     plays       int NOT NULL DEFAULT 0,
     vol         int NOT NULL DEFAULT 0,
     updated_at  timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (student_id, game_id)
   )`,
  // every finished round, for the pilot report
  `CREATE TABLE IF NOT EXISTS plays (
     id          bigserial PRIMARY KEY,
     client_id   text NOT NULL UNIQUE,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     game_id     text NOT NULL,
     score       int NOT NULL,
     pct         int NOT NULL,
     lift        int NOT NULL,
     played_at   timestamptz NOT NULL DEFAULT now()
   )`,
  // ratings, comments and AI-verdict thumbs
  `CREATE TABLE IF NOT EXISTS feedback (
     id          bigserial PRIMARY KEY,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     kind        text NOT NULL CHECK (kind IN ('game','verdict','general')),
     game_id     text,
     rating      smallint CHECK (rating BETWEEN 1 AND 5),
     difficulty  text CHECK (difficulty IN ('easy','right','hard')),
     fair        boolean,
     comment     text,
     meta        jsonb,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
  // roster login: students are uploaded first (roll = NIAT ID, pilot = batch) and log in later
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS joined_at timestamptz`,
  `ALTER TABLE students ALTER COLUMN last_seen DROP NOT NULL`,
  `ALTER TABLE students ALTER COLUMN last_seen DROP DEFAULT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS students_roll_key ON students (roll)`,
  // active seconds per student per day: powers streaks and the "20 minutes a day" report
  `CREATE TABLE IF NOT EXISTS daily (
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     day         date NOT NULL,
     active      int NOT NULL DEFAULT 0,
     updated_at  timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (student_id, day)
   )`,
  `CREATE INDEX IF NOT EXISTS daily_day_idx ON daily (day)`,
  // badges won from reward chests
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}'`,
  // feedback kinds: mood = daily check-in, bug = "something's off" report
  // session = end-of-session "11-star" rating, stored in rating (1-11); other kinds stay 1-5 (checked in the API)
  `ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_kind_check`,
  `ALTER TABLE feedback ADD CONSTRAINT feedback_kind_check CHECK (kind IN ('game','verdict','general','mood','bug','session'))`,
  `ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_rating_check`,
  `ALTER TABLE feedback ADD CONSTRAINT feedback_rating_check CHECK (rating BETWEEN 1 AND 11)`,
  `CREATE INDEX IF NOT EXISTS plays_student_idx ON plays (student_id, played_at)`,
  `CREATE INDEX IF NOT EXISTS feedback_kind_idx ON feedback (kind, created_at)`,
  `CREATE INDEX IF NOT EXISTS students_pilot_idx ON students (pilot)`
];

for (const s of steps) await sql.query(s);
const t = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`;
console.log('Tables ready:', t.map(r => r.table_name).join(', '));
