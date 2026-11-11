import type { ReactElement } from 'react';
import { Route, Routes, useSearchParams } from 'react-router';
import { useBears } from './features/bears/useBears';
import { Footer } from './features/layout/Footer';
import { Header } from './features/layout/Header';
import { NAV_LINKS, RELATED_LINKS } from './features/layout/constants';
import { NavBar } from './features/layout/NavBar';
import { RelatedLinks } from './features/layout/RelatedLinks';
import { SearchForm } from './features/search/SearchForm';
import { BearDetailPage } from './pages/BearDetailPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App(): ReactElement {
  // The search term lives in the URL (?q=...), so a search can be shared,
  // reloaded, and reached with the back button.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();

  // Loaded once in App (not in HomePage), so returning from a detail page
  // shows the list immediately instead of loading it again.
  const { state: bearsState, reload } = useBears();

  function handleSearch(nextQuery: string): void {
    setSearchParams(nextQuery === '' ? {} : { q: nextQuery });
  }

  return (
    <>
      <Header />
      <NavBar links={NAV_LINKS}>
        <SearchForm key={query} initialQuery={query} onSearch={handleSearch} />
      </NavBar>

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                bearsState={bearsState}
                onRetry={reload}
                query={query}
              />
            }
          />
          <Route
            path="/bears/:bearId"
            element={<BearDetailPage query={query} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <RelatedLinks links={RELATED_LINKS} />
      </main>

      <Footer />
    </>
  );
}
