var sys = require('sys');

var flashsocket = require('flashsocket');
var ClientEventDispatcher = flashsocket.ClientEventDispatcher;

var SecureClientEventMessageBuilder = require('../../builders/message/events/SecureClientEventMessageBuilder');
var ServersManagerMessageBuilder = require('../../builders/message/servers/ServersManagerMessageBuilder');

ServersManager = module.exports = function()
{
	ClientEventDispatcher.call(this, null, new SecureClientEventMessageBuilder(this));
	
	this.token = null;
	this.messageBuilder = new ServersManagerMessageBuilder(this);
};

ServersManager.prototype = new ClientEventDispatcher();
ServersManager.prototype.serverUp = function(token, plugins)
{
	sys.log("-ServersManager[serverUp]- " + token, plugins);
	
	var message = this.messageBuilder.buildServerUpMessage(token, plugins);
	this.send(message);
};