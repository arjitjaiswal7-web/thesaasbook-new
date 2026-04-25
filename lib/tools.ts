export type ToolIconKey =
  | "combine"
  | "split"
  | "filePen"
  | "minimize"
  | "fileImage"
  | "fileText"
  | "fileType"
  | "image"
  | "fileSpreadsheet"
  | "presentation";

export type ToolFaq = {
  question: string;
  answer: string;
};

type ToolBase = {
  slug: string;
  name: string;
  categoryLabel: "PDF Tools" | "Image Tools" | "SEO Tools";
  group: "pdf-tools" | "image-tools" | "seo-tools";
  description: string;
  icon: ToolIconKey;
};

export type LiveTool = ToolBase & {
  status: "live";
  featured: boolean;
  href: `/tools/${string}`;
  relatedSlugs: string[];
  howToSteps: string[];
};

export type ComingSoonTool = ToolBase & {
  status: "coming-soon";
  featured: false;
  badge: "Coming Soon";
};

export type Tool = LiveTool | ComingSoonTool;

export const tools: Tool[] = [
  {
    slug: "robots-txt-tester",
    name: "Robots.txt Tester",
    categoryLabel: "SEO Tools",
    group: "seo-tools",
    description: "Test robots.txt rules, crawl access, and blocked resources for any URL.",
    icon: "fileText",
    status: "live",
    featured: false,
    href: "/tools/seo-tools/robots-txt-tester",
    relatedSlugs: [
      "schema-markup-generator",
      "xml-sitemap-generator",
      "broken-link-checker",
    ],
    howToSteps: [
      "Enter the full URL you want to test.",
      "Choose the crawler user-agent you want to simulate.",
      "Optionally paste custom robots.txt rules or enable resource checks.",
      "Run the test and review the matched rule, crawl status, and linked resources.",
    ],
  },
  {
    slug: "schema-markup-generator",
    name: "Schema Markup Generator",
    categoryLabel: "SEO Tools",
    group: "seo-tools",
    description:
      "Generate JSON-LD schema markup with live preview, validation, and URL-based autofill.",
    icon: "fileText",
    status: "live",
    featured: false,
    href: "/tools/seo-tools/schema-markup-generator",
    relatedSlugs: [
      "robots-txt-tester",
      "xml-sitemap-generator",
      "broken-link-checker",
    ],
    howToSteps: [
      "Choose the schema type you want to create.",
      "Optionally enter a live page URL to auto-fill suggested fields.",
      "Review the validation checker and complete any missing required fields.",
      "Copy the JSON-LD, download it, or open Rich Results Test to validate the final markup.",
    ],
  },
  {
    slug: "xml-sitemap-generator",
    name: "XML Sitemap Generator",
    categoryLabel: "SEO Tools",
    group: "seo-tools",
    description: "Generate XML sitemaps from direct URLs or imported files with lastmod, changefreq, and priority.",
    icon: "fileText",
    status: "live",
    featured: false,
    href: "/tools/seo-tools/xml-sitemap-generator",
    relatedSlugs: [
      "schema-markup-generator",
      "robots-txt-tester",
      "broken-link-checker",
    ],
    howToSteps: [
      "Paste URLs directly or upload a TXT, CSV, JSON, or XML file.",
      "Set the default last modified date, change frequency, and priority.",
      "Review or edit each URL entry before export.",
      "Generate and download the final sitemap.xml file.",
    ],
  },
  {
    slug: "broken-link-checker",
    name: "Broken Link Checker",
    categoryLabel: "SEO Tools",
    group: "seo-tools",
    description: "Scan websites for broken links, crawler-blocked URLs, and timeout issues with source-page reporting.",
    icon: "fileText",
    status: "live",
    featured: false,
    href: "/tools/seo-tools/broken-link-checker",
    relatedSlugs: [
      "schema-markup-generator",
      "robots-txt-tester",
      "xml-sitemap-generator",
    ],
    howToSteps: [
      "Enter the website URL you want to scan.",
      "Start the crawler and let it discover internal pages automatically.",
      "Review grouped issue links only: broken URLs, crawler-blocked URLs, timeout issues, source pages, and response times.",
      "Filter the results and export the full report as CSV.",
    ],
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Combine multiple PDF files into a single organized document in seconds.",
    icon: "combine",
    status: "live",
    featured: true,
    href: "/tools/pdf-tools/merge-pdf",
    relatedSlugs: ["split-pdf", "compress-pdf", "edit-pdf"],
    howToSteps: [
      "Upload your PDF files.",
      "Arrange files in the desired order.",
      "Click Merge PDF.",
      "Download your merged document.",
    ],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Extract specific pages or divide large PDFs into smaller files instantly.",
    icon: "split",
    status: "live",
    featured: true,
    href: "/tools/pdf-tools/split-pdf",
    relatedSlugs: ["merge-pdf", "compress-pdf", "pdf-to-word"],
    howToSteps: [
      "Upload the PDF you want to split.",
      "Choose the pages or ranges you need.",
      "Click Split PDF.",
      "Download the separated files.",
    ],
  },
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Make quick text, markup, and annotation changes to PDF files online.",
    icon: "filePen",
    status: "live",
    featured: true,
    href: "/tools/pdf-tools/edit-pdf",
    relatedSlugs: ["merge-pdf", "compress-pdf", "pdf-to-word"],
    howToSteps: [
      "Upload your PDF document.",
      "Choose the area you want to update.",
      "Apply edits, notes, or annotations.",
      "Download the updated PDF file.",
    ],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Reduce PDF file size while preserving document quality.",
    icon: "minimize",
    status: "live",
    featured: true,
    href: "/tools/pdf-tools/compress-pdf",
    relatedSlugs: ["merge-pdf", "split-pdf", "edit-pdf"],
    howToSteps: [
      "Upload the PDF you want to reduce.",
      "Choose the compression level.",
      "Click Compress PDF.",
      "Download the optimized file.",
    ],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Convert JPG images into clean PDF documents for easy sharing.",
    icon: "fileImage",
    status: "live",
    featured: true,
    href: "/tools/pdf-tools/jpg-to-pdf",
    relatedSlugs: ["word-to-pdf", "pdf-to-jpg", "merge-pdf"],
    howToSteps: [
      "Upload your JPG images.",
      "Arrange the image order if needed.",
      "Click JPG to PDF.",
      "Download the generated PDF.",
    ],
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Convert PDF files into editable Word documents in a few clicks.",
    icon: "fileText",
    status: "live",
    featured: true,
    href: "/tools/pdf-tools/pdf-to-word",
    relatedSlugs: ["word-to-pdf", "edit-pdf", "pdf-to-excel"],
    howToSteps: [
      "Upload the PDF file.",
      "Start the conversion to Word.",
      "Wait for the editable document to be prepared.",
      "Download the Word file.",
    ],
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Turn Word documents into polished PDF files ready to share.",
    icon: "fileType",
    status: "live",
    featured: false,
    href: "/tools/pdf-tools/word-to-pdf",
    relatedSlugs: ["jpg-to-pdf", "merge-pdf", "pdf-to-word"],
    howToSteps: [
      "Upload your Word document.",
      "Start the PDF conversion.",
      "Review the generated output.",
      "Download the PDF file.",
    ],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Convert PDF pages into JPG images for web, slides, or sharing.",
    icon: "image",
    status: "live",
    featured: false,
    href: "/tools/pdf-tools/pdf-to-jpg",
    relatedSlugs: ["jpg-to-pdf", "pdf-to-powerpoint", "pdf-to-word"],
    howToSteps: [
      "Upload the PDF you want to convert.",
      "Choose the pages you need as images.",
      "Click PDF to JPG.",
      "Download the exported image files.",
    ],
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Convert PDF tables and structured data into Excel spreadsheets.",
    icon: "fileSpreadsheet",
    status: "live",
    featured: false,
    href: "/tools/pdf-tools/pdf-to-excel",
    relatedSlugs: ["pdf-to-word", "split-pdf", "pdf-to-powerpoint"],
    howToSteps: [
      "Upload the PDF containing your tables.",
      "Start the Excel conversion.",
      "Check the extracted spreadsheet structure.",
      "Download the Excel file.",
    ],
  },
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    categoryLabel: "PDF Tools",
    group: "pdf-tools",
    description:
      "Convert PDF slides into editable PowerPoint presentations.",
    icon: "presentation",
    status: "live",
    featured: false,
    href: "/tools/pdf-tools/pdf-to-powerpoint",
    relatedSlugs: ["pdf-to-jpg", "pdf-to-word", "merge-pdf"],
    howToSteps: [
      "Upload the PDF presentation.",
      "Start the PowerPoint conversion.",
      "Wait for the editable slides to be created.",
      "Download the PowerPoint file.",
    ],
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Compress JPG, PNG, and WebP images quickly with quality controls.",
    icon: "minimize",
    status: "live",
    featured: false,
    href: "/tools/image-tools/image-compressor",
    relatedSlugs: ["image-resizer", "jpg-to-pdf", "pdf-to-jpg"],
    howToSteps: [
      "Upload one or more images you want to optimize.",
      "Choose a quality preset and output format.",
      "Run compression and review the size reduction.",
      "Download each optimized image file.",
    ],
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Resize images for web, ads, and social formats in seconds.",
    icon: "image",
    status: "live",
    featured: false,
    href: "/tools/image-tools/image-resizer",
    relatedSlugs: ["image-compressor", "jpg-to-pdf", "pdf-to-jpg"],
    howToSteps: [
      "Upload one or more images you want to resize.",
      "Choose a preset or enter custom dimensions.",
      "Set output format and aspect ratio behavior.",
      "Resize the files and download the results.",
    ],
  },
  {
    slug: "png-to-jpg",
    name: "PNG to JPG",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Convert PNG images into lighter JPG files for faster delivery.",
    icon: "fileImage",
    status: "live",
    featured: false,
    href: "/tools/image-tools/png-to-jpg",
    relatedSlugs: ["image-compressor", "image-resizer", "jpg-to-pdf"],
    howToSteps: [
      "Upload one or more PNG images.",
      "Choose the JPG quality and background fill.",
      "Convert the files to JPG in your browser.",
      "Download the lighter JPG outputs.",
    ],
  },
  {
    slug: "jpg-to-png",
    name: "JPG to PNG",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Convert JPG files into PNG format for cleaner visual assets.",
    icon: "image",
    status: "live",
    featured: false,
    href: "/tools/image-tools/jpg-to-png",
    relatedSlugs: ["png-to-jpg", "image-resizer", "image-compressor"],
    howToSteps: [
      "Upload one or more JPG images.",
      "Start the PNG conversion in your browser.",
      "Review the generated PNG outputs.",
      "Download each converted file.",
    ],
  },
  {
    slug: "jpg-to-webp",
    name: "JPG to WebP",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Convert JPG images into smaller WebP files for faster web delivery.",
    icon: "fileImage",
    status: "live",
    featured: false,
    href: "/tools/image-tools/jpg-to-webp",
    relatedSlugs: ["jpg-to-png", "png-to-jpg", "image-compressor"],
    howToSteps: [
      "Upload one or more JPG images.",
      "Choose the WebP quality level.",
      "Convert the files in your browser.",
      "Download the lighter WebP outputs.",
    ],
  },
  {
    slug: "image-cropper",
    name: "Crop Image",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Crop images quickly for previews, posts, and landing pages.",
    icon: "image",
    status: "live",
    featured: false,
    href: "/tools/image-tools/image-cropper",
    relatedSlugs: ["image-resizer", "image-compressor", "png-to-jpg"],
    howToSteps: [
      "Upload the image you want to crop.",
      "Choose an aspect ratio or crop freely.",
      "Adjust the crop area with the preview controls.",
      "Download the cropped image in your preferred format.",
    ],
  },
];

