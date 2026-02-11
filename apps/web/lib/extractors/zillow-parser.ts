import * as cheerio from 'cheerio';
import type { ExtractedPropertyData } from './types';

/**
 * Property type mapping from Zillow labels to our enum values.
 */
const PROPERTY_TYPE_MAP: Record<string, ExtractedPropertyData['propertyType']> = {
  'single family': 'single_family',
  'single family residential': 'single_family',
  'singlefamily': 'single_family',
  'house': 'single_family',
  'multi family': 'multi_family',
  'multi-family': 'multi_family',
  'multifamily': 'multi_family',
  'duplex': 'multi_family',
  'triplex': 'multi_family',
  'quadplex': 'multi_family',
  'condo': 'condo',
  'condominium': 'condo',
  'condo/co-op': 'condo',
  'townhouse': 'townhouse',
  'townhome': 'townhouse',
  'commercial': 'commercial',
  'apartment': 'multi_family',
};

function mapPropertyType(raw: string | undefined): ExtractedPropertyData['propertyType'] | undefined {
  if (!raw) return undefined;
  return PROPERTY_TYPE_MAP[raw.toLowerCase().trim()];
}

/**
 * Parse Zillow listing HTML and extract property data.
 * Uses multiple strategies in priority order:
 *   1. JSON-LD structured data (most reliable — schema.org standard)
 *   2. __NEXT_DATA__ blob (price, tax, HOA, year built, property type)
 *   3. Meta tags fallback (price)
 */
export function parseZillowHtml(html: string): ExtractedPropertyData {
  const $ = cheerio.load(html);
  const data: ExtractedPropertyData = {};

  // Strategy 1: JSON-LD
  try {
    extractFromJsonLd($, data);
  } catch { /* continue to next strategy */ }

  // Strategy 2: __NEXT_DATA__
  try {
    extractFromNextData($, data);
  } catch { /* continue to next strategy */ }

  // Strategy 3: Meta tags
  try {
    extractFromMetaTags($, data);
  } catch { /* continue */ }

  // Strategy 4: Direct regex scan for tax/HOA in raw HTML
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

  // Beds
  if (!data.bedrooms) {
    const beds = entity.numberOfBedrooms || entity.numberOfRooms;
    if (beds) data.bedrooms = Number(beds);
  }

  // Baths
  if (!data.bathrooms && entity.numberOfBathroomsTotal) {
    data.bathrooms = Number(entity.numberOfBathroomsTotal);
  }

  // Square feet
  if (!data.squareFeet && entity.floorSize?.value) {
    data.squareFeet = Number(entity.floorSize.value);
  }

  // Property type
  if (!data.propertyType && entity.accommodationCategory) {
    data.propertyType = mapPropertyType(entity.accommodationCategory);
  }
}

