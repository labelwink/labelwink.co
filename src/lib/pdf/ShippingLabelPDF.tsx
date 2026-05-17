import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

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
    padding: 20,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#000000',
    backgroundColor: '#ffffff'
  },
  borderWrap: {
    border: '2px solid #000',
    height: '100%',
    padding: 15,
    flexDirection: 'column'
  },
  header: {
    borderBottom: '2px solid #000',
    paddingBottom: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  courierText: {
    fontSize: 18,
    fontWeight: 700,
  },
  trackingText: {
    fontSize: 12,
    fontWeight: 600,
  },
  shipToTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 5,
    textDecoration: 'underline'
  },
  addressBox: {
    marginBottom: 15,
    padding: 10,
    border: '1px solid #000',
    backgroundColor: '#f9fafb'
  },
  customerName: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4
  },
  text: {
    fontSize: 12,
    lineHeight: 1.4
  },
  phone: {
    fontSize: 12,
    fontWeight: 600,
    marginTop: 5
  },
  orderInfoBox: {
    borderTop: '2px dashed #000',
    borderBottom: '2px dashed #000',
    paddingVertical: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  orderCol: {
    width: '48%'
  },
  label: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 2
  },
  value: {
    fontSize: 12,
    fontWeight: 600
  },
  returnAddress: {
    marginTop: 'auto',
    borderTop: '1px solid #000',
    paddingTop: 10
  },
  returnTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2
  },
  returnText: {
    fontSize: 8,
    color: '#374151'
  }
});

export const ShippingLabelPDF = ({ order, legalSettings }: { order: any, legalSettings: any }) => {
  const { id, customer_name, shipping_address, customer_phone, payment_method, total_amount } = order;
  const { legal_entity_name, registered_address, site_name } = legalSettings;

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.borderWrap}>
          <View style={styles.header}>
            <Text style={styles.courierText}>{payment_method === 'COD' ? 'CASH ON DELIVERY' : 'PREPAID'}</Text>
            <Text style={styles.trackingText}>{payment_method === 'COD' ? `Collect: ₹${total_amount}` : 'Do Not Collect Cash'}</Text>
          </View>

          <Text style={styles.shipToTitle}>SHIP TO:</Text>
          <View style={styles.addressBox}>
            <Text style={styles.customerName}>{customer_name}</Text>
            <Text style={styles.text}>{shipping_address?.street}</Text>
            <Text style={styles.text}>{shipping_address?.city}, {shipping_address?.state}</Text>
            <Text style={styles.text}>{shipping_address?.country} - {shipping_address?.postal_code}</Text>
            <Text style={styles.phone}>Phone: {customer_phone}</Text>
          </View>

          <View style={styles.orderInfoBox}>
            <View style={styles.orderCol}>
              <Text style={styles.label}>Order ID</Text>
              <Text style={styles.value}>{order.order_number || id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.orderCol}>
              <Text style={styles.label}>Weight</Text>
              <Text style={styles.value}>0.5 KG (Approx)</Text>
            </View>
          </View>

          <View style={styles.returnAddress}>
            <Text style={styles.returnTitle}>Return Address / If undelivered return to:</Text>
            <Text style={styles.returnText}>{legal_entity_name || site_name || 'LabelWink'}</Text>
            <Text style={styles.returnText}>{registered_address || 'Coimbatore, TN, India'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
