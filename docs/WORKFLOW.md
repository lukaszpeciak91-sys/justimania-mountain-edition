# Incremental Workflow

1. Inspect the latest `main`.
2. Read the authoritative documents in `docs/`.
3. Implement only the current task scope.
4. Run relevant checks and a production build.
5. Update documentation only when a contract changes.
6. Create a pull request.
7. Provide a concise implementation summary.
8. Provide exact test evidence.
9. Do not silently expand scope.

Later UI, art, and gameplay tasks preserve frozen contracts unless their task explicitly changes them. Do not perform opportunistic refactors, add unrelated dependencies, or generate final assets inside unrelated programming tasks. Post-PR audits should compare the implementation to the canonical contracts before the next increment begins.
