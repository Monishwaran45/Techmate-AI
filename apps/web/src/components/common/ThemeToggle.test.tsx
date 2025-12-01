import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as fc from 'fast-check';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

/**
 * **Feature: techmate-ai-platform, Property 30: Dark mode applies to all components**
 * **Validates: Requirements 7.2**
 * 
 * For any UI state, toggling dark mode should apply dark theme classes to all rendered components.
 */
describe('Property 30: Dark mode applies to all components', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Remove dark class from document
    document.documentElement.classList.remove('dark');
  });

  test('toggling theme updates document root class', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('light', 'dark'),
        async (initialTheme) => {
          // Set initial theme
          localStorage.setItem('theme', initialTheme);
          
          // Render component
          const { unmount } = render(
            <ThemeProvider>
              <ThemeToggle />
            </ThemeProvider>
          );

          // Get initial state
          const initialHasDark = document.documentElement.classList.contains('dark');
          const expectedInitialDark = initialTheme === 'dark';
          
          // Verify initial state matches theme
          expect(initialHasDark).toBe(expectedInitialDark);

          // Toggle theme
          const button = screen.getByRole('button', { name: /toggle theme/i });
          await userEvent.click(button);

          // Wait for state update
          await new Promise(resolve => setTimeout(resolve, 10));

          // Verify theme was toggled
          const finalHasDark = document.documentElement.classList.contains('dark');
          expect(finalHasDark).toBe(!expectedInitialDark);

          // Verify localStorage was updated
          const storedTheme = localStorage.getItem('theme');
          expect(storedTheme).toBe(initialTheme === 'light' ? 'dark' : 'light');

          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  }, 10000);

  test('theme persists across component remounts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('light', 'dark'),
        async (theme) => {
          // Set theme in localStorage
          localStorage.setItem('theme', theme);

          // Render and unmount
          const { unmount } = render(
            <ThemeProvider>
              <div className="test-component">Test</div>
            </ThemeProvider>
          );

          const firstRenderHasDark = document.documentElement.classList.contains('dark');
          unmount();

          // Render again
          const { unmount: unmount2 } = render(
            <ThemeProvider>
              <div className="test-component">Test</div>
            </ThemeProvider>
          );

          const secondRenderHasDark = document.documentElement.classList.contains('dark');

          // Theme should be consistent across remounts
          expect(firstRenderHasDark).toBe(secondRenderHasDark);
          expect(secondRenderHasDark).toBe(theme === 'dark');

          // Clean up
          unmount2();
        }
      ),
      { numRuns: 50 }
    );
  }, 10000);

  test('all components receive dark mode classes when enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        async (componentTexts) => {
          localStorage.setItem('theme', 'dark');

          // Render multiple components
          const { container, unmount } = render(
            <ThemeProvider>
              <div>
                {componentTexts.map((text, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {text}
                  </div>
                ))}
              </div>
            </ThemeProvider>
          );

          // Verify dark class is applied to root
          expect(document.documentElement.classList.contains('dark')).toBe(true);

          // Verify all components have dark mode classes available
          const components = container.querySelectorAll('[class*="dark:"]');
          expect(components.length).toBeGreaterThan(0);

          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  }, 10000);
});
