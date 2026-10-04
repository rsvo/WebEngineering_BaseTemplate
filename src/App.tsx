import { useState, type ReactElement } from 'react';
import { Article } from './features/article/Article';
import { BearsSection } from './features/bears/BearsSection';
import { CommentsSection } from './features/comments/CommentsSection';
import { Footer } from './features/layout/Footer';
import { Header } from './features/layout/Header';
import { NAV_LINKS, RELATED_LINKS } from './features/layout/constants';
import { NavBar } from './features/layout/NavBar';
import { RelatedLinks } from './features/layout/RelatedLinks';
import { SearchForm } from './features/search/SearchForm';

export function App(): ReactElement {
  // The search form and the article content both need the query, so App,
  // their closest common owner, holds it.
  const [query, setQuery] = useState('');

  return (
    <>
      <Header />
      <NavBar links={NAV_LINKS}>
        <SearchForm onSearch={setQuery} />
      </NavBar>

      <main>
        <Article query={query}>
          <CommentsSection query={query} />
          <BearsSection query={query} />
        </Article>
        <RelatedLinks links={RELATED_LINKS} />
      </main>

      <Footer />
    </>
  );
}
