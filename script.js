const MERCHANT_ID = ; //ENTER MERCHANT ID Here

var spreadsheetUrl = ''; //ENTER SPREADSHEET URL HERE
var spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
let sheet = spreadsheet.getSheetByName('gp'); 
let underlyingDataSheet = spreadsheet.getSheetByName('underlyingData');

// Script starts below - don't edit below this line ----------------------------------

const sheetRows = [];
const dataRows = []; 
const productsArray = [];
var totalStockValuation = 0;

function main(){
  generateProducts();
  addBenchmarkPriceData();
  addValuationBucketData(productsArray);
  scoreProducts();
  setupSpreadsheet();
  populateSpreadsheet();
  populateUnderlyingData();

}

function generateProducts() {
  const merchantId = MERCHANT_ID; 
  let pageToken;
  let pageNum = 1;
  const maxResults = 250;
  try {
    do {
      const productsReport = ShoppingContent.Products.list(merchantId, {
        pageToken: pageToken,
        maxResults: maxResults
      });

      if (productsReport.resources) {
        var product = {};
        for (let i = 0; i < productsReport.resources.length; i++) {
          const reportProduct = productsReport.resources[i];
          //No COGS means Local Product Inventory Item, ie skip
           if (reportProduct.costOfGoodsSold !== undefined){
            const productValuation = getWeightedProfitMargin(reportProduct);
            totalStockValuation += productValuation;

            product.offerId = reportProduct.offerId;
            product.price = getPrice(reportProduct);
            product.index = reportProduct.customLabel4;
            product.stockValuation = productValuation;
            productsArray.push(product);
            product = {};
           }
        }
      } else {
        console.log('No more products in account ' + merchantId);
      }
      pageToken = productsReport.nextPageToken;
      pageNum++;
    } while (pageToken); 
  } catch (e) {
    console.log('Failed with error: $s', e);
  }
}

function scoreProducts() {

  for (product of productsArray) {

    var finalRating;
    var indexScore;
    var valuationScore;
    var benchmarkPriceScore;

    indexScore = getIndexScore(product);

    valuationScore = getValuationScore(product);

    benchmarkPriceScore = getBenchmarkPriceScore(product); 

    var productPrioScore = valuationScore + indexScore + benchmarkPriceScore;

    if (productPrioScore >= 7) {
      finalRating = 'high';

    } else if (productPrioScore >= 6) {
      finalRating = 'mid';


    } else {
      finalRating = 'low';

    }
    
    

    dataRows.push([product.offerId, product.stockValuation, product.valuationBucket, product.index, product.benchmarkPrice, product.price]);
    sheetRows.push([product.offerId, finalRating, valuationScore, indexScore, benchmarkPriceScore]);

  }
  
}

function getBenchmarkPriceScore(product) {
  if (product.benchmarkPrice === undefined) {
    return 2;

  } else if (product.price <= product.benchmarkPrice) {
    return 3;

  } else if (product.price > (product.benchmarkPrice * 1.05)) {
    return 1;

  } else return 2;

}

function getValuationScore(product) {
  if (product.valuationBucket === "high") {
    return 3;

  } else if (product.valuationBucket === "mid") {
    return 2;

  } else return 1;
}

function getIndexScore(product){
  
  var indexScore = 1;
  
     switch (product.index) {

       case 'over-index':
         indexScore = 3;
         break;

       case 'index':
         indexScore = 3;
         break;

       case 'near-index':
         indexScore = 3;
         break;

       case 'under-index':
         indexScore = 2;
         break;

       case 'no-index':
         indexScore = 1;
         break;
     }

  return indexScore;
  
}

function setupSpreadsheet(){
  
  try {
    var range = sheet.getDataRange();
    range.clearContent();
    var header = ['id', 'custom label 3', 'margin score', 'index score', 'price comp score'];
    sheet.appendRow(header);
  } catch (e) {
    sheet.deleteColumns(10, 5000);
  }
  
}

function populateSpreadsheet(){
  if (sheetRows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, sheetRows.length, 5).setValues(sheetRows);
  } else console.log('No data to push to sheet. Check data API request');
}

function populateUnderlyingData(){
  underlyingDataSheet.clearContents();
  underlyingDataSheet.appendRow(['id','valuation','val bucket','index', 'benchmark price', 'sale price']);
  underlyingDataSheet.getRange(underlyingDataSheet.getLastRow() + 1, 1, dataRows.length, 6).setValues(dataRows);  
}



function addValuationBucketData(products){
  
  products.sort((a, b) => {     
    return a.stockValuation - b.stockValuation;
  });


  const targetBucketValue = totalStockValuation / 3;
  let currentBucket = 'low'
  let currentBucketValue = 0;

  for (let product of products) {
      product.valuationBucket = currentBucket;
      currentBucketValue += product.stockValuation;
        
      
      if (currentBucketValue >= targetBucketValue){
        if (currentBucket === 'low'){
          currentBucket = 'mid'
        } else if (currentBucket === 'mid'){
          currentBucket = 'high'
        }
        currentBucketValue = 0;
      } 
  }
}                               

function getWeightedProfitMargin(product){
  if (product.costOfGoodsSold !== undefined){
    const margin = getPrice(product) - Number(product.costOfGoodsSold.value);
    const qty = getStockQty(product);

    return margin * qty
  }
}

function getPrice(product){ 
  const price = product.salePrice ? Number(product.salePrice.value) : Number(product.price.value);
  if (price === 0) {
    console.log(`Price is 0 for product ${product.offerId}`);
    return 1;
  }
  
  return price;
}


function getStockQty(product) {
  if (product.sellOnGoogleQuantity === undefined) {
    //console.log(`Product ${product.offerId} has no quantity sold on Google defined`)
    return 1;
  }
  if (Number(product.sellOnGoogleQuantity) === 0){
    //console.log(`Product ${product.offerId} has 0 quantity sold - Assumes a nominal value of 1`)
    return 1;
  }
  return Number(product.sellOnGoogleQuantity)
}

function addBenchmarkPriceData(){
  let pageToken;
   
  do {
    
    const report = ShoppingContent.Reports.search({
        "query": `SELECT 
                      product_view.id, 
                      product_view.offer_id, 
                      product_view.price_micros, 
                      price_competitiveness.country_code, 
                      price_competitiveness.benchmark_price_micros,
                      price_competitiveness.benchmark_price_currency_code 
                  FROM PriceCompetitivenessProductView`,
      
        "pageToken": pageToken 
      }
    , MERCHANT_ID);
    
    
    if (report.results){   
      for (var i = 0; i < report.results.length; i++){
        const row = report.results[i];

        for (const product of productsArray) {

          if (product.offerId === row["productView"]["offerId"]){
            const benchmarkPrice = Number(row["priceCompetitiveness"]["benchmarkPriceMicros"]) / 1000000;
            product["benchmarkPrice"] = benchmarkPrice;

            
          } 
        }
      }
      
      pageToken = report.nextPageToken;
    }   
    console.log(report.results.length);
    
  } while(pageToken); 
}
