var sys = require('sys');


var a = {
	aaa: "asdas",
	shit: null,
	bbb: undefined
};

sys.log(a.hasOwnProperty("aaa"));
sys.log(a.hasOwnProperty("shit"));
sys.log(a.hasOwnProperty("bbb"));
sys.log(a.hasOwnProperty("ccc"));