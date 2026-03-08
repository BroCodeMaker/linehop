# Cost Strategy - Prefer Claude Code, minimize API burn

Current official references:
- Anthropic Pro includes Claude Code
- Anthropic Max includes Claude Code
- Anthropic API is billed separately per token
- OpenClaw can route ACP / agent sessions through the gateway

Practical policy:
1. Use Claude Code for:
   - repo-wide code edits
   - refactors
   - code search
   - test fixing
   - shell/terminal-heavy engineering work
   - file creation across many files

2. Use low-cost coordination path for:
   - one-paragraph summaries
   - orchestration notes
   - deciding next agent
   - final report formatting

3. Cache work:
   - do one repo scan and write findings to outputs
   - do not re-scan whole repo unless files changed materially

4. Escalation policy by model/cost:
   - default coding path: Claude Code with lower-cost capable model/profile if available
   - escalate only for hard bugs, architecture conflict, or repeated failure
   - de-escalate after the hard subtask ends

5. Token safety:
   - stop if same error repeats twice
   - stop if no file changes after 3 short turns
   - stop if discussion gets abstract without commands or diffs

Decision rule:
If the same task can be done either by API-token-heavy orchestration or by Claude Code included usage, prefer Claude Code first.
But do not assume included usage is infinite. Remain efficient and stop on loops.

Notes:
This is a cost optimization policy, not a billing guarantee.
