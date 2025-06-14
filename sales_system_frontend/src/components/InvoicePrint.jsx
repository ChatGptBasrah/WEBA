import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';

const InvoicePrint = ({ invoice, type = 'sales' }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.getElementById('invoice-print-content').innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ${type === 'sales' ? 'مبيعات' : 'مشتريات'} - ${invoice.invoice_number}</title>
        <style>
          @page {
            size: A5;
            margin: 10mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            direction: rtl;
            text-align: right;
          }
          
          .invoice-container {
            width: 100%;
            max-width: 148mm;
            margin: 0 auto;
            border: 2px solid #000;
            padding: 5mm;
            background: white;
          }
          
          .invoice-header {
            height: 21mm;
            border: 1px solid #000;
            margin-bottom: 5mm;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2mm;
            background-color: #f8f9fa;
          }
          
          .company-info {
            flex: 1;
            text-align: right;
          }
          
          .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 2px;
          }
          
          .company-details {
            font-size: 10px;
            color: #666;
            line-height: 1.2;
          }
          
          .logo-section {
            flex: 0 0 40mm;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            border: 1px dashed #ccc;
            height: 15mm;
            margin: 0 5mm;
          }
          
          .logo-placeholder {
            color: #999;
            font-size: 10px;
          }
          
          .invoice-title {
            flex: 1;
            text-align: left;
            font-size: 18px;
            font-weight: bold;
            color: #d32f2f;
          }
          
          .invoice-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5mm;
            padding: 2mm;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
          }
          
          .meta-item {
            text-align: center;
          }
          
          .meta-label {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 1mm;
          }
          
          .meta-value {
            font-size: 12px;
          }
          
          .customer-info {
            margin-bottom: 5mm;
            padding: 2mm;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5mm;
            border: 1px solid #000;
          }
          
          .items-table th,
          .items-table td {
            border: 1px solid #000;
            padding: 2mm;
            text-align: center;
            font-size: 11px;
          }
          
          .items-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .items-table .item-name {
            text-align: right;
            max-width: 60mm;
          }
          
          .totals-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5mm;
          }
          
          .totals-box {
            border: 1px solid #000;
            padding: 3mm;
            min-width: 40mm;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
            font-size: 11px;
          }
          
          .total-row.final {
            font-weight: bold;
            font-size: 14px;
            color: #d32f2f;
            border-top: 1px solid #000;
            padding-top: 1mm;
          }
          
          .amount-words {
            text-align: center;
            font-weight: bold;
            margin-bottom: 3mm;
            padding: 2mm;
            border: 1px solid #000;
            background-color: #f8f9fa;
          }
          
          .invoice-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #000;
            padding-top: 2mm;
            font-size: 10px;
          }
          
          .footer-item {
            text-align: center;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const numberToWords = (num) => {
    // تحويل الرقم إلى كلمات باللغة العربية (مبسط)
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
    
    if (num === 0) return 'صفر';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one ? ' و' + ones[one] : '');
    }
    
    // للأرقام الأكبر، نعيد تمثيل مبسط
    return num.toString();
  };

  if (!invoice) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">لا توجد فاتورة للطباعة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Print Controls */}
      <div className="flex justify-end space-x-2 space-x-reverse no-print">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="mr-2 h-4 w-4" />
          طباعة الفاتورة
        </Button>
      </div>

      {/* Invoice Content */}
      <div id="invoice-print-content">
        <div className="invoice-container">
          {/* Header */}
          <div className="invoice-header">
            <div className="company-info">
              <div className="company-name">علي ويتم للوكالات التجارية</div>
              <div className="company-details">
                المنصور / شارع الأطباء - مقابل مطعم الحديقة<br/>
                موبايل: 07810562373 - 07707659333<br/>
                المنصور / شارع عمار بن ياسر - مقابل مطعم الحديقة<br/>
                موبايل: 07839977711
              </div>
            </div>
            
            <div className="logo-section">
              <div className="logo-placeholder">
                [مكان الشعار]<br/>
                128mm × 21mm
              </div>
            </div>
            
            <div className="invoice-title">
              {type === 'sales' ? 'فاتورة مبيعات' : 'فاتورة مشتريات'}
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="invoice-meta">
            <div className="meta-item">
              <div className="meta-label">رقم الفاتورة</div>
              <div className="meta-value">{invoice.invoice_number}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">التاريخ</div>
              <div className="meta-value">
                {new Date(invoice.created_at || invoice.invoice_date).toLocaleDateString('ar-EG')}
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-label">نوع الدفع</div>
              <div className="meta-value">
                {invoice.payment_type === 'cash' ? 'نقدي' : 'آجل'}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="customer-info">
            <strong>
              {type === 'sales' ? 'العميل' : 'المورد'}: 
            </strong>
            {invoice.customer?.name || invoice.supplier?.name || 'عميل نقدي'}
            {(invoice.customer?.phone || invoice.supplier?.phone) && (
              <span> - هاتف: {invoice.customer?.phone || invoice.supplier?.phone}</span>
            )}
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th style={{width: '10mm'}}>ت</th>
                <th className="item-name">المادة</th>
                <th style={{width: '15mm'}}>العدد</th>
                <th style={{width: '20mm'}}>سعر المفرد</th>
                <th style={{width: '20mm'}}>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="item-name">
                    {item.product?.name || item.product_name}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{parseFloat(item.unit_price).toFixed(0)}</td>
                  <td>{parseFloat(item.total_price).toFixed(0)}</td>
                </tr>
              ))}
              
              {/* Fill empty rows for consistent layout */}
              {Array.from({ length: Math.max(0, 8 - (invoice.items?.length || 0)) }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="totals-section">
            <div style={{flex: 1}}></div>
            <div className="totals-box">
              <div className="total-row">
                <span>المجموع الفرعي:</span>
                <span>{parseFloat(invoice.total_amount || 0).toFixed(0)} د.ع</span>
              </div>
              {invoice.discount > 0 && (
                <div className="total-row">
                  <span>الخصم:</span>
                  <span>{parseFloat(invoice.discount).toFixed(0)} د.ع</span>
                </div>
              )}
              <div className="total-row final">
                <span>المجموع الكلي:</span>
                <span>{parseFloat(invoice.final_amount || invoice.total_amount || 0).toFixed(0)} د.ع</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="amount-words">
            المبلغ المطلوب: {numberToWords(Math.floor(parseFloat(invoice.final_amount || invoice.total_amount || 0)))} دينار عراقي
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="footer-item">
              <div>التوقيع</div>
            </div>
            <div className="footer-item">
              <div>Store</div>
              <div>{new Date().toLocaleTimeString('en-US', { hour12: true })}</div>
            </div>
            <div className="footer-item">
              <div>شكراً لكم ومرحباً بكم مرة أخرى</div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{marginTop: '3mm', padding: '2mm', border: '1px solid #ddd', fontSize: '10px'}}>
              <strong>ملاحظات:</strong> {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;