export const liveTools = tools.filter(
  (tool): tool is LiveTool => tool.status === "live",
);

export const pdfTools = liveTools.filter((tool) => tool.group === "pdf-tools");

export const imageLiveTools = liveTools.filter(
  (tool) => tool.group === "image-tools",
);

export const seoLiveTools = liveTools.filter((tool) => tool.group === "seo-tools");

export const featuredTools = pdfTools.filter((tool) => tool.featured);

export const imageTools = tools.filter((tool) => tool.group === "image-tools");

export const seoTools = tools.filter((tool) => tool.group === "seo-tools");

const toolFaqsBySlug: Record<string, ToolFaq[]> = {
  "schema-markup-generator": [
    {
      question: "What does the Schema Markup Generator do?",
      answer:
        "It creates JSON-LD schema markup for common Schema.org types such as Article, FAQPage, Organization, WebSite, Product, LocalBusiness, and BreadcrumbList. You can preview the output live and copy or download it once the fields are ready.",
    },
    {
      question: "Can I auto-fill schema fields from a live page URL?",
      answer:
        "Yes. Enter a public page URL and the generator will try to pull suggested fields from existing JSON-LD, page metadata, and other high-confidence signals on the page.",
    },
    {
      question: "Does the tool validate my schema before I publish it?",
      answer:
        "Yes. The validation checker highlights missing required fields, recommended improvements, and obvious formatting issues so you can tighten the markup before you add it to a page.",
    },
    {
      question: "Can I test the generated schema in Google?",
      answer:
        "Yes. The tool includes a direct Rich Results Test link so you can open Google’s testing workflow right after generating the JSON-LD markup.",
    },
    {
      question: "Is the Schema Markup Generator free to use?",
      answer:
        "Yes. The tool is free to use with no login, no credits, and no export restrictions for the generated JSON-LD output.",
    },
  ],
  "broken-link-checker": [
    {
      question: "What does the Broken Link Checker do?",
      answer:
        "It crawls a website, checks internal and external links, and reports issue links only: broken URLs, crawler-blocked responses, timeout issues, source pages, anchor text, and response times in one free report.",
    },
    {
      question: "Does the Broken Link Checker scan the whole website?",
      answer:
        "Yes. The tool recursively crawls internal links on the same domain and keeps scanning until it reaches the configured crawl depth or no new pages are discovered.",
    },
    {
      question: "Can I export the issue link results?",
      answer:
        "Yes. You can export the grouped issue results as a CSV report and copy the filtered results directly from the interface with no login required.",
    },
    {
      question: "Does the report show where an issue link was found?",
      answer:
        "Yes. Every result includes the source page and anchor text so you can quickly locate the problem on the correct page.",
    },
    {
      question: "Is the Broken Link Checker safe to use?",
      answer:
        "Yes. The tool blocks local and private hosts, stays inside the target domain for crawling, and only scans public URLs that you provide.",
    },
  ],
  "robots-txt-tester": [
    {
      question: "What does the Robots.txt Tester do?",
      answer:
        "It checks whether a specific URL is allowed or blocked for a selected bot based on robots.txt rules. It also shows the matched rule and can inspect linked page resources.",
    },
    {
      question: "Can I test a draft robots.txt file before publishing it?",
      answer:
        "Yes. Turn on the live editor and paste custom robots.txt rules to test a draft file against any URL before you deploy it.",
    },
    {
      question: "Can I test different bots like Googlebot or GPTBot?",
      answer:
        "Yes. You can switch between common crawler user-agents such as Googlebot, Bingbot, GPTBot, ChatGPT-User, and others to see how access changes.",
    },
    {
      question: "Does the tool check blocked CSS, JavaScript, and images?",
      answer:
        "Yes. If resource checking is enabled, the tool inspects linked page resources and evaluates whether they appear to be blocked by robots.txt rules.",
    },
    {
      question: "Is the Robots.txt Tester safe to use?",
      answer:
        "Yes. You only provide a public URL or draft robots.txt content for testing. The tool analyzes crawl directives and does not modify the target website.",
    },
  ],
  "xml-sitemap-generator": [
    {
      question: "What does the XML Sitemap Generator do?",
      answer:
        "It creates a valid XML sitemap file from direct URLs or uploaded TXT, CSV, JSON, and XML sources. You can include last modified dates, change frequency, and priority for every URL.",
    },
    {
      question: "How many URLs can I include in one sitemap?",
      answer:
        "You can generate a sitemap with up to 500 URLs in this tool. The interface keeps the list editable before you download the final XML file.",
    },
    {
      question: "Can I upload a CSV or an existing sitemap file?",
      answer:
        "Yes. The tool accepts TXT, CSV, JSON, and XML sitemap files. CSV, JSON, and XML imports can preserve fields like lastmod, changefreq, and priority when they are available.",
    },
    {
      question: "Can I edit last modified, change frequency, and priority before export?",
      answer:
        "Yes. Every imported URL stays editable in the table, so you can adjust lastmod, changefreq, and priority before generating the XML output.",
    },
    {
      question: "Is the XML Sitemap Generator safe to use?",
      answer:
        "Yes. The tool runs entirely in your browser for sitemap creation. Your URL lists and imported files are not sent to a server for generation.",
    },
  ],
  "merge-pdf": [
    {
      question: "How can I merge PDF files online for free without losing quality?",
      answer:
        "You can merge PDF files online using TheSaaSBook tool by uploading multiple PDFs and combining them instantly. The tool keeps the original formatting, fonts, and layout unchanged. It works directly in your browser, so no installation is required and results are high quality.",
    },
    {
      question: "Is it safe to merge PDF files online?",
      answer:
        "Yes, it is completely safe as your files are processed securely on our servers. All uploaded documents are automatically deleted after a short time. This ensures your data remains private and protected at all times.",
    },
    {
      question: "Can I combine multiple PDF files into one document?",
      answer:
        "Yes, you can upload multiple PDFs and merge them into one file easily. You can also rearrange the order before merging. This is useful for organizing reports, documents, or assignments.",
    },
    {
      question: "Do I need to install any software to merge PDFs?",
      answer:
        "No, the tool works entirely online in your browser and does not require installation. You can use it on mobile, tablet, or desktop. This makes it quick and accessible anytime.",
    },
    {
      question: "Will merging PDFs affect formatting or layout?",
      answer:
        "No, merging PDFs does not affect formatting or layout. All pages remain exactly the same as the original files. Only the final file size may increase depending on the number of PDFs.",
    },
  ],
  "split-pdf": [
    {
      question: "How do I split a PDF file into separate pages online?",
      answer:
        "Upload your PDF and select specific pages or ranges to split using TheSaaSBook tool. The tool processes your request instantly. You can download the split files immediately without any delay.",
    },
    {
      question: "Can I extract specific pages from a PDF file?",
      answer:
        "Yes, you can select and extract individual pages or page ranges from your PDF. This is useful for sharing or editing specific sections. The extracted pages maintain original quality and formatting.",
    },
    {
      question: "Is it safe to split PDF files online?",
      answer:
        "Yes, all files are processed securely and automatically deleted after processing. Your documents are never stored permanently. This ensures full privacy and data protection.",
    },
    {
      question: "Do I need to create an account to split PDFs?",
      answer:
        "No, the tool is completely free and does not require any signup or login. You can start using it instantly. This makes the process fast and user-friendly.",
    },
    {
      question: "Does splitting a PDF reduce its quality?",
      answer:
        "No, splitting a PDF does not reduce its quality. Each extracted page keeps the same resolution and layout. You get high-quality results every time.",
    },
  ],
  "edit-pdf": [
    {
      question: "How can I edit a PDF file online for free?",
      answer:
        "You can edit a PDF by uploading it to TheSaaSBook editor and making changes like adding text or images. The process is simple and fast. Everything works online without installing any software.",
    },
    {
      question: "Can I modify text and images inside a PDF document?",
      answer:
        "Yes, you can modify text, insert images, and make changes depending on the PDF structure. The tool provides flexible editing options. It is ideal for quick edits and document updates.",
    },
    {
      question: "Is it safe to edit PDFs online?",
      answer:
        "Yes, your files are processed securely and automatically deleted after editing. We do not store or access your data. This ensures your documents remain confidential.",
    },
    {
      question: "Do I need Adobe Acrobat to edit PDFs?",
      answer:
        "No, you do not need Adobe Acrobat or any other software. The tool works directly in your browser. It is compatible with all devices and operating systems.",
    },
    {
      question: "Can I use the PDF editor on mobile devices?",
      answer:
        "Yes, the tool is fully responsive and works on mobile, tablet, and desktop devices. You can edit PDFs anytime, anywhere. No additional setup is required.",
    },
  ],
  "compress-pdf": [
    {
      question: "How can I compress a PDF file without losing quality?",
      answer:
        "Upload your PDF to TheSaaSBook compression tool to reduce file size while maintaining quality. The tool uses smart optimization techniques. This ensures your document remains readable and clear.",
    },
    {
      question: "Why should I compress a PDF file?",
      answer:
        "Compressing PDFs reduces file size, making it easier to upload, share, or send via email. It also saves storage space. This is especially useful for large documents.",
    },
    {
      question: "Is PDF compression safe?",
      answer:
        "Yes, your files are securely processed and automatically deleted after compression. Your data is never stored permanently. This guarantees complete privacy.",
    },
    {
      question: "How much can I reduce the PDF file size?",
      answer:
        "The reduction depends on the content, especially images and graphics. Image-heavy PDFs can be compressed significantly. You can expect noticeable size reduction in most cases.",
    },
    {
      question: "Do I need to install software to compress PDFs?",
      answer:
        "No, the tool works online and does not require installation. You can access it from any browser. It is quick, easy, and convenient.",
    },
  ],
  "jpg-to-pdf": [
    {
      question: "How can I convert JPG to PDF online for free?",
      answer:
        "Upload your JPG images to TheSaaSBook tool and convert them into a PDF instantly. The process is simple and fast. You can download the final PDF within seconds.",
    },
    {
      question: "Can I combine multiple JPG images into one PDF file?",
      answer:
        "Yes, you can upload multiple images and combine them into a single PDF document. You can also arrange the image order. This is useful for creating reports or documents.",
    },
    {
      question: "Will image quality be preserved after conversion?",
      answer:
        "Yes, the tool maintains high image quality during conversion. Your PDF will retain clarity and resolution. This ensures professional output.",
    },
    {
      question: "Is it safe to convert JPG to PDF online?",
      answer:
        "Yes, files are processed securely and deleted after processing. Your images are not stored or shared. This keeps your data safe.",
    },
    {
      question: "Do I need software for JPG to PDF conversion?",
      answer:
        "No, the tool works directly in your browser without installation. You can use it on any device. It is fast and convenient.",
    },
  ],
  "pdf-to-word": [
    {
      question: "How can I convert PDF to Word online for free?",
      answer:
        "Upload your PDF file and convert it into an editable Word document instantly using TheSaaSBook tool. The process is quick and simple. You can download and edit the file easily.",
    },
    {
      question: "Will formatting remain the same after conversion?",
      answer:
        "Yes, most formatting such as text, images, and layout is preserved during conversion. Complex files may need minor adjustments. Overall, accuracy is maintained.",
    },
    {
      question: "Is it safe to convert PDF to Word online?",
      answer:
        "Yes, all files are securely processed and automatically deleted after conversion. Your data remains private. We do not store or access your files.",
    },
    {
      question: "Can I edit the converted Word document?",
      answer:
        "Yes, the output file is fully editable in Word. You can modify text, formatting, and images easily. This makes it useful for editing documents.",
    },
    {
      question: "Do I need software for conversion?",
      answer:
        "No, everything works online without installation. You can use the tool on any device. It is fast and accessible.",
    },
  ],
  "word-to-pdf": [
    {
      question: "How can I convert Word to PDF online for free?",
      answer:
        "Upload your Word document and convert it into a PDF instantly using TheSaaSBook tool. The process is quick and reliable. You can download the PDF immediately.",
    },
    {
      question: "Will formatting be preserved after conversion?",
      answer:
        "Yes, the tool maintains fonts, layout, and structure during conversion. Your PDF will look the same as the original document. This ensures professional output.",
    },
    {
      question: "Is it safe to convert Word to PDF online?",
      answer:
        "Yes, files are processed securely and deleted after conversion. Your documents remain private. We ensure complete data protection.",
    },
    {
      question: "Do I need software for conversion?",
      answer:
        "No, the tool works online without requiring installation. You can use it directly in your browser. It is easy and convenient.",
    },
    {
      question: "Can I use this tool on mobile devices?",
      answer:
        "Yes, it works on all devices including mobile, tablet, and desktop. No setup is required. You can convert files anytime.",
    },
  ],
  "pdf-to-jpg": [
    {
      question: "How can I convert PDF to JPG online for free?",
      answer:
        "Upload your PDF and convert pages into JPG images instantly using TheSaaSBook tool. The process is fast and easy. You can download images in seconds.",
    },
    {
      question: "Can I extract images from a PDF file?",
      answer:
        "Yes, the tool allows you to extract images or convert entire pages into JPG format. This is useful for presentations or sharing visuals.",
    },
    {
      question: "Will image quality be maintained?",
      answer:
        "Yes, high-quality images are generated during conversion. Your output files remain clear and sharp. This ensures professional results.",
    },
    {
      question: "Is it safe to use this tool?",
      answer:
        "Yes, all files are processed securely and deleted after use. Your data is not stored. This guarantees privacy.",
    },
    {
      question: "Do I need software for conversion?",
      answer:
        "No, the tool works online without installation. You can access it from any device. It is quick and user-friendly.",
    },
  ],
  "pdf-to-excel": [
    {
      question: "How can I convert PDF to Excel online for free?",
      answer:
        "Upload your PDF file and convert it into an Excel spreadsheet instantly. The tool extracts tables and data accurately. You can download and edit the Excel file easily.",
    },
    {
      question: "Can I extract tables from a PDF into Excel?",
      answer:
        "Yes, the tool is designed to extract tabular data into Excel format. This makes it easier to analyze and edit data. It works well for reports and financial data.",
    },
    {
      question: "Is the output Excel file editable?",
      answer:
        "Yes, the converted Excel file is fully editable. You can modify data, formulas, and formatting. This makes it useful for further processing.",
    },
    {
      question: "Is it safe to convert PDF to Excel online?",
      answer:
        "Yes, files are processed securely and deleted after conversion. Your data remains private. We ensure full protection.",
    },
    {
      question: "Do I need software for conversion?",
      answer:
        "No, the tool works online without installation. You can use it from any browser. It is fast and convenient.",
    },
  ],
  "pdf-to-powerpoint": [
    {
      question: "How can I convert PDF to PowerPoint online for free?",
      answer:
        "Upload your PDF and convert it into editable PowerPoint slides instantly using TheSaaSBook tool. The process is simple and fast. You can download and edit slides easily.",
    },
    {
      question: "Will slide formatting be preserved after conversion?",
      answer:
        "Yes, most layouts, text, and images are preserved during conversion. Complex designs may need minor adjustments. Overall, structure is maintained.",
    },
    {
      question: "Can I edit the converted PowerPoint slides?",
      answer:
        "Yes, the output file is fully editable in PowerPoint. You can modify text, images, and layout easily. This is useful for presentations.",
    },
    {
      question: "Is it safe to convert PDF to PPT online?",
      answer:
        "Yes, files are securely processed and deleted after conversion. Your data is not stored. This ensures privacy and safety.",
    },
    {
      question: "Do I need software for conversion?",
      answer:
        "No, the tool works online without installation. You can access it from any device. It is quick and easy to use.",
    },
  ],
  "image-compressor": [
    {
      question: "How can I compress images online without losing quality?",
      answer:
        "Upload your images, choose a balanced quality preset, and export optimized files directly in your browser. The compressor reduces file size while keeping visuals clean for web and sharing.",
    },
    {
      question: "Which image formats are supported?",
      answer:
        "You can upload JPG, JPEG, PNG, and WebP files. The tool can export optimized images in JPEG or WebP format for better compression.",
    },
    {
      question: "Is image compression fast on large photos?",
      answer:
        "Yes. Compression runs client-side in your browser and is optimized for quick processing, even for high-resolution photos, with progress feedback for multi-file batches.",
    },
    {
      question: "Are my images secure?",
      answer:
        "Yes. Files are processed in your browser and are not uploaded to external servers by this tool flow, which helps keep your image data private.",
    },
    {
      question: "Can I use this on mobile devices?",
      answer:
        "Yes. The tool works on modern mobile, tablet, and desktop browsers so you can compress images from any device.",
    },
  ],
  "image-resizer": [
    {
      question: "How can I resize images online for free?",
      answer:
        "Upload your images, choose a preset or custom width and height, and export the resized files directly in your browser. The workflow is fast and does not require any software installation.",
    },
    {
      question: "Can I keep the original aspect ratio while resizing?",
      answer:
        "Yes. The tool includes an aspect-ratio lock so images can scale proportionally without stretching. You can also disable it when you need exact dimensions.",
    },
    {
      question: "Which formats does the Image Resizer support?",
      answer:
        "You can upload JPG, JPEG, PNG, and WebP images. The resized result can be exported in the original format, JPEG, PNG, or WebP depending on your selection.",
    },
    {
      question: "Is the Image Resizer secure?",
      answer:
        "Yes. Resizing is handled in your browser for this tool flow, so your uploaded images do not need to be sent to external servers.",
    },
    {
      question: "Can I resize multiple images at once?",
      answer:
        "Yes. You can upload a batch of images, apply the same resize settings, and download each resized file individually.",
    },
  ],
  "png-to-jpg": [
    {
      question: "How can I convert PNG to JPG online for free?",
      answer:
        "Upload your PNG files, choose JPG quality and a background color if needed, then convert them directly in your browser. The tool prepares lightweight JPG files without requiring any software installation.",
    },
    {
      question: "What happens to transparent PNG backgrounds?",
      answer:
        "Because JPG does not support transparency, transparent areas are filled with a background color during conversion. You can choose a white, black, or custom background before exporting.",
    },
    {
      question: "Can I convert multiple PNG files at once?",
      answer:
        "Yes. The tool supports batch conversion so you can upload several PNG images and convert them all in one pass.",
    },
    {
      question: "Is PNG to JPG conversion secure?",
      answer:
        "Yes. The conversion runs in your browser for this tool flow, which means your image files do not need to be sent to external servers.",
    },
    {
      question: "Why should I convert PNG to JPG?",
      answer:
        "JPG files are often much smaller than PNG files, which makes them easier to upload, share, and use on websites where lower file size matters.",
    },
  ],
  "jpg-to-png": [
    {
      question: "How can I convert JPG to PNG online for free?",
      answer:
        "Upload your JPG files and convert them to PNG directly in your browser. The process is fast, does not require software installation, and keeps the image colors unchanged.",
    },
    {
      question: "Does JPG to PNG add any color filter or effect?",
      answer:
        "No. The tool performs a direct format conversion only. It does not apply color filters, background effects, or visual edits to your image.",
    },
    {
      question: "Can I convert multiple JPG files at once?",
      answer:
        "Yes. The tool supports batch conversion so you can upload several JPG images and convert them all to PNG in one pass.",
    },
    {
      question: "Is JPG to PNG conversion secure?",
      answer:
        "Yes. The conversion runs in your browser for this tool flow, so your image files do not need to be sent to external servers.",
    },
    {
      question: "Why convert JPG to PNG?",
      answer:
        "PNG is useful when you want a lossless image format for editing, design workflows, or repeated exports where you want to avoid additional JPG compression.",
    },
  ],
  "jpg-to-webp": [
    {
      question: "How can I convert JPG to WebP online for free?",
      answer:
        "Upload your JPG files, choose the WebP quality level, and convert them directly in your browser. The process is fast, free, and does not require any software installation.",
    },
    {
      question: "Will WebP reduce my JPG image size?",
      answer:
        "In most cases, yes. WebP often produces smaller files than JPG while keeping strong visual quality, which makes it useful for websites, ecommerce images, and content pages.",
    },
    {
      question: "Can I convert multiple JPG files to WebP at once?",
      answer:
        "Yes. The tool supports batch conversion so you can upload several JPG images and export them as WebP in one pass.",
    },
    {
      question: "Is JPG to WebP conversion secure?",
      answer:
        "Yes. The conversion runs in your browser for this tool flow, so your image files do not need to be sent to external servers.",
    },
    {
      question: "Can I control the output quality of the WebP files?",
      answer:
        "Yes. You can adjust the WebP quality slider before converting so you can balance file size and image detail for your workflow.",
    },
  ],
  "image-cropper": [
    {
      question: "How can I crop an image online for free?",
      answer:
        "Upload your image, position the crop area in the preview, choose an aspect ratio if needed, and export the cropped result directly in your browser. No installation is required.",
    },
    {
      question: "Can I crop images to social media or banner sizes?",
      answer:
        "Yes. The tool includes preset aspect ratios such as square, widescreen, portrait, and other common layouts so you can crop images for posts, banners, and previews more quickly.",
    },
    {
      question: "Will cropping reduce image quality?",
      answer:
        "Cropping removes the outer parts of the image but does not add visual filters. Quality is preserved based on the output format you choose when exporting the cropped file.",
    },
    {
      question: "Is Crop Image secure?",
      answer:
        "Yes. Cropping runs in your browser for this tool flow, so your uploaded image does not need to be sent to external servers.",
    },
    {
      question: "Can I export the cropped image in different formats?",
      answer:
        "Yes. You can export the cropped result in the original format or choose JPEG, PNG, or WebP depending on your workflow.",
    },
  ],
};

export function getLiveToolBySlug(slug: string) {
  return liveTools.find((tool) => tool.slug === slug);
}

export function getPdfToolBySlug(slug: string) {
  return pdfTools.find((tool) => tool.slug === slug);
}

export function getToolBySlug(slug: string) {
  return getLiveToolBySlug(slug);
}

export function getRelatedTools(slug: string) {
  const tool = getLiveToolBySlug(slug);

  if (!tool) {
    return [];
  }

  return tool.relatedSlugs
    .map((relatedSlug) => getLiveToolBySlug(relatedSlug))
    .filter((relatedTool): relatedTool is LiveTool => Boolean(relatedTool));
}

export function getToolFaqs(slug: string): ToolFaq[] {
  return toolFaqsBySlug[slug] ?? [];
}
