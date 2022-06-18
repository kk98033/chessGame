var url;

function showModal(winner, reason) {
    if (winner) {
        var content = 
                    `
                        <span class="text-success h2">${ winner }</span> WINS :D <br> 
                        <span class="text-info"> ${ reason } </span>
                    `
                    
    } else {
        // draw
        var content = 
                    `
                        <span class="text-info"> ${ reason } </span>
                    `

    }
    $('#modal-content').html(content)

    $('#game-over-modal').modal('show')

    // console.log($('#fen').text())
    // console.log($('#pgn').text())
   

    // direct to game page to save data
    let fen = $('#fen').text()
    let pgn = $('#pgn').text()

    let side = getUrlParameter('side') === 'b' ? 'Black' : 'White'
    
    // console.log(side, winner, winner + '(YOU)', side === winner + '(YOU)')

    /**
     * 
     * state:
     *  0 => lose
     *  1 => win
     *  2 => draw
     * 
     * */ 
    if (winner) {
        if (side + '(YOU)' === winner || side === winner) {
            var state = 1
            
        } else {
            var state = 0
        }
    } else {
        var state = 2
    }

    console.log('state', state)

    url = `https://web.nttu.edu.tw/s32/chess_game_state.html?fen=${ fen }&pgn=${ pgn }&state=${ state }`
}

$('#close-btn').on('click', function(){
    window.open(url, '_blank').focus();
});

$('#continue-btn').on('click', function(){
    window.open(url, '_blank').focus();
});

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
    return false;
};