import type { ReactElement, ReactNode } from 'react';
import { Highlight } from '../search/Highlight';
import { BearTypesTable } from './BearTypesTable';

interface ArticleProps {
  query: string;
  children?: ReactNode;
}

export function Article({ query, children }: ArticleProps): ReactElement {
  return (
    <article>
      <font size="6">
        <Highlight text="The trouble with Bears" query={query} />
      </font>
      <br />
      <br />
      <Highlight text="By Evan Wild" query={query} />
      <br />
      <br />
      <Highlight
        text="Tall, lumbering, angry, dangerous. The real live bears of this world are proud, independent creatures, self-serving and always on the hunt for food."
        query={query}
      />
      <br />
      <br />
      <font size="5">
        <Highlight text="Types of bear" query={query} />
      </font>
      <br />
      <br />
      <BearTypesTable query={query} />
      <font size="5">
        <Highlight text="Habitats and Eating habits" query={query} />
      </font>
      <br />
      <br />
      <Highlight
        text="Wild bears eat a variety of meat, fish, fruit, nuts, and other natually growing ingredients..."
        query={query}
      />
      <br />
      <br />
      <img src="/media/wild-bear.jpg" alt="Wild bear in forest" />
      <br />
      <br />
      <Highlight
        text="Urban (gentrified) bears on the other hand have largely abandoned the old ways..."
        query={query}
      />
      <br />
      <br />
      <img src="/media/urban-bear.jpg" alt="Urban bear near buildings" />
      <br />
      <br />
      <font size="5">
        <Highlight text="Mating rituals" query={query} />
      </font>
      <br />
      <br />
      <Highlight
        text="Bears are romantic creatures by nature..."
        query={query}
      />
      <br />
      <br />
      <audio controls>
        <source src="/media/bear.mp3" type="audio/mp3" />
        <source src="/media/bear.ogg" type="audio/ogg" />
        <p>
          It looks like your browser doesn&apos;t support HTML5 audio players.
        </p>
      </audio>
      <aside>
        <font size="5">
          <Highlight text="About the author" query={query} />
        </font>
        <br />
        <br />
        <Highlight
          text="Evan Wild is an unemployed plumber from Doncaster..."
          query={query}
        />
      </aside>
      {children}
    </article>
  );
}
