# RocketClaw2 v0.2.0 Planning

## Objective
Streamline and simplify RocketClaw2 v0.1.0 by removing redundant options, improving intuitiveness, and focusing on highest-value features for real autonomous coding flows, advanced TUI, and heartbeat-driven task execution.

## Areas for Simplification
1. **CLI Command Redundancy**: Review overlapping functionality between similar commands
2. **Configuration Options**: Consolidate related settings and remove rarely used toggles
3. **TUI Complexity**: Simplify interface while maintaining core functionality
4. **Memory System**: Streamline recall/scoring options for better usability
5. **Tool Policies**: Refine access levels and override mechanisms

## Highest Value Tasks for v0.2.0
1. **Real Autonomous Coding Flows**: End-to-end implementation with minimal user intervention
2. **Advanced TUI**: Real-time dashboard with health metrics, queue status, and interactive controls
3. **Heartbeat System**: Proactive health checking, queue processing, and scheduled task triggering
4. **Streamlined CLI/UX**: Reduced cognitive load through simplified options and better defaults
5. **Improved Documentation**: Clear examples, use cases, and troubleshooting guides

## Specific Implementation Tasks
1. **Create streamlined autonomous coding command** (`auto-code`) that combines plan → approve → execute with smart defaults
2. **Enhance TUI with real-time health dashboard** showing system metrics, queue status, and active processes
3. **Improve heartbeat system** to intelligently prioritize and schedule tasks based on system health
4. **Simplify recall/scoring system** with presets and better defaults
5. **Consolidate tool policies** into clearer access levels
6. **Remove redundant CLI commands** and merge overlapping functionality
7. **Improve error handling and recovery** in autonomous flows
8. **Add intelligent task queuing** based on priority and system readiness

## Planning Artifacts
- Update TODO.md with v0.2.0 specific tasks
- Maintain CHANGELOG.md for tracking changes
- Update README.md with simplified usage patterns
- Keep STATE.md current with architectural decisions
- Document simplifications in UPGRADE_GUIDE.md

## Implementation Approach
- Work in release/0.2.0 branch
- Fix build/test errors immediately
- Commit and push after each milestone
- Focus on value-driven iterations
- Maintain backward compatibility where practical