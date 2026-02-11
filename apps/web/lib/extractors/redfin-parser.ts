import * as cheerio from 'cheerio';
import type { ExtractedPropertyData } from './types';

/**
 * Property type mapping from Redfin labels to our enum values.
 */
const PROPERTY_TYPE_MAP: Record<string, ExtractedPropertyData['propertyType']> = {
  'single family residential': 'single_family',
  'single family': 'single_family',
  'single-family': 'single_family',
  'house': 'single_family',
  'multi-family': 'multi_family',
  'multi family': 'multi_family',
  'multifamily': 'multi_family',
  'duplex': 'multi_family',
  'triplex': 'multi_family',
  'fourplex': 'multi_family',
  'condo': 'condo',
  'condominium': 'condo',
  'condo/co-op': 'condo',
  'townhouse': 'townhouse',
  'townhome': 'townhouse',
  'commercial': 'commercial',
};

function mapPropertyType(raw: string | undefined): ExtractedPropertyData['propertyType'] | undefined {
  if (!raw) return undefined;
  return PROPERTY_TYPE_MAP[raw.toLowerCase().trim()];
}

/**
 * Parse Redfin listing HTML and extract property data.
 * Strategies:
 *   1. JSON-LD structured data (most reliable)
 *   2. Embedded JS data blobs (reactServerState / preloadedDataCache)
 *   3. Meta tags fallback
 *   4. CSS selector fallback for price
 */
export function parseRedfinHtml(html: string): ExtractedPropertyData {
  const $ = cheerio.load(html);
  const data: ExtractedPropertyData = {};

  // Strategy 1: JSON-LD
  try {
    extractFromJsonLd($, data);
  } catch { /* continue */ }

  // Strategy 2: Embedded JS data
  try {
    extractFromEmbeddedData(html, data);
  } catch { /* continue */ }

  // Strategy 3: Meta tags
  try {
    extractFromMetaTags($, data);
  } catch { /* continue */ }

  // Strategy 4: CSS selectors for price
  try {
    extractFromSelectors($, data);
  } catch { /* continue */ }

  // Strategy 5: Direct regex scan for tax/HOA in escaped JSON strings
  try {
    extractTaxAndHoaFromRawHtml(html, data);
  } catch { /* continue */ }

  // Auto-generate title from address
  if (!data.title && data.address) {
    const parts = [data.address, data.city, data.state].filter(Boolean);
    data.title = parts.join(', ');
  }

  return data;
}

/**
 * Extract property details from a residence-like JSON-LD entity.
 * Handles Apartment, SingleFamilyResidence, House, Residence, etc.
 */
function extractResidenceFields(entity: any, data: ExtractedPropertyData): void {
  if (!entity || typeof entity !== 'object') return;

  // Address
  if (entity.address) {
    const addr = entity.address;
    if (!data.address && addr.streetAddress) data.address = addr.streetAddress;
    if (!data.city && addr.addressLocality) data.city = addr.addressLocality;
    if (!data.state && addr.addressRegion) data.state = addr.addressRegion;
    if (!data.zipCode && addr.postalCode) data.zipCode = addr.postalCode;
  }

  // Beds — Redfin uses numberOfBedrooms, Zillow uses numberOfRooms
  if (!data.bedrooms) {
    const beds = entity.numberOfBedrooms || entity.numberOfRooms;
    if (beds) data.bedrooms = Number(beds);
  }

  // Baths — numberOfBathroomsTotal
  if (!data.bathrooms && entity.numberOfBathroomsTotal) {
    data.bathrooms = Number(entity.numberOfBathroomsTotal);
  }

  // Square feet
  if (!data.squareFeet && entity.floorSize?.value) {
    data.squareFeet = Number(entity.floorSize.value);
  }

  // Property type from accommodationCategory (e.g., "Condominium", "Single Family Residential")
  if (!data.propertyType && entity.accommodationCategory) {
    data.propertyType = mapPropertyType(entity.accommodationCategory);
  }
}

