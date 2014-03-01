var Q = require('q');
var _ = require('underscore');
var fs = require('fs');

// @BUG Configuration does not appear correctly in the menu

function LaunchConfService(workspace, shells) {
    this.workspace = workspace;
    this.shells = shells;
    this.confs = {};
    
    this._FILENAME = "Makefile.cb"; // Name of the file to populate and read
    this._FILEPATH = this.workspace.root + "/" + this._FILENAME;
    
    _.bindAll(this);
}

LaunchConfService.prototype._parseMakefile = function(raw) {
    
    var lines = raw.split('\n');
    var current_line = null;
    var current_key = null;
    var confs = {};
    
    for(var i = 0; i < lines.length; i++) {
        
        current_line = lines[i];
        
        if(current_line.indexOf('\t') === 0) {
            confs[current_key].push(current_line.replace('\t', ''));
        }
        else if(current_line.indexOf(':') != -1) {
            current_key = current_line.replace(':', '');
            confs[current_key] = [];
        }
        
    }
    
    return confs;
    
};

LaunchConfService.prototype._stringifyMakefile = function(obj) {
    
    var content = '';
        
    for(var c in obj) {
        content += c + ':\n';
        for(var i = 0; i < obj[c].length; i++) {
            content += '\t' + obj[c][i] + '\n';
        }
        
        content += '\n';
    }
    
    return content;
    
};

LaunchConfService.prototype._read = function() {
    var d = Q.defer();
    var that = this;
    
    Q.nfcall(fs.readFile, this._FILEPATH, "utf-8")
    .then(function(content) {
        that.confs = that._parseMakefile(content);
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
    
    Q.nfcall(fs.writeFile, this._FILEPATH, this._stringifyMakefile(this.confs))
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
        shell_id = "launch:" + _.escape(args.name);
        
        return Q(that.shells.createShellCommand(shell_id, "make -f " + that._FILEPATH + " " + args.name));
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
