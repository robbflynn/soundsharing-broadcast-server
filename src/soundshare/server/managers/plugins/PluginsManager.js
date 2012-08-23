var sys = require('sys');

var flashsocket = require('flashsocket-js');
var ServerEventDispatcher = flashsocket.ServerEventDispatcher;

var PluginRequest = require('./request/PluginRequest');

PluginsManager = module.exports = function(plugins)
{
	ServerEventDispatcher.call(this);
	
	this.plugins = new Array();
	
	var plugin;
	var _self = this;
	
	if (plugins)
		for (var i = 0;i < plugins.length;i ++)
		{
			plugin = plugins[i];
			
			this.plugins[plugin._id] = {
				pluginBuilder: plugin.namespace ? require(plugin.namespace) : null,
				pluginData: plugin
			};
			//sys.log("22.PluginsManager: " + plugin.name + ":" + this.plugins[plugin._id].pluginBuilder.build);
		}
	
	this.addAction("PLUGIN_REQUEST", function(client, message) {
		_self.executePluginRequest(client, message);
	});
};

PluginsManager.prototype = new ServerEventDispatcher();
PluginsManager.prototype.executePluginRequest = function(client, message)
{
	var header = message.getJSONHeader();
	var sender = header.route.sender;
	
	var body = message.getJSONBody();
	
	sys.log("1.PluginsManager[executePluginRequest]: " + body._id + ":" + this.plugins[body._id]);
	
	if (this.plugins[body._id])
	{
		var _self = this;
		var request = new PluginRequest();
		var pluginContext = this.plugins[body._id];
		
		sys.log("2.PluginsManager[executePluginRequest]: ");
		
		request._id = body._id;
		request.type = body.type;
		request.data = body.data;
		request.client = client;
		request.pluginBuilder = pluginContext.pluginBuilder;
		request.pluginContainer = this;
		
		request.on("ready", function(data) {
			request.removeAllListeners();
			_self.dispatchSocketEvent({
				event: {
					type: "PLUGIN_REQUEST_COMPLETE",
					data: data
				},
				receiver: sender
			});
		});
		request.on("error", function(error, code) {
			request.removeAllListeners();
			_self.dispatchSocketEvent({
				event: {
					type: "PLUGIN_REQUEST_ERROR",
					data: {
						error: error,
						code: code
					}
				},
				receiver: receiver
			});
		});
		
		request.process();
	}
};