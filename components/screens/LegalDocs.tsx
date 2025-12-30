import React from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';

export const LegalDocs: React.FC = () => {

  const downloadPDF = () => {
    // 1. Try to download static file first (if user uploaded it)
    // 2. If you don't upload a file, this JS generation acts as a fallback or primary generator
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SAUKI MART - LEGAL DOCUMENTS", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // Privacy Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PRIVACY POLICY", margin, yPos);
    yPos += 8;

    // Privacy Text
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const privacyText = `
Sauki Data Links ("we," "us," "the Company") operates SAUKI MART. We process personal data in strict compliance with the Nigeria Data Protection Act 2023 ("NDPA").

INFORMATION WE COLLECT:
We collect your phone number, email address, name, and transaction details. We also collect device info for security.

HOW WE USE DATA:
1. To process airtime, data, and product purchases.
2. To verify payments via Flutterwave.
3. To communicate updates.

YOUR RIGHTS:
You have the right to access, correct, or delete your data. Contact saukidatalinks@gmail.com.

DATA SECURITY:
We use SSL encryption and secure servers. We do not sell your data.
    `;
    const splitPrivacy = doc.splitTextToSize(privacyText.trim(), maxLineWidth);
    doc.text(splitPrivacy, margin, yPos);
    yPos += (splitPrivacy.length * 5) + 15;

    // Terms Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS OF SERVICE", margin, yPos);
    yPos += 8;

    // Terms Text
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const termsText = `
By using SAUKI MART, you agree to these terms.

1. SERVICES
We provide VTU (Airtime/Data) and E-commerce. We are an intermediary between you and network providers (MTN, Airtel, etc).

2. REFUNDS
- Digital Products: Non-refundable once delivered.
- Failed Deliveries: Refunded automatically or upon request if verified.
- Physical Products: 7-day return policy for defects.

3. USER OBLIGATIONS
You must provide accurate phone numbers. We are not liable for funding the wrong number provided by you.

4. CONTACT
Email: saukidatalinks@gmail.com | Phone: 09024099561 / 09076872520
    `;
    const splitTerms = doc.splitTextToSize(termsText.trim(), maxLineWidth);
    doc.text(splitTerms, margin, yPos);

    doc.save("Sauki_Mart_Legal_Bundle.pdf");
  };

  return (
    <div className="space-y-6">
       {/* Header / Download Action */}
       <div className="bg-slate-900 p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-slate-200">
           <div>
               <h3 className="font-bold text-white text-lg">Legal Bundle</h3>
               <p className="text-xs text-slate-400">PDF Version (Signed)</p>
           </div>
           <Button onClick={downloadPDF} className="w-auto px-6 h-12 bg-white text-slate-900 hover:bg-slate-100 font-bold">
               <Download className="w-4 h-4 mr-2" /> Download
           </Button>
       </div>

       {/* Scrollable View */}
       <div className="h-[400px] overflow-y-auto bg-white rounded-xl border border-slate-100 p-6 shadow-inner no-scrollbar">
           
           {/* Branding in View */}
           <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
               <img src="/logo.png" alt="Sauki" className="w-10 h-10 object-contain" />
               <div>
                   <h2 className="font-black text-slate-900">SAUKI MART</h2>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest">Official Legal Documents</p>
               </div>
           </div>

           <div className="prose prose-sm prose-slate max-w-none">
               <h3 className="text-lg font-bold text-slate-900">Privacy Policy</h3>
               <p className="text-xs text-slate-500 font-mono mb-4">Effective: Dec 29, 2025</p>
               <p>
                   Sauki Data Links ("we," "us," "our," or "the Company") is committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, disclose, store, and protect your personal information when you use the SAUKI MART mobile application.
               </p>
               <p>We process personal data in strict compliance with the Nigeria Data Protection Act 2023 ("NDPA").</p>
               
               <h4 className="font-bold text-slate-800 mt-4">1. Information We Collect</h4>
               <ul className="list-disc pl-4 space-y-1">
                   <li>Contact details: Phone number, email address, and name.</li>
                   <li>Transaction-related information for purchases.</li>
                   <li>Device information for security.</li>
               </ul>

               <h4 className="font-bold text-slate-800 mt-4">2. How We Use Data</h4>
               <ul className="list-disc pl-4 space-y-1">
                   <li>To provide VTU and e-commerce services.</li>
                   <li>To verify transactions via Flutterwave.</li>
                   <li>To communicate service updates.</li>
               </ul>

               <hr className="my-8 border-slate-200" />

               <h3 className="text-lg font-bold text-slate-900">Terms of Service</h3>
               <p className="text-xs text-slate-500 font-mono mb-4">Effective: Dec 29, 2025</p>
               
               <p>These Terms constitute a legally binding agreement between you ("User") and Sauki Data Links.</p>

               <h4 className="font-bold text-slate-800 mt-4">1. Services</h4>
               <p>We act as an intermediary for airtime, data, and device sales. We do not own the telecommunication networks.</p>

               <h4 className="font-bold text-slate-800 mt-4">2. Refunds & Failures</h4>
               <p>
                   <strong>Digital Products:</strong> Sales are final once delivered. Failed deliveries are refunded within 24-48 hours.
                   <br/>
                   <strong>Physical Products:</strong> 7-day return policy for defects.
               </p>

               <h4 className="font-bold text-slate-800 mt-4">3. Contact</h4>
               <p>Email: saukidatalinks@gmail.com | Phone: 09024099561</p>
           </div>
       </div>
    </div>
  );
};