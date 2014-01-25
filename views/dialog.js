define([
    "text!templates/dialog.html",
    "less!stylesheets/dialog.less"
], function(templateFile) {
   
   var DialogView   = codebox.require("views/dialogs/base");
   var dialogs      = codebox.require("utils/dialogs");
   var loading      = codebox.require("utils/loading");
   var _            = codebox.require("underscore");
   var rpc          = codebox.require("core/backends/rpc");
   
   var ConfigurationDialog = DialogView.extend({
        className: "addon-launchconf-dialog modal fade",
        templateLoader: "text",
        template: templateFile,
        events: _.extend({}, DialogView.prototype.events,{
            "click #launchconf-add"     : "createConfiguration",
            "click #launchconf-del"     : "removeConfiguration",
            "click #launchconf-save"    : "saveConfiguration",
            "change #launchconf-select" : "loadConfiguration",
            "focus #launchconf-select"  : "onFocusSelect"
        }),
        defaults: _.extend({}, DialogView.prototype.defaults, {
           keyboardEnter: false 
        }),
        
        /**
         * Helper to render the template and select the appropriate configuration.
         */
        _renderAndSelect: function(conf_name) {
            var that = this;
            
            that.render().then(function(ok) {
                if(!conf_name || conf_name === null) {
                    that.$("#launchconf-select").change();
                }
                else {
                    that.$("#launchconf-select").val(conf_name).change();
                }
            });
        },
        
        /**
         * Save the current configuration in the manager cache.
         */
        _saveCurrentConfigurationInCache: function() {
            var conf_name = this.$("#launchconf-select option:selected").val();
            var conf_cmds = this.$("#launchconf-commands").val().split('\n');
            
            if(conf_name.length === 0) {
                return;
            }
            
            this.manager.setCommands(conf_name, conf_cmds);
        },
        
        /**
         *  Upon initialization, load all configuration names. 
         */
        initialize: function(options) {
            var that = this;
            ConfigurationDialog.__super__.initialize.apply(this, arguments);

            this.previous_conf_name = null;
            this.manager = options.manager;

            this.manager.getAll().then(function(data) {
                that._renderAndSelect();
            });

            return this;
        },
        
        /**
         *  Needed to pass variables to the template context. 
         */
        templateContext: function() {
            return {
                confs: this.manager.getCache()
            };
        },
        
        /**
         * Refuses to render this dialog if the confs is not defined
         * (ie. when still not loaded via RPC).
         */
        render: function() {
            if (!this.manager.getCache()) return this;
            return ConfigurationDialog.__super__.render.apply(this, arguments);
        },
        
        /**
         * Create a new configuration.
         */
        createConfiguration: function(e) {
            if (e) e.preventDefault();
            
            var that = this;
            var old_conf = this.previous_conf_name;
            
            this._saveCurrentConfigurationInCache();
            
            this.previous_conf_name = null;
            
            dialogs.prompt( "Configuration name", 
                            "Enter the name of the new launch configuration.")
                    .then(function(name) {
                        that.manager.create(name);
                        that._renderAndSelect(name);
                    }, function(err) {
                        that._renderAndSelect(old_conf);
                    });
        },
        
        /**
         * Load a configuration (when the selection has changed).
         */
        loadConfiguration: function(e) {
            
            // Save the previous value in the cache
            if(this.previous_conf_name !== null
                && this.previous_conf_name.length > 0) {
                this.manager.setCommands(
                    this.previous_conf_name,
                    this.$("#launchconf-commands").val().split('\n')
                );
            }
            
            // And load commands for the new value
            var conf_name = e.currentTarget.value;
            
            if(conf_name.length === 0) {
                return;
            }
            
            this.previous_conf_name = conf_name;
            this.$("#launchconf-commands").val(this.manager.getCommands(conf_name).join('\n'));

        },
        
        /**
         * Store the current configuration name.
         */
        onFocusSelect: function(e) {
            this.previous_conf_name = this.$("#launchconf-select").val();
        },
        
        /**
         * Save the configuration.
         */
        saveConfiguration: function(e) {
            if (e) e.preventDefault();
            
            var that = this;
            
            // Save the current configuration
            this._saveCurrentConfigurationInCache();
            
            // And this one will save all the cache file to the server
            loading.show(this.manager.save(), "Saving configuration").fin(function() {
                that.close();
            });
        },
        
        /**
         * Remove an existing configuration.
         */
        removeConfiguration: function(e) {
            if (e) e.preventDefault();
            
            var that = this;
            var conf_name = this.$("#launchconf-select option:selected").val();
            
            if(conf_name.length === 0) {
                return;
            }
            
            this._saveCurrentConfigurationInCache();
            
            this.previous_conf_name = null;
            
            dialogs.confirm("Remove configuration", "Do you really want to delete " + _.escape(conf_name) + "?")
            .then(function(ok) {
                that.manager.delete(conf_name);
                that._renderAndSelect();
            }, function(err) {
                // User cancelled
                that._renderAndSelect(conf_name);
            });
        }
   });
   
   return ConfigurationDialog;
    
});