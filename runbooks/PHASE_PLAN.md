# Phase Plan - Waitlist

## Phase 0 - Bootstrap
- verify repo files
- verify docs
- verify local stack
- create missing env templates
- install dependencies
- run db

## Phase 1 - Core vertical slice
- guest join flow
- queue listing
- dashboard skeleton
- call-next endpoint
- state persisted in database

## Phase 2 - Messaging
- WhatsApp adapter abstraction
- mock provider for local use
- outbound table-ready message
- inbound confirm handling
- message event logging

## Phase 3 - Time windows and operations
- confirm timeout
- arrival timeout
- seat / skip / cancel complete
- status page reflects actual state

## Phase 4 - Polishing for extension
- modularize services
- prepare reservation extension points
- prepare ETA calculation extension points
- basic analytics-ready service boundaries

After each phase:
- all mandatory output files
- final orchestrator summary
- user_test_instructions.md
- stop safely if blocked