function extractFromJsonLd($: cheerio.CheerioAPI, data: ExtractedPropertyData): void {
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        const itemType = item['@type'];
        const types = Array.isArray(itemType) ? itemType : [itemType];

        // Check if this item IS a residence type
        const residenceTypes = ['Residence', 'SingleFamilyResidence', 'House', 'Apartment', 'Condominium'];
        const isResidence = types.some((t: string) =>
          residenceTypes.includes(t) || (typeof t === 'string' && t.includes('Residence'))
        );

        if (isResidence) {
          extractResidenceFields(item, data);
        }

        // RealEstateListing or Product — extract price from offers, and check mainEntity
        const isListing = types.includes('Product') || types.includes('RealEstateListing');
        if (isListing) {
          if (!data.purchasePrice && item.offers?.price) {
            data.purchasePrice = Number(item.offers.price);
          }

          // Redfin nests the actual property inside mainEntity
          if (item.mainEntity) {
            extractResidenceFields(item.mainEntity, data);
          }
          // Zillow nests property inside offers.itemOffered
          if (item.offers?.itemOffered) {
            extractResidenceFields(item.offers.itemOffered, data);
          }
        }
      }
    } catch { /* invalid JSON, skip */ }
  });
}

function extractFromEmbeddedData(html: string, data: ExtractedPropertyData): void {
  // Redfin embeds data in script tags as JS assignments
  // Look for patterns like: window.__reactServerState = {...}
  // or: preloadedDataCache = {...}

  // Strategy: find JSON-like blobs near property data keywords
  const patterns = [
    /window\.__reactServerState\s*=\s*({[\s\S]+?});?\s*<\/script>/,
    /window\.preloadedDataCache\s*=\s*({[\s\S]+?});?\s*<\/script>/,
    /"propertyData"\s*:\s*({[^}]+(?:{[^}]*}[^}]*)*})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;

    try {
      const blob = JSON.parse(match[1]);
      extractFromDataBlob(blob, data);
    } catch {
      // Try to find nested property objects even if the root parse fails
      tryExtractPropertyFromText(match[1], data);
    }
  }
}

function extractFromDataBlob(blob: any, data: ExtractedPropertyData): void {
  // Recursively search for property-like objects
  if (!blob || typeof blob !== 'object') return;

  // Check if this object has property-like fields
  if (blob.price || blob.listPrice || blob.listingPrice) {
    if (!data.purchasePrice) {
      data.purchasePrice = Number(blob.price || blob.listPrice || blob.listingPrice);
    }
  }

  if (blob.beds || blob.numBeds || blob.bedrooms) {
    if (!data.bedrooms) data.bedrooms = Number(blob.beds || blob.numBeds || blob.bedrooms);
  }
  if (blob.baths || blob.numBaths || blob.bathrooms) {
    if (!data.bathrooms) data.bathrooms = Number(blob.baths || blob.numBaths || blob.bathrooms);
  }
  if (blob.sqFt || blob.sqft || blob.livingArea || blob.squareFeet) {
    if (!data.squareFeet) data.squareFeet = Number(blob.sqFt || blob.sqft || blob.livingArea || blob.squareFeet);
  }

  // HOA — Redfin uses HoaDues (capital H) or hoaDues
  if (data.hoaMonthly === undefined) {
    const hoa = blob.HoaDues ?? blob.hoaDues ?? blob.hoaFee;
    if (hoa !== undefined) data.hoaMonthly = Number(hoa) || 0;
  }

  // Tax — Redfin uses taxesDue or taxAnnualAmount
  if (!data.propertyTaxAnnual) {
    const tax = blob.taxesDue ?? blob.taxAnnualAmount ?? blob.taxAmount;
    if (tax) data.propertyTaxAnnual = Math.round(Number(tax));
  }

  // Property type
  if (!data.propertyType && (blob.propertyType || blob.homeType)) {
    data.propertyType = mapPropertyType(blob.propertyType || blob.homeType);
  }

  // Address
  if (blob.streetAddress && !data.address) {
    data.address = blob.streetAddress;
    if (blob.city && !data.city) data.city = blob.city;
    if (blob.state && !data.state) data.state = blob.state;
    if (blob.zip && !data.zipCode) data.zipCode = blob.zip;
    if (blob.zipCode && !data.zipCode) data.zipCode = blob.zipCode;
  }

  // Recurse into nested objects (limit depth to avoid stack overflow)
  const keys = Object.keys(blob);
  for (const key of keys.slice(0, 50)) {
    if (typeof blob[key] === 'object' && blob[key] !== null) {
      extractFromDataBlob(blob[key], data);
    }
  }
}

