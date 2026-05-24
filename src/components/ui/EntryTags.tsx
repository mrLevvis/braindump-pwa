/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface EntryTagsProps {
  tags: readonly string[];
}

/* -------------------------------------------------------------------------- */
/*                              Styling Tokens                                */
/* -------------------------------------------------------------------------- */

const TAG_PILL_CLASS = [
  'rounded-md',
  'bg-white/10',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
  'px-2.5',
  'py-1',
  'text-[10px]',
  'font-semibold',
  'tracking-wide',
  'text-white/70',
].join(' ');

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export const EntryTags = ({ tags }: Readonly<EntryTagsProps>) => {
  if (tags.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className={TAG_PILL_CLASS}>
          {tag}
        </span>
      ))}
    </div>
  );
};
