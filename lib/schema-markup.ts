import validator from "validator";

export type SchemaType =
  | "article"
  | "faq-page"
  | "organization"
  | "website"
  | "product"
  | "local-business"
  | "breadcrumb-list";

export type SchemaFieldType =
  | "text"
  | "textarea"
  | "url"
  | "date"
  | "email"
  | "tel"
  | "select";

export type SchemaFieldDefinition = {
  key: string;
  label: string;
  type: SchemaFieldType;
  placeholder?: string;
  help?: string;
  rows?: number;
  fullWidth?: boolean;
  options?: Array<{ value: string; label: string }>;
};

export type SchemaFieldValues = Record<string, string>;
export type SchemaStates = Record<SchemaType, SchemaFieldValues>;

export type SchemaTypeOption = {
  value: SchemaType;
  label: string;
  description: string;
  richResultsEligible: boolean;
};

export type SchemaValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingRecommended: string[];
  requiredComplete: number;
  requiredTotal: number;
  recommendedComplete: number;
  recommendedTotal: number;
};

const availabilityOptions = [
  { value: "", label: "Select availability" },
  { value: "InStock", label: "In stock" },
  { value: "OutOfStock", label: "Out of stock" },
  { value: "PreOrder", label: "Pre-order" },
  { value: "PreSale", label: "Pre-sale" },
  { value: "LimitedAvailability", label: "Limited availability" },
];

export const schemaTypeOptions: SchemaTypeOption[] = [
  {
    value: "article",
    label: "Article",
    description:
      "Create Article or BlogPosting markup for blog posts, news stories, and long-form content.",
    richResultsEligible: true,
  },
  {
    value: "faq-page",
    label: "FAQ Page",
    description:
      "Generate FAQPage markup with question and answer pairs for support pages and guides.",
    richResultsEligible: true,
  },
  {
    value: "organization",
    label: "Organization",
    description:
      "Describe your company, brand, or publisher with logo, URL, and profile links.",
    richResultsEligible: false,
  },
  {
    value: "website",
    label: "Website",
    description:
      "Build WebSite markup with search action support and publisher details.",
    richResultsEligible: true,
  },
  {
    value: "product",
    label: "Product",
    description:
      "Create Product markup for ecommerce pages with offers, pricing, and brand details.",
    richResultsEligible: true,
  },
  {
    value: "local-business",
    label: "Local Business",
    description:
      "Add LocalBusiness markup for locations, services, and contact details.",
    richResultsEligible: true,
  },
  {
    value: "breadcrumb-list",
    label: "Breadcrumb List",
    description:
      "Generate BreadcrumbList markup for hierarchical navigation trails.",
    richResultsEligible: true,
  },
];

export const schemaFieldLabels: Record<string, string> = {
  url: "Page URL",
  headline: "Headline",
  description: "Description",
  image: "Image URL",
  authorName: "Author name",
  authorUrl: "Author URL",
  publisherName: "Publisher name",
  publisherUrl: "Publisher URL",
  publisherLogo: "Publisher logo URL",
  publishedDate: "Published date",
  modifiedDate: "Modified date",
  section: "Article section",
  pageUrl: "Page URL",
  questions: "Questions and answers",
  name: "Name",
  logo: "Logo URL",
  sameAs: "Social profile URLs",
  contactEmail: "Contact email",
  siteUrl: "Website URL",
  searchUrl: "Search URL template",
  searchQueryInput: "Search query input",
  publisher: "Publisher name",
  brand: "Brand",
  sku: "SKU",
  price: "Price",
  currency: "Currency",
  availability: "Availability",
  telephone: "Telephone",
  email: "Email",
  streetAddress: "Street address",
  city: "City",
  region: "Region / state",
  postalCode: "Postal code",
  country: "Country",
  openingHours: "Opening hours",
  priceRange: "Price range",
  items: "Breadcrumb items",
};