function tryExtractPropertyFromText(text: string, data: ExtractedPropertyData): void {
  // Fallback: use regex to pull values from JS text that didn't parse as JSON
  if (!data.purchasePrice) {
    const priceMatch = text.match(/"(?:price|listPrice|listingPrice)"\s*:\s*(\d+)/);
    if (priceMatch) data.purchasePrice = Number(priceMatch[1]);
  }
  if (!data.bedrooms) {
    const bedsMatch = text.match(/"(?:beds|numBeds|bedrooms)"\s*:\s*(\d+)/);
    if (bedsMatch) data.bedrooms = Number(bedsMatch[1]);
  }
  if (!data.bathrooms) {
    const bathsMatch = text.match(/"(?:baths|numBaths|bathrooms)"\s*:\s*([\d.]+)/);
    if (bathsMatch) data.bathrooms = Number(bathsMatch[1]);
  }
  if (!data.squareFeet) {
    const sqftMatch = text.match(/"(?:sqFt|sqft|livingArea)"\s*:\s*(\d+)/);
    if (sqftMatch) data.squareFeet = Number(sqftMatch[1]);
  }
}

function extractFromMetaTags($: cheerio.CheerioAPI, data: ExtractedPropertyData): void {
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';

  // Price from description
  if (!data.purchasePrice) {
    const priceMatch = ogDesc.match(/\$[\d,]+/) || ogTitle.match(/\$[\d,]+/);
    if (priceMatch) {
      const price = Number(priceMatch[0].replace(/[$,]/g, ''));
      if (price > 1000) data.purchasePrice = price;
    }
  }

  // Beds/baths from description
  if (!data.bedrooms) {
    const bedMatch = ogDesc.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    if (bedMatch) data.bedrooms = Number(bedMatch[1]);
  }
  if (!data.bathrooms) {
    const bathMatch = ogDesc.match(/([\d.]+)\s*(?:bath|ba|bathroom)/i);
    if (bathMatch) data.bathrooms = Number(bathMatch[1]);
  }
  if (!data.squareFeet) {
    const sqftMatch = ogDesc.match(/([\d,]+)\s*(?:sq\s*ft|sqft|square\s*feet)/i);
    if (sqftMatch) data.squareFeet = Number(sqftMatch[1].replace(/,/g, ''));
  }

  // Address from title: "123 Main St, City, ST 12345 | Redfin"
  if (!data.address) {
    const titleMatch = ogTitle.match(/^(.+?)\s*[|]\s*Redfin/i);
    if (titleMatch) {
      const fullAddr = titleMatch[1].trim();
      const parts = fullAddr.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        data.address = parts[0];
        if (parts.length >= 2 && !data.city) data.city = parts[1];
        if (parts.length >= 3) {
          const stateZip = parts[parts.length - 1].match(/([A-Z]{2})\s+(\d{5})/);
          if (stateZip) {
            if (!data.state) data.state = stateZip[1];
            if (!data.zipCode) data.zipCode = stateZip[2];
          }
        }
      }
    }
  }
}

function extractFromSelectors($: cheerio.CheerioAPI, data: ExtractedPropertyData): void {
  // Last-resort fallback: CSS selectors for visible elements
  if (!data.purchasePrice) {
    // Redfin price is often in a span with data-rf-test-id="abp-price"
    const priceEl = $('[data-rf-test-id="abp-price"]').first().text() ||
      $('.priceEstimate .price').first().text() ||
      $('.statsValue [data-rf-test-id="abp-price"]').first().text();

    if (priceEl) {
      const price = Number(priceEl.replace(/[$,\s]/g, ''));
      if (price > 1000) data.purchasePrice = price;
    }
  }
}

/**
 * Directly scan the raw HTML for tax and HOA values using regex.
 * Redfin embeds these as escaped JSON strings (e.g., taxesDue\":21423.08)
 * which the blob parser can't reach since the outer JSON doesn't parse cleanly.
 */
function extractTaxAndHoaFromRawHtml(html: string, data: ExtractedPropertyData): void {
  // Tax — look for the first (most recent year) taxesDue value
  if (!data.propertyTaxAnnual) {
    const taxMatch = html.match(/taxesDue\\?":\s*([\d.]+)/);
    if (taxMatch) {
      const tax = Math.round(Number(taxMatch[1]));
      if (tax > 0) data.propertyTaxAnnual = tax;
    }
  }

  // HOA — look for HoaDues (monthly)
  if (data.hoaMonthly === undefined) {
    const hoaMatch = html.match(/HoaDues\\?":\s*([\d.]+)/i);
    if (hoaMatch) {
      data.hoaMonthly = Math.round(Number(hoaMatch[1]));
    }
  }
}
