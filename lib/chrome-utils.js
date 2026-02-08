const CDP = require('chrome-remote-interface');

/**
 * Connect to Chrome and take a screenshot of a URL
 */
async function captureScreenshot(url) {
    let client;
    try {
        client = await CDP();
        const {Page} = client;
        
        // Set device emulation for consistent sizing
        await Page.setDeviceMetricsOverride({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1
        });
        
        // Navigate to the URL
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Capture screenshot
        const screenshot = await Page.captureScreenshot({format: 'png'});
        
        return {
            success: true,
            data: screenshot.data,
            format: 'png'
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Get performance metrics from a page
 */
async function getPerformanceMetrics(url) {
    let client;
    try {
        client = await CDP();
        const {Page, Performance} = client;
        
        // Enable performance domain
        await Performance.enable();
        await Page.enable();
        
        // Navigate to the URL
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Get performance metrics
        const metrics = await Performance.getMetrics();
        
        return {
            success: true,
            url: url,
            metrics: metrics.metrics.reduce((acc, m) => {
                acc[m.name] = m.value;
                return acc;
            }, {})
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Get page information including title, meta tags, and resources
 */
async function getPageInfo(url) {
    let client;
    try {
        client = await CDP();
        const {Page, DOM, Runtime} = client;
        
        await Page.enable();
        await DOM.enable();
        
        // Navigate to the URL
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Get the document
        const {root} = await DOM.getDocument();
        
        // Execute JavaScript to extract page info
        const infoResult = await Runtime.evaluate({
            expression: `({
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.content || '',
                ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
                ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
                ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
                links: Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href})),
                images: Array.from(document.querySelectorAll('img')).map(img => ({src: img.src, alt: img.alt}))
            })`
        });
        
        return {
            success: true,
            url: url,
            pageInfo: infoResult.result.value
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Monitor network activity on a page
 */
async function monitorNetwork(url) {
    let client;
    try {
        client = await CDP();
        const {Page, Network} = client;
        
        await Network.enable();
        await Page.enable();
        
        const requests = [];
        
        // Listen for network requests
        Network.requestWillBeSent((params) => {
            requests.push({
                url: params.request.url,
                method: params.request.method,
                type: params.type,
                timestamp: params.timestamp
            });
        });
        
        // Navigate to the URL
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Wait a bit for all requests to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            url: url,
            requestCount: requests.length,
            requests: requests
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Capture console messages from a page
 */
async function captureConsoleLogs(url) {
    let client;
    try {
        client = await CDP();
        const {Page, Runtime} = client;
        
        await Runtime.enable();
        await Page.enable();
        
        const consoleLogs = [];
        
        // Listen for console messages
        Runtime.consoleAPICalled((params) => {
            const args = params.args.map(arg => {
                if (arg.type === 'string' || arg.type === 'number' || arg.type === 'boolean') {
                    return arg.value;
                }
                return `[${arg.type}]`;
            });
            
            consoleLogs.push({
                type: params.type,
                timestamp: params.timestamp,
                message: args.join(' ')
            });
        });
        
        // Navigate to the URL
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Wait for console messages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            url: url,
            logs: consoleLogs
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Generate a PDF from a page
 */
async function generatePDF(url) {
    let client;
    try {
        client = await CDP();
        const {Page} = client;
        
        await Page.enable();
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Generate PDF
        const pdf = await Page.printToPDF({
            landscape: false,
            displayHeaderFooter: false,
            scale: 1.0,
            paperWidth: 8.5,
            paperHeight: 11,
            marginTop: 0.5,
            marginBottom: 0.5,
            marginLeft: 0.5,
            marginRight: 0.5
        });
        
        return {
            success: true,
            url: url,
            data: pdf.data,
            format: 'pdf'
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Execute JavaScript code on a page and return the result
 */
async function executeJavaScript(url, code) {
    let client;
    try {
        client = await CDP();
        const {Page, Runtime} = client;
        
        await Runtime.enable();
        await Page.enable();
        
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Execute the JavaScript code
        const result = await Runtime.evaluate({
            expression: code,
            returnByValue: true
        });
        
        if (result.exceptionDetails) {
            return {
                success: false,
                error: result.exceptionDetails.text
            };
        }
        
        return {
            success: true,
            url: url,
            result: result.result.value
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Get cookies and localStorage data from a page
 */
async function getStorageData(url) {
    let client;
    try {
        client = await CDP();
        const {Page, Storage, Runtime} = client;
        
        await Storage.enable();
        await Page.enable();
        
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Get cookies
        const cookiesInfo = await Runtime.evaluate({
            expression: 'document.cookie'
        });
        
        // Get localStorage
        const localStorageInfo = await Runtime.evaluate({
            expression: 'Object.entries(localStorage).reduce((acc, [key, value]) => { acc[key] = value; return acc; }, {})',
            returnByValue: true
        });
        
        // Get sessionStorage
        const sessionStorageInfo = await Runtime.evaluate({
            expression: 'Object.entries(sessionStorage).reduce((acc, [key, value]) => { acc[key] = value; return acc; }, {})',
            returnByValue: true
        });
        
        return {
            success: true,
            url: url,
            cookies: cookiesInfo.result.value,
            localStorage: localStorageInfo.result.value || {},
            sessionStorage: sessionStorageInfo.result.value || {}
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Get full page screenshot (scrollable content)
 */
async function getFullPageScreenshot(url) {
    let client;
    try {
        client = await CDP();
        const {Page} = client;
        
        await Page.enable();
        
        // Set device metrics
        await Page.setDeviceMetricsOverride({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1
        });
        
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Get layout metrics to determine page height
        const layoutMetrics = await Page.getLayoutMetrics();
        const fullHeight = layoutMetrics.contentSize.height;
        
        // Update metrics to capture full page height
        await Page.setDeviceMetricsOverride({
            width: 1200,
            height: fullHeight,
            deviceScaleFactor: 1
        });
        
        // Capture full page screenshot
        const screenshot = await Page.captureScreenshot({format: 'png', fromSurface: true});
        
        return {
            success: true,
            url: url,
            data: screenshot.data,
            format: 'png',
            height: fullHeight
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Check accessibility issues on a page
 */
async function checkAccessibility(url) {
    let client;
    try {
        client = await CDP();
        const {Page, Runtime} = client;
        
        await Page.enable();
        await Page.navigate({url});
        await Page.loadEventFired();
        
        // Run accessibility checks
        const a11yResults = await Runtime.evaluate({
            expression: `{
                missingAlt: Array.from(document.querySelectorAll('img:not([alt])')).length,
                missingLabels: Array.from(document.querySelectorAll('input:not([aria-label]):not([id])')).length,
                lowContrast: 0,
                headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({tag: h.tagName, text: h.textContent.substring(0, 50)})),
                buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map(b => ({text: b.textContent.substring(0, 50), ariaLabel: b.getAttribute('aria-label')})),
                links: Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent.substring(0, 50), title: a.getAttribute('title')}))
            }`,
            returnByValue: true
        });
        
        return {
            success: true,
            url: url,
            accessibility: a11yResults.result.value
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

module.exports = {
    captureScreenshot,
    getPerformanceMetrics,
    getPageInfo,
    monitorNetwork,
    captureConsoleLogs,
    generatePDF,
    executeJavaScript,
    getStorageData,
    getFullPageScreenshot,
    checkAccessibility
};
