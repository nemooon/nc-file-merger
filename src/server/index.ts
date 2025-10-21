import { Hono } from 'hono';
import { NCMerger } from './lib/nc-merger.js';
import { NCValidator } from './lib/nc-validator.js';
import { TemplateManager } from './lib/templates.js';

type Env = {
  Bindings: {
    ASSETS: Fetcher;
  };
};

const app = new Hono<Env>();
const templateManager = new TemplateManager();

// Validate endpoint
app.post('/api/validate', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const files = body['files'];

    if (!files) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const results = [];

    for (const file of fileArray) {
      if (typeof file === 'string') {
        return c.json({ error: 'Invalid file upload' }, 400);
      }

      const content = await file.text();
      const validation = NCValidator.validate(content);
      const stats = NCValidator.getStats(content);

      results.push({
        filename: file.name,
        validation,
        stats: {
          totalLines: stats.totalLines,
          codeLines: stats.codeLines,
          commentLines: stats.commentLines,
          emptyLines: stats.emptyLines,
          gCodes: Array.from(stats.gCodes),
          mCodes: Array.from(stats.mCodes),
          tools: Array.from(stats.tools)
        }
      });
    }

    return c.json({ results });
  } catch (error) {
    console.error('Validation error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Validation failed'
    }, 500);
  }
});

// Preview endpoint
app.post('/api/preview', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const files = body['files'];

    if (!files) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const ncFiles = await Promise.all(
      fileArray.map(async (file) => {
        if (typeof file === 'string') {
          throw new Error('Invalid file upload');
        }
        return {
          filename: file.name,
          content: await file.text()
        };
      })
    );

    // Get template if specified
    let template;
    const templateName = body['template'] as string;
    if (templateName && templateName !== 'none') {
      template = templateManager.getTemplateForMerge(templateName);
    }

    const options = {
      addComments: body['addComments'] === 'true',
      preserveHeaders: body['preserveHeaders'] === 'true',
      remapTools: body['remapTools'] === 'true',
      template
    };

    const preview = NCMerger.preview(ncFiles, options);

    // Also generate the merged content for preview
    const mergeResult = NCMerger.merge(ncFiles, options);

    return c.json({
      ...preview,
      mergedContent: mergeResult.content,
      toolMappings: mergeResult.toolMappings
    });
  } catch (error) {
    console.error('Preview error:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Preview failed'
    }, 500);
  }
});

// Merge endpoint
app.post('/api/merge', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const files = body['files'];

    if (!files) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    const fileArray = Array.isArray(files) ? files : [files];

    if (fileArray.length === 0) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    const ncFiles = await Promise.all(
      fileArray.map(async (file) => {
        if (typeof file === 'string') {
          throw new Error('Invalid file upload');
        }
        const content = await file.text();

        // Validate NC file
        if (!NCValidator.isValidNCFile(content)) {
          throw new Error(`${file.name} does not appear to be a valid NC file`);
        }

        return {
          filename: file.name,
          content
        };
      })
    );

    // Get template if specified
    let template;
    const templateName = body['template'] as string;
    if (templateName && templateName !== 'none') {
      template = templateManager.getTemplateForMerge(templateName);
    }

    const options = {
      addComments: body['addComments'] === 'true',
      preserveHeaders: body['preserveHeaders'] === 'true',
      remapTools: body['remapTools'] === 'true',
      template
    };

    const result = NCMerger.merge(ncFiles, options);

    // Return as downloadable file
    return c.body(result.content, 200, {
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="merged.nc"'
    });

  } catch (error) {
    console.error('Error merging files:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

// Get merge result with metadata (for download with info)
app.post('/api/merge-with-info', async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const files = body['files'];

    if (!files) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const ncFiles = await Promise.all(
      fileArray.map(async (file) => {
        if (typeof file === 'string') {
          throw new Error('Invalid file upload');
        }
        return {
          filename: file.name,
          content: await file.text()
        };
      })
    );

    let template;
    const templateName = body['template'] as string;
    if (templateName && templateName !== 'none') {
      template = templateManager.getTemplateForMerge(templateName);
    }

    const options = {
      addComments: body['addComments'] === 'true',
      preserveHeaders: body['preserveHeaders'] === 'true',
      remapTools: body['remapTools'] === 'true',
      template
    };

    const result = NCMerger.merge(ncFiles, options);

    return c.json({
      content: result.content,
      toolMappings: result.toolMappings,
      stats: result.stats
    });

  } catch (error) {
    console.error('Error merging files:', error);
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

// Get available templates
app.get('/api/templates', (c) => {
  const templates = templateManager.getAllTemplates();
  return c.json({ templates });
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0' });
});

// Serve built front-end assets via Workers assets binding
app.get('*', async (c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.notFound();
  }

  const originalRequest = new Request(c.req.raw);
  const assetResponse = await c.env.ASSETS.fetch(originalRequest);

  if (assetResponse.status === 404) {
    const url = new URL(c.req.url);
    const fallbackRequest = new Request(`${url.origin}/index.html`, originalRequest);
    return c.env.ASSETS.fetch(fallbackRequest);
  }

  return assetResponse;
});

export default app;
export type { Env };
