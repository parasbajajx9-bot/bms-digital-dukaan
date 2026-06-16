export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  hsnCode?: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  customerId: string;
  type: 'udhaar' | 'payment';
  amount: number;
  note: string;
  date: string;
  billId?: string;
};

export type BillItem = {
  productId?: string;
  name: string;
  hsnCode?: string;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
};

export type ShopSettings = {
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  gstin: string;
  logo?: string;
  thankYouMessage: string;
  termsConditions: string;
  defaultGstRate: number;
  lowStockThreshold: number;
};

export type Bill = {
  id: string;
  billNumber: string;
  customerId?: string;
  customerName?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  gstEnabled: boolean;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  status: 'paid' | 'credit';
  shopSettings: ShopSettings;
  createdAt: string;
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "My Digital Dukaan",
  ownerName: "Owner Name",
  phone: "9876543210",
  address: "123 Main Bazaar",
  gstin: "",
  thankYouMessage: "Thank you for shopping with us!",
  termsConditions: "Goods once sold will not be returned.",
  defaultGstRate: 0,
  lowStockThreshold: 5,
};

const INITIAL_INVENTORY: Omit<InventoryItem, 'id' | 'createdAt'>[] = [
  { name: "Rice 5kg", sku: "RICE-5", sellingPrice: 350, costPrice: 300, stock: 20, lowStockThreshold: 5, category: "Grains" },
  { name: "Cooking Oil 1L", sku: "OIL-1L", sellingPrice: 150, costPrice: 130, stock: 15, lowStockThreshold: 5, category: "Oils" },
  { name: "Sugar 1kg", sku: "SUG-1", sellingPrice: 45, costPrice: 38, stock: 50, lowStockThreshold: 10, category: "Groceries" },
  { name: "Toor Dal 500g", sku: "DAL-500", sellingPrice: 85, costPrice: 70, stock: 30, lowStockThreshold: 5, category: "Pulses" },
  { name: "Tea Powder 250g", sku: "TEA-250", sellingPrice: 120, costPrice: 100, stock: 25, lowStockThreshold: 5, category: "Beverages" },
  { name: "Salt 1kg", sku: "SALT-1", sellingPrice: 25, costPrice: 18, stock: 40, lowStockThreshold: 10, category: "Groceries" },
  { name: "Atta 10kg", sku: "ATTA-10", sellingPrice: 420, costPrice: 380, stock: 10, lowStockThreshold: 3, category: "Grains" },
  { name: "Soap bar", sku: "SOAP", sellingPrice: 35, costPrice: 28, stock: 60, lowStockThreshold: 15, category: "Personal Care" },
  { name: "Biscuit pack", sku: "BISC", sellingPrice: 20, costPrice: 16, stock: 100, lowStockThreshold: 20, category: "Snacks" },
  { name: "Shampoo sachet", sku: "SHAMP", sellingPrice: 2, costPrice: 1.5, stock: 200, lowStockThreshold: 50, category: "Personal Care" }
];

