frappe.query_reports["Machine Maintenance Report"] = {
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
        
  ],
   // --- Row Highlighter ---
    formatter: function (value, row, column, data, default_formatter) {
        value = default_formatter(value, row, column, data);

        if (!data) return value;

        // Color Logic
        let bg = "";

        if (data.status === "Overdue") {
            bg = "#ffcccc";        // light red
        }
        else if (data.status === "Scheduled") {
            bg = "#fff3cd";        // light yellow
        }
        else if (data.status === "Completed") {
            bg = "#d4edda";        // light green
        }

        if (bg) {
            value = `<span style="background-color:${bg}; padding: 4px; display:block;">${value}</span>`;
        }

        return value;
    }
};