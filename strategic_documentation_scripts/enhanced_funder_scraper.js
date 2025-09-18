---
title: "Funder scraper"
type: "strategic"
audience: "consultants"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

/**
 * Enhanced Film Funding Scraper for Google Apps Script
 * 
 * This script provides a more robust approach to scraping film funding opportunities
 * with better error handling, multiple date formats, and intelligent funder classification.
 */

// Configuration object to centralize settings and make maintenance easier
const CONFIG = {
  SHEET_NAME: 'FunderFeed',
  TIMEOUT: 30000, // 30 seconds timeout for web requests
  MAX_RETRIES: 3,
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (compatible; FundingScraper/1.0)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
};

// Comprehensive funder database with detailed characteristics
const FUNDER_DATABASE = {
  'bmz.de': {
    name: 'BMZ (German Federal Ministry)',
    type: 'Government',
    archetype: 'Pragmatic Bureaucrat',
    focus: ['development', 'international', 'social impact'],
    typical_amounts: [50000, 500000],
    application_complexity: 'High'
  },
  'eacea.ec.europa.eu': {
    name: 'Creative Europe',
    type: 'International Organization',
    archetype: 'Systems Thinker',
    focus: ['cultural', 'european', 'cross-border'],
    typical_amounts: [100000, 2000000],
    application_complexity: 'Very High'
  },
  'sundance.org': {
    name: 'Sundance Institute',
    type: 'Private Foundation',
    archetype: 'Mission-Driven Advocate',
    focus: ['independent', 'emerging artists', 'storytelling'],
    typical_amounts: [15000, 100000],
    application_complexity: 'Medium'
  }
};

/**
 * Main function to scrape film funding opportunities
 * This orchestrates the entire scraping process with proper error handling
 */
function scrapeFilmFunds() {
  try {
    Logger.log('Starting film funding scraper...');
    
    // Get the target spreadsheet and prepare it
    const sheet = prepareSpreadsheet();
    
    // Define URLs to scrape - easily expandable
    const urls = [
      'https://www.bmz.de/en/what_we_do/issues/media/funding',
      'https://eacea.ec.europa.eu/creative-europe/funding',
      'https://www.sundance.org/funding'
    ];
    
    const allFunders = [];
    
    // Process each URL with individual error handling
    urls.forEach((url, index) => {
      try {
        Logger.log(`Processing URL ${index + 1}/${urls.length}: ${url}`);
        const funderData = processFunderUrl(url);
        if (funderData) {
          allFunders.push(funderData);
        }
      } catch (error) {
        Logger.log(`Error processing ${url}: ${error.message}`);
        // Continue with other URLs even if one fails
      }
    });
    
    // Write results to spreadsheet
    if (allFunders.length > 0) {
      writeToSpreadsheet(sheet, allFunders);
      Logger.log(`Successfully scraped ${allFunders.length} funders`);
    } else {
      Logger.log('No funders were successfully scraped');
    }
    
    // Add timestamp for tracking
    updateLastRunTimestamp(sheet);
    
  } catch (error) {
    Logger.log(`Critical error in scrapeFilmFunds: ${error.message}`);
    throw error;
  }
}

/**
 * Prepare the spreadsheet with proper headers and formatting
 */
function prepareSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
  }
  
  // Set up headers if they don't exist
  const headers = ['Funder Name', 'Deadline', 'Archetype', 'Funding Amount', 'Focus Areas', 'Complexity', 'Last Updated'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  
  return sheet;
}

/**
 * Process a single funder URL with comprehensive error handling
 */
function processFunderUrl(url) {
  let html;
  let attempts = 0;
  
  // Retry logic for network requests
  while (attempts < CONFIG.MAX_RETRIES) {
    try {
      const response = UrlFetchApp.fetch(url, {
        headers: CONFIG.HEADERS,
        muteHttpExceptions: true,
        timeout: CONFIG.TIMEOUT
      });
      
      if (response.getResponseCode() === 200) {
        html = response.getContentText();
        break;
      } else {
        throw new Error(`HTTP ${response.getResponseCode()}`);
      }
    } catch (error) {
      attempts++;
      Logger.log(`Attempt ${attempts} failed for ${url}: ${error.message}`);
      if (attempts >= CONFIG.MAX_RETRIES) {
        throw error;
      }
      Utilities.sleep(2000 * attempts); // Exponential backoff
    }
  }
  
  // Extract funder information
  const domain = extractDomain(url);
  const funderInfo = FUNDER_DATABASE[domain];
  
  if (!funderInfo) {
    Logger.log(`No funder information found for domain: ${domain}`);
    return null;
  }
  
  // Extract deadlines using multiple strategies
  const deadlines = extractDeadlines(html);
  const amounts = extractFundingAmounts(html, funderInfo);
  
  return {
    name: funderInfo.name,
    deadline: deadlines.length > 0 ? deadlines[0] : 'Rolling',
    archetype: funderInfo.archetype,
    pot: amounts.length > 0 ? amounts[0] : formatAmountRange(funderInfo.typical_amounts),
    focus: funderInfo.focus.join(', '),
    complexity: funderInfo.application_complexity,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
}

/**
 * Extract domain from URL for funder lookup
 */
function extractDomain(url) {
  try {
    const matches = url.match(/https?:\/\/([^\/]+)/);
    return matches ? matches[1] : '';
  } catch (error) {
    Logger.log(`Error extracting domain from ${url}: ${error.message}`);
    return '';
  }
}

/**
 * Enhanced deadline extraction with multiple date formats and patterns
 */
function extractDeadlines(html) {
  const deadlines = [];
  
  // Multiple regex patterns for different date formats
  const datePatterns = [
    // Standard formats: MM/DD/YYYY, DD/MM/YYYY
    /(?:deadline|due|submit|application).*?(\d{1,2}\/\d{1,2}\/\d{4})/gi,
    // ISO format: YYYY-MM-DD
    /(?:deadline|due|submit|application).*?(\d{4}-\d{2}-\d{2})/gi,
    // Month name formats: January 15, 2024
    /(?:deadline|due|submit|application).*?([A-Za-z]+ \d{1,2},? \d{4})/gi,
    // Short month: Jan 15, 2024
    /(?:deadline|due|submit|application).*?([A-Za-z]{3} \d{1,2},? \d{4})/gi,
    // European format: 15 January 2024
    /(?:deadline|due|submit|application).*?(\d{1,2} [A-Za-z]+ \d{4})/gi
  ];
  
  datePatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const dateStr = match.replace(/.*?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|[A-Za-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Za-z]+ \d{4})/i, '$1');
        deadlines.push(dateStr);
      });
    }
  });
  
  // Remove duplicates and sort by date
  return [...new Set(deadlines)].sort();
}

