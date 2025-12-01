import * as fc from 'fast-check';

/**
 * Generator for valid email addresses
 */
export const emailArbitrary = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
      minLength: 1,
      maxLength: 20,
    }),
    fc.constantFrom('gmail.com', 'yahoo.com', 'outlook.com', 'example.com')
  )
  .map(([local, domain]) => `${local}@${domain}`);

/**
 * Generator for user roles
 */
export const roleArbitrary = fc.constantFrom('student', 'developer', 'professional');

/**
 * Generator for subscription tiers
 */
export const tierArbitrary = fc.constantFrom('free', 'premium', 'enterprise');

/**
 * Generator for subscription status
 */
export const subscriptionStatusArbitrary = fc.constantFrom('active', 'expired', 'cancelled');

/**
 * Generator for user profiles
 */
export const userProfileArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
  goals: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 10 }),
  experience: fc.constantFrom('beginner', 'intermediate', 'advanced', 'expert'),
});

/**
 * Generator for subscriptions
 */
export const subscriptionArbitrary = fc.record({
  tier: tierArbitrary,
  status: subscriptionStatusArbitrary,
  startDate: fc.date(),
  endDate: fc.option(fc.date(), { nil: undefined }),
});

/**
 * Generator for valid passwords
 */
export const passwordArbitrary = fc.string({ minLength: 8, maxLength: 100 });

/**
 * Generator for task status
 */
export const taskStatusArbitrary = fc.constantFrom('todo', 'in_progress', 'done');

/**
 * Generator for task priority
 */
export const taskPriorityArbitrary = fc.constantFrom('low', 'medium', 'high');

/**
 * Generator for interview types
 */
export const interviewTypeArbitrary = fc.constantFrom('dsa', 'system_design', 'behavioral');

/**
 * Generator for difficulty levels
 */
export const difficultyArbitrary = fc.constantFrom('easy', 'medium', 'hard');

/**
 * Generator for project difficulty
 */
export const projectDifficultyArbitrary = fc.constantFrom('beginner', 'intermediate', 'advanced');

/**
 * Generator for skill levels
 */
export const skillLevelArbitrary = fc.constantFrom('beginner', 'intermediate', 'advanced');

/**
 * Generator for learning goals
 */
export const learningGoalsArbitrary = fc.array(
  fc.constantFrom(
    'Learn React',
    'Master TypeScript',
    'Understand Node.js',
    'Learn Python',
    'Master Data Structures',
    'Learn System Design',
    'Understand Databases',
    'Learn DevOps',
    'Master Testing',
    'Learn Cloud Computing'
  ),
  { minLength: 1, maxLength: 5 }
);

/**
 * Generator for project technologies
 */
export const projectTechnologiesArbitrary = fc.array(
  fc.constantFrom(
    'React',
    'TypeScript',
    'Node.js',
    'Express',
    'PostgreSQL',
    'MongoDB',
    'Python',
    'Django',
    'Vue.js',
    'Angular',
    'Next.js',
    'GraphQL',
    'Docker',
    'AWS'
  ),
  { minLength: 1, maxLength: 5 }
);

/**
 * Generator for resume text content
 */
export const resumeTextArbitrary = fc.record({
  name: fc.string({ minLength: 5, maxLength: 50 }),
  email: emailArbitrary,
  phone: fc.option(
    fc.tuple(
      fc.constantFrom('+1', '+44', '+91', ''),
      fc.integer({ min: 100, max: 999 }),
      fc.integer({ min: 100, max: 999 }),
      fc.integer({ min: 1000, max: 9999 })
    ).map(([prefix, area, exchange, number]) => 
      `${prefix}${prefix ? '-' : ''}${area}-${exchange}-${number}`
    ),
    { nil: undefined }
  ),
  skills: fc.array(
    fc.constantFrom(
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
      'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'REST', 'GraphQL'
    ),
    { minLength: 1, maxLength: 10 }
  ),
  experience: fc.array(
    fc.record({
      company: fc.string({ minLength: 5, maxLength: 30 }),
      position: fc.string({ minLength: 5, maxLength: 40 }),
      startYear: fc.integer({ min: 2010, max: 2023 }),
      endYear: fc.option(fc.integer({ min: 2015, max: 2024 }), { nil: undefined }),
    }),
    { minLength: 0, maxLength: 5 }
  ),
  education: fc.array(
    fc.record({
      institution: fc.string({ minLength: 10, maxLength: 50 }),
      degree: fc.constantFrom('Bachelor', 'Master', 'PhD', 'Associate'),
      field: fc.string({ minLength: 5, maxLength: 40 }),
      year: fc.integer({ min: 2000, max: 2024 }),
    }),
    { minLength: 0, maxLength: 3 }
  ),
  summary: fc.option(fc.string({ minLength: 50, maxLength: 300 }), { nil: undefined }),
});

/**
 * Generator for job preferences
 */
export const jobPreferencesArbitrary = fc.record({
  jobTitles: fc.array(
    fc.constantFrom(
      'Software Engineer',
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'DevOps Engineer',
      'Data Engineer',
      'Senior Developer',
      'Junior Developer'
    ),
    { minLength: 1, maxLength: 3 }
  ),
  skills: fc.array(
    fc.constantFrom(
      'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js',
      'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'REST', 'GraphQL',
      'CSS', 'HTML', 'Kubernetes', 'CI/CD'
    ),
    { minLength: 1, maxLength: 8 }
  ),
  locations: fc.option(
    fc.array(
      fc.constantFrom(
        'San Francisco',
        'New York',
        'Austin',
        'Seattle',
        'Remote',
        'Boston',
        'Los Angeles'
      ),
      { minLength: 1, maxLength: 3 }
    ),
    { nil: undefined }
  ),
  experienceLevel: fc.option(
    fc.constantFrom('Junior', 'Mid-level', 'Senior', 'Lead'),
    { nil: undefined }
  ),
});

/**
 * Convert resume data to formatted text
 */
export function formatResumeText(data: {
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    startYear: number;
    endYear?: number;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: number;
  }>;
  summary?: string;
}): string {
  let text = `${data.name}\n\n`;
  text += `Email: ${data.email}\n`;
  if (data.phone) {
    text += `Phone: ${data.phone}\n`;
  }
  text += '\n';

  if (data.summary) {
    text += `SUMMARY\n${data.summary}\n\n`;
  }

  if (data.skills.length > 0) {
    text += `SKILLS\n${data.skills.join(', ')}\n\n`;
  }

  if (data.experience.length > 0) {
    text += `EXPERIENCE\n`;
    for (const exp of data.experience) {
      const endYear = exp.endYear || 'Present';
      text += `${exp.position} at ${exp.company}\n`;
      text += `${exp.startYear} - ${endYear}\n`;
      text += `Description of work experience\n\n`;
    }
  }

  if (data.education.length > 0) {
    text += `EDUCATION\n`;
    for (const edu of data.education) {
      text += `${edu.degree} in ${edu.field}\n`;
      text += `${edu.institution}\n`;
      text += `Graduated: ${edu.year}\n\n`;
    }
  }

  return text;
}
