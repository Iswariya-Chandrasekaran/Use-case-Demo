# Doctype Event = After Submit

company = "ABC"

# Expense Account (Debit)
expense_account = "Maintenance Expense Account - A"

# Cash/Bank Account (Credit)
payment_account = "Cash - A"

# Amount taken from Machine Maintenance doc
amount = doc.cost or 0

if amount <= 0:
    frappe.throw("Cost must be greater than zero before submitting.")

# Create Journal Entry
je = frappe.get_doc({
    "doctype": "Journal Entry",
    "voucher_type": "Journal Entry",
    "company": company,
    "posting_date": frappe.utils.today(),
    "accounts": [
        {
            "account": expense_account,
            "debit_in_account_currency": amount,
            "credit_in_account_currency": 0,
        },
        {
            "account": payment_account,
            "credit_in_account_currency": amount,
            "debit_in_account_currency": 0,
        },
    ],
    "user_remark": f"Auto entry for Machine Maintenance {doc.name}",
})

je.insert()
je.submit()

doc.journal_entry = je.name
