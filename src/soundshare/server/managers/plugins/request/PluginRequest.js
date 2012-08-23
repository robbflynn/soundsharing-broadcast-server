var sys = require('sys');
var events = require('events');

PluginRequest = module.exports = function()
{
	this.clear();
};

PluginRequest.prototype = new events.EventEmitter();
PluginRequest.prototype.process = function() {
	var _self = this;
	
	var plugin = this.pluginBuilder.build(this.pluginContainer);
	
	plugin.on("ready", function(data) { 
		plugin.removeAllListeners();
		_self.emit("ready", data); 
	});
	plugin.on("error", function(error, code) { 
		plugin.removeAllListeners();
		_self.emit("error", error, code); 
	});
	
	plugin.prepare(this.data, this.client);
};

PluginRequest.prototype.clear = function() {
	this._id = null;
	this.type = null;
	this.data = null;
	this.client = null;
	this.pluginBuilder = null;
	this.pluginContainer = null;
};