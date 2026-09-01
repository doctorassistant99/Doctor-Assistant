import { Modal, Button } from "../ui";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
}

export function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt" size="sm">
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Doctor Clinic</h3>
          <p className="text-xs text-gray-500">Medical Receipt</p>
        </div>
        <div className="space-y-2 text-sm border-t border-dashed border-gray-300 dark:border-gray-600 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Invoice</span>
            <span className="font-mono text-gray-900 dark:text-white">{transaction.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Patient</span>
            <span className="text-gray-900 dark:text-white">{transaction.patient_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="text-gray-900 dark:text-white">{new Date(transaction.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="text-gray-900 dark:text-white capitalize">{transaction.transaction_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Method</span>
            <span className="text-gray-900 dark:text-white capitalize">{transaction.payment_method}</span>
          </div>
          {transaction.description && (
            <div className="flex justify-between">
              <span className="text-gray-500">Description</span>
              <span className="text-gray-900 dark:text-white">{transaction.description}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
            <span className="font-semibold text-gray-900 dark:text-white">Total</span>
            <span className="font-bold text-gray-900 dark:text-white">{Number(transaction.amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-3 mt-4">
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
