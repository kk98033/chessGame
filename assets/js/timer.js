/*
 *
 * TIMER LOGIC
 * on your move        => your timer count down
 * on oppoenent's move => oppoenent's timer count down
 * 
 * both timer count down count down on server side
 *
 */ 

// temp
// have multiple time options
// TODO: select time
var gameTime = { min: 10, sec: 0 } // 10 min

// initialize both timer
changeTime({ min: gameTime['min'], sec: gameTime['sec'], side: 'b' })
changeTime({ min: gameTime['min'], sec: gameTime['sec'], side: 'w' })

function stopCountDown() { 
	console.log('stop')
	clearTimeout(curTimeout)
}

function changeTime(timeData) {
	// timeData = { min: 10, sec: 0, room: roomID, state: 'msg', side: 'b or w' }
	let side = timeData['side']
	let curMin = formatTime(timeData['min'])
	let curSec = formatTime(timeData['sec'])
	console.log(curMin, curSec)
	if (side === getSide()) {
		$('#self_timer_min').text(curMin)
		$('#self_timer_sec').text(curSec)

	} else {
		$('#opponent_timer_min').text(curMin)
		$('#opponent_timer_sec').text(curSec)

	}
}

function formatTime(time) {
	if (time < 10) {
		return `0${time}`
	} else {
		return time
	}
}

function getSide() {
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

// function gameIsOver() {
// 	console.log('game over')

// 	var gameOverWindow = 
// 						`<div>
// 							<div class="loaderBG end"></div>
// 							<div class="endWindow">
// 								<div class="end_top">
// 									<div class="end_title">GAME OVER</div>
// 								</div>
// 								<div class="end_content">
// 									<div>REASON: <span class="reason">NULL</span></div>
// 									<a class="endLink" href="https://web.nttu.edu.tw/s32/">click here to return to the home page</a>
// 								</div>
// 							</div>
// 						</div>`

// 	// load game over window
// 	$('#gameover_window').append(gameOverWindow)
// }