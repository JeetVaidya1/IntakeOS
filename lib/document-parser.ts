import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Parse text content from a document URL (PDF or DOCX)
 * @param url - The URL of the document to parse
 * @returns Extracted text content from the document
 */
export async function parseDocumentFromUrl(url: string): Promise<string> {
  try {
    // Fetch the document from the URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    // Get the content type to determine file type
    const contentType = response.headers.get('content-type') || '';
    const urlLower = url.toLowerCase();

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect file type and parse accordingly
    const isPdf = contentType.includes('pdf') || urlLower.endsWith('.pdf');
    const isDocx = contentType.includes('wordprocessingml') ||
                   contentType.includes('msword') ||
                   urlLower.endsWith('.docx') ||
                   urlLower.endsWith('.doc');

    if (isPdf) {
      // Parse PDF
      const pdfData = await pdfParse(buffer);
      return pdfData.text.trim() || 'No text content found in PDF.';
    }
    else if (isDocx) {
      // Parse DOCX
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim() || 'No text content found in document.';
    }
    else {
      // Fallback: try to read as plain text
      const text = buffer.toString('utf-8');
      if (text && text.trim()) {
        return text.trim();
      }
      return 'Unsupported document format. Please upload PDF, DOCX, or TXT files.';
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    return `Failed to read document: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
