# WAITLIST - OpenClaw Agent Pack

Purpose:
This pack gives you a ready-to-use multi-agent setup for the Waitlist project.

Main idea:
- OpenClaw acts as orchestrator / gateway
- Claude Code is preferred for coding-heavy tasks
- API-token usage is minimized when possible
- Agents must stop on loops, deadlocks, or repeated failures
- Agents must produce a reviewable output after each step

Included:
- AGENTS.md
- CLAUDE.md
- /agents/*.md
- /outputs/OUTPUT_TEMPLATE_*.md
- /runbooks/*.md
- MASTER_PROMPT_OPENCLAW.txt

How to use:
1. Unzip this pack into the root of your repo.
2. Keep the project docs in the repo root or /docs:
   - SYSTEM_ARCHITECTURE.md
   - USER_FLOW.md
   - DATABASE_SCHEMA.sql
   - OPENCLAW_PROMPT.md
3. Open OpenClaw.
4. Paste MASTER_PROMPT_OPENCLAW.txt into the first orchestration chat.
5. Let it create or update missing files.
6. Review the outputs produced by each agent.

Expected output from agents:
- Builder writes a build report
- QA writes a test report
- DevOps writes an environment/runtime report
- Product writes a UX/product report
- Orchestrator writes a final summary and blockers report

Important:
This pack is designed so the agents should continue without asking you for permission in normal cases.
They should only stop and notify you when:
- a human-only step is required
- a captcha or identity verification blocks progress
- a payment / cost decision is needed
- a credential cannot be obtained automatically
