import { useState, type FormEvent, type ReactElement } from 'react';

interface SearchFormProps {
  onSearch: (query: string) => void;
}

export function SearchForm({ onSearch }: SearchFormProps): ReactElement {
  const [draft, setDraft] = useState('');

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
