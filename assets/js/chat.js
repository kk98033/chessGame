/*
 *
 * set a listener to listen to chat
 * update chat 
 * 
 * chat data structure: { msg: 'message', room: 'roomID', time: 'time' }
 * 
 */ 

$('#msgBtn').click(function(event) {
    event.preventDefault();
    let inputText = $('#input').val()
    console.log(inputText)
    if (inputText) {
        $('#input').val('')
        let chatData = { msg: inputText, room: getRoomID(), time: getCurTime() }
        update(chatData, 'self') // update right message

        // emit data to server
        socket.emit('chat message', chatData)
    }
});

function update(data, side) {
    // update chat when you send chat & receive chat
    if (data === 'opponent connected' || data === 'opponent disconnected :(') {
        var chatStr = `<div>` + data + `<div>`

    } else {
        if (side === 'self') {
            var chatStr = 
                            `<div class="msgContianer right">
                                <img class="miniAvatar" src="https://web.nttu.edu.tw/s32/check_mate.jpg" alt="">
                                <div class="userName">Name</div>
                                <div class="split">:</div>
                                <div class="msg">` + data['msg'] + `</div>
                                <div class="date">` + data['time'] + `</div>
                            </div>`
        } else {
            var chatStr =
                            `<div class="msgContianer left">
                                <img class="miniAvatar" src="https://web.nttu.edu.tw/s32/check_mate.jpg" alt="">
                                <div class="userName">Name</div>
                                <div class="split">:</div>
                                <div class="msg">` + data['msg'] + `</div>
                                <div class="date">` + data['time'] + `</div>
                            </div>`
        }
    }

    $('#mainChat').append(chatStr)

    scrollDown()
}

function scrollDown() {
    var element = document.getElementById('mainChat')
    element.scrollTop = element.scrollHeight
}

function getCurTime() {
    // TODO: might use http://momentjs.com/docs/
    var newDate = new Date();
    return newDate.getHours() + ':' + newDate.getMinutes() + ':' + newDate.getSeconds()
}

function getRoomID() {
    const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
    });
    var value = params.room
    return value
}

socket.on('chat message', (data) => {
    update(data, 'opponent') // update oppoenent's message
})