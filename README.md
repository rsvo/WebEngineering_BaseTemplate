# Web Engineering Coding Playground Template

This repository is designed as the foundation for coding playgrounds in the Web Engineering course. It offers a structured space for experimenting with and mastering various web development technologies and practices. 
The project is based on [this](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/Accessibility_troubleshooting) repository from MDN.

The project introduces a lot of code smells for you to tackle. 
**Let's get coding!**

## Submission Details and Deadlines
* Coding playgrounds are **individual** work
* Use this base template to create your project repository.
* Submit your repository link once.
* Each playground must be submitted via a new branch in that repository (last commit within deadline will be graded).
  * Naming conventions of branch: <code>playground-1</code>, <code>playground-2</code>, ...
* Each playground consists of 5 tasks, 1 point each. A task is complete only when both its implementation work and its theory question have been answered.

### Submission Deadlines
* [1st Playground](#1-js-playground): 14.09.2026
* [2nd Playground](#2-dependency--and-build-management-playground): 28.09.2026
* [3rd Playground](#3-migrate-to-a-frontend-framework): 04.10.2026
* [4th Playground](#4-backend-for-frontend-and-http-apis): 12.11.2026
* other Playgrounds TBA by Thomas Berger

## Features

- Wonderful UI-design :heart_eyes:
- Loads bear data using [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) :bear:
  - Original Wikipedia Page can be found [here](https://en.wikipedia.org/wiki/List_of_ursids)
- Worst JS coding practices :cold_sweat:
- No Build and Dependency Management at all :fire:


# Coding Playground Description

## 1. JS Playground
The provided base project template contains bad coding and templating practices and bugs for you to fix. Take a look into the component files and get a grasp of the inner workings of the provided project. The app should provide the requirements described below. Some are implemented poorly or do not work at all. 

### App Requirements
* On page load the app requests the Wikipedia API to extract bear information from Wikipedia's [list of ursids](https://en.wikipedia.org/wiki/List_of_ursids). The page then renders the provided image, the common name, the scientific name and it's range.
  * the bears should be ordered in the same order and number (no duplicates) as in the corresponding Wiki page.
  * if there is no image available, the app should show a placeholder image.
* Users are able to toggle the comment section.
* Users are able to leave their name and a comment (both should not be empty).
* Users are able to search the web page contents using a search query, whereby only the html contents with tag <code>article</code> should be highlighted.

### Tasks
Fix the application code and support them with short code examples where useful.

#### Task 1: Introduce ES modules

Split the code into separate script files and use ES modules (`import`/`export`). Choose module boundaries that separate concerns and avoid circular dependencies.

**Theory question:** How does an ES module differ from a classic script with respect to scope, strict mode, loading, and bindings? Explain why the module boundaries you chose make the application easier to maintain.

**Answer:**

Classic scripts and ES modules behave pretty differently:

- **Scope:** A normal `<script>` just dumps everything into the global scope, so a `var` in one file can overwrite something on `window`. A module has its own scope. If something is not exported, other files can't see it.
- **Strict mode:** Modules are always in strict mode. Classic scripts are not, unless you add `"use strict"`.
- **Loading:** A classic script runs as soon as the browser hits the tag (unless you use `defer`/`async`). Modules wait until the HTML is parsed and they also load their imports first, so `<script type="module" src="js/main.js">` can sit at the bottom and still work.
- **Bindings:** `import` is not a copy. If `wikipedia.js` updates an exported value, the importer sees the new value, but you can't do `fetchUrsidWikitext = somethingElse` in the importing file.

The old inline script is now split into `main.js`, `wikipedia.js`, `bears.js`, `search.js` and `comments.js`. API stuff is in `wikipedia.js`, bear parsing/rendering uses that, and search/comments are their own files because they don't need each other.

```js
// wikipedia.js
export function fetchUrsidWikitext() { /* fetch from the wiki API */ }

// bears.js
import { fetchUrsidWikitext } from './wikipedia.js';
```

This is easier to maintain because the Wikipedia calls can change without touching the comment form, and nothing imports in a circle (`main` -> features, `bears` -> `wikipedia`). If everything stayed in one file you'd have to scroll through search, comments and fetch code just to fix one thing.

#### Task 2: Correct the application behavior

Fix the semantic and functional issues according to the app requirements. Use appropriate DOM queries and event handling, and ensure the bear list has the same order and number of entries as the source page.

**Theory question:** Describe event propagation (capturing, target, and bubbling). Where could event delegation be useful in this application, and what trade-off would it introduce?

**Answer:**

When you click something, the event does not just fire on that one node. It travels in three phases:

- **Capturing:** the event goes down from `window` / `document` toward the target (`window` -> `html` -> `body` -> ... -> parent). Listeners registered with `addEventListener(..., true)` run here.
- **Target:** the event is at the element that was actually clicked (or submitted). Listeners on that element run.
- **Bubbling:** the event goes back up the same path. This is the default for `click` and `submit`, so a listener on a parent still sees the event.

```js
// comments.js: the click hits the .show-hide div, then bubbles to .comments, body, ...
showHideBtn.addEventListener('click', function() { /* toggle */ });
```

**Event delegation** means you listen on a parent and look at `event.target` instead of binding each child. That would help on `.comment-container`: new comments are added later, so a single listener could handle a future "delete comment" button without attaching a new handler every submit. Same idea for `.more_bears` if bear cards became clickable after the Wikipedia fetch.

The trade-off is that the handler has to figure out which child was meant (`target.closest('li')` or similar), so it is easier to react to the wrong nested element, and you pay a bit of work on every click inside that parent. For one toggle button and one form, a direct listener is simpler, which is why comments and search still bind to those specific elements.

#### Task 3: Make failures explicit

Add error handling with `try`/`catch` and show useful, user-facing error messages. Check whether each image can be loaded and render a placeholder when it cannot. Do not represent a failed request as valid empty data.

**Theory question:** How do synchronous exceptions and rejected promises travel through this application? Explain where errors should be caught and why catching every error at its source can make failures harder to diagnose.

**Answer:**

A **synchronous exception** is a normal `throw`. It jumps up the call stack until a `try`/`catch`. `parseBearRows` throws if the wikitext is empty; that `throw` is still inside the `.then` callback, so the `try`/`catch` in `initBears` can show the message. If nobody catches it, the module script dies and the user sees nothing.

A **rejected promise** does not use that stack. `fetch` failing, `res.json()` failing, or `throw` inside `readWikipediaJson` all reject the promise. The rejection travels along the chain (`fetchUrsidWikitext` -> `initBears`) until `.catch`. A `try`/`catch` around `initBears()` in `main.js` does **not** see it, because `initBears` only starts the request and returns immediately.

```js
fetchUrsidWikitext()
  .then(function(wikitext) {
    try {
      return extractBears(wikitext); // sync throws land here
    } catch (err) {
      showError(moreBears, err);
    }
  })
  .catch(function(err) {
    showError(moreBears, err); // network / HTTP / missing wikitext land here
  });
```

Catch at the **feature boundary** (`initBears`, the search/comment handlers): log or show one useful message, then stop. That is where you still know what the user was trying to do.

Catching every error at its source is a problem when the source returns a "success" value instead of failing. If `fetchUrsidWikitext` swallowed a 404 and returned `''`, `extractBears` would look like "Wikipedia has no bears". Per-image failures are different: one missing file should become a placeholder, not an empty list. The list request itself must stay a real error.

#### Task 4: Refactor asynchronous control flow

Replace promise callback chains with `async`/`await` and refactor suitable callbacks to arrow functions. Run independent asynchronous operations concurrently where doing so is safe.

**Theory question:** Explain the relationship between `async`/`await`, promises, the microtask queue, and the browser event loop. Also explain why an arrow function is not always an interchangeable replacement for a regular function, particularly regarding `this`.

**Answer:**

`async`/`await` is still promises. An `async` function always returns a promise. `await` pauses only that function until the promise settles, then the rest of the function is queued as a **microtask**.

The **browser event loop** works with two queues:

- **Macrotasks** (the task queue): click/submit handlers, `setTimeout`, parsing, rendering. The loop takes one of these, runs it until the call stack is empty, then continues.
- **Microtasks**: promise `.then` / `.catch` callbacks and every `await` continuation. After the current stack is empty, the loop drains the **microtask queue completely** before the next macrotask or paint.

So `await fetchUrsidWikitext()` does not freeze the page. The current task finishes, the user can still click "Show comments", and only later (as a microtask) does `initBears` continue and render the list.

```js
export async function initBears() {
  var wikitext = await fetchUrsidWikitext();
  await extractBears(wikitext);
}

var urls = await Promise.all(bears.map(resolveImageUrl));
```

`Promise.all` starts every image lookup together. Those requests are independent, so waiting for them one after another would only add latency. The wikitext request has to stay first, because the file names come from that parse.

An **arrow function is not always a drop-in replacement**. A normal `function` gets `this` from how it is called. An arrow has no own `this`; it uses the enclosing scope.

```js
// a regular listener: the browser sets this to the form
form.addEventListener('submit', function(e) {
  var searchKey = this.q.value.trim();
});

// an arrow would make this undefined in a module, so the form is used instead
form.addEventListener('submit', (e) => {
  var searchKey = form.q.value.trim();
});
```

#### Task 5: Remove remaining code smells

Find and eliminate the remaining bad coding practices. Consider scope, accidental globals, mutation and shared references, function responsibilities, naming, duplication, and DOM update patterns. Document each relevant finding, why it is problematic, and how you fixed it below.

**Theory question:** Select one of your refactorings and explain how JavaScript scope, closures, references, or prototypes caused the original risk. State how you verified that your refactoring preserved behavior.

**Answer:**

`var` is function-scoped, not block-scoped. Every closure created in the same function shares that one binding. The old image loop was the risky shape: a single `i` that async callbacks read later, after the loop has already moved on.

```js
// one i for the whole function; every .then sees the final index
for (var i = 0; i < bears.length; i++) {
  fetchImageUrl(bears[i].fileName).then(function(url) {
    renderBear(container, bears[i]); // i is already bears.length
  });
}
```

`map` gives each callback its own `bear` parameter. That parameter is a new binding per call, so the closure cannot pick up a neighbor's row. `const` / `let` would also stop a `for` index from leaking out of the block.

```js
const bearsWithImages = await Promise.all(bears.map(withResolvedImage));
```

`withResolvedImage` also returns a **new object**. The parsed row is not mutated, so `parseBearRows` and the renderer do not share a leftover `image` property.

> **What bad coding practices did you find? Why is it a bad practice and how did you fix it?**

**1. `var` and an exported mutable API URL**

`var` is function-scoped and hoisted. A later `for (var i = ...)` plus an async callback can make every callback see the last `i`. `export var baseUrl` also published a live, writable binding that nothing else needed.

```js
// before
export var baseUrl = "https://en.wikipedia.org/w/api.php";

// after
const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
```

Module-level values are now `const`. Locals that get reassigned use `let`.

**2. One function doing parse, fetch, and render**

`extractBears` parsed wikitext, fetched images, and wrote to the DOM. `initBears` also queried `.more_bears`, so the selector lived in two places. That mixes data work with view work and makes failures harder to place.

```js
const bears = parseBearRows(wikitext);
const bearsWithImages = await Promise.all(bears.map(withResolvedImage));
renderBearList(moreBears, bearsWithImages);
```

Parse returns new objects. `withResolvedImage` returns a new object with `image` instead of doing `bear.image = url` on the parsed row.

**3. `innerHTML` and a shared `/g` regex**

Search built marks with `innerHTML`, so article text was parsed as HTML. A `<` in the page could become a real element. The walker also reused one `/gi` regex. `.test()` / `.exec()` write `lastIndex` onto that same object, so the next text node can start mid-string unless the index is reset.

```js
// before
span.innerHTML = node.nodeValue.replace(regex, '<mark class="highlight">$1</mark>');

// after
mark.textContent = match[0];
fragment.appendChild(mark);
```

Highlights are now `mark` elements with `textContent`. `lastIndex` is set back to `0` before each node.

**4. Dual state and inline DOM styling**

Comments kept a `commentsVisible` boolean and also set `style.display`. Those can disagree. Bear images used `img.style.width` instead of CSS, and each card was appended on its own (extra layout work).

```js
// before
commentsVisible = !commentsVisible;
commentWrapper.style.display = commentsVisible ? 'block' : 'none';

// after (initial hidden is in the HTML)
commentWrapper.hidden = !commentWrapper.hidden;
```

The wrapper starts as `<div class="comment-wrapper" hidden>`. The button only toggles that flag. Bear image size lives in `.bear img`. New cards go into a `DocumentFragment` and then into the page once.

**5. Leftover outdated DOM helpers**

`Array.prototype.slice.call(node.childNodes)` and `node.replaceWith.apply(node, replacements)` are the old way to turn array-likes into arrays. `Array.from` / a `for...of` over `childNodes` is enough, and `replaceWith` can take a fragment.


## 2. Dependency- and Build Management Playground
Build the application with ``npm`` and a build and a dependency management tool of your choice (e.g. [Vite](https://vitejs.dev/), [Webpack](https://webpack.js.org/), or others). 

### Tasks

#### Task 1: Establish the build

Set up the project with `npm` and a build tool of your choice (for example, Vite or Webpack). Keep source files separate from generated distribution files and commit the package-manager lockfile.

**Theory question:** Distinguish source, build, distribution, and deployment. What does your build tool do in development and in a production build, and why is the lockfile important for reproducibility?

**Answer:**

- **Source**: the canonical, human-authored, version-controlled code (`src/`, `index.html`, `package.json`), not necessarily directly executable in the target environment.
- **Build**: the deterministic transformation of source into artifacts (bundling, transpiling, minifying, hashing). Output (`dist/`) is derived state, reproducible from source plus toolchain, so it's excluded from version control.
- **Distribution**: the packaged, environment-agnostic result, self-contained assets requiring no build tooling, only a runtime (the browser) to execute.
- **Deployment**: placing distribution artifacts into a serving context reachable by users. It's orthogonal to building, since one artifact can be deployed to many targets without rebuilding.

The two modes exist because a browser can only fetch native ES modules one HTTP request at a time, which is irrelevant on localhost but costly over a real network. Dev and production optimize for different, conflicting goals, not the same goal at different speeds:

- **Dev** (`vite`): serves source files almost unchanged, over native ES modules. Each `import` triggers a separate request, resolved lazily by the dev server as the browser asks for it, with minimal per-file transformation (e.g., stripping TypeScript types). Nothing is bundled upfront, so the server starts in milliseconds regardless of project size. On save, only the changed module is pushed to the browser and swapped in place (Hot Module Replacement), preserving page state instead of forcing a full reload. This prioritizes iteration latency over transfer efficiency, which is the right tradeoff when the "network" is localhost.
- **Build** (`vite build`): delegates to Rollup, which statically analyzes the entire module graph starting at `index.html`, tree-shakes unused exports, bundles many small files into a handful of larger chunks, minifies the result, and content-hashes filenames for long-term cache immutability. This work is expensive but paid once at build time, producing static assets in `dist/` optimized for the opposite priority: minimal requests, minimal bytes, and maximal cacheability for every future visitor.

`package.json` declares version *ranges*, so dependency resolution can drift over time as transitive packages publish new compatible releases. `package-lock.json` pins exact versions and integrity hashes for the entire dependency tree, so `npm ci` yields a bit-for-bit identical install anywhere, anytime, turning "the build" from an underspecified, drifting process into a reproducible, verifiable one.

#### Task 2: Migrate to TypeScript

Use TypeScript as the primary development language and adapt the source files and configuration accordingly. Enable strict checking, model the application's domain data, and validate data received from external APIs before treating it as a typed value.

**Theory question:** TypeScript uses structural typing and erases types during compilation. Explain both concepts and why a compile-time type alone cannot guarantee the shape of a Wikipedia API response at runtime.

**Answer:**

**Structural typing**: TypeScript checks compatibility by comparing shape (which properties exist, with which types), not by declared name. Any object with matching fields satisfies an interface, no explicit `implements` needed.

**Type erasure**: all type annotations, interfaces, and generics exist only at compile time and are stripped when producing JavaScript (hence `noEmit: true` in our `tsconfig.json`, Vite/esbuild do the actual emission).

**Why this can't guarantee an API response's shape**: `res.json()` returns `Promise<any>`. Casting it with `as SomeInterface` is a compile-time-only claim, erasure means no runtime check ever verifies it. If Wikipedia changes its response format or returns malformed data, the cast still "succeeds," and the program reads properties that don't actually exist, producing a runtime failure the type checker never caught.

This is why `src/features/bears/wikipedia.ts` treats parsed JSON as `unknown` and validates it explicitly (`isRecord`, `typeof === 'string'`, `Array.isArray`) before trusting it as a typed value. The type system's guarantee only holds where external data is validated at the boundary; erasure means that validation must happen in our own runtime code, not in the types themselves.

#### Task 3: Add static analysis and formatting

Configure ESLint and Prettier using the rulesets below. Resolve all reported errors in the application code and avoid disabling rules without a written justification.

**Theory question:** What different problems do a linter, a formatter, and the TypeScript compiler detect? Give one concrete example for each from this project.

**Answer:**

- **Formatter**: purely stylistic, whitespace, line length, quote style. No understanding of behavior, only layout.
- **Linter**: correctness and best-practice patterns that are syntactically and structurally valid but semantically risky, catches intent-level issues a type system doesn't encode.
- **TypeScript compiler**: structural type correctness, whether the shapes of values match what operations on them require, independent of style or convention.

Each operates at a different layer (soundness, intent, layout) and none subsumes the others.

#### Task 4: Provide a consistent command interface

Define the following tasks within `npm scripts`:

  * `dev`: starts the development server.
  * `build`: runs the typescript compiler and bundles your application - bundling depends on your chosen build tool (e.g. Vite, Webpack) but typically bundles multiple files into one, applies optimizations like minification and obfuscation and outputs final results to a `dist` or `build` directory.
  * `lint`: runs ESLint on all  `.js` and `.ts` files in your projects `/src` directory.
  * `lint:fix`: runs and also fixes all issues found by ESLint.
  * `format`: formats all `.js` and `.ts` files in your projects `/src` directory.
  * `format:check`: checks if the files in the `/src` directory are formatted according to Prettier's rules.

The `build`, `lint`, and `format:check` commands must exit with a non-zero status when their checks fail.

**Theory question:** Why are stable, composable commands such as these useful as an interface for developers and CI? Explain idempotence and identify which of your scripts should be idempotent.

**Answer:**

**Why stable, composable commands matter**: they form a fixed interface (`dev`, `build`, `lint`, etc.) decoupled from implementation, so CI and developers invoke the same verbs regardless of which bundler/linter sits behind them, and swapping tools later doesn't break existing workflows.

**Idempotence**: running a command multiple times with no state change in between produces the same result as running it once.

- `lint`, `format:check`, `build` are idempotent: same input, same pass/fail verdict every time. Required for CI, safely re-runnable without producing a different result.
- `lint:fix`, `format` mutate files (converge to a fixed point after one run, but aren't side-effect-free), so they must never run in CI, only the non-mutating checks belong there.

#### Task 5: Enforce quality before integration

Configure a pre-commit hook that checks staged code using [husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged). Configure a continuous-integration workflow that installs dependencies from the lockfile and runs the non-mutating build, type, lint, and formatting checks for every push or pull request.

**Theory question:** Compare a local pre-commit hook with a CI quality gate. Why is CI still necessary when hooks are configured, and why should CI use non-mutating checks rather than automatically rewriting source files?

**Answer:** A pre-commit hook runs on the developer's machine, scoped to staged files, and can be skipped with `--no-verify`, left uninstalled after cloning, or simply never run if the developer forgets `npm install`. It is a convenience, not an enforcement mechanism. CI runs on a server, independent of any individual's local setup, on every push and pull request, so it is the only checkpoint that is guaranteed to execute and that applies uniformly to all contributors, including ones who bypassed or lack the hook.

CI must use non-mutating checks because its output is a verdict on code that has already been committed and pushed. If a pipeline silently rewrote source files, the passing result would no longer correspond to what was reviewed or merged, and the fix would exist only in the CI runner rather than in version control. CI should report pass or fail on the exact commit, not produce a different one.


**ESLint Configurations**

Use ESLint configs [standard-with-typescript](https://www.npmjs.com/package/eslint-config-standard-with-typescript) and [TypeScript ESLint Plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin).
Your `.eslintrc` file should have the following extensions:
```.eslintrc.yml
...
extends:
  - standard-with-typescript
  - plugin:@typescript-eslint/recommended
  - plugin:prettier/recommended
  - prettier
...
```
 
**Prettier Configurations**

Apply the following ruleset for Prettier:
``` .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 80
}
```

## 3. Migrate to a Frontend Framework
In this playground you will migrate your application to React with TypeScript while retaining the build and quality pipeline from Playground 2.

### Tasks

#### Task 1: Establish the React application

Add React (or another framework of your choice) to the existing Vite and TypeScript project and migrate the page entry point to a React root. Preserve the build, linting, formatting, and CI setup from Playground 2, adapting scripts and configuration where necessary.

**Theory question:** Contrast imperative DOM updates with React's declarative model. What happens during React's render, reconciliation, and commit phases, and why should code outside React not modify DOM nodes owned by the React root? If you chose not to use React, answer the same questions in the context of your chosen framework.

**Answer:**

**Imperative vs. declarative:** Imperative code spells out the steps to change the DOM (create a node, append it, update a label) and has to keep the DOM in sync with the data by hand, like `addComment` and `syncToggleLabel` in `comments.ts`. In React you describe what the UI looks like for the current state and React works out the DOM operations.

```tsx
// imperative: describe the steps
const li = document.createElement('li');
li.textContent = text;
list.appendChild(li);

// declarative: describe the result
<ul>{comments.map((c) => <li key={c.id}>{c.text}</li>)}</ul>
```

**The phases:**

- **Render:** React calls the components (`App()`) and gets a tree of element objects. This must be pure and touches no DOM.
- **Reconciliation:** React diffs the new tree against the previous one (same type at the same position is updated, a different type is replaced, keys identify list entries) and produces the minimal set of changes.
- **Commit:** React applies those changes to the real DOM, then runs effects. Our temporary `boot()` runs here, since only now do the elements it queries exist.

**Why outside code must not touch React-owned DOM:** React keeps its own model of what it put into `#root` and applies only differences, without re-reading the DOM. If other code adds, replaces, or removes nodes, the model and the DOM diverge, and later updates can be lost or throw (e.g. `removeChild` on a node that is gone). `search.ts` and `comments.ts` do exactly that to the page `App` renders. This only works because `App` has no state and never re-renders, so the imperative code is replaced in the following tasks.

#### Task 2: Design the component tree

Decompose the interface into components organised by feature. Use props where appropriate, keep rendering pure, and render bear collections with stable keys.

**Theory question:** Explain how component boundaries and typed props act as contracts. What makes a key stable, why does React need keys during reconciliation, and why is an array index unsuitable when list entries can change order?

**Answer:**

**Contracts:** A component boundary defines what goes in (props) and what comes out (UI). Callers do not depend on the internals, so those can change freely. Typed props make the contract checked by the compiler: a caller that omits a prop or passes the wrong type does not compile. The check exists only at compile time, so external data (the Wikipedia response) still has to be validated first.

```tsx
interface BearCardProps {
  bear: BearWithImage;
}

<BearCard key={bear.binomial} bear={bear} />   // <BearCard /> would not compile
```

**Stable keys:** A key is stable if it identifies the same entity in every render: it comes from the data (not from the position or `Math.random()`) and is unique among siblings. `bear.binomial` fits because `parseBearRows` removes duplicates.

**Why React needs keys:** During reconciliation React matches the new list against the previous one. With keys it matches entries by identity and keeps, moves, inserts, or removes the right components and DOM nodes. Without keys it can only compare by position.

**Why not the index:** The index is a position, not an identity. After a reorder, insert, or removal, an index points to a different entry, so React reuses the component (and its state) for the wrong data. Here `BearCard` holds `imageFailed`, which would stick to the wrong bear.

#### Task 3: Model state and interaction

Implement the comment toggle, comment form, and search behavior with React events and state. Use controlled inputs, immutable updates, and derived values rather than duplicate state. Lift state only to the closest common owner that needs it.

**Theory question:** Distinguish props, stored state, and derived values. Explain why direct mutation can produce incorrect React behavior and when lifting state is preferable to introducing context.

**Answer:**

**Props, state, derived values:**

- **Props** are inputs a component receives from its parent and must not change (`query` in `CommentList`).
- **State** is data a component owns and that changes over time. React remembers it between renders, and only its setter changes it (`isOpen` and `comments` in `CommentsSection`, the input values in `CommentForm`).
- **Derived values** are computed from props or state during render and are not stored: the toggle label and `hidden` come from `isOpen`, and the highlighted parts come from `splitByQuery(text, query)`. Storing them as extra state would create a second copy that can get out of sync.

**Why mutation breaks things:** React decides whether state changed by comparing references. After `comments.push(c); setComments(comments)` the reference is the same, so React skips the re-render and the new comment does not appear. It also changes a value that earlier renders and memoized children still hold, which breaks the idea that each render is a snapshot. Updates must create a new value:

```tsx
setComments((previous) => [...previous, { id: crypto.randomUUID(), author, text }]);
```

**Lifting state vs. context:** State is lifted to the closest common owner of the components that need it. The search query is needed by `SearchForm` and by the article content, so `App` holds it and passes it down. Data flow stays explicit, typed, and easy to trace. Context fits when many components at different depths need the same value and passing props would force many components in between to forward something they do not use (a theme, the current user). It makes dependencies implicit and re-renders every consumer on change. Here the query only travels a few levels, so lifting is the simpler choice.

#### Task 4: Load and represent remote data

Load and validate the bear data within the React application. Represent loading, success, empty, and error states explicitly; prevent stale requests from overwriting newer results; and retain the image fallback behavior from Playground 1.

**Theory question:** Why is fetching data a synchronization with an external system rather than part of pure rendering? Explain how cleanup or cancellation prevents race conditions when a component unmounts or a request becomes irrelevant.

**Answer:**

**Fetching is synchronization, not rendering:** Rendering must be pure: the same props and state always give the same JSX, with no side effects, because React may call a component several times, pause it, or discard the result. A network request is a side effect on a system React does not control. It takes time, can fail, and the answer can change between calls. If it ran during render, every re-render (for example on each search submit) would send new requests. So the render only describes the current state (`loading`, `success`, `empty`, `error`), and `useEffect` runs after the commit to synchronize that state with the external system.

**Race conditions:** A request outlives the render that started it. If the component unmounts, or a newer request starts (the "Try again" button), the old response can still arrive later. Responses do not arrive in the order they were sent, so an old one can overwrite a newer result, or write state for a component that is gone.

The effect's cleanup function closes this gap. React runs it on unmount and before the effect runs again. `useBears` creates one `AbortController` per run and aborts it in the cleanup:

```ts
useEffect(() => {
  const controller = new AbortController();
  void load(controller.signal);          // the signal is passed to every fetch
  return () => { controller.abort(); };  // unmount or next attempt
}, [attempt]);
```

`abort()` cancels the network requests, and after each `await` the code checks `controller.signal.aborted` before it calls `setState`. That second check matters because a response can arrive just before the abort. Each run owns its own controller, so an old run can only cancel and ignore itself.

#### Task 5: Add client-side routing and verify the migration

Add at least a list route and a bear-detail route using a stable bear identifier as a route parameter. Use query parameters for optional search/filter view state where appropriate. Verify that every requirement from Playground 1 still works and that all Playground 2 quality commands pass.

**Theory question:** Distinguish client-side rendering, a single-page application, and client-side routing. Compare route parameters with query parameters, and describe one benefit and one cost of the SPA architecture used here.

**Answer:**

**Three different things:**

- **Client-side rendering (CSR)** means the browser builds the UI with JavaScript. Our `index.html` only contains `<div id="root">`, and `createRoot(...).render(<App />)` creates the page in the browser. The opposite is server-side rendering, where the server sends finished HTML.
- **A single-page application (SPA)** is an architecture: the HTML document is loaded once, and later navigation never loads a new document. JavaScript swaps the view and fetches data with `fetch`. CSR is where rendering happens, while "SPA" is about not reloading the document, so the two are related but not the same.
- **Client-side routing** is the mechanism inside an SPA that maps the URL to what is shown. React Router changes the address with the History API (`pushState`) and listens for back/forward, without asking the server. `<Link to="/bears/sun-bear">` changes the URL and the matching `<Route>` renders.

**Route parameters vs. query parameters:** A route parameter is part of the path and identifies *which* resource is shown: `/bears/:bearId` is required, and without it a different route matches. A query parameter is optional state that changes *how* a page is viewed: `/?q=panda` is the same route with a search applied. It can be missing, and several can be combined. That is why the bear identifier is a route parameter and the search term is a query parameter (`useParams` vs. `useSearchParams`).

**One benefit:** Navigation does not reload the page, and state and data stay in memory. The bears are loaded once in `App` and shared, so going from the list to a detail page causes no new request.

**One cost:** The server only has one real page, so a deep link such as `/bears/sun-bear` must be answered with `index.html` (a fallback rule), otherwise a reload or a shared link gives a 404. The Vite dev server does this by itself, but plain static hosting has to be configured for it.

## 4. Backend for Frontend and HTTP APIs
In this playground the repository becomes an npm workspace with two apps: the React app from Playground 3 (`apps/web`) and a Fastify API (`apps/api`) that the web app talks to.

### Running the project

| Command | What it does |
| --- | --- |
| `npm install` | installs both workspaces from the shared `package-lock.json` |
| `npm run dev` | starts the API (`tsx watch`, restarts on change) and Vite (HMR) in parallel; Vite proxies `/api` to the API |
| `npm run build` / `lint` / `format:check` | run the check in every workspace (`-w apps/web` or `-w apps/api` for one) |
| `docker compose up --build` | builds both images and serves the web app on http://localhost:8080 and the API on http://localhost:3000 |
| http://localhost:3000/api/docs | Swagger UI of the API (OpenAPI 3.1 JSON at `/api/docs/json`); also reachable through the web app's origin |

```
apps/
  web/   React + Vite (Playground 3), served by nginx in Docker
  api/   Fastify + TypeScript (strict, ESM), compiled with tsc
```

Environment variables (all optional): `PORT` (API port, default `3000`), `HOST` (default `0.0.0.0`), `LOG_LEVEL` (default `info`), `API_PROXY_TARGET` (Vite proxy target, default `http://localhost:3000`), `WIKIPEDIA_API_URL` (default `https://en.wikipedia.org/w/api.php`), `UPSTREAM_TIMEOUT_MS` (default `5000`), `ENABLE_DEBUG_ROUTES` (adds `GET /api/debug/error`; default on, off when `NODE_ENV=production`, i.e. in Docker), `CORS_ORIGINS` (comma-separated origins allowed to call the API cross-origin, e.g. `http://localhost:4173`; default none). For the web build: `VITE_API_BASE_URL` (absolute API URL for a build served from another origin; default `/api`). If ports 3000/8080 are taken on the host, override the published ports with `API_PORT=3300 WEB_PORT=8380 docker compose up --build`.

### Tasks

#### Task 1: Set up the API workspace

Use npm workspaces with `apps/web` (the React app) and `apps/api` (Fastify, TypeScript strict, ESM). `GET /health` returns JSON with status, version and uptime. Provide a Dockerfile for both apps and a `compose.yaml`; `npm run dev` runs both with hot reload and Vite proxies `/api`. Extend ESLint, Prettier, Husky and CI from Playground 2 to both workspaces.

**Theory question:** Node's event loop: why does one slow synchronous operation delay every request? What is a health endpoint for, and who calls it?

**Answer:**

**The event loop:** Node runs all JavaScript of a process on a single thread. I/O (sockets, files, timers) is handed to the operating system or libuv's thread pool, and when it completes, a callback is put into a queue. The event loop takes one callback at a time from those queues and runs it to completion; only when the call stack is empty can it pick the next one. Nothing preempts running JavaScript.

**Why one slow synchronous operation delays everyone:** While a handler does synchronous work (a CPU-heavy loop, `JSON.parse` of a huge body, `crypto.pbkdf2Sync`, `fs.readFileSync`, a catastrophic regex), the thread is busy and the loop cannot run any other callback. Incoming connections are accepted by the OS but their handlers, other requests' `await` continuations, and timers all wait. One request taking 2 s of CPU time adds up to 2 s to *every* concurrent request, including `/health`. Async I/O is fine because the waiting happens outside the thread; CPU work has to be kept short, split into chunks, or moved to a `worker_thread` or another service. In `apps/api/src/routes/health.ts` the `readFileSync` of `package.json` therefore runs once at startup, never per request.

**What a health endpoint is for:** It lets something outside the process ask "are you alive and able to serve?" without knowing the domain API. `GET /health` is cheap, has no side effects, is not cached (`cache-control: no-store`), and reports `status`, the running `version` (which build is deployed?) and `uptime` (a small value means the process was restarted recently). It deliberately does not call Wikipedia: if an upstream outage made the API "unhealthy", an orchestrator would restart a perfectly working process.

**Who calls it:** machines, not users. Here Docker does: the `healthcheck` in `compose.yaml` calls it every 10 s, and `web` only starts once `api` is `healthy`; the CI smoke test calls it after `docker compose up --wait`. In production, Kubernetes liveness/readiness probes, load balancers (they stop routing to failing instances) and uptime monitors call it. This ties back to the event loop: if the loop is blocked, `/health` times out too, and the container is reported unhealthy.

#### Task 2: Move the Wikipedia call behind a BFF

Provide `GET /api/bears` and `GET /api/bears/:id`, fetched and parsed server-side. Send a descriptive User-Agent (Wikimedia policy) and use a timeout on the upstream call. Return a normalised, typed `Bear` (id = stable slug of the binomial name), validated with zod. On upstream failure answer 502 or 504, never an empty list; the browser no longer talks to Wikipedia.

**Implementation** (`apps/api/src/bears/`):

- `wikipedia.ts` calls the MediaWiki API with a User-Agent naming the app, its version and the repository as contact, and `AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)`. Responses are validated with zod. Unreachable host, non-2xx, invalid JSON, a MediaWiki `error` object or an unexpected shape become a 502 (`UpstreamUnavailableError`); a timeout becomes a 504 (`UpstreamTimeoutError`).
- `parse.ts` turns the wikitext into bears. The rows only contain abbreviated names (`U. arctos`), so the genus of the enclosing species table is used to rebuild the full binomial (`Ursus arctos`), and the id is its slug (`ursus-arctos`). The Playground 3 id `u-arctos` was ambiguous (`U.` could be any genus) and is no longer used.
- `service.ts` resolves all images with **one** batched `imageinfo` request (640 px thumbnails instead of the originals) and caches successful results for 5 minutes; concurrent cache misses share one upstream request. Zero parsed bears is a 502, not `[]`. A failed image lookup only degrades to `imageUrl: null` (the frontend shows its placeholder).
- `routes.ts` declares zod schemas for params and responses: an invalid id is a 400, an unknown id a 404, and responses that would violate the `Bear` contract cannot be sent.

The web app no longer contains any Wikipedia code: `useBears` calls `/api/bears`, the detail page calls `/api/bears/:id`, and `api/client.ts` validates the responses with zod. Only the image files themselves are still loaded by the browser from Wikimedia's image CDN (`upload`/`thumb.wikimedia.org`) via `<img>`; proxying image bytes through our API would only add latency and bandwidth.

Try it: `curl -i localhost:3000/api/bears/ursus-arctos` (200), `/api/bears/ursus-nope` (404), `/api/bears/Not_A_Slug` (400); start the API with `WIKIPEDIA_API_URL=https://en.wikipedia.invalid/w/api.php` for a 502 (the UI shows its error state with "Try again") or with `UPSTREAM_TIMEOUT_MS=1` for a 504.

**Theory question:** What is a BFF, and what moves from the browser to the server? Why is an empty 200 on upstream failure worse than a 502?

**Answer:**

**Backend for Frontend:** A BFF is a server-side layer that belongs to one specific frontend and is shaped by its needs. The browser talks only to its BFF, in the BFF's own vocabulary (`Bear`), and the BFF talks to the upstream systems (here Wikipedia) in theirs. It is not a general-purpose API for everyone; if a mobile app needed different data, it would get its own BFF.

**What moves from the browser to the server:**

- **Knowledge of the upstream:** URLs, query parameters, the wikitext format and the regex parsing. Before, every browser downloaded and parsed wikitext; now the browser receives a list of eight ready-to-render objects, and a change on Wikipedia's side is fixed in one place without redeploying the frontend.
- **Aggregation:** the browser used to send 1 + 8 requests to Wikipedia (list plus one per image); now it sends one request, and the server needs two upstream calls in total thanks to batching.
- **Validation and normalisation** of untrusted upstream data into a typed contract, and the mapping of upstream failures to meaningful status codes.
- **Operational concerns:** the User-Agent policy (a browser cannot even set `User-Agent`), timeouts, caching shared by all users (fewer requests to Wikimedia), logging of the real cause (`ENOTFOUND`) where operators can see it, and, if an upstream required one, the API key, which can never be kept secret in a browser.
- **Cross-origin access:** the `origin=*` parameter that Wikipedia needed for CORS is gone; the browser only talks to its own origin.

The browser keeps rendering, UI state and a light validation of our own contract.

**Why an empty 200 is worse than a 502:** A status code is a statement. `200 []` says "I succeeded, and there are no bears", which is false; the truth is "I do not know, because my upstream failed". With the lie:

- the UI shows "No bears were found" instead of an error with "Try again", so the user believes the data is gone, and nobody retries;
- caches (browser, CDN, our own cache) may store the 200 and keep serving the empty list after Wikipedia has recovered;
- monitoring and alerts that count 5xx see 100 % success, so the outage is invisible to operators;
- clients cannot distinguish "empty" from "broken", which are different states with different handling (our `BearsGate` has both).

`502 Bad Gateway` says precisely "I am fine, but the server I depend on gave me no usable answer", `504 Gateway Timeout` says "it did not answer in time", and both differ from `500` ("I have a bug"). Clients can show an error and retry, caches do not store them as content, and dashboards show the outage.

#### Task 3: Design the comments API

Provide `GET` and `POST /api/bears/:id/comments` and `DELETE /api/comments/:commentId`. `POST` answers `201 Created` with `Location`, `DELETE` answers `204 No Content`. Validate with zod (author and text non-empty, sensible length limits): 400 for invalid input, 404 for unknown bears or comments. Store comments in memory (a `Map`) and connect the comment section of the React app.

**Implementation** (`apps/api/src/comments/`):

| Method and path | Success | Errors |
| --- | --- | --- |
| `GET /api/bears/:id/comments` | `200` list (oldest first, `[]` if none) | `400` invalid bear id, `404` unknown bear |
| `POST /api/bears/:id/comments` | `201` comment + `Location: /api/comments/{id}` | `400` invalid body, `404` unknown bear |
| `GET /api/comments/:commentId` | `200` comment | `400` not a UUID, `404` unknown comment |
| `DELETE /api/comments/:commentId` | `204` no body | `400` not a UUID, `404` unknown comment |

- `schema.ts`: the request body is a strict zod object: `author` 1-80 and `text` 1-1000 characters after trimming, unknown fields are rejected. The server assigns `id` (UUID), `bearId` and `createdAt`; the client cannot set them.
- `store.ts`: a `Map<commentId, Comment>`. Keying by comment id makes `DELETE /api/comments/:commentId` an O(1) lookup without knowing the bear; listing filters by `bearId`.
- `GET /api/comments/:commentId` exists so that the `Location` header points to something that can actually be fetched.
- Comments belong to a bear now, so the comment section moved from the home page to the bear detail page (`/bears/:bearId`). The form disables its submit button while a request is in flight, keeps the input if the request fails and shows the API's message; each comment has a delete button.

Try it (with the API on port 3000):

```sh
curl -i -X POST localhost:3000/api/bears/ursus-arctos/comments \
  -H 'content-type: application/json' -d '{"author":"Bob","text":"Big brown angry guy"}'   # 201 + Location
curl -i localhost:3000/api/bears/ursus-arctos/comments                                  # 200
curl -i -X POST localhost:3000/api/bears/ursus-arctos/comments \
  -H 'content-type: application/json' -d '{"author":"   ","text":""}'                     # 400
curl -i -X POST localhost:3000/api/bears/ursus-nope/comments \
  -H 'content-type: application/json' -d '{"author":"Bob","text":"Hi"}'                  # 404 (bear)
curl -i -X DELETE localhost:3000/api/comments/<id from Location>                         # 204
curl -i -X DELETE localhost:3000/api/comments/<same id>                                  # 404 (comment)
```

**Why comments survive a page reload but not an API restart:** The browser does not store comments at all; on every load the detail page asks the API for them again. The comments live in the `Map` inside the API process's memory, which outlives any number of page reloads. Restarting the API (`docker compose restart api`, or `tsx watch` restarting after a file change) starts a new process with a new, empty `Map`; nothing was written to disk. For the same reason, running two API replicas would give each its own different set of comments. Persisting them needs storage outside the process, such as a database.

**Theory question:** Safe, idempotent, cacheable methods. Why POST for creating, why must DELETE be idempotent, what happens when a client retries a POST?

**Answer:**

**The three properties** (RFC 9110, section 9.2):

- **Safe:** the client does not request any change of server state; it is read-only from the client's point of view. `GET`, `HEAD`, `OPTIONS`. Crawlers, prefetchers and link previews may call safe methods freely.
- **Idempotent:** sending the same request N times has the same *effect on the server* as sending it once. All safe methods, plus `PUT` and `DELETE`. `POST` and `PATCH` are not.
- **Cacheable:** a response may be stored and reused for later requests. Responses to `GET` and `HEAD` are cacheable by default; `POST` responses only with explicit freshness information and `Content-Location`, which almost no cache implements.

| Our route | Safe | Idempotent | Cacheable |
| --- | --- | --- | --- |
| `GET /api/bears/:id/comments` | yes | yes | yes |
| `POST /api/bears/:id/comments` | no | no | no |
| `DELETE /api/comments/:commentId` | no | yes | no |

**Why POST for creating:** The server chooses the new comment's identity (a UUID), so the client cannot know the new URL beforehand and cannot `PUT` to it. `POST` means "process this representation according to the target's own semantics", which for a collection means "add a new member". Two identical POSTs are allowed to create two comments, and they do. The `201 Created` response with `Location: /api/comments/{id}` then tells the client where the new resource lives. (The alternative would be a client-generated id with `PUT /api/comments/{id}`, which is idempotent, but makes the client responsible for unique ids.)

**Why DELETE must be idempotent:** A request can fail *after* the server processed it, for example when the connection drops before the response arrives. The client then cannot tell whether the delete happened. Because DELETE is idempotent, it may simply send it again: the end state is "the comment is gone" either way. The spec makes this a promise, so browsers, proxies and HTTP libraries are allowed to retry idempotent requests automatically. Idempotency is about the state, not the response: the first `DELETE` answers `204`, the second `404`, and both leave the server in the same state. The frontend treats a `404` on delete as success for that reason.

**What happens when a client retries a POST:** If the first POST was processed but its response was lost, the retry creates a **second, duplicate comment** with a different id. That is why browsers ask "Confirm form resubmission" on reload and never retry a POST automatically, and why `fetch` doesn't either. Mitigations: prevent accidental double submits (our form disables its button while a request is in flight), use POST/redirect/GET for classic forms, or make the creation idempotent with an `Idempotency-Key` header (the server remembers the key and replays the first response instead of creating again) or a client-chosen id with `PUT`.

#### Task 4: One error format for everything

Add typed error classes and one Fastify error handler that renders RFC 9457 `application/problem+json`: 400 with an `errors` array, 404, 502 or 504, and 500 without stack trace or internals. A request id `x-request-id` (generated or taken over) appears in the response, the log line and `instance`. The frontend parses problem responses and shows `detail`.

**Implementation** (`apps/api/src/errors.ts`, `apps/api/src/problems.ts`):

- **Typed errors:** `HttpError` is the base class for every error whose message is written *for the client*. `ValidationError` (400), `NotFoundError` (404), `UpstreamUnavailableError` (502) and `UpstreamTimeoutError` (504) are thrown by the routes and services, and `ClientError` wraps the 4xx errors Fastify raises itself (malformed JSON 400, 413, 415). The real cause (e.g. `ENOTFOUND en.wikipedia.invalid`, Wikipedia's own error text) is attached as `cause`, which is only logged.
- **One error handler** (`setErrorHandler`) turns *anything* thrown into a problem. It is an allow-list: only `HttpError`s and Fastify's own client errors are shown as they are. Everything else is treated as a bug and becomes a generic 500 whose `detail` is a fixed sentence. The not-found handler throws a `NotFoundError`, so unknown routes use the same format.
- **Request ids:** `genReqId` takes over an incoming `x-request-id` if it is a UUID and otherwise generates one (`crypto.randomUUID()`). Arbitrary values are not taken over, so clients cannot inject text into the logs. An `onRequest` hook sets the `x-request-id` response header on *every* response, including successful ones. Pino adds `requestId` to every log line of the request, and the problem carries it as `instance: "urn:uuid:<id>"` (RFC 9457 wants a URI there) and as a `requestId` member.
- **Logging:** 5xx are logged at `error` with the full error (message, stack, cause chain), 4xx at `info` with the problem only, since they are expected and not our fault.
- **Provoked 500:** `GET /api/debug/error` throws an error whose message contains a fake database password. The response shows none of it; the log does. The route only exists with `ENABLE_DEBUG_ROUTES` (on in development, off in production).
- **Frontend:** `apps/web/src/api/client.ts` parses problem responses leniently with zod into an `ApiError` (`status`, `title`, `detail` as the message, `requestId`, `errors`). If the body is not a problem (e.g. an HTML 502 page from nginx), it falls back to `The request failed (HTTP <status>).` and the id from the header. `messageFromError` adds `(Reference: <request id>)` to 5xx messages, and the comment form lists the field errors ("Comment must be at most 1000 characters.") and marks the affected input `aria-invalid`.

| Status | `type` | When | Extension members |
| --- | --- | --- | --- |
| 400 | [`validation-error`](#problem-type-validation-error) | a zod schema rejected params, query or body | `errors: [{ location, pointer, detail }]` |
| 400, 413, 415 | `about:blank` | malformed JSON, body too large, wrong content type | - |
| 404 | `about:blank` | unknown bear, comment or route | - |
| 500 | `about:blank` | any unexpected error (a bug) | - |
| 502 | [`upstream-unavailable`](#problem-type-upstream-unavailable) | Wikipedia unreachable or unusable answer | - |
| 504 | [`upstream-timeout`](#problem-type-upstream-timeout) | Wikipedia did not answer within `UPSTREAM_TIMEOUT_MS` | - |

Every problem additionally has `title`, `status`, `detail`, `instance` and `requestId`. For `about:blank` the `title` is the HTTP status phrase, as RFC 9457 prescribes.

Example:

```http
HTTP/1.1 400 Bad Request
x-request-id: 8f802d0d-9083-4119-b7a7-e2f16bac027e
content-type: application/problem+json; charset=utf-8

{
  "type": "https://github.com/rsvo/WebEngineering_BaseTemplate/blob/playground-4/README.md#problem-type-validation-error",
  "title": "Your request is not valid.",
  "status": 400,
  "detail": "The request has 2 invalid fields.",
  "instance": "urn:uuid:8f802d0d-9083-4119-b7a7-e2f16bac027e",
  "requestId": "8f802d0d-9083-4119-b7a7-e2f16bac027e",
  "errors": [
    { "location": "body", "pointer": "/author", "detail": "must not be empty" },
    { "location": "body", "pointer": "", "detail": "Unrecognized key: \"foo\"" }
  ]
}
```

Try it with Docker (the debug route is off in production, so enable it for the 500):

```sh
ENABLE_DEBUG_ROUTES=true docker compose up --build -d
curl -i -X POST localhost:3000/api/bears/ursus-arctos/comments \
  -H 'content-type: application/json' -d '{"author":"  ","text":"x","foo":1}'   # 400 + errors
curl -i localhost:3000/api/bears/ursus-nope                                    # 404
curl -i localhost:3000/api/debug/error \
  -H 'x-request-id: 11111111-2222-4333-8444-555555555555'                      # 500, id taken over
docker compose logs api | grep 11111111-2222-4333-8444-555555555555           # the log lines incl. stack
WIKIPEDIA_API_URL=https://en.wikipedia.invalid/w/api.php docker compose up -d api
curl -i localhost:3000/api/bears                                               # 502
UPSTREAM_TIMEOUT_MS=1 docker compose up -d api
curl -i localhost:3000/api/bears                                               # 504
```

The problem types are documented in [Problem types](#problem-types) below the tasks.

**Theory question:** Why exactly one error contract? Which information must never leave the server, and how do request ids connect a complaint to a log line?

**Answer:**

**Why exactly one error contract:** Errors are part of the API like successful responses, and clients have to handle them in code. With one contract, the client needs one parser (`toApiError`) that works for every route, for errors the framework raises (malformed JSON, unknown route) and for errors nobody planned for (a 500). Without it, every endpoint invents its own shape (`{ message }`, `{ error: { msg } }`, plain text, an HTML stack page), and every client needs a special case per endpoint; the missing cases show up as "[object Object]" or as an empty error message. A standard (RFC 9457) adds more: `status` and a stable `type` for code to branch on, `detail` written for humans, extension members such as `errors` for form fields, a media type (`application/problem+json`) by which generic tools and libraries recognise errors, and one schema that can be documented in OpenAPI (Task 5). Finally, a single handler is the single place that decides what leaves the server, which makes it possible to guarantee that nothing leaks.

**What must never leave the server:** everything that helps an attacker or exposes internals, and nothing of it helps the user:

- stack traces, source file paths and line numbers;
- messages of unexpected exceptions, which can contain SQL statements, connection strings, credentials, tokens or other users' data (our debug route's "db://admin:hunter2@..." is the example);
- framework, library and runtime names and versions, which make known vulnerabilities easy to look up;
- internal hostnames, IPs, ports, the topology behind the BFF, and the raw errors of upstream services (`ENOTFOUND`, Wikipedia's error codes);
- configuration, environment variables and secrets.

This API uses an allow-list instead of a deny-list: only messages of `HttpError`s, which were written for the client, are sent. Everything else becomes "An unexpected error occurred" with status 500, so a new kind of bug cannot leak by accident. The details go into the log, attached to the request id.

**How request ids connect a complaint to a log line:** Each request gets a unique, random id at the very start. Pino writes it as `requestId` into *every* log line of that request: "incoming request", the error with its stack and cause, "request completed". The same id is sent to the client in the `x-request-id` header and in the problem's `instance`/`requestId`, and the UI shows it as "Reference: ...". A user who reports "it failed, reference 6965e5b8-..." therefore gives the operator an exact search key: `docker compose logs api | grep 6965e5b8-...` (or a query in a log system) returns exactly this request's lines, including the stack trace the user never saw. Without the id, the operator would have to guess from a timestamp among thousands of requests. Because the id is a random UUID, it reveals nothing (no request count, no internals) and cannot be guessed. Taking over a valid incoming `x-request-id` allows the same id to be followed across several services (a proxy, the BFF, an upstream), which is the idea that distributed tracing (W3C `traceparent`, OpenTelemetry) generalises.

#### Task 5: CORS and the API contract

Serve the built web app from another origin (e.g. `vite preview` on port 4173 with an absolute API URL) and watch it fail. Add `@fastify/cors` with an allow-list from the environment, only the methods and headers you need. Watch the preflight of a DELETE and of a JSON POST in the network tab. Generate OpenAPI 3.1 from the zod schemas (`@fastify/swagger`) and serve it at `/api/docs`.

**Implementation:**

- **Web** (`apps/web/src/api/client.ts`): the API base URL is `VITE_API_BASE_URL` if set at build time, otherwise the same-origin `/api`. When `fetch` rejects (offline, or a response blocked by CORS), the UI shows "The server could not be reached." instead of the browser's bare "Failed to fetch".
- **CORS** (`apps/api/src/app.ts`, `config.ts`): `@fastify/cors` only allows the origins listed in `CORS_ORIGINS`; by default no origin is allowed, because the web app talks to the API through its own origin. Every entry must be an exact origin: `http://localhost:4173/` (trailing slash) or `*` stops the API at startup instead of silently never matching.

  | Option | Value | Why |
  | --- | --- | --- |
  | `origin` | the allow-list, compared exactly | only our own frontends may read responses |
  | `methods` | `GET, POST, DELETE` | the methods the API has; no `PUT`/`PATCH` |
  | `allowedHeaders` | `content-type` | the only non-safelisted header the app sends (`application/json`); `accept` is safelisted |
  | `exposedHeaders` | `x-request-id` | the UI reads it for its error reference; non-safelisted response headers are hidden from scripts otherwise |
  | `credentials` | `false` | the API uses no cookies or HTTP auth |
  | `maxAge` | `600` | the browser may reuse a preflight result for 10 minutes |

  The CORS headers are set in an `onRequest` hook, so error responses carry them too, and the cross-origin UI can read the problem details. `Vary: Origin` keeps caches from serving one origin's answer to another.
- **OpenAPI** (`apps/api/src/openapi.ts`): `@fastify/swagger` collects all routes, and `fastify-type-provider-zod`'s `jsonSchemaTransform` turns their zod schemas (params, body, responses) into JSON Schema. The document is OpenAPI 3.1.0, Swagger UI is at `/api/docs`, and the JSON at `/api/docs/json`.
  - The schemas of the contract are named with zod's `.meta({ id })` (`Bear`, `Comment`, `NewCommentInput`, `ProblemDetails`, `FieldError`, `Health`), so they appear once under `components.schemas` and are referenced by `$ref`. Unreferenced variants are pruned.
  - Every route lists its possible problems (`problemResponses(400, 404, 500, 502, 504)`). A small wrapper around the transform documents them as `application/problem+json` with the `ProblemDetails` schema, adds descriptions and the `x-request-id` header (plus `Location` for 201), and documents the 204 as a response without a body.
  - These schemas are not just documentation: Fastify uses them to serialize every response, including problems. The code and the document cannot drift apart, because both come from the same zod schemas.

**Watch it fail, then fix it** (Chrome DevTools, Network tab with "Disable cache" so the preflight cache does not hide the preflights):

```sh
npm run dev -w apps/api                                            # API on :3000, no CORS_ORIGINS
VITE_API_BASE_URL=http://localhost:3000/api npm run build -w apps/web
npm run preview -w apps/web                                         # web app on http://localhost:4173
# open http://localhost:4173: "The server could not be reached."; the console says
# "blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present"

CORS_ORIGINS=http://localhost:4173 npm run dev -w apps/api           # restart the API with the allow-list
# reload: bears load; add and delete a comment on a bear's page
```

What the network tab shows (recorded with headless Chrome against the API):

| Request | Without allow-list | With `CORS_ORIGINS=http://localhost:4173` |
| --- | --- | --- |
| `GET /api/bears` | blocked: `MissingAllowOriginHeader` (the server did answer 200) | `200`, no preflight (simple request) |
| `OPTIONS /api/bears/ursus-arctos/comments` (preflight of the JSON POST) | - | `204`, `Access-Control-Allow-Methods: GET, POST, DELETE`, `Allow-Headers: content-type` |
| `POST /api/bears/ursus-arctos/comments` | - | `201` |
| `OPTIONS /api/comments/{id}` (preflight of the DELETE) | - | `204` |
| `DELETE /api/comments/{id}` | - | `204` |

The same with curl:

```sh
curl -i -X OPTIONS localhost:3000/api/comments/00000000-0000-4000-8000-000000000000 \
  -H 'origin: http://localhost:4173' -H 'access-control-request-method: DELETE'
curl -i -X OPTIONS localhost:3000/api/bears/ursus-arctos/comments \
  -H 'origin: http://localhost:4173' -H 'access-control-request-method: POST' \
  -H 'access-control-request-headers: content-type'
curl -i -X OPTIONS localhost:3000/api/bears/ursus-arctos/comments \
  -H 'origin: http://evil.example' -H 'access-control-request-method: POST'   # no Access-Control-Allow-Origin
```

In Docker, `CORS_ORIGINS=http://localhost:4173 docker compose up --build` passes the allow-list to the API container.

**Theory question:** Who enforces CORS? Simple vs preflighted requests? Why no `*` with credentials, and why does a BFF make most CORS problems disappear?

**Answer:**

**Who enforces CORS:** the browser. The server only *declares*, with `Access-Control-Allow-*` headers, which other origins may read its responses. The browser's fetch implementation compares those headers with the page's origin and hides the response from the script if they do not match. curl, Postman and other servers ignore CORS entirely: the curl commands above get the full response from any "origin". Two consequences:

- CORS does not protect the server, it protects the *user*. It stops a malicious site, running in the user's browser with the user's cookies and network access (intranet, localhost), from reading data it could not fetch itself. Authentication and authorisation still have to happen on the server.
- CORS relaxes the same-origin policy; it does not add restrictions. Without any CORS headers, cross-origin reads are already forbidden.

The blocked `GET /api/bears` above shows this: the API answered `200` (it is in the API log), and only the browser refused to hand it to the page.

**Simple vs preflighted requests:**

- **Simple requests** use `GET`, `HEAD` or `POST`, with only CORS-safelisted headers (`Accept`, `Accept-Language`, `Content-Language`, and `Content-Type` limited to `text/plain`, `multipart/form-data` or `application/x-www-form-urlencoded`). These are exactly the requests an HTML form or an `<img>` could always send cross-origin. The browser sends them directly with an `Origin` header and checks `Access-Control-Allow-Origin` on the response. The request *reaches the server and is executed* even if the check then fails, so CORS is no protection against such side effects (that is CSRF territory).
- **Everything else is preflighted:** other methods (`DELETE`, `PUT`, `PATCH`), other content types (`application/json`), custom headers (`Authorization`, `X-Request-Id`). The browser first sends `OPTIONS` with `Access-Control-Request-Method` and `Access-Control-Request-Headers`, and sends the real request only if the answer allows the origin, the method and the headers. `Access-Control-Max-Age` lets it cache that answer.

In this app, the `GET`s are simple and the JSON `POST` and the `DELETE` are preflighted, as the table shows. Requiring `application/json` therefore protects the comment API against cross-site form posts: a `text/plain` POST, which would need no preflight, is rejected with `400` because the body is not a JSON object.

**Why no `*` with credentials:** with `credentials: 'include'`, the browser attaches the user's cookies, HTTP auth or client certificate, i.e. the user's identity. If `Access-Control-Allow-Origin: *` were allowed with that, *any* website the user visits could call the API as the logged-in user and read the private answer (account data, messages, CSRF tokens). The spec therefore forbids the combination: for credentialed requests the browser requires the exact origin in `Access-Control-Allow-Origin` together with `Access-Control-Allow-Credentials: true`, so the server must decide origin by origin. `*` is only acceptable for public, cookie-less data. Blindly reflecting the request's `Origin` header would bypass that rule and is just as dangerous; hence an explicit allow-list (and `Vary: Origin`, so caches keep the answers per origin). This API uses no credentials at all and still only allows listed origins.

**Why a BFF makes most CORS problems disappear:** CORS only applies when a *browser* reads from a *different* origin.

- **Browser to BFF:** the BFF is served under the frontend's own origin (`/api` through the Vite proxy in dev and nginx in Docker), so every request is same-origin. There are no CORS headers to configure, no preflights (one round trip less per `POST`/`DELETE`), and cookies can stay first-party.
- **BFF to upstream:** these are server-to-server calls, which CORS does not apply to. Upstreams that do not support CORS at all become usable, and Playground 3's `origin=*` workaround for Wikipedia is gone.

CORS is only needed when a frontend deliberately lives on another origin than its API: like the 4173 demo, an `api.example.com` subdomain, or third-party browser clients. Then it is one allow-list in one place.

### Problem types

The `type` URIs of our own problem types (Task 4) point here. Clients should branch on `type` and `status`, never on `title` or `detail`. The machine-readable schema is `ProblemDetails` in the OpenAPI document at `/api/docs`.

#### Problem type: validation-error

`400`. The request did not match the route's schema. `errors` lists every invalid field: `location` is the part of the request (`body`, `params`, `querystring`, `headers`), `pointer` a JSON pointer (RFC 6901) into it (`""` for the part as a whole, e.g. an unknown key), and `detail` a human-readable reason. Fix the input; retrying unchanged will fail again.

#### Problem type: upstream-unavailable

`502`. Wikipedia could not be reached or answered with something we cannot use. Not caused by the client; retrying later may succeed.

#### Problem type: upstream-timeout

`504`. Wikipedia did not answer within the configured timeout. Not caused by the client; retrying later may succeed.

## 5. Persistence with PostgreSQL

`docker compose up --build` now also starts `db` (PostgreSQL 18, volume `db-data`) and a one-shot `migrate` service that migrates and seeds it before the API starts. For `npm run dev`, start only the database with `docker compose up -d db` and run `npm run db:migrate && npm run db:seed` once; the API reads its defaults from `apps/api/.env.example`, and overrides go into `apps/api/.env` (git-ignored). New variables: `DATABASE_URL` (required), `DATABASE_POOL_MAX` (default `10`), and for compose `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` (default `bears`) and `DB_PORT` (default `5432`, bound to `127.0.0.1` only).

### Tasks

#### Task 1: Add PostgreSQL to the stack

Add a `db` service (PostgreSQL current major, named volume, healthcheck); the API starts only when `db` is healthy. Read `DATABASE_URL` from the environment and validate all env vars with zod at startup. Use a connection pool (`pg.Pool`), never a connection per request. `GET /health/ready` returns 200 only if a trivial query succeeds; `/health` stays a pure liveness check.

**Implementation:**

- `compose.yaml`: `postgres:18-alpine` with a `pg_isready` healthcheck and the volume at `/var/lib/postgresql` (the layout since 18). `api` has `depends_on: db: condition: service_healthy`.
- `config.ts`: one zod schema for all variables. An invalid environment stops startup and lists every problem by name, without printing values (`DATABASE_URL` contains a password).
- `db/pool.ts`: one `pg.Pool` per process (`max` = `DATABASE_POOL_MAX`, 2 s connect timeout), closed on shutdown. Errors of idle connections are logged instead of crashing the process.
- `/health/ready` runs `SELECT 1` and answers `200 {"status":"ready"}` or a `503` problem. `/health` and Docker's healthcheck stay independent of the database.

```sh
curl -i localhost:3000/health/ready   # 200
docker compose stop db
curl -i localhost:3000/health/ready   # 503 application/problem+json; /health is still 200
docker compose start db
curl -i localhost:3000/health/ready   # 200 again, no API restart needed
```

**Theory question:** Liveness versus readiness: who uses each, and what goes wrong if the readiness check includes too many dependencies? Why is a pool necessary, and what limits its size?

**Answer:**

**Liveness vs. readiness.** Liveness asks "is the process still alive, or is it stuck?" Docker or Kubernetes checks it, and if it fails, they restart the container. Readiness asks "can you handle requests right now?" Load balancers check it, and if it fails, they simply stop sending traffic to that instance until it recovers. That's why the database check belongs in readiness and not in liveness: if the database goes down, restarting the API won't bring it back. We just want to stop sending traffic until it's back.

**Too many dependencies in readiness.** If readiness also checked Wikipedia, one Wikipedia hiccup would mark *every* instance as not ready at the same time, and the whole app would go offline, even though bears from the cache and comments still worked. Slow dependencies also make the check time out, so instances keep flipping between ready and not ready. So readiness should only check what this instance really can't work without, which here is just the database.

**Why a pool.** Opening a new PostgreSQL connection is expensive: a network handshake, authentication, and the server starts a new process for it. That's much slower than the `SELECT` you actually wanted to run. A pool opens a few connections once and keeps reusing them. It also acts as a limit: when all connections are busy, new requests wait their turn instead of flooding the database.

**What limits the size.** The database only accepts so many connections (`max_connections`, 100 by default), and all API instances share that limit, so instances × pool size has to fit with some room left over for admin tools. Each connection also uses memory on the database server. And more isn't faster: a database can only really work on about as many queries at once as it has CPU cores, so a huge pool mostly creates waiting inside the database. That's why around 10 per instance is a common choice.

#### Task 2: Model bears and comments, first migration

Drizzle schema for `bears` (slug PK, name, binomial, image_url, range, fetched_at) and `comments` (uuid PK, `bear_id` FK `ON DELETE CASCADE`, author, text, created_at) plus indexes. Generate the SQL migration with drizzle-kit and commit it; `npm run db:migrate` and `npm run db:seed`. The seed fetches bears through the Playground 4 BFF code (or a committed fixture) and upserts them. `GET /api/bears` reads from the database.

**Implementation:**

- `apps/api/src/db/schema.ts` is the schema; `apps/api/drizzle/0000_init.sql` is the generated, committed migration (`npm run db:generate` after a schema change). Author and text are `varchar` with the same limits as the zod schema.
- Index: `comments (bear_id, created_at)`. Postgres doesn't index foreign keys on its own, and this one serves both "comments of a bear, oldest first" and the lookup of `ON DELETE CASCADE`. The primary keys already have their own indexes.
- `db/migrate.ts` applies pending migrations. `db/seed.ts` loads the bears with the Playground 4 Wikipedia service; if Wikipedia isn't reachable it falls back to `apps/api/fixtures/bears.json`, and then upserts on `id`, so it can be run again at any time.
- `bears/repository.ts` implements the same `BearService` interface from the database, so the routes didn't change. The API no longer calls Wikipedia at all, so the bear and comment routes can't answer 502/504 anymore. Bears are ordered by binomial name, because Wikipedia's page order isn't stored.
- Compose: `migrate` runs `migrate.js && seed.js` once `db` is healthy; `api` waits for it with `service_completed_successfully`.

```sh
docker compose down -v                    # empty database
WIKIPEDIA_API_URL=https://en.wikipedia.invalid/w/api.php docker compose up --build
# migrate logs "seeding from the fixture"; http://localhost:8080 still shows all bears
docker compose exec db psql -U bears -c '\dt'   # bears, comments
```

**Theory question:** Why migrations instead of creating tables from code at startup? What does forward-only mean, and what goes wrong when two branches both create migration 0003? Natural versus surrogate key: when is which appropriate?

**Answer:**

**Why migrations.** `CREATE TABLE IF NOT EXISTS` at startup only works the first time. It can't rename a column or add a `NOT NULL` column to a table that already has rows, and it has no idea which state an existing database is in. A migration is a numbered SQL file that runs exactly once per database, and the database remembers which ones it has already run. That way my laptop, CI and production all go through the same steps, the schema change gets reviewed as SQL in the pull request, and it runs once before the app starts instead of in every instance at the same time.

**Forward-only.** Once a migration has run anywhere else, you never edit or delete it. If it was wrong, you write a new migration that fixes it. Databases that already ran the old version won't run it again, so changing the file would just make them quietly drift apart. Undoing something works the same way: you write a new migration that reverses it.

**Two branches with 0003.** Both branches started from 0002, so both generate a 0003 on top of it. After the merge there are two migrations with the same number, and each one was written assuming it's the only one. Depending on the tool, one of them gets skipped on databases that already ran the other one. Drizzle, for example, only runs migrations that are newer than the last one it applied. Drizzle's snapshot of the schema is wrong too, so the next generated migration will be wrong. The fix is to treat it like a merge conflict: drop your migration, rebase onto main, and regenerate it as 0004.

**Natural vs. surrogate key.** A natural key comes from the data itself. That fits when the value is unique, never changes and is short, like the bear's binomial slug. It's already in every URL and in the API, and the seed can upsert on it directly. A surrogate key is a generated id with no meaning, like the comments' uuid. You need one when nothing in the data identifies the row (two identical comments are still two comments), or when the candidate might change, like names or email addresses. Even our slug has that risk: if a species is ever renamed, its id changes. If that happened often, I'd switch to a surrogate key and keep the slug as a unique column.

#### Task 3: Introduce a repository layer

`BearRepository` and `CommentRepository` as TypeScript interfaces, implemented with Drizzle. Route handlers and services depend on the interfaces only; the implementation is injected (Fastify decorators or plugin options). Keep the in-memory implementation from Playground 4 and use it in the tests. Comments are now persisted.

**Implementation:**

- `bears/` and `comments/` each have a `repository.ts` (the interface), a `drizzle-repository.ts`, and an in-memory version (`createInMemoryBearRepository`, and `memory-repository.ts`, which is the Playground 4 `Map` store). The interfaces only return data; turning a missing bear or comment into a 404 is the routes' job.
- `app.ts` creates the Drizzle repositories and passes them to the routes as plugin options. `buildApp(config, { bears, comments })` accepts other implementations instead. No route file imports Drizzle or `pg`.
- `npm test` (`node:test` via `tsx`, also run in CI) runs the routes through `app.inject()` against the in-memory repositories: no database, no port. Test files aren't compiled into `dist` (`tsconfig.build.json`).
- New `GET /api/comments`: the comments of all bears, grouped by bear id, as the N+1 example below. With `LOG_LEVEL=debug` the API logs every SQL statement, so you can count them.

```sh
curl -i -X POST localhost:3000/api/bears/ursus-arctos/comments \
  -H 'content-type: application/json' -d '{"author":"Ann","text":"Hi"}'
docker compose restart api
curl localhost:3000/api/bears/ursus-arctos/comments   # still there
npm test                                               # no database needed
```

**Theory question:** What does the repository hide, and what does it cost? Explain the N+1 problem using "comments for all bears" and show how your repository avoids it.

**Answer:**

**What it hides.** Everything about storage: that there's SQL and Drizzle at all, table and column names (`image_url`), turning the database's `Date` into the API's ISO string, and how ties in the order are broken. The routes just say `findById` or `listByBear`. That's why the tests can swap in a `Map` without changing a line of the routes.

**What it costs.** One more layer, and every new kind of query needs a new method. Worse, it hides the price of a call: `listByBear(id)` looks like a normal function but is a network round trip, and that makes it easy to call in a loop. The in-memory version also doesn't behave exactly like Postgres (no foreign keys, no `varchar` limits), so passing tests don't prove the SQL is right. That still needs a test against a real database.

**N+1.** "Comments for all bears" written the obvious way is one query for the bears, then `listByBear` for each of the N bears: 1 + N queries. With 8 bears that's 9 round trips, which nobody notices locally. With 1,000 bears it's 1,001, each waiting for the network and a free pool connection, so the endpoint gets slower as the data grows. That's why it's so often found only in production.

**How mine avoids it.** `CommentRepository.listByBears(ids)` fetches the comments of all bears in one query (`WHERE bear_id IN (...)`) and groups them in memory, so `GET /api/comments` always runs exactly two queries, however many bears there are. The debug log shows both, and a test checks that the route calls `listByBears` once and never `listByBear`. Putting this method on the interface is how the repository protects against N+1: the cheap way to ask is also the easy way.

#### Task 4: Pagination, filtering and one measured index

`GET /api/bears/:id/comments` cursor-paginated (`limit`, a cursor based on `created_at` and `id`, `nextCursor` in the response). `?q=` on `GET /api/bears` filters by name. A script seeds 100,000 comments; `EXPLAIN ANALYZE` of the comments query without and with an index on `(bear_id, created_at, id)`. Both plans and timings go into the README; the index lives in a migration.

**Implementation:**

- `GET /api/bears/:id/comments?limit=20&cursor=...` returns `{ items, nextCursor }`, newest first (`limit` is 1 to 100, default 20). The cursor is the `(createdAt, id)` of the last item, as opaque base64url JSON. The query is `WHERE bear_id = $1 AND (created_at, id) < ($2, $3) ORDER BY created_at DESC, id DESC LIMIT limit + 1`, and the extra row tells whether there's a next page. A broken cursor is a 400.
- `created_at` is now `timestamp(3)`, milliseconds like a JavaScript `Date`. With Postgres' default microseconds, a cursor built from a `Date` would be slightly off and skip rows.
- `GET /api/bears?q=bear`: case-insensitive `ILIKE '%bear%'` on the name, with `%` and `_` escaped so they match literally.
- `drizzle/0001_comments_pagination_index.sql` replaces Task 2's `(bear_id, created_at)` index with `(bear_id, created_at, id)` and changes the column precision.
- The UI loads 10 comments and shows a "Load older comments" button while `nextCursor` isn't `null`. New comments go to the top, which doesn't affect the cursor.
- `npm run db:seed:comments` (or `docker compose exec api node dist/db/seed-comments.js`) inserts 100,000 comments in a single `INSERT ... SELECT generate_series`, spread evenly over the 8 bears and one minute apart, and runs `ANALYZE` afterwards. `apps/api/sql/explain-comments.sql` reproduces the measurement: it drops the index inside a transaction, explains the query, rolls back, then explains it again with the index.

```sh
docker compose exec api node dist/db/seed-comments.js
docker compose exec -T db psql -U bears < apps/api/sql/explain-comments.sql
curl 'localhost:3000/api/bears/ursus-arctos/comments?limit=2'   # then ?cursor=<nextCursor>
curl 'localhost:3000/api/bears?q=polar'
```

**Measurement:** 100,000 comments, 12,500 of them for `ursus-arctos`, first page (`LIMIT 21`). PostgreSQL 18 in Docker, warm cache.

Without the index, Postgres reads the whole table, throws away 87,500 rows and sorts the remaining 12,500 to find the newest 21:

```
Limit (actual time=6.808..6.811 rows=21.00 loops=1)
  Buffers: shared hit=1340
  ->  Sort (actual time=6.807..6.808 rows=21.00 loops=1)
        Sort Key: created_at DESC, id DESC
        Sort Method: top-N heapsort  Memory: 27kB
        ->  Seq Scan on comments (actual time=0.005..5.816 rows=12500.00 loops=1)
              Filter: (bear_id = 'ursus-arctos'::text)
              Rows Removed by Filter: 87500
Execution Time: 6.845 ms
```

With the index, it jumps to the newest entry for this bear and reads 21 entries backwards. No sort, no filter:

```
Limit (actual time=0.011..0.017 rows=21.00 loops=1)
  Buffers: shared hit=6
  ->  Index Scan Backward using comments_bear_id_created_at_id_idx on comments (actual time=0.011..0.015 rows=21.00 loops=1)
        Index Cond: (bear_id = 'ursus-arctos'::text)
Execution Time: 0.027 ms
```

| Query (4 runs each) | Without index | With index |
| --- | --- | --- |
| First page | 6.8–8.4 ms, 1,340 pages read | 0.03–0.04 ms, 6 pages |
| Page deep in the list (with cursor) | 6.0–7.2 ms, 1,334 pages | 0.03–0.05 ms, 7 pages |

That's about 250 times faster, and the cost no longer depends on the table size or on how deep the page is. With only 40 comments, Postgres used a `Seq Scan` and sort even though the index existed (0.05 ms, 1 page), which is the last theory question.

**Theory question:** Why does offset pagination get slower and skip or repeat rows, and how does a cursor avoid that? What is a B-tree index, why does the column order in a composite index matter, and why may PostgreSQL ignore an index on a small table?

**Answer:**

**Offset vs. cursor.** `OFFSET 10000 LIMIT 20` doesn't skip anything for free: the database still has to find and count 10,000 rows, only to throw them away. So every page is slower than the one before. It also counts positions, not rows. If someone posts a comment while I'm reading newest first, everything moves down by one and the next page starts with the comment I just saw. If someone deletes one, I miss one. A cursor says "the 20 rows right after *this* one (`created_at`, `id`)", so the index goes straight there, and page 500 costs the same as page 1 (0.03 ms in the table above). Because it's tied to a value instead of a position, inserts and deletes elsewhere don't move it. The `id` is in the cursor because two comments can have the same `created_at`. The downside is that you can't jump to page 37 or show a total count for free.

**B-tree.** A B-tree is a sorted, balanced tree. The leaves hold all keys in order, each pointing to its row, and each leaf is linked to its neighbours. A lookup goes from the root down to a leaf in a few steps (3–4 levels even for millions of rows), and from there it can read along the leaves in either direction. That's why one index serves `=`, ranges and `ORDER BY` without sorting.

**Column order.** A composite index is sorted like a phone book: by the first column, then by the second within equal first values, and so on. `(bear_id, created_at, id)` groups all comments of one bear together, already sorted by time, so "bear X, newest 21" is one jump plus 21 entries. With `(created_at, bear_id)`, the comments of one bear would be spread over the whole index, and Postgres would have to walk through everyone's comments by time and filter. The index only helps for a leading prefix of its columns, so the rule is: equality columns first, then the ones you sort or compare ranges on.

**Small tables.** The planner picks whichever plan it estimates to be cheapest, not "the index if there is one". Our 40 comments fit into one 8 kB page. Reading that page and sorting 5 rows is cheaper than reading index pages and then jumping to the table for each row. An index only pays off when a query needs a small part of a large table. That's also why the seed script runs `ANALYZE`: with outdated statistics, the planner still thinks the table is tiny.

---

## In-Class Accessibility Workshop
You might have noticed that the base project has a number of accessibility issues - your task is to explore the existing site and fix them. Use the tools presented in our accessibility workshop to test the accessibility of your app and write a summary of your reports below.

### Tasks
* Accessibility Checks:
  * **Color**: Test the current color contrast (text/background), report the results of the test, and then fix them by changing the assigned colors.
  * **Semantic HTML**: Report on what happens when you try to navigate the page using a screen reader. Fix those navigation issues.
  * **Audio**: The ``<audio>`` player isn't accessible to hearing impaired people — can you add some kind of accessible alternative for these users?
  * **Forms**:
    * The ``<input>`` element in the search form at the top could do with a label, but we don't want to add a visible text label that would potentially spoil the design and isn't really needed by sighted users. Fix this issue by adding a label that is only accessible to screen readers.
    * The two ``<input>`` elements in the comment form have visible text labels, but they are not unambiguously associated with their labels — how do you achieve this? Note that you'll need to update some of the CSS rule as well.
  * **Comment Section**: The show/hide comment control button is not currently keyboard-accessible. Can you make it keyboard accessible, both in terms of focusing it using the tab key, and activating it using the return key?
  * **The table**: The data table is not currently very accessible — it is hard for screen reader users to associate data rows and columns together, and the table also has no kind of summary to make it clear what it shows. Can you add some features to your HTML to fix this problem?


>
> _Note your findings here..._
>

<p>© 2026 Leon Freudenthaler (Hochschule Campus Wien). All rights reversed.</p>
