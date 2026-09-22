# learning-platform-server

See `../README.md` for the overall project layout and how to run the app.

## Seed test data (TESTDATA-001)

If you're testing the app and want it pre-loaded with realistic sample
data — accounts you can log in with, a course, a quiz, and some quiz
results already recorded — run:

```bash
npm run db:seed
```

from this `server/` directory.

**Before running it**, the server must already be up and running (see
`../README.md`'s "Run" section for how to start it with `npm run db:up`
then `npm start`/`npm run dev`), and its `.env` must have
`EXPEDITE_SIGNUP_ENABLED=true` (this is already the default in
`.env.example`).

**What it creates:**

* Two trainer accounts you can sign in with at the app's home page:
  * `trainer1@seed.local`
  * `trainer2@seed.local`
  * Password for both: `SeedPass123!`
* Under `trainer1@seed.local`, a course called **"Seed Course"** containing
  one quiz built from a sample geography quiz package (one single-choice
  question, one multi-select question).
* One quiz session for that quiz that has already been run and stopped,
  with three recorded student attempts:
  * one that answered everything correctly,
  * one that answered everything incorrectly,
  * one that got the single-choice question right but only partially
    answered the multi-select question (picked one of the two correct
    options).

Sign in as `trainer1@seed.local` / `SeedPass123!` to see the course, the
quiz, and that session's results.

**Safe to re-run.** Every time you run it, it first removes only the data
it previously created (anything tied to a `@seed.local` account), then
creates it again from scratch. It never touches any other account, course,
or quiz in your database — so it's safe to run as many times as you like
to reset the sample data back to a known state.
