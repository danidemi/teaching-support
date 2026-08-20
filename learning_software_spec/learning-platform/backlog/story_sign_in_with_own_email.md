ID: SIGN-UP-001

Status: DRAFT

Priority: Low

As:
a `unregistered user`

I want to:
sign in with my email and experience the usual flows: provide username and password, receive a confirmation email, click on a link to confirm.

So that:
I'm able to access the platform without any social login

Definition of Done:
* Two user cannot sign up with same email
* password cannot be empty

Notes:
* alternative to LOGIN-001 (Google sign-in), not a replacement — decided during grooming
  (2026-08-20): both are valid ways to become a `registered user`, and either satisfies
  TENANT-001's precondition; this story stays independent of LOGIN-001 and Low priority
* IAM approach resolved by `adr/ADR-0002-persistence-and-iam.md`: build it ourselves
  (no off-the-shelf IAM product), users stored in PostgreSQL

Open questions:
* password hashing scheme and confirmation-email delivery (SMTP provider/local dev stub) are
  not specified yet — needs grooming before this story is sprint-ready
