import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/brands/logo-dark.svg"
            alt="Eniem"
            width={100}
            height={28}
            className="dark:hidden"
          />
          <Image
            src="/brands/logo-white.svg"
            alt="Eniem"
            width={100}
            height={28}
            className="hidden dark:block"
          />
        </>
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
