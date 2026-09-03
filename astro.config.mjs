// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';

function perfLoggerPlugin() {
  const LOG_FILE = path.join(process.cwd(), 'perf-telemetry.json');

  return {
    name: 'vite-plugin-perf-logger',
    configureServer(server) {
      server.middlewares.use('/api/log-perf', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const entry = { timestamp: new Date().toISOString(), ...data };

              let logs = [];
              if (fs.existsSync(LOG_FILE)) {
                try {
                  logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
                } catch { logs = []; }
              }

              logs.push(entry);
              if (logs.length > 500) logs = logs.slice(logs.length - 500);

              fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: logs.length }));
            } catch {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to write perf log' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://www.narayan.works',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [perfLoggerPlugin()]
  }
});