export const SUSPENSE_CUSTOMER_ID = "__suspense__";

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
  currency: 'INR' | 'USD';
  globalGstEnabled: boolean;
  monthlyOverhead?: number;
  aiEnabled?: boolean;
  aiName?: string;
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
  status: 'paid' | 'credit' | 'cancelled';
  cancelledAt?: string;
  shopSettings: ShopSettings;
  createdAt: string;
};

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "",
  ownerName: "",
  phone: "",
  address: "",
  gstin: "",
  thankYouMessage: "Thank you for shopping with us!",
  termsConditions: "Goods once sold will not be returned.",
  defaultGstRate: 0,
  lowStockThreshold: 5,
  currency: 'INR',
  globalGstEnabled: true,
  monthlyOverhead: 0,
  aiEnabled: true,
  aiName: "Paras",
};

// v3: Clean slate — no seed data, shop starts fresh with onboarding wizard
const STORAGE_VERSION = "v3";

function initializeStorage() {
  const currentVersion = localStorage.getItem('billing_version');
  if (currentVersion !== STORAGE_VERSION) {
    ['billing_shopSettings', 'billing_inventory', 'billing_customers',
     'billing_transactions', 'billing_bills', 'billing_invoice_counter'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('billing_version', STORAGE_VERSION);
  }

  if (!localStorage.getItem('billing_shopSettings')) {
    localStorage.setItem('billing_shopSettings', JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem('billing_inventory')) {
    localStorage.setItem('billing_inventory', JSON.stringify([]));
  }
  if (!localStorage.getItem('billing_customers')) {
    localStorage.setItem('billing_customers', JSON.stringify([]));
  }
  if (!localStorage.getItem('billing_bills')) {
    localStorage.setItem('billing_bills', JSON.stringify([]));
  }
  if (!localStorage.getItem('billing_transactions')) {
    localStorage.setItem('billing_transactions', JSON.stringify([]));
  }
}

initializeStorage();

// ─── Currency formatter ──────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function currencySymbol(currency: 'INR' | 'USD' = 'INR'): string {
  return currency === 'USD' ? '$' : '₹';
}

export const storage = {
  getSettings: (): ShopSettings => {
    const stored = JSON.parse(localStorage.getItem('billing_shopSettings') || '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
  },
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
  deductInventoryStock: (items: BillItem[]) => {
    const inventory = storage.getInventory();
    let changed = false;
    items.forEach(billItem => {
      if (!billItem.productId) return;
      const inv = inventory.find(i => i.id === billItem.productId);
      if (inv) { inv.stock = Math.max(0, inv.stock - billItem.qty); changed = true; }
    });
    if (changed) {
      storage.saveInventory(inventory);
      window.dispatchEvent(new Event('inventory-updated'));
    }
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
    const txns = storage.getTransactions().map(t =>
      t.customerId === id ? { ...t, customerId: SUSPENSE_CUSTOMER_ID } : t
    );
    storage.saveTransactions(txns);
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

  cancelBill: (id: string) => {
    const bills = storage.getBills();
    const bill = bills.find(b => b.id === id);
    if (!bill || bill.status === 'cancelled') return false;
    bill.status = 'cancelled';
    bill.cancelledAt = new Date().toISOString();
    storage.saveBills(bills);
    const inventory = storage.getInventory();
    let changed = false;
    bill.items.forEach(billItem => {
      if (!billItem.productId) return;
      const inv = inventory.find(i => i.id === billItem.productId);
      if (inv) { inv.stock += billItem.qty; changed = true; }
    });
    if (changed) {
      storage.saveInventory(inventory);
      window.dispatchEvent(new Event('inventory-updated'));
    }
    return true;
  },

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
    return `INV-${String(next).padStart(4, '0')}`;
  },

  peekNextInvoiceNumber: (): string => {
    const counter = parseInt(localStorage.getItem('billing_invoice_counter') || '100', 10);
    return `INV-${String(counter + 1).padStart(4, '0')}`;
  },
};
