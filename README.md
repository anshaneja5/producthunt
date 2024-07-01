## Overview

The Product Hunt Scraper allows you to scrape product listings from Product Hunt, capturing details like name, description, upvotes, comments, and more. The scraper uses Puppeteer and Cheerio to fetch and parse data, and outputs the data to a CSV file.

## Features

**✨ Efficient:** Uses Puppeteer to simulate browser behavior, ensuring all dynamic content is loaded.

**🛠 Real-time Output:** Writes data to a CSV file incrementally, allowing you to monitor progress.

**🔍 Comprehensive Data:** Captures detailed product information, including all comments.

## Installation

Install the scraper using npm:

```sh
npm install product-hunt-scraper
```

## Usage

To use the scraper, run:
```sh
npx product-hunt-scraper <number_of_scrolls> <output_file>
```
Example:

```sh
npx product-hunt-scraper 5 output.csv
```
Default number of scrolls: 10

Default output file: product_hunt_products.csv
