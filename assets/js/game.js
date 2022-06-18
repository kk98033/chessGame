import { Chess } from '../chess.js/chess.js';

// var config = {
//     orientation: 'white',
//     position: 'start',
//     draggable: true,
//     sparePieces: false,
// }

// var board = Chessboard('board', config)

// SOCKET
const roomID = getRoomID() // get room id
var curMove = { 'from': '', 'to': '' } // form source to target
var loseConnection = false

var draggable = true;

var gameIsOver = false

var board = null
var $board = $('#board')
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')

var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'

var squareClass = 'square-55d63'
var squareToHighlight = null
var colorToHighlight = null

var promotionChoice = 'q'

const BLACK_PROMOTE_POSITIONS = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1']
const WHITE_PROMOTE_POSITIONS = ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8']
var whitePreomotePieces = 'q'
var blackPreomotePieces = 'q'

// decide whitch side (RANDOM)
const side = decideSide() // the side whick player on
console.log(side)

var whiteKingPos = 'e1'
var blackKingPos = 'e8'

function removeGreySquares() {
    $('#board .square-55d63').css('background', '')
}

function greySquare(square) {
    var $square = $('#board .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

function onDragStart(source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

   // only pick up pieces for the side to move
    if (side === 'w') {
        if (game.turn() === 'b' || piece.search(/^b/) !== -1) {
            return false
        }
    } else if (side === 'b') {
        if (game.turn === 'w' || piece.search(/^w/) !== -1) {
            return false
        }
    }

    // OLD
    // only pick up pieces for the side to move
    // if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
    //     (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    //     return false
    // }
}

function onDrop(source, target) {
    removeGreySquares()

    var curMoveTurn = game.turn()

    // to see if pwan can promote
    if (canPromote(target, game.turn())) {
        promotionChoice = whitePreomotePieces
    } else {
        promotionChoice = 'q'
    }

    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: promotionChoice
    })

    // illegal move
    if (move === null) return 'snapback'

    // update king's positon on every move
    updateKingPosition(target)

    if (move.color === 'w') {
        // clear previous hilight
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.' + squareClass).removeClass('highlight-black')
        
        $board.find('.square-' + move.from).addClass('highlight-white')
        squareToHighlight = move.to
        colorToHighlight = 'white'
    } else {
        // clear previous hilight
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.' + squareClass).removeClass('highlight-black')

        $board.find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'
    }    

    // emit your move to server
    // BUG: connection error
    // loseConnection = true
    if (curMoveTurn === side) {
        console.log('emit data')
        curMove = { 'from': source, 'to': target }
        socket.emit('chess move', { 'room': roomID, 'data': { 'from': source, 'to': target } });
    
        if (loseConnection) {
            console.log('CONNECITON ERROR SEND AGAIN')
            loseConnection = false
            emitAgain()
        }
    }

    updateStatus()
}

function emitAgain() {
    socket.emit('chess move', { 'room': roomID, 'data': curMove });
}


function updateKingPosition(target) {
    // remove check hightlight by every move
    $board.find('.square-' + whiteKingPos).removeClass('checked')
    $board.find('.square-' + blackKingPos).removeClass('checked')

    if (game.get(target) && game.get(target)['type'] == 'k') {
        if (game.turn() == 'w') {
            blackKingPos = target
        } else {
            whiteKingPos = target
        }
    }
    console.log(game.turn(), 'white', whiteKingPos, 'black', blackKingPos)

    // console.log(whiteKingPos, blackKingPos)
}

function onMouseoverSquare(square, piece) {
    // if this is not your turn -> dont show color
    if (game.turn() != side) return

    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    })

    // exit if there are no moves available for this square
    if (moves.length === 0) return

    // highlight the square they moused over
    greySquare(square)

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
    }
}

function onMouseoutSquare(square, piece) {
    removeGreySquares()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen())

    // stop your timer and start your opponent's timer
    console.log('start countdown opponent timer')

    // console.log('side', decideSide()==='b'?'w':'b')
    let data = { room: getRoomID(), side: decideSide()==='b'?'w':'b', state: gameIsOver ? 'game over': 'game is on' }
    socket.emit('stop countdown', decideSide())

    if (!gameIsOver) {
        console.log('game is on')
        socket.emit('start countdown', data)

    } else {
        console.log('gamie is not over')
    }
    
    // highlight 
    highlightEndColor()
}

