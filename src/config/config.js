module.exports = {
	server: {
		url: "192.168.1.161:9000",
		address: "192.168.1.161"
	},
	managers: [
		{
			address: "192.168.1.161",
	    	port: 6001,
			serverId: "EAF120AF-3BEF-4456-9573-ECB50F1C0DC7",
			secureId: "-SECURE_ID-"
		}
	],
    manager: {
    	address: "192.168.1.161",
    	port: 6001
    },
    mongodb: {
    	address: "localhost",
    	port: 27017,
    	dbname: "soundsharedb"
    },
    express: {
        address: "0.0.0.0",
        port: 8001
    },
    socket: {
        address: "0.0.0.0",
        port: 9000
    }
};