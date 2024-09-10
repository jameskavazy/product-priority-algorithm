const MERCHANT_ID = ''; //INSERT Merchant ID here
var spreadsheetUrl = ''; //INSERT GOOGLE SHEET URL
var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
let sheet = spreadsheet.getSheetByName('gp');
let underlyingDataSheet = spreadsheet.getSheetByName('underlyingData');
let bucketSheet = spreadsheet.getSheetByName('Sheet3');

const sheetRows = [];
var dataRows = [];
var lowerThird = [];
var middleThird = [];
var upperThird = [];
var buckets = {};
var productArray = [];
var totalStockValuation = 0;


function main() {
    processMarginData();
    setupSpreadsheet();
    productList();
    populateSpreadsheet();
    populateUnderlyingData();
}

function productList() {
    const merchantId = MERCHANT_ID;
    let pageToken;
    let pageNum = 1;
    const maxResults = 250;
    try {
        do {
            const products = ShoppingContent.Products.list(merchantId, {
                pageToken: pageToken, maxResults: maxResults
            });
            console.log('Page ' + pageNum);
            if (products.resources) {
                for (let i = 0; i < products.resources.length; i++) {
                    const product = products.resources[i];
                    //No COGS means Local Product Inventory Item     
                    if (product.costOfGoodsSold !== undefined) {
                        const stockLevel = product.customLabel2;
                        const weightedMargin = getWeightedProfitMargin(product);
                        const index = product.customLabel4;
                        var finalRating;
                        var indexScore = getIndexScore(index);
                        var marginScore = findBucket(buckets, product);
                        var productPrioScore = marginScore + indexScore;

                        if (productPrioScore >= 5) {
                            finalRating = 'high'
                        } else if (productPrioScore == 4) {
                            finalRating = 'mid'
                        } else if (productPrioScore <= 3) {
                            finalRating = 'low'
                        }
                        dataRows.push([product.offerId, weightedMargin, stockLevel, index]);
                        sheetRows.push([product.offerId, finalRating]);
                    }
                }
            } else {
                console.log('No more products in account ' + merchantId);
            }
            pageToken = products.nextPageToken;
            pageNum++;
        } while (pageToken);

    } catch (e) { console.log('Failed with error: $s', e); }
}

function getIndexScore(index) {
    var indexScore = 1; switch (index) {
        case 'over-index': indexScore = 3; break;
        case 'index': indexScore = 3; break;
        case 'near-index': indexScore = 3; break;
        case 'under-index': indexScore = 2; break;
        case 'no-index': indexScore = 1; break;
    }
    return indexScore;
}

function setupSpreadsheet() {
    try {
        var range = sheet.getDataRange();
        range.clearContent();
        var header = ['id', 'custom label 3'];
        sheet.appendRow(header);
    } catch (e) {
        sheet.deleteColumns(10, 5000);
    }
}

function populateSpreadsheet() {
    if (sheetRows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, sheetRows.length, 2).setValues(sheetRows);
    } else console.log('No data to push to sheet. Check data API request');
}

function populateUnderlyingData() {
    underlyingDataSheet.clearContents();
    underlyingDataSheet.appendRow(['id', 'margin', 'stock', 'index']);
    underlyingDataSheet.getRange(underlyingDataSheet.getLastRow() + 1, 1, dataRows.length, 4).setValues(dataRows);
}

function processMarginData() {
    const merchantId = MERCHANT_ID;
    let pageToken;
    let pageNum = 1;
    const maxResults = 250;
    try {
        do {
            const products = ShoppingContent.Products.list(merchantId, {
                pageToken: pageToken, maxResults: maxResults
            });
            console.log('Page ' + pageNum);
            if (products.resources) {
                for (let i = 0; i < products.resources.length; i++) {
                    const product = products.resources[i];
                    if (product.costOfGoodsSold !== undefined) {
                        productArray.push(product);
                        totalStockValuation += getWeightedProfitMargin(product);
                    }
                }
            } else {
                console.log('No more products in account ' + merchantId);
            }
            pageToken = products.nextPageToken;
            pageNum++;
        } while (pageToken);

        buckets = createMarginBuckets(productArray);
    } catch (e) {
        console.log(`preprocess marginData has an error: ${e}`);
    }
}

function createMarginBuckets(products) {

    products.sort((a, b) => {
        if (a.channel == 'online' && b.channel == 'online') {
            const weightedProfitMarginA = getWeightedProfitMargin(a);
            const weightedProfitMarginB = getWeightedProfitMargin(b);
            return weightedProfitMarginA - weightedProfitMarginB;
        } else {
            console.log(`Unexpected channel for sorting: A = ${a.channel}, B = ${b.channel}`);
            return 0;
        }
    });

    const targetBucketValue = totalStockValuation / 3;
    const buckets_test = { low: [], mid: [], high: [] };


    let currentBucket = 'low';
    let currentBucketValue = 0;

    for (let product of products) {
        const weightedStockValue = getWeightedProfitMargin(product);
        buckets_test[currentBucket].push(product);
        currentBucketValue += weightedStockValue;
        if (currentBucketValue >= targetBucketValue) {
            if (currentBucket === 'low') {

                currentBucket = 'mid'

            } else if (currentBucket === 'mid') {

                currentBucket = 'high'
            } currentBucketValue = 0;
        }
    }
    logBuckets(buckets_test['low'], buckets_test['mid'], buckets_test['high']); 
    return buckets_test;
}
function findBucket(buckets, product) {
    try {
        if (buckets['low'].some(p => p.offerId === product.offerId)) {
            //low          
            return 1;
        } else if (buckets['mid'].some(p => p.offerId === product.offerId)) {
            //mid         
            return 2;
        } else if (buckets['high'].some(p => p.offerId === product.offerId)) {
            //high
            return 3;
        } else {
            return 1;
        }
    } catch (e) {
        console.log(`findBucket error ${e}`);
    }

}


function getWeightedProfitMargin(product) {
    if (product.costOfGoodsSold !== undefined) {
        const margin = getPrice(product) - Number(product.costOfGoodsSold.value);
        const qty = getStockQty(product);
        return margin * qty
    }
}

function getPrice(product) {
    const price = product.salePrice ? Number(product.salePrice.value) : Number(product.price.value);
    if (price === 0) {
        console.log(`Price is 0 for product ${product.offerId}`);
        return 1;
    } return price;
}

function getStockQty(product) {
    if (product.sellOnGoogleQuantity === undefined) {
        //console.log(`Product ${product.offerId} has no quantity sold on Google defined`)  
        return 1;
    } if (Number(product.sellOnGoogleQuantity) === 0) {
        //console.log(`Product ${product.offerId} has 0 quantity sold - Assumes a nominal value of 1`)  
        return 1;
    } 
    return Number(product.sellOnGoogleQuantity);
}


function logBuckets(lowMargin, midMargin, highMargin) {
    console.log(`Low Margin Bucket (${lowMargin.length} items):`);

    lowMargin.forEach(product => { 
        console.log(`Product ID: ${product.offerId}, Weighted Margin: ${getWeightedProfitMargin(product)}`); 
    });

    console.log(`Mid Margin Bucket (${midMargin.length} items):`);
    midMargin.forEach(product => { 
        console.log(`Product ID: ${product.offerId}, Weighted Margin: ${getWeightedProfitMargin(product)}`); 
    });

    console.log(`High Margin Bucket (${highMargin.length} items):`);
    highMargin.forEach(product => { 
        console.log(`Product ID: ${product.offerId}, Weighted Margin: ${getWeightedProfitMargin(product)}`); 
    });
}
