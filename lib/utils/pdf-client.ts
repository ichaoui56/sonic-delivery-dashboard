'use client';

import { downloadInvoicePDF, createInvoicePDF, OrderForPDF } from './pdf-generator';

// Simple client-side function that works with your OrdersTable
export const generateAndDownloadInvoice = async (
    order: OrderForPDF, 
    merchantName: string, 
    logoUrl?: string  // Add optional logo URL parameter
) => {
    try {
        // Download directly with logo URL
        const result = await downloadInvoicePDF(order, merchantName, logoUrl);
        
        return result;
        
    } catch (error) {
        console.error('[v0] Error generating PDF:', error);
        return {
            success: false,
            fileName: `invoice-${order.orderCode}.pdf`,
            error: error instanceof Error ? error.message : 'Failed to generate PDF'
        };
    }
};

// New function to open PDF in a new tab
export const viewInvoice = async (
    order: OrderForPDF,
    merchantName: string,
    logoUrl?: string
) => {
    try {
        // First, generate the PDF and get it as a blob
        const pdfMake = await import('pdfmake/build/pdfmake.min.js');
        const pdfMakeInstance = pdfMake.default;
        
        // Load logo as base64 if URL is provided
        let logoBase64 = '';
        if (logoUrl) {
            try {
                const response = await fetch(logoUrl);
                const blob = await response.blob();
                logoBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.warn('Could not load logo, proceeding without it:', error);
            }
        }

        const docDefinition = createInvoicePDF(order, merchantName, logoBase64);
        
        // Create a new window for the PDF
        const win = window.open('', '_blank');
        if (!win) {
            throw new Error('Failed to open new window');
        }
        
        // Generate the PDF and open it in the new window
        pdfMakeInstance.createPdf(docDefinition).open({}, win);

        return { success: true };
    } catch (error) {
        console.error('[v0] Error opening PDF:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to open PDF'
        };
    }
};