function updateStatus() {
    // TODO: gameover msg
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        gameIsOver = true

        socket.emit('stop countdown', decideSide())

        status = 'Game over, ' + moveColor + ' is in checkmate.'
        highlightCheckedPiece()
        if (decideSide() === game.turn()) {
            showModal(moveColor === 'White' ? 'Black' : 'White' + '(Opponent)', status)
        } else {
            showModal(moveColor === 'White' ? 'Black' : 'White' + '(YOU)', status)
            
        }
    }

    // draw?
    else if (game.in_draw()) {
        gameIsOver = true

        socket.emit('stop countdown', decideSide())

        status = 'Game over, drawn position'
        showModal('', status)
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
            highlightCheckedPiece()
        }
    }

    $status.html(status)
    $fen.html(game.fen())
    $pgn.html(game.pgn())
}

function highlightCheckedPiece() {
    console.log(whiteKingPos, blackKingPos)
    if (game.turn() === 'b') {
        $board.find('.square-' + blackKingPos).addClass('checked')
    } else {
        $board.find('.square-' + whiteKingPos).addClass('checked')
    }
    console.log(game.turn() + ' to move and his king is checked')
}

function highlightEndColor() {
    $board.find('.square-' + squareToHighlight).addClass('highlight-' + colorToHighlight)
}

function canPromote(endPos, turn) {
    if (turn === 'w') {
        return WHITE_PROMOTE_POSITIONS.includes(endPos)
    } else {
        return BLACK_PROMOTE_POSITIONS.includes(endPos)
    }
}

function isMobile() {
    console.log($(window).width())
    if ($(window).width() <= 600) {
        return true

    } else {
        return false
    }
}

function decideSide() {
    // Get the value of "side" in url
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    var value = params.side

    if (value === 'b') {
        return 'b'

    } else {
        return 'w'
    }
}

// opponet's move ("from": "source", "to": "target")
function oppoentsMove(move) {
    // console.log(move)
    var source = move['from']
    var target = move['to']    

    // need source, target(from, to)
    // move oppoent's pieces(on the chess.js)
    onDrop(source, target)

    // move oppoents pieces(on the board)
    board.position(game.fen()) // this is better
    // board.move(source + '-' + target)
    
    squareToHighlight = target;
    highlightEndColor()
    
    updateStatus()

    // count down your timer and stop opponent's timer
    // console.log('start your timer')

    // console.log(gameIsOver)
    let data = { room: getRoomID(), side: decideSide(), state: gameIsOver ? 'game over': 'game is on' }
    socket.emit('stop countdown', decideSide())

    if (!gameIsOver) {
        // socket.emit('start countdown', data)
    } else {
        socket.emit('stop countdown', decideSide())
    }
}

export function selectPromotePiece(piece) {
    whitePreomotePieces = piece
    $('.promote-container').find('.selected').removeClass('selected')
    $('.promote-container').find('.' + piece).addClass('selected')
    console.log(piece)
}

/*
 * CREATE BOARD
 */
// flip the board if you are black
var orientation = 'white'
if (side === 'b') {
    var orientation = 'black'
    console.log(orientation)
}

// devise check
console.log('devise check')
if (isMobile()) {
    console.log('mobile mode')
    var config = {
        draggable: false,
        position: 'start',
        orientation: orientation,
        onSnapEnd: onSnapEnd,
    }
    
} else {
    var config = {
        draggable: true,
        position: 'start',
        orientation: orientation,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        onSnapEnd: onSnapEnd,
    }
}

// create board
board = Chessboard('board', config)

// temp btn
$('#startBtn').on('click', board.start, game.reset())
$('#startBtn').click(function() {
    game.reset()
    board.start;
    console.log('reset');
});

/*
 *  CONNECTION FUNCTIONS
 */
function playerJoined() {
    // this function is only for the game starter

    // wait for opponet to join
    $('#loaderBG').text("A player has joined the game")

    // random choose a side
    const randomChoosedSide = pickA_Side() 

    // tell the server that you are ready
    // and tell oppoent his side
    if (randomChoosedSide === 'w') {
        socket.emit('ready', { 'room': roomID, 'side': 'b' })
    } else {
        socket.emit('ready', { 'room': roomID, 'side': 'w' })
    }

    startTheGame(randomChoosedSide)
}

function disableLoader() {
    // disable loader
    $('#loaderBG').css('visibility', 'hidden')
    $('#loader').css('visibility', 'hidden')
}

function enableLoader() {
    // disable loader
    $('#loaderBG').css('visibility', 'visible')
    $('#loader').css('visibility', 'visible')
}

function pickA_Side() {
    var result = '';
    var characters = 'bw';
    var charactersLength = characters.length;
    var length = 1;

    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * 
        charactersLength));
    }
    return result;
}

function startTheGame(mySide) {
    var url = 'https://frozen-citadel-51008.herokuapp.com/'
    // var url = window.location.href
    // window.location.href = url + '?status="start"'; // reload page
    if (window.location.href.includes('localhost')) {
        // for local test
        window.location.href = window.location.href + '?status=start&side=' + mySide + '&room=' + roomID + ''; // reload page

    } else {
        window.location.href = url + '?status=start&side=' + mySide + '&room=' + roomID + ''; // reload page
    }

}

