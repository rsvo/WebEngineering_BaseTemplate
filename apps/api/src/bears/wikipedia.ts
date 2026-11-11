import { z } from 'zod';
import type { WikipediaConfig } from '../config.js';
import { UpstreamTimeoutError, UpstreamUnavailableError } from '../errors.js';

const URSIDS_PAGE = 'List_of_ursids';
const URSIDS_SECTION = '3';
// The imageinfo API accepts at most 50 titles per request.
const MAX_TITLES_PER_REQUEST = 50;
const THUMBNAIL_WIDTH = '640';

// Only the parts of the responses we actually read are described; everything
// else Wikipedia sends is ignored.
const WikipediaErrorSchema = z.object({
  error: z.object({ code: z.string(), info: z.string() }),
});

const ParseResponseSchema = z.object({
  parse: z.object({ wikitext: z.string().min(1) }),
});

const ImageInfoResponseSchema = z.object({
  query: z
    .object({
      normalized: z
        .array(z.object({ from: z.string(), to: z.string() }))
        .optional(),
      pages: z.array(
        z.object({
          title: z.string(),
          imageinfo: z
            .array(z.object({ url: z.url(), thumburl: z.url().optional() }))
            .optional(),
        })
      ),
    })
    .optional(),
});

export interface WikipediaClient {
  fetchUrsidWikitext: () => Promise<string>;
  fetchImageUrls: (
    fileNames: readonly string[]
  ) => Promise<Map<string, string>>;
}

function isTimeout(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'TimeoutError';
}

export function createWikipediaClient(
  config: WikipediaConfig
): WikipediaClient {
  function timeoutError(cause: unknown): UpstreamTimeoutError {
    return new UpstreamTimeoutError(
      `Wikipedia did not respond within ${config.timeoutMs} ms.`,
      { cause }
    );
  }

  async function request<T>(
    params: Record<string, string>,
    schema: z.ZodType<T>
  ): Promise<T> {
    const url = new URL(config.apiUrl);
    url.search = new URLSearchParams({
      ...params,
      format: 'json',
      formatversion: '2',
    }).toString();

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'user-agent': config.userAgent,
          accept: 'application/json',
        },
        // Without a timeout a hanging upstream would hold our request (and
        // the user's spinner) open indefinitely.
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (err) {
      if (isTimeout(err)) throw timeoutError(err);
      throw new UpstreamUnavailableError('Wikipedia could not be reached.', {
        cause: err,
      });
    }

    if (!response.ok) {
      throw new UpstreamUnavailableError(
        `Wikipedia answered with HTTP ${response.status}.`
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      // The timeout also covers reading the body.
      if (isTimeout(err)) throw timeoutError(err);
      throw new UpstreamUnavailableError('Wikipedia returned invalid JSON.', {
        cause: err,
      });
    }

    const apiError = WikipediaErrorSchema.safeParse(body);
    if (apiError.success) {
      // Wikipedia's own message is logged (as the cause) but not shown to
      // our clients; it describes Wikipedia's internals, not our API.
      throw new UpstreamUnavailableError('Wikipedia reported an error.', {
        cause: new Error(
          `${apiError.data.error.code}: ${apiError.data.error.info}`
        ),
      });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new UpstreamUnavailableError(
        'Wikipedia returned an unexpected response shape.',
        { cause: parsed.error }
      );
    }
    return parsed.data;
  }

  async function fetchImageBatch(
    fileNames: readonly string[]
  ): Promise<Map<string, string>> {
    const data = await request(
      {
        action: 'query',
        titles: fileNames.map((name) => `File:${name}`).join('|'),
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: THUMBNAIL_WIDTH,
      },
      ImageInfoResponseSchema
    );

    const urlByTitle = new Map<string, string>();
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (info !== undefined) {
        urlByTitle.set(page.title, info.thumburl ?? info.url);
      }
    }

    // Wikipedia normalises titles (e.g. underscores to spaces), so map the
    // requested names through `normalized` before looking them up.
    const normalized = new Map(
      (data.query?.normalized ?? []).map(({ from, to }) => [from, to])
    );

    const urlByFileName = new Map<string, string>();
    for (const fileName of fileNames) {
      const requested = `File:${fileName}`;
      const url = urlByTitle.get(normalized.get(requested) ?? requested);
      if (url !== undefined) urlByFileName.set(fileName, url);
    }
    return urlByFileName;
  }

  return {
    async fetchUrsidWikitext() {
      const data = await request(
        {
          action: 'parse',
          page: URSIDS_PAGE,
          prop: 'wikitext',
          section: URSIDS_SECTION,
        },
        ParseResponseSchema
      );
      return data.parse.wikitext;
    },

    // One request per 50 files instead of one request per bear.
    async fetchImageUrls(fileNames) {
      const batches: Array<readonly string[]> = [];
      for (let i = 0; i < fileNames.length; i += MAX_TITLES_PER_REQUEST) {
        batches.push(fileNames.slice(i, i + MAX_TITLES_PER_REQUEST));
      }
      const results = await Promise.all(batches.map(fetchImageBatch));
      return new Map(results.flatMap((result) => [...result]));
    },
  };
}
