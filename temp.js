let net = require("net");

let net_socket = new net.Socket();
let clint = net_socket.connect({
    port: 81,
    host: "192.168.178.49"
})
    .on("connect", () => {
        console.log("connected...")
    })
    .on("data", (data) => {
        console.log("data", data.toString())
    })
    .on("end", () => {
        console.log("END...");
    })