const fieldDefinitions: Record<SchemaType, SchemaFieldDefinition[]> = {
  article: [
    {
      key: "url",
      label: "Page URL",
      type: "url",
      placeholder: "https://example.com/blog/how-to-build-schema",
    },
    {
      key: "headline",
      label: "Headline",
      type: "text",
      placeholder: "How to Build Better Structured Data",
      fullWidth: true,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 4,
      placeholder: "Summarize the article in one or two sentences.",
      fullWidth: true,
    },
    {
      key: "image",
      label: "Image URL",
      type: "url",
      placeholder: "https://example.com/hero.jpg",
    },
    {
      key: "section",
      label: "Article section",
      type: "text",
      placeholder: "SEO",
    },
    {
      key: "authorName",
      label: "Author name",
      type: "text",
      placeholder: "Arjit Jaiswal",
    },
    {
      key: "authorUrl",
      label: "Author URL",
      type: "url",
      placeholder: "https://example.com/about",
    },
    {
      key: "publisherName",
      label: "Publisher name",
      type: "text",
      placeholder: "TheSaaSBook",
    },
    {
      key: "publisherUrl",
      label: "Publisher URL",
      type: "url",
      placeholder: "https://example.com",
    },
    {
      key: "publisherLogo",
      label: "Publisher logo URL",
      type: "url",
      placeholder: "https://example.com/logo.png",
    },
    {
      key: "publishedDate",
      label: "Published date",
      type: "date",
    },
    {
      key: "modifiedDate",
      label: "Modified date",
      type: "date",
    },
  ],
  "faq-page": [
    {
      key: "pageUrl",
      label: "Page URL",
      type: "url",
      placeholder: "https://example.com/faq",
      fullWidth: true,
    },
    {
      key: "questions",
      label: "Questions and answers",
      type: "textarea",
      rows: 12,
      fullWidth: true,
      placeholder:
        "Question 1\nAnswer 1\n\nQuestion 2\nAnswer 2\n\nTip: separate each Q&A pair with a blank line.",
      help:
        "Enter each question on its own line, followed by the answer. Separate each pair with a blank line.",
    },
  ],
  organization: [
    {
      key: "name",
      label: "Organization name",
      type: "text",
      placeholder: "TheSaaSBook",
    },
    {
      key: "url",
      label: "Website URL",
      type: "url",
      placeholder: "https://example.com",
    },
    {
      key: "logo",
      label: "Logo URL",
      type: "url",
      placeholder: "https://example.com/logo.png",
    },
    {
      key: "contactEmail",
      label: "Contact email",
      type: "email",
      placeholder: "contact@example.com",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 4,
      fullWidth: true,
      placeholder: "Describe the organization or brand.",
    },
    {
      key: "sameAs",
      label: "Social profile URLs",
      type: "textarea",
      rows: 5,
      fullWidth: true,
      placeholder:
        "https://www.linkedin.com/company/example\nhttps://x.com/example",
      help: "Add one profile URL per line.",
    },
  ],
  website: [
    {
      key: "name",
      label: "Website name",
      type: "text",
      placeholder: "TheSaaSBook",
    },
    {
      key: "siteUrl",
      label: "Website URL",
      type: "url",
      placeholder: "https://example.com",
    },
    {
      key: "publisher",
      label: "Publisher name",
      type: "text",
      placeholder: "TheSaaSBook",
    },
    {
      key: "searchQueryInput",
      label: "Search parameter name",
      type: "text",
      placeholder: "search_term_string",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 4,
      fullWidth: true,
      placeholder: "Summarize what the site offers.",
    },
    {
      key: "searchUrl",
      label: "Search URL template",
      type: "url",
      fullWidth: true,
      placeholder: "https://example.com/search?q={search_term_string}",
      help:
        "Use {search_term_string} where the search query should be inserted.",
    },
  ],
  product: [
    {
      key: "name",
      label: "Product name",
      type: "text",
      placeholder: "SEO Audit Template",
    },
    {
      key: "url",
      label: "Product URL",
      type: "url",
      placeholder: "https://example.com/product",
    },
    {
      key: "brand",
      label: "Brand",
      type: "text",
      placeholder: "TheSaaSBook",
    },
    {
      key: "sku",
      label: "SKU",
      type: "text",
      placeholder: "SKU-001",
    },
    {
      key: "image",
      label: "Image URL",
      type: "url",
      placeholder: "https://example.com/product.jpg",
    },
    {
      key: "price",
      label: "Price",
      type: "text",
      placeholder: "49.00",
    },
    {
      key: "currency",
      label: "Currency",
      type: "text",
      placeholder: "USD",
    },
    {
      key: "availability",
      label: "Availability",
      type: "select",
      options: availabilityOptions,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 4,
      fullWidth: true,
      placeholder: "Describe the product or offer.",
    },
  ],
  "local-business": [
    {
      key: "name",
      label: "Business name",
      type: "text",
      placeholder: "TheSaaSBook Studio",
    },
    {
      key: "url",
      label: "Business URL",
      type: "url",
      placeholder: "https://example.com",
    },
    {
      key: "telephone",
      label: "Telephone",
      type: "tel",
      placeholder: "+1-555-555-5555",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "hello@example.com",
    },
    {
      key: "image",
      label: "Image URL",
      type: "url",
      placeholder: "https://example.com/location.jpg",
    },
    {
      key: "priceRange",
      label: "Price range",
      type: "text",
      placeholder: "$$",
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      rows: 4,
      fullWidth: true,
      placeholder: "Describe the business, services, or location.",
    },
    {
      key: "streetAddress",
      label: "Street address",
      type: "text",
      placeholder: "123 Main Street",
    },
    {
      key: "city",
      label: "City",
      type: "text",
      placeholder: "New Delhi",
    },
    {
      key: "region",
      label: "Region / state",
      type: "text",
      placeholder: "Delhi",
    },
    {
      key: "postalCode",
      label: "Postal code",
      type: "text",
      placeholder: "110001",
    },
    {
      key: "country",
      label: "Country",
      type: "text",
      placeholder: "India",
    },
    {
      key: "openingHours",
      label: "Opening hours",
      type: "text",
      fullWidth: true,
      placeholder: "Mo-Fr 09:00-18:00",
    },
  ],
  "breadcrumb-list": [
    {
      key: "items",
      label: "Breadcrumb items",
      type: "textarea",
      rows: 10,
      fullWidth: true,
      placeholder:
        "Home | https://example.com\nBlog | https://example.com/blog\nSchema Guide | https://example.com/blog/schema-guide",
      help: "Add one breadcrumb per line in the format: Name | URL.",
    },
  ],
};

