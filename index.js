let express = require('express');
let app = express();
let ejs = require('ejs');
const haikus = require('./haikus.json');
const {captureScreenshot, getPerformanceMetrics, getPageInfo, monitorNetwork, captureConsoleLogs, generatePDF, executeJavaScript, getStorageData, getFullPageScreenshot, checkAccessibility} = require('./lib/chrome-utils');
const port = process.env.PORT || 3000;

app.use(express.static('public'))
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', {haikus: haikus});
});

/**
 * Endpoint to capture a screenshot of a page
 * Usage: GET /screenshot?url=http://localhost:3000
 */
app.get('/screenshot', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await captureScreenshot(url);
    
    if (result.success) {
      res.set('Content-Type', 'image/png');
      res.send(Buffer.from(result.data, 'base64'));
    } else {
      res.status(500).json({error: result.error});
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to get full page screenshot (including scrollable content)
 * Usage: GET /fullscreenshot?url=http://localhost:3000
 */
app.get('/fullscreenshot', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await getFullPageScreenshot(url);
    
    if (result.success) {
      res.set('Content-Type', 'image/png');
      res.send(Buffer.from(result.data, 'base64'));
    } else {
      res.status(500).json({error: result.error});
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to get performance metrics from a page
 * Usage: GET /metrics?url=http://localhost:3000
 */
app.get('/metrics', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await getPerformanceMetrics(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to get page information (title, meta tags, links, images)
 * Usage: GET /pageinfo?url=http://localhost:3000
 */
app.get('/pageinfo', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await getPageInfo(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to monitor network activity on a page
 * Usage: GET /network?url=http://localhost:3000
 */
app.get('/network', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await monitorNetwork(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to capture console logs from a page
 * Usage: GET /logs?url=http://localhost:3000
 */
app.get('/logs', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await captureConsoleLogs(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to generate a PDF from a page
 * Usage: GET /pdf?url=http://localhost:3000
 */
app.get('/pdf', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await generatePDF(url);
    
    if (result.success) {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="page.pdf"');
      res.send(Buffer.from(result.data, 'base64'));
    } else {
      res.status(500).json({error: result.error});
    }
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to execute JavaScript on a page
 * Usage: POST /execute with JSON body: {url: "...", code: "..."}
 */
app.post('/execute', express.json(), async (req, res) => {
  const {url, code} = req.body;
  
  if (!url || !code) {
    return res.status(400).json({error: 'url and code parameters are required'});
  }
  
  try {
    const result = await executeJavaScript(url, code);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to get storage data (cookies, localStorage, sessionStorage)
 * Usage: GET /storage?url=http://localhost:3000
 */
app.get('/storage', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await getStorageData(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

/**
 * Endpoint to check accessibility issues on a page
 * Usage: GET /accessibility?url=http://localhost:3000
 */
app.get('/accessibility', async (req, res) => {
  const {url} = req.query;
  
  if (!url) {
    return res.status(400).json({error: 'url query parameter is required'});
  }
  
  try {
    const result = await checkAccessibility(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

app.listen(port);