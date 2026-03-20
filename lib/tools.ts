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
  categoryLabel: "PDF Tools" | "Image Tools";
  group: "pdf-tools" | "image-tools";
  description: string;
  icon: ToolIconKey;
};

export type LiveTool = ToolBase & {
  status: "live";
  featured: boolean;
  href: `/tools/pdf-tools/${string}`;
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
    description: "Shrink image file sizes while keeping visuals sharp.",
    icon: "minimize",
    status: "coming-soon",
    featured: false,
    badge: "Coming Soon",
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Resize images for web, ads, and social formats in seconds.",
    icon: "image",
    status: "coming-soon",
    featured: false,
    badge: "Coming Soon",
  },
  {
    slug: "png-to-jpg",
    name: "PNG to JPG",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Convert PNG images into lighter JPG files for faster delivery.",
    icon: "fileImage",
    status: "coming-soon",
    featured: false,
    badge: "Coming Soon",
  },
  {
    slug: "jpg-to-png",
    name: "JPG to PNG",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Convert JPG files into PNG format for cleaner visual assets.",
    icon: "image",
    status: "coming-soon",
    featured: false,
    badge: "Coming Soon",
  },
  {
    slug: "image-cropper",
    name: "Image Cropper",
    categoryLabel: "Image Tools",
    group: "image-tools",
    description: "Crop images quickly for previews, posts, and landing pages.",
    icon: "image",
    status: "coming-soon",
    featured: false,
    badge: "Coming Soon",
  },
];

export const pdfTools = tools.filter(
  (tool): tool is LiveTool => tool.group === "pdf-tools" && tool.status === "live",
);

export const featuredTools = pdfTools.filter((tool) => tool.featured);

export const imageTools = tools.filter(
  (tool): tool is ComingSoonTool =>
    tool.group === "image-tools" && tool.status === "coming-soon",
);

const toolFaqsBySlug: Record<string, ToolFaq[]> = {
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
};

export function getToolBySlug(slug: string) {
  return pdfTools.find((tool) => tool.slug === slug);
}

export function getRelatedTools(slug: string) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return [];
  }

  return tool.relatedSlugs
    .map((relatedSlug) => getToolBySlug(relatedSlug))
    .filter((relatedTool): relatedTool is LiveTool => Boolean(relatedTool));
}

export function getToolFaqs(slug: string): ToolFaq[] {
  return toolFaqsBySlug[slug] ?? [];
}
