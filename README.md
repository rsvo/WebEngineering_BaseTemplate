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

```
apps/
  web/   React + Vite (Playground 3), served by nginx in Docker
  api/   Fastify + TypeScript (strict, ESM), compiled with tsc
```

Environment variables (all optional): `PORT` (API port, default `3000`), `HOST` (default `0.0.0.0`), `LOG_LEVEL` (default `info`), `API_PROXY_TARGET` (Vite proxy target, default `http://localhost:3000`), `WIKIPEDIA_API_URL` (default `https://en.wikipedia.org/w/api.php`), `UPSTREAM_TIMEOUT_MS` (default `5000`), `BEARS_CACHE_TTL_MS` (default 5 minutes). If ports 3000/8080 are taken on the host, override the published ports with `API_PORT=3300 WEB_PORT=8380 docker compose up --build`.

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

- `wikipedia.ts` calls the MediaWiki API with a User-Agent naming the app, its version and the repository as contact, and `AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)`. Responses are validated with zod. Unreachable host, non-2xx, invalid JSON, a MediaWiki `error` object or an unexpected shape become `UpstreamError` 502; a timeout becomes 504.
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
