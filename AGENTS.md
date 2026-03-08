# WAITLIST - Agent Orchestration

Project:
WAITLIST - QR based restaurant waitlist SaaS MVP

Source of truth documents:
- SYSTEM_ARCHITECTURE.md
- USER_FLOW.md
- DATABASE_SCHEMA.sql
- OPENCLAW_PROMPT.md

Operating model:
- OpenClaw orchestrates
- Prefer Claude Code for coding-heavy work
- Minimize API-token cost when equivalent work can be done through Claude Code
- Keep API-heavy calls for lightweight coordination, summaries, or routing only

Required agent order:
1. Builder
2. QA
3. DevOps
4. Product
5. Orchestrator summary

Mandatory outputs:
- /outputs/builder_output.md
- /outputs/qa_output.md
- /outputs/devops_output.md
- /outputs/product_output.md
- /outputs/final_orchestrator_output.md

Do not proceed to the next major phase unless the current phase has a written output file.

## Global execution policy

Agents must:
- use the source-of-truth documents first
- work in small, safe steps
- prefer deterministic and testable changes
- avoid broad refactors
- avoid redoing the same failing action repeatedly
- continue without asking the user for permission unless there is a real blocker

Agents must NOT:
- loop forever
- retry external failures without a cap
- burn tokens on repeated self-discussion
- ask for approval on routine engineering steps
- create hidden side effects without logging them

## Cost policy

Default routing:
- Coding, editing, refactoring, test fixing, repo changes, code explanation over codebase:
  prefer Claude Code
- Short orchestration messages, output summaries, step planning:
  use lower-cost coordination path
- Large codebase scans:
  perform once, cache findings in output files, do not repeat unless files changed materially

Reason:
Claude Code is included in Anthropic Pro and Max plans, while API pricing is billed per token separately. See the official Anthropic pricing pages.
Do not assume unlimited use. Stay efficient.

## Retry and deadlock policy

For any task:
- max_attempts_per_subtask = 3
- max_identical_retry = 2
- max_agent_ping_pong = 2
- max_unproductive_cycles_per_issue = 3
- if no material progress after thresholds above, stop and write blocker report

Definition of no material progress:
- same error repeated
- same missing permission repeated
- same dependency failure repeated
- same plan restated without file/code/output changes

On deadlock or loop:
1. stop the loop
2. write exact blocker
3. write what was achieved
4. write next 1-3 actions the user must do
5. provide step-by-step instructions
6. notify user channel if configured

## Human-only blockers

These are valid reasons to stop and notify:
- captcha
- MFA / identity proof
- payment / billing decision
- legal acceptance screen that requires human review
- missing phone / email verification that cannot be auto-completed
- manual WhatsApp Business approval or Meta verification step

If a captcha appears:
- try up to 3 times if there is a legitimate retry path
- if still blocked, stop and notify with exact steps

## Output quality bar

Every agent output must include:
- objective
- inputs used
- actions performed
- files changed
- commands run
- result
- blockers
- next recommendation

## Notify-on-block template

Use this exact structure if blocked:

I reached the maximum safe retry limit and stopped to avoid wasting tokens.
I completed:
1. ...
2. ...
3. ...

I need these from you:
1. ...
2. ...
3. ...

Step by step:
1. Click ...
2. Open ...
3. Paste ...
4. Confirm ...
5. Return here and say ...