/**
 * Extract funding amounts from HTML content
 */
function extractFundingAmounts(html, funderInfo) {
  const amounts = [];
  
  // Patterns for different currency formats
  const amountPatterns = [
    /(?:up to|maximum|grant|funding|award).*?[\$€£¥][\d,]+(?:,\d{3})*(?:\.\d{2})?/gi,
    /[\$€£¥][\d,]+(?:,\d{3})*(?:\.\d{2})?.*?(?:available|funding|grant|award)/gi,
    /(?:up to|maximum|grant|funding|award).*?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|dollars|euros|pounds)/gi
  ];
  
  amountPatterns.forEach(pattern => {
    const matches = html.match(pattern);
    if (matches) {
      matches.forEach(match => {
        amounts.push(match.trim());
      });
    }
  });
  
  return amounts.length > 0 ? amounts : [formatAmountRange(funderInfo.typical_amounts)];
}

/**
 * Format typical amount range for display
 */
function formatAmountRange(amounts) {
  if (amounts.length >= 2) {
    return `$${amounts[0].toLocaleString()} - $${amounts[1].toLocaleString()}`;
  }
  return 'Amount varies';
}

/**
 * Write extracted data to spreadsheet with proper formatting
 */
function writeToSpreadsheet(sheet, fundersData) {
  if (fundersData.length === 0) return;
  
  // Clear existing data (except headers)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Prepare data for batch writing
  const values = fundersData.map(funder => [
    funder.name,
    funder.deadline,
    funder.archetype,
    funder.pot,
    funder.focus,
    funder.complexity,
    funder.lastUpdated
  ]);
  
  // Write data in batch for better performance
  const range = sheet.getRange(2, 1, values.length, values[0].length);
  range.setValues(values);
  
  // Apply formatting
  formatSpreadsheet(sheet, values.length);
}

/**
 * Apply consistent formatting to the spreadsheet
 */
function formatSpreadsheet(sheet, dataRows) {
  // Auto-resize columns
  sheet.autoResizeColumns(1, 7);
  
  // Apply alternating row colors for better readability
  const dataRange = sheet.getRange(2, 1, dataRows, 7);
  dataRange.setBorder(true, true, true, true, true, true);
  
  // Color code by archetype for quick visual identification
  const archetypeColors = {
    'Pragmatic Bureaucrat': '#e3f2fd',
    'Systems Thinker': '#f3e5f5',
    'Mission-Driven Advocate': '#e8f5e8',
    'Community Champion': '#fff3e0'
  };
  
  // Apply conditional formatting based on archetype
  for (let i = 2; i <= dataRows + 1; i++) {
    const archetype = sheet.getRange(i, 3).getValue();
    const color = archetypeColors[archetype] || '#ffffff';
    sheet.getRange(i, 1, 1, 7).setBackground(color);
  }
}

/**
 * Update timestamp to track when the scraping was last run
 */
function updateLastRunTimestamp(sheet) {
  const timestamp = new Date().toLocaleString();
  sheet.getRange(1, 8).setValue(`Last Updated: ${timestamp}`);
  sheet.getRange(1, 8).setFontStyle('italic');
}

/**
 * Utility function to schedule regular updates
 * Call this once to set up automatic scraping
 */
function setupAutomaticScraping() {
  // Delete existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'scrapeFilmFunds') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger to run weekly
  ScriptApp.newTrigger('scrapeFilmFunds')
    .timeBased()
    .everyWeeks(1)
    .create();
  
  Logger.log('Automatic scraping scheduled to run weekly');
}