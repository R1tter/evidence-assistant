# API contracts

## Input validation

Validate unknown request data before domain processing. Trim the question and accept between one and one thousand characters. Reject unsupported modes and oversized bodies before retrieval or provider calls. Resolve documents by corpus identifiers, never by client filesystem paths.

## Errors and cancellation

Public errors use stable codes and a request identifier. Preserve user input so a failed request can be retried. Propagate cancellation to queued and running provider work. A total deadline includes time waiting in the queue.

## Module boundaries

Transport handlers orchestrate domain services through public contracts. Core retrieval remains independent of HTTP, React, MCP and provider SDKs. Build an immutable corpus index once during startup rather than reading source files on every question.
