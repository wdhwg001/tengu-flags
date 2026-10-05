// What the published data may never carry: a machine-local path, the operator's scratch root, a session uuid or
// a subagent id. Written with character classes so this file does not match the privacy check it enforces.
// The scratch root is caught as a path segment (a leading dot or a trailing slash), so the slug of the real
// variable CLAUDE_TMPDIR, which spells the same letters, is not a violation.
export const PRIVATE =
  /\/U[s]ers\/|\.claude-t[m]p|claude-t[m]p\/|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|agent-[0-9a-f]{16}/;
