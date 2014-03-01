define([], function() {
    
    // Import needed stuff
    var Q               = codebox.require("q");
    var _               = codebox.require("underscore");
    var rpc             = codebox.require("core/backends/rpc");
    var Command         = codebox.require("models/command");
    var user            = codebox.require("core/user");
    var user_settings   = user.settings("jl_launch_configurations");
    
    function LaunchConfigurations () {
        this._confs = null;
        this._active_configuration = user_settings.get('active', null);
        
        _.bindAll(this);
    }
    
    // RPC + CRUD
    LaunchConfigurations.prototype.getAll = function(refresh) {
        var d = Q.defer();
        var that = this;
        
        refresh = typeof(refresh) === 'undefined' ? true : refresh;
        
        if(refresh === true) {
            
            this._confs = null;
            
            rpc.execute("launchconf/all").then(function(data) {
                that._confs = data;
                d.resolve(that._confs);
            }, d.reject);
            
        }
        else {
            
            d.resolve(this._confs);
            
        }
        
        return d.promise;
    };
    
    LaunchConfigurations.prototype.save = function() {
        var d = Q.defer();
        var that = this;
        
        rpc.execute("launchconf/all", { "data": that._confs }).then(function(data) {
            d.resolve();
        }, d.reject);
        
        return d.promise;
    };
    
    LaunchConfigurations.prototype.create = function(name) {
        if(!_.has(this._confs, name)) {
            this._confs[name] = [];
            return true;
        }
        
        return false;
    };
    
    LaunchConfigurations.prototype.delete = function(name) {
        if(_.has(this._confs, name)) {
            delete this._confs[name];
            return true;
        }
        
        return false;
    };
    
    // Launching
    LaunchConfigurations.prototype.launch = function() {
        rpc.execute("launchconf/launch", {
            'name': this._active_configuration
        }).then(function(data) {
            Command.run("terminal.open", data.shell_id);
        });
    };
    
    // Utilities
    LaunchConfigurations.prototype.forAll = function(force_refresh, action) {
        var d = Q.defer();
        var that = this;
        
        this.getAll(force_refresh).then(function(confs) {
            var res = [];
            
            console.log(confs);
            
            for(var conf in confs) {
                if(that._active_configuration === null) {
                    that.setActive(conf);
                }
                res.push(action(conf, (conf == that._active_configuration), confs[conf]));
            }
            
            d.resolve(res);
        }, d.reject);
        
        return d.promise;
    };
    
    // Getters & Setters
    LaunchConfigurations.prototype.getCache = function() {
        return this._confs;
    };
    
    LaunchConfigurations.prototype.getCommands = function(conf_name) {
        return this._confs[conf_name];
    };
    
    LaunchConfigurations.prototype.setCommands = function(conf_name, commands) {
        this._confs[conf_name] = commands;
    };
    
    LaunchConfigurations.prototype.getActive = function() {
        return this._active_configuration;
    };
    
    LaunchConfigurations.prototype.setActive = function(conf_name) {
        this._active_configuration = conf_name;
        user_settings.set('active', this._active_configuration);
        
        // I am using RPC to avoid the "Saving settings" screen
        rpc.execute("auth/settings", user.get('settings'));
    };
    
    return LaunchConfigurations;
    
});