function gameIsOn() {
    // Get the value of "side" in url
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    var value = params.status

    if (value === 'start') {
        return true

    } else {
        return false
    }
}

function getRoomID() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    var value = params.room
    return value
}


function endTheGame() {
    // TODO: end the game when one of the players leave
}

/*
 *  MOBILE CONTROL
 *  MOVE PIECE ON CLICK INSTEAD DRAG
 *  WARNING: only work when "draggable" is FALSE!!!
 */ 
$(document).ready(function () {
    var prevSquare = ''

    // set a click listenr on every square
    $('.square-55d63').click(function() {
        removeGreySquares()
        
        let piece = $(this).find('img').attr("data-piece") // get piece(find image tag of self)
        let square = $(this).attr("data-square") // get the selected square
        
        if (prevSquare) {
            // get the selected square
            let target = $(this).attr("data-square") 

            // if the direciton is not self position
            if (target !== prevSquare) {
                /*
                 *  MOVE PIECES
                 */
                // to see if this move is legal
                if (onDrop(prevSquare, target) != 'snapback') {
                    board.move(prevSquare + '-' + target)

                    // highlight squares
                    squareToHighlight = target;
                    highlightEndColor()

                    updateStatus()

                    // stop your timer and start your opponent's timer
                    console.log('start countdown opponent timer')

                    let data = { room: getRoomID(), side: decideSide()==='b'?'w':'b', state: gameIsOver ? 'game over': 'game is on' }
                    socket.emit('start countdown', data)

                    stopCountDown()
                    countDown('opponent_timer')
                }
                
                // reset prevSquare
                prevSquare = ''
            }

        } else {
            // if select a piece
            if (piece) {
                // then store that piece position
                prevSquare = square
                onMouseoverSquare(square)

            } else {
                // reset
                prevSquare = ''
            }
        }

    });


    $("#reconnect").click(function() {
        // socket.emit('room', roomID)
        console.log('reconnect')
    });
});

function isVailidRoom() {
    if (window.location.href.includes('localhost')) {
        return true // for local test
    } else if (getRoomID()) {
        return true
    } else {
        return false
    }
}

/*
* CHESS GAME
*/ 

/*
* ADDITIONAL FUNCTION 
*/ 
// TODO: emoji

// BUG: mobile control problem

// create a room
socket.emit('room', roomID)

// tell the other player that your have connected
socket.emit('onConnect', roomID)

/*
 *  MAIN FUNCTION TO START THE GAME
 */ 
// to see if every is ready
if (gameIsOn() && isVailidRoom()) {
    // listen to oppoent's move
    socket.on('chess move', function(move) {
        // console.log('opponents move: ', move)   // debug      
        oppoentsMove(move)
    });

    // to ensure your move was send to server
    // when you emit a move server will return 'ok'
    socket.on('callback', function(data) {
        // console.log(data);
        if (data === 'ok') {
            loseConnection = false
        } else {
            console.log('connection lose')
            loseConnection = true
        }
    });    

    socket.on('oppoent left', function(msg) {
        console.log(msg)
        // enableLoader()
    });

    socket.on('oppoent regoin', function(msg) {
        console.log(msg)
        // disableLoader()
    });

    /*
     * CONNECTION ERRORS 
    */
    socket.on("error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });

    socket.on("connect_timeout", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });
    
    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });

    socket.on('opponent disconnect', (data) => {
        console.log(data['errMsg'])
        if (data['state'] === 0) {
            // TODO: waiting opponent to reconnect
        } else if (data['state'] === 1) {
            // TODO: retry connection
        }
    });

    // reconnect after disconnect
    socket.on('disconnect', (reason) => {
        console.log('disconnected :( REASON: ' + reason)
        // socket.emit('room', roomID) // reconnect
    });

    socket.on('count down', (data) => {
        // data = { min: 10, sec: 0, room: roomID, state: 'msg', side: 'b or w' }
        // TODO: pass a reason
        console.log(data)
        if (data['state'] === 'countdown') {
            changeTime(data)

        } else {
            console.log('game over')
            gameIsOver = true
            // game over by time out
            socket.emit('stop countdown', '')

            showModal(game.turn() === 'w' ? 'Black' : 'White', 'Game over, ' + game.turn() === 'w' ? 'white' : 'black' + ' is running out of time')
        }
    });

    disableLoader()

    // game start
    updateStatus()
} else if (isVailidRoom()) {
    // listen if has a player join
    socket.on('player join', function(msg) {
        playerJoined()
    });
    
    // listen if the other is ready
    socket.on('ready', function(mySide) {
        disableLoader()
        startTheGame(mySide)
    });

}