const defaultStates: Record<SchemaType, SchemaFieldValues> = {
  article: {
    url: "",
    headline: "",
    description: "",
    image: "",
    authorName: "",
    authorUrl: "",
    publisherName: "",
    publisherUrl: "",
    publisherLogo: "",
    publishedDate: "",
    modifiedDate: "",
    section: "",
  },
  "faq-page": {
    pageUrl: "",
    questions: "",
  },
  organization: {
    name: "",
    url: "",
    logo: "",
    description: "",
    sameAs: "",
    contactEmail: "",
  },
  website: {
    name: "",
    siteUrl: "",
    description: "",
    searchUrl: "",
    searchQueryInput: "search_term_string",
    publisher: "",
  },
  product: {
    name: "",
    description: "",
    image: "",
    brand: "",
    sku: "",
    price: "",
    currency: "USD",
    availability: "InStock",
    url: "",
  },
  "local-business": {
    name: "",
    url: "",
    description: "",
    image: "",
    telephone: "",
    email: "",
    streetAddress: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    openingHours: "",
    priceRange: "",
  },
  "breadcrumb-list": {
    items: "",
  },
};

const schemaRequirementConfig: Record<
  SchemaType,
  { required: string[]; recommended: string[] }
> = {
  article: {
    required: ["url", "headline"],
    recommended: [
      "description",
      "image",
      "authorName",
      "publisherName",
      "publishedDate",
    ],
  },
  "faq-page": {
    required: ["questions"],
    recommended: ["pageUrl"],
  },
  organization: {
    required: ["name", "url"],
    recommended: ["logo", "description", "sameAs", "contactEmail"],
  },
  website: {
    required: ["name", "siteUrl"],
    recommended: ["description", "searchUrl", "publisher"],
  },
  product: {
    required: ["name", "url"],
    recommended: [
      "description",
      "image",
      "brand",
      "price",
      "currency",
      "availability",
    ],
  },
  "local-business": {
    required: ["name", "url"],
    recommended: [
      "description",
      "telephone",
      "streetAddress",
      "city",
      "country",
    ],
  },
  "breadcrumb-list": {
    required: ["items"],
    recommended: [],
  },
};

function trim(value: string | undefined) {
  return value?.trim() ?? "";
}

