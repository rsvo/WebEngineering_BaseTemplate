import { useEffect, type ReactElement } from 'react';
import { boot } from './js/boot';

export function App(): ReactElement {
  // Temporary bridge: the imperative search, comment and bear code from
  // Playground 1 still drives the DOM rendered below. It is replaced by React
  // state and effects in the following tasks.
  useEffect(() => {
    void boot();
  }, []);

  return (
    <>
      <div className="header">
        <font size="7">Welcome to our wildlife website</font>
      </div>

      <div className="nav">
        <ul>
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Our team</a>
          </li>
          <li>
            <a href="#">Projects</a>
          </li>
          <li>
            <a href="#">Blog</a>
          </li>
        </ul>

        <form className="search">
          <input type="search" name="q" placeholder="Search query" />
          <input type="submit" value="Go!" />
        </form>
      </div>

      <main>
        <article>
          <font size="6">The trouble with Bears</font>
          <br />
          <br />
          By Evan Wild
          <br />
          <br />
          Tall, lumbering, angry, dangerous. The real live bears of this world
          are proud, independent creatures, self-serving and always on the hunt
          for food.
          <br />
          <br />
          <font size="5">Types of bear</font>
          <br />
          <br />
          <table>
            <thead>
              <tr>
                <td>Bear Type</td>
                <td>Coat</td>
                <td>Adult size</td>
                <td>Habitat</td>
                <td>Lifespan</td>
                <td>Diet</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Wild</td>
                <td>Brown or black</td>
                <td>1.4 to 2.8 meters</td>
                <td>Woods and forests</td>
                <td>25 to 28 years</td>
                <td>Fish, meat, plants</td>
              </tr>
              <tr>
                <td>Urban</td>
                <td>North Face</td>
                <td>18 to 22</td>
                <td>Condos and coffee shops</td>
                <td>20 to 32 years</td>
                <td>Starbucks, sushi</td>
              </tr>
            </tbody>
          </table>
          <font size="5">Habitats and Eating habits</font>
          <br />
          <br />
          Wild bears eat a variety of meat, fish, fruit, nuts, and other
          natually growing ingredients...
          <br />
          <br />
          <img src="/media/wild-bear.jpg" alt="Wild bear in forest" />
          <br />
          <br />
          Urban (gentrified) bears on the other hand have largely abandoned the
          old ways...
          <br />
          <br />
          <img src="/media/urban-bear.jpg" alt="Urban bear near buildings" />
          <br />
          <br />
          <font size="5">Mating rituals</font>
          <br />
          <br />
          Bears are romantic creatures by nature...
          <br />
          <br />
          <audio controls>
            <source src="/media/bear.mp3" type="audio/mp3" />
            <source src="/media/bear.ogg" type="audio/ogg" />
            <p>
              It looks like your browser doesn&apos;t support HTML5 audio
              players.
            </p>
          </audio>
          <aside>
            <font size="5">About the author</font>
            <br />
            <br />
            Evan Wild is an unemployed plumber from Doncaster...
          </aside>
          <section className="comments">
            <div className="show-hide">Show comments</div>
            <p className="error-message" hidden></p>

            <div className="comment-wrapper" hidden>
              <font size="6">Add comment</font>
              <form className="comment-form">
                <div className="flex-pair">
                  Your name:
                  <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex-pair">
                  Your comment:
                  <input
                    type="text"
                    name="comment"
                    id="comment"
                    placeholder="Enter your comment"
                  />
                </div>
                <div>
                  <input type="submit" value="Submit comment" />
                </div>
              </form>

              <font size="6">Comments</font>
              <ul className="comment-container">
                <li>
                  <p>Bob Fossil</p>
                  <p>
                    Oh I am so glad you taught me all about the big brown angry
                    guys...
                  </p>
                </li>
              </ul>
            </div>
          </section>
          <section className="more_bears">
            <font size="5">More Bears</font>
            <p className="error-message" hidden></p>
          </section>
        </article>

        <div className="secondary">
          <font size="6">Related</font>
          <ul>
            <li>
              <a href="#">The trouble with Bees</a>
            </li>
            <li>
              <a href="#">The trouble with Otters</a>
            </li>
            <li>
              <a href="#">The trouble with Penguins</a>
            </li>
            <li>
              <a href="#">The trouble with Octopi</a>
            </li>
            <li>
              <a href="#">The trouble with Lemurs</a>
            </li>
          </ul>
        </div>
      </main>

      <footer>
        <p>©Copyright 2050 by nobody. All rights reversed.</p>
      </footer>
    </>
  );
}
