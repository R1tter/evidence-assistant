# CI gates

## Reproducible checks

Continuous integration starts with a clean checkout and npm ci using a committed lockfile. Run formatting, zero-warning lint, type checking, dependency boundary checks, tests and build. The baseline pipeline runs without external API credentials.

## Coverage and review

Coverage gates highlight untested branches; they do not prove correctness. Review failed assertions and test observable behavior. Browser failure traces and screenshots help explain the user-visible failure. Update visual baselines only after reviewing their differences.

## Secrets and logs

Keep credentials in server environment variables and out of source control. Logs record request identifiers, mode, status and duration. Logs omit questions, documents, responses and credentials.
