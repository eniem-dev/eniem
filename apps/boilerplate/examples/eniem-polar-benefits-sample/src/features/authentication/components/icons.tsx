interface IconProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function GitHubIcon({ className, width = "1em", height = "1em" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="currentColor"
        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
      />
    </svg>
  );
}

export function TwitterIcon({ className, width = "1.2em", height = "1.2em" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 448 512"
      className={className}
    >
      <path
        fill="currentColor"
        d="M64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64zm297.1 84L257.3 234.6L379.4 396h-95.6L209 298.1L123.3 396H75.8l111-126.9L69.7 116h98l67.7 89.5l78.2-89.5zm-37.8 251.6L153.4 142.9h-28.3l171.8 224.7h26.3z"
      />
    </svg>
  );
}

export function EthereumIcon({ className, width = "1.2em", height = "1.2em" }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 256 417"
      className={className}
    >
      <path
        fill="currentColor"
        d="m127.961 0l-2.795 9.5v275.668l2.795 2.79l127.962-75.638z"
      />
      <path
        fill="currentColor"
        d="m127.962 0l-127.962 212.32l127.962 75.639V154.158z"
      />
      <path
        fill="currentColor"
        d="m127.961 312.187l-1.575 1.92v98.199l1.575 4.6l128.038-180.32z"
      />
      <path fill="currentColor" d="m127.962 416.905v-104.718l-127.962-75.6z" />
      <path
        fill="currentColor"
        d="m127.961 287.958l127.96-75.637l-127.96-58.162z"
      />
      <path fill="currentColor" d="m0 212.32l127.96 75.638v-133.8z" />
    </svg>
  );
}