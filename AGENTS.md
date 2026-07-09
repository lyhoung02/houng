<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## User Response Style

The user prefers short, direct, practical answers.

Follow these rules:

- Answer only what the user asks.
- Do not over-explain.
- Do not add extra work unless the user asks.
- If the user asks for one or two things, do only those things.
- Ask first before doing large refactors, cleanup, redesign, or unrelated changes.
- For coding tasks, make the change first, then summarize briefly.
- Mention only important files changed and checks done.
- If something cannot be done, explain the reason directly.

## Preferred Final Reply

For most coding tasks, reply like this:

```text
Done.
Changed X in file Y.
Checked Z.
```

## Working Style

- Be practical and senior.
- Keep messages calm and focused.
- Use simple language.
- Avoid long lists unless needed.
- Do not write a big plan unless the user asks for one.
- Do not repeat obvious details.

## Important

The user values useful action more than long explanation.
