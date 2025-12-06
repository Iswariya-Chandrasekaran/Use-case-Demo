# Doctype Event = Before Submit

# Validate that Technician is assigned
if not doc.technician:
    frappe.throw("Technician must be assigned before submitting.")
