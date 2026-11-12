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
  `CREATE INDEX IF NOT EXISTS students_pilot_idx ON students (pilot)`,
  // a second spelling of the student's name from another official list; login accepts either
  `ALTER TABLE students ADD COLUMN IF NOT EXISTS alt_name text`,
  // game-specific results (e.g. reaction times, which candidates were checked) and seconds from start to results
  `ALTER TABLE plays ADD COLUMN IF NOT EXISTS meta jsonb`,
  `ALTER TABLE plays ADD COLUMN IF NOT EXISTS secs int`,
  // one row each time a student presses Play, so we can count games opened but not finished
  `CREATE TABLE IF NOT EXISTS starts (
     id          bigserial PRIMARY KEY,
     client_id   text NOT NULL UNIQUE,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     game_id     text NOT NULL,
     started_at  timestamptz NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS starts_game_idx ON starts (game_id, started_at)`,
  // ---------- Drive School (separate points, streak and data from Brain Gym) ----------
  // one row per student who has opened Drive School; memo = small facts later lessons need (Day 1 guess, plans, ...)
  `CREATE TABLE IF NOT EXISTS drive_students (
     student_id  int PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
     started_on  date NOT NULL,
     points      int NOT NULL DEFAULT 0,
     memo        jsonb NOT NULL DEFAULT '{}',
     created_at  timestamptz NOT NULL DEFAULT now(),
     updated_at  timestamptz NOT NULL DEFAULT now()
   )`,
  // first completion of each day; ist_date = the India calendar day it counts toward (3-a-day cap, streak)
  `CREATE TABLE IF NOT EXISTS drive_days (
     student_id    int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     day           smallint NOT NULL,
     completed_at  timestamptz NOT NULL,
     ist_date      date NOT NULL,
     points        int NOT NULL DEFAULT 0,
     secs          int,
     PRIMARY KEY (student_id, day)
   )`,
  `CREATE INDEX IF NOT EXISTS drive_days_date_idx ON drive_days (student_id, ist_date)`,
  // everything a student does in a lesson: answers, predictions, plans, stands, reflections, game choices, scales
  `CREATE TABLE IF NOT EXISTS drive_events (
     id          bigserial PRIMARY KEY,
     client_id   text NOT NULL UNIQUE,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     day         smallint NOT NULL,
     kind        text NOT NULL,
     screen      text,
     data        jsonb NOT NULL DEFAULT '{}',
     replay      boolean NOT NULL DEFAULT false,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS drive_events_student_idx ON drive_events (student_id, day)`,
  `CREATE INDEX IF NOT EXISTS drive_events_kind_idx ON drive_events (kind, day)`,
  // ---------- English Adda (own points, timer, streak and levels; separate from Brain Gym and Drive School) ----------
  // one row per student who has opened English Adda; levels = private skill levels 1-8 {voc, gra, lis, rea, wri}
  `CREATE TABLE IF NOT EXISTS english_students (
     student_id  int PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
     started_on  date NOT NULL,
     points      int NOT NULL DEFAULT 0,
     levels      jsonb NOT NULL DEFAULT '{}',
     placement   jsonb,
     placed_at   timestamptz,
     meter       jsonb NOT NULL DEFAULT '[]',
     memo        jsonb NOT NULL DEFAULT '{}',
     updated_at  timestamptz NOT NULL DEFAULT now()
   )`,
  // active seconds per student per India calendar day: the 15-minute ring, the streak and the 25-minute close
  `CREATE TABLE IF NOT EXISTS english_daily (
     student_id   int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     day          date NOT NULL,
     active       int NOT NULL DEFAULT 0,
     fresh_rounds int NOT NULL DEFAULT 0,
     updated_at   timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (student_id, day)
   )`,
  `CREATE INDEX IF NOT EXISTS english_daily_day_idx ON english_daily (day)`,
  // one row per finished round of a game
  `CREATE TABLE IF NOT EXISTS english_rounds (
     id          bigserial PRIMARY KEY,
     client_id   text NOT NULL UNIQUE,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     game        text NOT NULL,
     level       smallint NOT NULL,
     items       smallint,
     correct     smallint,
     points      int NOT NULL DEFAULT 0,
     secs        int,
     ist_date    date NOT NULL,
     played_at   timestamptz NOT NULL,
     meta        jsonb
   )`,
  `CREATE INDEX IF NOT EXISTS english_rounds_student_idx ON english_rounds (student_id, ist_date)`,
  `CREATE INDEX IF NOT EXISTS english_rounds_game_idx ON english_rounds (game, played_at)`,
  // every answer to every item: finds content that is too hard, too easy or has a second right answer
  `CREATE TABLE IF NOT EXISTS english_answers (
     id          bigserial PRIMARY KEY,
     round_cid   text NOT NULL,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     game        text NOT NULL,
     item_id     text NOT NULL,
     ok          boolean NOT NULL,
     tries       smallint,
     answer      text,
     ms          int,
     at          timestamptz NOT NULL DEFAULT now(),
     UNIQUE (round_cid, item_id)
   )`,
  `CREATE INDEX IF NOT EXISTS english_answers_item_idx ON english_answers (game, item_id)`,
  // skill + item level of each answer: level-ups look at the last 20 answers at the student's current level
  `ALTER TABLE english_answers ADD COLUMN IF NOT EXISTS skill text`,
  `ALTER TABLE english_answers ADD COLUMN IF NOT EXISTS lv smallint`,
  `CREATE INDEX IF NOT EXISTS english_answers_student_idx ON english_answers (student_id, skill, lv, at DESC)`,
  // Word Vault: words a student saved, reviewed on a spaced schedule (box 1-5)
  `CREATE TABLE IF NOT EXISTS english_vault (
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     word        text NOT NULL,
     box         smallint NOT NULL DEFAULT 1,
     due         date NOT NULL,
     source      text,
     added_at    timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (student_id, word)
   )`,
  // everything else: level check, ratings, swaps, level-ups, Boss Rounds
  `CREATE TABLE IF NOT EXISTS english_events (
     id          bigserial PRIMARY KEY,
     client_id   text NOT NULL UNIQUE,
     student_id  int NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     kind        text NOT NULL,
     data        jsonb NOT NULL DEFAULT '{}',
     at          timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS english_events_kind_idx ON english_events (kind, at)`
];

for (const s of steps) await sql.query(s);
const t = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`;
console.log('Tables ready:', t.map(r => r.table_name).join(', '));
