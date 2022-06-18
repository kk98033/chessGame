const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/chess.html');
});

// use assets and img
app.use('/assets', express.static('assets'))
app.use('/img', express.static('img'))

// app.use('/assets', express.static(path.join(__dirname, "assets")))
// app.use('/img', express.static(path.join(__dirname, "images")))

server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    // io.emit('chat message', "opponent connected");
    
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    var currentRoomId;
    socket.on('room', function(room) {
        socket.join(room);
        currentRoomId = room; // save current room id (NOT WORKING)
        saveRoomID(room); // save current room id
    });

    function saveRoomID(id) {
        currentRoomId = id;
    }
    
    socket.on('disconnect', (reason) => {
        console.log('user disconnected :( REASON: ' + reason + ' ROOM: ' + currentRoomId);

        /*
         * state: 0 => oppoenent disconnected
         *        1 => you are disconnected(need to reconnect)
         */ 
        if (currentRoomId) {
            socket.broadcast.to(currentRoomId).emit('opponent disconnect', { room: currentRoomId, errMsg: 'opponent disconnected', state: 0 }) // sending to oppoenent
            socket.to(currentRoomId).emit('opponent disconnect', { room: currentRoomId, errMsg: `disconnected due to: ${reason}`, state: 1 }) // sending to sender
        } else {
            console.log('Room not found ROOM: ', currentRoomId)
        }
    });
    
    socket.on('chat message', (data) => {
        let room = data['room']
        // sending to all clients except sender
        socket.broadcast.to(room).emit('chat message', data);
    });

    // FOR CHESS
    // tell the oppoent that you have joined
    socket.on('onConnect', (room) => {
        socket.to(room).emit('player join'); 
    });

    // tell the other player that you are ready
    socket.on('ready', (data) => {
        room = data['room'];
        side = data['side'];
        socket.to(room).emit('ready', side);
    });

    // get every move then emit to the other player
    // send the move to oppenet
    socket.on('chess move', (data) => {
        moveData = data['data'];
        room = data['room'];

        // DEBUG
        console.log('DEBUG: ', moveData)

        // socket.emit('callback', 'ok') // happens immediately!
        socket.broadcast.to(room).emit('chess move', moveData);
    });

    socket.on('error log', (data) => {
        console.log(data)
    });

    /*
     * TIMER
     * timeData = { min: 10, sec: 0, room: roomID, state: 'msg', side: 'b or w' }
     * data = { room: 'roomID', side: 'w or b' }
     */
    // TODO: choose timer
    var gameTime = { min: 10, sec: 0 } // 10min
    var blackTimer = Object.assign({}, gameTime)
    var whiteTimer = Object.assign({}, gameTime)
    var curTimeout = null

    var timers = []

    socket.on('start countdown', (data) => {
        if (data['state'] != 'game over') {
            timers.push(
                curTimeout = setTimeout(function() {
                    countDown()
                }, 1000)
            )
        }

        function countDown() {           
           let time = getTime(data['side'])

           let room = data['room']

           if (time['sec'] > 0) {
               time['sec'] -= 1
               
            } else if (time['sec'] == 0) {
                time['min'] -= 1
                time['sec'] = 59
            }
            
            timeData = { min: time['min'], sec: time['sec'], room: data['roomID'], state: 'countdown', side: data['side'] }
            // console.log(timeData)
            if (time['sec'] === 0 && time['min'] === 0) {
                // console.log('stop')
                clearInterval(curTimeout) // gameover
                
                timeData['state'] = `game over!, ${data['side']} have ran out of time`
                socket.broadcast.to(room).emit('count down', timeData);
                return // stop all
                
            } else {
                io.to(room).emit('count down', timeData);
            }
            
            if (data['state'] != 'game over') {
                timers.push(
                    curTimeout = setTimeout(function() {
                        countDown()
                    }, 1000)
                )
            }
        }
        
        // stop all timers
        socket.on('stop countdown', (side) => {
            // console.log('stop countdown all', side)
            clearTimeout(curTimeout)
            for (var i=0; i<timers.length; i++) {
                clearTimeout(timers[i]);
                clearInterval(timers[i]);
            }
        })
    });
    
    
    function getTime(side) {
        if (side === 'b') {
            return whiteTimer
        } else {
            return blackTimer
        }
    }

});
