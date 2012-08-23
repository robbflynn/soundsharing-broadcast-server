var sys = require('sys');

var a = {asd: "asdas", ss: 1};
var b = {asd: "asdas", ss: 1};
var c = a;

sys.log(a == b ? "YES" : "NO");
sys.log(a == c ? "YES" : "NO");