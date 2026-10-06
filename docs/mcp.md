# Local MCP server

Build with `npm ci` and `npm run build`. Launch the compiled entry directly; npm wrappers print banners to stdout and must not be used as MCP host commands.

Example host configuration (replace the absolute path for your checkout):

```json
{
  "mcpServers": {
    "evidence-assistant": {
      "command": "node",
      "args": [
        "C:/Users/Marcelo Ritter/Documents/Codex/evidence-assistant/apps/mcp/dist/stdio.js"
      ]
    }
  }
}
```

The host owns the process. No credentials, HTTP server or working-directory setting is required. Corpus paths resolve relative to the entry, exactly as the API does; source files and retrieval index load once. Diagnostics use stderr. Closing stdin tears down the connection; SIGINT/SIGTERM close the SDK handle.

## Tools

- `search_documents`: `{query, limit?}`. Query is trimmed, 1–1,000 Unicode code points; optional integer limit is 1–5 (default 5). Returns `structuredContent: {evidence}` with core chunks and lexical scores, plus the same JSON as text. Unsupported queries return an empty list. Invalid arguments produce tool errors.
- `get_document`: `{id}` with 1–200 characters. Returns `structuredContent: {document: {id,title,content}}` and matching JSON text. Unknown IDs return `isError: true` with `Document not found.`. IDs only resolve in the startup map; they never become filesystem paths.

Both tools are read-only, idempotent and limited to the original local collection. Document content is data, not instructions. Relevance scores do not establish truth or semantic correctness. MCP exposes retrieval and sources; generated answers remain the optional HTTP provider feature.

The factory accepts optional original documents alongside chunks, matching the API clarification: chunks cannot reconstruct originals. Production supplies both. Server/client packages are pinned to 2.3.1 using the [official stable v2 SDK](https://ts.sdk.modelcontextprotocol.io/v2/) and [stdio lifecycle](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio.html).

Protocol tests spawn the compiled server with the official client using `process.execPath`, from a different working directory, and exercise listing, search/core parity, original documents, validation, unsupported search and EOF shutdown. These tests verify the protocol boundary; configuration in a particular external host has not been tested.
