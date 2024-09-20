# Product Prioritisation Algorithm

This script ranks your products into three groups (high, medium, low), using data from your product feed, historical performance metrics from Google Ads, and price competiveness metrics within Google Merchant Centre. By ranking products, it helps PPC marketers to optimise Performance Max campaigns. This data is inserted into a Google Sheet, for use as a supplementary feed within Google Merchant Centre, which can then be used within your Google Ads account to segment your products in a strategic way.

## Features

- **Product Ranking:** A priority score is assigned to each product based on historical performance, stock valuation (see below), and price competitiveness using Google Merchant Centre benchmark prices.
- **Stock Valuation Calculation:** The script calculates the total stock valuation for each product, measured in gross profit.
- **Supplementary Feed Generation:** Results are pushed into Google Sheets to provide structured data for further use in Google Merchant Center and Ads.

## Setup Instructions

### Prerequisites

1. **Google Merchant Center Account:** Ensure you have your Merchant ID ready.
2. **Google Shopping Content API:** Enable the Shopping Content API in your Google Ads script configuration.
3. **Product Feed Requirements:** Your product feed must include the `[quantity]` and `[cost_of_goods_sold]` attributes for proper prioritisation logic.

### Configuration

1. **Script Installation:**
   - Copy the script code and paste it into your Google Ads Scripts `Bulk Actions > Scripts > + Add Script`.

2. **Insert Credentials:**
   - Replace the placeholder `MERCHANT_ID` with your actual Google Merchant ID.
   - Update the `spreadsheetUrl` variable with the URL of the target Google spreadsheet.

3. **Google Sheets Setup:**
   - Create a Google Sheet with the following sheets:
     - `gp`: This is the main sheet that the supplementary feed will use
     - `underlyingData`: Stores detailed product data, including IDs, stock valuation, indices, benchmark prices, and sale prices.

### Permissions

Ensure the script has authorization from your Google Account and Shopping Content API is enabled.

## Running the Script

1. **Initial Setup:** Run the script by clicking the "Run" button in the Google Ads Scripts interface.
2. **No Changes to Google Ads:** The script does not make any changes to your Google Ads configuration, so both preview and run modes can be used safely. Please note that preview and run therefore have the same effect.

## Script Functions

- **`main()`:** The primary function that orchestrates all processes, including product generation, scoring, and spreadsheet population.
- **`generateProducts()`:** Fetches products from Google Merchant Center and calculates the stock valuation for each product.
- **`scoreProducts()`:** Assigns a priority rating (high, mid, or low) to each product based on valuation, index score, and benchmark price competitiveness.
- **`addBenchmarkPriceData()`:** Retrieves benchmark prices from Google and compares them with the product’s sale price.
- **`addValuationBucketData()`:** Sorts products into "low", "mid", or "high" valuation buckets based on stock value.
- **`setupSpreadsheet()`:** Prepares the target Google Sheets for data insertion by clearing previous data and appending headers.
- **`populateSpreadsheet()`:** Inserts priority data into the `gp` sheet.
- **`populateUnderlyingData()`:** Inserts detailed product data into the `underlyingData` sheet.

## Error Handling

The script includes basic error logging to help diagnose issues. Errors are logged to the console with context-specific messages.

## Notes

- Regularly review the logs for errors or unexpected behavior.
- Update the product feed regularly to ensure the prioritization data remains accurate.
