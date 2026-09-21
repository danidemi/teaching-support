ID: TESTDATA-001

Status: READY

Priority: Medium

Effort: 3

As:
a `human tester`

I want to:
automatically seed the system with a small but representative set of test data — users, accounts, quizzes, and quiz attempts with both correct and incorrect answers — through some way I can trigger myself, without needing to know the internals of how to do it

So that:
I can quickly get the platform into a realistic, known state and run manual tests, instead of manually creating all this data by hand through the UI or asking a developer to do it for me each time

Definition of Done:
* a documented way exists for a human tester to trigger seeding of test data (e.g. a script, CLI command, or admin action) without needing source-level knowledge
* the seeded data includes: at least a couple of users/accounts, at least one quiz, and quiz attempts covering both correct and incorrect/partial answers
* seeding is repeatable (can be re-run to reset/refresh the test data) and does not require manual database edits
* the mechanism to trigger seeding and what data it produces is documented for testers
* verified manually: a tester with no codebase knowledge follows the documentation and successfully seeds the data end-to-end
