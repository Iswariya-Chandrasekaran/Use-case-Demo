// Purpose: Automate maintenance workflow, calculate part costs,
//          and handle completion by Technicians
frappe.ui.form.on("Machine Maintenance", {
    // Triggered when the form loads
    onload: function(frm) {
        // Auto-set the maintenance date for new records if not already set
        if (frm.is_new() && !frm.doc.maintenance_date) {
            frm.set_value('maintenance_date', frappe.datetime.get_today());
        }
    },

    // Triggered when the form is refreshed
    refresh: function(frm) {
        const user_is_technician = frappe.user_roles.includes("Technician");
        const maintenance_completed = frm.doc.workflow_state === "Completed";

        // Clear old custom buttons to avoid duplicates
        frm.clear_custom_buttons();

        // Show "Maintenance Completed" button only to Technicians
        // and only if maintenance is not yet completed and the document is saved
        if (user_is_technician && !maintenance_completed && frm.doc.docstatus === 0 && !frm.is_new() && frm.doc.status == "Scheduled") {
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

    // Triggered after the document is saved
    after_save: function(frm) {
        // Ensure completion_date is set if workflow was completed externally
        if (frm.doc.workflow_state === "Completed" && !frm.doc.completion_date) {
            frm.set_value("completion_date", frappe.datetime.nowdate());
            frm.save();
        }
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
