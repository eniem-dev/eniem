interface PostHeaderProps {
  date: string;
  title: string;
  description?: string;
  tags?: string[];
}

export function PostHeader({ date, title, description, tags }: PostHeaderProps) {
  return (
    <header className="mb-8">
      <time dateTime={date} className="text-sm text-muted-foreground">
        {new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-4 text-xl text-muted-foreground">{description}</p>
      )}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
