# Second Brain

## What it is
Second Brain is RocketClaw2's built-in personal knowledge workflow for ingesting, recalling, and curating durable context.

## Use it when
- you want RocketClaw2 to remember stable facts and preferences
- you need personal-RAG style retrieval over sessions and curated memory
- you want to promote useful patterns from raw history into durable memory

## Avoid it when
- the information is highly sensitive and should not persist
- the context is temporary and not worth long-term storage
- you only need one-off short-lived working memory

## Setup
Recommended prerequisites:
- initialized local workspace
- persisted session history
- semantic memory enabled
- clear promotion criteria for durable facts

## Operator flow
```bash
rocketclaw2 search --query "WhatsApp"
rocketclaw2 dream
rocketclaw2 remember
rocketclaw2 recall --query "WhatsApp"
rocketclaw2 memory-list --summary
```

## Good defaults
- keep episodic and curated memory separate
- promote only durable, re-usable facts
- review summaries before large promotions

## Demo ideas
- save a communication preference, promote it, and recall it later
- consolidate repeated project constraints into semantic memory
