define([], function() {
    
    // Import needed stuff
    var Q       = codebox.require("q");
    var _       = codebox.require("underscore");
    var rpc     = codebox.require("core/backends/rpc");
    var Command = codebox.require("models/command");
    
    function LaunchConfigurations () {
        this._confs = null;
        this._active_configuration = null;
        
        _.bindAll(this);
    }
    
    // RPC + CRUD
    LaunchConfigurations.prototype.getAll = function() {
        var d = Q.defer();
        var that = this;
        this._confs = null;
        
        rpc.execute("launchconf/all").then(function(data) {
            that._confs = data;
            d.resolve(that._confs);
        }, d.reject);
        
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
            if(data.shell_id != -1) {
                Command.run("terminal.open", data.shell_id);
            }
        });
    };
    
    // Utilities
    LaunchConfigurations.prototype.forAll = function(force_refresh, action) {
        var d = Q.defer();
        var that = this;
        
        // TODO: Clean this
        
        if(force_refresh) {
            this.getAll().then(function(confs) {
                var res = [];
                
                for(var conf in confs) {
                    if(that._active_configuration === null) {
                        that._active_configuration = conf;
                    }
                    res.push(action(conf, (conf == that._active_configuration), confs[conf]));
                }
                
                d.resolve(res);
            }, d.reject);
        }
        else {
            var res = [];
                
            for(var conf in that._confs) {
                if(that._active_configuration === null) {
                    that._active_configuration = conf;
                }
                res.push(action(conf, (conf == that._active_configuration), that._confs[conf]));
            }
            
            d.resolve(res);
        }
        
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
    };
    
    return LaunchConfigurations;
    
});