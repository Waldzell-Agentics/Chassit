# 📦 Retrieval‑Orchestration Library v0.1 – Implementation Specification

## 1 Product framing
- **Consumers:** Autonomous/semi‑autonomous agents that parse Markdown+YAML and may execute fenced `bash` or `js`.
- **Primary value:** Technical‑research orchestrations (framework comparisons, library audits, etc.).
- **Secondary showcase:** Stand‑alone “YC‑Application Reviewer” MCP server.
- **Distribution:** Public Git repo + Smithery registry.

## 2 Three‑layer orchestration stack
1. **primitives/** – Single‑phase snippets reusable across orchestrations  
   – `search_and_cache`, `sentiment_rollup`, `competitor_picker`
2. **patterns/** – 6‑phase, multi‑tool workflows (Brand Audit, Repo Audit, …)  
   – Import primitives via ```include:primitives/...```
3. **solutions/** – One‑off, highly specific orchestrations (YC reviewer, OSS‑licence risk)

orchestrations/
  primitives/
  patterns/
  solutions/

### File anatomy
```yaml
---
id: repo-audit
layer: pattern                 # primitive | pattern | solution
version: 0.1.0
parameters:
  target_repo: string
  depth: enum[pulse,standard,deep] = standard
agentic: bash                   # none | bash | js
outputs: [markdown, json:scorecard]
---

3 Curated toolbelt (v1)

Tier	Tools
Core	web_search_exa, github_search_exa, research_paper_search_exa
Context	reddit_search_exa, company_research_exa
Optional	linkedin_search_exa, youtube_search_exa

4 Quality & evaluation

Numeric QA gates emitted with every run:

Gate	Threshold	Action
source_count	≥ 3	block
recency	all ≤ 90 days when query is current	warn
sentiment_balance	positive + negative ≥ 70 %	warn
cross_tool_agree	same claim appears in ≥ 2 tools	confidence boost

Example result envelope:

{ "confidence": 0.87, "requires_human_eye": false }

5 Sandbox execution — container‑use reference driver
	1.	Default: spawn container-use stdio --env <id‑timestamp> for every orchestration declaring agentic: bash|js.  ￼
	2.	Isolation: Disposable Git worktree branch + Dagger‑managed container per run  ￼.
	3.	Audit: Commands and I/O recorded; inspect with cu watch, docker logs, or Git notes  ￼ ￼.
	4.	Wrapper sketch (Node):

import { execa } from 'execa';
const env = `${id}-${Date.now()}`;
const cu = execa('container-use', ['stdio', '--env', env], { stdio: 'pipe' });
agentPipe.connect(cu.stdin, cu.stdout);


	5.	Config knobs (env or YAML):
	•	SANDBOX_DRIVER = container-use | none | 
	•	SANDBOX_IMAGE = ubuntu:24.04
	•	SANDBOX_PRIVILEGED = false
	6.	Security defaults: Executes as non‑root; benefits from Docker’s rootless mode  ￼ ￼.

6 Server responsibilities (time‑neutral)

Area	Decision
Language	TypeScript + Node; polyglot workers optional.
Caching	Simple in‑process LRU; pluggable store interface for external caches.
Hosting	Docker image suitable for local use or Smithery registry.
Versioning	Git tags map to orchestration versions; ?version= query param selects them.

7 Task list (unordered)
	•	Scaffold repo structure and include: pre‑processor.
	•	Implement three primitives (search_and_cache, sentiment_rollup, competitor_picker).
	•	Port two existing technical‑research orchestrations into the patterns layer.
	•	Release the YC‑Application‑Reviewer solution.
	•	Wire numeric QA gates and expose confidence in output.
	•	Publish driver‑interface documentation so alternates can replace container‑use.
	•	Choose OSS license (MIT or Apache‑2) and decide CLA policy.

⸻

Implementation notes for the agent
	•	Container‑use relies on Dagger’s content‑addressed caching, so builds are reproducible across dev and CI  ￼ ￼.
	•	Running containers as a non‑root user mitigates daemon‑level privilege escalation risks  ￼ ￼.
	•	The Git worktree branch provides a cheap, inspectable snapshot for each run, avoiding full clones  ￼.
	•	Alternate sandboxes (e.g., Podman‑based MCP servers) can conform by exposing the same stdio contract  ￼.

End of spec — no schedules, SLAs, or performance targets included.