function isValidHttpUrl(value: string) {
  if (!trim(value)) {
    return false;
  }

  return validator.isURL(trim(value), {
    require_protocol: true,
    protocols: ["http", "https"],
  });
}

function parseLineList(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseFaqItems(value: string) {
  return value
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return null;
      }

      const pipePair = block.split("|");

      if (pipePair.length >= 2) {
        const question = pipePair[0]?.replace(/^q:/i, "").trim() ?? "";
        const answer = pipePair
          .slice(1)
          .join("|")
          .replace(/^a:/i, "")
          .trim();

        if (question && answer) {
          return { question, answer };
        }
      }

      const question = lines[0]?.replace(/^q:/i, "").trim() ?? "";
      const answer = lines
        .slice(1)
        .join("\n")
        .replace(/^a:/i, "")
        .trim();

      return question && answer ? { question, answer } : null;
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));
}

function parseBreadcrumbItems(value: string) {
  return parseLineList(value)
    .map((line) => {
      const [name, ...urlParts] = line.split("|");
      const itemName = name?.trim() ?? "";
      const url = urlParts.join("|").trim();

      return itemName && url ? { name: itemName, url } : null;
    })
    .filter((item): item is { name: string; url: string } => Boolean(item));
}

function removeEmptyDeep<T>(value: T): T | undefined {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => removeEmptyDeep(item))
      .filter((item) => item !== undefined);

    return items.length ? (items as T) : undefined;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, removeEmptyDeep(entry)] as const)
      .filter(([, entry]) => entry !== undefined);

    return entries.length
      ? (Object.fromEntries(entries) as T)
      : undefined;
  }

  if (typeof value === "string") {
    return trim(value) ? value : undefined;
  }

  return value === undefined || value === null ? undefined : value;
}

function normalizeImageValue(value: string) {
  const cleaned = trim(value);
  return cleaned ? [cleaned] : undefined;
}

export function getSchemaFields(type: SchemaType) {
  return fieldDefinitions[type];
}

export function getSchemaTypeOption(type: SchemaType) {
  return schemaTypeOptions.find((option) => option.value === type);
}

export function createDefaultSchemaState(type: SchemaType) {
  return { ...defaultStates[type] };
}

export function createAllSchemaStates(): SchemaStates {
  return {
    article: createDefaultSchemaState("article"),
    "faq-page": createDefaultSchemaState("faq-page"),
    organization: createDefaultSchemaState("organization"),
    website: createDefaultSchemaState("website"),
    product: createDefaultSchemaState("product"),
    "local-business": createDefaultSchemaState("local-business"),
    "breadcrumb-list": createDefaultSchemaState("breadcrumb-list"),
  };
}

export function getPrimarySchemaUrl(type: SchemaType, values: SchemaFieldValues) {
  if (type === "faq-page") {
    return trim(values.pageUrl);
  }

  if (type === "website") {
    return trim(values.siteUrl);
  }

  return trim(values.url);
}

export function buildRichResultsTestUrl(url?: string) {
  const normalized = trim(url);

  if (normalized && isValidHttpUrl(normalized)) {
    return `https://search.google.com/test/rich-results?url=${encodeURIComponent(normalized)}`;
  }

  return "https://search.google.com/test/rich-results";
}

