define([
        "views/dialog", 
        "manager.js"
    ], function(ConfigurationDialog, LaunchConfigurations) {
        
    var menu = codebox.require("core/commands/menu");
    var dialogs = codebox.require("utils/dialogs");
    var Command = codebox.require("models/command");

    var manager = new LaunchConfigurations();

    var conf_menu = Command.register("jl.launch.configurations.set", {
        title: "Set active configuration",
        type: "menu",
        offline: false
    });
    
    manager.updateConfigurationsMenu = function(force_refresh) {
        manager.forAll(force_refresh, function(name, is_active, cmds) {
            return  {
                        title: name,
                        flags: (is_active ? "active" : ""),
                        action: function() {
                            manager.setActive(this.attributes.title);
                            manager.updateConfigurationsMenu(false);
                        }
                    };
        }).then(function(data) {
            conf_menu.menu.reset(data);
        });
    };
    
    menu.register("jl.launch.configurations.menu", {
        title: "Launch"
    }).menuSection([
        {
            title: "Manage configurations",
            action: function() {
                dialogs.open(ConfigurationDialog, { "manager": manager });
            }
        },
        {
            title: "Refresh configurations",
            action: function() {
                manager.updateConfigurationsMenu(true);
            }
        },
        conf_menu
    ]).menuSection([
        {
            title: "Launch",
            action: function() {
                manager.launch();
            }
        }
    ]);
    
    manager.updateConfigurationsMenu(true);
});