const STORAGE_VERSION = "v2";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function initializeStorage() {
  const currentVersion = localStorage.getItem('billing_version');
  if (currentVersion !== STORAGE_VERSION) {
    // Clear old data and re-seed with new version
    ['billing_shopSettings', 'billing_inventory', 'billing_customers', 'billing_transactions', 'billing_bills'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('billing_version', STORAGE_VERSION);
  }

  if (!localStorage.getItem('billing_shopSettings')) {
    localStorage.setItem('billing_shopSettings', JSON.stringify(DEFAULT_SETTINGS));
  }

  let inventoryItems: InventoryItem[] = [];
  if (!localStorage.getItem('billing_inventory')) {
    inventoryItems = INITIAL_INVENTORY.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem('billing_inventory', JSON.stringify(inventoryItems));
  } else {
    inventoryItems = JSON.parse(localStorage.getItem('billing_inventory')!);
  }

  let customers: Customer[] = [];
  if (!localStorage.getItem('billing_customers')) {
    customers = [
      { id: crypto.randomUUID(), name: "Ramesh Kumar", phone: "9876501234", address: "12 Gandhi Nagar", createdAt: daysAgo(30) },
      { id: crypto.randomUUID(), name: "Sunita Devi", phone: "9845678901", address: "5 Laxmi Colony", createdAt: daysAgo(20) },
      { id: crypto.randomUUID(), name: "Mohan Lal", phone: "9912345678", address: "Near Hanuman Mandir", createdAt: daysAgo(15) },
      { id: crypto.randomUUID(), name: "Priya Sharma", phone: "9733456789", address: "Plot 7, Sector 4", createdAt: daysAgo(10) },
    ];
    localStorage.setItem('billing_customers', JSON.stringify(customers));
  } else {
    customers = JSON.parse(localStorage.getItem('billing_customers')!);
  }

  if (!localStorage.getItem('billing_bills')) {
    const shop = DEFAULT_SETTINGS;
    const items0 = inventoryItems.slice(0, 3);
    const bills: Bill[] = [
      {
        id: crypto.randomUUID(),
        billNumber: "INV-0001",
        customerId: customers[0]?.id,
        customerName: customers[0]?.name,
        items: [{ productId: items0[0]?.id, name: items0[0]?.name ?? "Rice 5kg", qty: 2, rate: 350, discount: 0, amount: 700 }],
        subtotal: 700, discount: 0, gstEnabled: false, gstRate: 0, cgst: 0, sgst: 0, igst: 0,
        total: 700, paymentMethod: 'cash', status: 'paid', shopSettings: shop, createdAt: daysAgo(5),
      },
      {
        id: crypto.randomUUID(),
        billNumber: "INV-0002",
        customerId: customers[1]?.id,
        customerName: customers[1]?.name,
        items: [
          { productId: items0[1]?.id, name: items0[1]?.name ?? "Cooking Oil 1L", qty: 1, rate: 150, discount: 0, amount: 150 },
          { productId: items0[2]?.id, name: items0[2]?.name ?? "Sugar 1kg", qty: 2, rate: 45, discount: 0, amount: 90 },
        ],
        subtotal: 240, discount: 0, gstEnabled: false, gstRate: 0, cgst: 0, sgst: 0, igst: 0,
        total: 240, paymentMethod: 'upi', status: 'paid', shopSettings: shop, createdAt: daysAgo(3),
      },
      {
        id: crypto.randomUUID(),
        billNumber: "INV-0003",
        customerId: customers[2]?.id,
        customerName: customers[2]?.name,
        items: [{ name: "Toor Dal 500g", qty: 3, rate: 85, discount: 0, amount: 255 }],
        subtotal: 255, discount: 0, gstEnabled: false, gstRate: 0, cgst: 0, sgst: 0, igst: 0,
        total: 255, paymentMethod: 'credit', status: 'credit', shopSettings: shop, createdAt: daysAgo(2),
      },
      {
        id: crypto.randomUUID(),
        billNumber: "INV-0004",
        customerId: customers[3]?.id,
        customerName: customers[3]?.name,
        items: [
          { name: "Atta 10kg", qty: 1, rate: 420, discount: 0, amount: 420 },
          { name: "Salt 1kg", qty: 2, rate: 25, discount: 0, amount: 50 },
        ],
        subtotal: 470, discount: 0, gstEnabled: true, gstRate: 5, cgst: 11.75, sgst: 11.75, igst: 0,
        total: 493.5, paymentMethod: 'cash', status: 'paid', shopSettings: shop, createdAt: daysAgo(1),
      },
    ];
    localStorage.setItem('billing_bills', JSON.stringify(bills));

    const transactions: Transaction[] = [
      { id: crypto.randomUUID(), customerId: customers[0]?.id ?? '', type: 'udhaar', amount: 500, note: "Monthly grocery credit", date: daysAgo(7), billId: undefined },
      { id: crypto.randomUUID(), customerId: customers[0]?.id ?? '', type: 'payment', amount: 300, note: "Partial payment - cash", date: daysAgo(4) },
      { id: crypto.randomUUID(), customerId: customers[1]?.id ?? '', type: 'udhaar', amount: 350, note: "Weekly groceries on credit", date: daysAgo(6) },
      { id: crypto.randomUUID(), customerId: customers[1]?.id ?? '', type: 'payment', amount: 350, note: "Full settlement via UPI", date: daysAgo(3) },
      { id: crypto.randomUUID(), customerId: customers[2]?.id ?? '', type: 'udhaar', amount: 255, note: "INV-0003 credit", date: daysAgo(2) },
      { id: crypto.randomUUID(), customerId: customers[3]?.id ?? '', type: 'udhaar', amount: 180, note: "Advance purchase", date: daysAgo(5) },
      { id: crypto.randomUUID(), customerId: customers[3]?.id ?? '', type: 'payment', amount: 180, note: "Paid in full", date: daysAgo(1) },
    ];
    localStorage.setItem('billing_transactions', JSON.stringify(transactions));
  }

  if (!localStorage.getItem('billing_transactions')) {
    localStorage.setItem('billing_transactions', JSON.stringify([]));
  }
}

// Call initially
initializeStorage();

export const storage = {
  getSettings: (): ShopSettings => JSON.parse(localStorage.getItem('billing_shopSettings') || '{}'),
  saveSettings: (settings: ShopSettings) => localStorage.setItem('billing_shopSettings', JSON.stringify(settings)),
  
  getInventory: (): InventoryItem[] => JSON.parse(localStorage.getItem('billing_inventory') || '[]'),
  saveInventory: (items: InventoryItem[]) => localStorage.setItem('billing_inventory', JSON.stringify(items)),
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt'>) => {
    const items = storage.getInventory();
    items.push({ ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    storage.saveInventory(items);
  },
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => {
    const items = storage.getInventory().map(i => i.id === id ? { ...i, ...updates } : i);
    storage.saveInventory(items);
  },
  deleteInventoryItem: (id: string) => {
    storage.saveInventory(storage.getInventory().filter(i => i.id !== id));
  },

  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem('billing_customers') || '[]'),
  saveCustomers: (customers: Customer[]) => localStorage.setItem('billing_customers', JSON.stringify(customers)),
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const customers = storage.getCustomers();
    const newCustomer = { ...customer, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    customers.push(newCustomer);
    storage.saveCustomers(customers);
    return newCustomer;
  },
  deleteCustomer: (id: string) => {
    storage.saveCustomers(storage.getCustomers().filter(c => c.id !== id));
    storage.saveTransactions(storage.getTransactions().filter(t => t.customerId !== id));
  },

  getTransactions: (): Transaction[] => JSON.parse(localStorage.getItem('billing_transactions') || '[]'),
  saveTransactions: (txns: Transaction[]) => localStorage.setItem('billing_transactions', JSON.stringify(txns)),
  addTransaction: (txn: Omit<Transaction, 'id' | 'date'>) => {
    const txns = storage.getTransactions();
    const newTxn = { ...txn, id: crypto.randomUUID(), date: new Date().toISOString() };
    txns.push(newTxn);
    storage.saveTransactions(txns);
    return newTxn;
  },

  getBills: (): Bill[] => JSON.parse(localStorage.getItem('billing_bills') || '[]'),
  saveBills: (bills: Bill[]) => localStorage.setItem('billing_bills', JSON.stringify(bills)),
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'billNumber'>) => {
    const bills = storage.getBills();
    const billNumber = storage.getNextInvoiceNumber();
    const newBill = { ...bill, id: crypto.randomUUID(), billNumber, createdAt: new Date().toISOString() };
    bills.push(newBill);
    storage.saveBills(bills);
    return newBill;
  },

  getNextInvoiceNumber: (): string => {
    const counter = parseInt(localStorage.getItem('billing_invoice_counter') || '100', 10);
    const next = counter + 1;
    localStorage.setItem('billing_invoice_counter', String(next));
    return `PE-${next}`;
  },

  peekNextInvoiceNumber: (): string => {
    const counter = parseInt(localStorage.getItem('billing_invoice_counter') || '100', 10);
    return `PE-${counter + 1}`;
  },
};
