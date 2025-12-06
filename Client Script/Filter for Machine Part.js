frappe.ui.form.on("Machine Maintenance", {
    refresh(frm) {

        // Filter PARTS USED > part (child table)
        frm.set_query("part", "parts_used", function() {
            return {
                filters: {
                    item_group: ["in", [
                        "Sub Assemblies",
                        "Services",
                        "Raw Material",
                        "Consumable"
                    ]]
                }
            };
        });

        // Filter MACHINE NAME (main doctype field)
        frm.set_query("machine_name", function() {
            return {
                filters: {
                    item_group: ["not in", [
                        "Sub Assemblies",
                        "Services",
                        "Raw Material",
                        "Consumable"
                    ]]
                }
            };
        });

    }
});
