import { useState, type FormEvent, type ReactElement } from 'react';

interface SearchFormProps {
  initialQuery: string;
  onSearch: (query: string) => void;
}

export function SearchForm({
  initialQuery,
  onSearch,
}: SearchFormProps): ReactElement {
  const [draft, setDraft] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSearch(draft.trim());
  }

  return (
    <form className="search" onSubmit={handleSubmit}>
      <input
        type="search"
        name="q"
        placeholder="Search query"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <input type="submit" value="Go!" />
    </form>
  );
}
