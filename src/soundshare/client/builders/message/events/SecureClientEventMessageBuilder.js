var sys = require('sys');
var ClientEventMessageBuilder = require('flashsocket').ClientEventMessageBuilder;

SecureClientEventMessageBuilder = module.exports = function(target)
{
	ClientEventMessageBuilder.call(this, target);
};

SecureClientEventMessageBuilder.prototype = new ClientEventMessageBuilder();
SecureClientEventMessageBuilder.prototype.build = function(xtype, eventType, receiverRoute)
{
	if (!xtype || !eventType)
		return null;
	
	this.messageHeader.route.sender = this.target.route;
	this.messageHeader.route.receiver = receiverRoute ? receiverRoute : this.target.receiverRoute;
	
	this.messageHeader.data.token = this.target.token;
	
	this.messageHeader.data.action.xtype = xtype;
	this.messageHeader.data.action.data.type = eventType;
	
	this.message.setJSONHeader(this.messageHeader);
	
	return this.message;
};

ClientEventMessageBuilder.prototype.buildDispatchEvent = function()
{
	this.dispatchEventMessageHeader.route.sender = this.target.route;
	this.dispatchEventMessageHeader.data.token = this.target.token;
	
	this.dispatchEventMessage.clearBody();
	
	return this.dispatchEventMessage;
};