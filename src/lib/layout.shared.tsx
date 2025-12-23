import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className="size-6"
            aria-label="Eniem logo"
          >
            <rect width="256" height="256" fill="none" />
            <polyline
              points="32 176 128 232 224 176"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
            />
            <polyline
              points="32 128 128 184 224 128"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
            />
            <polygon
              points="32 80 128 136 224 80 128 24 32 80"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="16"
            />
          </svg>
          Eniem
        </span>
      ),
      url: '/docs',
    },
    links: [
      {
        text: 'Get Eniem',
        url: 'https://eniem.dev',
      },
      {
        text: 'GitHub',
        url: 'https://github.com/eniem-dev/eniem-boilerplate',
      },
    ],
    githubUrl: 'https://github.com/eniem-dev/eniem-boilerplate',
  };
}