function extractFromJsonLd($: cheerio.CheerioAPI, data: ExtractedPropertyData): void {
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());

      // Handle arrays (Zillow sometimes wraps in an array)
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

        // Product or RealEstateListing — extract price and check nested property
        const isListing = types.includes('Product') || types.includes('RealEstateListing');
        if (isListing) {
          if (!data.purchasePrice && item.offers?.price) {
            data.purchasePrice = Number(item.offers.price);
          }
          // Redfin nests property inside mainEntity
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

function extractFromNextData($: cheerio.CheerioAPI, data: ExtractedPropertyData): void {
  const nextDataEl = $('script#__NEXT_DATA__');
  if (!nextDataEl.length) return;

  const nextData = JSON.parse(nextDataEl.text());

  // Navigate through the nested structure to find property data
  // Zillow's __NEXT_DATA__ structure varies but typically has:
  // props.pageProps.componentProps or props.pageProps.gdpClientCache
  const pageProps = nextData?.props?.pageProps;
  if (!pageProps) return;

  // Try gdpClientCache (common location for property data)
  if (pageProps.gdpClientCache) {
    try {
      const cache = typeof pageProps.gdpClientCache === 'string'
        ? JSON.parse(pageProps.gdpClientCache)
        : pageProps.gdpClientCache;

      // The cache is keyed by GraphQL query hashes — iterate values
      for (const value of Object.values(cache)) {
        const property = (value as any)?.property;
        if (!property) continue;

        // Price
        if (!data.purchasePrice && property.price) {
          data.purchasePrice = Number(property.price);
        }

        // Beds/baths/sqft
        if (!data.bedrooms && property.bedrooms) {
          data.bedrooms = Number(property.bedrooms);
        }
        if (!data.bathrooms && property.bathrooms) {
          data.bathrooms = Number(property.bathrooms);
        }
        if (!data.squareFeet && property.livingArea) {
          data.squareFeet = Number(property.livingArea);
        }

        // Address
        if (property.address) {
          if (!data.address && property.address.streetAddress) data.address = property.address.streetAddress;
          if (!data.city && property.address.city) data.city = property.address.city;
          if (!data.state && property.address.state) data.state = property.address.state;
          if (!data.zipCode && property.address.zipcode) data.zipCode = property.address.zipcode;
        }

        // Property type
        if (!data.propertyType && property.homeType) {
          data.propertyType = mapPropertyType(property.homeType);
        }

        // Tax
        if (!data.propertyTaxAnnual && property.propertyTaxRate && data.purchasePrice) {
          data.propertyTaxAnnual = Math.round(data.purchasePrice * property.propertyTaxRate / 100);
        }
        if (!data.propertyTaxAnnual && property.taxHistory?.length) {
          // Use most recent tax year
          const latest = property.taxHistory[0];
          if (latest?.taxPaid) {
            data.propertyTaxAnnual = Number(latest.taxPaid);
          }
        }

        // HOA
        if (data.hoaMonthly === undefined && property.monthlyHoaFee !== undefined) {
          data.hoaMonthly = Number(property.monthlyHoaFee) || 0;
        }
      }
    } catch { /* failed to parse cache */ }
  }

  // Try initialReduxState (alternative location)
  if (pageProps.initialReduxState) {
    try {
      const redux = pageProps.initialReduxState;
      const gdp = redux?.gdp?.building || redux?.gdp;
      if (gdp) {
        if (!data.purchasePrice && gdp.price) data.purchasePrice = Number(gdp.price);
        if (!data.bedrooms && gdp.bedrooms) data.bedrooms = Number(gdp.bedrooms);
        if (!data.bathrooms && gdp.bathrooms) data.bathrooms = Number(gdp.bathrooms);
        if (!data.squareFeet && gdp.livingArea) data.squareFeet = Number(gdp.livingArea);
      }
    } catch { /* failed to parse redux state */ }
  }
}

function extractFromMetaTags($: cheerio.CheerioAPI, data: ExtractedPropertyData): void {
  // og:description often contains price, beds, baths
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';

  // Try to extract price from meta description like "$599,000 - 3 bed, 2 bath"
  if (!data.purchasePrice) {
    const priceMatch = ogDesc.match(/\$[\d,]+/);
    if (priceMatch) {
      const price = Number(priceMatch[0].replace(/[$,]/g, ''));
      if (price > 1000) data.purchasePrice = price;
    }
  }

  // Extract beds/baths from meta description
  if (!data.bedrooms) {
    const bedMatch = ogDesc.match(/(\d+)\s*(?:bed|br|bedroom)/i);
    if (bedMatch) data.bedrooms = Number(bedMatch[1]);
  }
  if (!data.bathrooms) {
    const bathMatch = ogDesc.match(/([\d.]+)\s*(?:bath|ba|bathroom)/i);
    if (bathMatch) data.bathrooms = Number(bathMatch[1]);
  }

  // og:title may have address
  if (!data.address) {
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    // Zillow titles look like "123 Main St, City, ST 12345 | Zillow"
    const addressMatch = ogTitle.match(/^(.+?)\s*[|,]\s*(?:Zillow|MLS)/);
    if (addressMatch) {
      const fullAddr = addressMatch[1].trim();
      // Try to split "123 Main St, City, ST 12345"
      const parts = fullAddr.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        if (!data.address) data.address = parts[0];
        if (!data.city && parts.length >= 2) data.city = parts[1];
        // Last part may be "ST 12345"
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

/**
 * Directly scan raw HTML for tax and HOA values using regex.
 * Zillow embeds these in __NEXT_DATA__ as JSON keys like "taxPaid", "monthlyHoaFee".
 */
function extractTaxAndHoaFromRawHtml(html: string, data: ExtractedPropertyData): void {
  // Tax — look for taxPaid (from taxHistory) or propertyTaxRate
  if (!data.propertyTaxAnnual) {
    // taxPaid is the most recent annual tax amount
    const taxPaidMatch = html.match(/"taxPaid"\s*:\s*([\d.]+)/);
    if (taxPaidMatch) {
      const tax = Math.round(Number(taxPaidMatch[1]));
      if (tax > 0) data.propertyTaxAnnual = tax;
    }
  }

  // If no taxPaid, try propertyTaxRate * purchasePrice
  if (!data.propertyTaxAnnual && data.purchasePrice) {
    const rateMatch = html.match(/"propertyTaxRate"\s*:\s*([\d.]+)/);
    if (rateMatch) {
      const rate = Number(rateMatch[1]);
      if (rate > 0 && rate < 10) {
        data.propertyTaxAnnual = Math.round(data.purchasePrice * rate / 100);
      }
    }
  }

  // HOA
  if (data.hoaMonthly === undefined) {
    const hoaMatch = html.match(/"monthlyHoaFee"\s*:\s*([\d.]+)/);
    if (hoaMatch) {
      data.hoaMonthly = Math.round(Number(hoaMatch[1]));
    }
  }
}
