// Purpose: Automate maintenance workflow, calculate part costs,
//          and handle completion by Technicians
frappe.ui.form.on("Machine Maintenance", {
    // Triggered when the form loads
    onload: function(frm) {
        // Auto-set the maintenance date for new records if not already set
        if (frm.is_new() && !frm.doc.maintenance_date) {
            frm.set_value('maintenance_date', frappe.datetime.get_today());
        }
        toggle_notes(frm);
    },

    // Triggered when the form is refreshed
    refresh: function(frm) {
        toggle_notes(frm);
        update_overdue(frm);
        const user_is_technician = frappe.user_roles.includes("Technician");
        const maintenance_completed = frm.doc.workflow_state === "Completed";

        // Clear old custom buttons to avoid duplicates
        frm.clear_custom_buttons();

        // Show "Maintenance Completed" button only to Technicians
        // and only if maintenance is not yet completed and the document is saved
        if (
            user_is_technician &&
            !maintenance_completed &&
            frm.doc.docstatus === 0 &&
            !frm.is_new() &&
            frm.doc.status === "Scheduled"
           ) {
            frm.add_custom_button("Maintenance Completed", () => {
                frm.trigger("complete_maintenance_action");
            });
        }
    },

    // Common function to mark maintenance as completed
    complete_maintenance_action: function(frm) {
        // Update workflow state and status
        frm.set_value("status", "Completed");
        frm.set_value("workflow_state", "Completed");

        // Set completion date only if it is not already set
        if (!frm.doc.completion_date) {
            frm.set_value("completion_date", frappe.datetime.nowdate());
        }

        // Save the document to persist changes
        frm.save();
    },
    maintenance_date: function(frm) {
       update_overdue(frm);
    },

    // Child table triggers: when a new part row is added or removed
    parts_used_add: function(frm) {
        update_total_part_cost(frm);
    },

    parts_used_remove: function(frm) {
        update_total_part_cost(frm);
    }
});


// Purpose: Automatically fetch rates, calculate amounts for Parts Used 
frappe.ui.form.on("Parts Used", {
    // Triggered when a part is selected
    part: function(frm, cdt, cdn) {
        fetch_part_price(frm, cdt, cdn);
    },

    // Triggered when quantity is changed
    quantity: function(frm, cdt, cdn) {
        calculate_row_amount(frm, cdt, cdn);
    },

    // Triggered when rate is changed manually
    rate: function(frm, cdt, cdn) {
        calculate_row_amount(frm, cdt, cdn);
    }
});

// Helper function: Fetch the buying rate of a part
function fetch_part_price(frm, cdt, cdn) {
    let part_row = locals[cdt][cdn];

    if (!part_row.part) return;

    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Item Price",
            fieldname: "price_list_rate",
            filters: {
                item_code: part_row.part,
                buying: 1  // Only use buying price for maintenance parts
            }
        },
        callback: function(response) {
            const rate_value = response.message ? response.message.price_list_rate : 0;
            frappe.model.set_value(cdt, cdn, "rate", rate_value);

            // Recalculate row amount after fetching rate
            calculate_row_amount(frm, cdt, cdn);
        }
    });
}
function toggle_notes(frm) {
    frm.set_df_property('notes', 'hidden', frm.doc.status === "Scheduled");
}
function update_overdue(frm) {
    if (!frm.doc.maintenance_date || frm.doc.status === "Completed") return;

    let diff = frappe.datetime.get_diff(frappe.datetime.get_today(), frm.doc.maintenance_date);
    // If maintenance date is in the past - Overdue
    if (diff > 0) {
        if (frm.doc.status !== "Overdue") {
            frm.set_value("status", "Overdue");
        }
        
    }
    // If date is today or future - Reset to Draft
    else {
        if (frm.doc.status === "Overdue") {
            frm.set_value("status", "Draft");  //  
        }
    }
}

// Helper function: Calculate amount for a single part row
function calculate_row_amount(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    const quantity = row.quantity || 0;
    const rate = row.rate || 0;

    // Calculate total for this row
    frappe.model.set_value(cdt, cdn, "amount", quantity * rate);

    // Update the total cost in parent form
    update_total_part_cost(frm);
}

// Helper function: Update total maintenance cost
function update_total_part_cost(frm) {
    let total_cost = 0;

    // Sum up all row amounts in the Parts Used child table
    (frm.doc.parts_used || []).forEach(row => {
        total_cost += row.amount || 0;
    });

    // Set the calculated total in the parent form
    frm.set_value("cost", total_cost);
}
