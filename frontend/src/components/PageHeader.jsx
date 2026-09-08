/* ---------------------------------------------------------------
   PageHeader — consistent header for every page.
   props: {title, description, breadcrumb, actions}
   --------------------------------------------------------------- */
export default function PageHeader({ title, description, breadcrumb, actions }) {
  return (
    <div className="mb-7">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
        <div>
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="mb-1.5 text-[12.5px] font-medium uppercase tracking-wider text-[var(--slate)]">
              {breadcrumb.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1.5 text-[var(--sage-line)]">/</span>}
                  {i === breadcrumb.length - 1 ? (
                    <span className="font-semibold text-[var(--brass)]">{c}</span>
                  ) : (
                    c
                  )}
                </span>
              ))}
            </div>
          )}
          {title && (
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--ink)]">
              {title}
            </h1>
          )}
          {description && <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--slate)]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="h-[3px] w-full bg-[var(--sage-line)]">
        <div className="h-full w-24 bg-[var(--brass)]" />
      </div>
    </div>
  );
}
