
import React from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';

export const LegalDocs: React.FC = () => {

  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SAUKI MART - LEGAL DOCUMENTS", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 15;

    // --- Privacy Policy Section ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PRIVACY POLICY", margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const privacyContent = `
Sauki Data Links ("we," "us," "our," or "the Company") is committed to protecting the privacy and security of your personal data. This Privacy Policy explains how we collect, use, disclose, store, and protect your personal information when you use the SAUKI MART mobile application (the "App"), our associated services, or interact with us.

We process personal data in strict compliance with the Nigeria Data Protection Act 2023 ("NDPA").

1. INFORMATION WE COLLECT
a. Information You Provide Directly: Contact details: Phone number, email address, and name. Transaction-related information.
b. Information Collected Automatically: Device information and Usage data.
c. Information from Third Parties: Payment verification data from Flutterwave.

2. HOW WE USE YOUR PERSONAL DATA
- To provide and maintain our services.
- To verify transactions and prevent fraud.
- To communicate with you.
- To comply with legal obligations.

3. DATA SECURITY
We implement appropriate technical and organisational measures to protect your Personal Data, including encryption and access controls.

4. YOUR RIGHTS
Under the NDPA, you have the right to Access, Rectify, Erase, Restrict, and Object to processing of your data. Contact us at saukidatalinks@gmail.com.
    `;

    const splitPrivacy = doc.splitTextToSize(privacyContent.trim(), maxLineWidth);
    doc.text(splitPrivacy, margin, yPos);
    yPos += (splitPrivacy.length * 4) + 10;

    // --- Terms of Service Section ---
    if (yPos > 250) { doc.addPage(); yPos = 20; } // Check page break

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS OF SERVICE", margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const termsContent = `
These Terms of Service constitute a legally binding agreement between you and Sauki Data Links.

1. SERVICES
The App acts as an intermediary platform facilitating:
- Purchase and instant delivery of airtime and data bundles.
- Purchase and delivery of physical mobile devices.
- Payment processing.

2. PAYMENTS AND REFUNDS
- Digital Products (Airtime/Data Bundles): Sales are final and non-refundable once successfully delivered.
- Failed Deliveries: If payment is successful but delivery fails, we will retry or refund your wallet.
- Physical Products: Refunds or returns subject to inspection for defects within 7 days.

3. USER OBLIGATIONS
You agree to provide accurate information, including correct phone numbers for VTU transactions.

4. LIMITATION OF LIABILITY
Services are provided "as is". We are not liable for network failures of Telecommunication Providers.

5. CONTACT US
Email: saukidatalinks@gmail.com
Phone: +2348061934056 and +2347044647081
    `;

    const splitTerms = doc.splitTextToSize(termsContent.trim(), maxLineWidth);
    doc.text(splitTerms, margin, yPos);

    doc.save("Sauki_Mart_Legal_Documents.pdf");
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
               <Download className="w-4 h-4 mr-2" /> Download PDF
           </Button>
       </div>

       {/* Scrollable View */}
       <div className="h-[450px] overflow-y-auto bg-white rounded-xl border border-slate-100 p-6 shadow-inner no-scrollbar">
           
           <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
               <img src="/logo.png" alt="Sauki" className="w-10 h-10 object-contain" />
               <div>
                   <h2 className="font-black text-slate-900">SAUKI MART</h2>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest">Official Legal Documents</p>
               </div>
           </div>

           <div className="prose prose-sm prose-slate max-w-none">
               
               {/* Privacy Policy */}
               <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy Policy</h3>
               <p className="text-xs text-slate-500 font-mono mb-4">Effective Date: December 29, 2025</p>
               
               <p><strong>Sauki Data Links</strong> ("we," "us," "our," or "the Company") is committed to protecting the privacy and security of your personal data. We process personal data in strict compliance with the <strong>Nigeria Data Protection Act 2023</strong> ("NDPA").</p>
               
               <h4 className="font-bold text-slate-800 mt-4">1. Information We Collect</h4>
               <ul className="list-disc pl-4 space-y-1">
                   <li><strong>Direct:</strong> Name, phone number, email address.</li>
                   <li><strong>Automatic:</strong> Device information, IP address.</li>
                   <li><strong>Third Party:</strong> Payment verification from Flutterwave.</li>
               </ul>

               <h4 className="font-bold text-slate-800 mt-4">2. How We Use Data</h4>
               <p>We use data to process transactions, verify payments, and communicate service updates. We do not sell your personal data.</p>

               <h4 className="font-bold text-slate-800 mt-4">3. Your Rights</h4>
               <p>You have the right to access, rectify, or erase your data. Contact our Data Protection Officer at <strong>saukidatalinks@gmail.com</strong>.</p>

               <hr className="my-8 border-slate-200" />

               {/* Terms of Service */}
               <h3 className="text-xl font-bold text-slate-900 mb-2">Terms of Service</h3>
               <p className="text-xs text-slate-500 font-mono mb-4">Effective Date: December 29, 2025</p>
               
               <p>These Terms constitute a legally binding agreement between you ("User") and Sauki Data Links.</p>

               <h4 className="font-bold text-slate-800 mt-4">1. Services</h4>
               <p>We provide Virtual Top-Up (VTU) and E-commerce services. We are an intermediary and do not own the telecommunication networks.</p>

               <h4 className="font-bold text-slate-800 mt-4">2. Payments & Refunds</h4>
               <ul className="list-disc pl-4 space-y-1">
                   <li><strong>Digital Products:</strong> Sales are final once delivered. Failed deliveries are refunded.</li>
                   <li><strong>Physical Products:</strong> 7-day return policy for defects.</li>
               </ul>

               <h4 className="font-bold text-slate-800 mt-4">3. User Obligations</h4>
               <p>You are responsible for providing accurate information, including correct phone numbers. We are not liable for funding wrong numbers provided by you.</p>

               <h4 className="font-bold text-slate-800 mt-4">4. Contact Us</h4>
               <p>Email: saukidatalinks@gmail.com <br/> Phone: +2348061934056 / +2347044647081</p>
           </div>
       </div>
    </div>
  );
};
