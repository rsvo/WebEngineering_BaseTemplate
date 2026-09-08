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

#### Task 2: Migrate to TypeScript

Use TypeScript as the primary development language and adapt the source files and configuration accordingly. Enable strict checking, model the application's domain data, and validate data received from external APIs before treating it as a typed value.

**Theory question:** TypeScript uses structural typing and erases types during compilation. Explain both concepts and why a compile-time type alone cannot guarantee the shape of a Wikipedia API response at runtime.

#### Task 3: Add static analysis and formatting

Configure ESLint and Prettier using the rulesets below. Resolve all reported errors in the application code and avoid disabling rules without a written justification.

**Theory question:** What different problems do a linter, a formatter, and the TypeScript compiler detect? Give one concrete example for each from this project.

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

#### Task 5: Enforce quality before integration

Configure a pre-commit hook that checks staged code using [husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged). Configure a continuous-integration workflow that installs dependencies from the lockfile and runs the non-mutating build, type, lint, and formatting checks for every push or pull request.

**Theory question:** Compare a local pre-commit hook with a CI quality gate. Why is CI still necessary when hooks are configured, and why should CI use non-mutating checks rather than automatically rewriting source files?


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

#### Task 2: Design the component tree

Decompose the interface into components organised by feature. Use props where appropriate, keep rendering pure, and render bear collections with stable keys.

**Theory question:** Explain how component boundaries and typed props act as contracts. What makes a key stable, why does React need keys during reconciliation, and why is an array index unsuitable when list entries can change order?

#### Task 3: Model state and interaction

Implement the comment toggle, comment form, and search behavior with React events and state. Use controlled inputs, immutable updates, and derived values rather than duplicate state. Lift state only to the closest common owner that needs it.

**Theory question:** Distinguish props, stored state, and derived values. Explain why direct mutation can produce incorrect React behavior and when lifting state is preferable to introducing context.

#### Task 4: Load and represent remote data

Load and validate the bear data within the React application. Represent loading, success, empty, and error states explicitly; prevent stale requests from overwriting newer results; and retain the image fallback behavior from Playground 1.

**Theory question:** Why is fetching data a synchronization with an external system rather than part of pure rendering? Explain how cleanup or cancellation prevents race conditions when a component unmounts or a request becomes irrelevant.

#### Task 5: Add client-side routing and verify the migration

Add at least a list route and a bear-detail route using a stable bear identifier as a route parameter. Use query parameters for optional search/filter view state where appropriate. Verify that every requirement from Playground 1 still works and that all Playground 2 quality commands pass.

**Theory question:** Distinguish client-side rendering, a single-page application, and client-side routing. Compare route parameters with query parameters, and describe one benefit and one cost of the SPA architecture used here.

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
