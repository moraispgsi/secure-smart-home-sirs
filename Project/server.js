let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let vantage = require('vantage')();

//DRIVERS
let DriverManager = require('./server-drivers/driver-manager');
let DoorDriver = require('./server-drivers/door-driver');

let driverManager = new DriverManager(vantage);
driverManager.addDriver(new DoorDriver());
//////////

app.get('/', function(req, res){
  res.send("Page with status of the devices here");
});

let logs = "";
function log(message) {
    logs += "Log: " + message + "\n";
    console.log(message);
}

io.on('connection', function(socket){

    driverManager.expectAuth(socket, (driver) => {
        if(driver === null) {
            log('Device was not authorized.');
            socket.disconnect();
            return;
        }
        log('Device authorized');
    });

    socket.on('disconnect', function(){
        log('User disconnected');
    });

    log('User connected');
});

http.listen(3000, function(){
    log('Listening in port 3000');
    //todo: SSH on vantage(it is possible, check the github)
    vantage
        .delimiter("smart-home~$")
        .listen(3001);

    vantage
        .command(`show logs`)
        .description("Shows the server logs")
        .action(function (args, cb) {
            this.log(logs);
            cb();
        });
});