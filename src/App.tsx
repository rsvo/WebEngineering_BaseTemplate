import { useEffect, type ReactElement } from 'react';
import { Article } from './features/article/Article';
import { BearsSection } from './features/bears/BearsSection';
import { CommentsSection } from './features/comments/CommentsSection';
import { Footer } from './features/layout/Footer';
import { Header } from './features/layout/Header';
import { NAV_LINKS, RELATED_LINKS } from './features/layout/links';
import { NavBar } from './features/layout/NavBar';
import { RelatedLinks } from './features/layout/RelatedLinks';
import { SearchForm } from './features/search/SearchForm';
import { boot } from './js/boot';

export function App(): ReactElement {
  // Temporary bridge: the imperative search and comment code from Playground 1
  // still drives the DOM rendered by the components. It is replaced by React
  // state and events in the following tasks.
  useEffect(() => {
    boot();
  }, []);

  return (
    <>
      <Header />
      <NavBar links={NAV_LINKS}>
        <SearchForm />
      </NavBar>

      <main>
        <Article>
          <CommentsSection />
          <BearsSection />
        </Article>
        <RelatedLinks links={RELATED_LINKS} />
      </main>

      <Footer />
    </>
  );
}
