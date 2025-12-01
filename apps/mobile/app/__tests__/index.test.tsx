import React from 'react';
import { render, screen } from '@testing-library/react-native';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the auth store
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      profile: {
        name: 'Test User',
      },
    },
  }),
}));

// Import after mocks
import DashboardScreen from '../(tabs)/index';

describe('DashboardScreen', () => {
  it('renders welcome message', () => {
    render(<DashboardScreen />);
    expect(screen.getByText(/Welcome back/)).toBeTruthy();
  });

  it('renders feature list', () => {
    render(<DashboardScreen />);
    expect(screen.getByText('Learning Roadmap')).toBeTruthy();
    expect(screen.getByText('Project Generator')).toBeTruthy();
    expect(screen.getByText('Interview Prep')).toBeTruthy();
    expect(screen.getByText('Job Matching')).toBeTruthy();
    expect(screen.getByText('Productivity')).toBeTruthy();
  });

  it('renders progress section', () => {
    render(<DashboardScreen />);
    expect(screen.getByText(/Your Progress/)).toBeTruthy();
  });
});
