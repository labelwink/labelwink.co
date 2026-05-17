import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf', fontWeight: 700 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#1a1a1a',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 15
  },
  brandName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1C3829'
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#4b5563',
    textAlign: 'right'
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  col: {
    width: '48%'
  },
  label: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
    textTransform: 'uppercase'
  },
  value: {
    fontSize: 9,
    fontWeight: 400,
    lineHeight: 1.4
  },
  valueBold: {
    fontSize: 9,
    fontWeight: 600,
    lineHeight: 1.4
  },
  table: {
    width: 'auto',
    marginTop: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb'
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6
  },
  colDesc: { width: '45%' },
  colQty: { width: '10%' },
  colPrice: { width: '15%' },
  colTax: { width: '15%' },
  colTotal: { width: '15%' },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 600,
    color: '#4b5563'
  },
  tableCell: {
    fontSize: 9
  },
  totals: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  totalsTable: {
    width: '50%'
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '1px solid #f3f4f6'
  },
  totalsRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTop: '1px solid #e5e7eb',
    marginTop: 4
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280'
  }
});

export const InvoicePDF = ({ order, legalSettings }: { order: any, legalSettings: any }) => {
  const { invoice_number, created_at, customer_name, shipping_address, items, total_amount, payment_method } = order;
  const { legal_entity_name, registered_address, gstin, site_name } = legalSettings;

  // Calculate totals correctly
  let subtotal = 0;
  let taxTotal = 0;
  
  const formattedItems = (items || []).map((item: any) => {
    const qty = item.quantity || 1;
    const price = item.price || 0;
    const itemTotal = price * qty;
    // Assuming 5% GST included in price for fashion, reverse calculate
    // If you have specific tax logic, replace this
    const basePrice = itemTotal / 1.05;
    const itemTax = itemTotal - basePrice;
    
    subtotal += basePrice;
    taxTotal += itemTax;
    
    return {
      name: item.name || item.product_name,
      qty,
      price: price,
      tax: itemTax,
      total: itemTotal
    };
  });

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{site_name || 'LabelWink'}</Text>
          </View>
          <View>
            <Text style={styles.title}>TAX INVOICE</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.col}>
            <Text style={styles.label}>Sold By</Text>
            <Text style={styles.valueBold}>{legal_entity_name || 'LabelWink Pvt Ltd'}</Text>
            <Text style={styles.value}>{registered_address || 'Coimbatore, TN, India'}</Text>
            <Text style={styles.value}>GSTIN: {gstin || 'Unregistered'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Invoice Details</Text>
            <Text style={styles.value}>Invoice No: <Text style={styles.valueBold}>{invoice_number}</Text></Text>
            <Text style={styles.value}>Order ID: {order.order_number || order.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.value}>Date: {new Date(created_at).toLocaleDateString()}</Text>
            <Text style={styles.value}>Payment: {payment_method || 'Online'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill To / Ship To</Text>
            <Text style={styles.valueBold}>{customer_name}</Text>
            <Text style={styles.value}>{shipping_address?.street}</Text>
            <Text style={styles.value}>{shipping_address?.city}, {shipping_address?.state}</Text>
            <Text style={styles.value}>{shipping_address?.country} - {shipping_address?.postal_code}</Text>
            <Text style={styles.value}>Ph: {order.customer_phone}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={[styles.tableCol, styles.colDesc]}><Text style={styles.tableCellHeader}>Item Description</Text></View>
            <View style={[styles.tableCol, styles.colQty]}><Text style={styles.tableCellHeader}>Qty</Text></View>
            <View style={[styles.tableCol, styles.colPrice]}><Text style={styles.tableCellHeader}>Price</Text></View>
            <View style={[styles.tableCol, styles.colTax]}><Text style={styles.tableCellHeader}>Tax (5%)</Text></View>
            <View style={[styles.tableCol, styles.colTotal]}><Text style={styles.tableCellHeader}>Total</Text></View>
          </View>
          
          {formattedItems.map((item: any, i: number) => (
            <View style={styles.tableRow} key={i}>
              <View style={[styles.tableCol, styles.colDesc]}><Text style={styles.tableCell}>{item.name}</Text></View>
              <View style={[styles.tableCol, styles.colQty]}><Text style={styles.tableCell}>{item.qty}</Text></View>
              <View style={[styles.tableCol, styles.colPrice]}><Text style={styles.tableCell}>₹{(item.price - (item.tax/item.qty)).toFixed(2)}</Text></View>
              <View style={[styles.tableCol, styles.colTax]}><Text style={styles.tableCell}>₹{item.tax.toFixed(2)}</Text></View>
              <View style={[styles.tableCol, styles.colTotal]}><Text style={styles.tableCell}>₹{item.total.toFixed(2)}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.value}>Subtotal</Text>
              <Text style={styles.value}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.value}>GST (IGST/CGST+SGST)</Text>
              <Text style={styles.value}>₹{taxTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsRowBold}>
              <Text style={styles.valueBold}>Grand Total</Text>
              <Text style={styles.valueBold}>₹{(total_amount || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This is a computer generated invoice and does not require a physical signature.</Text>
          <Text>As per Consumer Protection (E-Commerce) Rules, 2020</Text>
        </View>
      </Page>
    </Document>
  );
};
