var Q = require('q');
var _ = require('underscore');
var fs = require('fs');

function LaunchConfService(workspace, shells) {
    this.workspace = workspace;
    this.shells = shells;
    this.confs = {};
    
    this._FILENAME = ".codebox-configurations.json"; // Name of the file to populate and read
    this._FILEPATH = this.workspace.root + "/" + this._FILENAME;
    
    _.bindAll(this);
}

LaunchConfService.prototype._read = function() {
    var d = Q.defer();
    var that = this;
    
    Q.nfcall(fs.readFile, this._FILEPATH, "utf-8")
    .then(function(content) {
        that.confs = JSON.parse(content);
        d.resolve(that.confs);
    }, function(err) {
        if(err.code == "ENOENT") {
            that._write().then(d.resolve, d.reject);
        }
        else {
            d.reject(err);
        }
    });
    
    return d.promise;
};

LaunchConfService.prototype._write = function() {
    var d = Q.defer();
    var that = this;
    
    Q.nfcall(fs.writeFile, this._FILEPATH, JSON.stringify(this.confs, undefined, 4))
    .then(function(data) {
        d.resolve(that.confs);
    }, d.reject);
    
    return d.promise;
};

LaunchConfService.prototype.all = function(args) {
    var that = this;
    
    if(!args.data) {
        return this._read().then(Q, Q.reject);
    }
    else {
        return this._read().then(function(conf) {
            that.confs = args.data;
            return that._write();
        }, Q.reject);
    }
};

LaunchConfService.prototype.launch = function(args) {
    var that = this;
    var shell_id = -1;
    
    return this._read().then(function(ok) {
        if(!args.name || !_.has(that.confs, args.name)) throw new Error("Invalid arguments");
        var cmds = that.confs[args.name];
        shell_id = "launch:" + _.escape(args.name);
        
        return that.shells.createShellCommand(shell_id, cmds.join(' && '));
    }).then(function(shell) {
        return  {
            'shell_id': shell_id
        };
    });
};

function setup(options, imports, register) {
    var rpc = imports.rpc;
    var shells = imports.shells;
    var workspace = imports.workspace;
    
    var service = new LaunchConfService(workspace, shells);
    
    rpc.register('/launchconf', service);
    
    register(null, {});
}

module.exports = setup;
