# Agent Result Contract

Every subagent returns this compact structure.

```markdown
# Result

## Conclusion
Direct answer or recommendation.

## Evidence
- `path/to/file:line` — observed fact
- command and relevant outcome

## Uncertainty
- What remains unknown
- Confidence: high | medium | low

## Risks
- Failure mode and impact

## Recommended next action
One bounded action for the parent agent.

## Files changed
None for read-only roles, otherwise exact paths.
```

Do not return raw search dumps. Do not conceal contradictory evidence.
