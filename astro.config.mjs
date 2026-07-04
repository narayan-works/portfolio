// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import fs from 'fs';
import path from 'path';

import react from '@astrojs/react';

// Custom dev-only save typography middleware plugin
const devSaveTypographyPlugin = () => ({
  name: 'dev-save-typography-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/save-typography' && req.method === 'POST') {
        try {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          
          req.on('end', () => {
            try {
              const { css } = JSON.parse(body);
              const filePath = path.resolve(process.cwd(), 'src/styles/typography-inspector-overrides.css');
              
              fs.writeFileSync(filePath, `/* Typography Inspector Overrides - Saved via Editor */\n\n${css}\n`);
              
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      } else if (req.url === '/api/load-typography' && req.method === 'GET') {
        try {
          const filePath = path.resolve(process.cwd(), 'src/styles/typography-inspector-overrides.css');
          let css = '';
          if (fs.existsSync(filePath)) {
            css = fs.readFileSync(filePath, 'utf-8');
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ css }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      } else {
        next();
      }
    });
  }
});

// https://astro.build/config
export default defineConfig({
  site: 'https://www.narayan.works',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [devSaveTypographyPlugin()]
  }
});