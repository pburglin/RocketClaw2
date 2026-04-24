# TODO List for RocketClaw2 Enhancements

## Completed Features
- [x] Smart zsh completions (tab auto-complete for commands/subcommands)
- [x] Real WhatsApp integration (QR code auth, no longer mock)
- [x] TUI improvements (show selected model, gateway status, etc.)
- [x] Advanced TUI with real-time health monitoring and controls
- [x] Enhanced autonomous coding flows with progress tracking
- [x] Improved heartbeat mechanism for health checking and task queue triggering
- [x] All tests passing (181/181)

## Current Status
- RocketClaw2 core functionality: Complete with all tests passing
- WhatsApp gateway: Stable native transport with QR-based authorization
- TUI: Advanced interface with health monitoring, queue status, and coding harness integration
- Heartbeat: Continuous verification system that monitors health, processes queues, and executes scheduled tasks

## Next Steps
1. Ship RocketClaw2 v0.2.0 roadmap and docs for built-in high-quality skills
2. Add first-class setup and usage guides for agentic autonomy patterns
3. Prototype built-in skill packs and demo flows for popular workflows
4. Continue monitoring runtime and WhatsApp gateway stability

## Current Focus
- Expand RocketClaw2 roadmap to include built-in guided skills for:
  - Ralph Loop (verify-and-fix autonomy)
  - Karpathian Loop (iterative data-driven self-improvement)
  - World Model (context modeling and planning)
  - Second Brain (personal data RAG)
  - Multi-Agent Teams (specialized cooperating agents)
  - Evaluator-Optimizer workflows (generator + critic loops)
- Add project documentation and demos that show setup, operator guidance, and practical usage for these patterns.

## Current Blocker
- Autonomous coding flows are still partially blocked by OpenClaw exec preflight behavior around complex interpreter invocations when launched through `openclaw exec`, even after LLM config fixes.

## Recent Milestones
- Fixed TUI ESM import issue (changed from require to import * as blessed from 'blessed')
- Implemented advanced TUI with real-time updates and interactive controls
- Enhanced autonomous coding flows with better progress visualization
- Improved heartbeat mechanism for proactive system monitoring
- All tests passing - build and test suite fully green
