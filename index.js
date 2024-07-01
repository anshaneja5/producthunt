const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { setTimeout } = require('node:timers/promises');
const async = require('async');
const csvWriter = require('csv-writer').createObjectCsvWriter;

const baseUrl = 'https://www.producthunt.com';

// Initialize the CSV writer with headers
function getCsvWriter(outputPath) {
    return csvWriter({
        path: outputPath,
        header: [
            { id: 'Name', title: 'Name' },
            { id: 'Upvotes', title: 'Upvotes' },
            { id: 'Comments', title: 'Comments' },
            { id: 'Link', title: 'Link' },
            { id: 'Comments_Data', title: 'Comments_Data' }
        ],
        append: false  // Set to false to create headers initially
    });
}

// Function to fetch page content using Puppeteer and scroll to load more data
async function fetchPageContent(url, scrolls = 10) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    for (let i = 0; i < scrolls; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await setTimeout(3000);
    }

    const content = await page.content();
    await browser.close();
    return content;
}

// Function to parse product listings from Product Hunt
function parseProductHuntPage(htmlContent) {
    const cheerio = require('cheerio');
    const $ = cheerio.load(htmlContent);
    const products = [];

    $('[data-test^="homepage-section"]').each((i, section) => {
        $(section).find('[data-test^="post-item"]').each((j, listing) => {
            const name = $(listing).find('[data-test^="post-name"]').text().trim();
            const upvotes = $(listing).find('[data-test="vote-button"]').text().trim() || '0';
            const comments = $(listing).find('.styles_commentLink__VXAIF').text().trim() || '0';
            const link = `${baseUrl}${$(listing).find('[data-test^="post-name"]').attr('href')}`;

            if (name) {
                products.push({ Name: name, Upvotes: upvotes, Comments: comments, Link: link });
            }
        });
    });
    return products;
}

// Function to load all comments
async function loadAllComments(page) {
    while (true) {
        try {
            const loadMoreButton = await page.$x("//button[contains(text(), 'more comments')]");
            if (loadMoreButton.length > 0) {
                await loadMoreButton[0].click();
                await setTimeout(2000);
            } else {
                break;
            }
        } catch (error) {
            break;
        }
    }
}

// Function to scrape comments for a product
async function scrapeProductComments(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await setTimeout(3000);
    await loadAllComments(page);

    const comments = await page.evaluate(() => {
        const commentThreads = document.querySelectorAll('[data-test^="thread"]');
        const commentsData = [];

        commentThreads.forEach((thread) => {
            const threadComments = thread.querySelectorAll('[data-test^="comment"]');
            threadComments.forEach((comment) => {
                const user = comment.querySelector('[data-test^="user-image-link"]')?.getAttribute('aria-label') || 'Anonymous';
                const content = comment.querySelector('.styles_commentBody__PMsJ2')?.textContent.trim() || '';
                commentsData.push({ User: user, Content: content });
            });
        });

        return commentsData;
    });

    await browser.close();
    return comments;
}

// Function to save data to CSV in real-time
async function saveProductToCSV(writer, product) {
    await writer.writeRecords([product]);
}

// Main script execution
async function scrapeProductHunt(scrolls = 10, outputPath = 'product_hunt_products.csv') {
    const url = `${baseUrl}/all`;
    const htmlContent = await fetchPageContent(url, scrolls);
    const products = parseProductHuntPage(htmlContent);

    const writer = getCsvWriter(outputPath);

    // Write headers if the file does not exist
    if (!fs.existsSync(outputPath)) {
        await writer.writeRecords([]); // This will create the file with headers
    }

    for (const product of products) {
        console.log(`Scraping comments for: ${product.Name}`);
        const comments = await scrapeProductComments(product.Link);
        product.Comments_Data = JSON.stringify(comments);
        await saveProductToCSV(writer, product);
    }

    console.log('Scraping completed and data saved.');
}

module.exports = scrapeProductHunt;

// Command-line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const scrolls = parseInt(args[0], 10) || 10;
    const outputPath = args[1] || 'product_hunt_products.csv';

    scrapeProductHunt(scrolls, outputPath)
        .then(() => console.log('Scraping completed.'))
        .catch((err) => console.error('Error scraping Product Hunt:', err));
}
