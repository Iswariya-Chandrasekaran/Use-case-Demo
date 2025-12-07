# Columns 
def build_report_columnss(filters):
    # This function prepares the report column definitions based on the fixed structure need
    report_columns = [
        {"fieldname": "machine", "label": _("Machine"), "fieldtype": "Link", "options": "Item", "width": 200},
        {"fieldname": "maintenance_date", "label": _("Maintenance Date"), "fieldtype": "Date", "width": 120},
        {"fieldname": "technician", "label": _("Technician"), "fieldtype": "Link", "options": "Employee", "width": 160},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 120},
        {"fieldname": "total_cost", "label": _("Total Cost"), "fieldtype": "Currency", "width": 130},
    ]
    return report_columns


# Data
def report_data(filters):

    # Helper function: consolidates total cost by machine for summary mode
    # This collects multiple entries for the same machine and combines the total cost
    def summarise_data(rows):
        summary_map = {}
        for row in rows:
            machine_key = row.machine

            # Create entry if machine not yet added
            if machine_key not in summary_map:
                summary_map[machine_key] = {
                    "machine": row.machine,
                    "maintenance_date": None,   # Summary does not use individual dates
                    "technician": None,        # Summary does not show technician
                    "status": "Consolidated",  # Mark as consolidated summary row
                    "total_cost": 0
                }

            # Add cost for each row belonging to this machine
            summary_map[machine_key]["total_cost"] = summary_map[machine_key]["total_cost"] + row.total_cost or 0

        # Convert dictionary back to list format for report output
        return list(summary_map.values())

    # Check if user selected consolidated mode
    consolidated_mode = filters.get("consolidated")

    # Conditions for SQL query based on filters
    sql_conditions = ""
    if filters.get("machine"):
        sql_conditions = sql_conditions + " AND mach.machine_name = %(machine)s"

    if filters.get("technician"):
        sql_conditions = sql_conditions + " AND mach.technician = %(technician)s"

    if filters.get("from_date") and filters.get("to_date"):
        sql_conditions = sql_conditions + " AND mach.maintenance_date BETWEEN %(from_date)s AND %(to_date)s"

    # Query to fetch machine maintenance records
    sql_query = f"""
        SELECT
            mach.name,
            mach.machine_name AS machine,
            mach.maintenance_date,
            mach.technician,
            mach.status,
            mach.cost AS total_cost
        FROM `tabMachine Maintenance` mach
        WHERE mach.docstatus < 2
        {sql_conditions}
        ORDER BY mach.machine_name, mach.maintenance_date
    """

    # Execute query and fetch results as dictionary list
    query_result = frappe.db.sql(sql_query, filters, as_dict=True)

    # If consolidated mode is enabled, summarise cost per machine
    if consolidated_mode:
        return summarise_data(query_result)
    else:
        return query_result


# Begin of execute
# The report returns both columns and data as a single combined structure
data = build_report_columnss(filters), report_data(filters)
