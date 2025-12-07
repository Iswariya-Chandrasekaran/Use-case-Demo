#Doctype Eveent = After Save

# Triggered on every update (save)
if doc.workflow_state == "Completed" and not doc.completion_date:
    doc.completion_date = frappe.utils.nowdate()
    doc.status = "Completed"
