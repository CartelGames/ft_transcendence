const wsEndpoint = 'ws://' + window.location.host + '/ws/queue/';
const websocket = new WebSocket(wsEndpoint);

websocket.onopen = () => {
    console.log('WebSocket Queue connected');
};

websocket.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log('Event Queue Socket : ' + data.type);
    if (data.type === 'game_start') {
        var HideDiv = document.getElementById('LeaveQueue');
        HideDiv.style.display = 'none';
        import('/static/js/game.js?ver=${Math.random()}')
        .then(module => {
            const { reloadGame } = module;
            reloadGame(data.game_id, data.p1_pseudo, data.p2_pseudo);
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors du chargement de game.js : ', error);
        });
        console.log(data.message);
        $('#Msg').text('Message: ' + data.message);
    }
    else if (data.type === 'msg') {
        $('#Msg').text('Message: ' + data.message);
    }
};

function LaunchQueue() {
    websocket.send(
        JSON.stringify({
            action: 'join_queue',
        })
    );
    var HideDiv = document.getElementById('ChooseGame');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('LeaveQueue');
    showDiv.style.display = 'block';
}

function LeaveQueue() {
    websocket.send(
        JSON.stringify({
            action: 'leave_queue',
        })
    );
    var HideDiv = document.getElementById('LeaveQueue');
    $('#Msg').text('');
    HideDiv.style.display = 'none';
    var showDiv = document.getElementById('ChooseGame');
    showDiv.style.display = 'block';
}

function getTournamentList() {
    $.ajax({
        type: 'GET',
        url: '/getTournamentList/',
        headers: { 'X-CSRFToken': token },
        success: function (data) {
            if (data.success) {
                var TournamentContainer = $('#TournamentsList');
                TournamentContainer.empty();
                var friendsList = data.tourList;
                console.log(friendsList);
                friendsList.forEach(function (list) {
                    console.log(list.name);
                    var friendDiv =$('<li><span style="font-weight: bold; font-size: 24px">' + list.name + '</span> (' + list.players + ' players) - <i>created by ' + list.creator + '</i></li>');
                    var clickableRow = $('<div class="clickable-row" data-pseudo="' + list.name + '">Join</div>');
                    clickableRow.click(function () {

                    });
                    var BlockRow = $('<div class="clickable-row" title="Block this list" data-pseudo="' + list.pseudo + '"><span class="close-icon">' + list.creator + '</span></div>');
                    BlockRow.click(function (event) {
                        //Join Tournament
                    });
                    friendDiv.append(clickableRow[0]);
                    friendDiv.append(BlockRow[0]);
                    TournamentContainer.append(friendDiv);
                });
            }
            token = data.csrf_token;
        },
        error: function (error) {
            console.log('Can\'t load tournament list.');
        }
    });
}

document.getElementById('JoinQueue').addEventListener('click', LaunchQueue);
document.getElementById('LeaveQueue').addEventListener('click', LeaveQueue);
document.getElementById('refreshTourList').addEventListener('click', getTournamentList);

