var sys = require('sys');
var events = require('events');

PluginRequest = module.exports = function()
{
	this.clear();
};

PluginRequest.prototype = new events.EventEmitter();
PluginRequest.prototype.process = function() {
	var _self = this;
	
	this.plugin = this.pluginBuilder.build(this.pluginContainer);
	
	this.plugin.on("ready", function(data) { 
		_self.plugin.removeAllListeners();
		_self.emit("ready", data); 
	});
	this.plugin.on("error", function(error, code) { 
		_self.plugin.removeAllListeners();
		_self.emit("error", error, code); 
	});
	
	this.plugin.prepare(this.data, this.client);
};

PluginRequest.prototype.clear = function() {
	this._id = null;
	this.type = null;
	this.data = null;
	this.client = null;
	
	this.plugin = null;
	this.pluginBuilder = null;
	this.pluginContainer = null;
};