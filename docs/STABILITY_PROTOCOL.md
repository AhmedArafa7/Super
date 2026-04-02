# NexusAI Neural Stability Protocol (v1.0)

This document outlines the mandatory stability standards for the NexusAI ecosystem. These rules are designed to prevent global application crashes and ensure seamless updates.

## 1. Structural Isolation (The "Jail" Rule)
Any major feature or content node must be wrapped in the `SafeComponentWrapper`.
- **Reason**: Individual component failures must not propagate to the main application shell.
- **Implementation**:
```tsx
<SafeComponentWrapper name="FeatureName">
  <YourFeatureComponent />
</SafeComponentWrapper>
```

## 2. Universal Icon Shield
Never render `lucide-react` icons directly as components.
- **Reason**: React 19 compatibility and rebase-resilience.
- **Implementation**:
```tsx
// DO NOT DO THIS:
<Zap className="size-4" />

// ALWAYS DO THIS:
<IconSafe icon={Zap} className="size-4" />
```

## 3. Defensive Store Consumption
Always verify the existence of store properties, especially functions, before invocation.
- **Reason**: Prevents `TypeError: s is not a function` during rebase or store schema migrations.
- **Implementation**:
```tsx
const { initSync } = useStore();
useEffect(() => {
  if (typeof initSync === 'function') {
    initSync();
  }
}, [initSync]);
```

## 4. Localized Error Management
Use local `ErrorBoundary` patterns within complex views to provide "Retry" mechanisms without refreshing the whole page.

---
*Authorized by Antigravity Neural Architect.*
