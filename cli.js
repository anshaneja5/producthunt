#!/usr/bin/env node

const scrapeProductHunt = require('./index.js');
const args = process.argv.slice(2);
const scrolls = args[0] ? parseInt(args[0], 10) : 10;
const output = args[1] || 'product_hunt_products.csv';

scrapeProductHunt(scrolls, output).catch(error => {
    console.error('Error scraping Product Hunt:', error);
});
