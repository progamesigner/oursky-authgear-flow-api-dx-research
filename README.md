# Authgear Flow API DX Research

A demo for Authgear Flow API made with React + TypeScript + Vite.

## Get Started

```sh
npm install
npm run dev
```

## Development

To add new step in flows, update `src/FlowForm.tsx`:
1. Add new enum value to `FlowStep` enum
2. Add new state node to `FlowStepTypes` type (current state, possible states, state input, state output)
3. Implement and add new executor to `flows` map with new step
4. Implement and add new components
5. Add new switch-case branch to `FlowStepForm` component

Everything is typed and checked in TypeScript transpiling. The type `FlowStepTypes` defines possible transitions from each step (`FlowStep` enum) with typed input and output. The input will be passed to `FlowStepForm` component as `state`; the output will be the input type of `executeFlow`.