export function buildSchemaJsonLd(type: SchemaType, values: SchemaFieldValues) {
  const trimmedValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, trim(value)]),
  ) as SchemaFieldValues;

  switch (type) {
    case "article": {
      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "Article",
        url: trimmedValues.url,
        mainEntityOfPage: trimmedValues.url,
        headline: trimmedValues.headline,
        description: trimmedValues.description,
        image: normalizeImageValue(trimmedValues.image),
        articleSection: trimmedValues.section,
        author: trimmedValues.authorName
          ? {
              "@type": "Person",
              name: trimmedValues.authorName,
              url: trimmedValues.authorUrl,
            }
          : undefined,
        publisher: trimmedValues.publisherName
          ? {
              "@type": "Organization",
              name: trimmedValues.publisherName,
              url: trimmedValues.publisherUrl,
              logo: trimmedValues.publisherLogo
                ? {
                    "@type": "ImageObject",
                    url: trimmedValues.publisherLogo,
                  }
                : undefined,
            }
          : undefined,
        datePublished: trimmedValues.publishedDate,
        dateModified: trimmedValues.modifiedDate,
      }) ?? { "@context": "https://schema.org", "@type": "Article" };
    }
    case "faq-page": {
      const faqItems = parseFaqItems(trimmedValues.questions).map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      }));

      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        url: trimmedValues.pageUrl,
        mainEntity: faqItems,
      }) ?? { "@context": "https://schema.org", "@type": "FAQPage" };
    }
    case "organization": {
      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: trimmedValues.name,
        url: trimmedValues.url,
        description: trimmedValues.description,
        email: trimmedValues.contactEmail ? `mailto:${trimmedValues.contactEmail}` : undefined,
        logo: trimmedValues.logo
          ? {
              "@type": "ImageObject",
              url: trimmedValues.logo,
            }
          : undefined,
        sameAs: parseLineList(trimmedValues.sameAs),
      }) ?? { "@context": "https://schema.org", "@type": "Organization" };
    }
    case "website": {
      const searchTarget = trim(trimmedValues.searchUrl);
      const queryInputName = trim(trimmedValues.searchQueryInput) || "search_term_string";

      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: trimmedValues.name,
        url: trimmedValues.siteUrl,
        description: trimmedValues.description,
        publisher: trimmedValues.publisher
          ? {
              "@type": "Organization",
              name: trimmedValues.publisher,
            }
          : undefined,
        potentialAction: searchTarget
          ? {
              "@type": "SearchAction",
              target: searchTarget.includes("{")
                ? searchTarget
                : `${searchTarget}${searchTarget.includes("?") ? "&" : "?"}q={${queryInputName}}`,
              "query-input": `required name=${queryInputName}`,
            }
          : undefined,
      }) ?? { "@context": "https://schema.org", "@type": "WebSite" };
    }
    case "product": {
      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "Product",
        name: trimmedValues.name,
        description: trimmedValues.description,
        url: trimmedValues.url,
        image: normalizeImageValue(trimmedValues.image),
        sku: trimmedValues.sku,
        brand: trimmedValues.brand
          ? {
              "@type": "Brand",
              name: trimmedValues.brand,
            }
          : undefined,
        offers:
          trimmedValues.price || trimmedValues.currency || trimmedValues.availability
            ? {
                "@type": "Offer",
                url: trimmedValues.url,
                price: trimmedValues.price,
                priceCurrency: trimmedValues.currency,
                availability: trimmedValues.availability
                  ? `https://schema.org/${trimmedValues.availability}`
                  : undefined,
              }
            : undefined,
      }) ?? { "@context": "https://schema.org", "@type": "Product" };
    }
    case "local-business": {
      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: trimmedValues.name,
        url: trimmedValues.url,
        description: trimmedValues.description,
        image: normalizeImageValue(trimmedValues.image),
        telephone: trimmedValues.telephone,
        email: trimmedValues.email ? `mailto:${trimmedValues.email}` : undefined,
        openingHours: trimmedValues.openingHours,
        priceRange: trimmedValues.priceRange,
        address:
          trimmedValues.streetAddress ||
          trimmedValues.city ||
          trimmedValues.region ||
          trimmedValues.postalCode ||
          trimmedValues.country
            ? {
                "@type": "PostalAddress",
                streetAddress: trimmedValues.streetAddress,
                addressLocality: trimmedValues.city,
                addressRegion: trimmedValues.region,
                postalCode: trimmedValues.postalCode,
                addressCountry: trimmedValues.country,
              }
            : undefined,
      }) ?? { "@context": "https://schema.org", "@type": "LocalBusiness" };
    }
    case "breadcrumb-list": {
      const items = parseBreadcrumbItems(trimmedValues.items).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      }));

      return removeEmptyDeep({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items,
      }) ?? { "@context": "https://schema.org", "@type": "BreadcrumbList" };
    }
  }
}

function hasValue(type: SchemaType, key: string, values: SchemaFieldValues) {
  if (key === "questions") {
    return parseFaqItems(values.questions).length > 0;
  }

  if (key === "items") {
    return parseBreadcrumbItems(values.items).length >= 2;
  }

  return trim(values[key]).length > 0;
}

