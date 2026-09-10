import PDFDocument from 'pdfkit';
import { Response } from 'express';

export class PdfService {
  /**
   * Generates an official Tax Invoice PDF directly into Express HTTP response
   */
  static generateInvoicePdf(invoiceData: any, res: Response) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Invoice_${invoiceData.invoiceNumber}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .fillColor('#C5A059')
      .text('SHANKER JEWELLS', { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#444444')
      .text('No.4 sandhukadai, bigbazzar street, trichy - 620008 | Phone: +91 9443949192', {
        align: 'center',
      });
    doc.moveDown(1.5);

    // Title & Meta
    doc
      .fontSize(14)
      .fillColor('#18181B')
      .text('TAX INVOICE', { underline: true });
    doc
      .fontSize(10)
      .text(`Invoice No: ${invoiceData.invoiceNumber}`)
      .text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}`)
      .text(`Customer: ${invoiceData.customer?.name || 'Walk-in Customer'}`)
      .text(`Phone: ${invoiceData.customer?.phone || 'N/A'}`);
    doc.moveDown();

    // Line items table header
    const tableTop = 200;
    doc.fontSize(9).fillColor('#C5A059');
    doc.text('Item Description', 40, tableTop);
    doc.text('Net Wt', 220, tableTop);
    doc.text('Rate/g', 280, tableTop);
    doc.text('Making', 340, tableTop);
    doc.text('GST (3%)', 400, tableTop);
    doc.text('Total (₹)', 480, tableTop);

    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke('#CCCCCC');

    let y = tableTop + 25;
    doc.fillColor('#18181B');

    for (const item of invoiceData.items || []) {
      doc.text(item.description.substring(0, 32), 40, y);
      doc.text(`${item.netWeight}g`, 220, y);
      doc.text(`₹${item.metalRate}`, 280, y);
      doc.text(`₹${item.makingCharge}`, 340, y);
      doc.text(`₹${item.tax}`, 400, y);
      doc.text(`₹${item.total.toLocaleString('en-IN')}`, 480, y);
      y += 20;
    }

    doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke('#CCCCCC');
    y += 20;

    // Totals
    doc.fontSize(10).fillColor('#18181B');
    doc.text(`Subtotal: ₹${invoiceData.subtotal.toLocaleString('en-IN')}`, 380, y);
    doc.text(`GST Total: ₹${invoiceData.tax.toLocaleString('en-IN')}`, 380, y + 15);
    if (invoiceData.discount > 0) {
      doc.text(`Discount: -₹${invoiceData.discount.toLocaleString('en-IN')}`, 380, y + 30);
      y += 15;
    }
    doc
      .fontSize(12)
      .fillColor('#C5A059')
      .text(`Grand Total: ₹${invoiceData.grandTotal.toLocaleString('en-IN')}`, 380, y + 30);

    // Footer terms & BIS certification hallmark guarantee
    doc
      .fontSize(8)
      .fillColor('#777777')
      .text(
        'Shanker Jewells - Crafting timeless heritage gold & silver since 2000. Subject to Trichy jurisdiction.',
        40,
        750,
        { align: 'center' }
      );

    doc.end();
  }

  /**
   * Generates custom jewellery PDF quotation
   */
  static generateQuotationPdf(quotationData: any, versionData: any, res: Response) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Quotation_${quotationData.quotationNumber}_v${versionData.versionNumber}.pdf"`
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .fillColor('#C5A059')
      .text('SHANKER JEWELLS', { align: 'center' });
    doc
      .fontSize(9)
      .fillColor('#444444')
      .text('No.4 sandhukadai, bigbazzar street, trichy - 620008 | Phone: +91 9443949192', { align: 'center' });
    doc.moveDown(1.5);

    doc
      .fontSize(14)
      .fillColor('#18181B')
      .text(`CUSTOM JEWELLERY QUOTATION (${quotationData.quotationNumber} v${versionData.versionNumber})`, {
        underline: true,
      });

    doc
      .fontSize(10)
      .text(`Valid Until: ${new Date(quotationData.validUntil).toLocaleDateString('en-IN')}`)
      .text(`Metal: ${versionData.metalType} (${versionData.purity})`)
      .text(`Est. Net Weight: ${versionData.netWeight} grams`)
      .text(`Est. Gross Weight: ${versionData.grossWeight} grams`);
    doc.moveDown();

    doc.fontSize(11).fillColor('#C5A059').text('PRICING ESTIMATE BREAKDOWN');
    doc.fontSize(10).fillColor('#18181B');
    doc.text(`Base Metal Cost: ₹${(versionData.netWeight * versionData.metalRate).toLocaleString('en-IN')}`);
    doc.text(`Wastage Allowance (${versionData.wastage}%): Included in estimate`);
    doc.text(`Craftsmanship / Making Charges: ₹${versionData.makingCharges.toLocaleString('en-IN')}`);
    doc.text(`Gemstone / Diamond Charges: ₹${versionData.stoneCharges.toLocaleString('en-IN')}`);
    doc.text(`GST (${versionData.taxRate}%): ₹${versionData.taxAmount.toLocaleString('en-IN')}`);
    doc.moveDown(0.5);
    doc
      .fontSize(13)
      .fillColor('#C5A059')
      .text(`ESTIMATED TOTAL: ₹${versionData.totalAmount.toLocaleString('en-IN')}`);

    doc.moveDown();
    if (versionData.terms) {
      doc.fontSize(9).fillColor('#444444').text(`Terms & Conditions:\n${versionData.terms}`);
    }

    doc.end();
  }
}
