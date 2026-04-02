---
description: [Neural Stability - How to add new features safely]
---

# Neural Stability Workflow

When adding a new feature or component to NexusAI, follow these steps to prevent crashes and ensure long-term stability:

1. **Isolation Check**:
   Wrap the top-level feature component in `SafeComponentWrapper` inside `AppShell.tsx`.
   
2. **Icon Audit**:
   Scan the new component for any `lucide-react` imports.
   Replace all direct icon usage with `IconSafe`.
   ```tsx
   import { IconSafe } from "@/components/ui/icon-safe";
   // Use: <IconSafe icon={YourIcon} />
   ```

3. **Store Validation**:
   If the component consumes a global store, add defensive checks for all functions extracted from the store.
   
4. **Hydration Safety**:
   Ensure `dynamic(() => ..., { ssr: false })` is used for any components that rely on browser-only APIs or heavy external libraries.

5. **Diagnostic Verification**:
   After coding, verify that a manual throw inside the component triggers the `LocalErrorBoundary` but keeps the sidebar and header functional.

---
// turbo-all
