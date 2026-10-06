# Regression strategy

## Risk-based selection

A regression strategy protects important user outcomes after a change. Select tests by failure impact, change frequency and integration risk. Keep a small smoke suite for fast feedback, then run broader regression checks before release.

## Observable behavior

Test public behavior and rejection paths instead of private function structure. A bug fix earns a regression test that fails before the fix and passes afterward. Stable fixtures and explicit expected results make failures reproducible.

## Test layers

Unit tests isolate domain decisions. Integration tests exercise boundaries between modules. Browser tests cover critical user journeys against the real demo API. External provider calls can be replaced with deterministic stubs in baseline CI.
