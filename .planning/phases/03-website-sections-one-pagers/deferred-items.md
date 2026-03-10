# Deferred Items - Phase 03

## Pre-existing Issues (out of scope)

### brand-compliance.cjs crashes on website context
- **Found during:** 03-02 Task 2 validation
- **Issue:** `brand-compliance.cjs` references `rules.colors.website.allowed_hex` at line 65, but `rules.json` has no `colors.website` key. Crashes with TypeError on any non-social file.
- **Impact:** Cannot run brand-compliance validation on .liquid section files until fixed.
- **Fix:** Add `colors.website.allowed_hex` to rules.json, or restructure the context-aware hex checking in brand-compliance.cjs.
