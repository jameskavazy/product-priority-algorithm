# Product Prioritization and Google Merchant Integration Script

This script evaluates each product's individual priority which produces a supplementary feed to import priorities into the Google PMax / Shopping campaigns. The script helps by bucketing products into three evenly sized groups, each group worth an equal amount of stock valuation. It uses product attributes to assess historical performance, and determines if the product has a high, medium or low gross profit valuation based on the the bucket it is. It then assigns a priority score to each product. 

Ultimately, this allows integration with Google Ads to structure shopping campaigns, bids and budgets, based upon the importance of products to the client.

## Features

- **Product Grouping:** Products are divided into three groups (low, medium, high), each with an equal stock valuation. The highest group will have the highest profit valuation products in.
- **Priority Scoring:** Products are ranked based on this stock valuation and performance indices.
- **Generates A Supplementary Feed via Google Sheets :** Product IDs and priorities are inserted into a Google spreadsheet for use in Google Merchant Center. Prioritization data is used to optimize ad spending and bidding strategies through Performance Max campaigns.

## Setup Instructions

### Prerequisites

- **Google Merchant Center Account:** Make sure you have access to your Merchant ID.
- **Shopping Content API:** Enable the Shopping Content API in your Google Ads Script file.
- **Feed Data:** Your feed must utilise the [quantity] and [cost_of_goods_sold] attributes in order for the prioritisation logic to work.

### Configuration

1. **Copy & Paste Script:**
   - Copy the script code into your Google Ads Scripts by navigating to `Bulk Actions > Scripts` and clicking on the `+` logo.

2. **Insert Credentials:**
   - Replace the placeholder `MERCHANT_ID` with your actual Google Merchant ID in the script.
   - Update the `spreadsheetUrl` variable with the URL of your target Google spreadsheet.

3. **Sheets Setup:**
   - Create a Google Sheet with the following sheets:
     - **`gp` Sheet:** This sheet will store product IDs and their assigned priorities.
     - **`underlyingData` Sheet:** This sheet will store detailed product data, including IDs, margins, stock levels, and indices.
     - **`Sheet3` Sheet:** A placeholder sheet used by the script for intermediate data processing.

4. **Permissions:**
   - Ensure the Google Ads Scripts has authorisation from your Google Account and that Shopping Content API is enabled.

### Running the Script

- To run the script, click on the `Run` button. Note: The script makes no changes to Google Ads configuartions and therefore both preview and run, will run the script.


### Script Functions

- **`processMarginData()`:** Gathers and processes product data, calculating the total stock valuation.
- **`productList()`:** Fetches the list of products, scores them, and assigns priority ratings.
- **`createMarginBuckets()`:** Sorts products into three equal value buckets based on stock valuation (gross profit).
- **`setupSpreadsheet()`:** Prepares the target Google Sheets for data insertion.
- **`populateSpreadsheet()`:** Inserts priority data into the `gp` sheet.
- **`populateUnderlyingData()`:** Inserts detailed product data into the `underlyingData` sheet.
- **`getWeightedProfitMargin()`:** Calculates the weighted profit margin for each product based on price, cost of goods sold, and stock levels.
- **`getIndexScore()`:** Determines the score of a product based on its assigned index.
- **`findBucket()`:** Identifies which bucket a product belongs to and assigns it a corresponding score.

### Error Handling

- The script includes basic error logging to help diagnose issues. Errors are logged to the console with context-specific messages.

### Notes

- Regularly review the script logs for any errors or unexpected behavior.
- Update the product data regularly to ensure the priority scores remain accurate and relevant.
