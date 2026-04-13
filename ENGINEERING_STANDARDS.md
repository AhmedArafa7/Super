# Nexus Professional Engineering Standards

This document defines the mandatory engineering pillars for the Nexus platform development. Every feature and component must adhere to these standards to ensure a "Sovereign, Production-Grade" ecosystem.

## 1. Authenticity & Functional Integrity
- **No Placeholders**: Decorative or "fake" data is prohibited in functional components.
- **Real Metrics**: System telemetry (FPS, timers, stats) must be derived from actual hardware/browser APIs.
- **Fail-Safe**: If data is missing, use a professional "Fallback" or "Loading State" instead of dummy values.

## 2. Architecture & Modularization
- **Logic Separation**: All complex business logic must reside in custom **React Hooks**.
- **Pure UI**: Components should focus on rendering and user interaction, not state computation.
- **Atomic Components**: Break large files into smaller, manageable, and reusable pieces.

## 3. Strict Type Safety
- **No `any` Policy**: Every variable, prop, and function signature must have a clearly defined interface/type.
- **Strong Contracts**: Use TypeScript to enforce data contracts between different system layers (Store -> Hook -> Component).

## 4. Professional UX & Aesthetics
- **Premium Design**: Adhere to the "Rich Aesthetics" guidelines (Glassmorphism, Vibrant Harmonies, Micro-animations).
- **Universal Responsiveness**: Every feature must work flawlessly on Desktop and Mobile.
- **Zero Distraction**: Implement "Zen Mode" or "Immersive UI" for focused activities.

## 5. Performance & Resource Management
- **Memoization**: Always use `useMemo` and `useCallback` for expensive computations to prevent redundant re-renders.
- **Memory Safety**: Ensure all timeouts, observers, and event listeners are properly cleaned up in `useEffect` returns.
- **Frame-Ready**: Animations should be GPU-accelerated and smooth (60 FPS target).

## 6. Maintenance & Scalability
- **Self-Documenting Code**: Meaningful naming for functions and variables.
- **Architecture over Hacks**: Prefer robust architectural patterns (e.g., Centralized Stores) over quick local hacks.
- **Permanent Records**: Major architectural decisions must be documented in the Knowledge Base.

---

*Verified and adopted by Antigravity AI & The Nexus Founder.*
