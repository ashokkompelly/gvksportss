import { app } from './app.js';
import { config } from './config/env.js';
app.listen(config.port, '0.0.0.0', () => console.log(`GVK API listening on http://0.0.0.0:${config.port}`));
