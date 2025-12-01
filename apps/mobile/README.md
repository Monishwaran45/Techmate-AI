# TechMate AI - Mobile Application

React Native mobile application for TechMate AI platform built with Expo Router.

## Features Implemented

### Authentication (Task 13.1)
- **Login Screen**: Email/password authentication with OAuth placeholders
- **Signup Screen**: User registration with role selection (student/developer/professional)
- **Onboarding Flow**: 3-step wizard for profile setup (name, skills, goals)

### Navigation (Task 13.2)
- **Tab Navigation**: 5 main tabs (Dashboard, Learning, Projects, Interview, More)
- **Stack Navigation**: Nested navigation for each feature area
- **Protected Routes**: Automatic routing based on authentication state
- **Drawer-style More Menu**: Profile and settings access

### Learning Screens (Task 13.3)
- **Roadmap Screen**: View personalized learning path with milestone tracking
- **Concept Chat**: AI mentor for explaining technical concepts
- **Progress Tracker**: Visual progress indicators and statistics
- **Tech News**: Placeholder for tech news feed

### Project Screens (Task 13.4)
- **Project Ideas**: Browse AI-generated project suggestions with difficulty filters
- **Architecture Viewer**: Display project structure and tech stack
- **Code Preview**: Syntax-highlighted code viewer

### Interview Screens (Task 13.5)
- **Mock Interview Chat**: Interactive interview sessions with AI
- **Question Bank**: Browse practice questions by difficulty
- **Results Screen**: View past interview performance and feedback

### Job Screens (Task 13.6)
- **Resume Upload**: File upload interface with tips
- **Score Display**: ATS score breakdown with suggestions
- **Job Matches**: Ranked job recommendations with match reasons

### Productivity Screens (Task 13.7)
- **Task List**: Create and manage tasks with status tracking
- **Focus Timer**: Pomodoro-style timer with customizable durations
- **Notes**: Create and browse notes with timestamps

### Offline Support (Task 13.8)
- **Offline Queue**: Automatic queuing of mutations when offline
- **Local Storage**: AsyncStorage for data persistence
- **Sync Indicator**: Visual indicator showing online/offline/syncing status
- **Cached Responses**: GET requests return cached data when offline
- **Auto-sync**: Automatic synchronization when connection is restored

## Tech Stack

- **Framework**: React Native with Expo
- **Router**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **API Client**: Axios with offline support
- **Storage**: AsyncStorage
- **Network Detection**: @react-native-community/netinfo

## Project Structure

```
apps/mobile/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Dashboard
│   │   ├── learning.tsx
│   │   ├── projects.tsx
│   │   ├── interview.tsx
│   │   └── more.tsx
│   ├── learning/                 # Learning feature screens
│   ├── projects/                 # Project feature screens
│   ├── interview/                # Interview feature screens
│   ├── jobs/                     # Job matching screens
│   ├── productivity/             # Productivity screens
│   └── _layout.tsx               # Root layout with auth routing
├── src/
│   ├── components/               # Reusable components
│   │   └── SyncIndicator.tsx
│   ├── lib/                      # Utilities
│   │   ├── api.ts                # API client with offline support
│   │   ├── offline-queue.ts      # Offline request queue
│   │   ├── storage.ts            # Local storage utilities
│   │   └── useOfflineSync.ts     # Offline sync hook
│   └── store/                    # Zustand stores
│       └── authStore.ts
└── package.json

```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd apps/mobile
npm install
```

### Running the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Environment Variables

Create a `.env` file:

```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## Key Features

### Offline-First Architecture
The app implements a robust offline-first architecture:
- All mutations are queued when offline
- GET requests return cached data
- Automatic sync when connection is restored
- Visual sync indicator for user feedback

### Authentication Flow
- Automatic token persistence
- Protected route navigation
- Seamless onboarding experience

### Responsive Design
- Optimized for various screen sizes
- Native-feeling interactions
- Consistent design system using NativeWind

## API Integration

All screens integrate with the backend API endpoints:
- `/auth/*` - Authentication
- `/learning/*` - Learning features
- `/projects/*` - Project generation
- `/interview/*` - Interview prep
- `/jobs/*` - Job matching
- `/tasks`, `/notes`, `/timer` - Productivity

## Future Enhancements

- Push notifications
- Biometric authentication
- Dark mode support
- File picker for resume upload
- Voice recording for interviews
- Offline data persistence for all features
- Background sync

## Requirements Validated

This implementation satisfies:
- **Requirement 1.1, 1.2**: User authentication and login
- **Requirement 2.1, 2.2, 2.4**: Learning mentor features
- **Requirement 3.1, 3.2, 3.3**: Project generation
- **Requirement 4.1, 4.2, 4.4**: Interview preparation
- **Requirement 5.1, 5.2, 5.4**: Job matching
- **Requirement 6.1, 6.2, 6.3**: Productivity tools
- **Requirement 7.1, 7.5**: Cross-platform UI
- **Requirement 8.3**: Offline support and synchronization
