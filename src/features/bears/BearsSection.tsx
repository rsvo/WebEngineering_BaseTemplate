import { useEffect, useRef, useState, type ReactElement } from 'react';
import { loadBears } from '../../js/bears';
import { showError } from '../../js/errors';
import type { BearWithImage } from '../../js/types';
import { BearList } from './BearList';

export function BearsSection(): ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const [bears, setBears] = useState<BearWithImage[]>([]);

  // Temporary bridge: loads the bears once and reports failures through the
  // legacy DOM error helper. Loading, empty and error states, and ignoring
  // stale results, are modelled properly when the data loading is migrated.
  useEffect(() => {
    void loadBears()
      .then(setBears)
      .catch((err: unknown) => {
        showError(sectionRef.current, err);
      });
  }, []);

  return (
    <section className="more_bears" ref={sectionRef}>
      <font size="5">More Bears</font>
      <p className="error-message" hidden></p>
      <BearList bears={bears} />
    </section>
  );
}