function isRecommendedFieldValid(key: string, values: SchemaFieldValues) {
  const value = trim(values[key]);

  if (!value) {
    return false;
  }

  if (
    [
      "url",
      "pageUrl",
      "siteUrl",
      "image",
      "authorUrl",
      "publisherUrl",
      "publisherLogo",
      "logo",
      "searchUrl",
    ].includes(key)
  ) {
    return isValidHttpUrl(value);
  }

  if (["publishedDate", "modifiedDate"].includes(key)) {
    return !Number.isNaN(Date.parse(value));
  }

  if (["contactEmail", "email"].includes(key)) {
    return validator.isEmail(value);
  }

  return true;
}

export function validateSchema(type: SchemaType, values: SchemaFieldValues): SchemaValidationResult {
  const requirements = schemaRequirementConfig[type];
  const missingRequired = requirements.required.filter((field) => !hasValue(type, field, values));
  const missingRecommended = requirements.recommended.filter(
    (field) => !hasValue(type, field, values),
  );

  const errors = missingRequired.map(
    (field) => `${schemaFieldLabels[field] ?? field} is required for this schema type.`,
  );
  const warnings = missingRecommended.map(
    (field) => `Add ${schemaFieldLabels[field] ?? field} to make the markup stronger.`,
  );

  const urlFields = [
    "url",
    "pageUrl",
    "siteUrl",
    "image",
    "authorUrl",
    "publisherUrl",
    "publisherLogo",
    "logo",
    "searchUrl",
  ];

  for (const key of urlFields) {
    const value = trim(values[key]);

    if (value && !isValidHttpUrl(value)) {
      errors.push(`${schemaFieldLabels[key] ?? key} must be a valid http or https URL.`);
    }
  }

  const lineListUrls = [
    ...parseLineList(values.sameAs ?? "").filter((entry) => !isValidHttpUrl(entry)).map(
      (entry) => `Social profile URL is invalid: ${entry}`,
    ),
    ...parseBreadcrumbItems(values.items ?? "")
      .filter((item) => !isValidHttpUrl(item.url))
      .map((item) => `Breadcrumb URL is invalid: ${item.url}`),
  ];

  errors.push(...lineListUrls);

  const faqItems = parseFaqItems(values.questions ?? "");

  if (type === "faq-page" && trim(values.questions) && faqItems.length === 0) {
    errors.push(
      "Questions and answers could not be parsed. Separate each FAQ pair with a blank line.",
    );
  }

  if (type === "breadcrumb-list") {
    const breadcrumbItems = parseBreadcrumbItems(values.items ?? "");

    if (trim(values.items) && breadcrumbItems.length < 2) {
      errors.push(
        "Breadcrumb List needs at least two valid items in the format Name | URL.",
      );
    }
  }

  if (trim(values.publishedDate) && Number.isNaN(Date.parse(values.publishedDate))) {
    errors.push("Published date must be a valid date.");
  }

  if (trim(values.modifiedDate) && Number.isNaN(Date.parse(values.modifiedDate))) {
    errors.push("Modified date must be a valid date.");
  }

  if (trim(values.price) && Number.isNaN(Number.parseFloat(values.price))) {
    errors.push("Price must be a valid number.");
  }

  if (trim(values.contactEmail) && !validator.isEmail(trim(values.contactEmail))) {
    errors.push("Contact email must be a valid email address.");
  }

  if (trim(values.email) && !validator.isEmail(trim(values.email))) {
    errors.push("Email must be a valid email address.");
  }

  if (trim(values.searchUrl) && !trim(values.searchUrl).includes("{")) {
    warnings.push(
      "Search URL template does not include a placeholder. The generator will append a query placeholder for you.",
    );
  }

  if (type === "product" && trim(values.price) && !trim(values.currency)) {
    warnings.push("Add a currency code when you include a product price.");
  }

  const requiredComplete = requirements.required.filter((field) => hasValue(type, field, values)).length;
  const recommendedComplete = requirements.recommended.filter((field) =>
    isRecommendedFieldValid(field, values),
  ).length;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingRecommended,
    requiredComplete,
    requiredTotal: requirements.required.length,
    recommendedComplete,
    recommendedTotal: requirements.recommended.length,
  };
}

export function formatSchemaJsonLd(type: SchemaType, values: SchemaFieldValues) {
  return JSON.stringify(buildSchemaJsonLd(type, values), null, 2);
}

