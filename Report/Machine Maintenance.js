frappe.query_reports["Machine Maintenance"] = {
"filters":[
     {
            "fieldname": "machine",
            "label": "Machine",
            "fieldtype": "Link",
            "options": "Item",
        },
        {
            "fieldname": "technician",
            "label": "Technician",
            "fieldtype": "Link",
            "options": "Employee"
        },
        {
            "fieldname": "from_date",
            "label": "From Date",
            "fieldtype": "Date",
        },
        {
            "fieldname": "to_date",
            "label": "To Date",
            "fieldtype": "Date"
            
        },
        {
            "fieldname": "consolidated",
            "label": "Consolidated",
            "fieldtype": "Check",
        }
        
  ]
};