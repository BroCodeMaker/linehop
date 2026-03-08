# Failsafe and Notify Policy

Goal:
Prevent infinite retries, looped debate, deadlocks, and useless token burn.

## Hard stop conditions
Stop immediately and notify if any of these is true:
- same external error 3 times
- same missing permission 2 times
- same agent handoff ping-pong 2 times
- no material file/code/output progress after 3 short cycles
- captcha / MFA / identity check still blocks after 3 real attempts
- cost uncertainty requires human decision

## Safe self-recovery before stop
Allowed self-recovery actions:
- restart only the failed subtask
- switch to a local stub/mock if provider setup is blocked
- choose the simplest local database option
- write missing env template
- replace an external dependency with a documented mock path for local progress

## Notification payload
When blocked, send the user this exact structure:

I reached the maximum safe retry limit and stopped to avoid wasting tokens.

I completed:
1. ...
2. ...
3. ...

I still need from you:
1. ...
2. ...
3. ...

Do these steps:
1. Open ...
2. Click ...
3. Copy ...
4. Paste ...
5. Confirm ...
6. Return and send ...

## WhatsApp notify instruction
If the OpenClaw environment has a WhatsApp channel configured for the user, send the blocker summary there too.
If not, write the same content into /outputs/final_orchestrator_output.md.

## Human-escalation examples
- "Meta business verification needs a phone confirmation"
- "Stripe or provider billing screen requires your card approval"
- "CAPTCHA blocked automated account creation"
