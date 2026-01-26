'use client';

/**
 * Step 1: Property Details Component
 */

import React from 'react';
import { InputField, SelectField } from './input-field';

const propertyTypeOptions = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'other', label: 'Other' },
];

export function Step1PropertyDetails() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Property Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Tell us about the property you're analyzing
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <InputField
          name="title"
          label="Property Name/Title"
          type="text"
          required
          placeholder="e.g., 123 Main St Investment"
          helpText="Give this calculation a name for easy reference"
        />

        <SelectField
          name="propertyType"
          label="Property Type"
          options={propertyTypeOptions}
          required
          helpText="Select the type of property"
        />

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Address (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            For your reference only
          </p>

          <InputField
            name="address"
            label="Street Address"
            type="text"
            placeholder="123 Main Street"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              name="city"
              label="City"
              type="text"
              placeholder="San Francisco"
            />

            <InputField
              name="state"
              label="State"
              type="text"
              placeholder="CA"
            />

            <InputField
              name="zipCode"
              label="Zip Code"
              type="text"
              placeholder="94102"
              helpText="5-digit or 9-digit format"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Property Characteristics (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            For your reference only
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              name="bedrooms"
              label="Bedrooms"
              type="number"
              min={0}
              max={50}
              step={1}
              placeholder="3"
            />

            <InputField
              name="bathrooms"
              label="Bathrooms"
              type="number"
              min={0}
              max={50}
              step={0.5}
              placeholder="2.5"
            />

            <InputField
              name="squareFeet"
              label="Square Feet"
              type="number"
              min={0}
              max={100000}
              step={1}
              placeholder="2000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
